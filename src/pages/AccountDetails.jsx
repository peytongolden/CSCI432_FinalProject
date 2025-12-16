import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import './AccountDetails.css'
import './FormStyles.css'
import Navigation from '../components/Navigation'
import { apiFetch } from '../lib/api'

function AccountDetails() {
  const navigate = useNavigate()
  // Load persisted user info from localStorage, fallback to defaults
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const raw = localStorage.getItem('userInfo')
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.error('Failed to parse stored user info', e)
    }

    return {
      name: '',
      email: '',
      role: '',
      joinDate: '',
      phone: '',
      bio: '',
      avatar: '' // base64 data URL or remote URL
    }
  })

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(userInfo)
  const [errors, setErrors] = useState({})
  const [committees, setCommittees] = useState([])
  const [loadingCommittees, setLoadingCommittees] = useState(false)

  // On mount, try to fetch fresh profile from backend if token available
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    (async () => {
      try {
        const res = await apiFetch('/api/user/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok && data.success && data.user) {
          setUserInfo(data.user)
          setForm(data.user)
          try { localStorage.setItem('userInfo', JSON.stringify(data.user)) } catch (e) { console.error(e) }
          
          // Load user's committees
          if (Array.isArray(data.user.committee_memberships) && data.user.committee_memberships.length) {
            setLoadingCommittees(true)
            const ids = data.user.committee_memberships.map(String)
            const fetched = await Promise.all(ids.map(async (id) => {
              try {
                const r = await apiFetch(`/api/committee/${encodeURIComponent(id)}`, { headers: { 'Authorization': `Bearer ${token}` } })
                if (!r.ok) return null
                const committee = await r.json().catch(() => null)
                if (!committee) return null
                return { id: String(committee._id || committee._id?.toString?.()), name: committee.CommitteeName || committee.name, ...committee }
              } catch (err) { return null }
            }))
            setCommittees(fetched.filter(Boolean))
            setLoadingCommittees(false)
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile', e)
      }
    })()
  }, [])

  useEffect(() => {
    setForm(userInfo)
  }, [userInfo])

  // Validation helpers
  const validateEmail = (email) => {
    if (!email) return 'Email is required.'
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) return 'Please enter a valid email address.'
    return ''
  }

  const countDigits = (s) => (s ? (s.match(/\d/g) || []).length : 0)
  const validatePhone = (phone) => {
    if (!phone) return '' // optional
    const digits = countDigits(phone)
    if (digits < 10) return 'Please enter a valid phone number (at least 10 digits).'
    if (digits > 15) return 'Phone number looks too long.'
    return ''
  }

  // Format phone into dashed groups (simple, client-side):
  // - 10 digits => 123-456-7890
  // - 11 digits => 1-234-567-8901
  // - fewer than 4 digits => as-is
  // - 4-6 => 123-456
  const formatPhone = (raw) => {
    if (!raw) return ''
    const digits = ('' + raw).replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`
    if (digits.length <= 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
    // more than 10 => place country prefix before the usual groups
    const ccLen = digits.length - 10
    const cc = digits.slice(0, ccLen)
    const rest = digits.slice(ccLen)
    return `${cc}-${rest.slice(0,3)}-${rest.slice(3,6)}-${rest.slice(6)}`
  }

  // Live-validate email & phone while editing
  useEffect(() => {
    if (!editing) return
    const next = {}
    const emailErr = validateEmail(form.email)
    if (emailErr) next.email = emailErr
    const phoneErr = validatePhone(form.phone)
    if (phoneErr) next.phone = phoneErr
    setErrors(next)
  }, [form.email, form.phone, editing])

  //const updateInformation = 

  return (
    <>
      <Navigation />

      <div className="account-page">
        <div className="main-container">
        <section className="participants-section">
          <h2 className="section-title">Account Details</h2>

          <div className="account-info">
            <div className="account-header">
              <div className="avatar">
                {form.avatar ? (
                  <img src={form.avatar} alt={`${form.name} avatar`} />
                ) : (
                  <div className="avatar-fallback">{(form.name || 'U').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                )}
              </div>

              <div className="account-actions">
                {!editing ? (
                  <button onClick={() => setEditing(true)}>Edit</button>
                ) : (
                  <>
                    <button
                      className="primary"
                      onClick={() => {
                          // Ensure phone is formatted before validating/saving
                          const formattedPhone = formatPhone(form.phone)
                          const emailErr = validateEmail(form.email)
                          const phoneErr = validatePhone(formattedPhone)
                          const next = {}
                          if (emailErr) next.email = emailErr
                          if (phoneErr) next.phone = phoneErr
                          setErrors(next)
                          if (Object.keys(next).length > 0) return

                          try {async () => {
                            const emailTemp = JSON.parse(localStorage.getItem('userInfo'))['email']

                            const updated = { ...form, phone: formattedPhone }
                            setUserInfo(updated)
                            try { localStorage.setItem('userInfo', JSON.stringify(updated)) } catch (e) { console.error(e) }

                            const res = await apiFetch(`/api/user/update/${emailTemp}`, {
                              method: 'PATCH',
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json',
                                Accept: 'application/json'
                              },
                              body: localStorage.getItem('userInfo')
                            })
                            const data = await res.json()

                            setForm(updated)
                            setEditing(false)
                          }} catch {
                            console.log("Error updating account information")
                          }
                        }}
                      disabled={Object.keys(errors).length > 0}
                    >
                      Save
                    </button>
                    <button onClick={() => { setForm(userInfo); setEditing(false); setErrors({}) }}>Cancel</button>
                  </>
                )}
              </div>
            </div>

            <div className="info-row">
              <label>Full Name:</label>
              {editing ? (
                <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              ) : (
                <p>{userInfo.name}</p>
              )}
            </div>

            <div className="info-row">
              <label>Email:</label>
              {editing ? (
                <>
                  <input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </>
              ) : (
                <p>{userInfo.email}</p>
              )}
            </div>

            <div className="info-row">
              <label>Phone:</label>
              {editing ? (
                <>
                  <input
                    type="tel"
                    value={form.phone || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    onBlur={() => setForm(prev => ({ ...prev, phone: formatPhone(prev.phone) }))}
                    placeholder="(555) 555-5555"
                  />
                  {errors.phone && <div className="field-error">{errors.phone}</div>}
                </>
              ) : (
                <p>{userInfo.phone || '—'}</p>
              )}
            </div>

            <div className="info-row">
              <label>Bio:</label>
              {editing ? (
                <textarea value={form.bio || ''} onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))} rows={4} />
              ) : (
                <p style={{ whiteSpace: 'pre-wrap' }}>{userInfo.bio || '—'}</p>
              )}
            </div>

            <div className="info-row">
              <label>Role:</label>
              <p>{userInfo.role}</p>
            </div>

            <div className="info-row">
              <label>Member Since:</label>
              <p>{userInfo.joinDate}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '30px', flexWrap: 'wrap' }}>
              <button className="primary" onClick={() => navigate('/lobby')}>
                Go to Lobby
              </button>
              <button onClick={() => { localStorage.removeItem('userInfo'); localStorage.removeItem('token'); navigate('/login') }}>
                Logout
              </button>
            </div>

            {editing && (
              <div className="info-row file-row">
                <label>Profile Picture</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files && e.target.files[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    setForm(prev => ({ ...prev, avatar: reader.result }))
                  }
                  reader.readAsDataURL(file)
                }} />
                <div className="file-preview">
                  {form.avatar ? <img src={form.avatar} alt="preview" /> : <span>No image selected</span>}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="committees-section">
          <h2 className="section-title">Your Committees</h2>
          {loadingCommittees ? (
            <div className="committees-loading">Loading committees…</div>
          ) : committees.length > 0 ? (
            <div className="committees-list">
              {committees.map((committee) => (
                <div key={committee.id} className="committee-card">
                  <div className="committee-header">
                    <h3>{committee.name}</h3>
                    <span className={`committee-status ${committee.ActiveMeeting ? 'active' : 'inactive'}`}>
                      {committee.ActiveMeeting ? 'Meeting Active' : 'No Meeting'}
                    </span>
                  </div>
                  {committee.PrimaryMotion && (
                    <div className="committee-motion">
                      <strong>Current Motion:</strong> {committee.PrimaryMotion}
                      {committee.PrimaryMotionDescription && <p>{committee.PrimaryMotionDescription}</p>}
                    </div>
                  )}
                  <div className="committee-meta">
                    <span>{Array.isArray(committee.Members) ? committee.Members.length : 0} member(s)</span>
                  </div>
                  <div className="committee-actions">
                    <button className="btn-small" onClick={() => navigate(`/meeting?committeeId=${committee.id}`)}>
                      View Committee
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="committees-empty">
              <p>You are not a member of any committees yet.</p>
            </div>
          )}
        </section>
        </div>
      </div>
    </>
  )
}

export default AccountDetails

