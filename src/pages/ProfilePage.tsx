import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Calendar, 
  Leaf, 
  Save, 
  Edit3,
  Target,
  TreePine,
  Zap,
  Settings
} from 'lucide-react';
import { useSession } from '@descope/react-sdk';
import BackNavigation from '../components/BackNavigation';

interface UserProfile {
  name: string;
  email: string;
  dob?: string;
  location: string;
  joinDate: string;
  ecoGoals: {
    monthlyTarget: number;
    treesPlanted: number;
    carbonOffset: number;
    energySaved: number;
  };
  preferences: {
    notifications: boolean;
    weeklyReports: boolean;
    goalReminders: boolean;
  };
}

const ProfilePage = () => {
  const { user } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    dob: '',
    location: '',
    joinDate: new Date().toLocaleDateString(),
    ecoGoals: {
      monthlyTarget: 50,
      treesPlanted: 0,
      carbonOffset: 0,
      energySaved: 0
    },
    preferences: {
      notifications: true,
      weeklyReports: true,
      goalReminders: true
    }
  });

  // Load profile data from localStorage on mount and when user changes
  useEffect(() => {
    const savedProfile = localStorage.getItem('ecoimpact-profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(prev => ({
          ...prev,
          ...parsed,
          email: user?.email || prev.email,
          name: parsed.name || user?.name || prev.name
        }));
      } catch (error) {
        console.error('Error parsing saved profile:', error);
      }
    }
  }, [user]);

  const handleSave = () => {
    localStorage.setItem('ecoimpact-profile', JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
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
              <User className="w-10 h-10 text-terra-accent" />
              <span>Profile Settings</span>
            </h1>
            <p className="text-xl text-terra-secondary">
              Manage your personal details and environmental goals.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-3 bg-terra-accent hover:bg-terra-accent/80 text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
          >
            <Edit3 className="w-5 h-5" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <User className="w-6 h-6 text-terra-accent" />
            <span>Personal Information</span>
          </h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="full-name" className="block text-terra-primary font-medium mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  id="full-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg">{profile.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email-address" className="block text-terra-primary font-medium mb-2">
                Email Address
              </label>
              {isEditing ? (
                <input
                  id="email-address"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg">{profile.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-terra-primary font-medium mb-2">
                Location
              </label>
              {isEditing ? (
                <input
                  id="location"
                  type="text"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your city, country"
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location || 'Not specified'}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="dob" className="block text-terra-primary font-medium mb-2">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  id="dob"
                  type="date"
                  value={profile.dob || ''}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg">{profile.dob || 'Not specified'}</p>
              )}
            </div>

            <div>
              <div className="block text-terra-primary font-medium mb-2">
                Member Since
              </div>
              <p className="text-terra-secondary text-lg flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{profile.joinDate}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Environmental Goals */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <Target className="w-6 h-6 text-terra-accent" />
            <span>Environmental Goals</span>
          </h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="monthly-target" className="block text-terra-primary font-medium mb-2">
                Monthly CO₂ Target (kg)
              </label>
              {isEditing ? (
                <input
                  id="monthly-target"
                  type="number"
                  value={profile.ecoGoals.monthlyTarget}
                  onChange={(e) => handleInputChange('ecoGoals.monthlyTarget', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg">{profile.ecoGoals.monthlyTarget} kg CO₂e</p>
              )}
            </div>

            <div>
              <label htmlFor="trees-planted" className="block text-terra-primary font-medium mb-2">
                Trees Planted
              </label>
              {isEditing ? (
                <input
                  id="trees-planted"
                  type="number"
                  value={profile.ecoGoals.treesPlanted}
                  onChange={(e) => handleInputChange('ecoGoals.treesPlanted', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg flex items-center space-x-2">
                  <TreePine className="w-4 h-4" />
                  <span>{profile.ecoGoals.treesPlanted}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="carbon-offset" className="block text-terra-primary font-medium mb-2">
                Carbon Offset (kg CO₂e)
              </label>
              {isEditing ? (
                <input
                  id="carbon-offset"
                  type="number"
                  value={profile.ecoGoals.carbonOffset}
                  onChange={(e) => handleInputChange('ecoGoals.carbonOffset', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg flex items-center space-x-2">
                  <Leaf className="w-4 h-4" />
                  <span>{profile.ecoGoals.carbonOffset}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="energy-saved" className="block text-terra-primary font-medium mb-2">
                Energy Saved (kWh)
              </label>
              {isEditing ? (
                <input
                  id="energy-saved"
                  type="number"
                  value={profile.ecoGoals.energySaved}
                  onChange={(e) => handleInputChange('ecoGoals.energySaved', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none transition-colors duration-300"
                />
              ) : (
                <p className="text-terra-secondary text-lg flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>{profile.ecoGoals.energySaved}</span>
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl lg:col-span-2"
        >
          <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
            <Settings className="w-6 h-6 text-terra-accent" />
            <span>Preferences</span>
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-terra-darker/50 rounded-lg">
              <div>
                <h4 className="text-terra-primary font-medium">Push Notifications</h4>
                <p className="text-terra-secondary text-sm">Get notified about your environmental impact</p>
              </div>
              <label htmlFor="notifications-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="notifications-toggle"
                  type="checkbox"
                  checked={profile.preferences.notifications}
                  onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terra-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terra-accent"></div>
                <span className="sr-only">Toggle notifications</span>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-terra-darker/50 rounded-lg">
              <div>
                <h4 className="text-terra-primary font-medium">Weekly Reports</h4>
                <p className="text-terra-secondary text-sm">Receive weekly environmental impact summaries</p>
              </div>
              <label htmlFor="weekly-reports-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="weekly-reports-toggle"
                  type="checkbox"
                  checked={profile.preferences.weeklyReports}
                  onChange={(e) => handleInputChange('preferences.weeklyReports', e.target.checked)}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terra-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terra-accent"></div>
                <span className="sr-only">Toggle weekly reports</span>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-terra-darker/50 rounded-lg">
              <div>
                <h4 className="text-terra-primary font-medium">Goal Reminders</h4>
                <p className="text-terra-secondary text-sm">Get reminded about your environmental goals</p>
              </div>
              <label htmlFor="goal-reminders-toggle" className="relative inline-flex items-center cursor-pointer">
                <input
                  id="goal-reminders-toggle"
                  type="checkbox"
                  checked={profile.preferences.goalReminders}
                  onChange={(e) => handleInputChange('preferences.goalReminders', e.target.checked)}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terra-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terra-accent"></div>
                <span className="sr-only">Toggle goal reminders</span>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 flex justify-end"
        >
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
