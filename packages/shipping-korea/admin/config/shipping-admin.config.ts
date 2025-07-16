/**
 * Shipping Korea Admin Configuration
 */

export const shippingAdminConfig = {
  module: {
    id: 'shipping-korea',
    name: '한국 택배 서비스',
    description: '한국 국내 택배 서비스 통합 관리',
    icon: 'truck',
    version: '1.0.0'
  },
  
  menu: {
    main: [
      {
        id: 'tracking',
        label: '배송 추적',
        path: '/admin/shipping/tracking',
        icon: 'search',
        permissions: ['shipping.tracking.view']
      },
      {
        id: 'cost',
        label: '배송비 계산',
        path: '/admin/shipping/cost',
        icon: 'calculator',
        permissions: ['shipping.cost.view']
      },
      {
        id: 'carriers',
        label: '택배사 관리',
        path: '/admin/shipping/carriers',
        icon: 'building',
        permissions: ['shipping.carriers.manage']
      },
      {
        id: 'webhooks',
        label: '웹훅 설정',
        path: '/admin/shipping/webhooks',
        icon: 'webhook',
        permissions: ['shipping.webhooks.manage']
      }
    ],
    
    reports: [
      {
        id: 'delivery-stats',
        label: '배송 통계',
        path: '/admin/shipping/reports/delivery-stats',
        icon: 'chart-bar'
      },
      {
        id: 'carrier-performance',
        label: '택배사 성과',
        path: '/admin/shipping/reports/carrier-performance',
        icon: 'chart-line'
      }
    ]
  },
  
  permissions: {
    tracking: {
      view: '배송 추적 조회',
      export: '배송 데이터 내보내기'
    },
    cost: {
      view: '배송비 조회',
      calculate: '배송비 계산'
    },
    carriers: {
      view: '택배사 정보 조회',
      manage: '택배사 설정 관리'
    },
    webhooks: {
      view: '웹훅 조회',
      manage: '웹훅 관리',
      test: '웹훅 테스트'
    }
  },
  
  widgets: [
    {
      id: 'delivery-overview',
      title: '오늘의 배송 현황',
      component: 'DeliveryOverviewWidget',
      size: 'large',
      refreshInterval: 60000
    },
    {
      id: 'carrier-status',
      title: '택배사 상태',
      component: 'CarrierStatusWidget',
      size: 'medium',
      refreshInterval: 300000
    },
    {
      id: 'recent-exceptions',
      title: '최근 배송 예외',
      component: 'RecentExceptionsWidget',
      size: 'medium',
      refreshInterval: 120000
    }
  ],
  
  settings: {
    general: {
      defaultCarrier: 'CJ',
      autoRefreshInterval: 60000,
      cacheEnabled: true,
      cacheTTL: 300000
    },
    
    notifications: {
      enabled: true,
      events: ['DELIVERED', 'FAILED', 'EXCEPTION'],
      channels: ['email', 'webhook']
    },
    
    api: {
      timeout: 30000,
      retryAttempts: 3,
      rateLimitPerMinute: 100
    }
  }
};