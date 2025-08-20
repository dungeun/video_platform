#!/usr/bin/env node

/**
 * 데이터베이스 백업 스크립트
 * Prisma 스키마와 데이터를 SQL 형태로 백업합니다.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

const BACKUP_DIR = './backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// 백업할 테이블 목록 (중요한 테이블 우선)
const BACKUP_TABLES = [
  'users',
  'channels',
  'videos', 
  'live_streams',
  'stream_keys',
  'files',
  'business_profiles',
  'campaigns',
  'campaign_applications',
  'payouts',
  'subscription_plans',
  'subscriptions',
  'video_comments',
  'video_likes',
  'video_views',
  'chat_messages',
  'stream_stats'
];

async function createBackupDirectory() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log('📁 Backup directory created/verified');
  } catch (error) {
    console.error('Failed to create backup directory:', error);
  }
}

async function generateSchemaSQL() {
  console.log('📋 Generating schema SQL...');
  
  const schemaSQL = `
-- VideoPick Database Schema Backup
-- Generated: ${new Date().toISOString()}
-- Source: Prisma Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'USER',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR,
  reset_token VARCHAR,
  reset_token_expires_at TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  last_login_attempt TIMESTAMP,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMP,
  profile_image_url VARCHAR,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  profile_image_url VARCHAR,
  banner_image_url VARCHAR,
  subscriber_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_streams INTEGER DEFAULT 0,
  total_stream_time INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  user_id VARCHAR NOT NULL,
  channel_id VARCHAR NOT NULL,
  video_url VARCHAR NOT NULL,
  thumbnail_url VARCHAR,
  hls_url VARCHAR,
  dash_url VARCHAR,
  duration INTEGER,
  file_size BIGINT,
  mime_type VARCHAR,
  width INTEGER,
  height INTEGER,
  status VARCHAR DEFAULT 'PROCESSING',
  category VARCHAR DEFAULT 'general',
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_live_recording BOOLEAN DEFAULT false,
  original_stream_id VARCHAR,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (channel_id) REFERENCES channels(id),
  FOREIGN KEY (original_stream_id) REFERENCES live_streams(id)
);

-- Live streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  channel_id VARCHAR NOT NULL,
  stream_key VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'PREPARING',
  category VARCHAR DEFAULT 'general',
  rtmp_url VARCHAR,
  hls_url VARCHAR,
  flv_url VARCHAR,
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  duration INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  scheduled_at TIMESTAMP,
  terminated_reason VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- Stream keys table
CREATE TABLE IF NOT EXISTS stream_keys (
  id VARCHAR PRIMARY KEY,
  channel_id VARCHAR NOT NULL,
  key_name VARCHAR NOT NULL,
  stream_key VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'ACTIVE',
  permissions TEXT[],
  last_used_at TIMESTAMP,
  regenerated_at TIMESTAMP,
  status_updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR PRIMARY KEY,
  file_name VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  size BIGINT NOT NULL,
  status VARCHAR DEFAULT 'UPLOADING',
  upload_progress INTEGER DEFAULT 0,
  uploaded_size BIGINT DEFAULT 0,
  user_id VARCHAR NOT NULL,
  error_message TEXT,
  metadata JSONB,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_channel_id ON live_streams(channel_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_key ON live_streams(stream_key);
CREATE INDEX IF NOT EXISTS idx_stream_keys_channel_id ON stream_keys(channel_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
`;

  const filePath = path.join(BACKUP_DIR, `schema_${TIMESTAMP}.sql`);
  await fs.writeFile(filePath, schemaSQL);
  console.log(`✅ Schema SQL saved to: ${filePath}`);
}

async function backupTableData(tableName) {
  try {
    console.log(`📊 Backing up table: ${tableName}`);
    
    // 동적으로 테이블 데이터 조회
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
    
    if (data.length === 0) {
      console.log(`   📋 Table ${tableName} is empty`);
      return '';
    }

    // 테이블 구조 가져오기
    const columns = Object.keys(data[0]);
    
    // INSERT 문 생성
    let insertSQL = `-- Data for table: ${tableName}\n`;
    insertSQL += `-- Records: ${data.length}\n\n`;

    for (const row of data) {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') {
          // SQL injection 방지를 위해 작은따옴표 이스케이프
          return `'${value.replace(/'/g, "''")}'`;
        }
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (Array.isArray(value)) return `'${JSON.stringify(value)}'`;
        if (typeof value === 'object') return `'${JSON.stringify(value)}'`;
        return value;
      });

      insertSQL += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
    }

    insertSQL += '\n';
    console.log(`   ✅ ${data.length} records backed up from ${tableName}`);
    return insertSQL;

  } catch (error) {
    console.error(`   ❌ Error backing up ${tableName}:`, error.message);
    return `-- Error backing up ${tableName}: ${error.message}\n\n`;
  }
}

async function generateDataSQL() {
  console.log('📊 Generating data SQL...');
  
  let dataSQL = `-- VideoPick Database Data Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
  
  // 외래 키 제약 조건 비활성화
  dataSQL += `-- Disable foreign key checks\nSET session_replication_role = replica;\n\n`;

  for (const tableName of BACKUP_TABLES) {
    const tableData = await backupTableData(tableName);
    dataSQL += tableData;
  }

  // 외래 키 제약 조건 재활성화
  dataSQL += `-- Re-enable foreign key checks\nSET session_replication_role = DEFAULT;\n`;

  const filePath = path.join(BACKUP_DIR, `data_${TIMESTAMP}.sql`);
  await fs.writeFile(filePath, dataSQL);
  console.log(`✅ Data SQL saved to: ${filePath}`);
}

async function generateFullBackup() {
  console.log('📦 Generating complete backup...');
  
  const schemaPath = path.join(BACKUP_DIR, `schema_${TIMESTAMP}.sql`);
  const dataPath = path.join(BACKUP_DIR, `data_${TIMESTAMP}.sql`);
  
  try {
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    const dataSQL = await fs.readFile(dataPath, 'utf8');
    
    const fullSQL = `-- VideoPick Complete Database Backup
-- Generated: ${new Date().toISOString()}
-- 
-- This backup includes:
-- 1. Database schema (tables, indexes, constraints)
-- 2. All data from core tables
--
-- Restore instructions:
-- 1. Create a new PostgreSQL database
-- 2. Run this SQL file: psql -d your_database < backup_file.sql
-- 3. Update your DATABASE_URL environment variable
--

${schemaSQL}

${dataSQL}
`;

    const fullPath = path.join(BACKUP_DIR, `videopick_complete_backup_${TIMESTAMP}.sql`);
    await fs.writeFile(fullPath, fullSQL);
    console.log(`✅ Complete backup saved to: ${fullPath}`);
    
  } catch (error) {
    console.error('❌ Error generating complete backup:', error);
  }
}

async function generateBackupInfo() {
  const info = {
    timestamp: new Date().toISOString(),
    database_url: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
    tables_backed_up: BACKUP_TABLES,
    backup_files: [
      `schema_${TIMESTAMP}.sql`,
      `data_${TIMESTAMP}.sql`, 
      `videopick_complete_backup_${TIMESTAMP}.sql`
    ],
    restore_instructions: [
      '1. Create new PostgreSQL database',
      '2. Run: psql -d your_database < videopick_complete_backup_[timestamp].sql',
      '3. Update DATABASE_URL in .env',
      '4. Run: npm run db:generate'
    ]
  };

  const infoPath = path.join(BACKUP_DIR, `backup_info_${TIMESTAMP}.json`);
  await fs.writeFile(infoPath, JSON.stringify(info, null, 2));
  console.log(`✅ Backup info saved to: ${infoPath}`);
}

async function main() {
  console.log('🚀 Starting VideoPick Database Backup...\n');
  
  try {
    await createBackupDirectory();
    await generateSchemaSQL();
    await generateDataSQL();
    await generateFullBackup();
    await generateBackupInfo();
    
    console.log('\n🎉 Database backup completed successfully!');
    console.log(`📁 Backup files are located in: ${BACKUP_DIR}/`);
    console.log(`📅 Timestamp: ${TIMESTAMP}`);
    
  } catch (error) {
    console.error('\n❌ Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
main().catch(console.error);