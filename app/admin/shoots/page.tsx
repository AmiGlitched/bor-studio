'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function ShootsCalendar() {
  const [shoots, setShoots] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newShoot, setNewShoot] = useState({ client_id: '', date: '', time: '', location: '', notes: '', drive_upload_link: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: shootData } = await supabase.from('shoots').select('*, clients(name)').order('date')
    const { data: clientData } = await supabase.from('clients').select('*')
    if (shootData) setShoots(shootData)
    if (clientData) setClients(clientData)
    setLoading(false)
  }

  async function confirmShoot(id: string) {
    await supabase.from('shoots').update({ status: 'confirmed' }).eq('id', id)
    await loadData()
    setSelected(null)
  }

  async function addShoot() {
    if (!newShoot.client_id || !newShoot.date || !newShoot.time) return
    await supabase.from('shoots').insert({
      client_id: newShoot.client_id,
      date: newShoot.date,
      time: newShoot.time,
      location: newShoot.location,
      notes: newShoot.notes,
      drive_upload_link: newShoot.drive_upload_link,
      status: 'confirmed',
      raw_uploaded: false,
    })
    setNewShoot({ client_id: '', date: '', time: '', location: '', notes: '', drive_upload_link: '' })
    setShowAdd(false)
    await loadData()
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()

  function getShootsForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return shoots.filter(s => s.date === dateStr)
  }

  const statusColors: Record<string, string> = { confirmed: '#27ae60', pending: '#e67e22', cancelled: '#e74c3c' }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Dashboard</a>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Shoot calendar</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ fontSize: 12, padding: '6px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>+ Add shoot</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#bbb', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Calendar */}
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }}
                style={{ padding: '6px 12px', border: '1px solid #eee', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>←</button>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{months[currentMonth]} {currentYear}</div>
              <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }}
                style={{ padding: '6px 12px', border: '1px solid #eee', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>→</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {daysOfWeek.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#bbb', fontWeight: 600, padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayShoots = getShootsForDay(day)
                const today = new Date()
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
                return (
                  <div key={day} onClick={() => dayShoots.length > 0 && setSelected(dayShoots[0])}
                    style={{ minHeight: 64, padding: 6, borderRadius: 8, background: isToday ? '#111' : dayShoots.length > 0 ? '#f0fdf4' : '#fafafa', border: dayShoots.some(s => s.status === 'pending') ? '1px solid #e67e22' : '1px solid #eee', cursor: dayShoots.length > 0 ? 'pointer' : 'default' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: isToday ? '#fff' : '#111', marginBottom: 4 }}>{day}</div>
                    {dayShoots.map(s => (
                      <div key={s.id} style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: statusColors[s.status] + '22', color: statusColors[s.status], marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {s.clients?.name?.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Upcoming */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 12 }}>Upcoming shoots</div>
              {shoots.filter(s => s.status === 'confirmed').slice(0, 5).map(s => (
                <div key={s.id} onClick={() => setSelected(s)} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{s.clients?.name}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{s.date} · {s.time}</div>
                      <div style={{ fontSize: 11, color: '#bbb' }}>{s.location}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#27ae60', alignSelf: 'flex-start' }}>Confirmed</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending requests */}
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 12 }}>
                Pending requests
                {shoots.filter(s => s.status === 'pending').length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 10, background: '#fef3f2', color: '#e74c3c', padding: '2px 7px', borderRadius: 20 }}>
                    {shoots.filter(s => s.status === 'pending').length}
                  </span>
                )}
              </div>
              {shoots.filter(s => s.status === 'pending').length === 0 ? (
                <div style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '12px 0' }}>No pending requests</div>
              ) : (
                shoots.filter(s => s.status === 'pending').map(s => (
                  <div key={s.id} style={{ padding: 12, background: '#fafafa', borderRadius: 10, marginBottom: 8, border: '1px solid #eee' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 2 }}>{s.clients?.name}</div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{s.date} · {s.time}</div>
                    {s.notes && <div style={{ fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 1.5 }}>{s.notes}</div>}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => confirmShoot(s.id)} style={{ flex: 1, padding: '6px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Confirm</button>
                      <button style={{ flex: 1, padding: '6px', background: '#fff', color: '#888', border: '1px solid #eee', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Suggest time</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>{selected.clients?.name}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{selected.date} · {selected.time}</div>
            {[['Location', selected.location || '—'], ['Status', selected.status], ['Notes', selected.notes || '—'], ['Raw uploaded', selected.raw_uploaded ? 'Yes' : 'No']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ color: '#888' }}>{l}</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {selected.drive_upload_link && (
              <a href={selected.drive_upload_link} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 14, padding: '8px', textAlign: 'center', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#111', textDecoration: 'none' }}>
                Open Drive folder →
              </a>
            )}
            {selected.status === 'pending' && (
              <button onClick={() => confirmShoot(selected.id)} style={{ width: '100%', marginTop: 12, padding: '9px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                Confirm shoot
              </button>
            )}
            <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 8, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Add shoot modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>Add shoot</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Client</div>
              <select value={newShoot.client_id} onChange={e => setNewShoot({ ...newShoot, client_id: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {[
              { label: 'Date', key: 'date', type: 'date', placeholder: '' },
              { label: 'Time', key: 'time', type: 'text', placeholder: 'e.g. 2:00 PM' },
              { label: 'Location', key: 'location', type: 'text', placeholder: 'e.g. DAMAC Lagoons' },
              { label: 'Drive folder link', key: 'drive_upload_link', type: 'text', placeholder: 'Paste Drive link...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{f.label}</div>
                <input type={f.type} value={(newShoot as any)[f.key]} onChange={e => setNewShoot({ ...newShoot, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Notes</div>
              <textarea value={newShoot.notes} onChange={e => setNewShoot({ ...newShoot, notes: e.target.value })}
                placeholder="Notes for Ganesh..."
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none', height: 70, resize: 'none', fontFamily: 'system-ui' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={addShoot} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Add shoot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}