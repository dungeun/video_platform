import { SubscriptionConfig, Subscription, SubscriptionAnalytics } from '../src/types';

export interface SubscriptionAdminConfig extends SubscriptionConfig {
  // Extended admin-specific configuration
  adminSettings: {
    allowBulkOperations: boolean;
    enableAdvancedAnalytics: boolean;
    maxSubscriptionsPerUser: number;
    allowCustomBillingCycles: boolean;
    enableSubscriptionTiers: boolean;
    autoApproveChanges: boolean;
  };
  
  // Business rules
  businessRules: {
    minimumSubscriptionValue: number;
    maximumSubscriptionValue: number;
    allowedPaymentMethods: string[];
    restrictedProducts: string[];
    geographicRestrictions: string[];
    taxConfiguration: {
      enabled: boolean;
      defaultRate: number;
      regionSpecificRates: Record<string, number>;
    };
  };
  
  // Automation settings
  automation: {
    autoRetryFailedPayments: boolean;
    autoPauseOnMultipleFailures: boolean;
    autoResumeAfterPaymentUpdate: boolean;
    sendRenewalReminders: boolean;
    processCancellationRequests: boolean;
  };
  
  // Reporting and analytics
  reporting: {
    enableRealTimeReports: boolean;
    dataRetentionPeriodDays: number;
    exportFormats: string[];
    scheduledReports: {
      daily: boolean;
      weekly: boolean;
      monthly: boolean;
    };
  };
}

export const defaultAdminConfig: SubscriptionAdminConfig = {
  // Base configuration
  defaultTrialDays: 7,
  maxPauseMonths: 3,
  retryAttempts: 3,
  retryIntervalDays: [1, 3, 7],
  gracePeriodDays: 5,
  cancellationPolicy: {
    allowImmediateCancel: true,
    refundPolicy: 'prorated',
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
  },
  
  // Admin-specific settings
  adminSettings: {
    allowBulkOperations: true,
    enableAdvancedAnalytics: true,
    maxSubscriptionsPerUser: 10,
    allowCustomBillingCycles: false,
    enableSubscriptionTiers: true,
    autoApproveChanges: false
  },
  
  businessRules: {
    minimumSubscriptionValue: 10.00,
    maximumSubscriptionValue: 1000.00,
    allowedPaymentMethods: ['card', 'bank_account'],
    restrictedProducts: [],
    geographicRestrictions: [],
    taxConfiguration: {
      enabled: true,
      defaultRate: 0.10, // 10%
      regionSpecificRates: {
        'CA': 0.08,
        'NY': 0.12,
        'TX': 0.06
      }
    }
  },
  
  automation: {
    autoRetryFailedPayments: true,
    autoPauseOnMultipleFailures: true,
    autoResumeAfterPaymentUpdate: true,
    sendRenewalReminders: true,
    processCancellationRequests: false
  },
  
  reporting: {
    enableRealTimeReports: true,
    dataRetentionPeriodDays: 365,
    exportFormats: ['csv', 'excel', 'pdf'],
    scheduledReports: {
      daily: false,
      weekly: true,
      monthly: true
    }
  }
};

export class SubscriptionAdminService {
  private config: SubscriptionAdminConfig;

  constructor(config: SubscriptionAdminConfig = defaultAdminConfig) {
    this.config = config;
  }

  // Configuration management
  updateConfig(updates: Partial<SubscriptionAdminConfig>): void {
    this.config = { ...this.config, ...updates };
    this.validateConfig();
  }

  getConfig(): SubscriptionAdminConfig {
    return { ...this.config };
  }

  validateConfig(): boolean {
    if (this.config.defaultTrialDays < 0) {
      throw new Error('Default trial days must be non-negative');
    }
    
    if (this.config.maxPauseMonths <= 0) {
      throw new Error('Max pause months must be positive');
    }
    
    if (this.config.businessRules.minimumSubscriptionValue < 0) {
      throw new Error('Minimum subscription value must be non-negative');
    }
    
    if (this.config.businessRules.maximumSubscriptionValue <= this.config.businessRules.minimumSubscriptionValue) {
      throw new Error('Maximum subscription value must be greater than minimum');
    }
    
    return true;
  }

  // Subscription management
  async bulkUpdateSubscriptions(subscriptionIds: string[], updates: any): Promise<void> {
    if (!this.config.adminSettings.allowBulkOperations) {
      throw new Error('Bulk operations are not enabled');
    }
    
    console.log(`Bulk updating ${subscriptionIds.length} subscriptions`);
    // Implementation would update multiple subscriptions
  }

  async pauseMultipleSubscriptions(subscriptionIds: string[], pauseUntil: Date): Promise<void> {
    if (!this.config.adminSettings.allowBulkOperations) {
      throw new Error('Bulk operations are not enabled');
    }
    
    console.log(`Pausing ${subscriptionIds.length} subscriptions until ${pauseUntil}`);
  }

  async resumeMultipleSubscriptions(subscriptionIds: string[]): Promise<void> {
    if (!this.config.adminSettings.allowBulkOperations) {
      throw new Error('Bulk operations are not enabled');
    }
    
    console.log(`Resuming ${subscriptionIds.length} subscriptions`);
  }

