import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import BackNavigation from '../components/BackNavigation';
import GoogleCalendarIntegration from '../components/GoogleCalendarIntegration';
import { getCalendarStatus } from '../services/api';

const CalendarPage = () => {
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on component mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await getCalendarStatus();
      setIsConnected(!!status.connected);
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    localStorage.setItem('calendar-connected', connected.toString());
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
              <Calendar className="w-10 h-10 text-terra-accent" />
              <span>Calendar Integration</span>
            </h1>
            <p className="text-xl text-terra-secondary">
              View your upcoming events and track your environmental impact through calendar activities.
            </p>
          </div>
          
        </div>
      </motion.div>

      {/* Google Calendar Integration */}
      <GoogleCalendarIntegration 
        isConnected={isConnected} 
        onConnectionChange={handleConnectionChange} 
      />
    </div>
  );
};

export default CalendarPage;
