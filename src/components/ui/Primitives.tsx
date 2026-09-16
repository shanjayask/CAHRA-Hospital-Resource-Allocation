import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { StatusLevel } from '@/types';

export function StatusPill({ status, label }: { status: StatusLevel; label?: string }) {
  const map = {
    safe: { cls: 'status-safe', icon: CheckCircle2 },
    watch: { cls: 'status-watch', icon: AlertCircle },
    high: { cls: 'status-high', icon: AlertTriangle },
    critical: { cls: 'status-critical', icon: AlertCircle },
  };
  const { cls, icon: Icon } = map[status];
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`pill border ${cls}`}>
      <Icon className="w-3 h-3" />
      {text}
    </span>
  );
}

export function DemoTag({ className = '' }: { className?: string }) {
  return <span className={`demo-badge ${className}`}>Demo Data</span>;
}

export function LiveTag({ className = '' }: { className?: string }) {
  return <span className={`live-badge ${className}`}>Live Data</span>;
}

export function ScenarioActiveTag({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-600 text-white ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse-soft" />
      Scenario Active{label ? ` · ${label}` : ''}
    </span>
  );
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-navy-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function Panel({
  children,
  className = '',
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={`${dark ? 'glass-panel-dark' : 'glass-panel'} ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  right,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-600 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-display font-semibold text-lg text-navy-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-navy-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function MetricValue({
  value,
  unit,
  size = 'md',
  className = '',
}: {
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };
  return (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className={`font-display font-bold text-navy-900 ${sizes[size]}`}>{value}</span>
      {unit && <span className="text-sm text-navy-400 font-medium">{unit}</span>}
    </div>
  );
}

export function GapBar({ required, available, label }: { required: number; available: number; label?: string }) {
  const ratio = available > 0 ? required / available : 1;
  const pct = Math.min(100, Math.round(ratio * 100));
  const color =
    ratio > 1 ? 'bg-red-500' : ratio > 0.9 ? 'bg-orange-500' : ratio > 0.75 ? 'bg-amber-500' : 'bg-emerald-500';
  const gap = Math.max(0, required - available);
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-navy-500 mb-1.5">
        <span>{label}</span>
        {gap > 0 && <span className="text-red-600 font-semibold">Shortage: {gap}</span>}
      </div>}
      <div className="h-2 bg-navy-50 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-navy-400 mt-1">
        <span>Required: {required}</span>
        <span>Available: {available}</span>
      </div>
    </div>
  );
}

export function InfluenceBar({ influence, direction, level }: {
  influence: number;
  direction: 'positive' | 'negative';
  level: string;
}) {
  const color = direction === 'positive' ? 'bg-navy-500' : 'bg-blue-400';
  const arrow = direction === 'positive' ? '↑' : '↓';
  const levelColor: Record<string, string> = {
    high: 'text-navy-700',
    medium: 'text-navy-600',
    moderate: 'text-navy-500',
    low: 'text-navy-400',
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="h-5 bg-navy-50 rounded overflow-hidden">
          <div
            className={`h-full ${color} rounded transition-all duration-700 flex items-center justify-end pr-1.5`}
            style={{ width: `${influence}%` }}
          >
            <span className="text-[10px] text-white font-bold">{arrow}</span>
          </div>
        </div>
      </div>
      <span className={`text-xs font-semibold ${levelColor[level]} w-24 text-right uppercase tracking-wide`}>
        {level}
      </span>
    </div>
  );
}

export function CapacityDot({ status }: { status: StatusLevel }) {
  const colors = {
    safe: 'bg-emerald-500',
    watch: 'bg-amber-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} animate-pulse-soft`} />
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy-400 mb-3">{icon}</div>
      <p className="font-display font-semibold text-navy-700">{title}</p>
      <p className="text-sm text-navy-400 mt-1">{subtitle}</p>
    </div>
  );
}
