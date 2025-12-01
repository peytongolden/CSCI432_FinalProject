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

// Registration endpoint (used by frontend)
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
            password: hashed,
            role: 'Member',
            joinDate: new Date().toISOString(),
            phone: '',
            bio: ''
        };

        const result = await db.collection('users').insertOne(userDoc);
        return res.status(200).json({ success: true, user: { id: result.insertedId, name, email, role: userDoc.role, joinDate: userDoc.joinDate } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET);

        const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, joinDate: user.joinDate, phone: user.phone, bio: user.bio };
        return res.status(200).json({ success: true, token, user: safeUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get current user using token
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
//takes JSON with: { CommitteeName: ObjectId, userID: String }
app.post('api/committee/addmember', (req, res) => {
    const request = req.body;
    let uid;

    if (ObjectId.isValid(request.userID)) {

        db.collection('users')
            .find({email: request.userID})
            .then((result) => {
                uid = result._id
                db.collection('users')
                    .update({email: request.userID}, {$push: request.ObjectId })
            })
            .catch(err => res.status(500).json({error: "Server Error"}))

        const newMember = {
             uid: request.uid,
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