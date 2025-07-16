export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  imageUrl?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isSubscriptionEligible: boolean;
  subscriptionDiscounts?: SubscriptionDiscount[];
}

export interface SubscriptionDiscount {
  frequency: BillingFrequency;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description: string;
}

export type BillingFrequency = 
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annual'
  | 'annual'
  | 'custom';

export type SubscriptionStatus = 
  | 'active'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'pending'
  | 'trial'
  | 'past_due'
  | 'suspended';

export type DeliveryStatus = 
  | 'scheduled'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'disputed';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  billingFrequency: BillingFrequency;
  customInterval?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  discountPercentage: number;
  minimumCommitment?: {
    cycles: number;
    description: string;
  };
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountedPrice: number;
  totalPrice: number;
  customizations?: Record<string, any>;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  items: SubscriptionItem[];
  status: SubscriptionStatus;
  
  // Billing information
  billingFrequency: BillingFrequency;
  nextBillingDate: Date;
  lastBillingDate?: Date;
  billingCycleCount: number;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  
  // Delivery information
  deliverySchedule: DeliverySchedule;
  nextDeliveryDate: Date;
  lastDeliveryDate?: Date;
  deliveryAddress: DeliveryAddress;
  
  // Subscription lifecycle
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  pausedUntil?: Date;
  cancellationDate?: Date;
  cancellationReason?: string;
  
  // Payment information
  paymentMethodId: string;
  paymentMethod: PaymentMethod;
  
  // Settings and preferences
  preferences: SubscriptionPreferences;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  tags?: string[];
}

export interface DeliverySchedule {
  frequency: BillingFrequency;
  customInterval?: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  preferredDayOfWeek?: number; // 0-6, Sunday-Saturday
  preferredTimeSlot?: {
    start: string; // HH:mm format
    end: string;
  };
  skipHolidays: boolean;
  skipWeekends: boolean;
  specialInstructions?: string;
}

export interface DeliveryAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  instructions?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress?: DeliveryAddress;
}

export interface SubscriptionPreferences {
  emailNotifications: {
    upcomingDelivery: boolean;
    paymentProcessed: boolean;
    paymentFailed: boolean;
    subscriptionChanges: boolean;
    promotions: boolean;
  };
  smsNotifications: {
    upcomingDelivery: boolean;
    paymentFailed: boolean;
    deliveryUpdates: boolean;
  };
  autoRenewal: boolean;
  allowPartialDelivery: boolean;
  maxRetryAttempts: number;
  pauseOnPaymentFailure: boolean;
}

export interface SubscriptionOrder {
  id: string;
  subscriptionId: string;
  orderNumber: string;
  status: DeliveryStatus;
  items: SubscriptionItem[];
  
  // Billing
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  
  // Delivery
  scheduledDate: Date;
  deliveredDate?: Date;
  trackingNumber?: string;
  deliveryAddress: DeliveryAddress;
  
  // Payment
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentFailureReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface BillingCycle {
  id: string;
  subscriptionId: string;
  cycleNumber: number;
  billingDate: Date;
  dueDate: Date;
  amount: number;
  status: PaymentStatus;
  paymentId?: string;
  invoiceId?: string;
  failureReason?: string;
  retryCount: number;
  nextRetryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  retentionRate: number;
  subscriptionsByPlan: Record<string, number>;
  subscriptionsByStatus: Record<SubscriptionStatus, number>;
  revenueGrowth: {
    period: string;
    revenue: number;
    growth: number;
  }[];
}

export interface SubscriptionMetrics {
  subscriptionId: string;
  totalOrders: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  totalRevenue: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore?: number;
  lastActivityDate: Date;
}

// Request/Response types
export interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
  items: {
    productId: string;
    quantity: number;
    customizations?: Record<string, any>;
  }[];
  deliveryAddress: Omit<DeliveryAddress, 'id' | 'isDefault'>;
  paymentMethodId: string;
  deliverySchedule: DeliverySchedule;
  preferences?: Partial<SubscriptionPreferences>;
  couponCode?: string;
  trialDays?: number;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  items?: {
    productId: string;
    quantity: number;
    customizations?: Record<string, any>;
  }[];
  deliveryAddress?: Partial<DeliveryAddress>;
  deliverySchedule?: Partial<DeliverySchedule>;
  preferences?: Partial<SubscriptionPreferences>;
  paymentMethodId?: string;
}

