import { useState, useEffect } from 'react';
import { Lightbulb, Clock, Target, TrendingUp, ScrollText, Radio, Layers, Cpu, GitBranch, AlertOctagon, Info } from 'lucide-react';
import { Panel, ScenarioActiveTag, SectionHeader } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import { MULTIMODAL_SIGNALS, DEMO_AUDIT_LOG } from '@/data/demoData';
import { getAuditLogs } from '@/services/supabaseService';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { AuditEntry } from '@/types';

export function RecommendationPanel() {
  const { results, active, scenarioLabel } = useSimulation();
  const recommendations = results.recommendations;

  return (
    <Panel className="p-6">
      <SectionHeader
        title="What Should the Hospital Do?"
        subtitle="AI-generated decision-support recommendations"
        icon={<Lightbulb className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-5 space-y-4">
        {recommendations.map((rec, i) => (
          <div key={i} className="p-4 bg-navy-50/50 rounded-xl border border-navy-100 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-navy-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">
                    <Target className="w-3 h-3" /> Action
                  </div>
                  <p className="text-sm font-semibold text-navy-900">{rec.what}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">
                    <TrendingUp className="w-3 h-3" /> Why
                  </div>
                  <p className="text-sm text-navy-700">{rec.why}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">
                    <Clock className="w-3 h-3" /> When
                  </div>
                  <p className="text-sm text-navy-700">{rec.when}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 uppercase tracking-wider mb-1">
                    <Target className="w-3 h-3" /> Impact
                  </div>
                  <p className="text-sm text-navy-700">{rec.impact}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div className="mt-4 p-4 bg-navy-900 rounded-xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span className="font-display font-semibold text-sm">Scenario Explanation</span>
          </div>
          <p className="text-sm text-navy-200 leading-relaxed">{results.explanation}</p>
        </div>
      )}

      <p className="text-[11px] text-navy-400 mt-4 italic">
        Academic decision-support prototype — not autonomous clinical advice.
      </p>
    </Panel>
  );
}

export function DecisionAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>(DEMO_AUDIT_LOG);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setLoadingAudit(true);
    getAuditLogs(50)
      .then((rows) => {
        if (rows.length > 0) {
          const mapped: AuditEntry[] = rows.map((r) => ({
            id: r.id ?? 'aud-unknown',
            timestamp: r.timestamp
              ? new Date(r.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
              : '—',
            inputSignals: ['admissions', 'occupancy', 'AQI', 'calendar', 'weather'],
            model: 'HistGradientBoostingRegressor',
            prediction: r.prediction ?? '—',
            constraintResult: r.planning_level ?? '—',
            recommendation: r.action ?? '—',
            explanation: `Action: ${r.action ?? '—'}. Scenario: ${r.scenario ?? '—'}. Planning level: ${r.planning_level ?? '—'}.`,
          }));
          setEntries(mapped);
        }
      })
      .catch(() => {/* silently keep demo data */})
      .finally(() => setLoadingAudit(false));
  }, []);

  return (
    <Panel className="p-6">
      <SectionHeader
        title="AI Decision Audit"
        subtitle="Timestamped record of every prediction, constraint, and recommendation"
        icon={<ScrollText className="w-5 h-5" />}
        right={
          isSupabaseConfigured
            ? <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Live · Supabase</span>
            : <span className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider">Demo Data</span>
        }
      />

      {loadingAudit && (
        <div className="mt-4 flex items-center gap-2 text-xs text-navy-400">
          <span className="inline-block w-3 h-3 border-2 border-navy-300 border-t-transparent rounded-full animate-spin" />
          Loading audit logs…
        </div>
      )}

      <div className="mt-5 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 bg-white border border-navy-100 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-navy-500">{entry.id}</span>
              <span className="text-xs font-medium text-navy-400">{entry.timestamp}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Model</span>
                <p className="text-navy-800 font-medium">{entry.model}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Prediction</span>
                <p className="text-navy-800">{entry.prediction}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Constraint Result</span>
                <p className="text-navy-800">{entry.constraintResult}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Recommendation</span>
                <p className="text-navy-800">{entry.recommendation}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Input Signals</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {entry.inputSignals.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-navy-50 text-navy-600 rounded text-xs font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Explanation</span>
                <p className="text-navy-700 text-sm mt-0.5">{entry.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function SignalIntelligence() {
  const icons: Record<string, typeof Radio> = {
    admissions: Radio,
    occupancy: Layers,
    calendar: Clock,
    weather: Cpu,
    traffic: GitBranch,
  };

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Multimodal Signal Intelligence"
        subtitle="Data sources feeding the AI demand forecast"
        icon={<Radio className="w-5 h-5" />}
      />

      <div className="mt-5 space-y-2.5">
        {MULTIMODAL_SIGNALS.map((signal) => {
          const Icon = icons[signal.icon] ?? Radio;
          return (
            <div key={signal.name} className="flex items-center gap-3 p-3 bg-white border border-navy-100 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-navy-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy-800">{signal.name}</span>
                </div>
                <p className="text-xs text-navy-400">{signal.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-display font-bold text-lg text-navy-700">{signal.contribution}%</span>
                <p className="text-[10px] text-navy-400">contribution</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-navy-50 rounded-xl flex items-center gap-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-navy-500" />
          <span className="text-xs font-semibold text-navy-700">Multimodal AI Engine</span>
        </div>
        <span className="text-navy-300">→</span>
        <span className="text-xs font-semibold text-navy-600">Demand Forecast</span>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Verified evaluation results from CAHRA Colab training run.
// Source: Real hospital dataset, chronological held-out test split.
// Model:  CAHRA_gradient_boosting_model.pkl (HistGradientBoostingRegressor)
// These values are NOT computed at runtime and must NOT be changed without
// re-running the full evaluation pipeline on the original dataset.
// ─────────────────────────────────────────────────────────────────────────────
const VERIFIED_METRICS = {
  validationSet: {
    label: 'Validation Set',
    model: 'CAHRA — Gradient Boosting',
    mae: 5.6937,
    rmse: 7.5599,
    mse: 57.15,
    r2: 0.4924,
  },
  testSet: {
    cahra: {
      label: 'Held-Out Chronological Test Set',
      model: 'CAHRA — Gradient Boosting',
      mae: 5.7882,
      rmse: 7.6885,
      mse: 59.11,
      r2: -0.2828,
    },
    baseline: {
      label: 'Held-Out Chronological Test Set',
      model: 'Persistence Baseline',
      mae: 3.77,
      rmse: 7.77,
      mse: 60.37,
      r2: -0.2508,
    },
  },
} as const;

function MetricCell({ value, highlight = false }: { value: number; highlight?: boolean }) {
  return (
    <td className={`text-right py-2.5 px-3 font-mono text-sm ${highlight ? 'font-semibold text-emerald-700' : 'text-navy-600'}`}>
      {value}
    </td>
  );
}

export function ModelComparison() {
  const { cahra: cahraTest, baseline } = VERIFIED_METRICS.testSet;
  const validation = VERIFIED_METRICS.validationSet;

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Model Performance"
        subtitle="Verified evaluation results — real hospital dataset"
        icon={<Cpu className="w-5 h-5" />}
        right={
          <span className="pill bg-navy-100 text-navy-600 text-[10px] font-semibold uppercase tracking-widest">
            Verified Results
          </span>
        }
      />

      {/* ── Held-Out Chronological Test Set ─────────────────────── */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-navy-400 inline-block" />
          Held-Out Chronological Test Set
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100">
                <th className="text-left py-2 px-3 font-display font-semibold text-navy-700 text-xs">Model</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">MAE</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">RMSE</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">MSE</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">R²</th>
              </tr>
            </thead>
            <tbody>
              {/* Persistence Baseline */}
              <tr className="border-b border-navy-50">
                <td className="py-2.5 px-3 text-sm font-medium text-navy-700">
                  {baseline.model}
                  <span className="ml-2 pill bg-navy-100 text-navy-500 text-[9px]">Baseline</span>
                </td>
                <MetricCell value={baseline.mae} />
                <MetricCell value={baseline.rmse} />
                <MetricCell value={baseline.mse} />
                <MetricCell value={baseline.r2} />
              </tr>
              {/* CAHRA Test */}
              <tr className="border-b border-navy-50 bg-navy-50/30">
                <td className="py-2.5 px-3 text-sm font-medium text-navy-800">
                  {cahraTest.model}
                  <span className="ml-2 pill bg-navy-200 text-navy-700 text-[9px]">CAHRA</span>
                </td>
                <MetricCell value={cahraTest.mae} />
                <MetricCell value={cahraTest.rmse} />
                <MetricCell value={cahraTest.mse} />
                <MetricCell value={cahraTest.r2} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Validation Set ──────────────────────────────────────── */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Validation Set
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100">
                <th className="text-left py-2 px-3 font-display font-semibold text-navy-700 text-xs">Model</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">MAE</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">RMSE</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">MSE</th>
                <th className="text-right py-2 px-3 font-display font-semibold text-navy-700 text-xs">R²</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-navy-50 bg-emerald-50/30">
                <td className="py-2.5 px-3 text-sm font-medium text-emerald-800">
                  {validation.model}
                  <span className="ml-2 pill bg-emerald-100 text-emerald-700 text-[9px]">CAHRA</span>
                </td>
                <MetricCell value={validation.mae} highlight />
                <MetricCell value={validation.rmse} highlight />
                <MetricCell value={validation.mse} highlight />
                <MetricCell value={validation.r2} highlight />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Evaluation Notes ────────────────────────────────────── */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1.5">
        <p className="text-xs font-semibold text-amber-800">Evaluation Notes</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>Algorithm: HistGradientBoostingRegressor (300 iterations, 22 features)</li>
          <li>Test split: chronological held-out set — no data leakage</li>
          <li>Persistence Baseline: predicts next-day admissions = today's admissions</li>
          <li>Negative R² on test set indicates the model does not outperform the baseline on this split</li>
          <li>Training dataset and Colab notebooks not bundled with this repository</li>
        </ul>
      </div>
    </Panel>
  );
}

