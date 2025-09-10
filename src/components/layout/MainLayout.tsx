import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDescope, useSession } from '@descope/react-sdk';
import { 
  Leaf, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Calculator,
  User,
  MessageSquare,
  Calendar,
  Settings
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { logout } = useDescope();
  const { user } = useSession();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboarding, setOnboarding] = useState({ name: '', location: '', dob: '' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ecoimpact-profile');
      if (!stored) {
        setShowOnboarding(true);
        return;
      }
      const p = JSON.parse(stored);
      if (!p?.name || !p?.location || !p?.dob) setShowOnboarding(true);
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Slack Notifications', href: '/slack', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: Settings },
  ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  const saveOnboarding = () => {
    if (!onboarding.name.trim() || !onboarding.location.trim() || !onboarding.dob) return;
    try {
      const existing = localStorage.getItem('ecoimpact-profile');
      const parsed = existing ? JSON.parse(existing) : {};
      const merged = { ...parsed, ...onboarding, name: onboarding.name.trim(), location: onboarding.location.trim() };
      localStorage.setItem('ecoimpact-profile', JSON.stringify(merged));
      setShowOnboarding(false);
    } catch {
      localStorage.setItem('ecoimpact-profile', JSON.stringify({ ...onboarding, name: onboarding.name.trim(), location: onboarding.location.trim() }));
      setShowOnboarding(false);
    }
  };

  return (
    <div className="min-h-screen bg-terra-dark">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-terra-panel/30 backdrop-blur-md border-r border-terra-panel-light/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-terra-panel-light/30">
          <div className="flex items-center space-x-3">
            <Leaf className="w-8 h-8 text-terra-accent" />
            <h1 className="text-xl font-bold text-terra-primary">EcoImpact Tracker</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-terra-secondary hover:text-terra-primary"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isCurrentPath(item.href)
                      ? 'bg-terra-accent/20 text-terra-accent border border-terra-accent/30'
                      : 'text-terra-secondary hover:text-terra-primary hover:bg-terra-panel/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-terra-panel-light/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-terra-accent/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-terra-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-terra-primary truncate">
                {user?.name ?? user?.email}
              </p>
              <p className="text-xs text-terra-secondary truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-terra-panel/30 backdrop-blur-md border-b border-terra-panel-light/30">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-terra-secondary hover:text-terra-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-terra-primary">
                {navigation.find(item => isCurrentPath(item.href))?.name ?? 'EcoImpact Tracker'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-terra-secondary">Welcome, {(() => {
                  try {
                    const stored = localStorage.getItem('ecoimpact-profile');
                    if (stored) {
                      const p = JSON.parse(stored);
                      return p?.name || user?.name || user?.email;
                    }
                  } catch {}
                  return user?.name || user?.email;
                })()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {showOnboarding && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md backdrop-blur-md bg-terra-panel/50 border border-terra-panel-light/50 rounded-2xl p-8 shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-terra-primary mb-4 text-center">Welcome! 🌍</h3>
                <p className="text-terra-secondary text-sm mb-6 text-center">Please enter your details to personalize your eco-journey.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ob-name" className="block text-terra-primary font-medium mb-2">Name</label>
                    <input
                      id="ob-name"
                      type="text"
                      placeholder="Enter your preferred name"
                      value={onboarding.name}
                      onChange={(e) => setOnboarding(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none placeholder-terra-secondary/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="ob-location" className="block text-terra-primary font-medium mb-2">Location</label>
                    <input
                      id="ob-location"
                      type="text"
                      placeholder="City, Country"
                      value={onboarding.location}
                      onChange={(e) => setOnboarding(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none placeholder-terra-secondary/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="ob-dob" className="block text-terra-primary font-medium mb-2">Date of Birth</label>
                    <input
                      id="ob-dob"
                      type="date"
                      value={onboarding.dob}
                      onChange={(e) => setOnboarding(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary focus:border-terra-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={saveOnboarding}
                      disabled={!onboarding.name.trim() || !onboarding.location.trim() || !onboarding.dob}
                      className="px-8 py-3 bg-gradient-to-r from-terra-accent to-terra-accent/80 hover:from-terra-accent/90 hover:to-terra-accent/70 text-terra-dark font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                    >
                      Start My Journey
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
