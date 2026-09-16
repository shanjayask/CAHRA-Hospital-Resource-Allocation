import type {
  ResourceState,
  ForecastPoint,
  ExplanationFactor,
  CollisionPoint,
  MinimumAction,
  AuditEntry,
  ScenarioPreset,
  ModelMetrics,
  MultimodalSignal,
  ResourceKey,
  StatusLevel,
  Role,
} from '@/types';

export const DEMO_MODE = false;

export function statusFromGap(required: number, available: number): StatusLevel {
  if (required > available) return 'critical';
  const ratio = available > 0 ? required / available : 1;
  if (ratio > 0.9) return 'high';
  if (ratio > 0.75) return 'watch';
  return 'safe';
}

export function statusLabel(s: StatusLevel): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function surgeLevel(score: number): { label: string; status: StatusLevel } {
  if (score <= 25) return { label: 'Normal', status: 'safe' };
  if (score <= 50) return { label: 'Watch', status: 'watch' };
  if (score <= 75) return { label: 'High', status: 'high' };
  return { label: 'Critical', status: 'critical' };
}

export const DEFAULT_RESOURCES: Record<ResourceKey, ResourceState> = {
  beds: {
    key: 'beds',
    label: 'General Beds',
    required: 82,
    available: 96,
    capacity: 120,
    unit: 'beds',
  },
  icu: {
    key: 'icu',
    label: 'ICU Beds',
    required: 22,
    available: 20,
    capacity: 24,
    unit: 'beds',
  },
  nurses: {
    key: 'nurses',
    label: 'Nurses',
    required: 68,
    available: 60,
    capacity: 80,
    unit: 'staff',
  },
  doctors: {
    key: 'doctors',
    label: 'Doctors',
    required: 24,
    available: 28,
    capacity: 35,
    unit: 'staff',
  },
  ventilators: {
    key: 'ventilators',
    label: 'Ventilators',
    required: 15,
    available: 18,
    capacity: 25,
    unit: 'units',
  },
};

export const RESOURCE_ORDER: ResourceKey[] = ['beds', 'icu', 'nurses', 'doctors', 'ventilators'];

export const DEFAULT_FORECAST: ForecastPoint[] = [
  { hour: 'NOW', label: 'Now', demand: 100, lower: 95, upper: 105 },
  { hour: '+12H', label: '+12h', demand: 112, lower: 104, upper: 120 },
  { hour: '+24H', label: '+24h', demand: 125, lower: 115, upper: 135 },
  { hour: '+36H', label: '+36h', demand: 130, lower: 118, upper: 142 },
  { hour: '+48H', label: '+48h', demand: 128, lower: 114, upper: 142 },
  { hour: '+60H', label: '+60h', demand: 118, lower: 104, upper: 132 },
  { hour: '+72H', label: '+72h', demand: 108, lower: 94, upper: 122 },
];

export const DEMO_EXPLANATION: ExplanationFactor[] = [
  { feature: 'Previous admissions (24h)', influence: 38, direction: 'positive', level: 'high' },
  { feature: 'Recent occupancy trend', influence: 26, direction: 'positive', level: 'medium' },
  { feature: 'Seasonal / calendar pattern', influence: 14, direction: 'positive', level: 'moderate' },
  { feature: 'Weather conditions', influence: 12, direction: 'positive', level: 'moderate' },
  { feature: 'Traffic / external signals', influence: 10, direction: 'negative', level: 'low' },
];

export const DEMO_COLLISIONS: CollisionPoint[] = [
  {
    resource: 'beds',
    label: 'General Beds',
    now: 'watch',
    h24: 'high',
    h48: 'high',
    h72: 'watch',
    earliestCollision: '~24 hours',
    explanation: 'Forecasted demand approaching bed capacity as admissions rise.',
  },
  {
    resource: 'icu',
    label: 'ICU Beds',
    now: 'critical',
    h24: 'critical',
    h48: 'critical',
    h72: 'high',
    earliestCollision: 'NOW',
    explanation: 'ICU demand already exceeds available capacity. Immediate action required.',
  },
  {
    resource: 'nurses',
    label: 'Nurses',
    now: 'watch',
    h24: 'watch',
    h48: 'high',
    h72: 'critical',
    earliestCollision: '~72 hours',
    explanation: 'Nurse workload rising proportionally with patient surge forecast.',
  },
  {
    resource: 'doctors',
    label: 'Doctors',
    now: 'safe',
    h24: 'safe',
    h48: 'watch',
    h72: 'watch',
    earliestCollision: null,
    explanation: 'Doctor capacity sufficient but tightening toward end of forecast window.',
  },
  {
    resource: 'ventilators',
    label: 'Ventilators',
    now: 'safe',
    h24: 'safe',
    h48: 'safe',
    h72: 'watch',
    earliestCollision: null,
    explanation: 'Ventilator demand moderate; no immediate constraint projected.',
  },
];

