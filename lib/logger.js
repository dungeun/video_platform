#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Progress spinner characters
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

class Logger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.logFile = options.logFile || `app-${new Date().toISOString().split('T')[0]}.log`;
    this.errorFile = options.errorFile || `error-${new Date().toISOString().split('T')[0]}.log`;
    this.enableFileLogging = options.enableFileLogging !== false;
    this.enableConsole = options.enableConsole !== false;
    
    this.spinnerIndex = 0;
    this.spinnerInterval = null;
    this.currentSpinnerText = '';
    
    // Create log directory if it doesn't exist
    if (this.enableFileLogging) {
      this.ensureLogDirectory();
    }
  }
  
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  getTimestamp() {
    return new Date().toISOString();
  }
  
  formatMessage(level, message, ...args) {
    const timestamp = this.getTimestamp();
    const formattedArgs = args.length > 0 ? util.format(...args) : '';
    return `[${timestamp}] [${level}] ${message} ${formattedArgs}`.trim();
  }
  
  writeToFile(filename, content) {
    if (!this.enableFileLogging) return;
    
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content + '\n', 'utf8');
  }
  
  log(level, color, message, ...args) {
    const formattedMessage = this.formatMessage(level, message, ...args);
    
    // Write to file
    this.writeToFile(this.logFile, formattedMessage);
    if (level === 'ERROR' || level === 'FATAL') {
      this.writeToFile(this.errorFile, formattedMessage);
    }
    
    // Write to console
    if (this.enableConsole) {
      const coloredMessage = `${color}[${level}]${colors.reset} ${message}`;
      console.log(coloredMessage, ...args);
    }
  }
  
  // Log levels
  info(message, ...args) {
    this.log('INFO', colors.cyan, message, ...args);
  }
  
  success(message, ...args) {
    this.log('SUCCESS', colors.green, message, ...args);
  }
  
  warning(message, ...args) {
    this.log('WARNING', colors.yellow, message, ...args);
  }
  
  error(message, ...args) {
    this.log('ERROR', colors.red, message, ...args);
  }
  
  fatal(message, ...args) {
    this.log('FATAL', colors.bgRed + colors.white, message, ...args);
  }
  
  debug(message, ...args) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      this.log('DEBUG', colors.dim, message, ...args);
    }
  }
  
  // Progress indicators
  startSpinner(text) {
    if (!this.enableConsole) return;
    
    this.currentSpinnerText = text;
    this.spinnerIndex = 0;
    
    // Clear any existing spinner
    this.stopSpinner();
    
    // Start new spinner
    this.spinnerInterval = setInterval(() => {
      process.stdout.write(`\r${colors.cyan}${spinnerFrames[this.spinnerIndex]}${colors.reset} ${this.currentSpinnerText}`);
      this.spinnerIndex = (this.spinnerIndex + 1) % spinnerFrames.length;
    }, 80);
  }
  
  updateSpinner(text) {
    this.currentSpinnerText = text;
  }
  
  stopSpinner(success = true) {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
      
      if (this.enableConsole) {
        const symbol = success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        process.stdout.write(`\r${symbol} ${this.currentSpinnerText}\n`);
      }
    }
  }
  
  // Progress bar
  progressBar(current, total, label = '') {
    if (!this.enableConsole) return;
    
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filled = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    process.stdout.write(`\r${label} ${colors.cyan}[${bar}]${colors.reset} ${percentage}% (${current}/${total})`);
    
    if (current === total) {
      process.stdout.write('\n');
    }
  }
  
  // Sections
  section(title) {
    const line = '═'.repeat(50);
    if (this.enableConsole) {
      console.log(`\n${colors.bright}${colors.blue}${line}${colors.reset}`);
      console.log(`${colors.bright}${title}${colors.reset}`);
      console.log(`${colors.bright}${colors.blue}${line}${colors.reset}`);
    }
    this.writeToFile(this.logFile, `\n${'='.repeat(50)}\n${title}\n${'='.repeat(50)}`);
  }
  
  subsection(title) {
    if (this.enableConsole) {
      console.log(`\n${colors.cyan}▶ ${title}${colors.reset}`);
    }
    this.writeToFile(this.logFile, `\n▶ ${title}`);
  }
  
  // Tables
  table(data, headers) {
    if (!this.enableConsole) return;
    
    // Calculate column widths
    const columns = headers || Object.keys(data[0] || {});
    const widths = {};
    
    columns.forEach(col => {
      widths[col] = Math.max(
        col.length,
        ...data.map(row => String(row[col] || '').length)
      );
    });
    
    // Print header
    const headerRow = columns.map(col => col.padEnd(widths[col])).join(' | ');
    console.log(`${colors.bright}${headerRow}${colors.reset}`);
    console.log(columns.map(col => '-'.repeat(widths[col])).join('-+-'));
    
    // Print rows
    data.forEach(row => {
      const rowStr = columns.map(col => String(row[col] || '').padEnd(widths[col])).join(' | ');
      console.log(rowStr);
    });
  }
  
  // Server startup helper
  async runStartupSequence(tasks) {
    const results = [];
    
    this.section('🚀 Server Startup Sequence');
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const stepNumber = `[${i + 1}/${tasks.length}]`;
      
      try {
        this.startSpinner(`${stepNumber} ${task.name}...`);
        
        const startTime = Date.now();
        const result = await task.fn();
        const duration = Date.now() - startTime;
        
        this.stopSpinner(true);
        this.success(`${stepNumber} ${task.name} (${duration}ms)`);
        
        results.push({ 
          name: task.name, 
          success: true, 
          duration,
          result 
        });
      } catch (error) {
        this.stopSpinner(false);
        this.error(`${stepNumber} ${task.name} failed:`, error.message);
        
        results.push({ 
          name: task.name, 
          success: false, 
          error: error.message 
        });
        
        if (task.required !== false) {
          this.fatal('Critical startup task failed. Exiting...');
          throw error;
        }
      }
    }
    
    // Summary
    this.section('📊 Startup Summary');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    if (failed === 0) {
      this.success(`All ${successful} tasks completed successfully!`);
    } else {
      this.warning(`Completed: ${successful}, Failed: ${failed}`);
    }
    
    this.table(results.map(r => ({
      Task: r.name,
      Status: r.success ? '✅' : '❌',
      Duration: r.duration ? `${r.duration}ms` : 'N/A'
    })));
    
    return results;
  }
  
  // Log rotation
  rotateLogs(maxFiles = 7) {
    if (!this.enableFileLogging) return;
    
    const files = fs.readdirSync(this.logDir)
      .filter(f => f.endsWith('.log'))
      .map(f => ({
        name: f,
        path: path.join(this.logDir, f),
        stats: fs.statSync(path.join(this.logDir, f))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    // Keep only the most recent maxFiles
    if (files.length > maxFiles) {
      files.slice(maxFiles).forEach(file => {
        fs.unlinkSync(file.path);
        this.debug(`Deleted old log file: ${file.name}`);
      });
    }
  }
}

// Singleton instance
let instance = null;

function createLogger(options) {
  if (!instance) {
    instance = new Logger(options);
  }
  return instance;
}

module.exports = { Logger, createLogger };