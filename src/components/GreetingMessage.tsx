import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Quote } from 'lucide-react';

const GreetingMessage = () => {
  const [currentGreeting, setCurrentGreeting] = useState('');
  const [currentQuote, setCurrentQuote] = useState('');

  // dynamic time-based greeting used instead of static list

  const ecoQuotes = [
    "The Earth does not belong to us; we belong to the Earth. - Chief Seattle",
    "In every walk with nature, one receives far more than they seek. - John Muir",
    "The environment is where we all meet; where we all have a mutual interest. - Lady Bird Johnson",
    "We do not inherit the earth from our ancestors; we borrow it from our children. - Native American Proverb",
    "The greatest threat to our planet is the belief that someone else will save it. - Robert Swan",
    "Nature is not a place to visit. It is home. - Gary Snyder",
    "The environment is everything that isn't me. - Albert Einstein",
    "What we are doing to the forests of the world is but a mirror reflection of what we are doing to ourselves. - Mahatma Gandhi",
    "The Earth is what we all have in common. - Wendell Berry",
    "Conservation is a state of harmony between men and land. - Aldo Leopold"
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getPreferredName = () => {
    try {
      const stored = localStorage.getItem('ecoimpact-profile');
      if (stored) {
        const p = JSON.parse(stored);
        return p?.name || '';
      }
    } catch {}
    return '';
  };

  useEffect(() => {
    // Set initial greeting and quote
    const name = getPreferredName();
    const prefix = getTimeGreeting();
    setCurrentGreeting(`${prefix}${name ? ', ' + name : ''}!`);
    setCurrentQuote(ecoQuotes[Math.floor(Math.random() * ecoQuotes.length)]);

    // Change greeting and quote every 30 seconds
    const interval = setInterval(() => {
      const nm = getPreferredName();
      const px = getTimeGreeting();
      setCurrentGreeting(`${px}${nm ? ', ' + nm : ''}!`);
      setCurrentQuote(ecoQuotes[Math.floor(Math.random() * ecoQuotes.length)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl mb-8"
    >
      <div className="text-center">
        <motion.div
          key={currentGreeting}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-bold text-terra-primary mb-2 flex items-center justify-center space-x-2">
            <Leaf className="w-6 h-6 text-terra-accent" />
            <span>{currentGreeting}</span>
          </h2>
        </motion.div>
        
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-start space-x-3">
            <Quote className="w-6 h-6 text-terra-accent mt-1 flex-shrink-0" />
            <p className="text-lg text-terra-secondary italic leading-relaxed">
              {currentQuote}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GreetingMessage;

