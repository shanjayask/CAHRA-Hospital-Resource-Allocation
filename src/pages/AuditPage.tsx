import { DecisionAudit, ModelComparison } from '@/components/RecommendationAudit';

export function AuditPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-navy-900">AI Audit</h1>
        <p className="text-sm text-navy-500 mt-1">Decision history, model explanations, and audit trail</p>
      </div>

      <DecisionAudit />
      <ModelComparison />
    </div>
  );
}
