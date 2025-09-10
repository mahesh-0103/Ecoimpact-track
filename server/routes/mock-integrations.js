import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Mock Google Calendar status
router.get('/calendar/status', authenticateToken, (req, res) => {
  res.json({
    connected: false,
    message: 'Google Calendar integration requires proper Descope OAuth flow configuration',
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Mock Slack status
router.get('/slack/status', authenticateToken, (req, res) => {
  res.json({
    connected: false,
    message: 'Slack integration requires proper Descope OAuth flow configuration',
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    }
  });
});

// Mock Google Calendar events
router.get('/calendar/events', authenticateToken, (req, res) => {
  res.status(400).json({
    error: 'Google Calendar not connected',
    message: 'Please configure the Descope Google OAuth flow to enable calendar integration'
  });
});

// Mock Slack channels
router.get('/slack/channels', authenticateToken, (req, res) => {
  res.status(400).json({
    error: 'Slack not connected',
    message: 'Please configure the Descope Slack OAuth flow to enable Slack integration'
  });
});

// Export the router directly (remove default)
export default router;

