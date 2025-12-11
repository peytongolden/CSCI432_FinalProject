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

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, meetingId: result.insertedId, code: meeting.code, participantId: meeting.presidingParticipantId ? String(meeting.presidingParticipantId) : null })
      };
    }

    // PATCH - Update meeting metadata (e.g., presiding chair, motions, votes)
    if (event.httpMethod === 'PATCH') {
      try {
        // path: /api/meetings/:id
        const pathParts = event.path.split('/')
        const meetingId = pathParts[pathParts.length - 1]
        if (!meetingId || !ObjectId.isValid(meetingId)) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid meeting ID' }) }

        const body = JSON.parse(event.body || '{}')
        const { action } = body
        const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) })
        if (!meeting) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) }

        // Helper to look up participant by either participantId or token uid (robust to ObjectId types)
        const normalize = (x) => (x && x.toString ? x.toString() : String(x))
        const findParticipantByUid = (uid) => (meeting.participants || []).find(p => normalize(p.uid) === String(uid))
        const findParticipantById = (pid) => (meeting.participants || []).find(p => normalize(p._id) === String(pid) || normalize(p._id?.$oid) === String(pid) || normalize(p.uid) === String(pid))

        // Role check for presiding officer
        const isPresidingForUser = (decodedId) => {
          if (!decodedId) return false
          const p = findParticipantByUid(decodedId) || findParticipantById(decodedId)
          if (!p) return false
          if (p.role === 'chair') return true
          if (meeting.presidingParticipantId && (normalize(p._id) === normalize(meeting.presidingParticipantId) || normalize(p.uid) === normalize(meeting.presidingParticipantId))) return true
          return false
        }

        if (!action) {
          // fallback to previous behaviour: presidingParticipantId update
          const { presidingParticipantId } = body
            if (!presidingParticipantId) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'presidingParticipantId required' }) }
            const updatedParticipants = (meeting.participants || []).map(p => ({ ...p, role: (String(p._id) === String(presidingParticipantId) || String(p.uid) === String(presidingParticipantId)) ? 'chair' : 'member' }))
            await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $set: { participants: updatedParticipants, presidingParticipantId } })
            // Return a more helpful response with normalized participants
            const normalized = updatedParticipants.map(p => ({ id: p._id ? (p._id.toString ? p._id.toString() : String(p._id)) : (p.uid ? String(p.uid) : null), name: p.name || 'Guest', role: p.role || 'member', uid: p.uid ? String(p.uid) : null }))
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, presidingParticipantId: presidingParticipantId ? String(presidingParticipantId) : null, participants: normalized }) }
        }

        // Handle specific actions
        switch (action) {
          case 'addMotion': {
            const { title, description, createdByParticipantId, createdByUid } = body
            // disallow proposals while voting in progress
            if (Array.isArray(meeting.motions) && meeting.motions.some(m => m.status === 'voting')) {
              return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Cannot propose new motion while voting is in progress' }) }
            }
            const newMotion = {
              id: new ObjectId().toString(),
              title: title || 'Untitled',
              description: description || '',
              status: 'proposed',
              createdBy: createdByParticipantId || createdByUid || null,
              votesByParticipant: {},
              createdAt: new Date()
            }
            await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $push: { motions: newMotion } })
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, motion: newMotion }) }
          }
          case 'startVoting': {
            const { motionId } = body
            // must be presiding officer
            if (!isPresidingForUser(userId)) return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Not authorized' }) }
            if (Array.isArray(meeting.motions) && meeting.motions.some(m => m.status === 'voting')) {
              return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Another motion is currently open for voting' }) }
            }
            const updated = (meeting.motions || []).map(m => (m.id === motionId ? { ...m, status: 'voting' } : m))
            await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $set: { motions: updated } })
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
          }
          case 'endVoting': {
            const { motionId } = body
            if (!isPresidingForUser(userId)) return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: 'Not authorized' }) }
            const updated = (meeting.motions || []).map(m => (m.id === motionId ? { ...m, status: 'completed' } : m))
            await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $set: { motions: updated } })
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
          }
          case 'castVote': {
            const { motionId, participantId, uid, vote } = body
            if (!vote || !['yes', 'no', 'abstain'].includes(vote)) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid vote' }) }
            const motion = (meeting.motions || []).find(m => m.id === motionId)
            if (!motion) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Motion not found' }) }
            if (motion.status !== 'voting') return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Voting is not open for this motion' }) }

            // Update votesByParticipant map
            const identifier = participantId || uid || userId || null
            if (!identifier) return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'participantId or uid required' }) }

            // update in-memory then persist whole motions array
            const updated = (meeting.motions || []).map(m => {
              if (m.id !== motionId) return m
              const newVotes = Object.assign({}, m.votesByParticipant || {})
              newVotes[String(identifier)] = vote
              return { ...m, votesByParticipant: newVotes }
            })
            await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $set: { motions: updated } })
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
          }
          default: {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Unknown action' }) }
          }
        }
      } catch (err) {
        console.error('PATCH MEETING failed', err)
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Server error' }) }
      }
    }

    // GET - List meetings (optional, for future use)
    if (event.httpMethod === 'GET') {
      const meetings = await db.collection('meetings').find({ active: true }).toArray();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, meetings })
      };
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

