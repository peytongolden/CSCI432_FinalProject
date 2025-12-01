import { MongoClient } from 'mongodb';

let dbConnection

export function connectToDb(cb) {
    MongoClient.connect(process.env.MONGODB_URI)
        .then((client) => {
            dbConnection = client.db('WebProgFinal');
            return cb();
        })
        .catch(err => {
            console.log(err);
            return cb(err);
        });
}

export function getDb() {
    return dbConnection;
}

