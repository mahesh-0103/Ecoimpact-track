import React, { useState, useEffect } from 'react';
import { sendSlackMessage, getSlackChannels, SlackChannel } from '../services/api'; // Make sure the path to your api.ts file is correct

/**
 * A component that fetches a user's Slack channels, displays them in a dropdown,
 * and allows the user to send a message to the selected channel.
 */
const SlackMessageSender = () => {
  // State for the message text
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  // New state for handling channels
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  // This effect runs once when the component mounts to fetch the user's channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await getSlackChannels();
        // We only want to show channels the user is actually a member of
        const memberChannels = response.channels.filter(c => c.is_member);
        setChannels(memberChannels);
        // Automatically select the first channel in the list as the default
        if (memberChannels.length > 0) {
          setSelectedChannel(memberChannels[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch Slack channels:', error);
        setStatus('Could not load your Slack channels.');
      } finally {
        setIsLoadingChannels(false);
      }
    };

    fetchChannels();
  }, []); // The empty array ensures this effect runs only once on mount

  // This function is called when the "Send Message" button is clicked
  const handleSendMessage = async () => {
    if (!selectedChannel) {
      setStatus('Please select a channel.');
      return;
    }
    if (!message.trim()) {
      setStatus('Please enter a message.');
      return;
    }

    setStatus('Sending...');
    try {
      // The function now uses the channel ID from the dropdown selection
      await sendSlackMessage({
        channel: selectedChannel,
        text: message,
      });

      setStatus('Message sent successfully!');
      setMessage(''); // Clear the input field after sending
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      setStatus('Failed to send message.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px', margin: '20px auto' }}>
      <h2>Send a Message to Slack</h2>
      
      {isLoadingChannels ? (
        <p>Loading your channels...</p>
      ) : (
        <>
          <label htmlFor="channel-select" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Channel:
          </label>
          <select
            id="channel-select"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
            disabled={channels.length === 0}
          >
            {channels.length > 0 ? (
              channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))
            ) : (
              <option>No channels found</option>
            )}
          </select>
        </>
      )}

      <label htmlFor="message-input" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        Message:
      </label>
      <textarea
        id="message-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        rows={4}
        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}
      />
      <button onClick={handleSendMessage} style={{ padding: '10px 15px' }} disabled={isLoadingChannels || channels.length === 0}>
        Send Message
      </button>
      {status && <p style={{ marginTop: '10px' }}>{status}</p>}
    </div>
  );
};

export default SlackMessageSender;

