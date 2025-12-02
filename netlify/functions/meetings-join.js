import { MongoClient, ObjectId } from 'mongodb';

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
    // Extract meeting ID from path: /api/meetings/:id/join
    const pathParts = event.path.split('/');
    // Path looks like: /api/meetings/MEETING_ID/join
    const joinIndex = pathParts.indexOf('join');
    const meetingId = joinIndex > 0 ? pathParts[joinIndex - 1] : null;

    if (!meetingId || !ObjectId.isValid(meetingId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid meeting ID' })
      };
    }

    const { displayName } = JSON.parse(event.body || '{}');

    if (!displayName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'displayName required' })
      };
    }

    const participant = {
      _id: new ObjectId(),
      name: displayName,
      joinedAt: new Date(),
      uid: null
    };

    const db = await getDb();
    const result = await db.collection('meetings').updateOne(
      { _id: new ObjectId(meetingId) },
      { $push: { participants: participant } }
    );

    if (result.modifiedCount === 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: 'Could not add participant' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, participantId: participant._id, meetingId })
    };

  } catch (err) {
    console.error('[MEETINGS-JOIN] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
}

