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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await getDb();
  const path = req.path.replace('/.netlify/functions/user', '') || '/';
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /user/me - Get current user
    if (req.method === 'GET' && segments[0] === 'me') {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Don't send password hash
      delete user.password_hash;

      return res.status(200).json({ success: true, user });
    }

    // PATCH /user/me - Update current user
    if (req.method === 'PATCH' && segments[0] === 'me') {
      const decoded = verifyToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const updates = req.body || {};
      // Don't allow updating sensitive fields
      delete updates.password_hash;
      delete updates._id;
      delete updates.email; // Email changes should be separate

      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(decoded.id) },
        { $set: updates }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'User not found or no changes' });
      }

      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
      delete user.password_hash;

      return res.status(200).json({ success: true, user });
    }

    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  } catch (err) {
    console.error('User function error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

