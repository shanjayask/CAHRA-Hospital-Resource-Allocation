import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type {
  SimulationParams,
  SimulationResults,
  ResourceState,
  ResourceKey,
  CollisionPoint,
  StatusLevel,
} from '@/types';
import {
  runSimulation,
  BASELINE_PARAMS,
  computeActions,
  computeForecast,
} from '@/services/simulationService';
import { api } from '@/services/api';
import { saveSimulationHistory, saveAuditLog } from '@/services/supabaseService';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'hcc_simulation';

// ----------------------------------------------------------------
// Context interface — additive only (new fields won't break existing components)
// ----------------------------------------------------------------

interface SimulationContextValue {
  active: boolean;
  params: SimulationParams;
  results: SimulationResults;
  scenarioLabel: string | null;
  /** Predicted admissions from the CAHRA /predict endpoint */
  predictedAdmissions: number | null;
  /** True while awaiting backend response */
  isLoading: boolean;
  /** Non-null when the FastAPI backend is unavailable */
  backendError: string | null;
  runScenario: (params: SimulationParams, label?: string) => void;
  updateParam: (key: keyof SimulationParams, value: number) => void;
  resetSimulation: () => void;
  /** Explicitly set predicted admissions (called from PredictionPanel) */
  setPredictedAdmissions: (value: number) => void;
}

// ----------------------------------------------------------------
// Backend response → SimulationResults adapter
// ----------------------------------------------------------------

type SimulateBackendResponse = Awaited<ReturnType<typeof api.simulateResources>>;

const RESOURCE_CAPACITIES: Record<ResourceKey, number> = {
  beds: 100,
  icu: 20,
  nurses: 60,
  doctors: 30,
  ventilators: 25,
};

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  beds: 'General Beds',
  icu: 'ICU Beds',
  nurses: 'Nurses',
  doctors: 'Doctors',
  ventilators: 'Ventilators',
};

const RESOURCE_UNITS: Record<ResourceKey, string> = {
  beds: 'beds',
  icu: 'beds',
  nurses: 'staff',
  doctors: 'staff',
  ventilators: 'units',
};

const RESOURCE_ORDER: ResourceKey[] = ['beds', 'icu', 'nurses', 'doctors', 'ventilators'];

function utilizationToStatus(utilization: number): StatusLevel {
  if (utilization >= 100) return 'critical';
  if (utilization >= 70) return 'high';
  if (utilization >= 50) return 'watch';
  return 'safe';
}

