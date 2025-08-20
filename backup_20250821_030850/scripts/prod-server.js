#!/usr/bin/env node

/**
 * Production Server Wrapper
 * Runs startup checks and then starts Next.js production server
 */

const { spawn } = require('child_process');
const { startServer, logger } = require('./server-startup');

async function runProductionServer() {
  try {
    // Run startup checks
    await startServer();
    
    logger.section('🚀 Starting Next.js Production Server');
    
    // Get port from environment or find free port
    const portScript = spawn('node', ['scripts/find-free-port.js']);
    let port = '';
    
    portScript.stdout.on('data', (data) => {
      port = data.toString().trim();
    });
    
    await new Promise((resolve) => {
      portScript.on('close', resolve);
    });
    
    const finalPort = port || process.env.PORT || '3000';
    logger.info(`Starting Next.js on port ${finalPort}`);
    logger.info('Production mode active');
    
    // Start Next.js production server
    const nextStart = spawn('npx', ['next', 'start', '-p', finalPort], {
      stdio: 'inherit',
      env: { ...process.env, PORT: finalPort, NODE_ENV: 'production' }
    });
    
    nextStart.on('error', (error) => {
      logger.error('Failed to start Next.js:', error);
      process.exit(1);
    });
    
    nextStart.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Next.js exited with code ${code}`);
        process.exit(code);
      }
    });
    
  } catch (error) {
    logger.fatal('Failed to start production server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nShutting down production server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\nTerminating production server...');
  process.exit(0);
});

// Run the server
runProductionServer();