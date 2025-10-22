# Quick Start Guide

## Start Development Server
```bash
npm run dev
```
Then open http://localhost:3000

## Project Structure Overview

```
CSCI432_FinalProject/
├── src/
│   ├── pages/           # Main pages
│   ├── components/      # Reusable components
│   ├── App.jsx         # Router setup
│   └── main.jsx        # Entry point
├── index.html          # HTML entry
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## Quick Navigation

- **Login**: `/login` - Entry point
- **Lobby**: `/lobby` - Create/join meetings
- **Meeting**: `/meeting` - Your enhanced voting page
- **Account**: `/account` - User profile

## Meeting Page Features (Your Contribution)

### For All Members:
- **Vote**: Click ✓ (Yes), ✗ (No), or — (Abstain)
- **Change Vote**: Click "Change Vote" before voting ends
- **View Members**: See all members and their votes in real-time
- **View Results**: Live vote tallies displayed below motion

### For Chair (Presiding Officer):
- **Controls**: Click ⚙️ (gear icon) in bottom-right
- **Create Motion**: Fill out title and description
- **End Voting**: Close the vote and see results
- **View Results**: See detailed outcome (Passed/Failed/Tied)

## Key Components

### Meeting.jsx (Main Page)
- Manages all state (members, motions, votes)
- Handles vote logic
- Controls motion flow

### MembersList.jsx
- Displays Presiding Officer
- Shows Floor Member
- Lists all committee members
- Shows vote indicators for each member

### CurrentMotion.jsx
- Displays motion title and description
- Shows voting status
- Includes vote tally
- Embeds voting buttons

### NewMotionModal.jsx
- Form for creating new motions
- Validates title and description
- Creates motion and starts voting

### MotionHistory.jsx
- Shows completed motions
- Displays results (Passed/Failed/Tied)
- Click to view details

## Vote Indicators

- ✓ Green = Yes vote
- ✗ Orange = No vote  
- — Yellow = Abstain
- ○ Gray = Not voted yet

## Navigation

Use the sidebar navigation (desktop) or top navigation (mobile):
- 🏠 Lobby
- 📋 Meeting
- 👤 Account
- 🚪 Logout

## Testing Checklist

- [ ] Login as guest
- [ ] Navigate to meeting
- [ ] Cast a vote
- [ ] Change your vote
- [ ] Open chair controls
- [ ] Create a new motion
- [ ] End voting
- [ ] View motion history
- [ ] Check member vote displays
- [ ] Test responsive design (resize browser)

## Color Scheme

Your original earth-tone palette is preserved:
- Dark Moss Green: #606c38
- Pakistan Green: #283618
- Cornsilk: #fefae0
- Earth Yellow: #dda15e
- Tiger's Eye: #bc6c25

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Folder Contents

### src/pages/
- `Login.jsx` - Login page
- `Registration.jsx` - User registration
- `AccountDetails.jsx` - Account profile
- `CreateJoinMeeting.jsx` - Lobby page
- `Meeting.jsx` - ⭐ **Your main contribution**

### src/components/
- `MembersList.jsx` - Member display
- `CurrentMotion.jsx` - Motion display
- `VotingButtons.jsx` - Vote interface
- `ControlsModal.jsx` - Chair controls
- `NewMotionModal.jsx` - Create motion form
- `MotionHistory.jsx` - Past motions
- `VoteConfirmation.jsx` - Vote toast
- `Navigation.jsx` - App navigation

## Next Steps

1. ✅ Run `npm run dev`
2. ✅ Test all features
3. ✅ Review code structure
4. 🔄 Add backend integration (if needed)
5. 🔄 Implement WebSocket for real-time updates
6. 🔄 Add authentication
7. 🔄 Deploy to production

## Need Help?

- See `README.md` for full documentation
- See `MIGRATION_GUIDE.md` for detailed changes
- Check React docs: https://react.dev
- Check Vite docs: https://vitejs.dev

---

**Your Meeting page is now a powerful, modern React application with enhanced functionality!** 🎉

