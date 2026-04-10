'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Subscribe to new notifications
    const channel = supabase.channel('notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
      loadNotifications()
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadNotifications() {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10)
    if (data) setNotifications(data)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>
        🔔 {notifications.some(n => !n.is_read) && <span style={{ color: '#E84393' }}>•</span>}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: 40, right: 0, width: 300, background: '#111', border: '1px solid #333', borderRadius: 12, zIndex: 100, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid #222', paddingBottom: 8 }}>Activity Alerts</div>
          {notifications.map(n => (
            <div key={n.id} style={{ fontSize: 12, padding: '8px 0', borderBottom: '1px solid #222' }}>
              <div style={{ fontWeight: 600 }}>{n.title}</div>
              <div style={{ color: '#aaa' }}>{n.message}</div>
            </div>
          ))}
          <button onClick={() => setIsOpen(false)} style={{ width: '100%', marginTop: 12, fontSize: 11, color: '#7B61FF', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
        </div>
      )}
    </div>
  )
}   