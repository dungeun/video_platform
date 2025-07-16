import { Coupon, PromotionCampaign, CouponType, DiscountType } from '../types';

export * from './config/coupons-admin.config';

export const couponAdminConfig = {
  entities: {
    coupon: {
      name: 'Coupon',
      plural: 'Coupons',
      fields: {
        code: {
          label: 'Code',
          type: 'text',
          required: true,
          validation: {
            pattern: /^[A-Z0-9_-]+$/,
            minLength: 3,
            maxLength: 50
          }
        },
        name: {
          label: 'Name',
          type: 'text',
          required: true,
          maxLength: 100
        },
        description: {
          label: 'Description',
          type: 'textarea',
          maxLength: 500
        },
        type: {
          label: 'Type',
          type: 'select',
          required: true,
          options: Object.values(CouponType).map(value => ({
            value,
            label: value.replace(/_/g, ' ')
          }))
        },
        discountType: {
          label: 'Discount Type',
          type: 'select',
          required: true,
          options: Object.values(DiscountType).map(value => ({
            value,
            label: value.replace(/_/g, ' ')
          }))
        },
        discountValue: {
          label: 'Discount Value',
          type: 'number',
          required: true,
          min: 0
        },
        minPurchaseAmount: {
          label: 'Minimum Purchase Amount',
          type: 'number',
          min: 0
        },
        maxDiscountAmount: {
          label: 'Maximum Discount Amount',
          type: 'number',
          min: 0
        },
        validFrom: {
          label: 'Valid From',
          type: 'datetime',
          required: true
        },
        validUntil: {
          label: 'Valid Until',
          type: 'datetime',
          required: true
        },
        usageLimit: {
          label: 'Total Usage Limit',
          type: 'number',
          min: 1
        },
        usageLimitPerUser: {
          label: 'Usage Limit Per User',
          type: 'number',
          min: 1
        },
        isActive: {
          label: 'Active',
          type: 'boolean',
          defaultValue: true
        },
        campaignId: {
          label: 'Campaign',
          type: 'relation',
          relation: 'campaign'
        }
      },
      list: {
        columns: ['code', 'name', 'discountType', 'discountValue', 'isActive', 'usageCount', 'validUntil'],
        filters: ['type', 'discountType', 'isActive', 'campaignId'],
        searchFields: ['code', 'name', 'description'],
        defaultSort: { field: 'createdAt', order: 'desc' }
      },
      actions: {
        create: true,
        edit: true,
        delete: true,
        bulk: ['activate', 'deactivate', 'delete'],
        custom: [
          {
            name: 'duplicate',
            label: 'Duplicate',
            icon: 'copy',
            handler: 'duplicateCoupon'
          },
          {
            name: 'extend',
            label: 'Extend Expiry',
            icon: 'calendar',
            handler: 'extendExpiry'
          }
        ]
      }
    },
    campaign: {
      name: 'Campaign',
      plural: 'Campaigns',
      fields: {
        name: {
          label: 'Name',
          type: 'text',
          required: true,
          maxLength: 100
        },
        description: {
          label: 'Description',
          type: 'textarea',
          maxLength: 500
        },
        startDate: {
          label: 'Start Date',
          type: 'datetime',
          required: true
        },
        endDate: {
          label: 'End Date',
          type: 'datetime',
          required: true
        },
        budget: {
          label: 'Budget',
          type: 'number',
          min: 0
        },
        isActive: {
          label: 'Active',
          type: 'boolean',
          defaultValue: true
        }
      },
      list: {
        columns: ['name', 'startDate', 'endDate', 'budget', 'spentAmount', 'isActive'],
        filters: ['isActive'],
        searchFields: ['name', 'description'],
        defaultSort: { field: 'startDate', order: 'desc' }
      },
      actions: {
        create: true,
        edit: true,
        delete: true,
        custom: [
          {
            name: 'performance',
            label: 'View Performance',
            icon: 'chart',
            handler: 'viewPerformance'
          }
        ]
      }
    }
  },
  dashboard: {
    widgets: [
      {
        type: 'stat',
        title: 'Active Coupons',
        query: 'getActiveCouponsCount'
      },
      {
        type: 'stat',
        title: 'Total Usage This Month',
        query: 'getMonthlyUsageCount'
      },
      {
        type: 'stat',
        title: 'Total Discount Given',
        query: 'getTotalDiscountAmount'
      },
      {
        type: 'chart',
        title: 'Coupon Usage Trend',
        query: 'getUsageTrend',
        chartType: 'line'
      },
      {
        type: 'list',
        title: 'Top Performing Coupons',
        query: 'getTopCoupons',
        limit: 5
      },
      {
        type: 'list',
        title: 'Expiring Soon',
        query: 'getExpiringSoonCoupons',
        limit: 5
      }
    ]
  },
  reports: [
    {
      id: 'coupon-performance',
      name: 'Coupon Performance Report',
      description: 'Detailed analysis of coupon usage and effectiveness',
      parameters: {
        dateRange: { type: 'daterange', required: true },
        groupBy: { 
          type: 'select', 
          options: ['day', 'week', 'month'],
          defaultValue: 'day'
        }
      }
    },
    {
      id: 'campaign-roi',
      name: 'Campaign ROI Report',
      description: 'Return on investment analysis for promotion campaigns',
      parameters: {
        campaignId: { type: 'relation', relation: 'campaign' },
        dateRange: { type: 'daterange' }
      }
    }
  ]
};