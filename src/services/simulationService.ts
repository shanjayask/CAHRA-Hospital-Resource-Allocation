import type {
  SimulationParams,
  SimulationResults,
  ResourceState,
  ResourceKey,
  ForecastPoint,
  CollisionPoint,
  MinimumAction,
  StatusLevel,
} from '@/types';
import {
  DEFAULT_RESOURCES,
  RESOURCE_ORDER,
  computeSurgeIndex,
  computeResourceRequirements,
  statusFromGap,
} from '@/data/demoData';

export const BASELINE_PARAMS: SimulationParams = {
  patientDemand: 100,
  bedAvailability: 96,
  icuAvailability: 20,
  nurseAvailability: 60,
  doctorAvailability: 28,
  ventilatorAvailability: 18,
};

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  beds: 'General Beds',
  icu: 'ICU Beds',
  nurses: 'Nurses',
  doctors: 'Doctors',
  ventilators: 'Ventilators',
};

export function computeForecast(demand: number): ForecastPoint[] {
  const base = 100;
  const ratio = demand / base;
  const points = [
    { hour: 'NOW', label: 'Now', factor: 1.0 },
    { hour: '+12H', label: '+12h', factor: 1.12 },
    { hour: '+24H', label: '+24h', factor: 1.25 },
    { hour: '+36H', label: '+36h', factor: 1.3 },
    { hour: '+48H', label: '+48h', factor: 1.28 },
    { hour: '+60H', label: '+60h', factor: 1.18 },
    { hour: '+72H', label: '+72h', factor: 1.08 },
  ];
  return points.map((p) => {
    const predicted = Math.round(demand * p.factor / ratio);
    const spread = Math.round(predicted * 0.08);
    return {
      hour: p.hour,
      label: p.label,
      demand: predicted,
      lower: Math.max(0, predicted - spread),
      upper: predicted + spread,
    };
  });
}

function computeResources(params: SimulationParams): Record<ResourceKey, ResourceState> {
  const req = computeResourceRequirements(params.patientDemand);
  const availability: Record<ResourceKey, number> = {
    beds: params.bedAvailability,
    icu: params.icuAvailability,
    nurses: params.nurseAvailability,
    doctors: params.doctorAvailability,
    ventilators: params.ventilatorAvailability,
  };
  const result = {} as Record<ResourceKey, ResourceState>;
  for (const key of RESOURCE_ORDER) {
    result[key] = {
      key,
      label: RESOURCE_LABELS[key],
      required: req[key],
      available: availability[key],
      capacity: DEFAULT_RESOURCES[key].capacity,
      unit: DEFAULT_RESOURCES[key].unit,
    };
  }
  return result;
}

function computeCollisions(params: SimulationParams): CollisionPoint[] {
  const resources = computeResources(params);
  const ratio = params.patientDemand / 100;
  const pressureFactor = Math.max(0.7, Math.min(1.4, ratio));

  const timeMultipliers = [1.0, 1.12, 1.25, 1.3];

  return RESOURCE_ORDER.map((key) => {
    const r = resources[key];
    const statuses: StatusLevel[] = timeMultipliers.map((mult) => {
      const projectedReq = Math.round(r.required * mult / ratio * ratio * pressureFactor / ratio);
      return statusFromGap(projectedReq, r.available);
    });

    const firstCritical = statuses.findIndex((s) => s === 'critical' || s === 'high');
    const firstNonSafe = statuses.findIndex((s) => s !== 'safe');
    let earliestCollision: string | null = null;
    if (firstCritical === 0) earliestCollision = 'NOW';
    else if (firstCritical === 1) earliestCollision = '~24 hours';
    else if (firstCritical === 2) earliestCollision = '~48 hours';
    else if (firstCritical === 3) earliestCollision = '~72 hours';
    else if (firstNonSafe >= 0) earliestCollision = ['NOW', '~24 hours', '~48 hours', '~72 hours'][firstNonSafe];

    const explanations: Record<ResourceKey, string> = {
      beds: `Forecasted bed demand ${r.required > r.available ? 'exceeds' : 'approaching'} available capacity as admissions rise.`,
      icu: r.required > r.available
        ? 'ICU demand exceeds available capacity. Immediate action required.'
        : 'ICU demand moderate but trending upward with patient surge.',
      nurses: `Nurse workload ${r.required > r.available ? 'exceeds' : 'approaching'} safe staffing ratios with forecasted demand.`,
      doctors: r.required > r.available
        ? 'Doctor availability insufficient for projected patient load.'
        : 'Doctor capacity sufficient but tightening toward end of forecast window.',
      ventilators: r.required > r.available
        ? 'Ventilator demand projected to exceed available supply.'
        : 'Ventilator demand moderate; no immediate constraint projected.',
    };

    return {
      resource: key,
      label: RESOURCE_LABELS[key],
      now: statuses[0],
      h24: statuses[1],
      h48: statuses[2],
      h72: statuses[3],
      earliestCollision,
      explanation: explanations[key],
    };
  });
}

