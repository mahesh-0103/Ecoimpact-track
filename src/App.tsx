import { useEffect, useMemo } from 'react';
import { useSession } from '@descope/react-sdk';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CalculatorPage from './pages/CalculatorPage';
import CalendarPage from './pages/CalendarPage';
import SlackPage from './pages/SlackPage';
import ProfilePage from './pages/ProfilePage';
import AuthDebugger from './components/AuthDebugger';

function App() {
  const { isAuthenticated, isSessionLoading } = useSession();
  const profileIncomplete = useMemo(() => {
    try {
      const stored = localStorage.getItem('ecoimpact-profile');
      if (!stored) return true;
      const p = JSON.parse(stored);
      // Require name, location, and dob
      return !p?.name || !p?.location || !p?.dob;
    } catch {
      return true;
    }
  }, [isAuthenticated]);

  // Debug logging
  console.log('Auth Debug:', {
    isAuthenticated,
    isSessionLoading,
    localStorage: typeof window !== 'undefined' ? Object.keys(localStorage).filter(key => key.includes('descope')) : 'N/A',
    sessionStorage: typeof window !== 'undefined' ? Object.keys(sessionStorage).filter(key => key.includes('descope')) : 'N/A'
  });

  // Debug logging for authentication state
  useEffect(() => {
    console.log('Auth Debug:', {
      isAuthenticated,
      isSessionLoading,
      localStorage: typeof window !== 'undefined' ? Object.keys(localStorage).filter(key => key.includes('descope')) : 'N/A',
      sessionStorage: typeof window !== 'undefined' ? Object.keys(sessionStorage).filter(key => key.includes('descope')) : 'N/A'
    });
  }, [isAuthenticated, isSessionLoading]);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-terra-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-terra-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-terra-dark">
        <AnimatePresence mode="wait">
          <Routes>
            {isAuthenticated ? (
              // Protected routes - wrap in MainLayout
              <Route path="/" element={
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              } />
            ) : (
              // Public routes - redirect to login
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
            
            {/* Login route - only accessible when not authenticated */}
            {!isAuthenticated && (
              <Route path="/login" element={<LoginPage />} />
            )}
            
            {/* Protected routes */}
            {isAuthenticated && (
              <>
                <Route path="/calculator" element={
                  <MainLayout>
                    <CalculatorPage />
                  </MainLayout>
                } />
                <Route path="/calendar" element={
                  <MainLayout>
                    <CalendarPage />
                  </MainLayout>
                } />
                <Route path="/slack" element={
                  <MainLayout>
                    <SlackPage />
                  </MainLayout>
                } />
                <Route path="/profile" element={
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                } />
                {/* Redirect /login to / when authenticated */}
                <Route path="/login" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </AnimatePresence>
        
        {/* Auth Debugger - always visible for debugging */}
        <AuthDebugger />
      </div>
    </Router>
  );
}

export default App;