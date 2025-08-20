const { Client } = require('pg');

// Try different connection configurations
async function testConnections() {
  // Test 1: Without password (trust mode)
  console.log('Test 1: Trust mode (no password)');
  const client1 = new Client({
    host: '141.164.60.51',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    ssl: false
  });
  
  try {
    await client1.connect();
    console.log('✅ Connected without password!');
    const res = await client1.query('SELECT version()');
    console.log('PostgreSQL version:', res.rows[0].version);
    await client1.end();
  } catch (err) {
    console.error('❌ Trust mode failed:', err.message);
  }

  // Test 2: With password
  console.log('\nTest 2: With password');
  const client2 = new Client({
    host: '141.164.60.51',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'REBYg9hnDdvw6gFMKwBPbnDIDclHKF4RHo9aIuAchefIqqxN6XOOOIKmyb89ItuK',
    ssl: false
  });
  
  try {
    await client2.connect();
    console.log('✅ Connected with password!');
    await client2.end();
  } catch (err) {
    console.error('❌ Password mode failed:', err.message);
  }

  // Test 3: Connection string
  console.log('\nTest 3: Connection string');
  const client3 = new Client({
    connectionString: 'postgres://postgres@141.164.60.51:5432/postgres'
  });
  
  try {
    await client3.connect();
    console.log('✅ Connected with connection string!');
    await client3.end();
  } catch (err) {
    console.error('❌ Connection string failed:', err.message);
  }
}

testConnections();