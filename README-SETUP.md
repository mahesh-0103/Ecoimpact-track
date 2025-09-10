# EcoImpact Tracker - Setup Instructions

## Environment Variables Setup

To get the Descope authentication working properly, you need to create a `.env` file in the project root with your Descope credentials:

1. Create a `.env` file in the `project/` directory
2. Add the following variables:

```env
VITE_DESCOPE_PROJECT_ID=your_project_id_here
VITE_DESCOPE_FLOW_ID=sign-up-or-in-otp-or-social
```

## Getting Your Descope Credentials

1. Go to [Descope Console](https://app.descope.com/)
2. Create a new project or use an existing one
3. Copy your Project ID from the project settings
4. Create a flow with the ID `sign-up-or-in-otp-or-social` or use the default flow
5. Update the `.env` file with your actual Project ID

## Features Fixed

✅ **Descope Authentication**: Fixed authentication issues by removing automatic auth clearing and adding proper environment variable handling

✅ **Navigation**: Fixed blank screen issues when switching between pages by adding proper route handling and missing functions

✅ **Application Name**: Changed from "Terra" to "EcoImpact Tracker" throughout the application

✅ **Nature Photos**: Added beautiful nature background images to the login/signup screen

✅ **Sidebar Icons**: Added Calculator, Calendar, and Slack notification icons to the sidebar

✅ **Flow ID**: Updated to use `sign-up-or-in-otp-or-social` flow ID as requested

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your `.env` file with the credentials above

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The application will be available at `http://localhost:5173`

## Default Project ID

If you don't set up your own Descope project, the application will use a default project ID for testing purposes. However, for production use, you should always use your own Descope project.

