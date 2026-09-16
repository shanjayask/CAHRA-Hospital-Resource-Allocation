import type {
  ForecastPoint,
  ResourceState,
  ExplanationFactor,
  CollisionPoint,
  MinimumAction,
  AuditEntry,
  ModelMetrics,
  ResourceKey,
} from '@/types';
import {
  DEFAULT_FORECAST,
  DEFAULT_RESOURCES,
  DEMO_EXPLANATION,
  DEMO_COLLISIONS,
  DEMO_MINIMUM_ACTIONS,
  RECOMMENDED_ACTION_ID,
  DEMO_AUDIT_LOG,
  DEMO_MODEL_METRICS,
  DEMO_MODE,
} from '@/data/demoData';

const BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  isDemoMode: DEMO_MODE,

  async getForecast(): Promise<ForecastPoint[]> {
    if (DEMO_MODE || !BASE_URL) return DEFAULT_FORECAST;
    return fetchJson('/forecast');
  },

  async getCapacity(): Promise<Record<ResourceKey, ResourceState>> {
    if (DEMO_MODE || !BASE_URL) return DEFAULT_RESOURCES;
    return fetchJson('/capacity');
  },

  async getExplanation(): Promise<ExplanationFactor[]> {
    if (DEMO_MODE || !BASE_URL) return DEMO_EXPLANATION;
    return fetchJson('/explanation');
  },

  async getRecommendations(): Promise<{ actions: MinimumAction[]; recommended: string }> {
    if (DEMO_MODE || !BASE_URL) return { actions: DEMO_MINIMUM_ACTIONS, recommended: RECOMMENDED_ACTION_ID };
    return fetchJson('/recommendation');
  },

  async getCollisionRadar(): Promise<CollisionPoint[]> {
    if (DEMO_MODE || !BASE_URL) return DEMO_COLLISIONS;
    return fetchJson('/collision-radar');
  },

  async getResourceCascade(demand: number): Promise<{ cascade: { resource: string; delta: number }[] }> {
    if (DEMO_MODE || !BASE_URL) {
      const delta = demand - 100;
      return {
        cascade: [
          { resource: 'Bed demand', delta: Math.round(delta * 0.6) },
          { resource: 'ICU demand', delta: Math.round(delta * 0.13) },
          { resource: 'Nurse requirement', delta: Math.round(delta * 0.27) },
          { resource: 'Doctor requirement', delta: Math.round(delta * 0.08) },
          { resource: 'Ventilator requirement', delta: Math.round(delta * 0.1) },
        ],
      };
    }
    return postJson('/resource-cascade', { demand });
  },

  async predictAdmissions(payload: {
    admissions: number;
    occupancy: number;
    icu_demand: number;
    AQI: number;
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    ozone: number;
    max_temp: number;
    min_temp: number;
    humidity: number;
    day_of_week: number;
    month: number;
    day_of_month: number;
    lag_1: number;
    lag_2: number;
    lag_3: number;
    lag_7: number;
    rolling_3: number;
    rolling_7: number;
  }): Promise<{
    success: boolean;
    predicted_admissions: number;
    model: string;
  }> {
    return postJson('/predict', payload);
  },

  async simulateResources(payload: {
    predicted_admissions: number;
    latest_icu_demand: number;
    bed_availability: number;
    icu_availability: number;
    nurse_availability: number;
    doctor_availability: number;
    ventilator_availability: number;
  }): Promise<{
    success: boolean;
    predicted_beds: number;
    predicted_icu: number;
    predicted_nurses: number;
    predicted_doctors: number;
    predicted_ventilators: number;

    bed_utilization: number;
    icu_utilization: number;
    nurse_utilization: number;
    doctor_utilization: number;
    ventilator_utilization: number;

    bed_shortage: number;
    icu_shortage: number;
    nurse_shortage: number;
    doctor_shortage: number;
    ventilator_shortage: number;

    planning_level: string;
    bottleneck: string;
    recommendations: string[];
  }> {
    return postJson('/simulate', payload);
  },
   
  async postWhatIf(payload: {
    patientDemand: number;
    bedAvailability: number;
    icuAvailability: number;
    nurseAvailability: number;
    doctorAvailability: number;
    ventilatorAvailability: number;
  }): Promise<{ forecast: number; resources: Record<ResourceKey, ResourceState> }> {
    if (DEMO_MODE || !BASE_URL) {
      const ratio = payload.patientDemand / 100;
      const resources: Record<ResourceKey, ResourceState> = {
        beds: { ...DEFAULT_RESOURCES.beds, required: Math.round(82 * ratio), available: payload.bedAvailability },
        icu: { ...DEFAULT_RESOURCES.icu, required: Math.round(22 * ratio), available: payload.icuAvailability },
        nurses: { ...DEFAULT_RESOURCES.nurses, required: Math.round(68 * ratio), available: payload.nurseAvailability },
        doctors: { ...DEFAULT_RESOURCES.doctors, required: Math.round(24 * ratio), available: payload.doctorAvailability },
        ventilators: { ...DEFAULT_RESOURCES.ventilators, required: Math.round(15 * ratio), available: payload.ventilatorAvailability },
      };
      return { forecast: payload.patientDemand, resources };
    }
    return postJson('/what-if', payload);
  },

  async postCounterfactual(payload: {
    patientDemand: number;
    resources: Record<string, number>;
  }): Promise<{ interventions: MinimumAction[]; best: string }> {
    if (DEMO_MODE || !BASE_URL) {
      return { interventions: DEMO_MINIMUM_ACTIONS, best: RECOMMENDED_ACTION_ID };
    }
    return postJson('/counterfactual', payload);
  },

  async getAuditLog(): Promise<AuditEntry[]> {
    if (DEMO_MODE || !BASE_URL) return DEMO_AUDIT_LOG;
    return fetchJson('/audit-logs');
  },

  async getModelMetrics(): Promise<ModelMetrics[]> {
    if (DEMO_MODE || !BASE_URL) return DEMO_MODEL_METRICS;
    return fetchJson('/model-metrics');
  },
};
