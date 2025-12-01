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

//new user
app.post('/api/user/new', (req, res) => {
    const user = req.body

    db.collection('users')
        .findOne({ email: req.body.email})
        .then((result) => {
            if (result.error == 'Could not find user') {
                db.collection('users')
                    .insertOne(user)
                    .then(result => { res.status(201).json(result)})
            } else { 
                res.status(500).json({error: "Account already exists"})
            }
        })
        .catch(err => { res.status(500).json({error: "Could not create new user account"}) });
});

//get account info
//takes email for argument, but should probably take ObjectId
app.get('/api/user/:id', (req, res) => {

    db.collection('users')
        .findOne({ email: req.params.id })
        .then((user) => {
            if (user == null) { 
                res.status(500).json({error:"Could not find user"})
            } else { res.status(200).json(user); }
        })
        .catch(() => {
            console.error(error);
            res.status(500).json({error:"Server Error"});
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



// routes for committee info (/api/committee/...)

//create new committee
app.post('api/committee/new', (req, res) => {
    
    const committee = req.body

    db.collection('committees')
        .findOne({ CommitteeName: req.body.CommitteeName})
        .then((result) => {
            if (result.error == 'Committee Lookup Error') {
                db.collection('committees')
                    .insertOne(committee)
                    .then(result => { res.status(201).json(result)})
            } else { 
                res.status(500).json({error: "Committee name already in use"})
            }
        })
        .catch(err => { res.status(500).json({error: "Could not create committee"}) });
})

//get committee information
app.get('api/committee/:id', (req, res) => {
    db.collection('committees')
        .findOne({ CommitteeName: req.params.id })
        .then((committee) => {
            if (committee == null) { 
                res.status(500).json({error:"Committee Lookup Error"})
            } else { res.status(200).json(user); }
        })
        .catch(() => {
            console.error(error);
            res.status(500).json({error:"Server Error"});
        });
})

//adds member to committee, adds committee membership to user information
//takes JSON with: { CommitteeName: String, userID: ObjectId }
app.post('api/committee/addmember', (req, res) => {
    const request = req.body;

    if (ObjectId.isValid(request.userID)) {

        const newMember = {
             uid: request.userID,
             role: "Member",
             vote: 0,
             procon: 0
        }

        db.collection('committees')
            .update( {CommitteeName: request.CommitteeName}, { $push: newMember })
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => res.status(500).json({error: "Server Error"}));
    }
})

//delete committee, takes email for parameter
//also iterates through user information to delete their memberships
app.delete('/api/committee/delete/:id', (req, res) => {

    if (ObjectId.isValid(req.params.id)) {
        db.collection('users')
            .updateMany({committee_memberships: req.params.id}, {$pull: {committee_memberships: req.params.id}})

        db.collection('committees')
            .deleteOne({ CommitteeName: req.params.id })
            .then(result => {
                if (result.deletedCount == 0) {
                    res.status(500).json({error:"Could not delete document"})
                } else { res.status(200).json(result) }
            })
            .catch(err => res.status(500).json({error: "Server Error"}));
    }
})