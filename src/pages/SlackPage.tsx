import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import BackNavigation from '../components/BackNavigation';
import SlackIntegration from '../components/SlackIntegration';
import { getSlackStatus } from '../services/api';

const SlackPage = () => {
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await getSlackStatus();
      setIsConnected(!!status.connected);
    } catch (error) {
      console.error('Error checking Slack connection:', error);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    localStorage.setItem('slack-connected', connected.toString());
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Navigation */}
      <BackNavigation />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-terra-primary mb-2 flex items-center space-x-3">
              <MessageSquare className="w-10 h-10 text-terra-accent" />
              <span>Slack Notifications</span>
            </h1>
            <p className="text-xl text-terra-secondary">
              Configure Slack notifications to keep your team updated on environmental impact tracking.
            </p>
          </div>
          
          {/* no refresh UI needed */}
        </div>
      </motion.div>

      {/* Slack Integration */}
      <SlackIntegration 
        isConnected={isConnected} 
        onConnectionChange={handleConnectionChange} 
      />
    </div>
  );
};

export default SlackPage;
