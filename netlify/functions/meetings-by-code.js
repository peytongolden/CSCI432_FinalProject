import { MongoClient } from 'mongodb';

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

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract code from path: /api/meetings/code/:code
    const pathParts = event.path.split('/');
    const code = pathParts[pathParts.length - 1];

    console.log('[MEETINGS-BY-CODE] Looking up meeting with code:', code);

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Meeting code required' })
      };
    }

    const db = await getDb();
    
    // Make code lookup case-insensitive
    const meeting = await db.collection('meetings').findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') }, 
      active: true 
    });

    console.log('[MEETINGS-BY-CODE] Meeting found:', !!meeting);

    if (!meeting) {
      console.log('[MEETINGS-BY-CODE] No meeting found with code:', code);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Meeting not found or inactive' })
      };
    }

    console.log('[MEETINGS-BY-CODE] Returning meeting:', meeting._id);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, meeting })
    };

  } catch (err) {
    console.error('[MEETINGS-BY-CODE] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
}

