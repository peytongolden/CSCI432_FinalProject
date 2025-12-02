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

  console.log('Register function called');
  console.log('Request body:', req.body);

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    console.log('Missing fields - name:', !!name, 'email:', !!email, 'password:', !!password);
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  try {
    console.log('Connecting to database...');
    const db = await getDb();
    console.log('Database connected successfully');

    console.log('Checking for existing user with email:', email);
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      console.log('User already exists');
      return res.status(409).json({ success: false, message: 'Account already exists' });
    }

    console.log('Hashing password...');
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

    console.log('Inserting user into database...');
    const result = await db.collection('users').insertOne(userDoc);
    console.log('User created successfully with ID:', result.insertedId);
    return res.status(200).json({ success: true, user: { id: result.insertedId, name, email } });
  } catch (err) {
    console.error('Registration error:', err.message);
    console.error('Full error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
