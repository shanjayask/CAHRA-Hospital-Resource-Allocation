import { FlaskConical, RotateCcw } from 'lucide-react';
import { Panel, ScenarioActiveTag, SectionHeader, StatusPill, GapBar } from '@/components/ui/Primitives';
import { SCENARIO_PRESETS, statusFromGap, computeResourceRequirements } from '@/data/demoData';
import { useSimulation } from '@/contexts/SimulationContext';
import type { ScenarioPreset, ResourceKey } from '@/types';

const SLIDERS: { key: 'patientDemand' | 'bedAvailability' | 'icuAvailability' | 'nurseAvailability' | 'doctorAvailability' | 'ventilatorAvailability'; label: string; min: number; max: number; unit: string }[] = [
  { key: 'patientDemand', label: 'Patient Demand', min: 60, max: 200, unit: 'patients' },
  { key: 'bedAvailability', label: 'Bed Availability', min: 40, max: 150, unit: 'beds' },
  { key: 'icuAvailability', label: 'ICU Availability', min: 8, max: 40, unit: 'beds' },
  { key: 'nurseAvailability', label: 'Nurse Availability', min: 30, max: 120, unit: 'staff' },
  { key: 'doctorAvailability', label: 'Doctor Availability', min: 10, max: 60, unit: 'staff' },
  { key: 'ventilatorAvailability', label: 'Ventilator Availability', min: 5, max: 40, unit: 'units' },
];

export function ScenarioLab() {
  const { params, active, scenarioLabel, runScenario, updateParam, resetSimulation, backendError, isLoading } = useSimulation();

  const applyPreset = (preset: ScenarioPreset) => {
    runScenario({
      patientDemand: Math.round(100 * preset.patientDemandMultiplier),
      bedAvailability: preset.bedAvailability,
      icuAvailability: preset.icuAvailability,
      nurseAvailability: preset.nurseAvailability,
      doctorAvailability: preset.doctorAvailability,
      ventilatorAvailability: preset.ventilatorAvailability,
    }, preset.name);
  };

  const requirements = computeResourceRequirements(params.patientDemand);
  const resourceKeys: ResourceKey[] = ['beds', 'icu', 'nurses', 'doctors', 'ventilators'];
  const availabilityMap: Record<ResourceKey, number> = {
    beds: params.bedAvailability,
    icu: params.icuAvailability,
    nurses: params.nurseAvailability,
    doctors: params.doctorAvailability,
    ventilators: params.ventilatorAvailability,
  };
  const labels: Record<ResourceKey, string> = {
    beds: 'Beds', icu: 'ICU', nurses: 'Nurses', doctors: 'Doctors', ventilators: 'Ventilators',
  };

  const activePresetName = scenarioLabel;

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Future Scenario Lab"
        subtitle="What-if simulator — adjust resources and see the impact"
        icon={<FlaskConical className="w-5 h-5" />}
        right={
          <div className="flex items-center gap-2">
            {active && <ScenarioActiveTag label={scenarioLabel ?? undefined} />}
            <button
              onClick={resetSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-600 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset Simulation
            </button>
          </div>
        }
      />
      {/* Backend error banner */}
      {backendError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <span className="text-red-500 text-sm font-semibold shrink-0">⚠</span>
          <p className="text-sm text-red-700">{backendError}</p>
        </div>
      )}

      {/* Backend loading indicator */}
      {isLoading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-navy-500">
          <span className="inline-block w-3 h-3 border-2 border-navy-400 border-t-transparent rounded-full animate-spin" />
          Running CAHRA AI simulation…
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Scenario Presets</p>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activePresetName === preset.name
                  ? 'bg-navy-600 text-white shadow-md'
                  : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
              }`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Simulation Controls</p>
          <div className="space-y-4">
            {SLIDERS.map((slider) => (
              <div key={slider.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-navy-700">{slider.label}</span>
                  <span className="font-display font-bold text-navy-900">
                    {params[slider.key]} <span className="text-xs text-navy-400 font-normal">{slider.unit}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  value={params[slider.key]}
                  onChange={(e) => updateParam(slider.key, Number(e.target.value))}
                  className="w-full h-2 bg-navy-100 rounded-full appearance-none cursor-pointer accent-navy-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Simulated Impact</p>
          <div className="space-y-3">
            {resourceKeys.map((k) => {
              const req = requirements[k];
              const avail = availabilityMap[k];
              const status = statusFromGap(req, avail);
              return (
                <div key={k} className="p-3 bg-navy-50/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-navy-800">{labels[k]}</span>
                    <StatusPill status={status} />
                  </div>
                  <GapBar required={req} available={avail} />
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-navy-900 rounded-xl text-white">
            <p className="text-xs text-navy-300 uppercase tracking-wider mb-1">Before → After</p>
            <p className="font-display font-bold text-2xl">
              100 <span className="text-navy-400 mx-1">→</span> {params.patientDemand} <span className="text-sm font-normal text-navy-300">patients</span>
            </p>
            <p className="text-xs text-navy-200 mt-2">
              {params.patientDemand > 100 ? 'Demand surge detected.' : params.patientDemand < 100 ? 'Demand below baseline.' : 'Demand at baseline.'}
              {' '}
              {resourceKeys.some((k) => requirements[k] > availabilityMap[k]) ? 'Constraints detected — see recommendations.' : 'All resources within capacity.'}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
