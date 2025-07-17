/**
 * Campaign Router
 * 캠페인 관련 API 엔드포인트
 */

import { Router, Request, Response } from 'express';
import { CampaignService } from './campaign.service';
import { authMiddleware } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { body, query, param } from 'express-validator';

export function createCampaignRouter(service: CampaignService): Router {
  const router = Router();

  // 캠페인 생성
  router.post(
    '/',
    authMiddleware(['BUSINESS']),
    [
      body('basic.title').notEmpty().withMessage('Title is required'),
      body('basic.description').notEmpty().withMessage('Description is required'),
      body('basic.category').notEmpty().withMessage('Category is required'),
      body('basic.startDate').isISO8601().withMessage('Valid start date required'),
      body('basic.endDate').isISO8601().withMessage('Valid end date required'),
      body('budget.totalBudget').isNumeric().withMessage('Total budget must be numeric'),
      body('budget.paymentType').isIn(['fixed', 'performance']).withMessage('Invalid payment type'),
      body('budget.maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
      body('target.minFollowers').isInt({ min: 0 }).withMessage('Min followers must be non-negative'),
      body('target.maxFollowers').isInt({ min: 0 }).withMessage('Max followers must be non-negative'),
    ],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.createCampaign(req.user!.id, req.body);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.status(201).json(result.data);
      } catch (error) {
        console.error('Create campaign error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 캠페인 목록 조회
  router.get(
    '/',
    [
      query('status').optional().isIn(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
      query('category').optional().isString(),
      query('search').optional().isString(),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.getCampaigns({
          status: req.query.status as string,
          category: req.query.category as string,
          search: req.query.search as string,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
        });
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Get campaigns error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 비즈니스의 캠페인 목록
  router.get(
    '/my',
    authMiddleware(['BUSINESS']),
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.getCampaigns({
          businessId: req.user!.id,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
        });
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Get my campaigns error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 인플루언서의 캠페인 목록
  router.get(
    '/applied',
    authMiddleware(['INFLUENCER']),
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.getInfluencerCampaigns(
          req.user!.id,
          req.query.status as string
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Get influencer campaigns error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 캠페인 상세 조회
  router.get(
    '/:id',
    [param('id').isString()],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.getCampaignDetail(req.params.id);
        
        if (!result.success) {
          return res.status(404).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Get campaign detail error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 캠페인 수정
  router.put(
    '/:id',
    authMiddleware(['BUSINESS']),
    [param('id').isString()],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.updateCampaign(
          req.params.id,
          req.user!.id,
          req.body
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Update campaign error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 캠페인 지원
  router.post(
    '/:id/apply',
    authMiddleware(['INFLUENCER']),
    [
      param('id').isString(),
      body('message').optional().isString(),
    ],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.applyCampaign(
          req.params.id,
          req.user!.id,
          req.body.message
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.status(201).json(result.data);
      } catch (error) {
        console.error('Apply campaign error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 지원자 승인/거절
  router.patch(
    '/applications/:id/status',
    authMiddleware(['BUSINESS']),
    [
      param('id').isString(),
      body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Invalid status'),
      body('reason').optional().isString(),
    ],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.updateApplicationStatus(
          req.params.id,
          req.user!.id,
          req.body.status,
          req.body.reason
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Update application status error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 캠페인 통계
  router.get(
    '/:id/stats',
    authMiddleware(['BUSINESS']),
    [param('id').isString()],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.getCampaignStats(req.params.id, req.user!.id);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Get campaign stats error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 콘텐츠 제출
  router.post(
    '/:id/content',
    authMiddleware(['INFLUENCER']),
    [
      param('id').isString(),
      body('platform').notEmpty().withMessage('Platform is required'),
      body('url').isURL().withMessage('Valid URL required'),
      body('type').notEmpty().withMessage('Content type is required'),
      body('caption').optional().isString(),
    ],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.submitContent(
          req.params.id,
          req.user!.id,
          req.body
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.status(201).json(result.data);
      } catch (error) {
        console.error('Submit content error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 콘텐츠 승인/거절
  router.patch(
    '/content/:id/review',
    authMiddleware(['BUSINESS']),
    [
      param('id').isString(),
      body('status').isIn(['APPROVED', 'REJECTED']).withMessage('Invalid status'),
      body('feedback').optional().isString(),
    ],
    validateRequest,
    async (req: Request, res: Response): Promise<any> => {
      try {
        const result = await service.reviewContent(
          req.params.id,
          req.user!.id,
          req.body.status,
          req.body.feedback
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        return res.json(result.data);
      } catch (error) {
        console.error('Review content error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  return router;
}