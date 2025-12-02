import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function getDb() {
  try {
    console.log('[REGISTER] Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });

    console.log('[REGISTER] Connecting...');
    await client.connect();
    console.log('[REGISTER] Connection successful');

    const db = client.db('WebProgFinal');
    return db;
  } catch (error) {
    console.error('[REGISTER] MongoDB connection error:', error.message);
    console.error('[REGISTER] Error code:', error.code);
    console.error('[REGISTER] Error type:', error.name);
    throw error;
  }
}

export default async (req, res) => {
  console.log('[REGISTER] Function invoked, method:', req.method);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    console.log('[REGISTER] OPTIONS request, returning 200');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('[REGISTER] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[REGISTER] POST request received');
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    console.log('[REGISTER] Validation failed - name:', !!name, 'email:', !!email, 'password:', !!password);
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  try {
    console.log('[REGISTER] Calling getDb()...');
    const db = await getDb();
    console.log('[REGISTER] Database connection successful');

    console.log('[REGISTER] Checking for existing user:', email);
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      console.log('[REGISTER] User already exists');
      return res.status(409).json({ success: false, message: 'Account already exists' });
    }

    console.log('[REGISTER] Hashing password...');
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

    console.log('[REGISTER] Inserting user...');
    const result = await db.collection('users').insertOne(userDoc);
    console.log('[REGISTER] User created successfully:', result.insertedId);
    
    return res.status(200).json({ success: true, user: { id: result.insertedId, name, email } });
  } catch (err) {
    console.error('[REGISTER] ERROR:', err.message);
    console.error('[REGISTER] Stack:', err.stack);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};
