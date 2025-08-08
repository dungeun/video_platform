#!/usr/bin/env node

const { createLogger } = require('../lib/logger');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const prisma = new PrismaClient();

// Initialize logger
const logger = createLogger({
  logDir: path.join(process.cwd(), 'logs'),
  enableFileLogging: true,
  enableConsole: true
});

// Startup tasks
const startupTasks = [
  {
    name: 'Check Environment Variables',
    required: true,
    fn: async () => {
      const requiredEnvVars = [
        'DATABASE_URL',
        'JWT_SECRET'
      ];
      
      // SKIP_DB_CONNECTION이 true이면 DATABASE_URL 체크 제외
      const checkVars = process.env.SKIP_DB_CONNECTION === 'true' 
        ? requiredEnvVars.filter(v => v !== 'DATABASE_URL')
        : requiredEnvVars;
      
      const missing = checkVars.filter(envVar => !process.env[envVar]);
      
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }
      
      logger.debug('Environment variables loaded successfully');
      return { envVarsLoaded: requiredEnvVars.length };
    }
  },
  
  {
    name: 'Database Connection',
    required: !process.env.SKIP_DB_CONNECTION,
    fn: async () => {
      if (process.env.SKIP_DB_CONNECTION === 'true') {
        logger.debug('Database connection skipped for local development');
        return { connected: false, skipped: true };
      }
      
      try {
        await prisma.$queryRaw`SELECT 1`;
        const dbUrl = process.env.DATABASE_URL || '';
        const dbHost = dbUrl.includes('@') ? dbUrl.split('@')[1].split(':')[0] : 'unknown';
        logger.debug(`Connected to database at ${dbHost}`);
        return { connected: true, host: dbHost };
      } catch (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
    }
  },
  
  {
    name: 'Prisma Schema Validation',
    required: !process.env.SKIP_DB_CONNECTION,
    fn: async () => {
      if (process.env.SKIP_DB_CONNECTION === 'true') {
        logger.debug('Prisma schema validation skipped for local development');
        return { schemaValid: false, skipped: true };
      }
      
      try {
        // Check if Prisma client is generated
        const clientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
        if (!fs.existsSync(clientPath)) {
          logger.warning('Prisma client not found, generating...');
          const { stdout } = await execPromise('npx prisma generate');
          logger.debug('Prisma client generated successfully');
        }
        
        // Get database version
        const dbVersion = await prisma.$queryRaw`SELECT version()`;
        logger.debug(`Database version: ${dbVersion[0].version.split(' ')[0]}`);
        
        return { schemaValid: true };
      } catch (error) {
        throw new Error(`Prisma validation failed: ${error.message}`);
      }
    }
  },
  
  {
    name: 'Check Database Tables',
    required: false,
    fn: async () => {
      if (process.env.SKIP_DB_CONNECTION === 'true') {
        logger.debug('Database table check skipped for local development');
        return { tableCount: 0, skipped: true };
      }
      
      try {
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `;
        
        const importantTables = ['users', 'videos', 'channels'];
        const existingTables = tables.map(t => t.table_name);
        const missingTables = importantTables.filter(t => !existingTables.includes(t));
        
        if (missingTables.length > 0) {
          logger.warning(`Missing tables: ${missingTables.join(', ')}`);
        }
        
        logger.debug(`Found ${tables.length} tables in database`);
        return { tableCount: tables.length, tables: existingTables };
      } catch (error) {
        logger.warning(`Could not check tables: ${error.message}`);
        return { tableCount: 0 };
      }
    }
  },
  
  {
    name: 'Initialize Data Statistics',
    required: false,
    fn: async () => {
      try {
        const stats = {
          users: await prisma.users.count().catch(() => 0),
          videos: await prisma.videos.count().catch(() => 0),
          channels: await prisma.channels.count().catch(() => 0),
        };
        
        logger.info('Database statistics:', stats);
        return stats;
      } catch (error) {
        logger.warning(`Could not get statistics: ${error.message}`);
        return {};
      }
    }
  },
  
  {
    name: 'Find Available Port',
    required: true,
    fn: async () => {
      const net = require('net');
      const fs = require('fs');
      
      // 포트를 찾는 함수
      const findAvailablePort = (startPort) => {
        return new Promise((resolve, reject) => {
          const server = net.createServer();
          
          server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              // 다음 포트 시도
              resolve(findAvailablePort(startPort + 1));
            } else {
              reject(err);
            }
          });
          
          server.once('listening', () => {
            const port = server.address().port;
            server.close();
            resolve(port);
          });
          
          server.listen(startPort);
        });
      };
      
      const preferredPort = process.env.PORT || 3000;
      const availablePort = await findAvailablePort(preferredPort);
      
      // 찾은 포트를 환경변수에 설정
      process.env.PORT = availablePort;
      
      // 동적으로 API URL 설정
      const baseUrl = `http://localhost:${availablePort}`;
      process.env.NEXT_PUBLIC_API_URL = baseUrl;
      process.env.NEXT_PUBLIC_APP_URL = baseUrl;
      
      // .env.local 파일 업데이트 (선택사항)
      if (availablePort !== preferredPort) {
        logger.warning(`Port ${preferredPort} was in use, using port ${availablePort} instead`);
        
        // .env.local 파일에 포트와 URL 정보 업데이트
        const envPath = '.env.local';
        try {
          let envContent = '';
          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
          }
          
          // PORT 라인 업데이트 또는 추가
          const portLine = `PORT=${availablePort}`;
          const apiUrlLine = `NEXT_PUBLIC_API_URL=${baseUrl}`;
          const appUrlLine = `NEXT_PUBLIC_APP_URL=${baseUrl}`;
          
          if (envContent.includes('PORT=')) {
            envContent = envContent.replace(/PORT=\d+/, portLine);
          } else {
            envContent += `\n${portLine}\n`;
          }
          
          if (envContent.includes('NEXT_PUBLIC_API_URL=')) {
            envContent = envContent.replace(/NEXT_PUBLIC_API_URL=.*/, apiUrlLine);
          } else {
            envContent += `${apiUrlLine}\n`;
          }
          
          if (envContent.includes('NEXT_PUBLIC_APP_URL=')) {
            envContent = envContent.replace(/NEXT_PUBLIC_APP_URL=.*/, appUrlLine);
          } else {
            envContent += `${appUrlLine}\n`;
          }
          
          fs.writeFileSync(envPath, envContent);
          logger.info(`Updated .env.local with PORT=${availablePort}`);
        } catch (error) {
          logger.debug('Could not update .env.local:', error.message);
        }
      }
      
      logger.success(`Server will run on port ${availablePort}`);
      return { port: availablePort, available: true };
    }
  },
  
  {
    name: 'Create Required Directories',
    required: false,
    fn: async () => {
      const dirs = [
        'logs',
        'uploads',
        'public/uploads/videos',
        'public/uploads/thumbnails',
        '.cache'
      ];
      
      let created = 0;
      dirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          created++;
          logger.debug(`Created directory: ${dir}`);
        }
      });
      
      return { dirsCreated: created, totalDirs: dirs.length };
    }
  },
  
  {
    name: 'Load Application Configuration',
    required: false,
    fn: async () => {
      try {
        const configs = await prisma.site_config.findMany();
        const configMap = {};
        
        configs.forEach(config => {
          try {
            configMap[config.key] = JSON.parse(config.value);
          } catch {
            configMap[config.key] = config.value;
          }
        });
        
        logger.debug(`Loaded ${configs.length} configuration entries`);
        return { configCount: configs.length };
      } catch (error) {
        logger.warning('Could not load site configuration');
        return { configCount: 0 };
      }
    }
  },
  
  {
    name: 'Rotate Log Files',
    required: false,
    fn: async () => {
      logger.rotateLogs(7); // Keep last 7 days of logs
      return { rotated: true };
    }
  },
  
  {
    name: 'System Health Check',
    required: false,
    fn: async () => {
      const os = require('os');
      
      const health = {
        platform: os.platform(),
        nodeVersion: process.version,
        memory: {
          total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10 + 'GB',
          free: Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10 + 'GB',
          used: Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100) + '%'
        },
        cpus: os.cpus().length,
        uptime: Math.round(os.uptime() / 60) + ' minutes'
      };
      
      logger.debug('System health:', health);
      return health;
    }
  }
];

