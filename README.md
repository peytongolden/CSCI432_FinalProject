# Robert's Rules of Order Voting Application

A modern full-stack web application for conducting formal committee meetings following Robert's Rules of Order, with real-time voting capabilities and comprehensive motion management.

### LINK TO WEBSITE:
https://csci432group.netlify.app/

### VIDEO DEMO:
[Demo Video](https://youtu.be/-pXhOnbP_fE)

## 🎯 Features

### Meeting Management
- **Create & Join Meetings**: Generate unique meeting codes for participants to join
- **Real-Time Updates**: 5-second polling keeps all participants synchronized
- **Live Voting Sessions**: Conduct votes with instant updates across all devices
- **Motion History**: Complete record of all motions with results and summaries
- **Discussion Panel**: Pro/Con/Neutral comments on active motions

### Motion Types & Voting
- **Main Motions**: Standard decisions (simple majority >50%)
- **Procedural Motions**: Rule changes (2/3 supermajority ≥67%)
- **Amendments**: Modify existing motions
- **Postpone Motions**: Delay decisions
- **Special Motions**: Critical decisions (unanimous 100%)
- **Overturn Previous Decisions**: Reverse past motions (2/3 supermajority)

### Voting Features
- **Three Vote Options**: Yes, No, or Abstain
- **Vote Changes**: Members can change votes before voting closes
- **Anonymous Voting**: Optional privacy for sensitive topics
- **Threshold-Based Results**: Automatic pass/fail calculation based on motion type
- **Live Vote Tallies**: Real-time counting with visual indicators

### User Roles
- **Presiding Officer (Chair)**: Controls meeting flow, creates motions, ends voting, assigns roles
- **Regular Members**: Vote on motions, participate in discussions
- **Observer** (future): Read-only access

### Chair Controls
- Create motions with type selection
- End voting and record decision summaries
- Document pros/cons for each decision
- Assign presiding officer role to other members
- View detailed vote results

## Website Walkthrough in Screenshots

### Sign in Page
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrLogin.png "Login Screen")

### Home Page
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrHome.png "Home Page")

### Account Details
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrAccountDetails1.png "Account Details 1")
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrAccountDetails2.png "Account Details 2")

### Create Meeting
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrNewMeeting.png "Create Meeting Page")

### Join Meeting
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrJoinMeeting.png "Join Meeting Page")
(Screenshot of Join Meeting Page with committee memberships populated and meeting join information populated)

### Meeting Page
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrMeeting1.png "Meeting Page 1")
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrNewMotion.png "New Motion Pag")
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrEndVoting.png "End Voting and Record Summary Screen")
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrChairControls.png "Chair Controls")
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrMeeting2.png "Meeting Page 2")
(Screenshot of meeting page from chair's perspective. Committee Members populated, Main motion in place, Vote tally shown, discussion populated, and Motion History exists with one or two completed motions)
(Screenshot of chair controls)
(Screenshot of end voting and record summaryt screen)

### Help Pages
![alt text](https://github.com/peytongolden/CSCI432_FinalProject/blob/netlifyTest/readme_pics/ronrhelp.png "Help Pages")
(screeshot of the help pages, after they've been touched up)

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server  
- **React Router** - Client-side routing
- **CSS3** - Custom styling with earth-tone palette

### Backend
- **Netlify Functions** - Serverless backend (Node.js)
- **MongoDB Atlas** - Database for meetings, motions, users
- **JWT** - Authentication tokens

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (free tier)
- Netlify CLI (for local development)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd CSCI432_FinalProject
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Copy the template and add your credentials:
```powershell
# Windows (PowerShell)
Copy-Item create-env.ps1.template create-env.ps1
# Edit create-env.ps1 with your MongoDB URI and JWT secret
.\create-env.ps1
```

Or create `.env` file manually:
```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

**For Team Members:** Contact your teammate for the actual MongoDB credentials.

4. **Start the development server:**
```bash
npx netlify dev
```

5. **Open your browser to:** `http://localhost:8888`

⚠️ **Important**: Use `http://localhost:8888` (Netlify Dev) NOT `http://localhost:5173` (Vite only)

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Deploying to Netlify

1. Push to the `netlifyTest` branch
2. Netlify automatically deploys to: `https://csci432group.netlify.app/`
3. Set environment variables in Netlify dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`

## 📁 Project Structure

```
├── netlify/
│   └── functions/          # Serverless backend functions
│       ├── motions.js      # Motion CRUD operations
│       ├── meetings.js     # Meeting management
│       ├── meetings-join.js
│       ├── meetings-by-code.js
│       └── committees.js
├── src/
│   ├── components/         # React components
│   │   ├── EndVoteModal.jsx       # Chair summary capture
│   │   ├── NewMotionModal.jsx     # Motion creation with types
│   │   ├── ControlsModal.jsx      # Chair controls
│   │   ├── DiscussionPanel.jsx    # Motion discussion
│   │   ├── MotionHistory.jsx      # Completed motions
│   │   └── ...
│   ├── pages/              # Main page components
│   │   ├── Meeting.jsx     # Core meeting interface
│   │   ├── CreateMeeting.jsx
│   │   ├── JoinMeeting.jsx
│   │   └── Lobby.jsx
│   ├── lib/                # Utilities
│   │   └── api.js          # API fetch helper
│   └── index.css           # Global styles
├── netlify.toml            # Netlify configuration
└── package.json
```

## 🎨 Color Palette

Earth-tone design system:
- **Dark Moss Green** (`#606c38`) - Primary actions
- **Pakistan Green** (`#283618`) - Headers, text
- **Cornsilk** (`#fefae0`) - Backgrounds
- **Earth Yellow** (`#dda15e`) - Accents
- **Tiger's Eye** (`#bc6c25`) - Important actions

Vote colors:
- **Green** (`#4caf50`) - Yes votes
- **Red** (`#f44336`) - No votes
- **Orange** (`#ff9800`) - Abstain votes

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Testing Setup](./TESTING_SETUP.md) - Local testing guide
- [Changes Summary](./CHANGES_SUMMARY.md) - Implementation details
- [Database Collections](./DATABSE_DOCUMENTATION.md) - Description of MongoDB Collections

## 🧪 Testing

### Local Multi-User Testing

**Option 1: Multiple Browser Windows**
1. Open Chrome at `http://localhost:8888`
2. Open Firefox (or Chrome Incognito) at `http://localhost:8888`
3. Create meeting in Browser 1, join from Browser 2

**Option 2: Multiple Devices**
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Computer: `http://localhost:8888`
3. Phone/Tablet (same WiFi): `http://[YOUR-IP]:8888`

## 🚀 Key Features Implemented

### Robert's Rules Compliance
- ✅ Motion types with proper voting thresholds
- ✅ Chair summary and decision documentation
- ✅ Presiding officer role management
- ✅ Motion amendments and relationships
- ✅ Overturn previous decisions (with restrictions)

### Real-Time Functionality
- ✅ Vote updates across all devices (5-second polling)
- ✅ Motion creation synchronized instantly
- ✅ Discussion comments appear for all users
- ✅ Role changes reflect in real-time

### Data Persistence
- ✅ All motions saved to MongoDB
- ✅ Vote records with participant details
- ✅ Decision summaries with pros/cons
- ✅ Complete meeting history

## 👥 Team

Academic project for **CSCI432 - Web Development**

## 📝 License

Academic use only.
