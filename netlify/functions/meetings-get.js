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
    // Extract meeting ID from path: /api/meetings/:id
    const pathParts = event.path.split('/');
    const meetingId = pathParts[pathParts.length - 1];

    if (!meetingId || !ObjectId.isValid(meetingId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid meeting ID' })
      };
    }

    const db = await getDb();
    const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });

    if (!meeting) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Meeting not found' })
      };
    }

    // Compute vote tallies for each motion
    if (Array.isArray(meeting.motions)) {
      meeting.motions = meeting.motions.map(m => {
        const votesByParticipant = m.votesByParticipant || {}
        const counts = { yes: 0, no: 0, abstain: 0 }
        for (const k of Object.keys(votesByParticipant)) {
          const v = votesByParticipant[k]
          if (v === 'yes') counts.yes++
          else if (v === 'no') counts.no++
          else if (v === 'abstain') counts.abstain++
        }
        return { ...m, votes: counts, votesByParticipant }
      })
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, meeting })
    };

  } catch (err) {
    console.error('[MEETINGS-GET] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
}

