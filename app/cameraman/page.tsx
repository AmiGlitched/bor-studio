'use client'
import { useState } from 'react'

const initialShoots = [
  {
    id: 1, client: 'Hamdan Al Mansoori', date: '2026-04-07', time: '2:00 PM',
    location: 'DAMAC Lagoons, Dubai', status: 'confirmed',
    notes: 'Bring lav mic, extra battery. 3-4 videos planned.',
    driveLink: 'https://drive.google.com', rawUploaded: true, uploadedAt: '2026-04-07 4:30 PM'
  },
  {
    id: 2, client: 'Valentino', date: '2026-04-09', time: '11:00 AM',
    location: 'City Walk Studio', status: 'confirmed',
    notes: 'White background setup. 3 talking head videos.',
    driveLink: 'https://drive.google.com', rawUploaded: false, uploadedAt: ''
  },
  {
    id: 3, client: 'Hamdan Al Mansoori', date: '2026-04-10', time: '11:00 AM',
    location: 'DAMAC Model Unit, Tower B', status: 'confirmed',
    notes: 'Client bringing own outfit. Focus on interior spaces.',
    driveLink: '', rawUploaded: false, uploadedAt: ''
  },
  {
    id: 4, client: 'Sachin', date: '2026-04-12', time: '10:00 AM',
    location: 'Jumeirah Park', status: 'confirmed',
    notes: 'Outdoor shoot. Golden hour preferred.',
    driveLink: 'https://drive.google.com', rawUploaded: false, uploadedAt: ''
  },
  {
    id: 5, client: 'Ali Saleh', date: '2026-04-15', time: '2:00 PM',
    location: 'SBRe Office, Business Bay', status: 'confirmed',
    notes: 'Office tour + 2 talking head videos.',
    driveLink: 'https://drive.google.com', rawUploaded: false, uploadedAt: ''
  },
]

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CameramanView() {
  const [shoots, setShoots] = useState(initialShoots)
  const [selected, setSelected] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [driveInput, setDriveInput] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const [currentMonth] = useState(3)
  const [currentYear] = useState(2026)

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()

  function getShootsForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return shoots.filter(s => s.date === dateStr)
  }

  function markUploaded(shootId: number, link: string) {
    setShoots(shoots.map(s =>
      s.id === shootId ? { ...s, rawUploaded: true, driveLink: link, uploadedAt: new Date().toLocaleString() } : s
    ))
    setUploaded(true)
    setTimeout(() => {
      setUploaded(false)
      setShowUpload(false)
      setSelected(null)
      setDriveInput('')
    }, 2000)
  }

  const upcoming = shoots.filter(s => !s.rawUploaded)
  const completed = shoots.filter(s => s.rawUploaded)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00', fontWeight: 700, fontSize: 14 }}>B</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Ganesh — Shoot schedule</div>
            <div style={{ fontSize: 11, color: '#999' }}>BOR Studio · Cameraman</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 12, padding: '5px 14px', background: upcoming.length > 0 ? '#fff8f0' : '#f0fdf4', color: upcoming.length > 0 ? '#e67e22' : '#27ae60', borderRadius: 20, fontWeight: 500 }}>
            {upcoming.length} pending upload{upcoming.length !== 1 ? 's' : ''}
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#111' }}>G</div>
        </div>
      </div>

      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

        {/* Calendar */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>
              {months[currentMonth]} {currentYear}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {days.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#bbb', fontWeight: 600, padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayShoots = getShootsForDay(day)
                const isToday = day === 7 && currentMonth === 3
                const allUploaded = dayShoots.length > 0 && dayShoots.every(s => s.rawUploaded)
                const hasUpload = dayShoots.some(s => !s.rawUploaded)
                return (
                  <div key={day} onClick={() => dayShoots.length > 0 && setSelected(dayShoots[0])}
                    style={{
                      minHeight: 60, padding: 6, borderRadius: 8, cursor: dayShoots.length > 0 ? 'pointer' : 'default',
                      background: isToday ? '#111' : allUploaded ? '#f0fdf4' : hasUpload ? '#fff8f0' : '#fafafa',
                      border: hasUpload ? '1px solid #fde8cc' : allUploaded ? '1px solid #bbf7d0' : '1px solid #eee',
                    }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: isToday ? '#fff' : '#111', marginBottom: 3 }}>{day}</div>
                    {dayShoots.map(s => (
                      <div key={s.id} style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: s.rawUploaded ? '#27ae6022' : '#e67e2222', color: s.rawUploaded ? '#27ae60' : '#e67e22', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {s.client.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, padding: '0 4px' }}>
            {[['#e67e22', 'Raw not uploaded'], ['#27ae60', 'Raw uploaded'], ['#111', 'Today']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>
                <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Upcoming shoots needing upload */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 12 }}>
              Needs raw upload
              {upcoming.length > 0 && <span style={{ marginLeft: 8, fontSize: 10, background: '#fff8f0', color: '#e67e22', padding: '2px 7px', borderRadius: 20 }}>{upcoming.length}</span>}
            </div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 13, color: '#27ae60', textAlign: 'center', padding: '12px 0' }}>All shoots uploaded ✓</div>
            ) : (
              upcoming.map(shoot => (
                <div key={shoot.id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }} onClick={() => setSelected(shoot)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{shoot.client}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{shoot.date} · {shoot.time}</div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>{shoot.location}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setSelected(shoot); setShowUpload(true) }}
                      style={{ fontSize: 11, padding: '4px 10px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Upload raw
                    </button>
                  </div>
                  {shoot.notes && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#888', background: '#f9f9f9', padding: '5px 8px', borderRadius: 6 }}>
                      {shoot.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Completed */}
          {completed.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 12 }}>Uploaded</div>
              {completed.map(shoot => (
                <div key={shoot.id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{shoot.client}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{shoot.date} · {shoot.time}</div>
                      {shoot.uploadedAt && <div style={{ fontSize: 10, color: '#27ae60', marginTop: 2 }}>Uploaded {shoot.uploadedAt}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#27ae60' }}>Done</span>
                      {shoot.driveLink && (
                        <a href={shoot.driveLink} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: '#2980b9', textDecoration: 'none' }}>
                          View folder →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shoot detail modal */}
      {selected && !showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>{selected.client}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{selected.date} · {selected.time}</div>
            {[
              ['Location', selected.location || '—'],
              ['Status', selected.rawUploaded ? 'Raw uploaded' : 'Raw not uploaded'],
              ['Uploaded at', selected.uploadedAt || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ color: '#888' }}>{label}</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            {selected.notes && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#f9f9f9', borderRadius: 8, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: '#111', marginBottom: 4, fontSize: 11 }}>Notes from admin</div>
                {selected.notes}
              </div>
            )}
            {selected.driveLink && (
              <a href={selected.driveLink} target="_blank" rel="noreferrer"
                style={{ display: 'block', marginTop: 14, padding: '9px', textAlign: 'center', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#111', textDecoration: 'none' }}>
                Open Drive folder →
              </a>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {!selected.rawUploaded && (
                <button onClick={() => setShowUpload(true)}
                  style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                  Upload raw footage
                </button>
              )}
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: '9px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420 }}>
            {uploaded ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#27ae60', marginBottom: 6 }}>Raw footage uploaded</div>
                <div style={{ fontSize: 13, color: '#888' }}>Fahad and Divyansh have been notified.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>Upload raw footage</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{selected.client} · {selected.date} · {selected.time}</div>

                {selected.notes && (
                  <div style={{ padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, color: '#111', marginBottom: 4, fontSize: 11 }}>Shoot notes</div>
                    {selected.notes}
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Google Drive folder link</div>
                  <input
                    value={driveInput}
                    onChange={e => setDriveInput(e.target.value)}
                    placeholder="Paste Drive folder link here..."
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: 10, fontSize: 13, color: '#111', outline: 'none' }}
                  />
                </div>

                <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: 10, border: '2px dashed #eee', textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Upload files directly</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginBottom: 10 }}>MP4, MOV, footage folders</div>
                  <button style={{ fontSize: 12, padding: '7px 18px', background: '#fff', border: '1px solid #ddd', borderRadius: 8, color: '#555', cursor: 'pointer' }}>
                    Choose files
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowUpload(false); setDriveInput('') }}
                    style={{ flex: 1, padding: '10px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => markUploaded(selected.id, driveInput)}
                    disabled={!driveInput.trim()}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: driveInput.trim() ? '#111' : '#ccc', color: '#fff', fontSize: 13, cursor: driveInput.trim() ? 'pointer' : 'default', fontWeight: 500 }}>
                    Mark as uploaded
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}