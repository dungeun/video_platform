import { CouponType, DiscountType } from '../../types';
export const couponsAdminConfig = {
    id: 'coupons',
    name: 'Coupons Management',
    description: 'Manage coupons, campaigns, and promotions',
    icon: 'tag',
    navigation: {
        main: {
            label: 'Coupons',
            path: '/admin/coupons',
            icon: 'tag',
            order: 40
        },
        sub: [
            {
                label: 'All Coupons',
                path: '/admin/coupons',
                permissions: ['coupons.view']
            },
            {
                label: 'Campaigns',
                path: '/admin/coupons/campaigns',
                permissions: ['campaigns.view']
            },
            {
                label: 'Usage Analytics',
                path: '/admin/coupons/analytics',
                permissions: ['coupons.analytics']
            },
            {
                label: 'Reports',
                path: '/admin/coupons/reports',
                permissions: ['coupons.reports']
            }
        ]
    },
    permissions: {
        'coupons.view': 'View coupons',
        'coupons.create': 'Create coupons',
        'coupons.edit': 'Edit coupons',
        'coupons.delete': 'Delete coupons',
        'coupons.activate': 'Activate/deactivate coupons',
        'campaigns.view': 'View campaigns',
        'campaigns.create': 'Create campaigns',
        'campaigns.edit': 'Edit campaigns',
        'campaigns.delete': 'Delete campaigns',
        'coupons.analytics': 'View analytics',
        'coupons.reports': 'Generate reports'
    },
    routes: [
        {
            path: '/admin/coupons',
            component: 'CouponListView',
            permissions: ['coupons.view']
        },
        {
            path: '/admin/coupons/new',
            component: 'CouponCreateView',
            permissions: ['coupons.create']
        },
        {
            path: '/admin/coupons/:id',
            component: 'CouponDetailView',
            permissions: ['coupons.view']
        },
        {
            path: '/admin/coupons/:id/edit',
            component: 'CouponEditView',
            permissions: ['coupons.edit']
        },
        {
            path: '/admin/coupons/campaigns',
            component: 'CampaignListView',
            permissions: ['campaigns.view']
        },
        {
            path: '/admin/coupons/campaigns/new',
            component: 'CampaignCreateView',
            permissions: ['campaigns.create']
        },
        {
            path: '/admin/coupons/campaigns/:id',
            component: 'CampaignDetailView',
            permissions: ['campaigns.view']
        },
        {
            path: '/admin/coupons/analytics',
            component: 'CouponAnalyticsView',
            permissions: ['coupons.analytics']
        },
        {
            path: '/admin/coupons/reports',
            component: 'CouponReportsView',
            permissions: ['coupons.reports']
        }
    ],
    settings: {
        defaultCouponType: {
            label: 'Default Coupon Type',
            type: 'select',
            defaultValue: CouponType.PUBLIC,
            options: Object.values(CouponType)
        },
        defaultDiscountType: {
            label: 'Default Discount Type',
            type: 'select',
            defaultValue: DiscountType.PERCENTAGE,
            options: Object.values(DiscountType)
        },
        autoExpireCheck: {
            label: 'Auto Expire Check',
            type: 'boolean',
            defaultValue: true,
            description: 'Automatically check and deactivate expired coupons'
        },
        expireCheckInterval: {
            label: 'Expire Check Interval (hours)',
            type: 'number',
            defaultValue: 1,
            min: 1,
            max: 24
        },
        allowCouponStacking: {
            label: 'Allow Coupon Stacking',
            type: 'boolean',
            defaultValue: false,
            description: 'Allow multiple coupons to be used in a single order'
        }
    }
};
//# sourceMappingURL=coupons-admin.config.js.map