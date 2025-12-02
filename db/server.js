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



// Registration endpoint (used by frontend)
// Input JSON: { 
//      name: String, 
//      email: String, 
//      password: String 
//  }

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
// Input JSON: {
//      email: String,
//      password: String
//  } 

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
// required JSON { <field>: <new value>, <field2> : <new value 2>, ... }
// Do not use this API to modify committee_memberships, use a different API instead

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
/*  {
        "committee": {
            "CommitteeName": String,                
            "PrimaryMotion": "",
            "PrimaryMotionDescription": "",
            "MotionHistory": [],
            "Members": [],                          //Becomes an array of JSON objects
            "ActiveMeeting": false                  //Boolean                 
        },
        "userEmail": String                         //adds the new committee's _id to user's committee_memberships field
    }*/

app.post('/api/committee/new', authenticateToken, async (req, res) => {

    const committee = req.body.committee
    const user = await db.collection('users').findOne({ email: req.body.userEmail })

    db.collection('committees')
        .findOne({ CommitteeName: committee.CommitteeName})
        .then((result) => {
            if (result) { res.status(500).json({error: "Committee name already in use"}) }
            else {
                
                const owner = {
                    uid: user._id.toString(),
                    role: "Owner",
                    vote: 0,
                    procon: 0
                }

                committee.Members.push(owner)

                db.collection('committees')
                    .insertOne(committee)
                    .then((result2) => {
                        console.log(result2.insertedId.toString())
                        db.collection('users').updateOne({email: req.body.userEmail}, {$push: { committee_memberships: result2.insertedId.toString()} })
                            .catch(err => res.status(500).json({error: "Server Error"}))
                        
                        res.status(201).json(result2)
                    })
                    .catch(err => { res.status(500).json({error: "Could not create committee"}) });
            }
        })
})


//get committee information
//id is committee's String version of ObjectId

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


//adds member to committee, adds committee membership to user information
//input JSON: { 
//      CommitteeID: String version of ObjectId,
//      userEmail: String
//  }

app.post('/api/committee/addmember', authenticateToken, async (req, res) => {
    const request = req.body;
    const user = await db.collection('users').findOne({email: request.userEmail})
    //checks that user exists
    if (user) {

        //checks that user is not already in committee
        const committeeCheck = await db.collection('committees').findOne({_id: new ObjectId(request.CommitteeID)})

        let flag

        committeeCheck.Members.forEach(element => {
            if (element.uid == user._id.toString()) { flag = true; }    
        });

        if (flag) {res.status(500).json({error: "User is already in committee"})}
        
        else {
        //adds committee to user membership list
        db.collection('users').updateOne({email: request.userEmail}, {$push: { committee_memberships: request.CommitteeID} })
            .catch(err => res.status(500).json({error: "Server Error"}))

        const newMember = {
                uid: user._id.toString(),
                role: "Member",
                vote: 0,
                procon: 0
            }

            db.collection('committees')
                .updateOne( {_id: new ObjectId(request.CommitteeID)}, { $push: {Members: newMember} })
                .then(result => {
                    res.status(200).json(result)
                })
                .catch(err => res.status(500).json({error: "Server Error"}));
        }

    } else {
        res.status(500).json({error: "User does not exist"})
    }
})


// remove user from committee
// JSON: { 
//      CommitteeID: String version of ObjectId,
//      userEmail: String
//  }

app.post('/api/committee/removemember', authenticateToken, async (req, res) => {
    const request = req.body;
    const user = await db.collection('users').findOne({email: request.userEmail})
    //checks that user exists
    if (user) {

        //checks that user is in committee
        const committeeCheck = await db.collection('committees').findOne({_id: new ObjectId(request.CommitteeID)})

        let flag

        committeeCheck.Members.forEach(element => {
            if (element.uid == user._id.toString()) { flag = true; }    
        });

        if (!flag) {res.status(500).json({error: "User is not in committee"})}
        
        else {
        //removes committee to user membership list
        db.collection('users').updateOne({email: request.userEmail}, {$pull: { committee_memberships: request.CommitteeID} })
            .catch(err => res.status(500).json({error: "Server Error"}))


        let tempArray = await db.collection('committees')
            .findOne( {_id: new ObjectId(request.CommitteeID)})

        console.log(tempArray)
        
        let x = 0
        tempArray.Members.forEach((element) => {
            if (element.uid == user._id.toString()) { tempArray.Members.splice(x, 1); return }
            x++
        })


        db.collection('committees')
            .updateOne({_id: new ObjectId(request.CommitteeID)}, { $set: { Members: tempArray.Members }})
            .then((result) => { res.status(200).json(result)})
        }

    } else {
        res.status(500).json({error: "User does not exist"})
    }
})


// Changes committee role of target user.
// input JSON: {
//      CommitteeID: String version of ObjectId,
//      userEmail: String,
//      newRole:string
//  } 

app.post('/api/committee/updateRole/', authenticateToken, async (req, res) => {
    const request = req.body
    const user = await db.collection('users').findOne({email: request.userEmail})

    if (ObjectId.isValid(request.CommitteeID)) {
        
        let tempCommittees = await db.collection('committees').findOne({_id: new ObjectId(request.CommitteeID)})
        let x = 0
        
        tempCommittees.Members.forEach((element) => {
            if (element.uid == user._id.toString()) { element.role = request.newRole; return; }
            x++
        })
        
        console.log(tempCommittees)

        db.collection('committees')
            .updateOne( {_id: new ObjectId(request.CommitteeID)}, { $set: {Members: tempCommittees.Members}} )
            .then(result => {
                res.status(200).json(result)
            })
            .catch(err => res.status(500).json({error: "Server Error"}));
    }
})

