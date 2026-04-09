'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Shoots() {
  const [shoots, setShoots] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newShoot, setNewShoot] = useState({ client_id: '', date: '', time: '', location: '', status: 'pending' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: shootData } = await supabase.from('shoots').select('*, clients(name)').order('date', { ascending: true })
    const { data: clientData } = await supabase.from('clients').select('id, name')
    
    if (shootData) setShoots(shootData)
    if (clientData) setClients(clientData)
    setLoading(false)
  }

  async function addShoot() {
    if (!newShoot.client_id || !newShoot.date) return
    await supabase.from('shoots').insert(newShoot)
    setShowAdd(false)
    setNewShoot({ client_id: '', date: '', time: '', location: '', status: 'pending' })
    await loadData()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('shoots').update({ status }).eq('id', id)
    await loadData()
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return { bg: 'rgba(245, 166, 35, 0.1)', text: '#F5A623', border: '#F5A623' }
      case 'confirmed': return { bg: 'rgba(74, 144, 226, 0.1)', text: '#4A90E2', border: '#4A90E2' }
      case 'completed': return { bg: 'rgba(0, 208, 132, 0.1)', text: '#00D084', border: '#00D084' }
      default: return { bg: 'rgba(255,255,255,0.1)', text: '#fff', border: '#888' }
    }
  }

  const upcoming = shoots.filter(s => s.status !== 'completed' && new Date(s.date) >= new Date(new Date().setHours(0,0,0,0)))
  const past = shoots.filter(s => s.status === 'completed' || new Date(s.date) < new Date(new Date().setHours(0,0,0,0)))

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .shoot-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 12px; padding: 16px; transition: all 0.2s;
        }
        .shoot-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: #7B61FF; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 24px; width: 100%; max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .dark-input {
          width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle); border-radius: 8px;
          color: #fff; font-size: 13px; outline: none; transition: border 0.2s;
        }
        .dark-input:focus { border-color: #7B61FF; background: rgba(0,0,0,0.4); }
        .status-btn {
          background: rgba(0,0,0,0.2); border: 1px solid var(--border-subtle);
          color: var(--text-secondary); padding: 4px 10px; border-radius: 6px; font-size: 11px;
          cursor: pointer; transition: all 0.2s;
        }
        .status-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Shoot Calendar</div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 20px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
          + Schedule Shoot
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-secondary)', fontSize: 14 }}>Loading schedule...</div>
      ) : (
        <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>Upcoming & Pending ({upcoming.length})</div>
          
          {upcoming.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 32 }}>No upcoming shoots scheduled.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
              {upcoming.map(shoot => {
                const statusTheme = getStatusColor(shoot.status)
                return (
                  <div key={shoot.id} className="shoot-card" style={{ borderLeft: `3px solid ${statusTheme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: 8, textAlign: 'center', border: '1px solid var(--border-subtle)', minWidth: 80 }}>
                          <div style={{ fontSize: 11, color: '#E84393', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{new Date(shoot.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{new Date(shoot.date).getDate()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{shoot.clients?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                            <span>🕒 {shoot.time || 'TBD'}</span>
                            <span>📍 {shoot.location || 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: statusTheme.bg, color: statusTheme.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {shoot.status}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {shoot.status === 'pending' && <button onClick={() => updateStatus(shoot.id, 'confirmed')} className="status-btn">Confirm</button>}
                          {shoot.status === 'confirmed' && <button onClick={() => updateStatus(shoot.id, 'completed')} className="status-btn">Mark Done</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {past.length > 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8, opacity: 0.7 }}>Completed & Past ({past.length})</div>
              <div style={{ display: 'grid', gap: 12, opacity: 0.7 }}>
                {past.map(shoot => (
                  <div key={shoot.id} className="shoot-card" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', width: 80 }}>{new Date(shoot.date).toLocaleDateString()}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{shoot.clients?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {shoot.location}</div>
                      </div>
                      <span style={{ fontSize: 10, color: '#00D084', fontWeight: 600 }}>COMPLETED</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      )}

      {/* Schedule Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Schedule Shoot</div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Client</div>
              <select value={newShoot.client_id} onChange={e => setNewShoot({ ...newShoot, client_id: e.target.value })} className="dark-input">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Date</div>
                <input type="date" value={newShoot.date} onChange={e => setNewShoot({ ...newShoot, date: e.target.value })} className="dark-input" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Time</div>
                <input type="time" value={newShoot.time} onChange={e => setNewShoot({ ...newShoot, time: e.target.value })} className="dark-input" />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Location (Optional)</div>
              <input type="text" value={newShoot.location} onChange={e => setNewShoot({ ...newShoot, location: e.target.value })} placeholder="e.g. Marina Studio" className="dark-input" />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={addShoot} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--primary-gradient)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>Schedule</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}