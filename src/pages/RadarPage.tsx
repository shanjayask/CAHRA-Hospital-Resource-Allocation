import { CollisionRadar } from '@/components/CollisionRadar';

export function RadarPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">Collision Radar</h1>
        <p className="text-sm text-navy-500 mt-1">72-hour resource collision prediction — when will each resource cross its safe capacity?</p>
      </div>

      <CollisionRadar />
    </div>
  );
}
