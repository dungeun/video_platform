const { Client } = require('pg');

async function testConnection() {
  // 여러 연결 방법 시도
  const connections = [
    {
      name: 'IP with password',
      config: {
        connectionString: 'postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@141.164.60.51:5432/postgres',
        ssl: false
      }
    },
    {
      name: 'Domain with password',
      config: {
        connectionString: 'postgresql://postgres:REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK@coolify.one-q.xyz:5432/postgres',
        ssl: false
      }
    }
  ];

  for (const conn of connections) {
    console.log(`\nTrying: ${conn.name}`);
    const client = new Client(conn.config);

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\nExisting tables:', tables.rows.map(r => r.table_name));
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testConnection();