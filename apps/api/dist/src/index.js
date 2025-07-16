"use strict";
/**
 * Revu Platform API Server
 * 50개 모듈을 100% 활용하는 통합 백엔드 서버
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
// Load environment variables
(0, dotenv_1.config)();
// Import orchestrator
const ModuleOrchestrator_1 = require("./core/ModuleOrchestrator");
const DatabaseManager_1 = require("./core/DatabaseManager");
const RedisManager_1 = require("./core/RedisManager");
// Import middleware
const security_1 = require("./middleware/security");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = __importDefault(require("./utils/logger"));
// Initialize Express app
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }
});
exports.io = io;
// Global middleware
app.use((0, compression_1.default)()); // 압축
app.use(requestLogger_1.requestLogger); // 요청 로깅
app.use(...security_1.securityMiddleware); // 보안 미들웨어
app.use(rateLimiter_1.apiLimiter); // Rate limiting
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Module Orchestrator initialization
async function initializeModules() {
    logger_1.default.info('🚀 Initializing Revu Platform API Server...');
    try {
        // Initialize database
        const db = DatabaseManager_1.DatabaseManager.getInstance();
        await db.connect();
        console.log('✅ Database connected');
        // Initialize Redis
        const redis = RedisManager_1.RedisManager.getInstance();
        await redis.connect();
        console.log('✅ Redis connected');
        // Initialize Module Orchestrator
        const orchestrator = new ModuleOrchestrator_1.ModuleOrchestrator({
            db,
            redis,
            io,
            env: process.env
        });
        // Register all modules
        await orchestrator.registerAllModules();
        await orchestrator.initialize();
        console.log('✅ All modules initialized');
        // Attach orchestrator to app context
        app.locals.orchestrator = orchestrator;
        app.locals.io = io;
        // Get modules
        const authModule = orchestrator.getModule('auth');
        const campaignModule = orchestrator.getModule('campaign');
        const notificationModule = orchestrator.getModule('notification');
        // Mount module routers
        app.use('/api/auth', authModule.getRouter());
        app.use('/api/campaigns', campaignModule.getRouter());
        app.use('/api/notifications', notificationModule.getRouter());
        // Protected routes (require authentication)
        const authMiddleware = authModule.getMiddleware();
        app.use('/api/users', authMiddleware, (_req, res) => {
            // TODO: User module router
            res.json({ message: 'User module coming soon' });
        });
        app.use('/api/payments', authMiddleware, (_req, res) => {
            // TODO: Payment module router
            res.json({ message: 'Payment module coming soon' });
        });
        // Module status endpoint
        app.get('/api/modules/status', (_req, res) => {
            res.json({
                success: true,
                modules: orchestrator.getModuleStatus()
            });
        });
        // Error handling middleware
        app.use(errorHandler_1.notFoundHandler);
        app.use(errorHandler_1.errorHandler);
        // WebSocket connections
        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            socket.on('join:user', (userId) => {
                socket.join(`user:${userId}`);
                console.log(`User ${userId} joined`);
            });
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
        // Start server
        const PORT = process.env.PORT || 4000;
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📡 WebSocket server is ready`);
            console.log(`📦 50 modules loaded and ready to use`);
        });
    }
    catch (error) {
        console.error('❌ Failed to initialize server:', error);
        process.exit(1);
    }
}
// Initialize modules and start server
initializeModules();
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
    // Cleanup modules
    const orchestrator = app.locals.orchestrator;
    if (orchestrator) {
        await orchestrator.shutdown();
    }
    // Close database connections
    await DatabaseManager_1.DatabaseManager.getInstance().disconnect();
    await RedisManager_1.RedisManager.getInstance().disconnect();
    process.exit(0);
});
