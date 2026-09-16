import { useState, useCallback } from 'react';
import { TrendingUp, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Panel, SectionHeader } from '@/components/ui/Primitives';
import { api } from '@/services/api';
import { useSimulation } from '@/contexts/SimulationContext';
import { useAuth } from '@/contexts/AuthContext';
import { saveAuditLog } from '@/services/supabaseService';

// ----------------------------------------------------------------
// Build default feature payload from today's date + user inputs
// ----------------------------------------------------------------

function buildPayload(
  admissions: number,
  occupancy: number,
  icuDemand: number,
  aqi: number,
  maxTemp: number,
  minTemp: number,
  humidity: number,
) {
  const now = new Date();
  return {
    admissions,
    occupancy,
    icu_demand: icuDemand,
    AQI: aqi,
    pm25: aqi * 0.35,
    pm10: aqi * 0.55,
    no2: aqi * 0.18,
    so2: aqi * 0.07,
    co: aqi * 0.02,
    ozone: aqi * 0.22,
    max_temp: maxTemp,
    min_temp: minTemp,
    humidity,
    day_of_week: now.getDay(),
    month: now.getMonth() + 1,
    day_of_month: now.getDate(),
    // Lag features: proxy with current admissions
    lag_1: admissions,
    lag_2: admissions,
    lag_3: admissions,
    lag_7: admissions,
    rolling_3: admissions,
    rolling_7: admissions,
  };
}

interface InputRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}

function InputRow({ label, value, min, max, step = 1, unit, onChange }: InputRowProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs font-medium text-navy-600 w-36 shrink-0">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 bg-navy-100 rounded-full appearance-none cursor-pointer accent-navy-600"
      />
      <span className="text-xs font-mono text-navy-700 w-16 text-right shrink-0">
        {value} <span className="text-navy-400">{unit}</span>
      </span>
    </div>
  );
}

export function PredictionPanel() {
  const { setPredictedAdmissions, runScenario, params } = useSimulation();
  const { user } = useAuth();

  const [admissions, setAdmissions] = useState(100);
  const [occupancy, setOccupancy] = useState(80);
  const [icuDemand, setIcuDemand] = useState(20);
  const [aqi, setAqi] = useState(75);
  const [maxTemp, setMaxTemp] = useState(30);
  const [minTemp, setMinTemp] = useState(22);
  const [humidity, setHumidity] = useState(65);

  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = buildPayload(
        admissions,
        occupancy,
        icuDemand,
        aqi,
        maxTemp,
        minTemp,
        humidity,
      );

      const response = await api.predictAdmissions(payload);

      if (!response.success) {
        throw new Error('Prediction failed — model returned an error.');
      }

      const predicted = Math.round(response.predicted_admissions);
      setResult(predicted);
      setPredictedAdmissions(predicted);

      // Auto-apply prediction to simulation
      runScenario(
        {
          ...params,
          patientDemand: predicted,
        },
        `AI Prediction: ${predicted} admissions`,
      );

      // Audit log
      if (user) {
        saveAuditLog({
          user_id: user.id,
          role: user.role,
          action: 'predict',
          scenario: 'AI Prediction',
          prediction: `${predicted} admissions (next day)`,
          planning_level: null,
        }).catch(() => {/* Supabase not configured */});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const isNetwork =
        message.includes('fetch') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError');

      setError(
        isNetwork
          ? 'AI backend unavailable. Please check the FastAPI server is running on http://127.0.0.1:8000.'
          : `Prediction error: ${message}`,
      );
    } finally {
      setLoading(false);
    }
  }, [admissions, occupancy, icuDemand, aqi, maxTemp, minTemp, humidity, setPredictedAdmissions, runScenario, params, user]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Panel className="p-6">
      <SectionHeader
        title="AI Admission Prediction"
        subtitle={`CAHRA HistGradientBoostingRegressor — predicting next-day admissions`}
        icon={<TrendingUp className="w-5 h-5" />}
        right={
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        }
      />

      <p className="text-xs text-navy-400 mt-2 font-mono">{dateLabel}</p>

      {expanded && (
        <div className="mt-5 space-y-3">
          <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wider">
            Today's Inputs
          </p>

          <InputRow label="Current Admissions" value={admissions} min={20} max={250} unit="pts" onChange={setAdmissions} />
          <InputRow label="Bed Occupancy" value={occupancy} min={10} max={100} unit="%" onChange={setOccupancy} />
          <InputRow label="ICU Demand" value={icuDemand} min={0} max={40} unit="beds" onChange={setIcuDemand} />
          <InputRow label="Air Quality Index" value={aqi} min={0} max={300} unit="AQI" onChange={setAqi} />
          <InputRow label="Max Temperature" value={maxTemp} min={0} max={50} unit="°C" onChange={setMaxTemp} />
          <InputRow label="Min Temperature" value={minTemp} min={-5} max={45} unit="°C" onChange={setMinTemp} />
          <InputRow label="Humidity" value={humidity} min={0} max={100} step={1} unit="%" onChange={setHumidity} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handlePredict}
        disabled={loading}
        className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-navy-900 text-white rounded-xl font-display font-semibold text-sm hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Running CAHRA Model…
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Predict Next-Day Admissions
          </>
        )}
      </button>

      {result !== null && !error && (
        <div className="mt-4 p-4 bg-navy-900 rounded-xl text-white">
          <p className="text-xs text-navy-300 uppercase tracking-wider mb-1">
            CAHRA Prediction Result
          </p>
          <p className="font-display font-bold text-3xl">
            {result}{' '}
            <span className="text-sm font-normal text-navy-300">next-day admissions</span>
          </p>
          <p className="text-xs text-navy-400 mt-1">
            HistGradientBoostingRegressor · Applied to Scenario Lab automatically.
          </p>
        </div>
      )}

      <p className="text-[11px] text-navy-400 mt-4 italic">
        Lag/rolling features derived from current admissions value. For higher accuracy, provide the last 7 days of processed HDHI data.
      </p>
    </Panel>
  );
}
