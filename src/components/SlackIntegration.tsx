import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Descope } from '@descope/react-sdk';
import { MessageSquare, CheckCircle, AlertCircle, ExternalLink, Send, RefreshCw } from 'lucide-react';
import { sendSlackMessage, getSlackChannels, SlackChannel } from '../services/api';

interface SlackIntegrationProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const SlackIntegration = ({ isConnected, onConnectionChange }: SlackIntegrationProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Slack management state
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [customChannel, setCustomChannel] = useState('');
  const [useCustomChannel, setUseCustomChannel] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState('');

  // Fetch channels when connected
  const fetchChannels = async () => {
    setIsLoadingChannels(true);
    setError(null);
    try {
      console.log('Fetching Slack channels...');
      const response = await getSlackChannels();
      console.log('Slack channels response:', response);
      
      if (!response || !response.channels) {
        throw new Error('Invalid response from Slack API');
      }
      
      // Filter to only show channels the user is a member of
      const memberChannels = response.channels.filter(c => c.is_member);
      console.log('Member channels:', memberChannels);
      
      setChannels(memberChannels);
      if (memberChannels.length > 0) {
        setSelectedChannel(memberChannels[0].id);
      } else {
        setError('No channels found where you are a member. Please ensure the app has been invited to the channels you wish to see.');
      }
    } catch (err: any) {
      console.error('Failed to fetch Slack channels:', err);
      // Prefer provider details returned by the backend
      const provider = err?.response?.data || {};
      const providerMsg = provider?.details || provider?.error || provider?.message;
      const fallback = err?.message || 'Unknown error';

      // Friendly mapping for common cases
      if (provider?.error === 'Slack authentication failed' || provider?.details?.error === 'invalid_auth') {
        setError('Slack authentication failed — please reconnect Slack in your account settings.');
      } else if (String(providerMsg).includes('Descope OAuth flow configuration')) {
        setError('Slack integration is not properly configured. Please contact your administrator to set up the Descope Slack OAuth flow.');
      } else {
        setError(`Could not load your Slack channels: ${providerMsg || fallback}. Ensure the app has permissions and has been invited to channels.`);
      }
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchChannels();
    }
  }, [isConnected]);

  const handleConnectionSuccess = () => {
    setIsConnecting(false);
    setError(null);
    onConnectionChange(true);
  };

  const handleDescopeSuccessDetail = async (detail: any) => {
    try {
      const provider = 'slack';
      const tokenObj = detail?.oauth2?.slack || detail?.providerTokens?.slack || null;
      const accessToken = tokenObj?.accessToken || tokenObj?.access_token || null;
      const refreshToken = tokenObj?.refreshToken || tokenObj?.refresh_token || null;
      if (accessToken) {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/slack/persist-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, accessToken, refreshToken }),
        });
      }
    } catch (e) {
      console.warn('Failed to persist Slack provider tokens:', e);
    }
  };

  const handleConnectionError = (error: any) => {
    console.error('Slack connection error:', error);
    setIsConnecting(false);
    setError('Failed to connect to Slack. Please try again.');
  };

  const handleDisconnect = () => {
    setChannels([]);
    setSelectedChannel('');
    setMessage('');
    onConnectionChange(false);
  };

  const handleSendMessage = async () => {
    const channelToUse = useCustomChannel ? customChannel : selectedChannel;
    
    if (!channelToUse) {
      setStatus('Please select a channel or enter a custom channel name.');
      return;
    }
    if (!message.trim()) {
      setStatus('Please enter a message.');
      return;
    }

    setIsSending(true);
    setStatus('Sending...');
    
    try {
      // If user typed a custom channel name, ensure it starts with '#'
      const sendChannel = useCustomChannel
        ? channelToUse.startsWith('#')
          ? channelToUse
          : `#${channelToUse}`
        : channelToUse;

      await sendSlackMessage({
        channel: sendChannel,
        text: `🌍 ${message.trim()}`, // Add emoji prefix for environmental messages
      });
      
      setStatus('Message sent successfully!');
      setMessage(''); // Clear the input field
    } catch (err: any) {
      console.error('Failed to send Slack message:', err);
    const provider = err?.response?.data || {};
    const providerMsg = provider?.details || provider?.error || provider?.message;
    setStatus(`Failed to send message: ${providerMsg || err?.message || 'Unknown error occurred'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Connected view - shows channel selection and message sending
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
            <h3 className="text-xl font-bold text-green-400">Slack Connected</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchChannels}
              disabled={isLoadingChannels}
              className="p-2 text-green-400 hover:text-green-300 transition-colors duration-300 hover:bg-green-500/20 rounded-lg"
              title="Refresh channels"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingChannels ? 'animate-spin' : ''}`} />
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
          {/* Channel Selection */}
          <div>
            <h4 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Select Channel</span>
            </h4>
            
            {isLoadingChannels ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-green-200">Loading channels...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-8 text-green-200">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No channels found</p>
                <p className="text-sm">Please ensure the app has been invited to the channels you wish to see</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="use-custom-channel"
                    checked={useCustomChannel}
                    onChange={(e) => setUseCustomChannel(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-green-900/40 border-green-500/50 rounded focus:ring-green-400"
                  />
                  <label htmlFor="use-custom-channel" className="text-green-200 text-sm">
                    Use custom channel name
                  </label>
                </div>

                {useCustomChannel ? (
                  <div className="space-y-3">
                    <label htmlFor="custom-channel" className="block text-green-200 font-medium">
                      Channel Name:
                    </label>
                    <input
                      id="custom-channel"
                      type="text"
                      value={customChannel}
                      onChange={(e) => setCustomChannel(e.target.value)}
                      placeholder="e.g., general, ecoimpacttracker"
                      className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none placeholder-green-300/50"
                    />
                    <p className="text-green-300 text-xs">
                      Enter the channel name without the # symbol
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label htmlFor="channel-select" className="block text-green-200 font-medium">
                      Available Channels:
                    </label>
                    <select
                      id="channel-select"
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none"
                    >
                      {channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name} {channel.is_private ? '(Private)' : ''} - {channel.num_members} members
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 text-sm">
                    💡 <strong>Note:</strong> The app needs the <code className="bg-green-800/50 px-1 rounded">channels:read</code> and <code className="bg-green-800/50 px-1 rounded">chat:write</code> scopes to function properly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Message Sending */}
          <div>
            <h4 className="text-lg font-semibold text-green-200 mb-4 flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Send Message</span>
            </h4>
            
            <div className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share an environmental impact update with your team..."
                rows={4}
                className="w-full p-3 bg-green-900/40 text-green-100 rounded-lg border border-green-500/50 focus:border-green-400 focus:outline-none placeholder-green-300/50"
                disabled={!useCustomChannel && channels.length === 0}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-green-300 text-sm">
                  {useCustomChannel ? (
                    customChannel ? (
                      <>Channel: <span className="text-green-400">#{customChannel}</span></>
                    ) : (
                      'Enter a channel name to send messages'
                    )
                  ) : selectedChannel && channels.length > 0 ? (
                    <>Channel: <span className="text-green-400">#{channels.find(c => c.id === selectedChannel)?.name}</span></>
                  ) : (
                    'Select a channel to send messages'
                  )}
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !message.trim() || (!useCustomChannel && channels.length === 0) || (useCustomChannel && !customChannel.trim())}
                  className="px-6 py-3 bg-green-600/30 hover:bg-green-600/40 text-green-200 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSending ? (
                    <div className="animate-spin w-5 h-5 border-2 border-green-200 border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
              
              {status && (
                <p className={`text-sm ${status.includes('successfully') ? 'text-green-300' : 'text-red-400'}`}>
                  {status}
                </p>
              )}
            </div>
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
        <MessageSquare className="w-6 h-6 text-terra-accent" />
        <h3 className="text-xl font-bold text-terra-primary">Connect Slack</h3>
      </div>
      
      <p className="text-terra-secondary mb-6">
        Connect your Slack workspace to send environmental impact updates, sustainability reports, and team notifications.
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
            <li>• Send carbon footprint updates to your team</li>
            <li>• Weekly sustainability reports in Slack</li>
            <li>• Goal reminders and achievements</li>
            <li>• Team collaboration on environmental goals</li>
            <li>• Real-time environmental impact notifications</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">Required Permissions:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• <code className="bg-blue-800/50 px-1 rounded">channels:read</code> - To view available channels</li>
            <li>• <code className="bg-blue-800/50 px-1 rounded">chat:write</code> - To send messages</li>
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
                <MessageSquare className="w-5 h-5" />
                <span>Connect Slack</span>
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
            <div className="animate-spin w-8 h-8 border-2 border-terra-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-terra-secondary">Connecting to Slack...</p>
            <p className="text-terra-secondary text-sm mt-2">
              You will be redirected to Slack to authorize the connection.
            </p>
          </div>
          
          {/* Descope Flow for Slack */}
          <div className="mt-4">
            <Descope
              flowId={import.meta.env.VITE_DESCOPE_SLACK_FLOW || 'slack-connect'}
              theme="dark"
              onSuccess={(evt: any) => { console.log('Descope onSuccess detail (Slack):', evt?.detail); handleConnectionSuccess(); handleDescopeSuccessDetail(evt?.detail); }}
              onError={handleConnectionError}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SlackIntegration;
