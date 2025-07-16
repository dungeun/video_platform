/**
 * @company/campaign-management - Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  CampaignService,
  CampaignStatus,
  Platform,
  ContentType,
  validateCampaignData,
  validateCampaignStatus,
  calculateCampaignProgress,
  formatMoney,
  canEditCampaign
} from '../src';
import type { 
  Campaign, 
  CreateCampaignRequest,
  CampaignPeriod,
  Money 
} from '../src/types';

// Mock API Client
vi.mock('@company/utils', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }))
}));

// Mock Event Bus
vi.mock('@company/core', () => ({
  EventBus: {
    getInstance: vi.fn().mockReturnValue({
      emit: vi.fn()
    })
  }
}));

describe('CampaignService', () => {
  let service: CampaignService;
  
  beforeEach(() => {
    service = new CampaignService({
      apiUrl: 'https://api.example.com',
      apiKey: 'test-key'
    });
  });
  
  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const mockCampaign: Campaign = {
        id: '123',
        brandId: 'brand-123',
        title: 'Test Campaign',
        description: 'Test Description',
        category: ['fashion'],
        budget: {
          total: { amount: 10000, currency: 'USD' },
          currency: 'USD',
          allocated: { amount: 0, currency: 'USD' },
          spent: { amount: 0, currency: 'USD' }
        },
        period: {
          recruitStart: new Date('2024-01-01'),
          recruitEnd: new Date('2024-01-07'),
          campaignStart: new Date('2024-01-08'),
          campaignEnd: new Date('2024-02-08')
        },
        requirements: {
          minFollowers: 10000,
          platforms: [Platform.INSTAGRAM],
          contentType: [ContentType.POST],
          hashtags: ['#test']
        },
        status: CampaignStatus.DRAFT,
        participants: [],
        isDraft: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const createRequest: CreateCampaignRequest = {
        title: 'Test Campaign',
        description: 'Test Description for campaign management',
        category: ['fashion'],
        budget: {
          total: { amount: 10000, currency: 'USD' },
          currency: 'USD'
        },
        period: mockCampaign.period,
        requirements: mockCampaign.requirements
      };
      
      (service as any).apiClient.post.mockResolvedValue(mockCampaign);
      
      const result = await service.createCampaign(createRequest);
      
      expect(result).toEqual(mockCampaign);
      expect((service as any).apiClient.post).toHaveBeenCalledWith('/campaigns', createRequest);
    });
  });
  
  describe('updateCampaignStatus', () => {
    it('should update campaign status', async () => {
      const updatedCampaign: Campaign = {
        id: '123',
        brandId: 'brand-123',
        title: 'Test Campaign',
        description: 'Test Description',
        category: ['fashion'],
        budget: {
          total: { amount: 10000, currency: 'USD' },
          currency: 'USD',
          allocated: { amount: 0, currency: 'USD' },
          spent: { amount: 0, currency: 'USD' }
        },
        period: {
          recruitStart: new Date('2024-01-01'),
          recruitEnd: new Date('2024-01-07'),
          campaignStart: new Date('2024-01-08'),
          campaignEnd: new Date('2024-02-08')
        },
        requirements: {
          minFollowers: 10000,
          platforms: [Platform.INSTAGRAM],
          contentType: [ContentType.POST],
          hashtags: ['#test']
        },
        status: CampaignStatus.RECRUITING,
        participants: [],
        isDraft: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (service as any).apiClient.patch.mockResolvedValue(updatedCampaign);
      
      const result = await service.updateCampaignStatus('123', CampaignStatus.RECRUITING);
      
      expect(result.status).toBe(CampaignStatus.RECRUITING);
      expect((service as any).apiClient.patch).toHaveBeenCalledWith(
        '/campaigns/123/status',
        { status: CampaignStatus.RECRUITING }
      );
    });
  });
});

describe('Validation Utilities', () => {
  describe('validateCampaignData', () => {
    it('should validate valid campaign data', () => {
      const validData: CreateCampaignRequest = {
        title: 'Valid Campaign Title',
        description: 'This is a valid campaign description with enough characters',
        category: ['fashion', 'beauty'],
        budget: {
          total: { amount: 5000, currency: 'USD' },
          currency: 'USD'
        },
        period: {
          recruitStart: new Date('2024-01-01'),
          recruitEnd: new Date('2024-01-07'),
          campaignStart: new Date('2024-01-08'),
          campaignEnd: new Date('2024-02-08')
        },
        requirements: {
          minFollowers: 10000,
          platforms: [Platform.INSTAGRAM, Platform.TIKTOK],
          contentType: [ContentType.POST, ContentType.REEL],
          hashtags: ['#campaign', '#test']
        }
      };
      
      const result = validateCampaignData(validData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
    
    it('should catch validation errors', () => {
      const invalidData: CreateCampaignRequest = {
        title: 'Bad', // Too short
        description: 'Too short', // Too short
        category: [], // Empty array
        budget: {
          total: { amount: 5000, currency: 'USD' },
          currency: 'USD'
        },
        period: {
          recruitStart: new Date('2024-01-01'),
          recruitEnd: new Date('2024-01-01'), // Same as start
          campaignStart: new Date('2024-01-01'), // Before recruit end
          campaignEnd: new Date('2024-01-01') // Same as start
        },
        requirements: {
          minFollowers: -100, // Negative
          platforms: [], // Empty
          contentType: [], // Empty
          hashtags: []
        }
      };
      
      const result = validateCampaignData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });
  
  describe('validateCampaignStatus', () => {
    it('should allow valid status transitions', () => {
      expect(validateCampaignStatus(CampaignStatus.DRAFT, CampaignStatus.PENDING)).toBe(true);
      expect(validateCampaignStatus(CampaignStatus.PENDING, CampaignStatus.RECRUITING)).toBe(true);
      expect(validateCampaignStatus(CampaignStatus.RECRUITING, CampaignStatus.ACTIVE)).toBe(true);
      expect(validateCampaignStatus(CampaignStatus.ACTIVE, CampaignStatus.COMPLETED)).toBe(true);
      expect(validateCampaignStatus(CampaignStatus.COMPLETED, CampaignStatus.SETTLED)).toBe(true);
    });
    
    it('should reject invalid status transitions', () => {
      expect(validateCampaignStatus(CampaignStatus.DRAFT, CampaignStatus.ACTIVE)).toBe(false);
      expect(validateCampaignStatus(CampaignStatus.SETTLED, CampaignStatus.DRAFT)).toBe(false);
      expect(validateCampaignStatus(CampaignStatus.CANCELLED, CampaignStatus.ACTIVE)).toBe(false);
    });
  });
});

describe('Helper Utilities', () => {
  describe('calculateCampaignProgress', () => {
    it('should calculate correct progress', () => {
      const campaign: Campaign = {
        id: '123',
        brandId: 'brand-123',
        title: 'Test',
        description: 'Test',
        category: ['test'],
        budget: {
          total: { amount: 1000, currency: 'USD' },
          currency: 'USD',
          allocated: { amount: 0, currency: 'USD' },
          spent: { amount: 0, currency: 'USD' }
        },
        period: {
          recruitStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          recruitEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          campaignStart: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          campaignEnd: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000)
        },
        requirements: {
          minFollowers: 1000,
          platforms: [Platform.INSTAGRAM],
          contentType: [ContentType.POST],
          hashtags: []
        },
        status: CampaignStatus.RECRUITING,
        participants: [],
        isDraft: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const progress = calculateCampaignProgress(campaign);
      
      expect(progress.recruitmentProgress).toBeGreaterThan(0);
      expect(progress.recruitmentProgress).toBeLessThan(100);
      expect(progress.campaignProgress).toBe(0);
    });
  });
  
  describe('formatMoney', () => {
    it('should format money correctly', () => {
      const money: Money = { amount: 1234.56, currency: 'USD' };
      expect(formatMoney(money)).toBe('$1,235');
      
      const euros: Money = { amount: 999.99, currency: 'EUR' };
      expect(formatMoney(euros)).toMatch(/€/);
    });
  });
  
  describe('canEditCampaign', () => {
    it('should allow editing draft campaigns', () => {
      const draftCampaign = { status: CampaignStatus.DRAFT } as Campaign;
      expect(canEditCampaign(draftCampaign)).toBe(true);
      
      const pendingCampaign = { status: CampaignStatus.PENDING } as Campaign;
      expect(canEditCampaign(pendingCampaign)).toBe(true);
      
      const activeCampaign = { status: CampaignStatus.ACTIVE } as Campaign;
      expect(canEditCampaign(activeCampaign)).toBe(false);
    });
  });
});