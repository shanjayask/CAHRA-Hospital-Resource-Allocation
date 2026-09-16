import { Activity, Gauge } from 'lucide-react';
import { Panel, ScenarioActiveTag, StatusPill } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import { surgeLevel } from '@/data/demoData';

export function SurgeIndex() {
  const { results, active, scenarioLabel } = useSimulation();
  const score = results.surgeIndex;
  const { label, status } = surgeLevel(score);
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference * (1 - score / 100);
  const color =
    status === 'critical' ? '#ef4444' :
    status === 'high' ? '#f97316' :
    status === 'watch' ? '#f59e0b' : '#10b981';

  return (
    <Panel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">Dynamic Surge Index</h3>
        </div>
        {active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#eef2f7" strokeWidth="10" />
            <circle
              cx="80" cy="80" r="70" fill="none" stroke={color} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-5xl text-navy-900">{score}</span>
            <span className="text-sm text-navy-400 font-medium">/ 100</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        <StatusPill status={status} label={label} />
      </div>

      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { range: '0–25', label: 'Normal', color: 'text-emerald-600' },
          { range: '26–50', label: 'Watch', color: 'text-amber-600' },
          { range: '51–75', label: 'High', color: 'text-orange-600' },
          { range: '76–100', label: 'Critical', color: 'text-red-600' },
        ].map((t) => (
          <div key={t.range} className="text-xs">
            <span className={`font-semibold ${t.color}`}>{t.label}</span>
            <span className="block text-navy-300 mt-0.5">{t.range}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function DecisionCore() {
  const { results, active, scenarioLabel } = useSimulation();
  const surgeScore = results.surgeIndex;
  const peakForecast = Math.max(...results.forecast.map((f) => f.demand));
  const capacityRisk = surgeScore > 75 ? 'CRITICAL' : surgeScore > 50 ? 'HIGH' : surgeScore > 25 ? 'MEDIUM' : 'LOW';
  const riskStatus =
    capacityRisk === 'CRITICAL' ? 'critical' :
    capacityRisk === 'HIGH' ? 'high' :
    capacityRisk === 'MEDIUM' ? 'watch' : 'safe';
  const riskColor =
    riskStatus === 'critical' ? 'text-red-600' :
    riskStatus === 'high' ? 'text-orange-600' :
    riskStatus === 'watch' ? 'text-amber-600' : 'text-emerald-600';

  return (
    <Panel className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-navy-50 rounded-full -translate-y-12 translate-x-12 opacity-50" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5 text-navy-500" />
          <h3 className="font-display font-semibold text-navy-900">AI Decision Core</h3>
          {active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} className="ml-auto" /> : <span className="ml-auto" />}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center py-3">
            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Predicted Demand</p>
            <p className="font-display font-bold text-3xl text-navy-900">{peakForecast}</p>
            <p className="text-xs text-navy-400">patients</p>
          </div>
          <div className="text-center py-3 border-x border-navy-100">
            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Surge Index</p>
            <p className="font-display font-bold text-3xl text-navy-600">{surgeScore}</p>
            <p className="text-xs text-navy-400">/ 100</p>
          </div>
          <div className="text-center py-3">
            <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Capacity Risk</p>
            <p className={`font-display font-bold text-3xl ${riskColor}`}>{capacityRisk}</p>
            <StatusPill status={riskStatus} label="" />
          </div>
        </div>
      </div>
    </Panel>
  );
}
