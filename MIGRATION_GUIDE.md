# Migration Guide: HTML to React

This document explains the conversion from the original HTML-based project to the new React application.

## What Changed?

### Project Structure

**Before (HTML-based):**
```
HTML Pages/
├── Login/
├── User Registration/
├── Account Details/
├── CreateJoinMeeting/
└── Meeting/
```

**After (React-based):**
```
src/
├── pages/
│   ├── Login.jsx
│   ├── Registration.jsx
│   ├── AccountDetails.jsx
│   ├── CreateJoinMeeting.jsx
│   └── Meeting.jsx
├── components/
│   └── [reusable components]
└── App.jsx (routing)
```

## Key Improvements

### 1. Meeting Page (Your Contribution)

**Enhanced Features:**
- ✅ **State Management**: Proper React state hooks for all data
- ✅ **Component Architecture**: Split into modular, reusable components:
  - `MembersList` - Display committee members and votes
  - `CurrentMotion` - Show current motion details
  - `VotingButtons` - Handle voting interface
  - `ControlsModal` - Chair controls
  - `NewMotionModal` - Create new motions
  - `MotionHistory` - View past motions
  - `VoteConfirmation` - Toast notifications

- ✅ **New Functionality**:
  - Create multiple motions in a session
  - Motion history tracking
  - Better vote result calculations
  - Visual indicators for pending votes
  - Animated transitions
  - Navigation between pages

### 2. Navigation

All pages now have consistent navigation via the `Navigation` component:
- Easy access to Lobby, Meeting, Account, and Logout
- Active page highlighting
- Responsive design

### 3. Routing

Changed from multi-page HTML to Single Page Application (SPA):
- `/login` - Login page
- `/register` - Registration
- `/account` - Account details
- `/lobby` - Create/join meeting
- `/meeting` - Main meeting page

## Running the Application

### Development Mode
```bash
npm run dev
```
Opens at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## Code Comparison Examples

### Before (Vanilla JS):
```javascript
function castVote(vote) {
    data.currentUser.vote = vote
    data.currentMotion.votes[vote]++
    renderPage()
}
```

### After (React):
```javascript
const castVote = (vote) => {
    setCurrentUser(prev => ({...prev, vote, hasVoted: true}))
    setMotions(prevMotions =>
        prevMotions.map(motion =>
            motion.id === currentMotionId
                ? {...motion, votes: {...motion.votes, [vote]: motion.votes[vote] + 1}}
                : motion
        )
    )
}
```

## Component Props Pattern

React components use props for communication:

```javascript
<CurrentMotion
    motion={currentMotion}
    currentUser={currentUser}
    onCastVote={castVote}
    onChangeVote={changeVote}
/>
```

## State Management

All meeting data is now managed through React hooks:
- `useState` - For component state
- `useEffect` - For side effects (like resetting votes on motion change)
- `useNavigate` - For programmatic navigation

## Styling Approach

- CSS files remain largely the same
- Each component has its own CSS file
- Global styles in `src/index.css`
- Color variables preserved from original design

## Testing the Application

1. **Login Flow**: 
   - Try login form validation
   - Test "Guest Sign In" button

2. **Meeting Page**:
   - Cast votes
   - Change votes
   - Open chair controls (⚙️)
   - Create new motion
   - End voting
   - View motion history

3. **Navigation**:
   - Use navigation links
   - Check active page highlighting

## Future Integration Points

For team members adding features:

### Adding a New Page
1. Create component in `src/pages/YourPage.jsx`
2. Add route in `src/App.jsx`:
```javascript
<Route path="/your-path" element={<YourPage />} />
```

### Adding Backend Integration
Replace mock data with API calls:
```javascript
const response = await fetch('/api/endpoint')
const data = await response.json()
```

### Adding Real-time Updates
Consider using WebSockets:
```javascript
import { useEffect } from 'react'

useEffect(() => {
    const ws = new WebSocket('ws://your-server')
    ws.onmessage = (event) => {
        // Update state with real-time data
    }
    return () => ws.close()
}, [])
```

## Common React Patterns Used

### Conditional Rendering
```javascript
{completedMotions.length > 0 && (
    <MotionHistory motions={completedMotions} />
)}
```

### List Rendering
```javascript
{members.map(member => (
    <div key={member.id}>{member.name}</div>
))}
```

### Event Handling
```javascript
<button onClick={() => castVote('yes')}>Vote Yes</button>
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or use a different port
vite --port 3001
```

### Module Not Found
```bash
npm install
```

### Linting Errors
```bash
npm run build
```

## Questions?

- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- React Router: https://reactrouter.com

## Next Steps

1. Review the new code structure
2. Test all features
3. Familiarize yourself with React patterns
4. Plan any additional features
5. Set up backend integration (if needed)

Remember: The Meeting page functionality is preserved and enhanced. All your original voting logic works the same, just with better state management and more features!

