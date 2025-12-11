import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  cachedDb = client.db('WebProgFinal');
  return cachedDb;
}

// Netlify Functions v1 format - exports a handler function
export async function handler(event, context) {
  // Set headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight CORS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { name, email, password } = JSON.parse(event.body || '{}');

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Name, email and password are required' })
      };
    }

    const db = await getDb();
    
    // Check if user already exists
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ success: false, message: 'Account already exists' })
      };
    }

    // Hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const userDoc = {
      name,
      email,
      password_hash: hashed,
      committee_memberships: [],
      phone_number: '',
      short_bio: '',
      address: ''
    };

    const result = await db.collection('users').insertOne(userDoc);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        user: { id: result.insertedId.toString(), name, email } 
      })
    };

  } catch (err) {
    console.error('[REGISTER] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
}
