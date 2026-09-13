import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border p-4 space-y-3",
        onClick && "cursor-pointer active:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-center text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function MobileCardHeader({ title, subtitle, badge, actions }: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex gap-1 shrink-0">{actions}</div>}
    </div>
  );
}
