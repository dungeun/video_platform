"use strict";
/**
 * Campaign Router
 * 캠페인 관련 API 엔드포인트
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaignRouter = createCampaignRouter;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validation_1 = require("../../middleware/validation");
const express_validator_1 = require("express-validator");
function createCampaignRouter(service) {
    const router = (0, express_1.Router)();
    // 캠페인 생성
    router.post('/', (0, auth_1.authMiddleware)(['BUSINESS']), [
        (0, express_validator_1.body)('basic.title').notEmpty().withMessage('Title is required'),
        (0, express_validator_1.body)('basic.description').notEmpty().withMessage('Description is required'),
        (0, express_validator_1.body)('basic.category').notEmpty().withMessage('Category is required'),
        (0, express_validator_1.body)('basic.startDate').isISO8601().withMessage('Valid start date required'),
        (0, express_validator_1.body)('basic.endDate').isISO8601().withMessage('Valid end date required'),
        (0, express_validator_1.body)('budget.totalBudget').isNumeric().withMessage('Total budget must be numeric'),
        (0, express_validator_1.body)('budget.paymentType').isIn(['fixed', 'performance']).withMessage('Invalid payment type'),
        (0, express_validator_1.body)('budget.maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
        (0, express_validator_1.body)('target.minFollowers').isInt({ min: 0 }).withMessage('Min followers must be non-negative'),
        (0, express_validator_1.body)('target.maxFollowers').isInt({ min: 0 }).withMessage('Max followers must be non-negative'),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.createCampaign(req.user.id, req.body);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.status(201).json(result.data);
        }
        catch (error) {
            console.error('Create campaign error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 캠페인 목록 조회
    router.get('/', [
        (0, express_validator_1.query)('status').optional().isIn(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
        (0, express_validator_1.query)('category').optional().isString(),
        (0, express_validator_1.query)('search').optional().isString(),
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.getCampaigns({
                status: req.query.status,
                category: req.query.category,
                search: req.query.search,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            });
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get campaigns error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 비즈니스의 캠페인 목록
    router.get('/my', (0, auth_1.authMiddleware)(['BUSINESS']), async (req, res) => {
        try {
            const result = await service.getCampaigns({
                businessId: req.user.id,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            });
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get my campaigns error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 인플루언서의 캠페인 목록
    router.get('/applied', (0, auth_1.authMiddleware)(['INFLUENCER']), async (req, res) => {
        try {
            const result = await service.getInfluencerCampaigns(req.user.id, req.query.status);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get influencer campaigns error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 캠페인 상세 조회
    router.get('/:id', [(0, express_validator_1.param)('id').isString()], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.getCampaignDetail(req.params.id);
            if (!result.success) {
                return res.status(404).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get campaign detail error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 캠페인 수정
    router.put('/:id', (0, auth_1.authMiddleware)(['BUSINESS']), [(0, express_validator_1.param)('id').isString()], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.updateCampaign(req.params.id, req.user.id, req.body);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Update campaign error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 캠페인 지원
    router.post('/:id/apply', (0, auth_1.authMiddleware)(['INFLUENCER']), [
        (0, express_validator_1.param)('id').isString(),
        (0, express_validator_1.body)('message').optional().isString(),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.applyCampaign(req.params.id, req.user.id, req.body.message);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.status(201).json(result.data);
        }
        catch (error) {
            console.error('Apply campaign error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 지원자 승인/거절
    router.patch('/applications/:id/status', (0, auth_1.authMiddleware)(['BUSINESS']), [
        (0, express_validator_1.param)('id').isString(),
        (0, express_validator_1.body)('status').isIn(['APPROVED', 'REJECTED']).withMessage('Invalid status'),
        (0, express_validator_1.body)('reason').optional().isString(),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.updateApplicationStatus(req.params.id, req.user.id, req.body.status, req.body.reason);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Update application status error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 캠페인 통계
    router.get('/:id/stats', (0, auth_1.authMiddleware)(['BUSINESS']), [(0, express_validator_1.param)('id').isString()], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.getCampaignStats(req.params.id, req.user.id);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Get campaign stats error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 콘텐츠 제출
    router.post('/:id/content', (0, auth_1.authMiddleware)(['INFLUENCER']), [
        (0, express_validator_1.param)('id').isString(),
        (0, express_validator_1.body)('platform').notEmpty().withMessage('Platform is required'),
        (0, express_validator_1.body)('url').isURL().withMessage('Valid URL required'),
        (0, express_validator_1.body)('type').notEmpty().withMessage('Content type is required'),
        (0, express_validator_1.body)('caption').optional().isString(),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.submitContent(req.params.id, req.user.id, req.body);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.status(201).json(result.data);
        }
        catch (error) {
            console.error('Submit content error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    // 콘텐츠 승인/거절
    router.patch('/content/:id/review', (0, auth_1.authMiddleware)(['BUSINESS']), [
        (0, express_validator_1.param)('id').isString(),
        (0, express_validator_1.body)('status').isIn(['APPROVED', 'REJECTED']).withMessage('Invalid status'),
        (0, express_validator_1.body)('feedback').optional().isString(),
    ], validation_1.validateRequest, async (req, res) => {
        try {
            const result = await service.reviewContent(req.params.id, req.user.id, req.body.status, req.body.feedback);
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }
            res.json(result.data);
        }
        catch (error) {
            console.error('Review content error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
    return router;
}