// Error handlers
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\nGracefully shutting down...');
  
  try {
    await prisma.$disconnect();
    logger.success('Database connection closed');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  process.exit(0);
});

// Main startup function
async function startServer() {
  console.clear();
  
  logger.section('🚀 VideoPick Server Startup');
  logger.info(`Starting at ${new Date().toISOString()}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // Run startup tasks
    const results = await logger.runStartupSequence(startupTasks);
    
    // Check if all required tasks succeeded
    const requiredFailed = results.filter(r => 
      !r.success && startupTasks.find(t => t.name === r.name)?.required
    );
    
    if (requiredFailed.length > 0) {
      logger.fatal('Server startup failed due to critical errors');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    // Server is ready
    logger.section('✨ Server Ready');
    logger.success('All systems operational');
    logger.info(`Server URL: http://localhost:${process.env.PORT || 3000}`);
    logger.info(`API URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}`);
    logger.info(`Log files: ${path.join(process.cwd(), 'logs')}`);
    
    // Keep the process alive
    if (require.main === module) {
      logger.info('\nPress Ctrl+C to stop the server');
      
      // Keep process running
      setInterval(() => {
        // Heartbeat - can add monitoring here
      }, 60000);
    }
    
    return true;
  } catch (error) {
    logger.fatal('Server startup failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { startServer, logger };

// Run if called directly
if (require.main === module) {
  startServer();
}