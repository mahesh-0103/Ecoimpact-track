import { lazy, Suspense } from 'react';

// Lazy load icons to reduce initial bundle size
const iconMap = {
  Leaf: lazy(() => import('lucide-react/dist/esm/icons/leaf')),
  LogOut: lazy(() => import('lucide-react/dist/esm/icons/log-out')),
  Menu: lazy(() => import('lucide-react/dist/esm/icons/menu')),
  X: lazy(() => import('lucide-react/dist/esm/icons/x')),
  Home: lazy(() => import('lucide-react/dist/esm/icons/home')),
  Calculator: lazy(() => import('lucide-react/dist/esm/icons/calculator')),
  User: lazy(() => import('lucide-react/dist/esm/icons/user')),
  Car: lazy(() => import('lucide-react/dist/esm/icons/car')),
  Plane: lazy(() => import('lucide-react/dist/esm/icons/plane')),
  Zap: lazy(() => import('lucide-react/dist/esm/icons/zap')),
  Trash2: lazy(() => import('lucide-react/dist/esm/icons/trash-2')),
  TrendingUp: lazy(() => import('lucide-react/dist/esm/icons/trending-up')),
  Save: lazy(() => import('lucide-react/dist/esm/icons/save')),
  Calendar: lazy(() => import('lucide-react/dist/esm/icons/calendar')),
  MessageSquare: lazy(() => import('lucide-react/dist/esm/icons/message-square')),
  Send: lazy(() => import('lucide-react/dist/esm/icons/send')),
  Clock: lazy(() => import('lucide-react/dist/esm/icons/clock')),
  MapPin: lazy(() => import('lucide-react/dist/esm/icons/map-pin')),
  Users: lazy(() => import('lucide-react/dist/esm/icons/users')),
  BarChart3: lazy(() => import('lucide-react/dist/esm/icons/bar-chart-3')),
  Activity: lazy(() => import('lucide-react/dist/esm/icons/activity')),
} as const;

type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  [key: string]: any;
}

const Icon = ({ name, className = '', size = 24, ...props }: IconProps) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <Suspense fallback={<div className={`animate-pulse bg-terra-accent/20 rounded ${className}`} style={{ width: size, height: size }} />}>
      <IconComponent 
        className={className} 
        size={size} 
        {...props} 
      />
    </Suspense>
  );
};

export default Icon;



