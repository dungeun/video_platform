"use strict";
/**
 * Authentication Middleware
 * JWT 토큰 검증 및 사용자 인증
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
function authMiddleware(allowedRoles) {
    return async (req, res, next) => {
        try {
            // Bearer 토큰 추출
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }
            const token = authHeader.substring(7);
            // 토큰 검증
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // 사용자 확인
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    type: true,
                    status: true,
                },
            });
            if (!user || user.status !== 'ACTIVE') {
                return res.status(401).json({ error: 'Invalid user' });
            }
            // 역할 확인
            if (allowedRoles && !allowedRoles.includes(user.type)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            // Request에 사용자 정보 추가
            req.user = {
                id: user.id,
                email: user.email,
                type: user.type,
            };
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                return res.status(401).json({ error: 'Token expired' });
            }
            console.error('Auth middleware error:', error);
            return res.status(500).json({ error: 'Authentication error' });
        }
    };
}
// 선택적 인증 미들웨어 (로그인하지 않아도 접근 가능)
function optionalAuthMiddleware() {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return next();
            }
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    type: true,
                    status: true,
                },
            });
            if (user && user.status === 'ACTIVE') {
                req.user = {
                    id: user.id,
                    email: user.email,
                    type: user.type,
                };
            }
            next();
        }
        catch (error) {
            // 토큰이 유효하지 않아도 계속 진행
            return next();
        }
    };
}
