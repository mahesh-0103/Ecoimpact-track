import { motion } from 'framer-motion';
import { Descope } from '@descope/react-sdk';
import Globe3D from './Globe3D';

const LoginScreen = () => {
  const flowId = import.meta.env.VITE_DESCOPE_FLOW_ID || 'sign-up-or-in-otp-or-social';
  
  // Debug logging
  console.log('LoginScreen Debug:', {
    flowId,
    env: import.meta.env.VITE_DESCOPE_FLOW_ID,
    projectId: import.meta.env.VITE_DESCOPE_PROJECT_ID
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen relative overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-terra-dark via-terra-darker to-black">
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-terra-accent rounded-full animate-pulse-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Branding */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center max-w-md"
          >
            <motion.h1
              className="text-6xl font-bold text-terra-primary mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Terra
            </motion.h1>
            <motion.p
              className="text-xl text-terra-secondary mb-8 leading-relaxed"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Track your environmental impact and join the mission to protect our planet from space to surface.
            </motion.p>
            <Globe3D />
          </motion.div>
        </div>

        {/* Right side - Login */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="w-full max-w-md"
          >
            <div className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-8 shadow-2xl">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <h2 className="text-2xl font-semibold text-terra-primary mb-6 text-center">
                  Begin Your Journey
                </h2>
                <div className="descope-container">
                  <Descope
                    flowId={flowId}
                    theme="dark"
                    style={{
                      '--descope-primary-color': '#64ffda',
                      '--descope-background-color': 'transparent',
                      '--descope-text-color': '#e6f1ff',
                      '--descope-border-radius': '12px',
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginScreen;