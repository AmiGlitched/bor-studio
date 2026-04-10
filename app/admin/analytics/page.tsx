'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminAnalytics() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('week') // 'day', 'week', 'month'

  useEffect(() => { loadAnalytics() }, [filter])

  async function loadAnalytics() {
    // Logic to fetch logs and filter by date range
    const { data } = await supabase.from('activity_logs').select('*, users(name), videos(title)')
    if (data) setLogs(data)
  }

  return (
    <div style={{ padding: 40, color: '#fff' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Production Performance</h1>
      
      {/* Performance Bar (CSS Based) */}
      <div style={{ background: '#111', padding: 24, borderRadius: 20, marginBottom: 32, border: '1px solid #333' }}>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>Weekly Efficiency</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150 }}>
          {[60, 80, 45, 90, 100, 70, 85].map((h, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--primary-gradient)', height: `${h}%`, borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
          ))}
        </div>
      </div>

      {/* Data Sheet */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0a0a0f', borderRadius: 16, overflow: 'hidden' }}>
        <thead style={{ background: '#16161e', textAlign: 'left' }}>
          <tr>
            <th style={{ padding: 16 }}>Editor</th>
            <th style={{ padding: 16 }}>Action</th>
            <th style={{ padding: 16 }}>Video</th>
            <th style={{ padding: 16 }}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: 16 }}>{log.users?.name}</td>
              <td style={{ padding: 16, color: '#7B61FF' }}>{log.action_type.replace(/_/g, ' ')}</td>
              <td style={{ padding: 16 }}>{log.videos?.title}</td>
              <td style={{ padding: 16, color: '#aaa' }}>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}