import { Radar, Clock, AlertTriangle } from 'lucide-react';
import { Panel, ScenarioActiveTag, SectionHeader, StatusPill, CapacityDot } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import type { StatusLevel } from '@/types';
import { RESOURCE_ORDER } from '@/data/demoData';

const STATUS_ORDER: Record<StatusLevel, number> = { safe: 0, watch: 1, high: 2, critical: 3 };

const TIME_COLS = [
  { key: 'now' as const, label: 'NOW' },
  { key: 'h24' as const, label: '+24H' },
  { key: 'h48' as const, label: '+48H' },
  { key: 'h72' as const, label: '+72H' },
];

export function CollisionRadar() {
  const { results, active, scenarioLabel } = useSimulation();
  const data = results.collisions;

  const earliest = data
    .filter((d) => d.earliestCollision !== null)
    .sort((a, b) => STATUS_ORDER[b.now] - STATUS_ORDER[a.now])[0];

  return (
    <Panel className="p-6">
      <SectionHeader
        title="72-Hour Resource Collision Radar"
        subtitle="When will each resource cross its safe capacity?"
        icon={<Radar className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-6 overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100">
              <th className="text-left py-2 px-3 font-display font-semibold text-navy-700">Resource</th>
              {TIME_COLS.map((col) => (
                <th key={col.key} className="text-center py-2 px-3 font-display font-semibold text-navy-700 text-xs">
                  {col.label}
                </th>
              ))}
              <th className="text-right py-2 px-3 font-display font-semibold text-navy-700">Earliest Collision</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.resource} className="border-b border-navy-50 hover:bg-navy-50/50 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <CapacityDot status={row.now} />
                    <span className="font-medium text-navy-800">{row.label}</span>
                  </div>
                </td>
                {TIME_COLS.map((col) => {
                  const status = row[col.key];
                  return (
                    <td key={col.key} className="text-center py-3 px-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                          status === 'safe' ? 'bg-emerald-50 text-emerald-600' :
                          status === 'watch' ? 'bg-amber-50 text-amber-600' :
                          status === 'high' ? 'bg-orange-50 text-orange-600' :
                          'bg-red-50 text-red-600'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  );
                })}
                <td className="text-right py-3 px-3">
                  {row.earliestCollision ? (
                    <span className="text-xs font-semibold text-navy-700 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {row.earliestCollision}
                    </span>
                  ) : (
                    <span className="text-xs text-navy-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {earliest && (
        <div className="mt-5 p-4 rounded-xl bg-navy-900 text-white flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-display font-semibold text-sm">Earliest Expected Collision</p>
            <p className="text-sm text-navy-200 mt-0.5">
              <span className="font-semibold text-white">{earliest.label}</span> — threshold crossing at{' '}
              <span className="font-semibold text-amber-300">{earliest.earliestCollision}</span>
            </p>
            <p className="text-xs text-navy-300 mt-1">{earliest.explanation}</p>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function CapacityMatrix() {
  const { results, active, scenarioLabel } = useSimulation();
  const resources = results.resources;
  const rows = RESOURCE_ORDER.map((k) => resources[k]);
  const violations = rows.filter((r) => r.required > r.available);

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Capacity Intelligence"
        subtitle="Real-time resource requirement vs. availability"
        icon={<Radar className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r) => {
          const gap = r.required - r.available;
          const isViolation = gap > 0;
          const pct = Math.min(100, Math.round((r.required / r.available) * 100));
          return (
            <div
              key={r.key}
              className={`p-4 rounded-xl border transition-all ${
                isViolation ? 'border-red-200 bg-red-50/30' : 'border-navy-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-navy-800">{r.label}</span>
                <StatusPill status={isViolation ? 'critical' : pct > 90 ? 'high' : pct > 75 ? 'watch' : 'safe'} />
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="font-display font-bold text-2xl text-navy-900">{r.required}</span>
                  <span className="text-xs text-navy-400 ml-1">required</span>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-xl text-navy-600">{r.available}</span>
                  <span className="text-xs text-navy-400 ml-1">avail.</span>
                </div>
              </div>
              <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isViolation ? 'bg-red-500' : pct > 90 ? 'bg-orange-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-navy-400">Gap: <strong className={isViolation ? 'text-red-600' : 'text-navy-600'}>{gap > 0 ? `+${gap}` : Math.abs(gap)}</strong></span>
                <span className="text-navy-400">Cap: {r.capacity}</span>
              </div>
            </div>
          );
        })}
      </div>

      {violations.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-sm font-semibold text-red-700">
            {violations.length} constraint violation{violations.length > 1 ? 's' : ''} detected
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            {violations.map((v) => v.label).join(', ')} — see Minimum Action Finder for recommended interventions.
          </p>
        </div>
      )}
    </Panel>
  );
}
