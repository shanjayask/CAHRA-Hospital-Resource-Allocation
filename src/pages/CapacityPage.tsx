import { CapacityNetwork } from '@/components/ForecastChart';
import { CapacityMatrix } from '@/components/CollisionRadar';

export function CapacityPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">Capacity Network</h1>
        <p className="text-sm text-navy-500 mt-1">Hospital resource capacity — demand propagation and constraint detection</p>
      </div>

      <CapacityNetwork />
      <CapacityMatrix />
    </div>
  );
}
