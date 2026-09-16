import {
  TrendingUp, Brain, ShieldCheck, GitBranch, AlertTriangle, Zap, FlaskConical,
} from 'lucide-react';

const ICON_MAP: Record<string, typeof TrendingUp> = {
  TrendingUp, Brain, ShieldCheck, GitBranch, AlertTriangle, Zap, FlaskConical,
};

const STAGES = [
  { id: 'predict', label: 'Predict', icon: 'TrendingUp', desc: 'AI demand forecast' },
  { id: 'explain', label: 'Explain', icon: 'Brain', desc: 'Why this prediction' },
  { id: 'check', label: 'Check', icon: 'ShieldCheck', desc: 'Capacity constraints' },
  { id: 'trace', label: 'Trace', icon: 'GitBranch', desc: 'Resource ripple' },
  { id: 'warn', label: 'Warn', icon: 'AlertTriangle', desc: 'Collision prediction' },
  { id: 'act', label: 'Act', icon: 'Zap', desc: 'Minimum action' },
  { id: 'simulate', label: 'Simulate', icon: 'FlaskConical', desc: 'What-if scenarios' },
];

export function IntelligencePipeline({ activeStage = 1 }: { activeStage?: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-thin pb-2">
        {STAGES.map((stage, i) => {
          const Icon = ICON_MAP[stage.icon];
          const isActive = i === activeStage;
          const isDone = i < activeStage;
          return (
            <div key={stage.id} className="flex items-center shrink-0">
              <div
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  isActive ? 'bg-navy-900 text-white shadow-lg scale-105' :
                  isDone ? 'bg-navy-100 text-navy-700' : 'bg-white border border-navy-100 text-navy-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : isDone ? 'text-navy-600' : 'text-navy-300'}`} />
                <span className={`text-xs font-semibold ${isActive ? 'text-white' : isDone ? 'text-navy-700' : 'text-navy-400'}`}>
                  {stage.label}
                </span>
                <span className={`text-[10px] hidden sm:block ${isActive ? 'text-navy-200' : 'text-navy-300'}`}>
                  {stage.desc}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`w-4 sm:w-8 h-0.5 mx-0.5 ${isDone ? 'bg-navy-300' : 'bg-navy-100'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
