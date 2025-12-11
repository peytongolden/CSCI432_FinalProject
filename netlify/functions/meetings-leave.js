import { MongoClient, ObjectId } from 'mongodb';

let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  await client.connect();
  cachedDb = client.db('WebProgFinal');
  return cachedDb;
}

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Extract meeting ID from path: /api/meetings/:id/leave
    const pathParts = event.path.split('/');
    const leaveIndex = pathParts.indexOf('leave');
    const meetingId = leaveIndex > 0 ? pathParts[leaveIndex - 1] : null;
    if (!meetingId || !ObjectId.isValid(meetingId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid meeting ID' }) };
    }

    const { participantId, uid } = JSON.parse(event.body || '{}');
    if (!participantId && !uid) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'participantId or uid required' }) };
    }

    const db = await getDb();

    // Build pull filter that supports ObjectId _id or plain uid
    const pullQuery = participantId && ObjectId.isValid(participantId)
      ? { _id: new ObjectId(participantId) }
      : (participantId ? { _id: participantId } : { uid });

    const result = await db.collection('meetings').updateOne(
      { _id: new ObjectId(meetingId) },
      { $pull: { participants: pullQuery } }
    );

    if (result.modifiedCount === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Participant not found or already removed' }) };
    }

    // If the removed participant was presiding participant, clear it
    const maybeFix = await db.collection('meetings').findOne({ _id: new ObjectId(meetingId) });
    if (maybeFix && maybeFix.presidingParticipantId) {
      const stillHasChair = Array.isArray(maybeFix.participants) && maybeFix.participants.some(p => String(p._id || p._id?.$oid) === String(maybeFix.presidingParticipantId) || String(p.uid) === String(maybeFix.presidingParticipantId));
      if (!stillHasChair) {
        await db.collection('meetings').updateOne({ _id: new ObjectId(meetingId) }, { $set: { presidingParticipantId: null } });
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[MEETINGS-LEAVE] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Server error: ' + err.message }) };
  }
}
