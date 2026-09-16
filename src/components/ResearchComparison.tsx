import { Panel, SectionHeader } from '@/components/ui/Primitives';
import { GitCompare, Check, X } from 'lucide-react';
import { RESEARCH_TRADITIONAL, RESEARCH_OURS } from '@/data/demoData';

export function ResearchComparison() {
  const traditional = RESEARCH_TRADITIONAL;
  const ours = RESEARCH_OURS;

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Research Contribution"
        subtitle="Traditional forecasting vs. integrated constraint-aware decision support"
        icon={<GitCompare className="w-5 h-5" />}
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-navy-50/50 rounded-xl border border-navy-100">
          <h3 className="font-display font-semibold text-navy-700 mb-3 flex items-center gap-2">
            <X className="w-4 h-4 text-navy-400" />
            Traditional Forecasting
          </h3>
          <div className="space-y-2">
            {traditional.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-navy-500">
                <span className="w-1.5 h-1.5 rounded-full bg-navy-300" />
                {item}
              </div>
            ))}
            {ours.slice(1).map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-navy-300 line-through">
                <span className="w-1.5 h-1.5 rounded-full bg-navy-200" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-navy-900 text-white rounded-xl">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Our System
          </h3>
          <div className="space-y-2">
            {ours.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-navy-100">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-navy-300 mt-4 pt-3 border-t border-navy-700/50">
            Integrated constraint-aware decision support for hospital resource allocation.
          </p>
        </div>
      </div>
    </Panel>
  );
}
