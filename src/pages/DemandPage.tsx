import { ForecastChart } from '@/components/ForecastChart';
import { SignalIntelligence, ModelComparison } from '@/components/RecommendationAudit';
import { DecisionCore, SurgeIndex } from '@/components/SurgeIndex';
import { PredictionPanel } from '@/components/PredictionPanel';

export function DemandPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">Demand Intelligence</h1>
        <p className="text-sm text-navy-500 mt-1">Multimodal AI demand forecast and signal analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DecisionCore />
        </div>
        <SurgeIndex />
      </div>

      <PredictionPanel />

      <ForecastChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalIntelligence />
        <ModelComparison />
      </div>
    </div>
  );
}
