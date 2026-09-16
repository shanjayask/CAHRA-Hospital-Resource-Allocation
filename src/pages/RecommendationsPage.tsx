import { RecommendationPanel } from '@/components/RecommendationAudit';
import { MinimumActionFinder } from '@/components/MinimumActionFinder';
import { ResearchComparison } from '@/components/ResearchComparison';

export function RecommendationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">Recommendations</h1>
        <p className="text-sm text-navy-500 mt-1">AI-generated decision support — what to do, why, when, and expected impact</p>
      </div>

      <RecommendationPanel />
      <MinimumActionFinder />
      <ResearchComparison />
    </div>
  );
}