// Patch method for updating motions and setting the meeting
// id is ObjectId of committee
// Accept committee updates by either route param or a CommitteeID in the body
function handleUpdateCommitteeInfo(req, res) {
    const updates = req.body || {}
    const providedId = req.body?.CommitteeID || req.params?.id

    if (!providedId) return res.status(400).json({ error: 'CommitteeID is required (body.CommitteeID or URL param)' })

    if (!ObjectId.isValid(providedId)) return res.status(400).json({ error: 'Invalid Committee ID' })

    const idObj = new ObjectId(providedId)
    db.collection('committees')
        .updateOne({ _id: idObj }, { $set: updates })
        .then(result => res.status(200).json(result))
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: 'Server Error' })
        })
}

app.patch('/api/committee/updateCommitteeInfo/:id', authenticateToken, handleUpdateCommitteeInfo)
app.patch('/api/committee/updateCommitteeInfo', authenticateToken, handleUpdateCommitteeInfo)

// ----------------------------
// Meeting endpoints
// ----------------------------

function generateMeetingCode(len = 6) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // avoid ambiguous ones
    let out = ''
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
}

// Create a new meeting
// Body: { name, datetime, description, committeeIds: [id, ...] }
app.post('/api/meetings', authenticateToken, async (req, res) => {
    const { name, datetime, description, committeeIds } = req.body || {}
    if (!name) return res.status(400).json({ success: false, message: 'Meeting name required' })

    try {
        const meeting = {
            name,
            description: description || '',
            datetime: datetime || null,
            committeeIds: Array.isArray(committeeIds) ? committeeIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id) : [],
            createdBy: req.userId || null,
            code: generateMeetingCode(),
            active: true,
            participants: [],
            createdAt: new Date()
        }

        const result = await db.collection('meetings').insertOne(meeting)

        // Optionally mark referenced committees as having an active meeting
        if (Array.isArray(meeting.committeeIds) && meeting.committeeIds.length) {
            for (const cid of meeting.committeeIds) {
                try {
                    await db.collection('committees')
                        .updateOne({ _id: new ObjectId(cid) }, { $set: { ActiveMeeting: result.insertedId.toString() } })
                } catch (e) {
                    // ignore failed updates for committees
                    console.warn('Failed to update committee ActiveMeeting', cid, e)
                }
            }
        }

        return res.status(201).json({ success: true, meetingId: result.insertedId, code: meeting.code })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ success: false, message: 'Server error' })
    }
})

// Fetch meeting by id
app.get('/api/meetings/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid id' })
        const meet = await db.collection('meetings').findOne({ _id: new ObjectId(req.params.id) })
        if (!meet) return res.status(404).json({ success: false, message: 'Meeting not found' })
        return res.status(200).json({ success: true, meeting: meet })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ success: false, message: 'Server error' })
    }
})

// Fetch by code
app.get('/api/meetings/code/:code', async (req, res) => {
    try {
        const code = req.params.code
        if (!code) return res.status(400).json({ success: false, message: 'Code required' })
        const meet = await db.collection('meetings').findOne({ code: code, active: true })
        if (!meet) return res.status(404).json({ success: false, message: 'Meeting not found' })
        return res.status(200).json({ success: true, meeting: meet })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ success: false, message: 'Server error' })
    }
})

// Join meeting
// Body: { displayName }
app.post('/api/meetings/:id/join', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid meeting id' })
        const meetingId = new ObjectId(req.params.id)
        const { displayName } = req.body || {}
        if (!displayName) return res.status(400).json({ success: false, message: 'displayName required' })

        const participant = {
            _id: new ObjectId(),
            name: displayName,
            joinedAt: new Date(),
            uid: null
        }

        const result = await db.collection('meetings').updateOne({ _id: meetingId }, { $push: { participants: participant } })
        if (result.modifiedCount === 0) return res.status(500).json({ success: false, message: 'Could not add participant' })

        return res.status(200).json({ success: true, participantId: participant._id, meetingId })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ success: false, message: 'Server error' })
    }
})


//delete committee, takes string version of ObjectId for parameter
//also iterates through user information to delete their memberships

app.delete('/api/committee/delete/:id', authenticateToken, (req, res) => {

    if (ObjectId.isValid(req.params.id)) {
        db.collection('users')
            .updateMany({}, {$pull: {committee_memberships: { $in: [ req.params.id ]}}})
            .catch(err => res.status(500).json({error: "Server Error"}));

        db.collection('committees')
            .deleteOne({ _id: new ObjectId(req.params.id) })
            .then(result => {
                console.log(result)
                if (result.deletedCount == 0) {
                    res.status(500).json({error:"Could not delete document"})
                } else { res.status(200).json(result) }
            })
            .catch(err => res.status(500).json({error: "Server Error"}));
    }
})


// update motion history with current motion, then clears fields
// input JSON: {
//      CommitteeID: String version of ObjectId,
//      newMotion: {
//          DateTime: String,       //ISO-8601 timestamp
//          MotionName: String,
//          MotionDescription: String,
//          MotionPros: [String],
//          MotionCons: [string,
//          VotesFor: [String],
//          VotesAgainst [String],
//      }
//  ""

app.post('/api/committee/updatemotionhistory', authenticateToken, async (req, res) => {

})

//TODO VetoMotion, Vote (anonymous?), Second, SecondMotion, 