import express from 'express';
import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import tokenStore from '../services/tokenStore.js';

dotenv.config();
const router = express.Router();

// Helper: locate Slack token from multiple sources (req.user populated by server-level Descope middleware)
function getSlackTokenFromReq(req) {
  return req.headers['x-slack-access-token'] || req.body?.slackAccessToken || req.query?.slackAccessToken;
}

async function getSlackTokenForUser(req) {
  const direct = getSlackTokenFromReq(req);
  if (direct) return direct;
  const userId = req.user?.id;
  if (!userId) return null;
  // For now return stored token; if refresh logic exists, use refreshManager
  const token = await tokenStore.getToken(userId, 'slack');
  return token?.accessToken || null;
}

// GET /channels - list channels using provided token
router.get('/channels', async (req, res) => {
  try {
  const token = await getSlackTokenForUser(req);
    if (!token) {
      return res.status(401).json({
        error: 'Slack not connected',
        details: 'No Slack access token found. Ensure Slack OAuth flow completed or provide X-Slack-Access-Token header for testing.'
      });
    }

    const slack = new WebClient(token);
    const result = await slack.conversations.list({ types: 'public_channel,private_channel', limit: 100 });

    const channels = result.channels || [];
    return res.json({ channels });
  } catch (err) {
    console.error('Slack channels error:', err?.message || err);
    // Slack Web API returns err.data with its payload; map common auth errors to 401 so frontend can prompt reconnect
    const slackPayload = err?.data || {};
    if (slackPayload?.error === 'invalid_auth' || slackPayload?.error === 'not_authed') {
      return res.status(401).json({ error: 'Slack authentication failed', details: slackPayload });
    }
    const details = slackPayload || err?.message || 'Unknown Slack API error';
    return res.status(500).json({ error: 'Failed to fetch Slack channels', details });
  }
});

// POST /send-message - send a chat message
router.post('/send-message', async (req, res) => {
  try {
  const token = await getSlackTokenForUser(req);
    if (!token) {
      return res.status(401).json({ error: 'Slack not connected', details: 'Provide token via Descope or X-Slack-Access-Token header.' });
    }

    const { channel, text } = req.body;
    if (!channel || !text) return res.status(400).json({ error: 'Missing channel or text' });

    const slack = new WebClient(token);
    const response = await slack.chat.postMessage({ channel, text });

    return res.json({ success: true, ts: response.ts, channel: response.channel, ok: response.ok });
  } catch (err) {
    console.error('Slack send message error:', err?.message || err);
    const slackPayload = err?.data || {};
    if (slackPayload?.error === 'invalid_auth' || slackPayload?.error === 'not_authed') {
      return res.status(401).json({ error: 'Slack authentication failed', details: slackPayload });
    }
    const details = slackPayload || err?.message || 'Unknown Slack API error';
    return res.status(500).json({ error: 'Failed to send Slack message', details });
  }
});

// POST /carbon-notification - send a formatted carbon footprint message
router.post('/carbon-notification', async (req, res) => {
  try {
    const { footprint, breakdown, channel } = req.body || {};
    const slackToken = getSlackToken(req);

    if (!slackToken) {
      return res.status(400).json({ error: 'Slack not connected', message: 'Please connect your Slack account in your account settings' });
    }

    const slack = new WebClient(slackToken);

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🌍 Carbon Footprint Update' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Total Monthly Footprint:*
${footprint} kg CO₂` },
          { type: 'mrkdwn', text: `*Annual Impact:*
${(footprint * 12).toFixed(2)} kg CO₂` }
        ]
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Electricity:*
${breakdown?.electricity ?? 0} kg CO₂` },
          { type: 'mrkdwn', text: `*Travel:*
${breakdown?.travel ?? 0} kg CO₂` },
          { type: 'mrkdwn', text: `*Waste:*
${breakdown?.waste ?? 0} kg CO₂` },
          { type: 'mrkdwn', text: `*Trees to offset:*
${Math.ceil(((footprint ?? 0) * 12) / 22)} trees/year` }
        ]
      },
      { type: 'context', elements: [{ type: 'mrkdwn', text: 'Tracked via Terra EcoImpact Tracker 🌱' }] }
    ];

    const result = await slack.chat.postMessage({ channel: channel || '#general', text: `Carbon footprint update: ${footprint} kg CO₂ per month`, blocks });

    return res.json({ success: true, ts: result.ts, channel: result.channel, text: result.message?.text });
  } catch (error) {
    console.error('Slack carbon notification error:', error);
    const slackPayload = error?.data || {};
    if (slackPayload?.error === 'invalid_auth' || slackPayload?.error === 'not_authed') {
      return res.status(401).json({ error: 'Slack authentication failed', details: slackPayload });
    }
    return res.status(500).json({ error: 'Failed to send carbon notification', message: 'Unable to send notification to Slack', details: slackPayload });
  }
});

// GET /status - integration status using token store metadata
router.get('/status', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ connected: false });
  const meta = await tokenStore.getMetadata(userId);
  const isConnected = !!meta?.slack?.has;
  res.json({ connected: isConnected, user: { id: req.user?.id, email: req.user?.email, name: req.user?.name }, meta });
});

export default router;

// Optional: endpoint to persist Slack tokens via client-side callback
router.post('/persist-token', async (req, res) => {
  const { provider, accessToken, refreshToken, scope, userId: bodyUserId } = req.body || {};
  const userId = req.user?.id || bodyUserId;
  if (!provider || !userId || !accessToken) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await tokenStore.saveToken(userId, provider, { accessToken, refreshToken, scope });
    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to persist Slack token via endpoint:', e?.message || e);
    return res.status(500).json({ error: 'Failed to persist token' });
  }
});


