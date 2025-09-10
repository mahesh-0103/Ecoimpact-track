import axios from 'axios';
import { getSessionToken } from '@descope/react-sdk';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
// Make the request interceptor async so we correctly await session tokens
api.interceptors.request.use(
  async (config) => {
    try {
      // getSessionToken may be sync or async depending on runtime; handle both
      const possible = getSessionToken();
      // Helper: detect thenable
      const isThenable = (v: any): v is Promise<any> => v && typeof v.then === 'function';
      const sessionToken = isThenable(possible) ? await possible : possible;
      if (sessionToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${sessionToken}`;
      }
    } catch (error) {
      // Don't block requests if token retrieval fails; surface error for debugging
      console.error('Failed to get session token:', error);
    }
    return config;
  },
  (error) => Promise.reject(new Error(String(error)))
);

// Response interceptor for error handling
// Preserve original axios error object so callers can inspect error.response/data
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.error('Authentication failed');
      // Could redirect to login or refresh token here
    }
    // Wrap into a proper Error instance but keep original axios data for callers
    const err = new Error(error?.message || 'Request failed');
    (err as any).original = error;
    (err as any).response = error?.response;
    (err as any).config = error?.config;
    (err as any).code = error?.code;
    return Promise.reject(err);
  }
);

export interface CarbonCalculationData {
  electricity: number;
  travel: number;
  waste: number;
}

export interface CarbonCalculationResponse {
  footprint: number;
  breakdown?: {
    electricity: number;
    travel: number;
    waste: number;
  };
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  attendees: number;
  status: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  count: number;
  timeRange: {
    timeMin: string;
    timeMax: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  num_members: number;
}

export interface SlackChannelsResponse {
  channels: SlackChannel[];
  count: number;
}

export const calculateFootprint = async (data: CarbonCalculationData): Promise<CarbonCalculationResponse> => {
  const response = await api.post<CarbonCalculationResponse>('/api/calculate', data);
  return response.data;
};

// Google Calendar API functions
// Note: Requires https://www.googleapis.com/auth/calendar scope in Descope Google provider
export const getCalendarEvents = async (): Promise<CalendarResponse> => {
  const response = await api.get<CalendarResponse>('/api/calendar/events');
  return response.data;
};

export const createCalendarEvent = async (eventData: {
  summary: string;
  location?: string;
  start: { dateTime: string };
  end: { dateTime: string };
}): Promise<any> => {
  // Fixed: The API expects the correct Google Calendar API structure
  const response = await api.post('/api/calendar/events', eventData);
  return response.data;
};

export const getCalendarStatus = async (): Promise<{ connected: boolean; user: any }> => {
  const response = await api.get('/api/calendar/status');
  return response.data;
};

// Slack API functions
// Note: Requires channels:read and chat:write scopes in Descope Slack provider
export const sendSlackMessage = async (messageData: {
  channel: string;
  text: string; // Fixed: Slack API requires 'text' field, not 'message'
  blocks?: any[];
}): Promise<any> => {
  const response = await api.post('/api/slack/send-message', messageData);
  return response.data;
};

export const sendCarbonNotification = async (notificationData: {
  footprint: number;
  breakdown: {
    electricity: number;
    travel: number;
    waste: number;
  };
  channel: string;
}): Promise<any> => {
  const response = await api.post('/api/slack/carbon-notification', notificationData);
  return response.data;
};

export const getSlackChannels = async (): Promise<SlackChannelsResponse> => {
  const response = await api.get<SlackChannelsResponse>('/api/slack/channels');
  return response.data;
};

export const getSlackStatus = async (): Promise<{ connected: boolean; user: any }> => {
  const response = await api.get('/api/slack/status');
  return response.data;
};

export default api;