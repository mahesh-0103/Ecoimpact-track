import { useState } from 'react';
import { motion } from 'framer-motion';
import { Descope } from '@descope/react-sdk';
import { MessageSquare, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface SlackConnectionProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

const SlackConnection = ({ isConnected, onConnectionChange }: SlackConnectionProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectionSuccess = () => {
    setIsConnecting(false);
    setError(null);
    onConnectionChange(true);
  };

  const handleConnectionError = (err: any) => {
    console.error('Slack connection error:', err);
    setIsConnecting(false);
    setError('Failed to connect to Slack. Please try again.');
  };

  const handleDisconnect = () => {
    // In a real implementation, call backend to revoke token
    onConnectionChange(false);
  };

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-green-500/10 border border-green-500/30 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-green-400">Slack Connected</h3>
        </div>

        <p className="text-green-200 mb-4">Your Slack workspace is successfully connected. You can now send messages.</p>

        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300"
        >
          Disconnect
        </button>
      </motion.div>
    );
  }

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

      <p className="text-terra-secondary mb-6">Connect your Slack workspace to send environmental impact updates and team notifications.</p>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2">
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
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-terra-darker/50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-terra-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-terra-secondary">Connecting to Slack...</p>
            <p className="text-terra-secondary text-sm mt-2">You will be redirected to Slack to authorize the connection.</p>
          </div>

          <div className="mt-4">
            <Descope flowId={import.meta.env.VITE_DESCOPE_SLACK_FLOW || 'slack-connect'} onSuccess={handleConnectionSuccess} onError={handleConnectionError} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SlackConnection;
