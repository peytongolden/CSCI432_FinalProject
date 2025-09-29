// Data structure for the committee meeting page
const data = {
    committee: {
        id: 1,
        name: "Budget Committee",
        sessionActive: true
    },
    members: [
        { id: 1, name: "Sarah Johnson", role: "chair", vote: "yes" },
        { id: 2, name: "Mike Chen", role: "floor", vote: "no" },
        { id: 3, name: "Alex Rivera", role: "member", vote: "yes" },
        { id: 4, name: "Emma Davis", role: "member", vote: "no" },
        { id: 5, name: "David Kim", role: "member", vote: "abstain" },
        { id: 6, name: "Lisa Park", role: "member", vote: "yes" },
        { id: 7, name: "James Wilson", role: "member", vote: "no" },
        { id: 8, name: "Rachel Green", role: "member", vote: "yes" }
    ],
    currentMotion: {
        id: 1,
        title: "Motion to Approve Budget Amendment",
        description: "Proposed amendment to increase marketing budget by $5,000 for Q4 initiatives.",
        status: "voting",
        createdBy: 3,
        votes: {
            yes: 4,
            no: 3,
            abstain: 1
        }
    },
    currentUser: {
        id: 3,
        name: "Alex Rivera",
        role: "member",
        hasVoted: true,
        vote: "yes"
    }
};

// Initialize page when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    renderPage();
});

// Main function to render the entire page
function renderPage() {
    renderMembers();
    renderCurrentMotion();
    renderVotingButtons();
    updateVoteCount();
}

// Render committee members with their votes
function renderMembers() {
    // Render special roles
    const presidingOfficer = data.members.find(member => member.role === 'chair');
    const onFloor = data.members.find(member => member.role === 'floor');
    
    if (presidingOfficer) {
        document.querySelector('.presiding-officer .participant-name').textContent = presidingOfficer.name;
        document.querySelector('.presiding-officer .vote-indicator').className = 
            `vote-indicator vote-${presidingOfficer.vote}`;
        document.querySelector('.presiding-officer .vote-indicator').textContent = 
            getVoteSymbol(presidingOfficer.vote);
    }
    
    if (onFloor) {
        document.querySelector('.on-floor .participant-name').textContent = onFloor.name;
        document.querySelector('.on-floor .vote-indicator').className = 
            `vote-indicator vote-${onFloor.vote}`;
        document.querySelector('.on-floor .vote-indicator').textContent = 
            getVoteSymbol(onFloor.vote);
    }

    // Render regular members
    const regularMembers = data.members.filter(member => member.role === 'member');
    const membersGrid = document.querySelector('.members-grid');
    
    membersGrid.innerHTML = '';
    
    regularMembers.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'participant-item';
        memberElement.innerHTML = `
            <span class="participant-name">${member.name}</span>
            <div class="vote-indicator vote-${member.vote}">${getVoteSymbol(member.vote)}</div>
        `;
        membersGrid.appendChild(memberElement);
    });
}

// Render current motion details
function renderCurrentMotion() {
    document.querySelector('.motion-title').textContent = data.currentMotion.title;
    document.querySelector('.motion-description').textContent = data.currentMotion.description;
    document.querySelector('.status-voting').textContent = 
        data.currentMotion.status === 'voting' ? 'Voting in Progress' : 'Discussion';
}

// Render voting buttons based on user's vote status
function renderVotingButtons() {
    const votingButtons = document.querySelector('.voting-buttons');
    const hasVoted = data.currentUser.hasVoted;
    
    if (hasVoted) {
        votingButtons.innerHTML = `
            <div class="vote-status">
                <p>You voted: <strong>${data.currentUser.vote.toUpperCase()}</strong></p>
                <button class="change-vote-btn" onclick="changeVote()">Change Vote</button>
            </div>
        `;
    } else {
        votingButtons.innerHTML = `
            <div class="vote-button vote-no-btn" onclick="castVote('no')">✗</div>
            <div class="vote-button vote-abstain-btn" onclick="castVote('abstain')">—</div>
            <div class="vote-button vote-yes-btn" onclick="castVote('yes')">✓</div>
        `;
    }
}

