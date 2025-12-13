import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import './Committees.css'

// DEMO MODE - Uses local state for reliable presentation
function Committees() {
  const navigate = useNavigate()
  
  const [committees, setCommittees] = useState([
    {
      _id: '1',
      CommitteeName: 'Budget & Finance Committee',
      Description: 'Oversees organizational budget, financial planning, and resource allocation.',
      Members: [
        { uid: '1', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Owner' },
        { uid: '2', name: 'Mike Chen', email: 'mike@example.com', role: 'Chair' },
        { uid: '3', name: 'Alex Rivera', email: 'alex@example.com', role: 'Member' },
        { uid: '4', name: 'Emma Davis', email: 'emma@example.com', role: 'Member' }
      ]
    },
    {
      _id: '2',
      CommitteeName: 'Events Planning Committee',
      Description: 'Plans and coordinates organizational events, meetings, and social gatherings.',
      Members: [
        { uid: '3', name: 'Alex Rivera', email: 'alex@example.com', role: 'Owner' },
        { uid: '5', name: 'David Kim', email: 'david@example.com', role: 'Member' }
      ]
    }
  ])
  
  // Create committee modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCommitteeName, setNewCommitteeName] = useState('')
  const [newCommitteeDesc, setNewCommitteeDesc] = useState('')
  const [createError, setCreateError] = useState('')
  
  // Add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedCommittee, setSelectedCommittee] = useState(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('Member')
  const [addMemberError, setAddMemberError] = useState('')

  // Create committee
  const handleCreateCommittee = (e) => {
    e.preventDefault()
    setCreateError('')
    
    if (!newCommitteeName.trim()) {
      setCreateError('Committee name is required')
      return
    }

    const newCommittee = {
      _id: String(Date.now()),
      CommitteeName: newCommitteeName.trim(),
      Description: newCommitteeDesc.trim(),
      Members: [
        { uid: 'current', name: 'You', email: 'you@example.com', role: 'Owner' }
      ]
    }

    setCommittees(prev => [...prev, newCommittee])
    setShowCreateModal(false)
    setNewCommitteeName('')
    setNewCommitteeDesc('')
  }

  // Add member
  const handleAddMember = (e) => {
    e.preventDefault()
    setAddMemberError('')
    
    if (!memberEmail.trim()) {
      setAddMemberError('Email is required')
      return
    }

    const newMember = {
      uid: String(Date.now()),
      name: memberEmail.split('@')[0],
      email: memberEmail.trim(),
      role: memberRole
    }

    setCommittees(prev => prev.map(c => 
      c._id === selectedCommittee._id
        ? { ...c, Members: [...c.Members, newMember] }
        : c
    ))

    setShowAddMemberModal(false)
    setMemberEmail('')
    setMemberRole('Member')
    setSelectedCommittee(null)
  }

  // Update member role
  const handleUpdateRole = (committeeId, memberUid, newRole) => {
    setCommittees(prev => prev.map(c =>
      c._id === committeeId
        ? { ...c, Members: c.Members.map(m => m.uid === memberUid ? { ...m, role: newRole } : m) }
        : c
    ))
  }

  // Remove member
  const handleRemoveMember = (committeeId, memberUid) => {
    if (!confirm('Remove this member?')) return
    setCommittees(prev => prev.map(c =>
      c._id === committeeId
        ? { ...c, Members: c.Members.filter(m => m.uid !== memberUid) }
        : c
    ))
  }

  // Delete committee
  const handleDeleteCommittee = (committeeId) => {
    if (!confirm('Delete this committee?')) return
    setCommittees(prev => prev.filter(c => c._id !== committeeId))
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner': return 'role-owner'
      case 'chair': return 'role-chair'
      default: return 'role-member'
    }
  }

  return (
    <>
      <Navigation />
      
      <div className="committees-page">
        <div className="page-header">
          <h1>My Committees</h1>
          <button 
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Committee
          </button>
        </div>

        {committees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No Committees Yet</h2>
            <p>Create your first committee to get started.</p>
            <button 
              className="create-btn large"
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Committee
            </button>
          </div>
        ) : (
          <div className="committees-grid">
            {committees.map(committee => (
              <div key={committee._id} className="committee-card">
                <div className="committee-header">
                  <h3>{committee.CommitteeName}</h3>
                  <div className="committee-actions">
                    <button 
                      className="action-btn add"
                      onClick={() => { setSelectedCommittee(committee); setShowAddMemberModal(true) }}
                      title="Add Member"
                    >
                      👤+
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteCommittee(committee._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {committee.Description && (
                  <p className="committee-description">{committee.Description}</p>
                )}
                
                <div className="members-section">
                  <h4>Members ({committee.Members?.length || 0})</h4>
                  <div className="members-list">
                    {(committee.Members || []).map((member, idx) => (
                      <div key={member.uid || idx} className="member-item">
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className={`member-role ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                        {member.role !== 'Owner' && (
                          <div className="member-actions">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(committee._id, member.uid, e.target.value)}
                              className="role-select"
                            >
                              <option value="Member">Member</option>
                              <option value="Chair">Chair</option>
                            </select>
                            <button
                              className="remove-btn"
                              onClick={() => handleRemoveMember(committee._id, member.uid)}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="committee-footer">
                  <button
                    className="meeting-btn"
                    onClick={() => navigate('/meeting')}
                  >
                    Start Meeting
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Committee Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Committee</h2>
            <form onSubmit={handleCreateCommittee}>
              <div className="form-group">
                <label>Committee Name *</label>
                <input
                  type="text"
                  value={newCommitteeName}
                  onChange={(e) => setNewCommitteeName(e.target.value)}
                  placeholder="e.g., Budget Committee"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={newCommitteeDesc}
                  onChange={(e) => setNewCommitteeDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
              {createError && <div className="form-error">{createError}</div>}
              <div className="modal-actions">
                <button type="submit" className="primary-btn">Create Committee</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && selectedCommittee && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Member to {selectedCommittee.CommitteeName}</h2>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>User Email *</label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="member@example.com"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
                  <option value="Member">Member</option>
                  <option value="Chair">Chair</option>
                </select>
              </div>
              {addMemberError && <div className="form-error">{addMemberError}</div>}
              <div className="modal-actions">
                <button type="submit" className="primary-btn">Add Member</button>
                <button type="button" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Committees