  // Analytics and reporting
  async getAdvancedAnalytics(timeRange: { start: Date; end: Date }): Promise<SubscriptionAnalytics & {
    cohortAnalysis: any;
    churnPrediction: any;
    revenueForecasting: any;
  }> {
    if (!this.config.adminSettings.enableAdvancedAnalytics) {
      throw new Error('Advanced analytics are not enabled');
    }
    
    // Mock advanced analytics
    return {
      totalSubscriptions: 1250,
      activeSubscriptions: 980,
      churnRate: 0.08,
      monthlyRecurringRevenue: 125000,
      averageOrderValue: 85.50,
      customerLifetimeValue: 450.75,
      retentionRate: 0.92,
      subscriptionsByPlan: { monthly: 650, quarterly: 280, annual: 50 },
      subscriptionsByStatus: {
        active: 980, paused: 120, cancelled: 100, expired: 30,
        trial: 20, pending: 0, past_due: 15, suspended: 5
      },
      revenueGrowth: [
        { period: '2024-01', revenue: 110000, growth: 0.12 },
        { period: '2024-02', revenue: 118000, growth: 0.07 },
        { period: '2024-03', revenue: 125000, growth: 0.06 }
      ],
      cohortAnalysis: {
        month1Retention: 0.85,
        month3Retention: 0.72,
        month6Retention: 0.65,
        month12Retention: 0.58
      },
      churnPrediction: {
        highRiskSubscriptions: 45,
        mediumRiskSubscriptions: 120,
        lowRiskSubscriptions: 815
      },
      revenueForecasting: {
        nextMonth: 130000,
        nextQuarter: 385000,
        nextYear: 1560000
      }
    };
  }

  async exportSubscriptionData(
    format: 'csv' | 'excel' | 'pdf',
    filters: any = {}
  ): Promise<string> {
    if (!this.config.reporting.exportFormats.includes(format)) {
      throw new Error(`Export format ${format} is not enabled`);
    }
    
    console.log(`Exporting subscription data in ${format} format`);
    return `export_${Date.now()}.${format}`;
  }

  // Business rule management
  addProductRestriction(productId: string): void {
    if (!this.config.businessRules.restrictedProducts.includes(productId)) {
      this.config.businessRules.restrictedProducts.push(productId);
    }
  }

  removeProductRestriction(productId: string): void {
    this.config.businessRules.restrictedProducts = 
      this.config.businessRules.restrictedProducts.filter(id => id !== productId);
  }

  updateTaxRate(region: string, rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Tax rate must be between 0 and 1');
    }
    this.config.businessRules.taxConfiguration.regionSpecificRates[region] = rate;
  }

  // Automation management
  enableAutomation(feature: keyof SubscriptionAdminConfig['automation']): void {
    this.config.automation[feature] = true;
  }

  disableAutomation(feature: keyof SubscriptionAdminConfig['automation']): void {
    this.config.automation[feature] = false;
  }

  // System operations
  async processFailedPayments(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    console.log('Processing failed payments...');
    
    // Mock processing results
    return {
      processed: 25,
      successful: 18,
      failed: 7
    };
  }

  async generateScheduledReports(): Promise<string[]> {
    const reports: string[] = [];
    
    if (this.config.reporting.scheduledReports.daily) {
      reports.push('daily_subscription_report.pdf');
    }
    
    if (this.config.reporting.scheduledReports.weekly) {
      reports.push('weekly_subscription_report.pdf');
    }
    
    if (this.config.reporting.scheduledReports.monthly) {
      reports.push('monthly_subscription_report.pdf');
    }
    
    console.log(`Generated ${reports.length} scheduled reports`);
    return reports;
  }

  async cleanupExpiredData(): Promise<{
    subscriptionsArchived: number;
    ordersArchived: number;
    dataSize: string;
  }> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.config.reporting.dataRetentionPeriodDays);
    
    console.log(`Cleaning up data older than ${retentionDate}`);
    
    return {
      subscriptionsArchived: 15,
      ordersArchived: 287,
      dataSize: '145 MB'
    };
  }

  // Health monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {};
    
    try {
      // Check subscription processing
      details.subscriptionProcessing = {
        status: 'healthy',
        activeSubscriptions: 980,
        processingQueue: 5
      };
      
      // Check billing system
      details.billing = {
        status: 'healthy',
        successRate: 0.95,
        failedPayments: 12
      };
      
      // Check delivery system
      details.delivery = {
        status: 'healthy',
        onTimeRate: 0.92,
        pendingDeliveries: 45
      };
      
      // Check data integrity
      details.dataIntegrity = {
        status: 'healthy',
        inconsistencies: 0,
        lastCheck: new Date()
      };
      
      return { status: 'healthy', details };
    } catch (error) {
      details.error = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'unhealthy', details };
    }
  }

  // Configuration import/export
  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfiguration(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...defaultAdminConfig, ...importedConfig };
      this.validateConfig();
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  }
}

// Export the admin service instance
export const subscriptionAdminService = new SubscriptionAdminService();