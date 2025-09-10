import DescopeClient from '@descope/node-sdk';
import dotenv from 'dotenv';
import tokenStore from '../services/tokenStore.js';

dotenv.config();

// Guarded initialization to avoid SDK throwing on missing env vars
let descope = null;
if (process.env.DESCOPE_PROJECT_ID && process.env.DESCOPE_MANAGEMENT_KEY) {
  try {
    descope = DescopeClient({
      projectId: String(process.env.DESCOPE_PROJECT_ID),
      managementKey: String(process.env.DESCOPE_MANAGEMENT_KEY),
    });
  } catch (initErr) {
    console.error('Failed to initialize Descope client:', initErr?.message || initErr);
    descope = null;
  }
} else {
  console.warn('DESCOPE_PROJECT_ID or DESCOPE_MANAGEMENT_KEY is not set — Descope auth is disabled. Set these in your environment or .env');
}

// Descope authentication middleware
export default async function descopeAuth(req, res, next) {
  try {
    // Development helper: allow passing provider tokens directly via headers for testing
    if (process.env.NODE_ENV === 'development') {
      const devSlack = req.headers['x-slack-access-token'];
      const devGoogle = req.headers['x-google-access-token'];
      if (devSlack || devGoogle) {
        // Attach a lightweight dev user so routes can read the header-provided tokens
        req.user = {
          id: `dev-${Date.now()}`,
          email: 'dev@local',
          name: 'Dev User',
        };
        // Skip Descope validation in this dev mode
        return next();
      }
    }

    const header = req.headers.authorization;
    // Log presence of auth header (mask token for privacy)
    if (!header || !header.startsWith('Bearer ')) {
      console.warn('Descope auth: missing or malformed Authorization header');
      return res.status(401).json({ error: 'Unauthorized', details: 'Missing Authorization header.' });
    }

    const token = header.replace('Bearer ', '').trim();
    if (!token) {
      console.warn('Descope auth: empty session token after Bearer prefix');
      return res.status(401).json({ error: 'Unauthorized', details: 'Empty session token.' });
    }
    // Mask the token when logging to avoid leaking secrets
    const masked = `${token.slice(0, 8)}...${token.slice(-6)}`;
    console.log(`Descope auth: Received session token (masked): ${masked}`);

    if (!descope) {
      console.error('Descope client not configured (missing DESCOPE_PROJECT_ID / DESCOPE_MANAGEMENT_KEY)');
      return res.status(500).json({ error: 'Server misconfiguration', details: 'Descope client not configured on the server. Set DESCOPE_PROJECT_ID and DESCOPE_MANAGEMENT_KEY.' });
    }

    let validation;
    try {
      validation = await descope.validateSession(token);
    } catch (e) {
      // Log detailed error to aid debugging (do not log full token)
      console.error('Descope validateSession error:', e?.message || e);
      if (e?.response) {
        try {
          console.error('Descope validateSession response body:', JSON.stringify(e.response));
        } catch (dumpErr) {
          console.error('Failed to stringify validateSession response');
        }
      }
      return res.status(401).json({ error: 'Invalid session', details: 'Session validation failed.' });
    }

    const session = validation?.data ?? validation;
    if (!session || !session.userId) return res.status(401).json({ error: 'Invalid session' });

    // Persist provider tokens (if present)
    try {
      const userId = session.userId;
      const claims = session.customClaims || {};

      // In development, log claim keys to help debugging (mask values)
      if (process.env.NODE_ENV === 'development') {
        try {
          const masked = JSON.parse(JSON.stringify(claims, (k, v) => {
            if (typeof v === 'string' && v.length > 20) return `${v.slice(0, 8)}...${v.slice(-6)}`;
            return v;
          }));
          console.log('Descope session customClaims (masked):', masked);
        } catch (dumpErr) {
          console.warn('Failed to stringify customClaims for debug');
        }
      }

      // Heuristic extractor: search claim values for objects with accessToken/refreshToken
      function findProviderTokens(obj) {
        const found = { google: null, slack: null };
        function walk(value) {
          if (!value) return;
          if (typeof value === 'string') {
            // Google tokens often start with 'ya29.'; Slack tokens often start with 'xox'
            if (/^ya29\./.test(value) && !found.google) found.google = { accessToken: value };
            if (/^xox[bapo]-/.test(value) && !found.slack) found.slack = { accessToken: value };
          } else if (typeof value === 'object') {
            if (value.accessToken || value.refreshToken) {
              // Try to guess provider from keys or token formats
              if (!found.google && (/google/i.test(value.provider) || /^ya29\./.test(String(value.accessToken || '')))) {
                found.google = { accessToken: value.accessToken, refreshToken: value.refreshToken, expiresAt: value.expiresAt, scope: value.scope };
              }
              if (!found.slack && (/slack/i.test(value.provider) || /^xox[bapo]-/.test(String(value.accessToken || '')))) {
                found.slack = { accessToken: value.accessToken, refreshToken: value.refreshToken, scope: value.scope };
              }
            }
            // Recurse
            for (const k of Object.keys(value)) walk(value[k]);
          }
        }
        walk(obj);
        return found;
      }

      const extracted = findProviderTokens(claims);
      if (extracted.google && extracted.google.accessToken) {
        await tokenStore.saveToken(userId, 'google', {
          accessToken: extracted.google.accessToken,
          refreshToken: extracted.google.refreshToken,
          expiresAt: extracted.google.expiresAt,
          scope: extracted.google.scope,
        });
      }
      if (extracted.slack && extracted.slack.accessToken) {
        await tokenStore.saveToken(userId, 'slack', {
          accessToken: extracted.slack.accessToken,
          refreshToken: extracted.slack.refreshToken,
          scope: extracted.slack.scope,
        });
      }
    } catch (e) {
      console.error('Failed to persist provider tokens from Descope session:', e?.message || e);
    }

    const meta = await tokenStore.getMetadata(session.userId);
    req.user = {
      id: session.userId,
      email: session.email || session.user?.email,
      name: session.name || session.user?.name,
      providerMeta: meta,
    };

    return next();
  } catch (err) {
    console.error('Descope middleware unexpected error:', err);
    return res.status(500).json({ error: 'Authentication error', details: 'Unexpected error validating session' });
  }
}
