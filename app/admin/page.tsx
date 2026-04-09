'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, awaitingClient: 0, revisions: 0, shootsThisWeek: 0, doneThisMonth: 0 })
  const [reminders, setReminders] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [editors, setEditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: videos } = await supabase.from('videos').select('*, clients(name), users(name)')
    const { data: shoots } = await supabase.from('shoots').select('*, clients(name)')
    const { data: users } = await supabase.from('users').select('*').eq('role', 'editor')

    if (videos) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      setStats({
        active: videos.filter(v => v.status !== 'approved').length,
        awaitingClient: videos.filter(v => v.status === 'client_review').length,
        revisions: videos.filter(v => v.status === 'revision').length,
        shootsThisWeek: shoots ? shoots.filter(s => {
          const d = new Date(s.date)
          return d >= startOfWeek && d <= endOfWeek
        }).length : 0,
        doneThisMonth: videos.filter(v => v.status === 'approved' && new Date(v.created_at) >= startOfMonth).length,
      })

      const lanes = ['editing', 'internal_review', 'client_review', 'approved']
      const laneConfig: Record<string, { label: string, color: string, icon: string, glow: string }> = {
        editing: { label: 'Editing', color: '#E84393', icon: '✂️', glow: 'rgba(232, 67, 147, 0.15)' },
        internal_review: { label: 'Internal Review', color: '#4A90E2', icon: '🔍', glow: 'rgba(74, 144, 226, 0.15)' },
        client_review: { label: 'Client Review', color: '#7B61FF', icon: '⏳', glow: 'rgba(123, 97, 255, 0.15)' },
        approved: { label: 'Approved', color: '#00D084', icon: '✅', glow: 'rgba(0, 208, 132, 0.15)' },
      }
      
      setPipeline(lanes.map(status => ({
        id: status, ...laneConfig[status],
        cards: videos.filter(v => v.status === status).map(v => ({
          id: v.id, client: v.clients?.name || 'Unknown', title: v.title,
          editor: v.users?.name || 'Unassigned',
          deadline: v.deadline,
          urgent: v.deadline && new Date(v.deadline) < new Date(now.getTime() + 86400000 * 2), // Due within 2 days
          overdue: v.deadline && new Date(v.deadline) < now,
        }))
      })))

      const reminderList: any[] = []
      videos.filter(v => v.status === 'client_review').forEach(v => {
        const days = Math.floor((now.getTime() - new Date(v.updated_at || v.created_at).getTime()) / 86400000)
        if (days >= 2) reminderList.push({ type: 'warn', text: `${v.clients?.name} waiting ${days} days`, action: 'Chase via WhatsApp', color: '#E84393' })
      })
      if (shoots) {
        shoots.filter(s => s.status === 'pending').forEach(s => {
          reminderList.push({ type: 'alert', text: `New shoot request: ${s.clients?.name}`, action: 'Review Schedule', color: '#7B61FF' })
        })
      }
      setReminders(reminderList)
    }

    if (users) {
      const editorVideos = await Promise.all(users.map(async u => {
        const { data: vids } = await supabase.from('videos').select('id').eq('editor_id', u.id).neq('status', 'approved')
        return { ...u, taskCount: vids?.length || 0 }
      }))
      setEditors(editorVideos)
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 16px 20px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .metric-glow {
          position: absolute; top: -20px; right: -20px; width: 80px; height: 80px;
          border-radius: 50%; filter: blur(30px); opacity: 0.3; pointer-events: none;
        }
        .pipeline-lane {
          background: rgba(26, 26, 34, 0.4);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          display: flex; flex-direction: column;
          max-height: calc(100vh - 280px);
        }
        .kanban-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 14px; margin-bottom: 10px;
          cursor: pointer; position: relative;
          transition: all 0.2s ease;
        }
        .kanban-card:hover {
          border-color: #4A90E2;
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        }
        .action-btn {
          background: var(--bg-hover); border: 1px solid var(--border-subtle);
          color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 11px;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover { background: var(--primary-gradient); border-color: transparent; }
      `}</style>

      {/* Header */}
      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Command Center</div>
          <div style={{ padding: '4px 10px', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid rgba(123, 97, 255, 0.2)', borderRadius: 20, fontSize: 11, color: '#7B61FF', fontWeight: 600 }}>
            System Online
          </div>
        </div>
        <Link href="/admin/pipeline" style={{ padding: '8px 20px', background: 'var(--primary-gradient)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(232, 67, 147, 0.3)' }}>
          + New Video
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>Loading parameters...</div>
      ) : (
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Premium Top Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {[
              { label: 'Active Pipeline', value: stats.active, icon: '🎬', color: '#4A90E2' },
              { label: 'Awaiting Client', value: stats.awaitingClient, icon: '⏳', color: '#7B61FF', sub: 'Action required' },
              { label: 'Open Revisions', value: stats.revisions, icon: '🔄', color: stats.revisions > 0 ? '#E84393' : '#00D084' },
              { label: 'Shoots (Week)', value: stats.shootsThisWeek, icon: '📸', color: '#F5A623' },
              { label: 'Completed (Month)', value: stats.doneThisMonth, icon: '🚀', color: '#00D084' },
            ].map(s => (
              <div key={s.label} className="metric-card">
                <div className="metric-glow" style={{ background: s.color }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 16 }}>{s.icon}</div>
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 10, color: s.color, marginTop: 8, fontWeight: 500 }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Main Workspace Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            
            {/* Pipeline Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Active Sprints</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {pipeline.map(lane => (
                  <div key={lane.id} className="pipeline-lane">
                    {/* Lane Header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', borderRadius: '16px 16px 0 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span>{lane.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{lane.label}</span>
                        <span style={{ marginLeft: 'auto', background: lane.glow, color: lane.color, fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>{lane.cards.length}</span>
                      </div>
                      <div style={{ height: 2, width: '100%', background: 'var(--bg-hover)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '40%', background: lane.color, borderRadius: 2 }}></div>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
                      {lane.cards.map((card: any) => (
                        <div key={card.id} className="kanban-card" style={{ borderLeft: `3px solid ${card.overdue ? '#E84393' : lane.color}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.client}</div>
                            {card.overdue && <div style={{ fontSize: 9, color: '#E84393', background: 'rgba(232,67,147,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>OVERDUE</div>}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>{card.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>{card.editor[0]}</div>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{card.editor.split(' ')[0]}</span>
                            </div>
                            {card.deadline && (
                              <div style={{ fontSize: 10, color: card.urgent ? '#F5A623' : 'var(--text-secondary)' }}>
                                {new Date(card.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {lane.cards.length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 12, color: 'var(--border-subtle)' }}>No active tasks</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Intelligence & Workload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Attention Needed */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#E84393' }}>⚠️</span> Action Required
                </div>
                
                {reminders.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }}>All clear. No urgent items.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reminders.map((r, i) => (
                      <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, marginTop: 4, flexShrink: 0, boxShadow: `0 0 8px ${r.color}` }}></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, lineHeight: 1.4 }}>{r.text}</div>
                            <div style={{ marginTop: 10 }}>
                              <button className="action-btn">{r.action}</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Editor Capacity */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Team Capacity</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>Active Tasks</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {editors.map(e => {
                    const maxCapacity = 8;
                    const pct = Math.min((e.taskCount / maxCapacity) * 100, 100);
                    const isOverloaded = e.taskCount >= 6;
                    const barColor = isOverloaded ? '#E84393' : '#4A90E2';

                    return (
                      <div key={e.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 600 }}>
                              {e.name[0]}
                            </div>
                            <div style={{ fontSize: 12, color: '#fff' }}>{e.name.split(' ')[0]}</div>
                          </div>
                          <div style={{ fontSize: 11, color: isOverloaded ? '#E84393' : 'var(--text-secondary)', fontWeight: isOverloaded ? 600 : 400 }}>
                            {e.taskCount} / {maxCapacity}
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}