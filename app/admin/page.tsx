'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import SidebarProfile from '@/components/SidebarProfile'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ active: 0, awaitingClient: 0, revisions: 0, shootsThisWeek: 0, doneThisMonth: 0 })
  const [reminders, setReminders] = useState<any[]>([])
  const [pipeline, setPipeline] = useState<any[]>([])
  const [editors, setEditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('dashboard')

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

      const lanes = ['shoot_done', 'editing', 'internal_review', 'client_review', 'approved']
      const laneConfig: Record<string, { label: string, color: string }> = {
        shoot_done: { label: 'Shoot done', color: '#888' },
        editing: { label: 'Editing', color: '#e67e22' },
        internal_review: { label: 'Internal review', color: '#2980b9' },
        client_review: { label: 'Client review', color: '#8e44ad' },
        approved: { label: 'Approved', color: '#27ae60' },
      }
      setPipeline(lanes.map(status => ({
        id: status, ...laneConfig[status],
        cards: videos.filter(v => v.status === status).map(v => ({
          id: v.id, client: v.clients?.name || '—', title: v.title,
          editor: v.users?.name || 'Unassigned',
          urgent: v.deadline && new Date(v.deadline) < new Date(),
        }))
      })))

      const reminderList: any[] = []
      videos.filter(v => v.status === 'client_review').forEach(v => {
        const days = Math.floor((new Date().getTime() - new Date(v.updated_at || v.created_at).getTime()) / 86400000)
        if (days >= 2) reminderList.push({ type: 'warn', text: `${v.clients?.name} — video in review for ${days} days`, sub: 'Chase up via WhatsApp', time: 'Today' })
      })
      if (shoots) {
        shoots.filter(s => s.status === 'pending').forEach(s => {
          reminderList.push({ type: 'alert', text: `${s.clients?.name} shoot request — needs reply`, sub: `Requested ${s.date} ${s.time}`, time: 'Now' })
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

  const reminderColors: Record<string, string> = {
    alert: '#e74c3c', warn: '#e67e22', info: '#2980b9', ok: '#27ae60'
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin' },
    { id: 'pipeline', label: 'Pipeline', href: '/admin/pipeline' },
    { id: 'shoots', label: 'Shoot calendar', href: '/admin/shoots' },
    { id: 'editors', label: 'Editors', href: '/admin/editors' },
    { id: 'clients', label: 'Clients', href: '/admin/clients' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f5f5f5' }}>

      {/* Sidebar */}
      <div style={{ width: 200, background: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#111', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00', fontWeight: 700, fontSize: 13 }}>B</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>BOR Studio</div>
            <div style={{ fontSize: 10, color: '#999' }}>Agency OS</div>
          </div>
        </div>
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {navItems.map(item => (
            <a key={item.id} href={item.href}
              onClick={() => setActiveNav(item.id)}
              style={{
                display: 'block', padding: '8px 20px', fontSize: 13,
                color: activeNav === item.id ? '#111' : '#888',
                fontWeight: activeNav === item.id ? 600 : 400,
                textDecoration: 'none',
                borderLeft: activeNav === item.id ? '2px solid #111' : '2px solid transparent',
                background: activeNav === item.id ? '#f5f5f5' : 'transparent',
              }}>
              {item.label}
            </a>
          ))}
        </nav>
        
        {/* ADDED SIDEBAR PROFILE COMPONENT HERE */}
        <SidebarProfile />
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Dashboard</div>
          <a href="/admin/pipeline" style={{ fontSize: 12, padding: '6px 16px', background: '#111', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
            + Add video
          </a>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#bbb', fontSize: 14 }}>
            Loading...
          </div>
        ) : (
          <div style={{ padding: 24 }}>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Active videos', value: stats.active, sub: 'across all clients' },
                { label: 'Awaiting client', value: stats.awaitingClient, sub: 'avg 2 days waiting', color: '#5B4FD4' },
                { label: 'Revisions open', value: stats.revisions, sub: 'back with editors', color: '#c0392b' },
                { label: 'Shoots this week', value: stats.shootsThisWeek, sub: 'confirmed + pending' },
                { label: 'Done this month', value: stats.doneThisMonth, sub: 'approved', color: '#27ae60' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: (s as any).color || '#111', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pipeline + Right panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 24 }}>

              {/* Pipeline preview */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Pipeline
                  <a href="/admin/pipeline" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>View all →</a>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {pipeline.map(lane => (
                    <div key={lane.id} style={{ background: '#f5f5f5', borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: lane.color, display: 'inline-block' }}></span>
                        {lane.label}
                      </div>
                      {lane.cards.slice(0, 3).map((card: any) => (
                        <div key={card.id} style={{ background: '#fff', border: card.urgent ? '1px solid #e74c3c' : '1px solid #eee', borderLeft: card.urgent ? '3px solid #e74c3c' : '3px solid transparent', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                          <div style={{ fontSize: 10, color: '#bbb', marginBottom: 2 }}>{card.client}</div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: '#111', lineHeight: 1.35, marginBottom: 5 }}>{card.title}</div>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: '#f5f5f5', color: '#666' }}>{card.editor}</span>
                        </div>
                      ))}
                      {lane.cards.length > 3 && (
                        <div style={{ fontSize: 10, color: '#bbb', textAlign: 'center', padding: '4px 0' }}>+{lane.cards.length - 3} more</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminders + Editors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Reminders</div>
                  {reminders.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#bbb', padding: '12px 0' }}>No reminders today</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {reminders.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#fff', border: '1px solid #eee', borderRadius: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: reminderColors[r.type] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: reminderColors[r.type] }}></div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{r.text}</div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{r.sub}</div>
                          </div>
                          <div style={{ fontSize: 10, color: '#bbb' }}>{r.time}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Editor workload</div>
                  {editors.map(e => {
                    const pct = Math.min(Math.round((e.taskCount / 8) * 100), 100)
                    const color = e.taskCount <= 4 ? '#27ae60' : e.taskCount <= 6 ? '#e67e22' : '#e74c3c'
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#111', flexShrink: 0 }}>
                          {e.name[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#111', marginBottom: 3 }}>{e.name}</div>
                          <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                            <div style={{ height: 4, width: `${pct}%`, background: color, borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color, fontWeight: 500 }}>{e.taskCount}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}