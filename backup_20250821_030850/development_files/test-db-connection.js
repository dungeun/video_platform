const { Client } = require('pg');
require('dotenv').config();

async function testConnections() {
  console.log('🔍 Testing Database Connections...\n');
  
  const connections = [
    {
      name: 'External Port (21871)',
      url: 'postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@coolify.one-q.xyz:21871/postgres'
    },
    {
      name: 'Alternative Port (5432)',
      url: 'postgres://postgres:47qdtodgTe996CTr16ESlNdywFcFFD5GdChiM7FrxEdaPr5ug5mGvwp9n9a5H6KX@coolify.one-q.xyz:5432/postgres'
    },
    {
      name: 'Working Revu DB (reference)',
      url: 'postgres://linkpick_user:LinkPick2024!@coolify.one-q.xyz:5433/revu_platform'
    }
  ];

  for (const conn of connections) {
    const client = new Client({ connectionString: conn.url });
    
    try {
      console.log(`Testing: ${conn.name}`);
      console.log(`URL: ${conn.url.replace(/:[^@]+@/, ':***@')}`);
      
      await client.connect();
      const result = await client.query('SELECT NOW()');
      console.log(`✅ SUCCESS - Connected at: ${result.rows[0].now}`);
      await client.end();
    } catch (error) {
      console.log(`❌ FAILED - ${error.message}`);
    }
    console.log('---\n');
  }

  // Also test current env DATABASE_URL
  console.log('Testing current .env DATABASE_URL:');
  console.log(`URL: ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@')}`);
  
  const envClient = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await envClient.connect();
    const result = await envClient.query('SELECT NOW()');
    console.log(`✅ ENV DATABASE_URL works - Connected at: ${result.rows[0].now}`);
    await envClient.end();
  } catch (error) {
    console.log(`❌ ENV DATABASE_URL failed - ${error.message}`);
  }
}

testConnections().catch(console.error);