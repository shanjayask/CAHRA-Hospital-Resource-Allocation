import { IntelligencePipeline } from '@/components/IntelligencePipeline';
import { DecisionCore, SurgeIndex } from '@/components/SurgeIndex';
import { XAIExplanation, AIReasoningChain } from '@/components/XAIExplanation';
import { ResourceRipple, ResourceCascade } from '@/components/ResourceRipple';
import { CollisionRadar } from '@/components/CollisionRadar';
import { MinimumActionFinder } from '@/components/MinimumActionFinder';
import { ForecastChart } from '@/components/ForecastChart';
import { ResearchComparison } from '@/components/ResearchComparison';
import { SignalIntelligence } from '@/components/RecommendationAudit';

export function CommandCenterPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white p-6 sm:p-8">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="pill bg-white/10 text-white text-[10px] uppercase tracking-widest">Research Prototype</span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
            Constraint-Aware<br className="hidden sm:block" /> Multimodal AI
          </h1>
          <p className="text-navy-200 mt-2 text-sm sm:text-base">
            Dynamic Hospital Resource &amp; Bed Allocation — Predict, explain, check, trace, warn, act, simulate.
          </p>

          <div className="mt-6">
            <IntelligencePipeline activeStage={1} />
          </div>
        </div>
      </div>

      {/* Decision Core + Surge Index */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DecisionCore />
        </div>
        <SurgeIndex />
      </div>

      {/* Quick Story */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { q: 'What is happening?', a: 'Demand rising', color: 'text-navy-700' },
          { q: 'Why?', a: 'AI explanation', color: 'text-navy-600' },
          { q: 'What will break?', a: 'ICU + Nurses', color: 'text-orange-600' },
          { q: 'When?', a: '~48 hours', color: 'text-amber-600' },
          { q: 'What to do?', a: 'See recommendations', color: 'text-emerald-600' },
          { q: 'What if?', a: 'Test scenarios', color: 'text-navy-500' },
        ].map((item, i) => (
          <div key={i} className="p-3 bg-white border border-navy-100 rounded-xl animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="text-[10px] text-navy-400 uppercase tracking-wider font-semibold">{item.q}</p>
            <p className={`text-sm font-display font-semibold mt-1 ${item.color}`}>{item.a}</p>
          </div>
        ))}
      </div>

      {/* Forecast + Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastChart />
        <XAIExplanation />
      </div>

      {/* Reasoning Chain + Resource Ripple */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AIReasoningChain activeStage={3} />
        </div>
        <div className="lg:col-span-2">
          <ResourceRipple />
        </div>
      </div>

      {/* Collision Radar + Cascade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CollisionRadar />
        </div>
        <div className="lg:col-span-1">
          <ResourceCascade />
        </div>
      </div>

      {/* Minimum Action Finder + Signal Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MinimumActionFinder />
        <SignalIntelligence />
      </div>

      {/* Research Contribution */}
      <ResearchComparison />
    </div>
  );
}
