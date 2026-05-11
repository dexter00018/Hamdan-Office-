import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: LucideIcon;
  variant: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

const variantStyles: Record<MetricCardProps['variant'], { card: string; icon: string; value: string }> = {
  default: {
    card: 'bg-card border-border',
    icon: 'bg-primary/10 text-primary',
    value: 'text-foreground',
  },
  success: {
    card: 'bg-success/5 border-success/20',
    icon: 'bg-success/10 text-success',
    value: 'text-success',
  },
  danger: {
    card: 'bg-danger/5 border-danger/20',
    icon: 'bg-danger/10 text-danger',
    value: 'text-danger',
  },
  warning: {
    card: 'bg-warning/5 border-warning/20',
    icon: 'bg-warning/10 text-warning',
    value: 'text-warning',
  },
  info: {
    card: 'bg-primary/5 border-primary/20',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
};

export default function MetricCard({
  label,
  value,
  subtext,
  trend,
  trendValue,
  icon: Icon,
  variant,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={['rounded-[var(--radius)] border p-5 shadow-card transition-all duration-150 hover:shadow-elevated', styles.card].join(' ')}>
      <div className="flex items-start justify-between mb-3">
        <div className={['w-9 h-9 rounded-lg flex items-center justify-center', styles.icon].join(' ')}>
          <Icon className="w-4.5 h-4.5" size={18} />
        </div>
        {trend && trendValue && (
          <div
            className={[
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              trend === 'up' ? 'text-success bg-success/10' : trend === 'down' ? 'text-danger bg-danger/10' : 'text-muted-foreground bg-muted',
            ].join(' ')}
          >
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className={['text-3xl font-bold font-tabular leading-none mb-1', styles.value].join(' ')}>
        {value}
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}