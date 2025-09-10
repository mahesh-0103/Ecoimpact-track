import React, { useState, useEffect } from 'react';
import { getCalendarEvents, createCalendarEvent, CalendarEvent } from '../services/api'; // Adjust path to your api.ts file

/**
 * A component to display and create Google Calendar events.
 */
const GoogleCalendarManager = () => {
  // State for storing the list of events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the "Create Event" form
  const [summary, setSummary] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState(''); // Feedback for the user after creating an event

  // Function to fetch events from the API
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await getCalendarEvents();
      setEvents(response.events);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setError('Failed to load calendar events. Please ensure you are connected to Google Calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect hook to fetch events when the component first loads
  useEffect(() => {
    fetchEvents();
  }, []); // The empty array ensures this runs only once on mount

  // Function to handle the form submission for creating a new event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent the form from reloading the page
    if (!summary || !startTime || !endTime) {
      setStatus('Please fill in the event title, start time, and end time.');
      return;
    }

    setStatus('Creating event...');
    try {
      // --- THIS IS THE FIX for the previous 400 error ---
      // We must structure the payload with nested start/end objects.
      const eventData = {
        summary: summary,
        location: location,
        start: {
          dateTime: new Date(startTime).toISOString(),
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
        },
      };

      await createCalendarEvent(eventData);

      setStatus('Event created successfully!');
      // Clear the form fields
      setSummary('');
      setStartTime('');
      setEndTime('');
      setLocation('');
      // Refresh the events list to show the new event
      fetchEvents();
    } catch (err) {
      console.error('Failed to create event:', err);
      setStatus('Failed to create event. Please check the details and try again.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '800px', margin: '20px auto' }}>
      <h2>Google Calendar</h2>

      {/* Section to Create a New Event */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Create New Event</h3>
        <form onSubmit={handleCreateEvent}>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Event Title"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          <button type="submit" style={{ padding: '10px 15px' }}>
            Create Event
          </button>
          {status && <p style={{ marginTop: '10px' }}>{status}</p>}
        </form>
      </div>

      {/* Section to Display Upcoming Events */}
      <div>
        <h3>Your Upcoming Events</h3>
        {isLoading && <p>Loading events...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isLoading && !error && events.length === 0 && <p>No upcoming events found.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((event) => (
            <li key={event.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
              <strong>{event.summary}</strong>
              <p style={{ margin: '5px 0' }}>
                {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
              </p>
              {event.location && <p style={{ margin: '5px 0' }}>Location: {event.location}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GoogleCalendarManager;
