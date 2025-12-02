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

  console.log('Login function called');
  console.log('Request body:', req.body);

  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Missing fields - email:', !!email, 'password:', !!password);
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    console.log('Connecting to database...');
    const db = await getDb();
    console.log('Database connected successfully');

    console.log('Finding user with email:', email);
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Comparing password...');
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Creating JWT token...');
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET);

    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      committee_memberships: user.committee_memberships,
      phone_number: user.phone_number,
      short_bio: user.short_bio,
      address: user.address
    };

    console.log('Login successful for user:', email);
    return res.status(200).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    console.error('Full error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
