const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: 'postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@141.164.60.51:5434/postgres',
    ssl: false
  });

  try {
    console.log('Connecting to Coolify PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // 관리자 계정 확인
    const admin = await client.query("SELECT id, email, name, type FROM users WHERE email = 'admin@videopick.com'");
    console.log('\n관리자 계정:', admin.rows[0]);
    
    await client.end();
    console.log('\n데이터베이스 연결 성공! 이제 로그인 테스트를 진행하세요.');
    console.log('이메일: admin@videopick.com');
    console.log('비밀번호: admin123');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();