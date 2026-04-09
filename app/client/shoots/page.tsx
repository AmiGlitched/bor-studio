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
    
    // VERCEL FIX: Explicitly capture user data
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    // STRICTOR GUARD: Use a local constant for the ID
    if (!user?.id) {
      setLoading(false)
      return
    }
    
    const userId = user.id // This is now a guaranteed string

    const { data: profile } = await supabase
      .from('users')
      .select('client_id')
      .eq('auth_id', userId)
      .single()
    
    if (profile?.client_id) {
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
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user

    if (!user?.id) {
      alert("Session expired. Please log in again.")
      return
    }

    const userId = user.id

    const { data: profile } = await supabase
      .from('users')
      .select('client_id')
      .eq('auth_id', userId)
      .single()

    if (profile?.client_id) {
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
        .page-container { max-width: 1000px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        .shoot-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; margin-bottom: 16px; }
        .shoot-card:hover { transform: translateY(-2px); border-color: #4A90E2; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        .btn { padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.03); color: #fff; }
        .btn-primary { background: var(--primary-gradient); border: none; box-shadow: 0 4px 15px rgba(123, 97, 255, 0.3); }
        .dark-input { width: 100%; padding: 14px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 12px; color: #fff; font-size: 14px; outline: none; margin-bottom: 20px; }
        .dark-input:focus { border-color: #7B61FF; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Production Shoots</div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">Request New Shoot</button>
      </div>

      <div className="page-container">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>Syncing schedule...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {shoots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80, background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>No shoots scheduled</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Request a date to get started.</div>
              </div>
            ) : (
              shoots.map(shoot => (
                <div key={shoot.id} className="shoot-card">
                  <div>
                    <div style={{ fontSize: 11, color: '#7B61FF', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                      {new Date(shoot.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{shoot.location}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{shoot.brief || 'No brief provided'}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: shoot.status === 'confirmed' ? 'rgba(0, 208, 132, 0.1)' : 'rgba(245, 166, 35, 0.1)', color: shoot.status === 'confirmed' ? '#00D084' : '#F5A623' }}>
                    {shoot.status.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 460 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Schedule Shoot</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>Tell us when and where you want to film.</p>
            
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Date</div>
            <input type="date" className="dark-input" value={newShoot.date} onChange={e => setNewShoot({...newShoot, date: e.target.value})} />
            
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Location</div>
            <input type="text" placeholder="Studio, Office, or Site name" className="dark-input" value={newShoot.location} onChange={e => setNewShoot({...newShoot, location: e.target.value})} />
            
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Creative Brief</div>
            <textarea placeholder="What are we filming?" className="dark-input" style={{ minHeight: 120, resize: 'none' }} value={newShoot.brief} onChange={e => setNewShoot({...newShoot, brief: e.target.value})} />

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleRequestShoot} className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}