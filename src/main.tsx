import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@descope/react-sdk';
import App from './App.tsx';
import './index.css';

// 1. Access the variable by its NAME, not its value.
const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID || 'P2ZqBk1huFYr3mz4I8Zx4nYd9N3j';

// 2. Log if using default project ID
if (!import.meta.env.VITE_DESCOPE_PROJECT_ID) {
  console.warn('Using default Descope project ID. Please set VITE_DESCOPE_PROJECT_ID in your .env file');
}

// 3. Log environment variables for debugging
console.log('Environment Variables:', {
  projectId: import.meta.env.VITE_DESCOPE_PROJECT_ID ? 'Set' : 'Using default',
  flowId: import.meta.env.VITE_DESCOPE_FLOW_ID || 'Using default',
  calendarApiId: import.meta.env.VITE_GOOGLE_CALENDAR_API_ID ? 'Set' : 'Not set',
  calendarApiSecret: import.meta.env.VITE_GOOGLE_CALENDAR_API_SECRET ? 'Set' : 'Not set',
  slackClientId: import.meta.env.VITE_SLACK_CLIENT_ID ? 'Set' : 'Not set',
  slackClientSecret: import.meta.env.VITE_SLACK_CLIENT_SECRET ? 'Set' : 'Not set',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Pass the projectId VARIABLE you defined above as a prop. */}
    <AuthProvider projectId={projectId}>
      <App />
    </AuthProvider>
  </StrictMode>
);