import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import './Help.css'

function Help() {
  const [expandedSection, setExpandedSection] = useState('getting-started')

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="help-page">
      <Navigation />
      
      <div className="help-container">
        <div className="help-header">
          <h1>Help & User Guide</h1>
          <p>Learn how to use Robert's Rules of Order Voting Application</p>
        </div>

        <div className="help-content">
          {/* Introduction */}
          <section className="help-section intro-section">
            <h2>Welcome to Robert's Rules of Order Voting Application</h2>
            <p>
              This application helps organizations conduct formal meetings following Robert's Rules of Order. 
              It provides a structured environment for voting on motions with real-time vote tracking and member management.
            </p>
          </section>

          {/* Getting Started */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'getting-started' ? 'expanded' : ''}`}
              onClick={() => toggleSection('getting-started')}
            >
              <span className="toggle-icon">▶</span>
              Getting Started
            </button>
            
            {expandedSection === 'getting-started' && (
              <div className="section-content">
                <h3>Account Setup</h3>
                <ol>
                  <li><strong>Create an Account</strong> - Click "Register" to create a new account with your name and credentials</li>
                  <li><strong>Login</strong> - Use your credentials to log in to the application</li>
                  <li><strong>View Account Details</strong> - Go to the Account page to manage your profile information</li>
                </ol>

                <h3>Joining or Creating a Meeting</h3>
                <p>Once logged in, you'll be taken to the Lobby where you can:</p>
                <ul>
                  <li><strong>Create a Meeting</strong> - Start a new committee meeting session. You'll become the Presiding Officer (Chair)</li>
                  <li><strong>Join a Meeting</strong> - Enter a meeting code to join an existing meeting</li>
                </ul>

                <h3>Navigation</h3>
                <p>Use the top navigation bar to access:</p>
                <ul>
                  <li><strong>Home</strong> - Return to the lobby to create or join meetings</li>
                  <li><strong>Meeting</strong> - Access the active meeting (appears when you're in a meeting)</li>
                  <li><strong>Account</strong> - View and edit your account information</li>
                  <li><strong>Logout</strong> - Sign out of your account</li>
                </ul>
              </div>
            )}
          </div>

          {/* Robert's Rules of Order */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'roberts-rules' ? 'expanded' : ''}`}
              onClick={() => toggleSection('roberts-rules')}
            >
              <span className="toggle-icon">▶</span>
              Robert's Rules of Order Basics
            </button>
            
            {expandedSection === 'roberts-rules' && (
              <div className="section-content">
                <h3>What are Robert's Rules of Order?</h3>
                <p>
                  Robert's Rules of Order is a widely adopted parliamentary procedure used by organizations, 
                  boards, and committees to conduct meetings fairly and efficiently. It ensures that every member 
                  has an equal voice and that decisions are made democratically.
                </p>

                <h3>Key Principles</h3>
                <ul>
                  <li><strong>Quorum</strong> - A minimum number of members must be present to conduct official business</li>
                  <li><strong>Motion</strong> - A formal proposal for action that members can debate and vote on</li>
                  <li><strong>Debate</strong> - Members have the opportunity to discuss motions before voting</li>
                  <li><strong>Vote</strong> - Members vote on motions using majority rule (majority of votes cast wins)</li>
                  <li><strong>Order of Business</strong> - Meetings follow a predetermined agenda and structure</li>
                </ul>

                <h3>Meeting Roles</h3>
                <div className="roles-grid">
                  <div className="role-card">
                    <h4>Presiding Officer (Chair)</h4>
                    <p>
                      Directs the meeting, maintains order, recognizes speakers, and oversees voting. 
                      The Chair is responsible for ensuring the meeting follows proper procedures.
                    </p>
                  </div>
                  <div className="role-card">
                    <h4>Floor Member</h4>
                    <p>
                      A member who has been recognized by the Chair to speak on the current topic. 
                      Only one floor member can speak at a time.
                    </p>
                  </div>
                  <div className="role-card">
                    <h4>Regular Members</h4>
                    <p>
                      All other members who can vote on motions and participate in discussions when recognized by the Chair.
                    </p>
                  </div>
                </div>

                <h3>Motion Lifecycle</h3>
                <ol>
                  <li><strong>Motion Presented</strong> - A member proposes a motion to the assembly</li>
                  <li><strong>Motion Seconded</strong> - Another member seconds the motion (supports its consideration)</li>
                  <li><strong>Debate</strong> - Members discuss the motion (optional)</li>
                  <li><strong>Vote Called</strong> - The Chair calls for a vote on the motion</li>
                  <li><strong>Vote Cast</strong> - Members vote Yes, No, or Abstain</li>
                  <li><strong>Result Announced</strong> - The Chair announces the result based on the vote count</li>
                </ol>

                <h3>Voting Methods</h3>
                <p>This application uses <strong>voice vote</strong> method where each member votes individually:</p>
                <ul>
                  <li><strong>Yes</strong> - In favor of the motion</li>
                  <li><strong>No</strong> - Against the motion</li>
                  <li><strong>Abstain</strong> - Neither in favor nor against (no vote recorded)</li>
                </ul>
              </div>
            )}
          </div>

          {/* Meeting Features */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'meeting-features' ? 'expanded' : ''}`}
              onClick={() => toggleSection('meeting-features')}
            >
              <span className="toggle-icon">▶</span>
              Meeting Features
            </button>
            
            {expandedSection === 'meeting-features' && (
              <div className="section-content">
                <h3>Current Motion Display</h3>
                <p>
                  The main meeting view shows the currently active motion with:
                </p>
                <ul>
                  <li><strong>Motion Title</strong> - The name/subject of the motion</li>
                  <li><strong>Motion Description</strong> - Full details about what is being voted on</li>
                  <li><strong>Status</strong> - Current state of the motion (voting, completed, etc.)</li>
                  <li><strong>Vote Count Display</strong> - Real-time tally of Yes, No, and Abstain votes</li>
                </ul>

                <h3>Members List</h3>
                <p>
                  View all participants in the meeting with:
                </p>
                <ul>
                  <li><strong>Member Names</strong> - All committee members present</li>
                  <li><strong>Member Roles</strong> - Chair, Floor, or Regular member status</li>
                  <li><strong>Vote Status</strong> - Whether each member has voted and their choice</li>
                </ul>

                <h3>Voting Interface</h3>
                <p>
                  When a motion is open for voting, you can:
                </p>
                <ul>
                  <li><strong>Cast Your Vote</strong> - Click Yes, No, or Abstain to vote</li>
                  <li><strong>Change Your Vote</strong> - Before voting closes, change your vote to a different option</li>
                  <li><strong>Vote Confirmation</strong> - See visual feedback confirming your vote was recorded</li>
                </ul>

                <h3>Motion History</h3>
                <p>
                  View all completed motions with:
                </p>
                <ul>
                  <li><strong>Previous Motions</strong> - List of all motions that have been voted on</li>
                  <li><strong>Final Results</strong> - Vote counts and outcomes for each motion</li>
                  <li><strong>Historical Reference</strong> - Track the meeting's decisions and progression</li>
                </ul>

                <h3>Chair Controls</h3>
                <p>
                  If you are the Presiding Officer (Chair), you have access to:
                </p>
                <ul>
                  <li><strong>Create Motion</strong> - Propose a new motion for the committee to vote on</li>
                  <li><strong>End Voting</strong> - Close the current vote and move to the next motion</li>
                  <li><strong>View Detailed Results</strong> - See full vote breakdowns and member votes</li>
                  <li><strong>Manage Meeting Flow</strong> - Control the overall progression of the meeting</li>
                </ul>
              </div>
            )}
          </div>

          {/* Creating & Voting on Motions */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'motions' ? 'expanded' : ''}`}
              onClick={() => toggleSection('motions')}
            >
              <span className="toggle-icon">▶</span>
              Creating & Voting on Motions
            </button>
            
            {expandedSection === 'motions' && (
              <div className="section-content">
                <h3>Creating a Motion (Chair Only)</h3>
                <ol>
                  <li>Click the <strong>"Create Motion"</strong> button</li>
                  <li>Enter a clear <strong>Motion Title</strong> (e.g., "Motion to Approve Budget Amendment")</li>
                  <li>Provide a detailed <strong>Description</strong> explaining what is being proposed</li>
                  <li>Click <strong>"Create Motion"</strong> to add it to the voting agenda</li>
                </ol>

                <h3>Voting on a Motion</h3>
                <ol>
                  <li>Review the motion title and description</li>
                  <li>Consider the proposal (think about whether you support, oppose, or are neutral)</li>
                  <li>Click your vote choice:
                    <ul>
                      <li><strong>YES</strong> - You support the motion</li>
                      <li><strong>NO</strong> - You oppose the motion</li>
                      <li><strong>ABSTAIN</strong> - You don't wish to vote on this motion</li>
                    </ul>
                  </li>
                  <li>You'll see a confirmation that your vote has been recorded</li>
                </ol>

                <h3>Changing Your Vote</h3>
                <ol>
                  <li>Before the Chair calls for the vote to end, you can click <strong>"Change Vote"</strong></li>
                  <li>Select your new vote option</li>
                  <li>Your vote will be updated in the tally</li>
                </ol>

                <h3>Motion Requirements</h3>
                <ul>
                  <li><strong>Title Required</strong> - Every motion must have a clear, concise title</li>
                  <li><strong>Description Required</strong> - Provide details so members understand what they're voting on</li>
                  <li><strong>Clear Language</strong> - Use language that all members will understand</li>
                </ul>

                <h3>Tips for Good Motions</h3>
                <ul>
                  <li>Be specific about what action is being proposed</li>
                  <li>Include relevant details (amounts, dates, affected parties)</li>
                  <li>Avoid vague or overly complex language</li>
                  <li>State the purpose clearly so debate can be focused</li>
                </ul>
              </div>
            )}
          </div>

          {/* Vote Counting & Results */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'voting' ? 'expanded' : ''}`}
              onClick={() => toggleSection('voting')}
            >
              <span className="toggle-icon">▶</span>
              Vote Counting & Results
            </button>
            
            {expandedSection === 'voting' && (
              <div className="section-content">
                <h3>How Votes are Counted</h3>
                <p>
                  Votes are counted in real-time as members cast them. The application displays:
                </p>
                <ul>
                  <li><strong>Yes Count</strong> - Total votes in favor</li>
                  <li><strong>No Count</strong> - Total votes opposed</li>
                  <li><strong>Abstain Count</strong> - Total abstentions (not counted in the majority)</li>
                </ul>

                <h3>Determining the Winner</h3>
                <p>
                  A motion passes if it receives a <strong>majority</strong> of votes cast:
                </p>
                <ul>
                  <li>Abstentions are <strong>NOT</strong> counted toward the total</li>
                  <li>The motion passes if: <strong>Yes votes &gt; No votes</strong></li>
                  <li>The motion fails if: <strong>No votes ≥ Yes votes</strong></li>
                </ul>

                <h3>Vote Results Display</h3>
                <p>
                  Once the Chair ends voting, you can see:
                </p>
                <ul>
                  <li>Final vote counts for Yes, No, and Abstain</li>
                  <li>The outcome (Passed or Failed)</li>
                  <li>Individual member votes (who voted for what)</li>
                </ul>

                <h3>Motion History</h3>
                <p>
                  All completed motions are saved in the Motion History, showing:
                </p>
                <ul>
                  <li>The motion title and description</li>
                  <li>Final vote counts</li>
                  <li>The outcome of the motion</li>
                </ul>
              </div>
            )}
          </div>

          {/* Account Management */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'account' ? 'expanded' : ''}`}
              onClick={() => toggleSection('account')}
            >
              <span className="toggle-icon">▶</span>
              Account Management
            </button>
            
            {expandedSection === 'account' && (
              <div className="section-content">
                <h3>Viewing Your Account</h3>
                <ol>
                  <li>Click <strong>"Account"</strong> in the top navigation</li>
                  <li>View your current profile information</li>
                </ol>

                <h3>Account Information</h3>
                <p>
                  Your account displays:
                </p>
                <ul>
                  <li><strong>Name</strong> - Your full name as displayed in meetings</li>
                  <li><strong>Email</strong> - Your account email address</li>
                  <li><strong>Member Status</strong> - Your role in the organization</li>
                </ul>

                <h3>Logging Out</h3>
                <ol>
                  <li>Click <strong>"Logout"</strong> in the top navigation bar</li>
                  <li>You'll be returned to the login page</li>
                  <li>Your session will be securely ended</li>
                </ol>
              </div>
            )}
          </div>

          {/* Best Practices */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'best-practices' ? 'expanded' : ''}`}
              onClick={() => toggleSection('best-practices')}
            >
              <span className="toggle-icon">▶</span>
              Best Practices & Tips
            </button>
            
            {expandedSection === 'best-practices' && (
              <div className="section-content">
                <h3>For All Members</h3>
                <ul>
                  <li><strong>Pay Attention</strong> - Read each motion carefully before voting</li>
                  <li><strong>Vote Thoughtfully</strong> - Consider all aspects of each proposal</li>
                  <li><strong>Respect the Process</strong> - Follow the Chair's guidance and vote timing</li>
                  <li><strong>Participate</strong> - If recognized by the Chair, contribute to discussions</li>
                </ul>

                <h3>For the Presiding Officer (Chair)</h3>
                <ul>
                  <li><strong>Clear Communication</strong> - Ensure all members understand each motion</li>
                  <li><strong>Fair Debate</strong> - Give all sides opportunity to speak</li>
                  <li><strong>Impartial Voting</strong> - Maintain fairness in vote counting</li>
                  <li><strong>Timely Decisions</strong> - Don't let debates drag unnecessarily long</li>
                  <li><strong>Clear Motions</strong> - Create motions with specific, actionable language</li>
                </ul>

                <h3>General Meeting Tips</h3>
                <ul>
                  <li><strong>Agenda</strong> - Plan your meeting agenda before starting</li>
                  <li><strong>Time Management</strong> - Keep debates focused and moving</li>
                  <li><strong>Documentation</strong> - Use Motion History to keep accurate records</li>
                  <li><strong>Preparation</strong> - Members should be informed about upcoming motions</li>
                  <li><strong>Professionalism</strong> - Keep discussions professional and respectful</li>
                </ul>
              </div>
            )}
          </div>

          {/* Troubleshooting */}
          <div className="collapsible-section">
            <button 
              className={`section-header ${expandedSection === 'troubleshooting' ? 'expanded' : ''}`}
              onClick={() => toggleSection('troubleshooting')}
            >
              <span className="toggle-icon">▶</span>
              Troubleshooting
            </button>
            
            {expandedSection === 'troubleshooting' && (
              <div className="section-content">
                <h3>Common Issues</h3>
                
                <div className="faq-item">
                  <h4>I can't log in to my account</h4>
                  <p>
                    Check that you're entering the correct email and password. If you forgot your password, 
                    you may need to create a new account. Make sure your internet connection is working.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>I can't find the meeting code</h4>
                  <p>
                    If you created the meeting, you should see the code on the create meeting page. 
                    If you're trying to join, ask the meeting creator for the code. Make sure you're copying it correctly.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>My vote isn't being recorded</h4>
                  <p>
                    Make sure the motion is still in voting status (not yet ended by the Chair). 
                    Check that you clicked the vote button clearly. If the issue persists, try refreshing the page.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>I don't see the "Create Motion" button</h4>
                  <p>
                    Only the Presiding Officer (Chair) can create motions. If you created the meeting, 
                    you should be the Chair. Check the Members List to confirm your role.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>The vote count seems wrong</h4>
                  <p>
                    Remember that abstentions are not counted toward the total. The count updates in real-time, 
                    so make sure all members have finished voting. Check the detailed results view for individual member votes.
                  </p>
                </div>

                <div className="faq-item">
                  <h4>I want to change my vote but can't</h4>
                  <p>
                    The Chair may have already ended the voting on this motion. Once voting ends, 
                    votes cannot be changed. You'll be able to vote on the next motion.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Resources */}
          <section className="help-section resources-section">
            <h2>Additional Resources</h2>
            <p>
              For more detailed information about Robert's Rules of Order, consult the official manual 
              or speak with your organization's parliamentary authority. This application implements 
              the most commonly used procedures for committee meetings.
            </p>
            <div className="action-buttons">
              <Link to="/lobby" className="btn btn-primary">
                Return to Lobby
              </Link>
              <Link to="/meeting" className="btn btn-secondary">
                Go to Meeting
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Help