export function computeActions(resources: Record<ResourceKey, ResourceState>): { actions: MinimumAction[]; recommendedId: string } {
  const violations = RESOURCE_ORDER.filter((k) => resources[k].required > resources[k].available);
  if (violations.length === 0) {
    return { actions: [], recommendedId: '' };
  }

  const gaps: Record<string, number> = {};
  for (const k of violations) {
    gaps[k] = resources[k].required - resources[k].available;
  }

  const actions: MinimumAction[] = [];

  if (violations.length === 1) {
    const v = violations[0];
    actions.push({
      id: 'A',
      label: 'Option A',
      actions: [{ resource: v, label: RESOURCE_LABELS[v].replace(' Beds', ' beds').replace('General ', ''), delta: gaps[v] }],
      result: 'safe',
      reason: `Directly resolves ${RESOURCE_LABELS[v]} shortage with minimal resource addition.`,
    });
    actions.push({
      id: 'B',
      label: 'Option B',
      actions: [{ resource: v, label: RESOURCE_LABELS[v].replace(' Beds', ' beds').replace('General ', ''), delta: gaps[v] + 1 }],
      result: 'safe',
      reason: `Resolves ${RESOURCE_LABELS[v]} shortage with a safety buffer.`,
    });
    return { actions, recommendedId: 'A' };
  }

  const first = violations[0];
  const second = violations[1];
  const firstLabel = RESOURCE_LABELS[first].replace(' Beds', ' beds').replace('General ', '');
  const secondLabel = RESOURCE_LABELS[second].replace(' Beds', ' beds').replace('General ', '');

  actions.push({
    id: 'A',
    label: 'Option A',
    actions: [
      { resource: first, label: firstLabel, delta: gaps[first] },
      { resource: second, label: secondLabel, delta: gaps[second] },
    ],
    result: 'safe',
    reason: `Directly resolves both ${RESOURCE_LABELS[first]} and ${RESOURCE_LABELS[second]} shortages.`,
  });

  const halfFirst = Math.ceil(gaps[first] / 2);
  const remainingFirst = gaps[first] - halfFirst;
  actions.push({
    id: 'B',
    label: 'Option B',
    actions: [
      { resource: first, label: firstLabel, delta: Math.max(1, halfFirst) },
      { resource: second, label: secondLabel, delta: gaps[second] + Math.max(0, remainingFirst) },
    ],
    result: 'safe',
    reason: `Balanced intervention — distributes resource additions across ${RESOURCE_LABELS[first]} and ${RESOURCE_LABELS[second]}.`,
  });

  actions.push({
    id: 'C',
    label: 'Option C',
    actions: [{ resource: second, label: secondLabel, delta: gaps[second] + gaps[first] }],
    result: 'safe',
    reason: `Resolves ${RESOURCE_LABELS[second]} shortage and compensates for ${RESOURCE_LABELS[first]} via load redistribution.`,
  });

  return { actions, recommendedId: 'B' };
}

