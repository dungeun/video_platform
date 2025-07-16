/**
 * Notification Router
 * 알림 관련 API 엔드포인트
 */

import { Router, Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { authMiddleware } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { body, query, param } from 'express-validator';

export function createNotificationRouter(service: NotificationService): Router {
  const router = Router();

  // 알림 목록 조회
  router.get(
    '/',
    authMiddleware(),
    [
      query('read').optional().isBoolean(),
      query('type').optional().isString(),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const result = await service.getNotifications(req.user!.id, {
          read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
          type: req.query.type as string,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 20,
        });
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        res.json(result.data);
      } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 알림 읽음 처리
  router.patch(
    '/:id/read',
    authMiddleware(),
    [param('id').isString()],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const result = await service.markAsRead(req.user!.id, req.params.id);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        res.json(result.data);
      } catch (error) {
        console.error('Mark as read error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 모든 알림 읽음 처리
  router.patch(
    '/read-all',
    authMiddleware(),
    async (req: Request, res: Response) => {
      try {
        const result = await service.markAllAsRead(req.user!.id);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        res.json(result.data);
      } catch (error) {
        console.error('Mark all as read error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 알림 삭제
  router.delete(
    '/:id',
    authMiddleware(),
    [param('id').isString()],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const result = await service.deleteNotification(req.user!.id, req.params.id);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        res.json(result.data);
      } catch (error) {
        console.error('Delete notification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 알림 설정 조회
  router.get(
    '/settings',
    authMiddleware(),
    async (req: Request, res: Response) => {
      try {
        const result = await service.getNotificationSettings(req.user!.id);
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        res.json(result.data);
      } catch (error) {
        console.error('Get notification settings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 알림 설정 업데이트
  router.put(
    '/settings',
    authMiddleware(),
    [
      body('email').optional().isObject(),
      body('push').optional().isObject(),
      body('inApp').optional().isObject(),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      try {
        const result = await service.updateNotificationSettings(
          req.user!.id,
          req.body
        );
        
        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }
        
        res.json(result.data);
      } catch (error) {
        console.error('Update notification settings error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // 테스트 알림 전송 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    router.post(
      '/test',
      authMiddleware(),
      [
        body('type').notEmpty().withMessage('Type is required'),
        body('title').notEmpty().withMessage('Title is required'),
        body('message').notEmpty().withMessage('Message is required'),
      ],
      validateRequest,
      async (req: Request, res: Response) => {
        try {
          const result = await service.sendNotification({
            userId: req.user!.id,
            type: req.body.type,
            title: req.body.title,
            message: req.body.message,
            metadata: req.body.metadata
          });
          
          if (!result.success) {
            return res.status(400).json({ error: result.error });
          }
          
          res.json(result.data);
        } catch (error) {
          console.error('Send test notification error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  }

  return router;
}