function adaptBackendToResults(
  backendResult: SimulateBackendResponse,
  params: SimulationParams,
): SimulationResults {
  // Build resources from backend numbers
  const requiredMap: Record<ResourceKey, number> = {
    beds: Math.round(backendResult.predicted_beds),
    icu: Math.round(backendResult.predicted_icu),
    nurses: Math.round(backendResult.predicted_nurses),
    doctors: Math.round(backendResult.predicted_doctors),
    ventilators: Math.round(backendResult.predicted_ventilators),
  };

  const availabilityMap: Record<ResourceKey, number> = {
    beds: params.bedAvailability,
    icu: params.icuAvailability,
    nurses: params.nurseAvailability,
    doctors: params.doctorAvailability,
    ventilators: params.ventilatorAvailability,
  };

  const resources = {} as Record<ResourceKey, ResourceState>;
  for (const key of RESOURCE_ORDER) {
    resources[key] = {
      key,
      label: RESOURCE_LABELS[key],
      required: requiredMap[key],
      available: availabilityMap[key],
      capacity: RESOURCE_CAPACITIES[key],
      unit: RESOURCE_UNITS[key],
    };
  }

  // Surge index derived from planning level + max utilization
  const utilizationValues: Record<ResourceKey, number> = {
    beds: backendResult.bed_utilization,
    icu: backendResult.icu_utilization,
    nurses: backendResult.nurse_utilization,
    doctors: backendResult.doctor_utilization,
    ventilators: backendResult.ventilator_utilization,
  };

  const maxUtil = Math.max(...Object.values(utilizationValues));
  const surgeIndex = Math.min(100, Math.round(maxUtil));

  // Collisions derived from backend utilization
  const timeMultipliers = [1.0, 1.12, 1.25, 1.3];
  const collisions: CollisionPoint[] = RESOURCE_ORDER.map((key) => {
    const baseUtil = utilizationValues[key];
    const statuses: StatusLevel[] = timeMultipliers.map((mult) =>
      utilizationToStatus(baseUtil * mult),
    );
    const firstCritical = statuses.findIndex((s) => s === 'critical' || s === 'high');
    const firstNonSafe = statuses.findIndex((s) => s !== 'safe');
    let earliestCollision: string | null = null;
    if (firstCritical === 0) earliestCollision = 'NOW';
    else if (firstCritical === 1) earliestCollision = '~24 hours';
    else if (firstCritical === 2) earliestCollision = '~48 hours';
    else if (firstCritical === 3) earliestCollision = '~72 hours';
    else if (firstNonSafe >= 0)
      earliestCollision = ['NOW', '~24 hours', '~48 hours', '~72 hours'][firstNonSafe];

    const r = resources[key];
    const over = r.required > r.available;
    const explanations: Record<ResourceKey, string> = {
      beds: `${over ? 'Bed demand exceeds' : 'Bed demand approaching'} available capacity at ${Math.round(baseUtil)}% utilization.`,
      icu: over
        ? `ICU demand exceeds capacity at ${Math.round(baseUtil)}% utilization. Immediate action required.`
        : `ICU utilization at ${Math.round(baseUtil)}% — trending upward.`,
      nurses: `${over ? 'Nurse workload exceeds' : 'Nurse workload approaching'} safe staffing ratios at ${Math.round(baseUtil)}%.`,
      doctors: over
        ? `Doctor availability insufficient for projected load at ${Math.round(baseUtil)}%.`
        : `Doctor capacity at ${Math.round(baseUtil)}% — tightening toward forecast peak.`,
      ventilators: over
        ? `Ventilator demand exceeds supply at ${Math.round(baseUtil)}%.`
        : `Ventilator utilization at ${Math.round(baseUtil)}% — no immediate constraint.`,
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

  // Actions derived from resource shortages (reuse local logic)
  const { actions, recommendedId } = computeActions(resources);

  // Recommendations mapped from backend string array to structured format
  const planningLevel = backendResult.planning_level;
  const bottleneck = backendResult.bottleneck;
  const recommendations = backendResult.recommendations.map((rec, i) => ({
    what: rec,
    why:
      i === 0
        ? `Bottleneck identified: ${bottleneck}. Planning level: ${planningLevel}.`
        : `Additional constraint detected via CAHRA resource analysis.`,
    when: 'Within the next operational period based on current forecast.',
    impact: `Brings ${planningLevel === 'CRITICAL' ? 'critical' : planningLevel === 'PREPARE' ? 'high-risk' : 'elevated'} resources within safe capacity.`,
  }));

  // Explanation narrative
  const explanation =
    `CAHRA AI Engine — Planning Level: ${planningLevel}. ` +
    `Primary bottleneck: ${bottleneck} at ${Math.round(Math.max(...Object.values(utilizationValues)))}% utilization. ` +
    `Predicted beds required: ${Math.round(backendResult.predicted_beds)}, ` +
    `ICU: ${Math.round(backendResult.predicted_icu)}, ` +
    `Nurses: ${Math.round(backendResult.predicted_nurses)}, ` +
    `Doctors: ${Math.round(backendResult.predicted_doctors)}, ` +
    `Ventilators: ${Math.round(backendResult.predicted_ventilators)}.`;

  // Forecast from local computation (no /forecast endpoint in FastAPI)
  const forecast = computeForecast(params.patientDemand);

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

// ----------------------------------------------------------------
// Session storage helpers
// ----------------------------------------------------------------

const baselineResults = runSimulation(BASELINE_PARAMS);

const SimulationContext = createContext<SimulationContextValue | null>(null);

function loadStored(): { params: SimulationParams; label: string | null } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.params && parsed.params.patientDemand !== undefined) {
      return { params: parsed.params as SimulationParams, label: parsed.label ?? null };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveStored(params: SimulationParams, label: string | null) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ params, label }));
}

