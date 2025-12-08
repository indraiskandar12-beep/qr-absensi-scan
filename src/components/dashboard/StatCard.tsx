import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant: 'blue' | 'green' | 'yellow' | 'red' | 'orange';
  subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, variant, subtitle }: StatCardProps) => {
  const variantClasses = {
    blue: 'stat-card-blue',
    green: 'stat-card-green',
    yellow: 'stat-card-yellow',
    red: 'stat-card-red',
    orange: 'stat-card-orange',
  };

  return (
    <div className={cn('stat-card', variantClasses[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-4xl font-bold mb-1">{value}</p>
          <p className="text-sm opacity-90">{title}</p>
          {subtitle && (
            <p className="text-xs opacity-75 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
