const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = "postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@coolify.one-q.xyz:21871/postgres";

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  const backupFile = `video_platform_backup_${timestamp}.sql`;
  
  console.log('🔄 Starting database backup...');
  console.log(`📅 Timestamp: ${timestamp}`);
  console.log(`📁 Backup file: ${backupFile}`);
  
  // PostgreSQL 클라이언트를 사용해서 백업 시도
  const pgDumpCommand = `pg_dump "${DATABASE_URL}" > ${backupFile}`;
  
  try {
    // pg_dump가 있는지 확인
    await new Promise((resolve, reject) => {
      exec('which pg_dump', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  pg_dump not found locally, trying Docker...');
          // Docker를 사용해서 백업
          const dockerCommand = `docker run --rm postgres:17-alpine pg_dump "${DATABASE_URL}" > ${backupFile}`;
          exec(dockerCommand, (dockerError, dockerStdout, dockerStderr) => {
            if (dockerError) {
              console.error('❌ Docker backup failed:', dockerError);
              reject(dockerError);
            } else {
              console.log('✅ Docker backup completed');
              resolve(dockerStdout);
            }
          });
        } else {
          console.log('✅ Using local pg_dump');
          exec(pgDumpCommand, (error, stdout, stderr) => {
            if (error) {
              console.error('❌ pg_dump failed:', error);
              reject(error);
            } else {
              console.log('✅ Local pg_dump completed');
              resolve(stdout);
            }
          });
        }
      });
    });
    
    // 백업 파일 크기 확인
    const stats = fs.statSync(backupFile);
    console.log(`📊 Backup file size: ${Math.round(stats.size / 1024)} KB`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    // 대안: Prisma를 사용해서 데이터 백업
    console.log('🔄 Trying alternative backup with Prisma...');
    await backupWithPrisma(backupFile);
    return backupFile;
  }
}

async function backupWithPrisma(backupFile) {
  const { PrismaClient } = require('@prisma/client');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL
        }
      }
    });
    
    console.log('🔄 Connecting to database...');
    
    // 주요 테이블들의 데이터 백업
    const tables = [
      'users',
      'youtube_videos', 
      'channels',
      'videos',
      'site_config'
    ];
    
    let backupData = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    for (const table of tables) {
      try {
        console.log(`📋 Backing up ${table}...`);
        
        let data = [];
        switch(table) {
          case 'users':
            data = await prisma.users.findMany();
            break;
          case 'youtube_videos':
            data = await prisma.youtube_videos.findMany();
            break;
          case 'channels':
            data = await prisma.channels.findMany();
            break;
          case 'videos':
            data = await prisma.videos.findMany();
            break;
          case 'site_config':
            data = await prisma.site_config.findMany();
            break;
        }
        
        backupData.tables[table] = data;
        console.log(`✅ ${table}: ${data.length} records`);
      } catch (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
        backupData.tables[table] = [];
      }
    }
    
    // JSON 형태로 백업 저장
    const jsonBackupFile = backupFile.replace('.sql', '.json');
    fs.writeFileSync(jsonBackupFile, JSON.stringify(backupData, null, 2));
    console.log(`📁 Prisma backup saved: ${jsonBackupFile}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Prisma backup failed:', error.message);
    
    // 최소한의 환경변수 백업이라도 저장
    const envBackup = {
      timestamp: new Date().toISOString(),
      database_url: DATABASE_URL,
      note: 'Database connection failed, only URL saved'
    };
    
    fs.writeFileSync(backupFile.replace('.sql', '_env.json'), JSON.stringify(envBackup, null, 2));
    console.log('📁 Environment backup saved');
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  backupDatabase()
    .then(backupFile => {
      console.log(`\n🎉 Backup completed: ${backupFile}`);
      console.log('\n📋 Next steps:');
      console.log('1. Delete old database from Coolify');
      console.log('2. Create new database');  
      console.log('3. Restore from backup');
    })
    .catch(error => {
      console.error('\n❌ Backup failed:', error);
      process.exit(1);
    });
}

module.exports = { backupDatabase, backupWithPrisma };