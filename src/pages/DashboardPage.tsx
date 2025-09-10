import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Send, 
  Clock, 
  MapPin, 
  Users,
  BarChart3,
  Activity,
  Zap,
  Car,
  Trash2,
  Calculator,
  RefreshCw
} from 'lucide-react';
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
import { dataService, ActivityData, WeeklyData, MonthlySummary } from '../services/dataService';
import { addDemoData, clearDemoData } from '../utils/demoData';
import GreetingMessage from '../components/GreetingMessage';

const DashboardPage = () => {
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
  
  // Real data from data service
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    totalCo2: 0,
    activityCount: 0,
    averageDaily: 0,
    treesNeeded: 0
  });

  // Load integration status and data on component mount
  useEffect(() => {
    loadIntegrationStatus();
    loadUserData();
  }, []);

  // Remove legacy localStorage checks; rely on API status instead

  const loadUserData = () => {
    const recentActivities = dataService.getRecentActivities(7);
    const weekly = dataService.getWeeklyData();
    const monthly = dataService.getMonthlySummary();
    
    setActivities(recentActivities);
    setWeeklyData(weekly);
    setMonthlySummary(monthly);
  };

  // Refresh data when component becomes visible (user navigates back) or storage flags change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
        // Refresh integrations if updated elsewhere
        if (localStorage.getItem('calendar-last-updated')) {
          loadIntegrationStatus();
          localStorage.removeItem('calendar-last-updated');
        }
        if (localStorage.getItem('slack-last-updated')) {
          loadIntegrationStatus();
          localStorage.removeItem('slack-last-updated');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'calendar-last-updated' || e.key === 'slack-last-updated') {
        loadIntegrationStatus();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
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

  const loadCalendarEvents = async () => {
    try {
      // In a real implementation, you would fetch events from your API
      const mockEvents = [
        {
          id: '1',
          summary: 'Team Meeting',
          start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Conference Room A',
          attendees: 5
        },
        {
          id: '2',
          summary: 'Client Presentation',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: 'Office Building',
          attendees: 8
        }
      ];
      setCalendarEvents(mockEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const loadSlackChannels = async () => {
    try {
      // In a real implementation, you would fetch channels from your API
      const mockChannels = [
        { id: 'general', name: 'general', is_private: false },
        { id: 'sustainability', name: 'sustainability', is_private: false },
        { id: 'team-updates', name: 'team-updates', is_private: false }
      ];
      setSlackChannels(mockChannels);
      if (mockChannels.length > 0) {
        setSelectedSlackChannel(mockChannels[0].id);
      }
    } catch (error) {
      console.error('Error loading Slack channels:', error);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Car Travel': return <Car className="w-4 h-4" />;
      case 'Flight': return <Car className="w-4 h-4" />;
      case 'Electricity': return <Zap className="w-4 h-4" />;
      case 'Waste': return <Trash2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'Car Travel': return 'Car Travel';
      case 'Flight': return 'Flight';
      case 'Electricity': return 'Electricity';
      case 'Waste': return 'Waste';
      default: return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting Message */}
      <GreetingMessage />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-terra-primary mb-2">
              Welcome to your Carbon Dashboard
            </h1>
            <p className="text-xl text-terra-secondary">
              Track your environmental impact and work towards a more sustainable future.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { addDemoData(); loadUserData(); }}
              className="px-4 py-2 text-sm bg-terra-accent/20 hover:bg-terra-accent/30 text-terra-accent rounded-lg transition-colors duration-300"
              title="Add demo data"
            >
              Add Demo Data
            </button>
            <button
              onClick={() => { clearDemoData(); loadUserData(); }}
              className="px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors duration-300"
              title="Clear all data"
            >
              Clear Data
            </button>
            <button
              onClick={loadUserData}
              className="p-3 text-terra-secondary hover:text-terra-primary transition-colors duration-300 hover:bg-terra-panel/30 rounded-lg"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold text-terra-primary">{monthlySummary.totalCo2.toFixed(1)}</p>
              <p className="text-terra-secondary text-sm">kg CO₂e</p>
            </div>
            <div className="w-12 h-12 bg-terra-accent/20 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-terra-accent" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">This Week</p>
              <p className="text-3xl font-bold text-terra-primary">{dataService.getWeeklyTotal().toFixed(1)}</p>
              <p className="text-terra-secondary text-sm">kg CO₂e</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">Activities</p>
              <p className="text-3xl font-bold text-terra-primary">{monthlySummary.activityCount}</p>
              <p className="text-terra-secondary text-sm">This month</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-terra-secondary text-sm font-medium">Trees Needed</p>
              <p className="text-3xl font-bold text-terra-primary">{monthlySummary.treesNeeded}</p>
              <p className="text-terra-secondary text-sm">To offset</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Chart */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-terra-accent" />
            <span>Weekly Footprint</span>
          </h3>
          
          <div className="space-y-4">
            {weeklyData.length > 0 ? (
              weeklyData.map((day, index) => {
                const maxCo2 = Math.max(...weeklyData.map(d => d.co2), 1); // Avoid division by zero
                return (
                  <div key={`${day.date}-${index}`} className="flex items-center space-x-4">
                    <div className="w-12 text-terra-secondary font-medium">{day.date}</div>
                    <div className="flex-1 bg-terra-darker/50 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-terra-accent to-terra-accent/80 rounded-full transition-all duration-500"
                        style={{ width: `${(day.co2 / maxCo2) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 text-terra-primary font-semibold text-right">
                      {day.co2.toFixed(1)} kg
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-terra-secondary">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data for this week</p>
                <p className="text-sm">Start logging activities to see your weekly progress</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Calculator */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-terra-accent" />
            <span>Quick Calculator</span>
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center space-x-3 text-terra-primary font-medium mb-3">
                <Zap className="w-5 h-5 text-terra-accent" />
                <span>Electricity (kWh)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.electricity}
                onChange={(e) => handleInputChange('electricity', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                placeholder="Enter electricity usage"
              />
            </div>

            <div>
              <label className="flex items-center space-x-3 text-terra-primary font-medium mb-3">
                <Car className="w-5 h-5 text-terra-accent" />
                <span>Travel (miles)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.travel}
                onChange={(e) => handleInputChange('travel', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                placeholder="Enter travel distance"
              />
            </div>

            <div>
              <label className="flex items-center space-x-3 text-terra-primary font-medium mb-3">
                <Trash2 className="w-5 h-5 text-terra-accent" />
                <span>Waste (kg)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.waste}
                onChange={(e) => handleInputChange('waste', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                placeholder="Enter waste generated"
              />
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isCalculating ? (
                <div className="animate-spin w-5 h-5 border-2 border-terra-dark border-t-transparent rounded-full" />
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  <span>Calculate</span>
                </>
              )}
            </button>

            {result !== null && (
              <div className="mt-4 p-4 bg-terra-accent/10 border border-terra-accent/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-terra-accent mb-1">
                  {result.toFixed(2)} kg CO₂e
                </div>
                <div className="text-sm text-terra-secondary">
                  Estimated carbon footprint
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl mb-8"
      >
        <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
          <Activity className="w-6 h-6 text-terra-accent" />
          <span>Recent Activities</span>
        </h3>
        
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-terra-darker/50 rounded-lg border border-terra-panel-light/30"
              >
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <div className="text-terra-primary font-medium">{getActivityLabel(activity.type)}</div>
                    <div className="text-sm text-terra-secondary">
                      {activity.value} {activity.unit} • {activity.date}
                    </div>
                  </div>
                </div>
                <div className="text-terra-accent font-semibold">
                  {activity.co2.toFixed(2)} kg CO₂e
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-terra-secondary">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activities logged yet</p>
              <p className="text-sm">Start logging activities in the Calculator page</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Integration Status */}
      {isLoadingIntegrations ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl text-center"
        >
          <div className="animate-spin w-8 h-8 border-2 border-terra-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-terra-secondary">Loading integrations...</p>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
        {/* Google Calendar Integration */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
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
              <p className="text-terra-secondary text-sm mb-4">
                Go to the Calendar page to connect your Google Calendar
              </p>
              <a
                href="/calendar"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-terra-accent/20 hover:bg-terra-accent/30 text-terra-accent rounded-lg transition-colors duration-300"
              >
                <Calendar className="w-4 h-4" />
                <span>Connect Calendar</span>
              </a>
            </div>
          )}
        </motion.div>

        {/* Slack Integration */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
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
              <p className="text-terra-secondary text-sm mb-4">
                Go to the Slack page to connect your workspace
              </p>
              <a
                href="/slack"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-terra-accent/20 hover:bg-terra-accent/30 text-terra-accent rounded-lg transition-colors duration-300"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Connect Slack</span>
              </a>
            </div>
          )}
        </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