function computeRecommendations(
  params: SimulationParams,
  resources: Record<ResourceKey, ResourceState>,
): { what: string; why: string; when: string; impact: string }[] {
  const violations = RESOURCE_ORDER.filter((k) => resources[k].required > resources[k].available);
  const recs: { what: string; why: string; when: string; impact: string }[] = [];

  if (violations.length === 0) {
    recs.push({
      what: 'Maintain current capacity levels',
      why: 'All resources are within safe capacity for the current demand forecast.',
      when: 'Ongoing monitoring through the 72-hour forecast window.',
      impact: 'No immediate action required. Continue standard operations.',
    });
    return recs;
  }

  for (const v of violations) {
    const r = resources[v];
    const gap = r.required - r.available;
    const labelShort = RESOURCE_LABELS[v].replace(' Beds', ' beds').replace('General ', '');
    recs.push({
      what: `Prepare ${gap} additional ${labelShort}`,
      why: `Forecasted ${RESOURCE_LABELS[v].toLowerCase()} demand (${r.required}) exceeds current available capacity (${r.available}).`,
      when: 'Within the forecast window, before the predicted demand peak.',
      impact: `Resolves ${RESOURCE_LABELS[v].toLowerCase()} constraint violation (shortage: ${gap}).`,
    });
  }

  const watchResources = RESOURCE_ORDER.filter(
    (k) => resources[k].required <= resources[k].available && resources[k].required / resources[k].available > 0.85,
  );
  for (const w of watchResources.slice(0, 1)) {
    const r = resources[w];
    recs.push({
      what: `Monitor ${RESOURCE_LABELS[w].toLowerCase()} occupancy`,
      why: `${RESOURCE_LABELS[w]} utilization at ${Math.round((r.required / r.available) * 100)}% — approaching but not yet exceeding capacity.`,
      when: 'Ongoing through the forecast window.',
      impact: 'Early awareness prevents cascade into other resource constraints.',
    });
  }

  return recs;
}

function computeExplanation(params: SimulationParams, resources: Record<ResourceKey, ResourceState>): string {
  const delta = params.patientDemand - 100;
  const pct = Math.round((delta / 100) * 100);
  const violations = RESOURCE_ORDER.filter((k) => resources[k].required > resources[k].available);

  if (delta === 0 && violations.length === 0) {
    return 'Patient demand is at baseline. All resources are within safe capacity. No constraints detected in the current forecast window.';
  }

  const parts: string[] = [];
  if (delta > 0) {
    parts.push(`Patient demand increased by ${pct}% (from 100 to ${params.patientDemand}).`);
    parts.push(`This increased projected bed occupancy and downstream care load.`);
  } else if (delta < 0) {
    parts.push(`Patient demand decreased by ${Math.abs(pct)}% (from 100 to ${params.patientDemand}).`);
    parts.push(`This reduced projected resource pressure across the hospital network.`);
  }

  if (violations.length > 0) {
    const violationList = violations.map((k) => `${RESOURCE_LABELS[k].toLowerCase()} (gap: ${resources[k].required - resources[k].available})`).join(', ');
    parts.push(`The resulting demand exceeds available capacity for: ${violationList}.`);
    parts.push(`Minimum feasible intervention is required to bring these resources within safe capacity.`);
  } else {
    parts.push(`All resources remain within available capacity under this scenario.`);
  }

  return parts.join(' ');
}

export function runSimulation(params: SimulationParams): SimulationResults {
  const forecast = computeForecast(params.patientDemand);
  const resources = computeResources(params);
  const surgeIndex = computeSurgeIndex(params.patientDemand);
  const collisions = computeCollisions(params);
  const { actions, recommendedId } = computeActions(resources);
  const recommendations = computeRecommendations(params, resources);
  const explanation = computeExplanation(params, resources);

  return {
    forecast,
    resources,
    surgeIndex,
    collisions,
    actions,
    recommendedActionId: recommendedId,
    recommendations,
    explanation,
  };
}
