// Main service
export { FraudDetectionService } from './services/fraud-detection.service';

// Detectors
export { FakeFollowerDetector } from './detectors/fake-follower.detector';
export { EngagementFraudDetector } from './detectors/engagement-fraud.detector';
export { ContentFraudDetector } from './detectors/content-fraud.detector';
export { PaymentFraudDetector } from './detectors/payment-fraud.detector';

// ML and Rules
export { MLManager } from './ml/ml-manager';
export { RuleEngine } from './utils/rule-engine';

// Types and Interfaces
export * from './types';

// Re-export commonly used types
export type {
  FraudDetectionConfig,
  FraudAnalysis,
  InfluencerAnalysisParams,
  FollowerAnalysisParams,
  EngagementAnalysisParams,
  ContentAnalysisParams,
  PaymentAnalysisParams,
  BatchAnalysisParams,
  FraudRule,
  MLModel,
  FraudAlert
} from './types';

// Re-export enums
export {
  FraudType,
  Severity,
  RuleAction
} from './types';

// Default export for easy importing
import { FraudDetectionService } from './services/fraud-detection.service';
export default FraudDetectionService;