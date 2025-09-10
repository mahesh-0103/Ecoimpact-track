# Descope OAuth Integration Setup Guide

## Current Issue
The application is showing connection errors for both Google Calendar and Slack integrations because the Descope OAuth flows are not properly configured.

## Required Descope Configuration

### 1. Google Calendar OAuth Flow

You need to create a new Descope flow for Google Calendar integration:

1. **Go to Descope Console** → Flows → Create New Flow
2. **Flow Type**: OAuth
3. **Provider**: Google
4. **Flow ID**: `google-calendar-sso` (update this in the code)
5. **Scopes Required**:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

6. **Custom Claims Configuration**:
   - Add custom claim: `googleAccessToken`
   - Map it to: `access_token` from Google OAuth response

### 2. Slack OAuth Flow

Create a separate flow for Slack integration:

1. **Go to Descope Console** → Flows → Create New Flow
2. **Flow Type**: OAuth
3. **Provider**: Slack
4. **Flow ID**: `slack-oauth` (update this in the code)
5. **Scopes Required**:
   - `channels:read`
   - `chat:write`
   - `users:read`

6. **Custom Claims Configuration**:
   - Add custom claim: `slackAccessToken`
   - Map it to: `access_token` from Slack OAuth response

### 3. Update Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Flow
VITE_GOOGLE_CALENDAR_FLOW_ID=google-calendar-sso

# Slack OAuth Flow
VITE_SLACK_OAUTH_FLOW_ID=slack-oauth
```

### 4. Update Frontend Components

Update the flow IDs in the components:

**GoogleCalendarIntegration.tsx**:
```typescript
<Descope
  flowId="google-calendar-sso" // Update this
  theme="dark"
  onSuccess={handleConnectionSuccess}
  onError={handleConnectionError}
/>
```

**SlackIntegration.tsx**:
```typescript
<Descope
  flowId="slack-oauth" // Update this
  theme="dark"
  onSuccess={handleConnectionSuccess}
  onError={handleConnectionError}
/>
```

## Alternative: Mock Implementation

If you want to test the application without setting up OAuth flows, you can use the mock implementation I've created:

1. The mock routes are already added to the server
2. They will return proper error messages explaining the configuration issue
3. The frontend will show helpful messages to users

## Testing the Integration

1. **Start the server**: `npm run dev:server`
2. **Start the frontend**: `npm run dev`
3. **Check console logs**: Look for the debug messages about user tokens
4. **Test the connections**: Try connecting to Google Calendar and Slack

## Expected Behavior After Setup

- **Google Calendar**: Users can connect their Google account and see their calendar events
- **Slack**: Users can connect their Slack workspace and send messages to channels
- **Error Handling**: Proper error messages if connections fail

## Troubleshooting

### Common Issues:

1. **"Failed to connect" errors**: Check if the flow IDs match between Descope console and code
2. **"No tokens found"**: Verify custom claims are properly configured in Descope
3. **"Permission denied"**: Check if the required scopes are enabled in the OAuth flow
4. **CORS errors**: Ensure the frontend URL is added to Descope allowed origins

### Debug Steps:

1. Check browser console for error messages
2. Check server logs for authentication debug info
3. Verify Descope flow configuration
4. Test OAuth flows in Descope console first

## Current Status

- ✅ 3D Globe: Working with Three.js
- ❌ Google Calendar: Needs Descope OAuth flow setup
- ❌ Slack: Needs Descope OAuth flow setup
- ✅ Error Handling: Improved with better messages
- ✅ Mock Implementation: Available for testing

The application is functional but requires proper Descope OAuth configuration to enable the integrations.

