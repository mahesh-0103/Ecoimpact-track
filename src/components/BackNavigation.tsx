import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

interface BackNavigationProps {
  showHome?: boolean;
  customBackPath?: string;
  customBackLabel?: string;
}

const BackNavigation = ({ 
  showHome = true, 
  customBackPath, 
  customBackLabel = "Back" 
}: BackNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (customBackPath) {
      navigate(customBackPath);
    } else if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  // Don't show back navigation on login page or dashboard
  if (location.pathname === '/login' || location.pathname === '/') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 px-4 py-2 bg-terra-panel/30 hover:bg-terra-panel/50 border border-terra-panel-light/30 rounded-lg text-terra-primary transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{customBackLabel}</span>
        </button>
        
        {showHome && (
          <button
            onClick={handleHome}
            className="flex items-center space-x-2 px-4 py-2 bg-terra-accent/20 hover:bg-terra-accent/30 border border-terra-accent/30 rounded-lg text-terra-accent transition-all duration-300"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BackNavigation;

