#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

function generateApiKey(prefix = 'ak') {
  try {
    const randomPart = crypto.randomBytes(24).toString('hex');
    const apiKey = `${prefix}_${randomPart}`;
    return { success: true, data: apiKey };
  } catch (error) {
    return { success: false, error: `API 키 생성 실패: ${error}` };
  }
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 디렉토리 생성: ${dirPath}`);
  }
}

function setupClaudeCodeConfig() {
  const homeDir = os.homedir();
  const claudeDir = path.join(homeDir, '.claude');
  const configPath = path.join(claudeDir, 'claude_desktop_config.json');
  
  ensureDirectoryExists(claudeDir);
  
  // Claude Code 사용 시 API 키 불필요
  const config = {
    mcpServers: {
      "taskmaster-ai": {
        command: "npx",
        args: ["-y", "task-master-ai"],
        env: {
          CLAUDECODE: "1",
          CLAUDE_CODE_ENTRYPOINT: "cli",
          TASKMASTER_DEFAULT_PROVIDER: "claude-code"
        }
      },
      "context7": {
        command: "npx",
        args: ["-y", "@context7/mcp-server"],
        env: {}
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Claude Code 설정 생성 (API 키 없음): ${configPath}`);
  
  return null; // API 키 없음
}

function setupTaskMasterGlobalConfig() {
  const homeDir = os.homedir();
  const taskmasterDir = path.join(homeDir, '.claude', '.taskmaster-global');
  const configPath = path.join(taskmasterDir, 'config.json');
  
  ensureDirectoryExists(taskmasterDir);
  
  const config = {
    models: {
      main: {
        provider: "claude-code",
        modelId: "sonnet",
        maxTokens: 64000,
        temperature: 0.2
      }
    },
    defaultProvider: "claude-code",
    projectSettings: {
      "revu-platform": {
        phases: ["planning", "development", "testing", "deployment"],
        defaultComplexity: "medium",
        tags: ["backend", "api", "database"]
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ TaskMaster 글로벌 설정 생성 (Claude Code 모드): ${configPath}`);
}

function setupProjectMcpConfig() {
  const cursorDir = '.cursor';
  const configPath = path.join(cursorDir, 'mcp.json');
  
  ensureDirectoryExists(cursorDir);
  
  const config = {
    mcpServers: {
      "taskmaster-ai": {
        command: "npx",
        args: ["task-master-ai"],
        env: {
          CLAUDECODE: "1",
          CLAUDE_CODE_ENTRYPOINT: "cli",
          TASKMASTER_DEFAULT_PROVIDER: "claude-code"
        }
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ 프로젝트 MCP 설정 생성 (API 키 없음): ${configPath}`);
}

function updateEnvironmentFile() {
  const envFile = path.join(process.cwd(), 'apps', 'api', '.env');
  const envExampleFile = path.join(process.cwd(), 'apps', 'api', '.env.example');
  
  if (!fs.existsSync(envFile) && fs.existsSync(envExampleFile)) {
    fs.copyFileSync(envExampleFile, envFile);
    console.log('✅ .env 파일을 .env.example에서 복사했습니다');
  }
}

function main() {
  console.log('🚀 MCP TaskMaster 설정을 시작합니다 (API 키 없음)...\n');
  
  try {
    // 1. Claude Code 설정 (API 키 없음)
    setupClaudeCodeConfig();
    
    // 2. TaskMaster 글로벌 설정 (Claude Code 모드)
    setupTaskMasterGlobalConfig();
    
    // 3. 프로젝트 MCP 설정 (API 키 없음)
    setupProjectMcpConfig();
    
    // 4. 환경 파일 업데이트
    updateEnvironmentFile();
    
    console.log('\n🎉 MCP TaskMaster 설정이 완료되었습니다!');
    console.log('\n✨ Claude Code 모드로 설정됨 - API 키가 필요하지 않습니다!');
    console.log('\n📋 설정된 기능:');
    console.log('   • TaskMaster AI (Claude Code 제공자)');
    console.log('   • Context7 MCP 서버');
    console.log('   • 프로젝트별 작업 템플릿');
    console.log('\n🔄 Claude Code를 재시작하여 설정을 적용하세요.');
    
  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateApiKey,
  setupClaudeCodeConfig,
  setupTaskMasterGlobalConfig,
  setupProjectMcpConfig
};