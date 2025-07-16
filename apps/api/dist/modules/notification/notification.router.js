"use strict";
/**
 * Notification Router
 * 알림 관련 API 엔드포인트
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRouter = createNotificationRouter;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const express_validator_1 = require("express-validator");
function createNotificationRouter(service) {
    const router = (0, express_1.Router)();
    // 알림 목록 조회
    router.get('/', (0, auth_1.authMiddleware)(), [
        (0, express_validator_1.query)('read').optional().isBoolean(),
        (0, express_validator_1.query)('type').optional().isString(),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.getNotifications(req.user.id, {
                read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
                type: req.query.type,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            });
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get notifications error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 알림 읽음 처리
    router.patch('/:id/read', (0, auth_1.authMiddleware)(), [(0, express_validator_1.param)('id').isString()], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.markAsRead(req.user.id, req.params.id);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Mark as read error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 모든 알림 읽음 처리
    router.patch('/read-all', (0, auth_1.authMiddleware)(), async (req, res) => {
        try {
            const result = await service.markAllAsRead(req.user.id);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Mark all as read error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 알림 삭제
    router.delete('/:id', (0, auth_1.authMiddleware)(), [(0, express_validator_1.param)('id').isString()], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.deleteNotification(req.user.id, req.params.id);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Delete notification error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 알림 설정 조회
    router.get('/settings', (0, auth_1.authMiddleware)(), async (req, res) => {
        try {
            const result = await service.getNotificationSettings(req.user.id);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get notification settings error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 알림 설정 업데이트
    router.put('/settings', (0, auth_1.authMiddleware)(), [
        (0, express_validator_1.body)('email').optional().isObject(),
        (0, express_validator_1.body)('push').optional().isObject(),
        (0, express_validator_1.body)('inApp').optional().isObject(),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.updateNotificationSettings(req.user.id, req.body);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Update notification settings error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 테스트 알림 전송 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
        router.post('/test', (0, auth_1.authMiddleware)(), [
            (0, express_validator_1.body)('type').notEmpty().withMessage('Type is required'),
            (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
            (0, express_validator_1.body)('message').notEmpty().withMessage('Message is required'),
        ], validation_1.validateRequest, async (req, res) => {
            try {
                const result = await service.sendNotification({
                    userId: req.user.id,
                    type: req.body.type,
                    title: req.body.title,
                    message: req.body.message,
                    metadata: req.body.metadata
                });
                if (!result.success) {
                    return res.status(400).json({ error: result.error });
                }
                res.json(result.data);
            }
            catch (error) {
                console.error('Send test notification error:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    return router;
}
