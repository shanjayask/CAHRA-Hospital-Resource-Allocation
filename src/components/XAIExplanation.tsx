import { Brain, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Panel, ScenarioActiveTag, InfluenceBar, SectionHeader } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import { DEMO_EXPLANATION } from '@/data/demoData';
import type { ExplanationFactor } from '@/types';

export function XAIExplanation() {
  const { results, active, scenarioLabel } = useSimulation();
  const peak = Math.max(...results.forecast.map((f) => f.demand));
  const factors: ExplanationFactor[] = DEMO_EXPLANATION;

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Why Did AI Predict This?"
        subtitle={`Contributing factors for ${peak} patient forecast`}
        icon={<Brain className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-6 space-y-5">
        {factors.map((f, i) => (
          <div key={f.feature} className="animate-slide-right" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-navy-800">{f.feature}</span>
              <span className={`flex items-center gap-1 text-xs font-semibold ${f.direction === 'positive' ? 'text-navy-600' : 'text-blue-500'}`}>
                {f.direction === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {f.direction === 'positive' ? 'Increases' : 'Decreases'} demand
              </span>
            </div>
            <InfluenceBar influence={f.influence} direction={f.direction} level={f.level} />
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-navy-50 rounded-xl">
        <p className="text-sm text-navy-700 leading-relaxed">
          <span className="font-semibold">Summary:</span> The forecast is primarily driven by{' '}
          <span className="font-semibold text-navy-900">{factors[0]?.feature.toLowerCase()}</span> and{' '}
          <span className="font-semibold text-navy-900">{factors[1]?.feature.toLowerCase()}</span>, together accounting for{' '}
          <span className="font-semibold text-navy-900">{(factors[0]?.influence ?? 0) + (factors[1]?.influence ?? 0)}%</span> of
          the prediction's influence. These factors push demand upward, indicating an incoming surge.
        </p>
      </div>

      {active && (
        <div className="mt-4 p-4 bg-navy-900 rounded-xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span className="font-display font-semibold text-sm">Scenario Impact Analysis</span>
          </div>
          <p className="text-sm text-navy-200 leading-relaxed">{results.explanation}</p>
        </div>
      )}
    </Panel>
  );
}

const REASONING_STAGES = [
  { label: 'Input Signals', desc: 'Multimodal data ingestion', icon: 'Radio' },
  { label: 'Feature Fusion', desc: 'Multimodal feature combination', icon: 'Layers' },
  { label: 'LSTM / CA-LSTM', desc: 'Temporal model inference', icon: 'Cpu' },
  { label: 'Demand Forecast', desc: 'Predicted patient demand', icon: 'TrendingUp' },
  { label: 'Capacity Check', desc: 'Compare forecast vs. capacity', icon: 'ShieldCheck' },
  { label: 'Constraint Detection', desc: 'Identify violations', icon: 'AlertOctagon' },
  { label: 'Resource Cascade', desc: 'Trace downstream impact', icon: 'GitBranch' },
  { label: 'Recommendation', desc: 'Generate minimum action', icon: 'Lightbulb' },
] as const;

export function AIReasoningChain({ activeStage = 3 }: { activeStage?: number }) {
  return (
    <Panel className="p-6">
      <SectionHeader
        title="AI Reasoning Chain"
        subtitle="End-to-end inference pipeline"
        icon={<Brain className="w-5 h-5" />}
      />
      <div className="mt-6 space-y-1">
        {REASONING_STAGES.map((stage, i) => {
          const isActive = i === activeStage;
          const isDone = i < activeStage;
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive ? 'bg-navy-600 text-white animate-glow-pulse' :
                    isDone ? 'bg-navy-200 text-navy-700' : 'bg-navy-50 text-navy-300'
                  }`}
                >
                  {i + 1}
                </div>
                {i < REASONING_STAGES.length - 1 && (
                  <div className={`w-0.5 h-6 ${isDone ? 'bg-navy-300' : 'bg-navy-100'}`} />
                )}
              </div>
              <div className={`flex-1 pb-1 ${isActive ? 'animate-fade-in' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isActive ? 'text-navy-900' : isDone ? 'text-navy-600' : 'text-navy-400'}`}>
                    {stage.label}
                  </span>
                  {isActive && <span className="pill bg-navy-100 text-navy-700 text-[10px]">Active</span>}
                </div>
                <p className={`text-xs ${isActive ? 'text-navy-600' : 'text-navy-300'}`}>{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