export const DEMO_MINIMUM_ACTIONS: MinimumAction[] = [
  {
    id: 'A',
    label: 'Option A',
    actions: [{ resource: 'icu', label: 'ICU beds', delta: 2 }],
    result: 'safe',
    reason: 'Directly resolves ICU shortage with minimal resource addition.',
  },
  {
    id: 'B',
    label: 'Option B',
    actions: [
      { resource: 'icu', label: 'ICU beds', delta: 1 },
      { resource: 'nurses', label: 'Nurses', delta: 4 },
    ],
    result: 'safe',
    reason: 'Smallest combined intervention satisfying both ICU and nurse constraints.',
  },
  {
    id: 'C',
    label: 'Option C',
    actions: [{ resource: 'nurses', label: 'Nurses', delta: 8 }],
    result: 'safe',
    reason: 'Resolves nurse shortage; ICU managed via load redistribution.',
  },
];

export const RECOMMENDED_ACTION_ID = 'B';

export const DEMO_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-09-15 08:00',
    inputSignals: ['admissions(24h)', 'occupancy_trend', 'calendar', 'weather', 'traffic'],
    model: 'Constraint-Aware LSTM',
    prediction: '130 patients in +36h',
    constraintResult: 'ICU violation detected',
    recommendation: 'Prepare +1 ICU bed, +4 nurses',
    explanation: 'Demand surge driven by prior admissions and occupancy trend; ICU capacity exceeded.',
  },
  {
    id: 'aud-002',
    timestamp: '2026-09-15 06:00',
    inputSignals: ['admissions(24h)', 'occupancy_trend', 'calendar'],
    model: 'Baseline LSTM',
    prediction: '118 patients in +36h',
    constraintResult: 'No violation',
    recommendation: 'Maintain current capacity',
    explanation: 'Lower forecast without constraint awareness; underestimates ICU pressure.',
  },
  {
    id: 'aud-003',
    timestamp: '2026-09-15 04:00',
    inputSignals: ['admissions(24h)', 'occupancy_trend', 'calendar', 'weather'],
    model: 'Constraint-Aware LSTM',
    prediction: '122 patients in +24h',
    constraintResult: 'Bed watch, ICU high',
    recommendation: 'Monitor bed availability',
    explanation: 'Early signal of rising demand; beds approaching watch threshold.',
  },
];

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'normal',
    name: 'Normal Day',
    description: 'Baseline operations within capacity',
    patientDemandMultiplier: 1.0,
    bedAvailability: 96,
    icuAvailability: 20,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 18,
  },
  {
    id: 'moderate',
    name: 'Moderate Surge',
    description: '15% demand increase, manageable',
    patientDemandMultiplier: 1.15,
    bedAvailability: 96,
    icuAvailability: 20,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 18,
  },
  {
    id: 'severe',
    name: 'Severe Surge',
    description: '30% demand increase, multiple constraints',
    patientDemandMultiplier: 1.3,
    bedAvailability: 96,
    icuAvailability: 20,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 18,
  },
  {
    id: 'icu_crisis',
    name: 'ICU Crisis',
    description: 'ICU demand spike, bed overflow',
    patientDemandMultiplier: 1.25,
    bedAvailability: 96,
    icuAvailability: 18,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 18,
  },
  {
    id: 'bed_shortage',
    name: 'Bed Shortage',
    description: 'General bed capacity strained',
    patientDemandMultiplier: 1.2,
    bedAvailability: 80,
    icuAvailability: 20,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 18,
  },
  {
    id: 'staff_shortage',
    name: 'Staff Shortage',
    description: 'Nurse and doctor availability reduced',
    patientDemandMultiplier: 1.15,
    bedAvailability: 96,
    icuAvailability: 20,
    nurseAvailability: 48,
    doctorAvailability: 22,
    ventilatorAvailability: 18,
  },
  {
    id: 'vent_shortage',
    name: 'Ventilator Shortage',
    description: 'Critical ventilator supply low',
    patientDemandMultiplier: 1.2,
    bedAvailability: 96,
    icuAvailability: 20,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 12,
  },
  {
    id: 'pandemic',
    name: 'Pandemic-Like Surge',
    description: 'Extreme multi-resource crisis',
    patientDemandMultiplier: 1.6,
    bedAvailability: 96,
    icuAvailability: 20,
    nurseAvailability: 60,
    doctorAvailability: 28,
    ventilatorAvailability: 18,
  },
];

export const DEMO_MODEL_METRICS: ModelMetrics[] = [
  { model: 'Baseline LSTM', mae: null, rmse: null, mse: null, mape: null, r2: null },
  { model: 'Constraint-Aware LSTM', mae: null, rmse: null, mse: null, mape: null, r2: null },
];

