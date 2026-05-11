import React from 'react';

export type BadgeVariant = 'present' | 'absent' | 'late' | 'complete' | 'pending' | 'neutral';

const variantStyles: Record<BadgeVariant, string> = {
  present: 'bg-success/10 text-success border border-success/20',
  absent: 'bg-danger/10 text-danger border border-danger/20',
  late: 'bg-warning/10 text-warning border border-warning/20',
  complete: 'bg-primary/10 text-primary border border-primary/20',
  pending: 'bg-muted text-muted-foreground border border-border',
  neutral: 'bg-secondary text-secondary-foreground border border-border',
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export default function Badge({ variant, label, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600 tracking-wide',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}