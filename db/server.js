import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import { connectToDb, getDb } from './db.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    } else {
        console.error('Failed to connect to DB, server not started');
    }
})

// helper: verify JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
}

//============================================
//routes
//============================================
//
//the collections in MongoDB are users and committees



//routes for user information (/api/user/...)

//new user
//deprecated already?
/*
app.post('/api/user/new', (req, res) => {
    const user = req.body

    db.collection('users')
        .findOne({ email: req.body.email })
        .then((result) => {
            if (!result) {
                db.collection('users')
                    .insertOne(user)
                    .then(result => { res.status(201).json(result)})
            } else { 
                res.status(500).json({error: "Account already exists"})
            }
        })
        .catch(err => { res.status(500).json({error: "Could not create new user account"}) });
});
*/

// Registration endpoint (used by frontend)
// Input JSON: { name: String, email: String, password: String }
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    try {
        const existing = await db.collection('users').findOne({ email });
        if (existing) return res.status(409).json({ success: false, message: 'Account already exists' });

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

        const result = await db.collection('users').insertOne(userDoc);
        return res.status(200).json({ success: true, user: { id: result.insertedId, name, email }});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login endpoint
// Input JSON: { email:String, password:String } 
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

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
});

// Get current user using token
// No arguments
app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.userId) });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        delete user.password;
        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

//get account info
//deprecated
/*
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
*/

// delete account
// id parameter is user's email
app.delete('/api/user/delete/:id', authenticateToken, (req, res) => {

    db.collection('users')
        .deleteOne({ email: req.params.id })
        .then(result => {
            if (result.deletedCount == 0) {
                res.status(500).json({error:"Could not delete document"})
            } else { res.status(200).json(result) }
        })
        .catch(err => res.status(500).json({error: "Server Error"}));
})

