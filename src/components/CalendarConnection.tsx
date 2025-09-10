import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Descope } from '@descope/react-sdk';
import { Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
// Import the necessary API functions and types
import { getCalendarEvents, createCalendarEvent, CalendarEvent } from '../services/api';

interface CalendarConnectionProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const CalendarConnection = ({ isConnected, onConnectionChange }: CalendarConnectionProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NEW STATE FOR MANAGING CALENDAR EVENTS ---
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventForm, setEventForm] = useState({ summary: '', startTime: '', endTime: '', location: '' });
  const [formStatus, setFormStatus] = useState('');

  // --- NEW FUNCTION TO FETCH EVENTS ---
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setError(null);
    try {
      const response = await getCalendarEvents();
      setEvents(response.events);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setError('Could not load your calendar events. Try refreshing the page.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // --- NEW EFFECT: FETCH EVENTS WHEN CONNECTION IS ESTABLISHED ---
  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected]); // This runs whenever the 'isConnected' prop changes

  const handleConnectionSuccess = () => {
    setIsConnecting(false);
    setError(null);
    onConnectionChange(true); // This will trigger the useEffect above
  };

  const handleConnectionError = (error: any) => {
    console.error('Calendar connection error:', error);
    setIsConnecting(false);
    setError('Failed to connect to Google Calendar. Please try again.');
  };

  const handleDisconnect = () => {
    // In a real implementation, you would call an API to disconnect
    setEvents([]); // Clear the events list
    onConnectionChange(false);
  };

  // --- NEW FUNCTION TO HANDLE EVENT CREATION ---
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.summary || !eventForm.startTime || !eventForm.endTime) {
      setFormStatus('Title, start time, and end time are required.');
      return;
    }
    setFormStatus('Creating event...');
    try {
      // Correctly structure the payload for the Google Calendar API
      await createCalendarEvent({
        summary: eventForm.summary,
        location: eventForm.location,
        start: { dateTime: new Date(eventForm.startTime).toISOString() },
        end: { dateTime: new Date(eventForm.endTime).toISOString() },
      });
      setFormStatus('Event created successfully!');
      setEventForm({ summary: '', startTime: '', endTime: '', location: '' }); // Reset form
      fetchEvents(); // Refresh the event list
    } catch (err) {
      console.error('Failed to create event:', err);
      setFormStatus('Failed to create event.');
    }
  };

  // --- UPDATED "CONNECTED" VIEW ---
  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-green-500/10 border border-green-500/30 rounded-2xl p-6 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-400">Google Calendar Connected</h3>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300"
          >
            Disconnect
          </button>
        </div>
        
        {/* Create Event Form */}
        <form onSubmit={handleCreateEvent} className="space-y-3">
          <h4 className="text-lg font-semibold text-green-200">Create New Event</h4>
          <input
            type="text"
            value={eventForm.summary}
            onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
            placeholder="Event Title"
            className="w-full p-2 bg-green-900/40 text-green-100 rounded-md border border-green-500/50"
          />
          <div className="flex space-x-2">
            <input
              type="datetime-local"
              value={eventForm.startTime}
              onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
              className="w-full p-2 bg-green-900/40 text-green-100 rounded-md border border-green-500/50"
            />
            <input
              type="datetime-local"
              value={eventForm.endTime}
              onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
              className="w-full p-2 bg-green-900/40 text-green-100 rounded-md border border-green-500/50"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-green-600/30 hover:bg-green-600/40 text-green-200 rounded-lg">
            Create Event
          </button>
          {formStatus && <p className="text-green-200 text-sm">{formStatus}</p>}
        </form>

        {/* Events List */}
        <div>
          <h4 className="text-lg font-semibold text-green-200 mb-3">Upcoming Events</h4>
          {isLoadingEvents && <p className="text-green-200">Loading events...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!isLoadingEvents && events.length === 0 && <p className="text-green-200">No upcoming events found.</p>}
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="p-2 bg-green-900/30 rounded-md">
                <p className="font-semibold text-green-100">{event.summary}</p>
                <p className="text-sm text-green-300">
                  {new Date(event.start).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }

  // --- UNCONNECTED VIEW (REMAINS THE SAME) ---
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
          {/* This section will be briefly visible before the Descope modal appears */}
          <div className="text-center">
            <p className="text-terra-secondary">Connecting to Google Calendar...</p>
          </div>
          
          {/* Descope Flow: render so the SDK can open modal/redirect */}
          <div>
            <Descope
              flowId={import.meta.env.VITE_DESCOPE_GOOGLE_FLOW || 'google-calendar-sso'}
              theme="dark"
              onSuccess={handleConnectionSuccess}
              onError={handleConnectionError}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CalendarConnection;

