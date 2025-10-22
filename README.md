# Robert's Rules of Order Voting Application

A modern React-based web application for conducting formal committee meetings following Robert's Rules of Order, with real-time voting capabilities.

## Features

### Meeting Management
- **Live Voting Sessions**: Conduct votes on motions with real-time updates
- **Motion Creation**: Create and manage multiple motions during a session
- **Motion History**: Track all completed motions with results
- **Vote Tracking**: Monitor individual member votes in real-time

### User Roles
- **Presiding Officer (Chair)**: Controls meeting flow, creates motions, ends voting
- **Floor Member**: Currently speaking/presenting
- **Regular Members**: Vote on motions and participate in discussions

### Voting Features
- **Three Vote Options**: Yes, No, or Abstain
- **Vote Changes**: Members can change their vote before voting closes
- **Live Results**: Real-time vote counting and display
- **Vote Confirmation**: Visual feedback when votes are cast

### Chair Controls
- End voting sessions
- Create new motions
- View detailed results
- Manage meeting flow

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **CSS3** - Styling with custom color palette

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CSCI432_FinalProject
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Application Structure

```

## Color Palette

The application uses an earth-tone color scheme:
- **Dark Moss Green** (`#606c38`)
- **Pakistan Green** (`#283618`)
- **Cornsilk** (`#fefae0`)
- **Earth Yellow** (`#dda15e`)
- **Tiger's Eye** (`#bc6c25`)

Academic project for CSCI432 - Web Development
