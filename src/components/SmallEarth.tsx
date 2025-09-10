import { useEffect, useRef } from 'react';

const SmallEarth = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    canvas.width = size;
    canvas.height = size;
    const radius = size * 0.4;

    let rotation = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);

      // Create realistic Earth with proper shading
      const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius * 1.2);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue highlight
      gradient.addColorStop(0.3, '#4682B4'); // Steel blue
      gradient.addColorStop(0.7, '#2E8B57'); // Sea green
      gradient.addColorStop(1, '#1B4D3E'); // Dark green
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Add realistic continents with rotation
      ctx.save();
      ctx.rotate(rotation);
      
      // North America
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.4, -radius * 0.1, radius * 0.25, radius * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Europe/Africa
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.ellipse(radius * 0.1, radius * 0.2, radius * 0.2, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Asia
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.ellipse(radius * 0.3, -radius * 0.05, radius * 0.3, radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Australia
      ctx.fillStyle = '#32CD32';
      ctx.beginPath();
      ctx.ellipse(radius * 0.2, radius * 0.4, radius * 0.15, radius * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      // Add atmospheric glow
      const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius * 1.3);
      glowGradient.addColorStop(0, 'rgba(135, 206, 235, 0.1)');
      glowGradient.addColorStop(1, 'rgba(135, 206, 235, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle rim lighting
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      rotation += 0.002; // Very slow rotation
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-30 h-30 drop-shadow-lg" />
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-green-400/20 blur-sm animate-pulse"></div>
    </div>
  );
};

export default SmallEarth;


