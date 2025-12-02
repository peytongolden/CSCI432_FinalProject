import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
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

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  try {
    const db = await getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Account already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userDoc = {
      name,
      email,
      password_hash: hashed,
      committee_memberships: [],
      phone_number: '',
      short_bio: '',
      address: ''
    };

    const result = await db.collection('users').insertOne(userDoc);
    return res.status(200).json({ success: true, user: { id: result.insertedId, name, email } });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
