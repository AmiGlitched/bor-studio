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
    // Real-time listener for new alerts
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
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #222; position: sticky; top: 0; zIndex: 50; }
        .stat-card { background: #111; border: 1px solid #222; border-radius: 20px; padding: 24px 32px; flex: 1; position: relative; overflow: hidden; }
        .stat-glow { position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; filter: blur(40px); opacity: 0.1; }
        .notif-panel { position: absolute; top: 70px; right: 32px; width: 350px; background: #0a0a0f; border: 1px solid #333; border-radius: 20px; zIndex: 1000; box-shadow: 0 30px 60px rgba(0,0,0,0.8); overflow: hidden; }
        .notif-item { padding: 16px; border-bottom: 1px solid #1a1a22; cursor: pointer; transition: 0.2s; }
        .notif-item:hover { background: rgba(255,255,255,0.03); }
        .unread-dot { width: 8px; height: 8px; background: #E84393; borderRadius: 50%; display: inline-block; margin-right: 8px; }
      `}</style>

      {/* Header */}
      <div className="glass-header" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Agency Overview</div>
        
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
            🔔 Notifications {notifications.some(n => !n.is_read) && <span style={{ width: 8, height: 8, background: '#E84393', borderRadius: '50%' }}></span>}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>Live Alerts</span>
                <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>Close</button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#666', fontSize: 13 }}>No recent activity.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="notif-item" onClick={() => markAsRead(n.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        {!n.is_read && <span className="unread-dot"></span>}
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#7B61FF' }}>{n.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: '#444', marginTop: 8 }}>{new Date(n.created_at).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
        {/* Metric Cards */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#E84393' }}></div>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase' }}>Active Production</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginTop: 8 }}>{stats.active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#7B61FF' }}></div>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase' }}>In Review</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginTop: 8 }}>{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="stat-glow" style={{ background: '#00D084' }}></div>
            <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase' }}>Approved Deliveries</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', marginTop: 8 }}>{stats.completed}</div>
          </div>
        </div>

        {/* Placeholder for the Production Timeline / Chart */}
        <div style={{ background: '#0a0a0f', border: '1px solid #222', borderRadius: 24, padding: 40, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Production Timeline Visualization</div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Visualizing workflow efficiency and turnaround times.</div>
        </div>
      </div>
    </>
  )
}