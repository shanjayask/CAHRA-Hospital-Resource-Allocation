import { TrendingUp, Network } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Line, ComposedChart,
} from 'recharts';
import { Panel, ScenarioActiveTag, SectionHeader } from '@/components/ui/Primitives';
import { useSimulation } from '@/contexts/SimulationContext';
import { RESOURCE_ORDER } from '@/data/demoData';

export function ForecastChart() {
  const { results, active, scenarioLabel } = useSimulation();
  const data = results.forecast;

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Demand Forecast"
        subtitle="72-hour predicted patient demand with confidence interval"
        icon={<TrendingUp className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d4884" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2d4884" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#8895b0' }} axisLine={{ stroke: '#dae4f2' }} />
            <YAxis tick={{ fontSize: 12, fill: '#8895b0' }} axisLine={{ stroke: '#dae4f2' }} />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #dae4f2',
                borderRadius: '12px',
                fontSize: '13px',
              }}
              labelStyle={{ fontWeight: 600, color: '#15223f' }}
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="#2d4884"
              fillOpacity={0.08}
              name="Upper bound"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="white"
              fillOpacity={1}
              name="Lower bound"
            />
            <Line
              type="monotone"
              dataKey="demand"
              stroke="#2d4884"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#2d4884' }}
              activeDot={{ r: 6 }}
              name="Predicted demand"
            />
            <ReferenceLine y={120} stroke="#f97316" strokeDasharray="5 5" label={{ value: 'Surge threshold', fontSize: 10, fill: '#f97316' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-navy-600">
          <span className="w-3 h-0.5 bg-navy-600" /> Predicted demand
        </span>
        <span className="flex items-center gap-1.5 text-navy-400">
          <span className="w-3 h-2 bg-navy-200/40" /> Confidence interval
        </span>
        <span className="flex items-center gap-1.5 text-orange-500">
          <span className="w-3 h-0.5 bg-orange-500 border-t border-dashed" /> Surge threshold
        </span>
      </div>
    </Panel>
  );
}

export function CapacityNetwork() {
  const { results, params, active, scenarioLabel } = useSimulation();
  const resources = results.resources;
  const demand = params.patientDemand;
  const nodes = RESOURCE_ORDER.map((k) => resources[k]);
  const utilizationData = nodes.map((n) => ({
    name: n.label.replace('General ', '').replace(' Beds', '').replace(' Beds', ''),
    required: n.required,
    available: n.available,
    capacity: n.capacity,
  }));

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Hospital Capacity Network"
        subtitle="Demand propagation: patient load → beds → ICU → staffing"
        icon={<Network className="w-5 h-5" />}
        right={active ? <ScenarioActiveTag label={scenarioLabel ?? undefined} /> : undefined}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Demand → Bed → ICU Cascade</p>
          <div className="space-y-2">
            <div className="p-3 bg-navy-900 text-white rounded-xl flex items-center justify-between">
              <span className="font-display font-semibold">Patient Demand</span>
              <span className="font-display font-bold text-2xl">{demand}</span>
            </div>
            <div className="flex justify-center"><span className="text-navy-300 text-xs">↓</span></div>
            <div className="p-3 bg-navy-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-800">→ General Beds</span>
              <span className="font-display font-bold text-navy-700">{resources.beds.required}/{resources.beds.available}</span>
            </div>
            <div className="flex justify-center"><span className="text-navy-300 text-xs">↓</span></div>
            <div className="p-3 bg-navy-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-800">→ ICU Pressure</span>
              <span className="font-display font-bold text-navy-700">{resources.icu.required}/{resources.icu.available}</span>
            </div>
            <div className="flex justify-center"><span className="text-navy-300 text-xs">↓</span></div>
            <div className="p-3 bg-navy-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-800">→ Ventilator Demand</span>
              <span className="font-display font-bold text-navy-700">{resources.ventilators.required}/{resources.ventilators.available}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3">Staffing Pressure Cascade</p>
          <div className="space-y-2">
            <div className="p-3 bg-navy-900 text-white rounded-xl flex items-center justify-between">
              <span className="font-display font-semibold">Care Load</span>
              <span className="font-display font-bold text-2xl">{demand}</span>
            </div>
            <div className="flex justify-center"><span className="text-navy-300 text-xs">↓</span></div>
            <div className="p-3 bg-navy-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-800">→ Nurse Load</span>
              <span className="font-display font-bold text-navy-700">{resources.nurses.required}/{resources.nurses.available}</span>
            </div>
            <div className="flex justify-center"><span className="text-navy-300 text-xs">↓</span></div>
            <div className="p-3 bg-navy-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-800">→ Doctor Load</span>
              <span className="font-display font-bold text-navy-700">{resources.doctors.required}/{resources.doctors.available}</span>
            </div>
          </div>

          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3a5ba0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3a5ba0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8895b0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8895b0' }} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #dae4f2', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="required" stroke="#3a5ba0" fill="url(#utilGrad)" name="Required" />
                <Area type="monotone" dataKey="available" stroke="#10b981" fill="none" strokeDasharray="5 5" name="Available" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Panel>
  );
}
