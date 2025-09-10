import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import tokenStore from '../services/tokenStore.js';
import refreshManager from '../services/refreshManager.js';

dotenv.config();
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/api/calendar/oauth/callback`
);

// Helper: get token from token store (and refresh if needed)
async function getGoogleTokenForUser(req) {
  // If a token is provided via headers/body for testing, prefer it
  const direct = req.headers['x-google-access-token'] || req.body?.googleAccessToken || req.query?.googleAccessToken;
  if (direct) return direct;
  // Try tokenStore using the Descope-authenticated user id
  const userId = req.user?.id;
  if (!userId) return null;
  const token = await refreshManager.refreshGoogleTokenIfNeeded(userId);
  return token?.accessToken || null;
}

// GET /events - list upcoming events
router.get('/events', async (req, res) => {
  try {
  const token = await getGoogleTokenForUser(req);
    if (!token) {
      return res.status(401).json({
        error: 'Google Calendar not connected',
        details:
          'No Google access token found. Ensure you completed the Google OAuth flow (Descope) or provide an access token via X-Google-Access-Token header for testing.'
      });
    }

  oauth2Client.setCredentials({ access_token: token });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return res.json({ events: response.data.items || [] });
  } catch (err) {
    console.error('Google Calendar events error:', err?.message || err);
    const payload = err?.response?.data || {};
    // Map authentication errors to 401 so frontend can prompt re-auth
    if (payload?.error?.code === 401 || (payload?.error && payload.error.status === 'UNAUTHENTICATED')) {
      return res.status(401).json({ error: 'Google authentication failed', details: payload });
    }
    const details = payload || err?.message || 'Unknown error when calling Google Calendar API';
    return res.status(500).json({ error: 'Failed to fetch calendar events', details });
  }
});

// POST /events - create event
router.post('/events', async (req, res) => {
  try {
  const token = await getGoogleTokenForUser(req);
    if (!token) {
      return res.status(401).json({ error: 'Google Calendar not connected', details: 'No Google access token found.' });
    }

    const { summary, start, end, location } = req.body;
    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Missing required event fields: summary, start, end' });
    }

  oauth2Client.setCredentials({ access_token: token });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        location,
        start,
        end
      }
    });

    return res.json({ event: response.data });
  } catch (err) {
    console.error('Google Calendar create event error:', err?.message || err);
    const payload = err?.response?.data || {};
    if (payload?.error?.code === 401 || (payload?.error && payload.error.status === 'UNAUTHENTICATED')) {
      return res.status(401).json({ error: 'Google authentication failed', details: payload });
    }
    const details = payload || err?.message || 'Unknown error when creating Google Calendar event';
    return res.status(500).json({ error: 'Failed to create calendar event', details });
  }
});

// GET /status - integration status (uses token store metadata)
router.get('/status', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ connected: false });
  const meta = await tokenStore.getMetadata(userId);
  const isConnected = !!meta?.google?.has;
  res.json({ connected: isConnected, user: { id: req.user?.id, email: req.user?.email, name: req.user?.name }, meta });
});

// Optional: endpoint to be called by OAuth callback flows to persist tokens
router.post('/persist-token', async (req, res) => {
  const { provider, accessToken, refreshToken, expiresAt, scope, userId: bodyUserId } = req.body || {};
  // Allow using authenticated user id (req.user) when available
  const userId = req.user?.id || bodyUserId;
  if (!provider || !userId || !accessToken) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await tokenStore.saveToken(userId, provider, { accessToken, refreshToken, expiresAt, scope });
    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to persist token via endpoint:', e?.message || e);
    return res.status(500).json({ error: 'Failed to persist token' });
  }
});

export default router;


