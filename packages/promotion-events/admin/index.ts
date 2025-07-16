/**
 * Promotion Events Admin Configuration
 * Admin interface configuration for managing promotions, events, and banners
 */

import { 
  PromotionCampaign, 
  Event, 
  Banner, 
  DiscountType, 
  CampaignStatus, 
  EventType,
  BannerPosition,
  AudienceType 
} from '../src/types';

// Admin configuration for the promotion events module
export const promotionEventsAdminConfig = {
  moduleName: 'Promotion Events',
  moduleId: 'promotion-events',
  version: '1.0.0',
  
  // Navigation configuration
  navigation: {
    label: 'Promotions',
    icon: 'percentage',
    order: 5,
    children: [
      {
        label: 'Campaigns',
        path: '/admin/promotions/campaigns',
        icon: 'campaign',
        permissions: ['promotion.read', 'promotion.write']
      },
      {
        label: 'Events',
        path: '/admin/promotions/events',
        icon: 'event',
        permissions: ['event.read', 'event.write']
      },
      {
        label: 'Banners',
        path: '/admin/promotions/banners',
        icon: 'banner',
        permissions: ['banner.read', 'banner.write']
      },
      {
        label: 'Coupons',
        path: '/admin/promotions/coupons',
        icon: 'ticket',
        permissions: ['coupon.read', 'coupon.write']
      },
      {
        label: 'Analytics',
        path: '/admin/promotions/analytics',
        icon: 'chart',
        permissions: ['promotion.analytics']
      }
    ]
  },

  // Permissions configuration
  permissions: [
    {
      key: 'promotion.read',
      name: 'View Promotions',
      description: 'Can view promotion campaigns and their details'
    },
    {
      key: 'promotion.write',
      name: 'Manage Promotions',
      description: 'Can create, edit, and delete promotion campaigns'
    },
    {
      key: 'promotion.activate',
      name: 'Activate/Deactivate Promotions',
      description: 'Can activate and deactivate promotion campaigns'
    },
    {
      key: 'event.read',
      name: 'View Events',
      description: 'Can view promotional events and their details'
    },
    {
      key: 'event.write',
      name: 'Manage Events',
      description: 'Can create, edit, and delete promotional events'
    },
    {
      key: 'banner.read',
      name: 'View Banners',
      description: 'Can view promotional banners and their details'
    },
    {
      key: 'banner.write',
      name: 'Manage Banners',
      description: 'Can create, edit, and delete promotional banners'
    },
    {
      key: 'coupon.read',
      name: 'View Coupons',
      description: 'Can view coupon codes and their usage'
    },
    {
      key: 'coupon.write',
      name: 'Manage Coupons',
      description: 'Can generate and manage coupon codes'
    },
    {
      key: 'promotion.analytics',
      name: 'View Analytics',
      description: 'Can view promotion and event analytics'
    }
  ],

  // Dashboard widgets
  dashboardWidgets: [
    {
      id: 'active-promotions',
      title: 'Active Promotions',
      type: 'stat',
      size: 'small',
      icon: 'percentage',
      permissions: ['promotion.read'],
      refreshInterval: 30000
    },
    {
      id: 'promotion-performance',
      title: 'Promotion Performance',
      type: 'chart',
      size: 'medium',
      icon: 'chart-line',
      permissions: ['promotion.analytics'],
      refreshInterval: 60000
    },
    {
      id: 'upcoming-events',
      title: 'Upcoming Events',
      type: 'list',
      size: 'medium',
      icon: 'calendar',
      permissions: ['event.read'],
      refreshInterval: 300000 // 5 minutes
    },
    {
      id: 'banner-metrics',
      title: 'Banner Performance',
      type: 'metric',
      size: 'small',
      icon: 'eye',
      permissions: ['banner.read'],
      refreshInterval: 120000
    }
  ],

  // Entity configurations
  entities: {
    // Promotion Campaign configuration
    promotion: {
      name: 'Promotion Campaign',
      pluralName: 'Promotion Campaigns',
      icon: 'percentage',
      
      // List view configuration
      listView: {
        defaultSort: { field: 'priority', direction: 'desc' },
        itemsPerPage: 20,
        
        columns: [
          {
            key: 'name',
            label: 'Campaign Name',
            sortable: true,
            searchable: true,
            width: '25%'
          },
          {
            key: 'discountConfig.type',
            label: 'Discount Type',
            sortable: true,
            filterable: true,
            width: '15%',
            render: (value: DiscountType) => {
              const labels = {
                [DiscountType.PERCENTAGE]: 'Percentage',
                [DiscountType.FIXED]: 'Fixed Amount',
                [DiscountType.BUY_X_GET_Y]: 'Buy X Get Y',
                [DiscountType.FREE_SHIPPING]: 'Free Shipping'
              };
              return labels[value] || value;
            }
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            filterable: true,
            width: '12%',
            render: (value: CampaignStatus) => ({
              [CampaignStatus.DRAFT]: { text: 'Draft', color: 'gray' },
              [CampaignStatus.SCHEDULED]: { text: 'Scheduled', color: 'blue' },
              [CampaignStatus.ACTIVE]: { text: 'Active', color: 'green' },
              [CampaignStatus.PAUSED]: { text: 'Paused', color: 'yellow' },
              [CampaignStatus.ENDED]: { text: 'Ended', color: 'red' },
              [CampaignStatus.CANCELLED]: { text: 'Cancelled', color: 'red' }
            }[value])
          },
          {
            key: 'startDate',
            label: 'Start Date',
            sortable: true,
            width: '12%',
            render: (value: Date) => new Intl.DateTimeFormat('ko-KR').format(value)
          },
          {
            key: 'endDate',
            label: 'End Date',
            sortable: true,
            width: '12%',
            render: (value: Date) => new Intl.DateTimeFormat('ko-KR').format(value)
          },
          {
            key: 'usage.totalUsed',
            label: 'Usage',
            sortable: true,
            width: '8%'
          },
          {
            key: 'priority',
            label: 'Priority',
            sortable: true,
            width: '8%'
          }
        ],
        
        filters: [
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: Object.values(CampaignStatus).map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1)
            }))
          },
          {
            key: 'discountType',
            label: 'Discount Type',
            type: 'select',
            options: Object.values(DiscountType).map(type => ({
              value: type,
              label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
            }))
          },
          {
            key: 'audienceType',
            label: 'Target Audience',
            type: 'select',
            options: Object.values(AudienceType).map(type => ({
              value: type,
              label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
            }))
          }
        ],
        
        bulkActions: [
          {
            key: 'activate',
            label: 'Activate',
            icon: 'play',
            permissions: ['promotion.activate'],
            confirmMessage: 'Are you sure you want to activate selected promotions?'
          },
          {
            key: 'deactivate',
            label: 'Deactivate',
            icon: 'pause',
            permissions: ['promotion.activate'],
            confirmMessage: 'Are you sure you want to deactivate selected promotions?'
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: 'trash',
            permissions: ['promotion.write'],
            confirmMessage: 'Are you sure you want to delete selected promotions? This action cannot be undone.',
            variant: 'danger'
          }
        ]
      },
      
      // Form configuration
      form: {
        sections: [
          {
            title: 'Basic Information',
            fields: [
              {
                key: 'name',
                label: 'Campaign Name',
                type: 'text',
                required: true,
                validation: { maxLength: 100 }
              },
              {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                validation: { maxLength: 500 }
              },
              {
                key: 'tags',
                label: 'Tags',
                type: 'tags',
                help: 'Add tags to categorize this promotion'
              }
            ]
          },
          {
            title: 'Discount Configuration',
            fields: [
              {
                key: 'discountConfig.type',
                label: 'Discount Type',
                type: 'select',
                required: true,
                options: Object.values(DiscountType).map(type => ({
                  value: type,
                  label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                }))
              },
              {
                key: 'discountConfig.percentage',
                label: 'Percentage (%)',
                type: 'number',
                min: 0,
                max: 100,
                showWhen: { 'discountConfig.type': DiscountType.PERCENTAGE }
              },
              {
                key: 'discountConfig.maxAmount',
                label: 'Maximum Discount Amount',
                type: 'currency',
                showWhen: { 'discountConfig.type': DiscountType.PERCENTAGE }
              },
              {
                key: 'discountConfig.amount',
                label: 'Discount Amount',
                type: 'currency',
                showWhen: { 'discountConfig.type': DiscountType.FIXED }
              }
            ]
          },
          {
            title: 'Usage Conditions',
            fields: [
              {
                key: 'usageConditions.minimumOrderAmount',
                label: 'Minimum Order Amount',
                type: 'currency'
              },
              {
                key: 'usageConditions.maximumOrderAmount',
                label: 'Maximum Order Amount',
                type: 'currency'
              },
              {
                key: 'usageConditions.usageLimit',
                label: 'Total Usage Limit',
                type: 'number',
                min: 1
              },
              {
                key: 'usageConditions.userUsageLimit',
                label: 'Per User Usage Limit',
                type: 'number',
                min: 1
              }
            ]
          },
          {
            title: 'Target Audience',
            fields: [
              {
                key: 'targetAudience.type',
                label: 'Audience Type',
                type: 'select',
                required: true,
                options: Object.values(AudienceType).map(type => ({
                  value: type,
                  label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                }))
              }
            ]
          },
          {
            title: 'Schedule',
            fields: [
              {
                key: 'startDate',
                label: 'Start Date',
                type: 'datetime',
                required: true
              },
              {
                key: 'endDate',
                label: 'End Date',
                type: 'datetime',
                required: true
              },
              {
                key: 'priority',
                label: 'Priority',
                type: 'number',
                help: 'Higher numbers have higher priority'
              },
              {
                key: 'isStackable',
                label: 'Stackable with other promotions',
                type: 'checkbox'
              }
            ]
          }
        ]
      }
    },

    // Event configuration
    event: {
      name: 'Event',
      pluralName: 'Events',
      icon: 'calendar',
      
      listView: {
        defaultSort: { field: 'startDate', direction: 'desc' },
        itemsPerPage: 20,
        
        columns: [
          {
            key: 'name',
            label: 'Event Name',
            sortable: true,
            searchable: true,
            width: '25%'
          },
          {
            key: 'type',
            label: 'Type',
            sortable: true,
            filterable: true,
            width: '15%'
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            filterable: true,
            width: '12%'
          },
          {
            key: 'startDate',
            label: 'Start Date',
            sortable: true,
            width: '12%'
          },
          {
            key: 'endDate',
            label: 'End Date',
            sortable: true,
            width: '12%'
          },
          {
            key: 'featured',
            label: 'Featured',
            width: '8%',
            render: (value: boolean) => value ? 'Yes' : 'No'
          },
          {
            key: 'views',
            label: 'Views',
            sortable: true,
            width: '8%'
          }
        ]
      }
    },

    // Banner configuration
    banner: {
      name: 'Banner',
      pluralName: 'Banners',
      icon: 'image',
      
      listView: {
        defaultSort: { field: 'priority', direction: 'desc' },
        itemsPerPage: 20,
        
        columns: [
          {
            key: 'title',
            label: 'Title',
            sortable: true,
            searchable: true,
            width: '25%'
          },
          {
            key: 'position',
            label: 'Position',
            sortable: true,
            filterable: true,
            width: '15%'
          },
          {
            key: 'isActive',
            label: 'Status',
            sortable: true,
            filterable: true,
            width: '10%',
            render: (value: boolean) => ({
              text: value ? 'Active' : 'Inactive',
              color: value ? 'green' : 'gray'
            })
          },
          {
            key: 'priority',
            label: 'Priority',
            sortable: true,
            width: '10%'
          },
          {
            key: 'impressions',
            label: 'Impressions',
            sortable: true,
            width: '12%'
          },
          {
            key: 'clicks',
            label: 'Clicks',
            sortable: true,
            width: '10%'
          },
          {
            key: 'clickThroughRate',
            label: 'CTR (%)',
            sortable: true,
            width: '10%',
            render: (value: number) => `${value.toFixed(2)}%`
          }
        ]
      }
    }
  },

  // Quick actions
  quickActions: [
    {
      key: 'create-promotion',
      label: 'Create Promotion',
      icon: 'plus',
      path: '/admin/promotions/campaigns/create',
      permissions: ['promotion.write'],
      variant: 'primary'
    },
    {
      key: 'create-event',
      label: 'Create Event',
      icon: 'calendar-plus',
      path: '/admin/promotions/events/create',
      permissions: ['event.write']
    },
    {
      key: 'create-banner',
      label: 'Create Banner',
      icon: 'image-plus',
      path: '/admin/promotions/banners/create',
      permissions: ['banner.write']
    },
    {
      key: 'view-analytics',
      label: 'View Analytics',
      icon: 'chart-bar',
      path: '/admin/promotions/analytics',
      permissions: ['promotion.analytics']
    }
  ],

  // Export configuration
  exports: [
    {
      key: 'promotions-csv',
      label: 'Export Promotions (CSV)',
      entity: 'promotion',
      format: 'csv',
      permissions: ['promotion.read']
    },
    {
      key: 'promotions-excel',
      label: 'Export Promotions (Excel)',
      entity: 'promotion',
      format: 'xlsx',
      permissions: ['promotion.read']
    },
    {
      key: 'analytics-pdf',
      label: 'Export Analytics Report (PDF)',
      entity: 'analytics',
      format: 'pdf',
      permissions: ['promotion.analytics']
    }
  ],

  // Settings configuration
  settings: [
    {
      key: 'defaultCurrency',
      label: 'Default Currency',
      type: 'select',
      options: [
        { value: 'KRW', label: 'Korean Won (₩)' },
        { value: 'USD', label: 'US Dollar ($)' },
        { value: 'EUR', label: 'Euro (€)' },
        { value: 'JPY', label: 'Japanese Yen (¥)' }
      ],
      defaultValue: 'KRW'
    },
    {
      key: 'defaultPromotionDuration',
      label: 'Default Promotion Duration (days)',
      type: 'number',
      min: 1,
      max: 365,
      defaultValue: 30
    },
    {
      key: 'maxCouponsPerGeneration',
      label: 'Maximum Coupons Per Generation',
      type: 'number',
      min: 1,
      max: 100000,
      defaultValue: 10000
    },
    {
      key: 'enableAnalytics',
      label: 'Enable Analytics Tracking',
      type: 'checkbox',
      defaultValue: true
    },
    {
      key: 'autoArchiveExpired',
      label: 'Auto-archive Expired Promotions',
      type: 'checkbox',
      defaultValue: false
    }
  ]
};

export default promotionEventsAdminConfig;