# Testing Setup Guide

## ⚠️ IMPORTANT: Create .env File First

Before testing, you **must** create a `.env` file in the project root with the following content:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://WebProg_db_user:GNyHpWO2uFrlTkwn@kludgecity.ea7xba7.mongodb.net/?appName=KludgeCity

# JWT Secret for authentication
JWT_SECRET=CatBitMe
```

**Steps to create .env file:**

### Windows (PowerShell):
```powershell
# Create the file
New-Item -Path .env -ItemType File -Force

# Then open it in your editor and paste the content above
code .env
# OR
notepad .env
```

### Mac/Linux:
```bash
# Create and edit the file
nano .env
# Paste the content, then press Ctrl+X, Y, Enter to save
```

---

## Local Testing

### 1. Install Dependencies (if not already done)
```bash
npm install
```

### 2. Test with Netlify Dev (Recommended)
This simulates the Netlify Functions environment locally:

```bash
npx netlify dev
```

The app will be available at `http://localhost:8888`

### 3. Alternative: Test with Vite only
```bash
npm run dev
```

Note: This won't run the Netlify Functions, so backend features won't work.

---

## Testing the Meeting Functionality

### Test Scenario 1: Single Device (Basic Flow)

1. **Create an account** or use guest login
2. **Create a meeting** from the lobby
3. **Copy the meeting code** displayed at the top
4. **Create a motion** using Chair Controls button
5. **Cast a vote** (Yes/No/Abstain)
6. **End voting** from Chair Controls
7. Check that the motion appears in Motion History

### Test Scenario 2: Multi-Device (Real-time Sync)

1. **Open two browser windows** (or use incognito + regular)
2. **Window 1:** Create a meeting (you'll be the chair)
3. **Window 2:** Join the meeting using the code
4. **Window 1:** Create a motion
5. **Both Windows:** Wait ~5 seconds - motion should appear in Window 2
6. **Window 2:** Cast a vote
7. **Window 1:** Wait ~5 seconds - vote count should update
8. **Window 1:** End voting
9. **Both Windows:** Motion should move to history

### Test Scenario 3: Vote Changes

1. Cast a vote (e.g., "Yes")
2. Click "Change Vote"
3. Cast a different vote (e.g., "No")
4. Verify the vote count updated correctly (Yes decreased, No increased)

---

## What's Been Fixed

### Backend Integration ✅
- **Motions API** now properly uses Netlify Functions format
- **Vote persistence** - votes are stored in MongoDB
- **Real-time polling** - meeting updates every 5 seconds
- **Vote tracking** - backend stores who voted what

### Issues Your Groupmate Mentioned

> "voting isn't working across different devices"

**Fixed:** The Meeting.jsx now:
- Calls `/api/motions/:motionId/vote` to persist votes
- Polls every 5 seconds to sync vote counts
- Converts backend vote arrays to counts for display

> "you can only see the motion proposed on one screen"

**Fixed:** The polling mechanism now:
- Fetches all motions from the backend
- Updates the motions list when new motions are created
- Syncs motion status changes (voting → completed)

---

## Deployment to Netlify

### Environment Variables on Netlify

Make sure these are set in Netlify dashboard:
1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add:
   - `MONGODB_URI` = `mongodb+srv://WebProg_db_user:GNyHpWO2uFrlTkwn@kludgecity.ea7xba7.mongodb.net/?appName=KludgeCity`
   - `JWT_SECRET` = `CatBitMe`

### Push to netlifyTest Branch

```bash
# Stage your changes
git add .

# Commit
git commit -m "Add motion API integration and real-time sync"

# Switch to netlifyTest branch
git checkout netlifyTest

# Merge your changes
git merge main

# Push to trigger deployment
git push origin netlifyTest
```

Netlify will automatically deploy to: https://csci432group.netlify.app/

---

## Troubleshooting

### "Meeting not found" error
- Check that MONGODB_URI is set correctly in .env (local) or Netlify (production)
- Verify the meeting was created successfully (check Network tab in browser DevTools)

### Votes not syncing
- Check browser console for errors
- Verify polling is working (should see GET requests every 5 seconds in Network tab)
- Ensure both users are in the same meeting (same meetingId in URL)

### Motion not appearing on second device
- Wait at least 5 seconds for polling to sync
- Check that the motion was created successfully (no errors in console)
- Verify the backend is returning motions in the GET /api/meetings/:id response

### Netlify Functions timeout
- Check function logs in Netlify dashboard
- Verify MongoDB connection string is correct
- Ensure database allows connections from Netlify's IP ranges

---

## API Endpoints Being Used

See `API_DOCUMENTATION.md` for full details.

**Key endpoints for meeting functionality:**
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details (polled every 5s)
- `POST /api/meetings/:id/join` - Join meeting
- `POST /api/motions` - Create motion
- `POST /api/motions/:motionId/vote` - Cast/change vote
- `PATCH /api/motions/:motionId` - End voting

---

## Next Steps

After testing works locally:

1. ✅ Verify all features work with multiple browser windows
2. ✅ Push to netlifyTest branch
3. ✅ Test on deployed site (https://csci432group.netlify.app/)
4. 🔄 Consider adding discussion panel functionality
5. 🔄 Add more chair controls (assign floor member, etc.)
6. 🔄 Improve error handling and user feedback

