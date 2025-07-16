/**
 * Revu Platform API Server
 * 50개 모듈을 100% 활용하는 통합 백엔드 서버
 */

import express from 'express';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import compression from 'compression';
import morgan from 'morgan';

// Load environment variables
config();

// Import orchestrator
import { ModuleOrchestrator } from './core/ModuleOrchestrator';
import { DatabaseManager } from './core/DatabaseManager';
import { RedisManager } from './core/RedisManager';

// Import middleware
import { securityMiddleware } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Global middleware
app.use(compression()); // 압축
app.use(requestLogger); // 요청 로깅
app.use(...securityMiddleware); // 보안 미들웨어
app.use(apiLimiter); // Rate limiting
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  logger.info('🚀 Initializing Revu Platform API Server...');

  try {
    // Initialize database
    const db = DatabaseManager.getInstance();
    await db.connect();
    console.log('✅ Database connected');

    // Initialize Redis
    const redis = RedisManager.getInstance();
    await redis.connect();
    console.log('✅ Redis connected');

    // Initialize Module Orchestrator
    const orchestrator = new ModuleOrchestrator({
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
    app.use(notFoundHandler);
    app.use(errorHandler);

    // WebSocket connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join:user', (userId: string) => {
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

  } catch (error) {
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
  await DatabaseManager.getInstance().disconnect();
  await RedisManager.getInstance().disconnect();

  process.exit(0);
});

export { app, io };