// Helper function to get vote symbols
function getVoteSymbol(vote) {
    switch(vote) {
        case 'yes': return '✓';
        case 'no': return '✗';
        case 'abstain': return '—';
        default: return '?';
    }
}

// Handle vote casting
function castVote(vote) {
    if (data.currentUser.hasVoted) {
        alert('You have already voted. Use "Change Vote" to modify your vote.');
        return;
    }

    // Update user's vote in data
    const userIndex = data.members.findIndex(member => member.id === data.currentUser.id);
    if (userIndex !== -1) {
        data.members[userIndex].vote = vote;
    }
    
    data.currentUser.vote = vote;
    data.currentUser.hasVoted = true;

    // Update vote counts
    data.currentMotion.votes[vote]++;

    // Log the vote action
    console.log(`Vote cast: ${vote} by ${data.currentUser.name}`);
    
    // Re-render affected sections
    renderMembers();
    renderVotingButtons();
    updateVoteCount();
    
    // Show confirmation
    showVoteConfirmation(vote);
}

// Handle vote changes
function changeVote() {
    data.currentUser.hasVoted = false;
    
    // Decrease old vote count
    data.currentMotion.votes[data.currentUser.vote]--;
    
    renderVotingButtons();
    console.log('Vote change enabled for user:', data.currentUser.name);
}

// Update vote count display
function updateVoteCount() {
    const votes = data.currentMotion.votes;
    const total = votes.yes + votes.no + votes.abstain;
    
    // Create or update vote count display
    let voteCountElement = document.querySelector('.vote-count');
    if (!voteCountElement) {
        voteCountElement = document.createElement('div');
        voteCountElement.className = 'vote-count';
        document.querySelector('.current-motion-section').appendChild(voteCountElement);
    }
    
    voteCountElement.innerHTML = `
        <div class="vote-tally">
            <span class="vote-count-item yes">Yes: ${votes.yes}</span>
            <span class="vote-count-item no">No: ${votes.no}</span>
            <span class="vote-count-item abstain">Abstain: ${votes.abstain}</span>
            <span class="vote-count-total">Total: ${total}</span>
        </div>
    `;
}

// Show vote confirmation
function showVoteConfirmation(vote) {
    const confirmation = document.createElement('div');
    confirmation.className = 'vote-confirmation';
    confirmation.innerHTML = `
        <p>Vote recorded: <strong>${vote.toUpperCase()}</strong></p>
    `;
    
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        confirmation.remove();
    }, 3000);
}

// Handle controls panel
function openControls() {
    console.log("Opening controls");
    
    const controlsModal = document.createElement('div');
    controlsModal.className = 'controls-modal';
    controlsModal.innerHTML = `
        <div class="modal-content">
            <h3>Chair Controls</h3>
            <button onclick="endVoting()">End Voting</button>
            <button onclick="startNewMotion()">New Motion</button>
            <button onclick="viewResults()">View Results</button>
            <button onclick="closeModal()">Close</button>
        </div>
    `;
    
    document.body.appendChild(controlsModal);
}

// Close modal function
function closeModal() {
    const modal = document.querySelector('.controls-modal');
    if (modal) modal.remove();
}

// Additional control functions
function endVoting() {
    data.currentMotion.status = 'completed';
    alert('Voting has been ended by the chair.');
    renderCurrentMotion();
    closeModal();
}

function startNewMotion() {
    alert('New motion dialog would open here.');
    closeModal();
}

function viewResults() {
    const votes = data.currentMotion.votes;
    alert(`Motion Results:\nYes: ${votes.yes}\nNo: ${votes.no}\nAbstain: ${votes.abstain}`);
}

// Simulate real-time updates (for demonstration)
function simulateUpdate() {
    // Simulate another user voting
    const randomMember = data.members[Math.floor(Math.random() * data.members.length)];
    const votes = ['yes', 'no', 'abstain'];
    const randomVote = votes[Math.floor(Math.random() * votes.length)];
    
    randomMember.vote = randomVote;
    data.currentMotion.votes[randomVote]++;
    
    renderPage();
    console.log(`Simulated vote: ${randomMember.name} voted ${randomVote}`);
}

// Export data for debugging
function exportData() {
    console.log('Current data state:', JSON.stringify(data, null, 2));
    return data;
}