// update user information
// id is user email
// required JSON { <field.: <new value> }
app.patch('/api/user/update/:id', authenticateToken, (req, res) => {
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



//=================================================================================================================================================
// routes for committee info (/api/committee/...)

//create new committee
//Required JSON:
/*
    {
        "committee": {
            "CommitteeName": String,                
            "PrimaryMotion": "",
            "PrimaryMotionDescription": "",
            "MotionHistory": [],
            "Members": [],                          //Becomes an array of JSON objects
            "ActiveMeeting": false                  //Boolean                 
        },
        "userID": ObjectId of user                  //adds the new committee's _id to user's committee_memberships field
    }
*/
app.post('/api/committee/new', authenticateToken, (req, res) => {

    const committee = req.body.committee
    const user = req.body.userID

    db.collection('committees')
        .findOne({ CommitteeName: committee.CommitteeName})
        .then((result) => {
            if (result) { res.status(500).json({error: "Committee name already in use"}) }

            else {

                const owner = {
                    uid: user,
                    role: "Owner",
                    vote: 0,
                    procon: 0
                }

                committee.Members.push(owner)

                db.collection('committees')
                    .insertOne(committee)
                    .then((result2) => {
                        db.collection('users')
                            .updateOne({ _id: new ObjectId(user) }, { $push: { committee_memberships: result2.insertedId }});
                        
                        res.status(201).json(result2)
                    })
                    .catch(err => { res.status(500).json({error: "Could not create committee"}) });

               
            }
        })
})

//get committee information
//id is committee's ObjectId
app.get('/api/committee/:id', authenticateToken, (req, res) => {
    db.collection('committees')
        .findOne({ _id: new ObjectId(req.params.id) })
        .then((committee) => {
            if (!committee) { 
                res.status(500).json({error:"Committee Lookup Error"})
            } else { res.status(200).json(committee); }
        })
        .catch(() => {
            console.error(error);
            res.status(500).json({error:"Server Error"});
        });
})




//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WOE! UNTESTED PAST HERE, tread carefully!
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!





//adds member to committee, adds committee membership to user information
//takes JSON with: { CommitteeID: ObjectId, userEmail: String } userID
app.post('/api/committee/addmember', (req, res) => {
    const request = req.body;
    let user = db.collection('users').find({email: request.userEmail}).catch(err => res.status(500).json({error: "Server Error"}))

    //checks that user exists
    if (user) {

        //checks that user is not already in committee
        const committeeCheck = db.collection('committees').findOne( {_id: ObjectId(request.body.CommitteeID)})
        if (() => {
            committeeCheck.Members.array.forEach(element => {
                if (ObjectId(element.uid) == user._id) { return true; }
            });
        }) {
            //adds committee to user membership list
            db.collection('users').update({email: request.userEmail}, {$push: { committee_memberships: request.CommitteeID} })
                .catch(err => res.status(500).json({error: "Server Error"}))

            const newMember = {
                uid: request.uid,
                role: "Member",
                vote: 0,
                procon: 0
            }

            db.collection('committees')
                .update( {CommitteeName: request.CommitteeName}, { $push: {Members: newMember} })
                .then(result => {
                    res.status(200).json(result)
                })
                .catch(err => res.status(500).json({error: "Server Error"}));
        } else {
            res.status(500).json({error: "User is already in committee"})
        }
    } else {
        res.status(500).json({error: "User does not exist"})
    }
})

//remove user from committee
//JSON: { CommitteeID: ObjectId
app.post('/api/committee/removemember', (req, res) => {
    const request = req.body;
    let user = db.collection('users').find({email: request.userEmail}).catch(err => res.status(500).json({error: "Server Error"}))

    //checks that user exists
    if (user) {

        //checks that user is not already in committee
        const committeeCheck = db.collection('committees').findOne( {_id: ObjectId(request.body.CommitteeID)})
        if (() => {
            committeeCheck.Members.array.forEach(element => {
                if (ObjectId(element.uid) == user._id) { return true; }
            });
        }) {
            //adds committee to user membership list
            db.collection('users').update({email: request.userEmail}, {$pull: { committee_memberships: request.CommitteeID} })
                .catch(err => res.status(500).json({error: "Server Error"}))

            const newMember = {
                uid: request.uid,
                role: "Member",
                vote: 0,
                procon: 0
            }

            db.collection('committees')
                .update( {CommitteeName: request.CommitteeName}, { $pull: {Members: newMember} })
                .then(result => {
                    res.status(200).json(result)
                })
                .catch(err => res.status(500).json({error: "Server Error"}));
        } else {
            res.status(500).json({error: "User is already in committee"})
        }
    } else {
        res.status(500).json({error: "User does not exist"})
    }
})

//update committee information. Single function with multiple uses
//JSON: { CommitteeID: ObjectId, UserID: ObjectId, newRole:string } 
app.post('/api/committee/updateRole/', (req, res) => {
    const request = req.body

    if (ObjectId.isValid(request.CommitteeID)) {
        
        db.collection('committees')
            //.findOne( {_id: ObjectId(request.CommitteeID) })
            .updateOne( {_id: ObjectId(request.CommitteeID), "Members.uid": ObjectId(request.UserID)}, { $set: {"Members.$.role": request.newRole}} )
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => res.status(500).json({error: "Server Error"}));
    }
})

//patch method for updating motions and setting the meeting
//id is ObjectId of committee
app.patch('/api/committee/updateCommitteeInfo/:id', (req, res) => {
    const updates = req.body

    if (ObjectId.isValid(req.params.id)) {
        db.collection('committees')
            //.findOne( {_id: ObjectId(request.CommitteeID) })
            .updateOne( {_id: ObjectId(request.CommitteeID)}, { $set: updates} )
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => res.status(500).json({error: "Server Error"}));
    } else {
        res.status(500).json({error: "Invalid Committee ID"})
    }
})

//delete committee, takes ObjectId for parameter
//also iterates through user information to delete their memberships
app.delete('/api/committee/delete/:id', (req, res) => {

    if (ObjectId.isValid(req.params.id)) {
        db.collection('users')
            .updateMany({committee_memberships: { $in: ObjectId(req.params.id)}}, {$pull: {committee_memberships: req.params.id}})
            .catch(err => res.status(500).json({error: "Server Error"}));

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


//TODO UpdateMotionHistory, VetoMotion, Vote, Second, CallForAmendment, SecondMotion