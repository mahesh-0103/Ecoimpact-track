# Integration Setup Guide

## Environment Variables

Create a `.env` file in the `project/` directory with the following variables:

```env
# Descope Configuration
VITE_DESCOPE_PROJECT_ID=your_project_id_here
VITE_DESCOPE_FLOW_ID=sign-up-or-in-otp-or-social

# Google Calendar API Configuration
VITE_GOOGLE_CALENDAR_API_ID=your_google_calendar_api_id
VITE_GOOGLE_CALENDAR_API_SECRET=your_google_calendar_api_secret

# Slack API Configuration
VITE_SLACK_CLIENT_ID=your_slack_client_id
VITE_SLACK_CLIENT_SECRET=your_slack_client_secret

# Descope Flow IDs for Integrations
VITE_DESCOPE_GOOGLE_CALENDAR_FLOW_ID=google-calendar
VITE_DESCOPE_SLACK_FLOW_ID=stackconnectflow
```

## Descope Flow Configuration

### 1. Google Calendar Flow
- Flow ID: `google-calendar`
- This flow should handle Google Calendar OAuth integration
- Configure the flow in your Descope console to connect with Google Calendar API

### 2. Slack Flow
- Flow ID: `stackconnectflow`
- This flow should handle Slack OAuth integration
- Configure the flow in your Descope console to connect with Slack API

## Google Calendar API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy Client ID and Client Secret to environment variables

## Slack API Setup

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Configure OAuth & Permissions
4. Add required scopes:
   - `channels:read`
   - `chat:write`
   - `users:read`
5. Copy Client ID and Client Secret to environment variables

## Features Implemented

### ✅ Calendar Integration
- Connection status tracking
- Event display with location and attendees
- Refresh functionality
- Connection/disconnection options
- Mock data for demonstration

### ✅ Slack Integration
- Connection status tracking
- Channel selection
- Test notification functionality
- Connection/disconnection options
- Mock data for demonstration

### ✅ Dashboard Integration
- Real-time connection status display
- Quick access links to connection pages
- Integration status indicators
- Seamless navigation between features

## Usage

1. Set up your environment variables
2. Configure Descope flows for Google Calendar and Slack
3. Run the application: `npm run dev`
4. Navigate to Calendar or Slack pages to connect integrations
5. Use the dashboard to view connected services and data

## Security Notes

- Never commit your `.env` file to version control
- Use environment-specific configurations for production
- Regularly rotate your API keys and secrets
- Monitor API usage and set up alerts for unusual activity

