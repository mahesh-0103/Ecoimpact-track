import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Descope, getSessionToken } from '@descope/react-sdk';
import { Calendar, CheckCircle, AlertCircle, ExternalLink, Plus, Clock, MapPin, Users, RefreshCw } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent, CalendarEvent } from '../services/api';

interface GoogleCalendarIntegrationProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const GoogleCalendarIntegration = ({ isConnected, onConnectionChange }: GoogleCalendarIntegrationProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calendar management state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventForm, setEventForm] = useState({ 
    summary: '', 
    startTime: '', 
    endTime: '', 
    location: '' 
  });
  const [formStatus, setFormStatus] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Fetch events when connected
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setError(null);
    try {
      console.log('Fetching calendar events...');
      const response = await getCalendarEvents();
      console.log('Calendar events response:', response);
      
      if (!response || !response.events) {
        throw new Error('Invalid response from Calendar API');
      }
      
      setEvents(response.events);
    } catch (err: any) {
      console.error('Failed to fetch calendar events:', err);
      // Try to surface provider details if the server forwarded them
      const providerDetails = err?.response?.data?.details;
      let errorMessage = '';

      if (providerDetails) {
        if (typeof providerDetails === 'string') {
          errorMessage = providerDetails;
        } else if (providerDetails.error && providerDetails.error.message) {
          errorMessage = providerDetails.error.message;
        } else if (providerDetails.message) {
          errorMessage = providerDetails.message;
        } else {
          try {
            errorMessage = JSON.stringify(providerDetails);
          } catch (e) {
            errorMessage = String(providerDetails);
          }
        }

        // If provider/auth error, suggest reconnect
        if (err?.response?.status === 401 || /invalid_credentials|unauthenticated|invalid_auth/i.test(errorMessage)) {
          setError(`Google authentication failed — please reconnect Google Calendar. (${errorMessage})`);
          return;
        }
      } else {
        errorMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      }

      // Check if it's a configuration issue
      if (typeof errorMessage === 'string' && errorMessage.includes('Descope OAuth flow configuration')) {
        setError('Google Calendar integration is not properly configured. Please contact your administrator to set up the Descope Google OAuth flow.');
      } else {
        setError(`Could not load your calendar events: ${errorMessage}. Please ensure you are connected to Google Calendar.`);
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected]);

  const handleConnectionSuccess = () => {
    setIsConnecting(false);
    setError(null);
    onConnectionChange(true);
  };

  // If Descope onSuccess provides provider tokens in event.detail, persist them to the server
  const handleDescopeSuccessDetail = async (detail: any) => {
    try {
      // Common shapes: detail.oauth2?.google or detail.providerTokens
      const provider = 'google';
      const tokenObj = detail?.oauth2?.google || detail?.providerTokens?.google || null;
      const accessToken = tokenObj?.accessToken || tokenObj?.access_token || null;
      const refreshToken = tokenObj?.refreshToken || tokenObj?.refresh_token || null;
      const expiresAt = tokenObj?.expiresAt || tokenObj?.expires_at || null;
      if (accessToken) {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/calendar/persist-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, accessToken, refreshToken, expiresAt }),
        });
      }
    } catch (e) {
      console.warn('Failed to persist Google provider tokens:', e);
    }
  };

  const handleConnectionError = (error: any) => {
    console.error('Calendar connection error:', error);
    setIsConnecting(false);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to connect to Google Calendar. Please try again.';
    
    if (error?.message?.includes('popup')) {
      errorMessage = 'Connection was cancelled. Please try again.';
    } else if (error?.message?.includes('scope')) {
      errorMessage = 'Permission denied. Please ensure the app has access to your Google Calendar.';
    } else if (error?.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    // If the Descope web component emitted details, include them
    const detail = error?.detail || error?.detail?.message || error?.detail?.error || error?.detail?.details;
    if (detail) {
      const detailMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      errorMessage = `${errorMessage} Details: ${detailMsg}`;
    }

    setError(errorMessage);
  };

  const handleDisconnect = () => {
    setEvents([]);
    onConnectionChange(false);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setError(null);
    
    try {
      console.log('Testing Google Calendar connection...');
  const possible = getSessionToken();
  const isThenable = (v: any): v is Promise<any> => v && typeof v.then === 'function';
  const sessionToken = isThenable(possible) ? await possible : possible;
      const response = await fetch('/api/calendar/status', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Connection test result:', data);
      
      if (data.connected) {
        setFormStatus('✅ Google Calendar is connected and working!');
        onConnectionChange(true);
      } else {
        setError('Google Calendar is not connected. Please use the "Connect Calendar" button to set up the connection.');
      }
    } catch (err: any) {
      console.error('Connection test failed:', err);
      // Surface provider/server-provided details when available
      const providerDetails = err?.response?.data?.details;
      let message = err?.message || 'Connection test failed';
      if (providerDetails) {
        if (typeof providerDetails === 'string') message = providerDetails;
        else if (providerDetails.error && providerDetails.error.message) message = providerDetails.error.message;
        else if (providerDetails.message) message = providerDetails.message;
        else message = JSON.stringify(providerDetails);
      }

      if (err?.response?.status === 401) {
        setError(`Google authentication failed — please reconnect Google Calendar. (${message})`);
      } else {
        setError(`Connection test failed: ${message}`);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.summary || !eventForm.startTime || !eventForm.endTime) {
      setFormStatus('Title, start time, and end time are required.');
      return;
    }
    
    // Validate date/time inputs
    const startDate = new Date(eventForm.startTime);
    const endDate = new Date(eventForm.endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setFormStatus('Please enter valid date and time values.');
      return;
    }
    
    if (endDate <= startDate) {
      setFormStatus('End time must be after start time.');
      return;
    }
    
    setIsCreating(true);
    setFormStatus('Creating event...');
    
    try {
      // Use the corrected API structure
      await createCalendarEvent({
        summary: eventForm.summary,
        location: eventForm.location,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      });
      
      setFormStatus('Event created successfully!');
      setEventForm({ summary: '', startTime: '', endTime: '', location: '' });
      fetchEvents(); // Refresh the event list
    } catch (err: any) {
      console.error('Failed to create event:', err);
      // Prefer provider details if present
      const providerDetails = err?.response?.data?.details;
      let errorMessage = err?.message || 'Unknown error occurred';
      if (providerDetails) {
        if (typeof providerDetails === 'string') errorMessage = providerDetails;
        else if (providerDetails.error && providerDetails.error.message) errorMessage = providerDetails.error.message;
        else if (providerDetails.message) errorMessage = providerDetails.message;
        else errorMessage = JSON.stringify(providerDetails);
      } else {
        errorMessage = err?.response?.data?.message || err?.message || 'Unknown error occurred';
      }

      if (err?.response?.status === 401) {
        setFormStatus(`Failed to create event: Google authentication failed — please reconnect Google Calendar. (${errorMessage})`);
      } else {
        setFormStatus(`Failed to create event: ${errorMessage}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Connected view - shows both event creation and event list
  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-green-500/10 border border-green-500/30 rounded-2xl p-6 shadow-2xl space-y-6"
      >
        {/* Connection Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-400">Google Calendar Connected</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchEvents}
              disabled={isLoadingEvents}
              className="p-2 text-green-400 hover:text-green-300 transition-colors duration-300 hover:bg-green-500/20 rounded-lg"
              title="Refresh events"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300"
            >
              Disconnect
            </button>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Event Form */}
          <div>
            <h4 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Create New Event</span>
            </h4>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input
                type="text"
                value={eventForm.summary}
                onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                placeholder="Event Title"
                className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none"
                  required
                />
                <input
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none"
                  required
                />
              </div>
              <input
                type="text"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Location (optional)"
                className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none"
              />
              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full px-4 py-3 bg-green-600/30 hover:bg-green-600/40 text-green-200 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCreating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-green-200 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    <span>Create Event</span>
                  </>
                )}
              </button>
              {formStatus && (
                <p className={`text-sm ${formStatus.includes('successfully') ? 'text-green-300' : 'text-red-400'}`}>
                  {formStatus}
                </p>
              )}
            </form>
          </div>

          {/* Events List */}
          <div>
            <h4 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Upcoming Events</span>
            </h4>
            
            {isLoadingEvents ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-green-200">Loading events...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-green-200">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming events found</p>
                <p className="text-sm">Your calendar events will appear here</p>
                <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-xs">
                    💡 <strong>Tip:</strong> Make sure your Google Calendar has events and the app has the correct permissions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event.id} className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-green-100 truncate">{event.summary}</h5>
                        <p className="text-sm text-green-300">
                          {new Date(event.start).toLocaleString()}
                        </p>
                        {event.location && (
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-300 truncate">{event.location}</span>
                          </div>
                        )}
                        {event.attendees > 0 && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Users className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-300">{event.attendees} attendees</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Unconnected view - shows connection interface
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Calendar className="w-6 h-6 text-terra-accent" />
        <h3 className="text-xl font-bold text-terra-primary">Connect Google Calendar</h3>
      </div>
      
      <p className="text-terra-secondary mb-6">
        Connect your Google Calendar to automatically track your environmental impact from your scheduled events and activities.
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="p-4 bg-terra-darker/50 rounded-lg">
          <h4 className="text-terra-primary font-medium mb-2">What you'll get:</h4>
          <ul className="text-terra-secondary text-sm space-y-1">
            <li>• View upcoming events in your dashboard</li>
            <li>• Create new calendar events directly from the app</li>
            <li>• Automatic carbon footprint calculation for travel events</li>
            <li>• Location-based environmental impact tracking</li>
            <li>• Integration with your team's sustainability goals</li>
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-terra-secondary text-sm">
            <ExternalLink className="w-4 h-4" />
            <span>Secure connection via Descope</span>
          </div>
          
          <button
            onClick={() => setIsConnecting(true)}
            disabled={isConnecting}
            className="px-6 py-3 bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isConnecting ? (
              <div className="animate-spin w-5 h-5 border-2 border-terra-dark border-t-transparent rounded-full" />
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Connect Calendar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isConnecting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-terra-darker/50 rounded-lg"
        >
          <div className="text-center">
            <p className="text-terra-secondary">Connecting to Google Calendar...</p>
            <p className="text-terra-secondary text-sm mt-2">
              You will be redirected to Google to authorize the connection.
            </p>
          </div>
          
          {/* Descope Flow - render visibly so the modal/iframe loads correctly */}
          <div>
            <Descope
              flowId={import.meta.env.VITE_DESCOPE_GOOGLE_FLOW || 'google-calendar-sso'}
              theme="dark"
              onSuccess={(evt: any) => { console.log('Descope onSuccess detail (Google):', evt?.detail); handleConnectionSuccess(); handleDescopeSuccessDetail(evt?.detail); }}
              onError={handleConnectionError}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GoogleCalendarIntegration;
