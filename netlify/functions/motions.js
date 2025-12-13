import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

let dbConnection;

async function getDb() {
  if (!dbConnection) {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    dbConnection = client.db('WebProgFinal');
  }
  return dbConnection;
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

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await getDb();
  const path = req.path.replace('/.netlify/functions/motions', '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    // POST /motions - Create new motion for a meeting
    // Body: { meetingId, title, description, type, parentMotionId? }
    // type: 'main' | 'procedural' | 'amendment' | 'postpone'
    if (req.method === 'POST' && segments.length === 0) {
      const { meetingId, title, description, type, parentMotionId } = req.body || {};
      
      if (!meetingId) return res.status(400).json({ success: false, message: 'meetingId required' });
      if (!title) return res.status(400).json({ success: false, message: 'title required' });
      if (!ObjectId.isValid(meetingId)) return res.status(400).json({ success: false, message: 'Invalid meetingId' });

      const motion = {
        _id: new ObjectId(),
        title,
        description: description || '',
        type: type || 'main', // main, procedural, amendment, postpone
        parentMotionId: parentMotionId || null, // for sub-motions
        status: 'voting', // voting, completed, postponed, amended
        votes: {
          yes: [],
          no: [],
          abstain: []
        },
        discussion: [], // array of {userId, userName, comment, stance: 'pro'|'con'|'neutral', timestamp}
        result: null, // 'passed' | 'failed' | 'tied' | 'postponed'
        chairSummary: '',
        requiredMajority: type === 'procedural' ? 0.67 : 0.5, // 2/3 for procedural
        createdAt: new Date(),
        createdBy: null
      };

      // Get token info if available
      const decoded = verifyToken(req.headers.authorization);
      if (decoded) {
        motion.createdBy = decoded.id;
      }

      const result = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId) },
        { $push: { motions: motion } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      return res.status(201).json({ success: true, motion });
    }

    // POST /motions/:motionId/vote - Cast or change vote
    // Body: { meetingId, odparticipantId, odparticipantName, vote: 'yes'|'no'|'abstain' }
    if (req.method === 'POST' && segments[1] === 'vote') {
      const motionId = segments[0];
      const { meetingId, odparticipantId, odparticipantName, participantId, participantName, vote } = req.body || {};
      
      const finalParticipantId = participantId || odparticipantId;
      const finalParticipantName = participantName || odparticipantName;

      if (!meetingId || !finalParticipantId || !vote) {
        return res.status(400).json({ success: false, message: 'meetingId, participantId, and vote required' });
      }

      if (!['yes', 'no', 'abstain'].includes(vote)) {
        return res.status(400).json({ success: false, message: 'vote must be yes, no, or abstain' });
      }

      // First, remove any existing vote from this participant
      const removeResult = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId), 'motions._id': new ObjectId(motionId) },
        {
          $pull: {
            'motions.$.votes.yes': { odparticipantId: finalParticipantId },
            'motions.$.votes.no': { odparticipantId: finalParticipantId },
            'motions.$.votes.abstain': { odparticipantId: finalParticipantId }
          }
        }
      );

      // Also try with participantId field
      await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId), 'motions._id': new ObjectId(motionId) },
        {
          $pull: {
            'motions.$.votes.yes': { participantId: finalParticipantId },
            'motions.$.votes.no': { participantId: finalParticipantId },
            'motions.$.votes.abstain': { participantId: finalParticipantId }
          }
        }
      );

      // Add the new vote
      const voteEntry = {
        odparticipantId: finalParticipantId,
        participantId: finalParticipantId,
        odparticipantName: finalParticipantName,
        participantName: finalParticipantName,
        timestamp: new Date()
      };

      const addResult = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId), 'motions._id': new ObjectId(motionId) },
        { $push: { [`motions.$.votes.${vote}`]: voteEntry } }
      );

      if (addResult.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Motion or meeting not found' });
      }

      return res.status(200).json({ success: true, message: 'Vote recorded' });
    }

    // POST /motions/:motionId/discuss - Add discussion comment
    // Body: { meetingId, participantId, participantName, comment, stance: 'pro'|'con'|'neutral' }
    if (req.method === 'POST' && segments[1] === 'discuss') {
      const motionId = segments[0];
      const { meetingId, participantId, participantName, comment, stance } = req.body || {};

      if (!meetingId || !participantId || !comment) {
        return res.status(400).json({ success: false, message: 'meetingId, participantId, and comment required' });
      }

      const discussionEntry = {
        _id: new ObjectId(),
        participantId,
        participantName: participantName || 'Anonymous',
        comment,
        stance: stance || 'neutral', // pro, con, neutral
        timestamp: new Date()
      };

      const result = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId), 'motions._id': new ObjectId(motionId) },
        { $push: { 'motions.$.discussion': discussionEntry } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Motion or meeting not found' });
      }

      return res.status(201).json({ success: true, discussionEntry });
    }

    // PATCH /motions/:motionId - Update motion (end voting, add summary, etc.)
    // Body: { meetingId, status?, result?, chairSummary? }
    if (req.method === 'PATCH' && segments[0] && !segments[1]) {
      const motionId = segments[0];
      const { meetingId, status, result, chairSummary } = req.body || {};

      if (!meetingId) {
        return res.status(400).json({ success: false, message: 'meetingId required' });
      }

      const updateFields = {};
      if (status) updateFields['motions.$.status'] = status;
      if (result) updateFields['motions.$.result'] = result;
      if (chairSummary !== undefined) updateFields['motions.$.chairSummary'] = chairSummary;

      const updateResult = await db.collection('meetings').updateOne(
        { _id: new ObjectId(meetingId), 'motions._id': new ObjectId(motionId) },
        { $set: updateFields }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Motion or meeting not found' });
      }

      return res.status(200).json({ success: true, message: 'Motion updated' });
    }

    // GET /motions/:meetingId - Get all motions for a meeting
    if (req.method === 'GET' && segments[0]) {
      const meetingId = segments[0];
      if (!ObjectId.isValid(meetingId)) {
        return res.status(400).json({ success: false, message: 'Invalid meetingId' });
      }

      const meeting = await db.collection('meetings').findOne(
        { _id: new ObjectId(meetingId) },
        { projection: { motions: 1 } }
      );

      if (!meeting) {
        return res.status(404).json({ success: false, message: 'Meeting not found' });
      }

      return res.status(200).json({ success: true, motions: meeting.motions || [] });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (err) {
    console.error('Motions function error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

