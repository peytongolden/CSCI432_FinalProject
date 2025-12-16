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

function generateMeetingCode(len = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const token = extractToken(event);
    const decoded = token ? verifyToken(token) : null;
    const userId = decoded?.id || null;
    
    console.log('[MEETINGS] Token present:', !!token, 'Decoded:', !!decoded, 'UserId:', userId);

    const db = await getDb();

    // POST - Create a new meeting
    if (event.httpMethod === 'POST') {
      const { name, datetime, description, committeeIds } = JSON.parse(event.body || '{}');

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: 'Meeting name required' })
        };
      }

      const meeting = {
        name,
        description: description || '',
        datetime: datetime || null,
        committeeIds: Array.isArray(committeeIds) 
          ? committeeIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id) 
          : [],
        createdBy: userId,
        code: generateMeetingCode(),
        active: true,
        participants: [],
        createdAt: new Date()
      };

      // If we have an authenticated user who created this meeting, add them as a participant and make them the presiding officer
      if (userId) {
        try {
          const userDoc = await db.collection('users').findOne({ _id: new ObjectId(userId) })
          if (userDoc) {
            const participant = {
              _id: new ObjectId(),
              name: userDoc.name || 'Guest',
              joinedAt: new Date(),
              uid: userId,
              role: 'chair'
            }
            meeting.participants.push(participant)
            meeting.presidingParticipantId = participant._id
          }
        } catch (e) {
          // ignore failures to fetch user doc — fallback to leaving participants empty
        }
      }

      const result = await db.collection('meetings').insertOne(meeting);

      // Update referenced committees
      if (meeting.committeeIds.length) {
        for (const cid of meeting.committeeIds) {
          try {
            await db.collection('committees').updateOne(
              { _id: new ObjectId(cid) },
              { $set: { ActiveMeeting: result.insertedId.toString() } }
            );
          } catch (e) {
            console.warn('Failed to update committee ActiveMeeting', cid, e);
          }
        }
      }

      // Return creator's participantId so the frontend can use it for proper identification
      const creatorParticipantId = meeting.participants.length > 0 ? meeting.participants[0]._id : null;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, meetingId: result.insertedId, code: meeting.code, creatorParticipantId })
      };
    }

    // GET - Get a specific meeting by ID or list all meetings
    if (event.httpMethod === 'GET') {
      // Check if we have a meeting ID in the path
      const pathParts = event.path.split('/');
      const lastSegment = pathParts[pathParts.length - 1];
      
      // If the last segment is a valid ObjectId, get that specific meeting
      if (lastSegment && lastSegment !== 'meetings' && ObjectId.isValid(lastSegment)) {
        const meetingId = lastSegment;
        const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });

        if (!meeting) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, message: 'Meeting not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, meeting })
        };
      }

      // Otherwise, list all active meetings
      const meetings = await db.collection('meetings').find({ active: true }).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, meetings })
      };
    }

    // PATCH - Update meeting metadata (e.g., presiding chair)
    if (event.httpMethod === 'PATCH') {
      try {
        // path: /api/meetings/:id
        const pathParts = event.path.split('/')
        const meetingId = pathParts[pathParts.length - 1]
        if (!meetingId || !ObjectId.isValid(meetingId)) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid meeting ID' }) }

        const body = JSON.parse(event.body || '{}')
        const { presidingParticipantId } = body

        if (!presidingParticipantId) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'presidingParticipantId required' }) }

        // set role: 'chair' for the selected participant and 'member' for others
        const update = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) })
        if (!update) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) }

        const updatedParticipants = (update.participants || []).map(p => {
          if (String(p._id) === String(presidingParticipantId)) return { ...p, role: 'chair' }
          return { ...p, role: 'member' }
        })

        await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $set: { participants: updatedParticipants, presidingParticipantId: presidingParticipantId } })
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
      } catch (err) {
        console.error('PATCH MEETING failed', err)
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Server error' }) }
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (err) {
    console.error('[MEETINGS] Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
}

