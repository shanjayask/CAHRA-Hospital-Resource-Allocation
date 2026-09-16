import { Waves, ArrowDown, Users, Bed, HeartPulse, Stethoscope, Wind } from 'lucide-react';
import { Panel, ScenarioActiveTag, SectionHeader, StatusPill } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import { statusFromGap, RESOURCE_ORDER } from '@/data/demoData';
import type { ResourceKey } from '@/types';

const ICONS: Record<string, typeof Users> = {
  patients: Users,
  beds: Bed,
  icu: HeartPulse,
  nurses: Stethoscope,
  ventilators: Wind,
};

const RESOURCE_ICON_KEY: Record<ResourceKey, string> = {
  beds: 'beds',
  icu: 'icu',
  nurses: 'nurses',
  doctors: 'nurses',
  ventilators: 'ventilators',
};

export function ResourceRipple() {
  const { params, results, active, scenarioLabel } = useSimulation();
  const { resources } = results;
  const baseDemand = 100;
  const patientDemand = params.patientDemand;
  const delta = patientDemand - baseDemand;
  const pct = baseDemand > 0 ? Math.round((delta / baseDemand) * 100) : 0;
  const isSurge = delta > 0;

  const requirements = {
    beds: resources.beds.required,
    icu: resources.icu.required,
    nurses: resources.nurses.required,
    doctors: resources.doctors.required,
    ventilators: resources.ventilators.required,
  };
  const availability = {
    beds: params.bedAvailability,
    icu: params.icuAvailability,
    nurses: params.nurseAvailability,
    doctors: params.doctorAvailability,
    ventilators: params.ventilatorAvailability,
  };

  const nodes = [
    { key: 'patients', label: 'Patient Demand', icon: 'patients', required: patientDemand, available: patientDemand, unit: 'patients' },
    ...RESOURCE_ORDER.map((k) => ({
      key: k,
      label: resources[k].label,
      icon: RESOURCE_ICON_KEY[k],
      required: requirements[k],
      available: availability[k],
      unit: resources[k].unit,
    })),
  ];

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Resource Ripple Effect"
        subtitle="How a demand change propagates through hospital resources"
        icon={<Waves className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-5 p-3 bg-navy-50 rounded-xl flex items-center gap-3">
        <span className="font-display font-bold text-2xl text-navy-900">
          {isSurge ? '+' : ''}{delta}
        </span>
        <span className="text-sm text-navy-600">
          patients ({isSurge ? '+' : ''}{pct}%) → triggers cascade across {nodes.length - 1} resource layers
        </span>
      </div>

      <div className="mt-6 space-y-0">
        {nodes.map((node, i) => {
          const Icon = ICONS[node.icon] ?? Users;
          const status = i === 0 ? 'safe' as const : statusFromGap(node.required, node.available);
          const gap = Math.max(0, node.required - node.available);
          const isSource = i === 0;
          const resourceDelta = i > 0 ? node.required - (i === 1 ? 82 : i === 2 ? 22 : i === 3 ? 68 : i === 4 ? 24 : 15) : delta;
          return (
            <div key={node.key}>
              {i > 0 && (
                <div className="flex justify-center py-1">
                  <div className={`flex flex-col items-center ${isSurge ? 'animate-ripple-flow' : ''}`} style={{ animationDelay: `${i * 150}ms` }}>
                    <ArrowDown className={`w-4 h-4 ${isSurge ? 'text-navy-400' : 'text-navy-200'}`} />
                  </div>
                </div>
              )}
              <div
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isSource ? 'bg-navy-900 text-white' : 'bg-white border border-navy-100'
                } ${isSurge && !isSource ? 'ring-2 ring-navy-200 animate-fade-in' : ''}`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSource ? 'bg-white/10' : 'bg-navy-50'
                }`}>
                  <Icon className={`w-5 h-5 ${isSource ? 'text-white' : 'text-navy-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isSource ? 'text-white' : 'text-navy-900'}`}>
                      {node.label}
                    </span>
                    {isSource && <span className="pill bg-white/15 text-white text-[10px]">Source</span>}
                  </div>
                  <div className={`flex items-center gap-3 text-xs mt-0.5 ${isSource ? 'text-navy-200' : 'text-navy-400'}`}>
                    <span>Required: <strong className={isSource ? 'text-white' : 'text-navy-700'}>{node.required}</strong></span>
                    <span>Available: <strong className={isSource ? 'text-white' : 'text-navy-700'}>{node.available}</strong></span>
                    {gap > 0 && <span className="text-red-400 font-semibold">Gap: {gap}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!isSource && resourceDelta !== 0 && (
                    <span className={`text-xs font-bold ${isSurge ? 'text-navy-600' : 'text-blue-500'}`}>
                      {resourceDelta > 0 ? '+' : ''}{resourceDelta} {node.unit}
                    </span>
                  )}
                  {!isSource && <StatusPill status={status} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function ResourceCascade() {
  const { params, active, scenarioLabel } = useSimulation();
  const delta = params.patientDemand - 100;
  const cascade = [
    { label: '+ Patients', value: delta, color: 'text-navy-900' },
    { label: '+ Bed Demand', value: Math.round(delta * 0.6), color: 'text-navy-700' },
    { label: '+ ICU Demand', value: Math.round(delta * 0.13), color: 'text-navy-600' },
    { label: '+ Nurse Requirement', value: Math.round(delta * 0.27), color: 'text-navy-500' },
    { label: '+ Doctor Requirement', value: Math.round(delta * 0.08), color: 'text-navy-400' },
    { label: '+ Ventilator Requirement', value: Math.round(delta * 0.1), color: 'text-blue-500' },
  ];

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Resource Cascade"
        subtitle="Quantitative demand propagation"
        icon={<Waves className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />
      <div className="mt-5 space-y-0">
        {cascade.map((c, i) => (
          <div key={c.label}>
            {i > 0 && <div className="flex justify-center py-0.5"><ArrowDown className="w-3.5 h-3.5 text-navy-200" /></div>}
            <div
              className="flex items-center gap-3 p-2.5 bg-navy-50/50 rounded-lg animate-slide-right"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`font-display font-bold text-lg ${c.color}`}>
                {c.value > 0 ? '+' : ''}{c.value}
              </span>
              <span className="text-sm text-navy-500">{c.label}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
