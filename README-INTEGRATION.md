# Integration Setup Guide

## Environment Variables Required

Create a `.env` file in the project root with the following variables:

```env
# Descope Configuration
DESCOPE_PROJECT_ID=your_descope_project_id
DESCOPE_MANAGEMENT_KEY=your_descope_management_key

# Frontend Environment Variables
VITE_DESCOPE_PROJECT_ID=your_descope_project_id
VITE_DESCOPE_BASE_URL=https://api.descope.com
VITE_DESCOPE_FLOW_ID=sign-up-or-in
VITE_API_URL=http://localhost:3001
```

## Descope Integration Setup

### 1. Google Calendar Integration
1. In your Descope project, go to **Integrations** → **Google Calendar**
2. Configure the OAuth settings with your Google Cloud Console credentials
3. Set up the custom claims to store the access token:
   - Custom claim name: `https://descope.com/claims/google_access_token`
   - Value: `{{googleAccessToken}}`

### 2. Slack Integration
1. In your Descope project, go to **Integrations** → **Slack**
2. Configure the OAuth settings with your Slack app credentials
3. Set up the custom claims to store the access token:
   - Custom claim name: `https://descope.com/claims/slack_access_token`
   - Value: `{{slackAccessToken}}`

### 3. Flow Configuration
1. Update your sign-up/sign-in flow to include the integration steps
2. Add the Google Calendar and Slack connection steps to your flow
3. Ensure the custom claims are properly mapped

## Features Implemented

### Backend API Endpoints

#### Google Calendar
- `GET /api/calendar/events` - Get upcoming calendar events
- `POST /api/calendar/events` - Create a new calendar event
- `GET /api/calendar/status` - Check calendar connection status

#### Slack
- `POST /api/slack/send-message` - Send a message to Slack
- `POST /api/slack/carbon-notification` - Send carbon footprint notification
- `GET /api/slack/channels` - Get available Slack channels
- `GET /api/slack/status` - Check Slack connection status

### Frontend Features
- **Dashboard Integration Status**: Shows connection status for both services
- **Google Calendar Events**: Displays upcoming events from connected calendar
- **Slack Notifications**: Automatically sends carbon footprint updates to selected channel
- **Channel Selection**: Choose which Slack channel to send notifications to

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables in `.env`

3. Start the development servers:
   ```bash
   npm run dev:full
   ```

4. Open http://localhost:5173 in your browser

## Testing the Integrations

1. **Sign up/Sign in** using the Descope flow
2. **Connect Google Calendar** through the Descope integration
3. **Connect Slack** through the Descope integration
4. **Calculate carbon footprint** - this will automatically send a notification to Slack
5. **View calendar events** in the dashboard

## Troubleshooting

### Common Issues

1. **"Google Calendar not connected"** - Ensure the Google Calendar integration is properly configured in Descope and the custom claim is set up correctly.

2. **"Slack not connected"** - Ensure the Slack integration is properly configured in Descope and the custom claim is set up correctly.

3. **CORS errors** - Make sure your Descope project allows the correct origins in CORS settings.

4. **Token validation errors** - Check that your Descope project ID and management key are correct.

### Debug Steps

1. Check browser console for any error messages
2. Check server logs for API errors
3. Verify Descope integration configuration
4. Test API endpoints directly using tools like Postman