export interface PauseSubscriptionRequest {
  subscriptionId: string;
  pauseUntil: Date;
  reason?: string;
}

export interface CancelSubscriptionRequest {
  subscriptionId: string;
  reason: string;
  immediate: boolean;
  refundUnusedPortion?: boolean;
}

export interface SkipDeliveryRequest {
  subscriptionId: string;
  skipDate: Date;
  reason?: string;
}

export interface SubscriptionListResponse {
  subscriptions: Subscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubscriptionOrderListResponse {
  orders: SubscriptionOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Hook interfaces
export interface UseSubscriptionOptions {
  subscriptionId: string;
  includeOrders?: boolean;
  includeMetrics?: boolean;
}

export interface UseSubscriptionResult {
  subscription: Subscription | null;
  orders: SubscriptionOrder[];
  metrics: SubscriptionMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateSubscription: (updates: UpdateSubscriptionRequest) => Promise<void>;
  pauseSubscription: (request: PauseSubscriptionRequest) => Promise<void>;
  resumeSubscription: () => Promise<void>;
  cancelSubscription: (request: CancelSubscriptionRequest) => Promise<void>;
  skipNextDelivery: (request: SkipDeliveryRequest) => Promise<void>;
}

export interface UseSubscriptionListOptions {
  userId: string;
  status?: SubscriptionStatus;
  page?: number;
  limit?: number;
}

export interface UseSubscriptionListResult {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

// Component Props
export interface SubscriptionPlanProps {
  plan: SubscriptionPlan;
  products: Product[];
  onSubscribe: (request: CreateSubscriptionRequest) => void;
  isLoading?: boolean;
  className?: string;
}

export interface SubscriptionManagerProps {
  subscription: Subscription;
  onUpdate: (updates: UpdateSubscriptionRequest) => Promise<void>;
  onPause: (request: PauseSubscriptionRequest) => Promise<void>;
  onResume: () => Promise<void>;
  onCancel: (request: CancelSubscriptionRequest) => Promise<void>;
  onSkipDelivery: (request: SkipDeliveryRequest) => Promise<void>;
  className?: string;
}

export interface DeliveryScheduleProps {
  schedule: DeliverySchedule;
  onUpdate: (schedule: DeliverySchedule) => void;
  isEditing?: boolean;
  className?: string;
}

export interface BillingHistoryProps {
  subscriptionId: string;
  billingCycles: BillingCycle[];
  onPaymentRetry: (cycleId: string) => Promise<void>;
  className?: string;
}

// Configuration and settings
export interface SubscriptionConfig {
  defaultTrialDays: number;
  maxPauseMonths: number;
  retryAttempts: number;
  retryIntervalDays: number[];
  gracePeriodDays: number;
  cancellationPolicy: {
    allowImmediateCancel: boolean;
    refundPolicy: 'none' | 'prorated' | 'full';
    minimumCommitmentEnforced: boolean;
  };
  delivery: {
    defaultLeadTimeDays: number;
    maxAdvanceDeliveryDays: number;
    allowWeekendDelivery: boolean;
    allowHolidayDelivery: boolean;
  };
  notifications: {
    upcomingDeliveryDays: number;
    paymentRetryDays: number[];
    cancellationReminderDays: number;
  };
}

// Error types
export interface SubscriptionError extends Error {
  code: string;
  type: 'validation' | 'payment' | 'delivery' | 'system';
  details?: Record<string, any>;
}

// Event types for webhooks/notifications
export interface SubscriptionEvent {
  id: string;
  type: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 
        'subscription.paused' | 'subscription.resumed' | 'subscription.expired' |
        'payment.succeeded' | 'payment.failed' | 'payment.retry' |
        'delivery.scheduled' | 'delivery.shipped' | 'delivery.delivered' | 'delivery.failed';
  subscriptionId: string;
  data: any;
  timestamp: Date;
  version: string;
}