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

function verifyToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const db = await getDb();
    
    // Parse path segments: /api/motions, /api/motions/:motionId, /api/motions/:motionId/vote, etc.
    const path = event.path.replace(/^\/.netlify\/functions\/motions/, '').replace(/^\/api\/motions/, '') || '/';
    const segments = path.split('/').filter(Boolean);
    const body = event.body ? JSON.parse(event.body) : {};

    // POST /api/motions - Create new motion for a meeting
    // Body: { meetingId, title, description, type?, parentMotionId?, votingThreshold?, isAnonymous? }
    if (event.httpMethod === 'POST' && segments.length === 0) {
      const { meetingId, title, description, type, parentMotionId, votingThreshold, isAnonymous } = body;
      
      if (!meetingId) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'meetingId required' }) };
      }
      if (!title) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'title required' }) };
      }
      if (!ObjectId.isValid(meetingId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid meetingId' }) };
      }

      // Determine motion type and voting requirements
      const motionType = type || 'main';
      // Motion types: main, procedural, amendment, postpone, special, overturn
      
      // Determine voting threshold based on type or explicit override
      let threshold = votingThreshold;
      if (!threshold) {
        // Default thresholds by type
        switch (motionType) {
          case 'procedural':
          case 'overturn':
            threshold = 'twoThirds'; // Requires 2/3 majority
            break;
          case 'special':
            threshold = 'unanimous'; // Requires 100%
            break;
          default:
            threshold = 'simple'; // Requires >50%
        }
      }

      const motion = {
        _id: new ObjectId(),
        id: new ObjectId().toString(), // string id for frontend compatibility
        title,
        description: description || '',
        type: motionType, // main, procedural, amendment, postpone, special, overturn
        parentMotionId: parentMotionId || null,
        status: 'voting', // voting, completed, postponed, amended
        votes: {
          yes: [],
          no: [],
          abstain: []
        },
        discussion: [],
        result: null, // 'passed' | 'failed' | 'tied'
        chairSummary: '',
        pros: [],
        cons: [],
        votingThreshold: threshold, // 'simple' | 'twoThirds' | 'unanimous'
        isAnonymous: isAnonymous || false,
        createdAt: new Date(),
        createdBy: null
      };

      // Use the motion._id as the string id
      motion.id = motion._id.toString();

      // Get creator info from token if available
      const authHeader = event.headers['authorization'] || event.headers['Authorization'];
      const decoded = verifyToken(authHeader);
      if (decoded) {
        motion.createdBy = decoded.id;
      }

      const result = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId) },
        { $push: { motions: motion } }
      );

      if (result.modifiedCount === 0) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) };
      }

      return { statusCode: 201, headers, body: JSON.stringify({ success: true, motion }) };
    }

    // POST /api/motions/:motionId/vote - Cast or change vote
    // Body: { meetingId, participantId, participantName, vote: 'yes'|'no'|'abstain' }
    if (event.httpMethod === 'POST' && segments[1] === 'vote') {
      const motionId = segments[0];
      const { meetingId, participantId, participantName, vote } = body;

      if (!meetingId || !participantId || !vote) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'meetingId, participantId, and vote required' }) };
      }

      if (!['yes', 'no', 'abstain'].includes(vote)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'vote must be yes, no, or abstain' }) };
      }

      // First, get the meeting to find the motion
      const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });
      if (!meeting) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) };
      }

      // Find motion by _id (ObjectId) or id (string)
      const motionIndex = meeting.motions?.findIndex(m => 
        String(m._id) === motionId || m.id === motionId
      );

      if (motionIndex === -1 || motionIndex === undefined) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Motion not found' }) };
      }

      // Remove any existing votes from this participant
      const motion = meeting.motions[motionIndex];
      ['yes', 'no', 'abstain'].forEach(v => {
        if (Array.isArray(motion.votes[v])) {
          motion.votes[v] = motion.votes[v].filter(vote => 
            String(vote.participantId) !== String(participantId)
          );
        }
      });

      // Add the new vote
      const voteEntry = {
        participantId: String(participantId),
        participantName: participantName || 'Anonymous',
        timestamp: new Date()
      };

      if (!Array.isArray(motion.votes[vote])) {
        motion.votes[vote] = [];
      }
      motion.votes[vote].push(voteEntry);

      // Update the meeting with modified motion
      const updateResult = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId) },
        { $set: { [`motions.${motionIndex}`]: motion } }
      );

      if (updateResult.modifiedCount === 0) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to record vote' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Vote recorded' }) };
    }

    // POST /api/motions/:motionId/discuss - Add discussion comment
    // Body: { meetingId, participantId, participantName, comment, stance?: 'pro'|'con'|'neutral' }
    if (event.httpMethod === 'POST' && segments[1] === 'discuss') {
      const motionId = segments[0];
      const { meetingId, participantId, participantName, comment, stance } = body;

      if (!meetingId || !participantId || !comment) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'meetingId, participantId, and comment required' }) };
      }

      const discussionEntry = {
        _id: new ObjectId(),
        participantId,
        participantName: participantName || 'Anonymous',
        comment,
        stance: stance || 'neutral',
        timestamp: new Date()
      };

      // Find motion and push to discussion array
      const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });
      if (!meeting) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) };
      }

      const motionIndex = meeting.motions?.findIndex(m => 
        String(m._id) === motionId || m.id === motionId
      );

      if (motionIndex === -1 || motionIndex === undefined) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Motion not found' }) };
      }

      const result = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId) },
        { $push: { [`motions.${motionIndex}.discussion`]: discussionEntry } }
      );

      if (result.modifiedCount === 0) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to add comment' }) };
      }

      return { statusCode: 201, headers, body: JSON.stringify({ success: true, discussionEntry }) };
    }

    // PATCH /api/motions/:motionId - Update motion (end voting, add summary, etc.)
    // Body: { meetingId, status?, result?, chairSummary?, pros?, cons? }
    if (event.httpMethod === 'PATCH' && segments[0] && !segments[1]) {
      const motionId = segments[0];
      const { meetingId, status, result, chairSummary, pros, cons } = body;

      if (!meetingId) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'meetingId required' }) };
      }

      const meeting = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });
      if (!meeting) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) };
      }

      const motionIndex = meeting.motions?.findIndex(m => 
        String(m._id) === motionId || m.id === motionId
      );

      if (motionIndex === -1 || motionIndex === undefined) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Motion not found' }) };
      }

      const updateFields = {};
      if (status) updateFields[`motions.${motionIndex}.status`] = status;
      if (result) updateFields[`motions.${motionIndex}.result`] = result;
      if (chairSummary !== undefined) updateFields[`motions.${motionIndex}.chairSummary`] = chairSummary;
      if (pros !== undefined) updateFields[`motions.${motionIndex}.pros`] = Array.isArray(pros) ? pros : [];
      if (cons !== undefined) updateFields[`motions.${motionIndex}.cons`] = Array.isArray(cons) ? cons : [];

      if (Object.keys(updateFields).length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'No fields to update' }) };
      }

      const updateResult = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId) },
        { $set: updateFields }
      );

      if (updateResult.modifiedCount === 0) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Failed to update motion' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Motion updated' }) };
    }

    // GET /api/motions/:meetingId - Get all motions for a meeting
    if (event.httpMethod === 'GET' && segments[0]) {
      const meetingId = segments[0];
      
      if (!ObjectId.isValid(meetingId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid meetingId' }) };
      }

      const meeting = await db.collection('meetings').findOne(
        { _id: new ObjectId(meetingId) },
        { projection: { motions: 1 } }
      );

      if (!meeting) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Meeting not found' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, motions: meeting.motions || [] }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Endpoint not found' }) };

  } catch (err) {
    console.error('[MOTIONS] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Server error: ' + err.message }) };
  }
}
