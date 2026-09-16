import { ResourceRipple, ResourceCascade } from '@/components/ResourceRipple';

export function RipplePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">Resource Ripple</h1>
        <p className="text-sm text-navy-500 mt-1">How a single demand change cascades through the hospital's resource network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResourceRipple />
        </div>
        <div className="lg:col-span-1">
          <ResourceCascade />
        </div>
      </div>
    </div>
  );
}
