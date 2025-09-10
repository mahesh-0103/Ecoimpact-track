import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDescope, useSession } from '@descope/react-sdk';
import { Calculator, Leaf, LogOut, Zap, Car, Trash2, Calendar, MessageSquare, Send, Clock, MapPin, Users } from 'lucide-react';
import { 
  calculateFootprint, 
  getCalendarEvents, 
  getCalendarStatus, 
  sendCarbonNotification, 
  getSlackChannels, 
  getSlackStatus,
  CalendarEvent,
  SlackChannel
} from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { logout } = useDescope();
  const { user } = useSession();
  const [requireProfile, setRequireProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ name: '', dob: '' });
  const [greeting, setGreeting] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ecoimpact-profile');
      if (stored) {
        const p = JSON.parse(stored);
        if (!p?.name || !p?.dob) setRequireProfile(true);
      } else {
        setRequireProfile(true);
      }
    } catch {
      setRequireProfile(true);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const saveTempProfile = () => {
    if (!tempProfile.name.trim() || !tempProfile.dob) return;
    try {
      const existing = localStorage.getItem('ecoimpact-profile');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = { ...parsed, name: tempProfile.name.trim(), dob: tempProfile.dob };
      localStorage.setItem('ecoimpact-profile', JSON.stringify(merged));
      setRequireProfile(false);
    } catch {
      localStorage.setItem('ecoimpact-profile', JSON.stringify({ name: tempProfile.name.trim(), dob: tempProfile.dob }));
      setRequireProfile(false);
    }
  };

  const [formData, setFormData] = useState({
    electricity: '',
    travel: '',
    waste: ''
  });
  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Integration states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [selectedSlackChannel, setSelectedSlackChannel] = useState('');
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);

  // Load integration status and data on component mount
  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      setIsLoadingIntegrations(true);
      
      // Check calendar status
      try {
        const calendarStatus = await getCalendarStatus();
        setCalendarConnected(calendarStatus.connected);
        if (calendarStatus.connected) {
          const events = await getCalendarEvents();
          setCalendarEvents(events.events);
        }
      } catch (error) {
        console.error('Calendar status check failed:', error);
        setCalendarConnected(false);
      }

      // Check Slack status
      try {
        const slackStatus = await getSlackStatus();
        setSlackConnected(slackStatus.connected);
        if (slackStatus.connected) {
          const channels = await getSlackChannels();
          setSlackChannels(channels.channels);
          if (channels.channels.length > 0) {
            setSelectedSlackChannel(channels.channels[0].id);
          }
        }
      } catch (error) {
        console.error('Slack status check failed:', error);
        setSlackConnected(false);
      }
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    
    try {
      const data = {
        electricity: parseFloat(formData.electricity) || 0,
        travel: parseFloat(formData.travel) || 0,
        waste: parseFloat(formData.waste) || 0,
      };
      
      const response = await calculateFootprint(data);
      setResult(response.footprint);
      
      // Send Slack notification if connected
      if (slackConnected && selectedSlackChannel && response.breakdown) {
        try {
          await sendCarbonNotification({
            footprint: response.footprint,
            breakdown: response.breakdown,
            channel: selectedSlackChannel
          });
        } catch (error) {
          console.error('Failed to send Slack notification:', error);
        }
      }
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-terra-dark via-terra-darker to-black">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-terra-accent rounded-full animate-pulse-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 backdrop-blur-md bg-terra-panel/30 border-b border-terra-panel-light/30"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Leaf className="w-8 h-8 text-terra-accent" />
            <h1 className="text-2xl font-bold text-terra-primary">Terra</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-terra-secondary">Welcome, {user?.name || user?.email}</span>
            <button
              onClick={clearAuthData}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600/50 hover:bg-red-600/70 text-white transition-all duration-300"
            >
              <span>Clear Auth Data</span>
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-terra-panel/50 hover:bg-terra-panel-light/50 text-terra-secondary hover:text-terra-primary transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-terra-primary mb-4">
            Carbon Footprint Calculator
          </h2>
          <p className="text-xl text-terra-secondary max-w-2xl mx-auto">
            Track your environmental impact across key areas and take the first step toward a more sustainable future.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-8 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 text-terra-primary font-medium mb-3">
                    <Zap className="w-5 h-5 text-terra-accent" />
                    <span>Monthly Electricity Usage (kWh)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.electricity}
                    onChange={(e) => handleInputChange('electricity', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter your monthly electricity usage"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3 text-terra-primary font-medium mb-3">
                    <Car className="w-5 h-5 text-terra-accent" />
                    <span>Monthly Travel Distance (km)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.travel}
                    onChange={(e) => handleInputChange('travel', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter your monthly travel distance"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3 text-terra-primary font-medium mb-3">
                    <Trash2 className="w-5 h-5 text-terra-accent" />
                    <span>Monthly Waste Generated (kg)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.waste}
                    onChange={(e) => handleInputChange('waste', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter your monthly waste generation"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isCalculating}
                className="w-full bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isCalculating ? (
                  <div className="animate-spin w-5 h-5 border-2 border-terra-dark border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    <span>Calculate Footprint</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Results Display */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-terra-primary mb-6 text-center">
              Your Carbon Impact
            </h3>
            
            {result !== null ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="text-center"
              >
                <div className="relative inline-block">
                  <div className="text-6xl font-bold text-terra-accent mb-4 animate-glow">
                    {result.toFixed(2)}
                  </div>
                  <div className="text-xl text-terra-secondary">
                    kg CO₂ per month
                  </div>
                </div>
                
                <div className="mt-8 space-y-3">
                  <div className="flex justify-between items-center text-terra-secondary">
                    <span>Annual Impact:</span>
                    <span className="text-terra-primary font-semibold">
                      {(result * 12).toFixed(2)} kg CO₂
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-terra-secondary">
                    <span>Trees needed to offset:</span>
                    <span className="text-terra-accent font-semibold">
                      {Math.ceil((result * 12) / 22)} trees/year
                    </span>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-lg bg-terra-accent/10 border border-terra-accent/30">
                  <p className="text-terra-secondary text-sm leading-relaxed">
                    Small changes in your daily habits can make a significant impact. 
                    Consider renewable energy, efficient transportation, and waste reduction.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center text-terra-secondary py-12">
                <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  Enter your consumption data and click calculate to see your environmental impact.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Integration Sections */}
        <div className="grid lg:grid-cols-2 gap-8 mt-12">
          {/* Google Calendar Integration */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-6 h-6 text-terra-accent" />
              <h3 className="text-2xl font-bold text-terra-primary">Google Calendar</h3>
              <div className={`w-3 h-3 rounded-full ${calendarConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>

            {calendarConnected ? (
              <div>
                <p className="text-terra-secondary mb-4">
                  Your upcoming events for the next 7 days:
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {calendarEvents.length > 0 ? (
                    calendarEvents.map((event, index) => (
                      <div key={`${event.id}-${index}`} className="p-3 bg-terra-darker/50 rounded-lg border border-terra-panel-light/30">
                        <div className="flex items-start space-x-3">
                          <Clock className="w-4 h-4 text-terra-accent mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-terra-primary font-medium truncate">{event.summary}</h4>
                            <p className="text-terra-secondary text-sm">
                              {new Date(event.start).toLocaleString()}
                            </p>
                            {event.location && (
                              <div className="flex items-center space-x-1 mt-1">
                                <MapPin className="w-3 h-3 text-terra-accent" />
                                <span className="text-terra-secondary text-xs truncate">{event.location}</span>
                              </div>
                            )}
                            {event.attendees > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Users className="w-3 h-3 text-terra-accent" />
                                <span className="text-terra-secondary text-xs">{event.attendees} attendees</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-terra-secondary text-center py-4">No upcoming events</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50 text-terra-secondary" />
                <p className="text-terra-secondary mb-4">
                  Connect your Google Calendar to see upcoming events
                </p>
                <p className="text-terra-secondary text-sm">
                  Go to your Descope account settings to connect Google Calendar
                </p>
              </div>
            )}
          </motion.div>

          {/* Slack Integration */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="w-6 h-6 text-terra-accent" />
              <h3 className="text-2xl font-bold text-terra-primary">Slack Notifications</h3>
              <div className={`w-3 h-3 rounded-full ${slackConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>

            {slackConnected ? (
              <div>
                <p className="text-terra-secondary mb-4">
                  Send carbon footprint updates to your team:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="slack-channel-select" className="block text-terra-primary font-medium mb-2">
                      Select Channel
                    </label>
                    <select
                      id="slack-channel-select"
                      value={selectedSlackChannel}
                      onChange={(e) => setSelectedSlackChannel(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    >
                      {slackChannels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name} {channel.is_private ? '(Private)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 bg-terra-accent/10 border border-terra-accent/30 rounded-lg">
                    <p className="text-terra-secondary text-sm">
                      💡 Carbon footprint calculations will automatically be sent to the selected channel
                    </p>
                  </div>

                  {result !== null && (
                    <div className="flex items-center space-x-2 text-terra-accent text-sm">
                      <Send className="w-4 h-4" />
                      <span>Last calculation sent to #{slackChannels.find(c => c.id === selectedSlackChannel)?.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50 text-terra-secondary" />
                <p className="text-terra-secondary mb-4">
                  Connect your Slack workspace to send notifications
                </p>
                <p className="text-terra-secondary text-sm">
                  Go to your Descope account settings to connect Slack
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Profile completion modal */}
      {requireProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md backdrop-blur-md bg-terra-panel/40 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-terra-primary mb-4">Complete your profile</h3>
            <p className="text-terra-secondary text-sm mb-4">Please enter your preferred name and date of birth to continue.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="pref-name" className="block text-terra-primary font-medium mb-2">Name</label>
                <input
                  id="pref-name"
                  type="text"
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="pref-dob" className="block text-terra-primary font-medium mb-2">Date of Birth</label>
                <input
                  id="pref-dob"
                  type="date"
                  value={tempProfile.dob}
                  onChange={(e) => setTempProfile(prev => ({ ...prev, dob: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={saveTempProfile}
                  disabled={!tempProfile.name.trim() || !tempProfile.dob}
                  className="px-6 py-3 bg-gradient-to-r from-terra-accent to-terra-accent/80 text-terra-dark font-semibold rounded-lg disabled:opacity-50"
                >
                  Save and Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Greeting */}
      <div className="mb-4">
        <span className="text-2xl font-semibold text-terra-primary">{greeting}</span>
      </div>
    </motion.div>
  );
};

export default Dashboard;