'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPerformance() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [filter])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('activity_logs')
      .select('*, users(name), videos(title, created_at)')
      .order('created_at', { ascending: false })
    
    if (data) setLogs(data)
    setLoading(false)
  }

  const calculateTurnaround = (logTime: string, videoStartTime: string) => {
    const start = new Date(videoStartTime).getTime()
    const end = new Date(logTime).getTime()
    const diff = Math.abs(end - start) / 36e5 
    return diff.toFixed(1) + ' hrs'
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(10, 10, 15, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #222; position: sticky; top: 0; z-index: 50; }
      `}</style>
      
      {/* FIXED HEADER: Now inside the sticky top bar so it doesn't overlap */}
      <div className="glass-header" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Editor Performance Engine</h1>
        
        <div style={{ display: 'flex', gap: 6, background: '#111', padding: 4, borderRadius: 10, border: '1px solid #222' }}>
          {['day', 'week', 'month'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: filter === f ? '#7B61FF' : 'transparent', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 40, color: '#fff', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Output Velocity Chart */}
        <div style={{ background: '#111', padding: 32, borderRadius: 24, border: '1px solid #222', marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 32, letterSpacing: '0.05em' }}>Output Velocity</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            {[60, 40, 90, 70, 100, 50, 85, 95, 45, 75, 80, 60].map((h, i) => (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, #7B61FF, #E84393)', height: `${h}%`, borderRadius: 6, opacity: 0.8 }}></div>
            ))}
          </div>
        </div>

        {/* Data Sheet */}
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Live Production Logs</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0a0a0f', borderRadius: 20, overflow: 'hidden', border: '1px solid #222' }}>
          <thead style={{ background: '#16161e', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: 18, fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Editor</th>
              <th style={{ padding: 18, fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Activity</th>
              <th style={{ padding: 18, fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Project</th>
              <th style={{ padding: 18, fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Time Taken</th>
              <th style={{ padding: 18, fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #1a1a22' }}>
                <td style={{ padding: 18, fontWeight: 700 }}>{log.users?.name}</td>
                <td style={{ padding: 18 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: log.action_type.includes('upload') ? 'rgba(0, 208, 132, 0.1)' : 'rgba(232, 67, 147, 0.1)', color: log.action_type.includes('upload') ? '#00D084' : '#E84393' }}>
                    {log.action_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 18 }}>{log.videos?.title}</td>
                <td style={{ padding: 18, color: '#aaa' }}>{log.action_type === 'video_uploaded' ? calculateTurnaround(log.created_at, log.videos?.created_at) : '—'}</td>
                <td style={{ padding: 18, color: '#444' }}>{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}