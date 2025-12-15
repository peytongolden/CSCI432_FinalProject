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
  const path = req.path.replace('/.netlify/functions/committees', '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    // POST /committees - Create new committee
    // Body: { name, description? }
    if (req.method === 'POST' && segments.length === 0) {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const { name, description } = req.body || {};
      if (!name) return res.status(400).json({ success: false, message: 'Committee name required' });

      // Check if committee name already exists
      const existing = await db.collection('committees').findOne({ CommitteeName: name });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Committee name already in use' });
      }

      const committee = {
        CommitteeName: name,
        Description: description || '',
        PrimaryMotion: '',
        PrimaryMotionDescription: '',
        MotionHistory: [],
        Members: [{
          uid: decoded.id,
          role: 'Owner',
          vote: 0,
          procon: 0
        }],
        ActiveMeeting: false,
        createdAt: new Date(),
        createdBy: decoded.id
      };

      const result = await db.collection(
        'committees').insertOne(committee);

      // Add committee to user's memberships
      await db.collection('users').updateOne(
        { _id: new ObjectId(decoded.id) },
        { $push: { committee_memberships: result.insertedId.toString() } }
      );

      return res.status(201).json({ 
        success: true, 
        committeeId: result.insertedId,
        committee: { ...committee, _id: result.insertedId }
      });
    }

    // GET /committees - List user's committees
    if (req.method === 'GET' && segments.length === 0) {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const committeeIds = (user.committee_memberships || [])
        .filter(id => ObjectId.isValid(id))
        .map(id => new ObjectId(id));

      const committees = committeeIds.length > 0 
        ? await db.collection('committees').find({ _id: { $in: committeeIds } }).toArray()
        : [];

      return res.status(200).json({ success: true, committees });
    }

    // GET /committees/:id - Get single committee
    if (req.method === 'GET' && segments[0] && !segments[1]) {
      const id = segments[0];
      if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

      const committee = await db.collection('committees').findOne({ _id: new ObjectId(id) });
      if (!committee) return res.status(404).json({ success: false, message: 'Committee not found' });

      // Fetch member details
      const memberIds = (committee.Members || [])
        .filter(m => m.uid && ObjectId.isValid(m.uid))
        .map(m => new ObjectId(m.uid));

      const users = memberIds.length > 0
        ? await db.collection('users').find({ _id: { $in: memberIds } }).toArray()
        : [];

      const userMap = {};
      users.forEach(u => { userMap[u._id.toString()] = u; });

      const membersWithDetails = (committee.Members || []).map(m => ({
        ...m,
        name: userMap[m.uid]?.name || 'Unknown',
        email: userMap[m.uid]?.email || ''
      }));

      return res.status(200).json({ 
        success: true, 
        committee: { ...committee, Members: membersWithDetails }
      });
    }

    // POST /committees/:id/members - Add member to committee
    // Body: { email }
    if (req.method === 'POST' && segments[1] === 'members') {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const committeeId = segments[0];
      if (!ObjectId.isValid(committeeId)) {
        return res.status(400).json({ success: false, message: 'Invalid committee id' });
      }

      const { email, role } = req.body || {};
      if (!email) return res.status(400).json({ success: false, message: 'Email required' });

      // Find user by email
      const user = await db.collection('users').findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: 'User not found with that email' });

      // Check if user already in committee
      const committee = await db.collection('committees').findOne({ _id: new ObjectId(committeeId) });
      if (!committee) return res.status(404).json({ success: false, message: 'Committee not found' });

      const alreadyMember = (committee.Members || []).some(m => m.uid === user._id.toString());
      if (alreadyMember) {
        return res.status(409).json({ success: false, message: 'User is already a member' });
      }

      const newMember = {
        uid: user._id.toString(),
        role: role || 'Member',
        vote: 0,
        procon: 0
      };

      // Add to committee
      await db.collection('committees').updateOne(
        { _id: new ObjectId(committeeId) },
        { $push: { Members: newMember } }
      );

      // Add to user's memberships
      await db.collection('users').updateOne(
        { _id: user._id },
        { $push: { committee_memberships: committeeId } }
      );

      return res.status(200).json({ 
        success: true, 
        member: { ...newMember, name: user.name, email: user.email }
      });
    }

    // PATCH /committees/:id/members/:uid - Update member role
    // Body: { role }
    if (req.method === 'PATCH' && segments[1] === 'members' && segments[2]) {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const committeeId = segments[0];
      const memberUid = segments[2];
      const { role } = req.body || {};

      if (!role) return res.status(400).json({ success: false, message: 'Role required' });

      const committee = await db.collection('committees').findOne({ _id: new ObjectId(committeeId) });
      if (!committee) return res.status(404).json({ success: false, message: 'Committee not found' });

      const updatedMembers = (committee.Members || []).map(m => 
        m.uid === memberUid ? { ...m, role } : m
      );

      await db.collection('committees').updateOne(
        { _id: new ObjectId(committeeId) },
        { $set: { Members: updatedMembers } }
      );

      return res.status(200).json({ success: true, message: 'Role updated' });
    }

    // DELETE /committees/:id/members/:uid - Remove member
    if (req.method === 'DELETE' && segments[1] === 'members' && segments[2]) {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const committeeId = segments[0];
      const memberUid = segments[2];

      // Remove from committee
      await db.collection('committees').updateOne(
        { _id: new ObjectId(committeeId) },
        { $pull: { Members: { uid: memberUid } } }
      );

      // Remove from user's memberships
      if (ObjectId.isValid(memberUid)) {
        await db.collection('users').updateOne(
          { _id: new ObjectId(memberUid) },
          { $pull: { committee_memberships: committeeId } }
        );
      }

      return res.status(200).json({ success: true, message: 'Member removed' });
    }

    // DELETE /committees/:id - Delete committee
    if (req.method === 'DELETE' && segments[0] && !segments[1]) {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const committeeId = segments[0];

      // Remove committee from all users' memberships
      await db.collection('users').updateMany(
        {},
        { $pull: { committee_memberships: committeeId } }
      );

      // Delete committee
      const result = await db.collection('committees').deleteOne({ _id: new ObjectId(committeeId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: 'Committee not found' });
      }

      return res.status(200).json({ success: true, message: 'Committee deleted' });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (err) {
    console.error('Committees function error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

