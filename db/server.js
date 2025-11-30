import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { connectToDb, getDb } from './db.js';


const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

//database connection
let db;

connectToDb((err) => {
    if (!err) {
        app.listen(process.env.PORT, () => {
            console.log('App is listening on port ' + process.env.PORT);
        });
        db = getDb();
    }
})

//============================================
//routes (/api/user/...)
//============================================
//
//the collections in MongoDB are Users and Committees

app.get('/api/user/all', (req, res) => {
    let users = [];

    db.collection('users')
        .find()
        .sort({ name: 1 })
        .forEach(user => users.push(user))
        .then(() => {
            res.status(200).json(users);
        })
        .catch(() => {
            console.error(error);
            res.status(500).send("Server Error");
        });
});