function clearStored() {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ----------------------------------------------------------------
// Provider
// ----------------------------------------------------------------

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const stored = loadStored();

  const [params, setParams] = useState<SimulationParams>(
    stored?.params ?? BASELINE_PARAMS,
  );
  const [scenarioLabel, setScenarioLabel] = useState<string | null>(
    stored?.label ?? null,
  );
  const [results, setResults] = useState<SimulationResults>(() =>
    runSimulation(stored?.params ?? BASELINE_PARAMS),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [predictedAdmissions, setPredictedAdmissions] = useState<number | null>(null);

  const active =
    stored !== null ||
    scenarioLabel !== null ||
    JSON.stringify(params) !== JSON.stringify(BASELINE_PARAMS);

  // Debounce ref for updateParam
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----------------------------------------------------------------
  // Call backend /simulate
  // ----------------------------------------------------------------

  const callBackend = useCallback(
    async (newParams: SimulationParams, label: string | null) => {
      setIsLoading(true);
      setBackendError(null);

      try {
        const backendResult = await api.simulateResources({
          predicted_admissions: newParams.patientDemand,
          latest_icu_demand: Math.round(newParams.patientDemand * 0.2),
          bed_availability: newParams.bedAvailability,
          icu_availability: newParams.icuAvailability,
          nurse_availability: newParams.nurseAvailability,
          doctor_availability: newParams.doctorAvailability,
          ventilator_availability: newParams.ventilatorAvailability,
        });

        if (!backendResult.success) {
          throw new Error('Backend returned an unsuccessful response.');
        }

        const adapted = adaptBackendToResults(backendResult, newParams);
        setResults(adapted);

        // Persist to Supabase (non-blocking)
        if (user) {
          saveSimulationHistory({
            user_id: user.id,
            scenario: label ?? 'Custom Scenario',
            predicted_admissions: newParams.patientDemand,
            predicted_beds: backendResult.predicted_beds,
            predicted_icu: backendResult.predicted_icu,
            predicted_nurses: backendResult.predicted_nurses,
            predicted_doctors: backendResult.predicted_doctors,
            predicted_ventilators: backendResult.predicted_ventilators,
            planning_level: backendResult.planning_level,
            bottleneck: backendResult.bottleneck,
          }).catch(() => {/* Supabase not configured — ignore */});

          saveAuditLog({
            user_id: user.id,
            role: user.role,
            action: 'simulate',
            scenario: label ?? 'Custom Scenario',
            prediction: `Beds: ${Math.round(backendResult.predicted_beds)}, ICU: ${Math.round(backendResult.predicted_icu)}`,
            planning_level: backendResult.planning_level,
          }).catch(() => {/* Supabase not configured — ignore */});
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        const isNetwork =
          message.includes('fetch') ||
          message.includes('Failed to fetch') ||
          message.includes('NetworkError') ||
          message.includes('ECONNREFUSED');

        setBackendError(
          isNetwork
            ? 'AI backend unavailable. Please check the FastAPI server is running on http://127.0.0.1:8000.'
            : `Backend error: ${message}`,
        );

        // Fall back to local calculation — do NOT use demo data
        const localResults = runSimulation(newParams);
        setResults(localResults);
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  // ----------------------------------------------------------------
  // runScenario — called by preset buttons
  // ----------------------------------------------------------------

  const runScenario = useCallback(
    (newParams: SimulationParams, label?: string) => {
      setParams(newParams);
      setScenarioLabel(label ?? null);
      saveStored(newParams, label ?? null);
      void callBackend(newParams, label ?? null);
    },
    [callBackend],
  );

  // ----------------------------------------------------------------
  // updateParam — called on every slider move; debounced backend call
  // ----------------------------------------------------------------

  const updateParam = useCallback(
    (key: keyof SimulationParams, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };

        // Immediate local result for responsive UI
        const localResults = runSimulation(next);
        setResults(localResults);
        setScenarioLabel('Custom Scenario');
        saveStored(next, 'Custom Scenario');

        // Debounced backend call — fires 600ms after last slider move
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void callBackend(next, 'Custom Scenario');
        }, 600);

        return next;
      });
    },
    [callBackend],
  );

  // ----------------------------------------------------------------
  // resetSimulation
  // ----------------------------------------------------------------

  const resetSimulation = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setParams(BASELINE_PARAMS);
    setScenarioLabel(null);
    setResults(baselineResults);
    setBackendError(null);
    setIsLoading(false);
    clearStored();
  }, []);

  useEffect(() => {
    if (!active) {
      setResults(baselineResults);
    }
  }, [active]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        active,
        params,
        results,
        scenarioLabel,
        predictedAdmissions,
        isLoading,
        backendError,
        runScenario,
        updateParam,
        resetSimulation,
        setPredictedAdmissions,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return ctx;
}