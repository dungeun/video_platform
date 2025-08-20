#!/usr/bin/env node

const { exec } = require('child_process');
const port = process.env.PORT || 3000;

console.log(`Stopping server on port ${port}...`);

// Find and kill process using the port
exec(`lsof -ti :${port}`, (error, stdout, stderr) => {
  if (error) {
    console.log(`No process found on port ${port}`);
    process.exit(0);
  }
  
  const pids = stdout.trim().split('\n').filter(pid => pid);
  
  if (pids.length === 0) {
    console.log(`No process found on port ${port}`);
    process.exit(0);
  }
  
  pids.forEach(pid => {
    console.log(`Killing process ${pid}...`);
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`Process ${pid} terminated`);
    } catch (err) {
      console.error(`Failed to kill process ${pid}:`, err.message);
    }
  });
  
  // Give processes time to terminate gracefully
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});