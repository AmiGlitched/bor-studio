'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientShoots() {
  const [shoots, setShoots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newShoot, setNewShoot] = useState({ date: '', location: '', brief: '' })

  useEffect(() => { loadShoots() }, [])

  async function loadShoots() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()
    
    if (profile) {
      const { data } = await supabase
        .from('shoots')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('date', { ascending: true })
      if (data) setShoots(data)
    }
    setLoading(false)
  }

  async function handleRequestShoot() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()

    if (profile) {
      await supabase.from('shoots').insert({
        client_id: profile.client_id,
        date: newShoot.date,
        location: newShoot.location,
        brief: newShoot.brief,
        status: 'requested'
      })
      setShowModal(false)
      loadShoots()
    }
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .shoot-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
        .shoot-card:hover { transform: translateY(-2px); border-color: #4A90E2; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .action-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.03); color: #fff; transition: all 0.2s; }
        .action-btn:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
        .action-btn.primary { background: var(--primary-gradient); border: none; box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3); }
        .dark-input { width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 13px; outline: none; margin-bottom: 16px; }
        .dark-input:focus { border-color: #7B61FF; }
        .status-badge { font-size: 10px; padding: 4px 10px; border-radius: 20px; font-weight: 700; text-transform: uppercase; }
      `}</style>

      {/* Header */}
      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Production Shoots</div>
        <button onClick={() => setShowModal(true)} className="action-btn primary">Request New Shoot</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>Syncing shoot schedule...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shoots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>No shoots scheduled yet</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Request your first production date using the button above.</div>
              </div>
            ) : (
              shoots.map(shoot => (
                <div key={shoot.id} className="shoot-card">
                  <div>
                    <div style={{ fontSize: 11, color: '#7B61FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                      {new Date(shoot.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{shoot.location}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{shoot.brief || 'No brief provided'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="status-badge" style={{ 
                      background: shoot.status === 'confirmed' ? 'rgba(0, 208, 132, 0.1)' : 'rgba(245, 166, 35, 0.1)', 
                      color: shoot.status === 'confirmed' ? '#00D084' : '#F5A623' 
                    }}>
                      {shoot.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FIXED MODAL: The error was z-index -> zIndex */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Schedule a Shoot</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Select your preferred date and tell us the location.</p>
            
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 6 }}>Preferred Date</div>
            <input type="date" className="dark-input" value={newShoot.date} onChange={e => setNewShoot({...newShoot, date: e.target.value})} />
            
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 6 }}>Location</div>
            <input type="text" placeholder="e.g. Downtown Studio or Client HQ" className="dark-input" value={newShoot.location} onChange={e => setNewShoot({...newShoot, location: e.target.value})} />
            
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 6 }}>Brief / Notes</div>
            <textarea placeholder="Any specific requirements for this shoot?" className="dark-input" style={{ minHeight: 100, resize: 'none' }} value={newShoot.brief} onChange={e => setNewShoot({...newShoot, brief: e.target.value})} />

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} className="action-btn" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleRequestShoot} className="action-btn primary" style={{ flex: 1 }}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}