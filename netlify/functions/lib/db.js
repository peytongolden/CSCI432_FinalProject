import { MongoClient } from 'mongodb';

let dbConnection;

export async function getDb() {
  if (!dbConnection) {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    dbConnection = client.db('WebProgFinal');
  }
  return dbConnection;
}
