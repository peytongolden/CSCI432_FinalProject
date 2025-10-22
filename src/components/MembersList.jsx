import './MembersList.css'

function getVoteSymbol(vote) {
  switch (vote) {
    case 'yes':
      return 'Y'
    case 'no':
      return 'N'
    case 'abstain':
      return 'A'
    case null:
      return '—'
    default:
      return '?'
  }
}

function MembersList({ members, presidingOfficer, onFloor, regularMembers }) {
  return (
    <div className="members-list-container">
      {/* Special Roles */}
      {presidingOfficer && (
        <div className="member-row presiding">
          <div className="member-info">
            <span className="member-name">{presidingOfficer.name}</span>
            <span className="member-role">Presiding Officer</span>
          </div>
          <div className={`vote-badge vote-${presidingOfficer.vote}`}>
            {getVoteSymbol(presidingOfficer.vote)}
          </div>
        </div>
      )}

      {onFloor && (
        <div className="member-row floor">
          <div className="member-info">
            <span className="member-name">{onFloor.name}</span>
            <span className="member-role">On the Floor</span>
          </div>
          <div className={`vote-badge vote-${onFloor.vote}`}>
            {getVoteSymbol(onFloor.vote)}
          </div>
        </div>
      )}

      <div className="members-divider"></div>

      {/* Regular Members */}
      {regularMembers.map(member => (
        <div key={member.id} className="member-row">
          <div className="member-info">
            <span className="member-name">{member.name}</span>
          </div>
          <div className={`vote-badge vote-${member.vote}`}>
            {getVoteSymbol(member.vote)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MembersList

