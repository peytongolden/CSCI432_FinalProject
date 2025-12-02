import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function getDb() {
  try {
    console.log('[LOGIN] Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });

    console.log('[LOGIN] Connecting...');
    await client.connect();
    console.log('[LOGIN] Connection successful');

    const db = client.db('WebProgFinal');
    return db;
  } catch (error) {
    console.error('[LOGIN] MongoDB connection error:', error.message);
    console.error('[LOGIN] Error code:', error.code);
    console.error('[LOGIN] Error type:', error.name);
    throw error;
  }
}

export default async (req, res) => {
  console.log('[LOGIN] Function invoked, method:', req.method);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    console.log('[LOGIN] OPTIONS request, returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('[LOGIN] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[LOGIN] POST request received');
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('[LOGIN] Validation failed - email:', !!email, 'password:', !!password);
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    console.log('[LOGIN] Calling getDb()...');
    const db = await getDb();
    console.log('[LOGIN] Database connection successful');

    console.log('[LOGIN] Finding user:', email);
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('[LOGIN] Comparing password...');
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log('[LOGIN] Password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('[LOGIN] Creating JWT token...');
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

    console.log('[LOGIN] Login successful for:', email);
    return res.status(200).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('[LOGIN] ERROR:', err.message);
    console.error('[LOGIN] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
