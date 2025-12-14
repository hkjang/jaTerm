export { PolicyEngine, policyEngine } from './policy-engine';
export type { AccessRequest, AccessDecision } from './policy-engine';

export {
  createApprovalRequest,
  processApproval,
  getPendingApprovals,
  getUserApprovalRequests,
  hasValidApproval,
  expireOldRequests,
} from './approval-workflow';
export type { ApprovalRequestInput, ApprovalAction } from './approval-workflow';
