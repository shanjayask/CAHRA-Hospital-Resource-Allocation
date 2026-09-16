import { Zap, Check, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';
import { Panel, ScenarioActiveTag, SectionHeader, StatusPill } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import { RESOURCE_ORDER } from '@/data/demoData';

export function MinimumActionFinder() {
  const { results, active, scenarioLabel } = useSimulation();
  const resources = results.resources;
  const actions = results.actions;
  const recommendedId = results.recommendedActionId;

  const violations = RESOURCE_ORDER.filter((k) => resources[k].required > resources[k].available);
  const recommended = actions.find((a) => a.id === recommendedId);

  if (violations.length === 0) {
    return (
      <Panel className="p-6">
        <SectionHeader
          title="Minimum Action Finder"
          subtitle="Smallest feasible intervention to resolve all constraints"
          icon={<Zap className="w-5 h-5" />}
          right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
        />
        <div className="mt-6 p-6 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
          <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-display font-semibold text-emerald-700">All Constraints Satisfied</p>
          <p className="text-sm text-emerald-600 mt-1">No interventions required under the current scenario.</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Minimum Action Finder"
        subtitle="Smallest feasible intervention to resolve all constraints"
        icon={<Zap className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-5 p-4 bg-red-50 rounded-xl border border-red-100">
        <p className="text-sm font-semibold text-red-700 mb-2">Current Constraint Violations</p>
        <div className="space-y-1">
          {violations.map((k) => {
            const r = resources[k];
            return (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-red-600">{r.label}</span>
                <span className="text-red-700 font-semibold">
                  Required: {r.required} / Available: {r.available} / Shortage: {r.required - r.available}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {actions.map((action) => {
          const isRecommended = action.id === recommendedId;
          return (
            <div
              key={action.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isRecommended ? 'border-navy-500 bg-navy-50/50 ring-2 ring-navy-200' : 'border-navy-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isRecommended ? 'bg-navy-600 text-white' : 'bg-navy-100 text-navy-600'
                  }`}>
                    {action.id}
                  </span>
                  <span className="font-display font-semibold text-navy-900">{action.label}</span>
                  {isRecommended && (
                    <span className="pill bg-navy-600 text-white text-[10px]">
                      <Sparkles className="w-3 h-3" /> Recommended
                    </span>
                  )}
                </div>
                <StatusPill status={action.result === 'safe' ? 'safe' : 'watch'} label={action.result === 'safe' ? 'Resolves' : 'Partial'} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {action.actions.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-50 rounded-lg text-sm font-semibold text-navy-700">
                    +{a.delta} {a.label}
                    {i < action.actions.length - 1 && <ArrowRight className="w-3 h-3 text-navy-300 ml-1" />}
                  </span>
                ))}
                <ArrowRight className="w-4 h-4 text-navy-300" />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg text-sm font-semibold text-emerald-700">
                  <Check className="w-3.5 h-3.5" /> {action.result === 'safe' ? 'All constraints satisfied' : 'Partial'}
                </span>
              </div>
              <p className="text-xs text-navy-500 mt-2">{action.reason}</p>
            </div>
          );
        })}
      </div>

      {recommended && (
        <div className="mt-5 p-4 bg-navy-900 rounded-xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="font-display font-semibold text-sm">Recommended Minimum Action</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {recommended.actions.map((a, i) => (
              <span key={i} className="px-3 py-1 bg-white/10 rounded-lg text-sm font-semibold">
                +{a.delta} {a.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-navy-200">{recommended.reason}</p>
          <p className="text-[10px] text-navy-400 mt-2 italic">
            Decision-support simulation — not autonomous clinical advice.
          </p>
        </div>
      )}
    </Panel>
  );
}
