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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

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

    return res.status(200).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
