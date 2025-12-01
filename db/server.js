import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { connectToDb, getDb } from './db.js';
import { ObjectId } from 'mongodb';


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
//routes
//============================================
//
//the collections in MongoDB are users and committees


//routes for user information (/api/user/...)

/*
// test function
app.get('/api/user/allUsers', (req, res) => {
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
*/

//new user
app.post('/api/user/new', (req, res) => {
    const user = req.body

    db.collection('users')
        .insertOne(user)
        .then(result => { res.status(201).json(result)})
        .catch(err => { res.status(500).json({error: "Could not create new user account"}) });
});

//get account info
//takes email for argument, but should probably take ObjectId
app.get('/api/user/:id', (req, res) => {
    let users = [];

    db.collection('users')
        .findOne({ email: req.params.id })
        .then((user) => {
            if (user == null) { 
                res.status(500).json({error:"Could not find user"})
            } else { res.status(200).json(user); }
        })
        .catch(() => {
            console.error(error);
            res.status(500).send("Server Error");
        });
});

//delete account, takes email for argument
app.delete('/api/user/delete/:id', (req, res) => {

    db.collection('users')
        .deleteOne({ email: req.params.id })
        .then(result => {
            if (result.deletedCount == 0) {
                res.status(500).json({error:"Could not delete document"})
            } else { res.status(200).json(result) }
        })
        .catch(err => res.status(500).json({error: "Server Error"}));
})

//app.post update user information
app.patch('/api/user/update/:id', (req, res) => {
    const updates = req.body;

    db.collection('users')
        .updateOne({ email: req.params.id}, {$set: updates})
        .then(result => {
            if (result.modifiedCount == 0) {
                res.status(500).json({error:"Could not modify document"})
            } else { res.status(200).json(result) }
        })
        .catch(err => res.status(500).json({error: "Server Error"}));
})