import dotenv from 'dotenv';
dotenv.config();

export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.FRONTEND_URL}/api/calendar/oauth/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};

export const slackConfig = {
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  redirectUri: `${process.env.FRONTEND_URL}/api/slack/oauth/callback`,
  scopes: ['channels:read', 'chat:write', 'channels:history']
};
