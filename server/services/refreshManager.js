import { google } from 'googleapis';
import tokenStore from './tokenStore.js';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/calendar/oauth/callback`
);

export async function refreshGoogleTokenIfNeeded(userId) {
  const token = await tokenStore.getToken(userId, 'google');
  if (!token) return null;
  const expiresAt = token.expiresAt ? new Date(token.expiresAt).getTime() : null;
  const now = Date.now();
  // If expiresAt is within next 2 minutes, refresh
  if (!expiresAt || expiresAt - now < 120000) {
    if (!token.refreshToken) return token; // nothing to refresh with
    oauth2Client.setCredentials({ refresh_token: token.refreshToken });
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newToken = {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || token.refreshToken,
        scope: credentials.scope,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
      };
      await tokenStore.saveToken(userId, 'google', newToken);
      return await tokenStore.getToken(userId, 'google');
    } catch (e) {
      console.error('Failed to refresh Google token for', userId, e?.message || e);
      return token; // return existing token
    }
  }
  return token;
}

// Placeholder for Slack refresh - most Slack apps don't provide refresh tokens in classic OAuth
export async function refreshSlackTokenIfNeeded(userId) {
  // Most Slack apps don't issue refresh tokens in the classic flow.
  // For now return the stored token if present.
  return await tokenStore.getToken(userId, 'slack');
}

export default { refreshGoogleTokenIfNeeded, refreshSlackTokenIfNeeded };
