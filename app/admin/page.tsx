'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 })
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const channel = supabase.channel('agency_alerts').on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications' 
    }, () => {
      loadDashboardData()
    }).subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadDashboardData() {
    const { data: vids } = await supabase.from('videos').select('status')
    const { data: notifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10)
    
    if (vids) {
      setStats({
        active: vids.filter(v => v.status === 'editing' || v.status === 'shoot_done').length,
        pending: vids.filter(v => v.status === 'internal_review' || v.status === 'client_review').length,
        completed: vids.filter(v => v.status === 'approved').length
      })
    }
    if (notifs) setNotifications(notifs)
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    loadDashboardData()
  }

  return (
    <>
      <style>{`
        .page-header { height: 76px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: transparent; position: sticky; top: 0; z-index: 50; }
        .stat-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 32px; flex: 1; position: relative; overflow: hidden; transition: border-color 0.2s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
        .stat-card:hover { border-color: #333344; }
        .stat-glow { position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; filter: blur(50px); opacity: 0.12; }
        .notif-panel { position: absolute; top: 50px; right: 0; width: 360px; background: rgba(14, 14, 17, 0.95); backdrop-filter: blur(16px); border: 1px solid #1f1f2e; border-radius: 12px; z-index: 9999; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden; }
        .notif-item { padding: 16px; border-bottom: 1px solid #1f1f2e; cursor: pointer; transition: 0.2s; }
        .notif-item:hover { background: rgba(255,255,255,0.02); }
        .unread-dot { width: 8px; height: 8px; background: #D4AF37; border-radius: 50%; display: inline-block; margin-right: 8px; }
      `}</style>

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Agency Overview</h1>
        
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: '#0e0e11', border: '1px solid #1f1f2e', color: '#e4e4e7', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, transition: '0.2s' }}>
            <span>🔔</span> Notifications {notifications.some(n => !n.is_read) && <span style={{ width: 6, height: 6, background: '#D4AF37', borderRadius: '50%' }}></span>}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f1f2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Alerts</span>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>Close</button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#71717a', fontSize: 13 }}>No recent activity.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="notif-item" onClick={() => markAsRead(n.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        {!n.is_read && <span className="unread-dot"></span>}
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: '#52525b', marginTop: 8 }}>{new Date(n.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 40px', maxWidth: 1200 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#D4AF37' }}></div>
            <div style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Production</div>
            <div style={{ fontSize: 44, fontWeight: 600, color: '#fafafa', marginTop: 12, letterSpacing: '-0.02em' }}>{stats.active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#a1a1aa' }}></div>
            <div style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Review</div>
            <div style={{ fontSize: 44, fontWeight: 600, color: '#fafafa', marginTop: 12, letterSpacing: '-0.02em' }}>{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#ffffff' }}></div>
            <div style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Deliveries</div>
            <div style={{ fontSize: 44, fontWeight: 600, color: '#fafafa', marginTop: 12, letterSpacing: '-0.02em' }}>{stats.completed}</div>
          </div>
        </div>

        <div style={{ background: '#0e0e11', border: '1px solid #1f1f2e', borderRadius: 12, padding: 60, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em' }}>Production Timeline Visualization</div>
          <div style={{ fontSize: 14, color: '#a1a1aa', marginTop: 8 }}>Visualizing workflow efficiency and turnaround times.</div>
        </div>
      </div>
    </>
  )
}