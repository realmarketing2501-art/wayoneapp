import { type LevelName, getLevelLabel, getLevelColorClass, getLevelBgClass } from '@/lib/levels';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface LevelBadgeProps {
  level: LevelName;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  customLabel?: string;
}

export function LevelBadge({ level, size = 'md', showIcon = true, customLabel }: LevelBadgeProps) {
  const label = customLabel ?? getLevelLabel(level);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        getLevelBgClass(level),
        getLevelColorClass(level),
        sizeClasses[size],
      )}
    >
      {showIcon && <Shield className={cn(size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5')} />}
      {label}
    </span>
  );
}
