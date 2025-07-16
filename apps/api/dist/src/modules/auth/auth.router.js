"use strict";
/**
 * Auth Router
 * 프론트엔드 Auth 모듈의 API 호출을 처리하는 라우터
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRouter = createAuthRouter;
exports.authMiddleware = authMiddleware;
const express_1 = require("express");
const zod_1 = require("zod");
// Validation schemas
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    rememberMe: zod_1.z.boolean().optional()
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().optional(),
    type: zod_1.z.enum(['BUSINESS', 'INFLUENCER']).optional()
});
const refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string()
});
function createAuthRouter(adapter) {
    const router = (0, express_1.Router)();
    /**
     * POST /api/auth/login
     * 프론트엔드 AuthService.login()이 호출하는 엔드포인트
     */
    router.post('/login', async (req, res) => {
        try {
            // 1. 입력 검증
            const validatedData = loginSchema.parse(req.body);
            // 2. 어댑터를 통해 처리
            const result = await adapter.handleLogin(validatedData);
            // 3. 프론트엔드가 기대하는 형식으로 응답
            if (result.success) {
                res.json(result);
            }
            else {
                res.status(401).json(result);
            }
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: '입력 데이터가 올바르지 않습니다',
                    errors: error.errors
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '서버 오류가 발생했습니다'
                });
            }
        }
    });
    /**
     * POST /api/auth/register
     * 프론트엔드 AuthService.register()가 호출하는 엔드포인트
     */
    router.post('/register', async (req, res) => {
        try {
            const validatedData = registerSchema.parse(req.body);
            const result = await adapter.handleRegister(validatedData);
            if (result.success) {
                res.status(201).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: '입력 데이터가 올바르지 않습니다',
                    errors: error.errors
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '서버 오류가 발생했습니다'
                });
            }
        }
    });
    /**
     * POST /api/auth/logout
     * 프론트엔드 AuthService.logout()이 호출하는 엔드포인트
     */
    router.post('/logout', async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const userId = req.user?.id; // 인증 미들웨어에서 설정
            const result = await adapter.handleLogout(refreshToken, userId);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다'
            });
        }
    });
    /**
     * POST /api/auth/refresh
     * 프론트엔드 AuthService.refreshToken()이 호출하는 엔드포인트
     */
    router.post('/refresh', async (req, res) => {
        try {
            const validatedData = refreshTokenSchema.parse(req.body);
            const result = await adapter.handleRefreshToken(validatedData.refreshToken);
            if (result.success) {
                res.json(result);
            }
            else {
                res.status(401).json(result);
            }
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: '입력 데이터가 올바르지 않습니다',
                    errors: error.errors
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '서버 오류가 발생했습니다'
                });
            }
        }
    });
    /**
     * GET /api/auth/me
     * 현재 로그인한 사용자 정보 조회
     */
    router.get('/me', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다'
                });
            }
            const token = authHeader.substring(7);
            const user = await adapter.verifyAccessToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '유효하지 않은 토큰입니다'
                });
            }
            res.json({
                success: true,
                user
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다'
            });
        }
    });
    /**
     * POST /api/auth/social
     * 소셜 로그인 처리
     */
    router.post('/social', async (_req, res) => {
        // TODO: 소셜 로그인 구현
        res.status(501).json({
            success: false,
            message: '소셜 로그인은 준비 중입니다'
        });
    });
    /**
     * GET /health
     * 헬스체크 엔드포인트
     */
    router.get('/health', (_req, res) => {
        res.json({
            success: true,
            service: 'auth',
            timestamp: new Date().toISOString()
        });
    });
    return router;
}
// Auth 미들웨어 - 다른 라우터에서 사용
function authMiddleware(adapter) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: '인증이 필요합니다'
                });
            }
            const token = authHeader.substring(7);
            const user = await adapter.verifyAccessToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '유효하지 않은 토큰입니다'
                });
            }
            // 요청 객체에 사용자 정보 추가
            req.user = user;
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다'
            });
        }
    };
}
