export type ResourceKey = 'beds' | 'icu' | 'nurses' | 'doctors' | 'ventilators';

export type StatusLevel = 'safe' | 'watch' | 'high' | 'critical';

export type Role = 'admin' | 'doctor' | 'staff' | 'auditor';

export interface ResourceState {
  key: ResourceKey;
  label: string;
  required: number;
  available: number;
  capacity: number;
  unit: string;
}

export interface ForecastPoint {
  hour: string;
  label: string;
  demand: number;
  lower: number;
  upper: number;
}

export interface ExplanationFactor {
  feature: string;
  influence: number;
  direction: 'positive' | 'negative';
  level: 'high' | 'medium' | 'moderate' | 'low';
}

export interface CollisionPoint {
  resource: ResourceKey;
  label: string;
  now: StatusLevel;
  h24: StatusLevel;
  h48: StatusLevel;
  h72: StatusLevel;
  earliestCollision: string | null;
  explanation: string;
}

export interface MinimumAction {
  id: string;
  label: string;
  actions: { resource: ResourceKey; label: string; delta: number }[];
  result: 'safe' | 'watch';
  reason: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  inputSignals: string[];
  model: string;
  prediction: string;
  constraintResult: string;
  recommendation: string;
  explanation: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  patientDemandMultiplier: number;
  bedAvailability: number;
  icuAvailability: number;
  nurseAvailability: number;
  doctorAvailability: number;
  ventilatorAvailability: number;
}

export interface ModelMetrics {
  model: string;
  mae: number | null;
  rmse: number | null;
  mse: number | null;
  mape: number | null;
  r2: number | null;
}

export interface MultimodalSignal {
  name: string;
  description: string;
  connected: boolean;
  icon: string;
  contribution: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  department: string;
  employee_id: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface SimulationParams {
  patientDemand: number;
  bedAvailability: number;
  icuAvailability: number;
  nurseAvailability: number;
  doctorAvailability: number;
  ventilatorAvailability: number;
}

export interface SimulationResults {
  forecast: ForecastPoint[];
  resources: Record<ResourceKey, ResourceState>;
  surgeIndex: number;
  collisions: CollisionPoint[];
  actions: MinimumAction[];
  recommendedActionId: string;
  recommendations: { what: string; why: string; when: string; impact: string }[];
  explanation: string;
}
