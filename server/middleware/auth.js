import DescopeClient from '@descope/node-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Descope client only when env vars are present to avoid SDK runtime errors
let descopeClient = null;
if (process.env.DESCOPE_PROJECT_ID && process.env.DESCOPE_MANAGEMENT_KEY) {
  try {
    descopeClient = DescopeClient({
      projectId: String(process.env.DESCOPE_PROJECT_ID),
      managementKey: String(process.env.DESCOPE_MANAGEMENT_KEY),
    });
  } catch (initErr) {
    console.error('Failed to initialize Descope client:', initErr);
    descopeClient = null;
  }
}

export const authenticateToken = async (req, res, next) => {
  try {
    if (!descopeClient) {
      console.error('Descope client not configured (missing DESCOPE_PROJECT_ID / DESCOPE_MANAGEMENT_KEY)');
      return res.status(500).json({
        error: 'Server misconfiguration',
        message: 'Descope client not configured on the server. Set DESCOPE_PROJECT_ID and DESCOPE_MANAGEMENT_KEY.',
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Validate session with Descope
    const authInfo = await descopeClient.validateSession(token);
    
    if (!authInfo || !authInfo.token) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token validation failed'
      });
    }

    // Add user info to request
    req.user = {
      id: authInfo.token.sub,
      email: authInfo.token.email,
      name: authInfo.token.name,
      // Extract integration tokens from Descope custom claims
      googleAccessToken: authInfo.token.googleAccessToken || authInfo.token.customAttributes?.googleAccessToken,
      slackAccessToken: authInfo.token.slackAccessToken || authInfo.token.customAttributes?.slackAccessToken,
      ...authInfo.token
    };

    // Debug logging for integration tokens
    console.log('User tokens:', {
      googleAccessToken: !!req.user.googleAccessToken,
      slackAccessToken: !!req.user.slackAccessToken,
      customAttributes: authInfo.token.customAttributes
    });

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific Descope errors
    if (error.message?.includes('expired')) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    if (error.message?.includes('invalid')) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Unable to verify token'
    });
  }
};

export default { authenticateToken };