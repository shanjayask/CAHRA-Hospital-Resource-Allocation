import { XAIExplanation, AIReasoningChain } from '@/components/XAIExplanation';
import { ModelComparison } from '@/components/RecommendationAudit';

export function ExplanationPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">AI Explanation</h1>
        <p className="text-sm text-navy-500 mt-1">Why the AI predicted this demand — explainable, auditable reasoning</p>
      </div>

      <XAIExplanation />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIReasoningChain activeStage={3} />
        <ModelComparison />
      </div>
    </div>
  );
}
