import { MongoClient } from 'mongodb';

let dbConnection

export function connectToDb(cb) {
    MongoClient.connect(process.env.MONGODB_URI)
        .then((client) => {
            dbConnection = client.db('WebProgFinal');
            console.log('Connected to MongoDB')
            return cb();
        })
        .catch(err => {
            console.log('MongoDB connection error:', err);
            return cb(err);
        });
}

export function getDb() {
    return dbConnection;
}