export const MULTIMODAL_SIGNALS: MultimodalSignal[] = [
  { name: 'Hospital Admissions', description: '24h rolling admission count', connected: false, icon: 'admissions', contribution: 38 },
  { name: 'Historical Occupancy', description: 'Bed & ICU occupancy trends', connected: false, icon: 'occupancy', contribution: 26 },
  { name: 'Calendar / Seasonality', description: 'Day-of-week & seasonal patterns', connected: false, icon: 'calendar', contribution: 14 },
  { name: 'Weather Conditions', description: 'Temperature, humidity, alerts', connected: false, icon: 'weather', contribution: 12 },
  { name: 'Traffic / External', description: 'External demand signals', connected: false, icon: 'traffic', contribution: 10 },
];

export function computeResourceRequirements(
  patientDemand: number,
  baseDemand: number = 100
): Record<ResourceKey, number> {
  const ratio = patientDemand / baseDemand;
  return {
    beds: Math.round(82 * ratio),
    icu: Math.round(22 * ratio),
    nurses: Math.round(68 * ratio),
    doctors: Math.round(24 * ratio),
    ventilators: Math.round(15 * ratio),
  };
}

export function computeSurgeIndex(patientDemand: number): number {
  const base = 100;
  const ratio = patientDemand / base;
  const raw = (ratio - 1) * 100 + 35;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function computeRipple(patientDemand: number, baseDemand: number = 100) {
  const delta = patientDemand - baseDemand;
  const pct = baseDemand > 0 ? (delta / baseDemand) * 100 : 0;
  return {
    patientDelta: delta,
    patientPct: pct,
    bedDelta: Math.round(delta * 0.6),
    icuDelta: Math.round(delta * 0.13),
    nurseDelta: Math.round(delta * 0.27),
    doctorDelta: Math.round(delta * 0.08),
    ventDelta: Math.round(delta * 0.1),
  };
}

export const PIPELINE_STAGES = [
  { id: 'predict', label: 'Predict', icon: 'TrendingUp' },
  { id: 'explain', label: 'Explain', icon: 'Brain' },
  { id: 'check', label: 'Check', icon: 'ShieldCheck' },
  { id: 'trace', label: 'Trace', icon: 'GitBranch' },
  { id: 'warn', label: 'Warn', icon: 'AlertTriangle' },
  { id: 'act', label: 'Act', icon: 'Zap' },
  { id: 'simulate', label: 'Simulate', icon: 'FlaskConical' },
] as const;

export const RESEARCH_TRADITIONAL = ['Predict demand'];

export const RESEARCH_OURS = [
  'Predict demand',
  'Explain why',
  'Check constraints',
  'Trace resource ripple',
  'Warn before collision',
  'Find minimum intervention',
  'Simulate counterfactuals',
];

export const NAV_ITEMS = [
  { path: '/command-center', label: 'Command Center', icon: 'LayoutDashboard', roles: ['admin', 'doctor', 'staff', 'auditor'] as Role[] },
  { path: '/demand-intelligence', label: 'Demand Intelligence', icon: 'TrendingUp', roles: ['admin', 'doctor', 'staff', 'auditor'] as Role[] },
  { path: '/explainability', label: 'AI Explanation', icon: 'Brain', roles: ['admin', 'doctor', 'auditor'] as Role[] },
  { path: '/capacity-network', label: 'Capacity Network', icon: 'Network', roles: ['admin', 'doctor', 'staff'] as Role[] },
  { path: '/resource-ripple', label: 'Resource Ripple', icon: 'Waves', roles: ['admin', 'doctor', 'staff'] as Role[] },
  { path: '/collision-radar', label: 'Collision Radar', icon: 'Radar', roles: ['admin', 'doctor', 'staff'] as Role[] },
  { path: '/scenario-lab', label: 'Scenario Lab', icon: 'FlaskConical', roles: ['admin', 'doctor', 'staff'] as Role[] },
  { path: '/recommendations', label: 'Recommendations', icon: 'Lightbulb', roles: ['admin', 'doctor', 'staff'] as Role[] },
  { path: '/ai-audit', label: 'AI Audit', icon: 'ScrollText', roles: ['admin', 'auditor'] as Role[] },
];

export const ROLES: { key: Role; label: string; description: string }[] = [
  { key: 'admin', label: 'Admin', description: 'Forecast + capacity + recommendations' },
  { key: 'doctor', label: 'Doctor', description: 'Demand + ICU pressure + workload' },
  { key: 'staff', label: 'Staff', description: 'Nurse load + resource shortage + alerts' },
  { key: 'auditor', label: 'Auditor', description: 'Model explanation + decision history + audit trail' },
];
