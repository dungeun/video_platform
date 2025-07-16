// Services
export { SubscriptionService } from './services/SubscriptionService';
export { BillingService } from './services/BillingService';
export { DeliveryScheduler } from './services/DeliveryScheduler';

// Components
export { SubscriptionPlan } from './components/SubscriptionPlan';
// export { SubscriptionManager } from './components/SubscriptionManager';
// export { DeliverySchedule } from './components/DeliverySchedule';
// export { BillingHistory } from './components/BillingHistory';

// Hooks
export {
  useSubscription,
  useSubscriptionList,
  useSubscriptionAnalytics
} from './hooks/useSubscription';

// Types
export * from './types';

// Default configuration
export const defaultSubscriptionConfig = {
  defaultTrialDays: 7,
  maxPauseMonths: 3,
  retryAttempts: 3,
  retryIntervalDays: [1, 3, 7],
  gracePeriodDays: 5,
  cancellationPolicy: {
    allowImmediateCancel: true,
    refundPolicy: 'prorated' as const,
    minimumCommitmentEnforced: false
  },
  delivery: {
    defaultLeadTimeDays: 2,
    maxAdvanceDeliveryDays: 30,
    allowWeekendDelivery: false,
    allowHolidayDelivery: false
  },
  notifications: {
    upcomingDeliveryDays: 3,
    paymentRetryDays: [1, 3, 7],
    cancellationReminderDays: 7
  }
};

// Create service instance
let serviceInstance: SubscriptionService | null = null;

export const createSubscriptionService = (config = defaultSubscriptionConfig): SubscriptionService => {
  if (!serviceInstance) {
    serviceInstance = new SubscriptionService(config);
  }
  return serviceInstance;
};

export const getSubscriptionService = (): SubscriptionService => {
  if (!serviceInstance) {
    serviceInstance = createSubscriptionService();
  }
  return serviceInstance;
};

// Helper function to initialize the module
export const initializeSubscriptions = (config = defaultSubscriptionConfig) => {
  const service = createSubscriptionService(config);
  
  console.log('Subscription module initialized');
  
  return service;
};

// Module metadata
export const moduleInfo = {
  name: '@modules/subscription',
  version: '1.0.0',
  description: 'Comprehensive subscription and recurring order management system',
  author: 'Module Development Team',
  dependencies: [
    '@modules/types',
    '@modules/api-client',
    '@modules/storage',
    '@modules/payment-toss'
  ],
  features: [
    'Subscription Plan Management',
    'Recurring Billing',
    'Delivery Scheduling',
    'Payment Processing',
    'Subscription Analytics',
    'Customer Management',
    'Pause/Resume Functionality',
    'Cancellation Workflow',
    'Delivery Tracking',
    'Notification System'
  ],
  billingFrequencies: [
    'weekly',
    'bi-weekly', 
    'monthly',
    'quarterly',
    'semi-annual',
    'annual',
    'custom'
  ]
};