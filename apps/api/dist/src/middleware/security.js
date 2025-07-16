"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.sqlInjectionProtection = exports.xssProtection = exports.helmetConfig = exports.corsOptions = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
// CORS 설정
exports.corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://revu-platform.com',
        ];
        // 개발 환경에서는 모든 origin 허용
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
// Helmet 보안 헤더 설정
exports.helmetConfig = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
});
// XSS 방지
const xssProtection = (req, _res, next) => {
    // 입력값 정리
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            // HTML 태그 제거
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        else if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        else if (obj !== null && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    sanitized[key] = sanitizeObject(obj[key]);
                }
            }
            return sanitized;
        }
        return obj;
    };
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
};
exports.xssProtection = xssProtection;
// SQL Injection 방지 (Prisma가 기본적으로 처리하지만 추가 보안)
const sqlInjectionProtection = (req, res, next) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
        /(--|#|\/\*|\*\/)/g,
        /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
        /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
    ];
    const checkForSQLInjection = (value) => {
        if (typeof value === 'string') {
            return sqlPatterns.some(pattern => pattern.test(value));
        }
        return false;
    };
    const checkObject = (obj) => {
        if (typeof obj === 'string') {
            return checkForSQLInjection(obj);
        }
        else if (Array.isArray(obj)) {
            return obj.some(checkObject);
        }
        else if (obj !== null && typeof obj === 'object') {
            return Object.values(obj).some(checkObject);
        }
        return false;
    };
    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        res.status(400).json({
            success: false,
            error: 'Invalid input detected',
        });
        return;
    }
    next();
};
exports.sqlInjectionProtection = sqlInjectionProtection;
// 보안 미들웨어 조합
exports.securityMiddleware = [
    exports.helmetConfig,
    (0, cors_1.default)(exports.corsOptions),
    (0, express_mongo_sanitize_1.default)(),
    exports.xssProtection,
    exports.sqlInjectionProtection,
];
