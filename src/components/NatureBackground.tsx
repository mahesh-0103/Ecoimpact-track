import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NatureBackground = () => {
  // Array of curated nature images (no duplicates)
  const imageUrls = useMemo(() => [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1502780402662-acc01917f4eb?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1476231682828-37e571bc172f?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80'
  ], []);

  // State for current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Preload images and cycle safely every 6 seconds
  useEffect(() => {
    let isMounted = true;
    const preload = imageUrls.map((src) => {
      const img = new Image();
      img.src = src;
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    Promise.all(preload).then(() => {
      if (!isMounted) return;
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
      }, 6000);
      (window as any).__nbgInterval = interval;
    });

    return () => {
      isMounted = false;
      if ((window as any).__nbgInterval) clearInterval((window as any).__nbgInterval);
    };
  }, [imageUrls.length]);

  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      key: `particle-${i}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Image slideshow with fade transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrls[currentImageIndex]})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
      </AnimatePresence>
     
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
     
      <div className="absolute inset-0 opacity-30">
        {particles.map((particle) => (
          <motion.div
            key={particle.key}
            className="absolute w-1 h-1 bg-green-300 rounded-full"
            style={{ left: particle.left, top: particle.top }}
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default NatureBackground;