import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

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

function extractToken(event) {
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 ? parts[1] : parts[0];
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const token = extractToken(event);
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No token provided' })
      };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const { committee, userEmail } = JSON.parse(event.body || '{}');

    if (!committee || !committee.CommitteeName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Committee name required' })
      };
    }

    const db = await getDb();

    // Check if committee name already exists
    const existing = await db.collection('committees').findOne({ CommitteeName: committee.CommitteeName });
    if (existing) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Committee name already in use' })
      };
    }

    // Get user info
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Add owner to members
    const owner = {
      uid: user._id.toString(),
      role: 'Owner',
      vote: 0,
      procon: 0
    };

    const committeeDoc = {
      ...committee,
      Members: [owner]
    };

    const result = await db.collection('committees').insertOne(committeeDoc);

    // Add committee to user's memberships
    await db.collection('users').updateOne(
      { email: userEmail },
      { $push: { committee_memberships: result.insertedId.toString() } }
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, insertedId: result.insertedId })
    };

  } catch (err) {
    console.error('[COMMITTEE-NEW] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error: ' + err.message })
    };
  }
}

