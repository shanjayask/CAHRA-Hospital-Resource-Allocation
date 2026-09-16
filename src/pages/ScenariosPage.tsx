import { ScenarioLab } from '@/components/ScenarioLab';
import { ResourceRipple } from '@/components/ResourceRipple';
import { MinimumActionFinder } from '@/components/MinimumActionFinder';

export function ScenariosPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">Scenario Lab</h1>
        <p className="text-sm text-navy-500 mt-1">What-if simulator — test scenarios, see ripple effects, find minimum actions</p>
      </div>

      <ScenarioLab />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResourceRipple />
        <MinimumActionFinder />
      </div>
    </div>
  );
}
