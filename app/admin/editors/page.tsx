'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const statusConfig: Record<string, { label: string, bg: string, text: string }> = {
  editing: { label: 'Editing', bg: '#fff8f0', text: '#e67e22' },
  internal_review: { label: 'Internal review', bg: '#eff6ff', text: '#2980b9' },
  client_review: { label: 'With client', bg: '#f5f3ff', text: '#8e44ad' },
  approved: { label: 'Approved', bg: '#f0fdf4', text: '#27ae60' },
  shoot_done: { label: 'Shoot done', bg: '#f5f5f5', text: '#888' },
}

export default function Editors() {
  const [editors, setEditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [newTask, setNewTask] = useState({ editorId: '', client_id: '', title: '', deadline: '', drive_link: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: editorList } = await supabase.from('users').select('*').eq('role', 'editor')
    const { data: clientList } = await supabase.from('clients').select('*')
    if (editorList) {
      const editorsWithTasks = await Promise.all(editorList.map(async e => {
        const { data: tasks } = await supabase
          .from('videos')
          .select('*, clients(name), revisions(comment, resolved)')
          .eq('editor_id', e.id)
          .neq('status', 'approved')
        return { ...e, tasks: tasks || [] }
      }))
      setEditors(editorsWithTasks)
      if (editorList.length > 0) setNewTask(t => ({ ...t, editorId: editorList[0].id }))
    }
    if (clientList) setClients(clientList)
    setLoading(false)
  }

  async function reassign(videoId: string, toEditorId: string) {
    await supabase.from('videos').update({ editor_id: toEditorId }).eq('id', videoId)
    await loadData()
    setSelected(null)
  }

  async function addTask() {
    if (!newTask.client_id || !newTask.title || !newTask.editorId) return
    await supabase.from('videos').insert({
      title: newTask.title, client_id: newTask.client_id,
      editor_id: newTask.editorId, status: 'editing',
      deadline: newTask.deadline || null, drive_link: newTask.drive_link,
      type: 'reel',
    })
    setShowAssign(false)
    await loadData()
  }

  function getLoad(count: number) {
    if (count <= 4) return { label: 'Good', color: '#27ae60', width: Math.round((count / 8) * 100) }
    if (count <= 6) return { label: 'Busy', color: '#e67e22', width: Math.round((count / 8) * 100) }
    return { label: 'At capacity', color: '#e74c3c', width: 100 }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Dashboard</a>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Editors</div>
        </div>
        <button onClick={() => setShowAssign(true)} style={{ fontSize: 12, padding: '6px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>+ Assign task</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#bbb', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
            {editors.map(editor => {
              const load = getLoad(editor.tasks.length)
              return (
                <div key={editor.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#27ae60' }}>
                      {editor.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{editor.name}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{editor.tasks.length} active tasks</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: load.color + '18', color: load.color, fontWeight: 500 }}>{load.label}</span>
                  </div>
                  <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${load.width}%`, background: load.color, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {editors.map(editor => (
              <div key={editor.id}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>{editor.name}'s tasks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {editor.tasks.length === 0 && (
                    <div style={{ fontSize: 13, color: '#bbb', padding: '20px', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>No active tasks</div>
                  )}
                  {editor.tasks.map((task: any) => {
                    const sc = statusConfig[task.status] || statusConfig.editing
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date()
                    const openRevision = task.revisions?.find((r: any) => !r.resolved)
                    return (
                      <div key={task.id} onClick={() => setSelected({ ...task, editorId: editor.id, editorName: editor.name })}
                        style={{ background: '#fff', border: openRevision ? '1px solid #e67e22' : '1px solid #eee', borderLeft: openRevision ? '3px solid #e67e22' : isOverdue ? '3px solid #e74c3c' : '3px solid transparent', borderRadius: 10, padding: '12px 14px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#bbb', marginBottom: 2 }}>{task.clients?.name}</div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{task.title}</div>
                          </div>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: 'nowrap', marginLeft: 8 }}>{sc.label}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: isOverdue ? '#e74c3c' : '#bbb' }}>{isOverdue ? 'Overdue · ' : 'Due · '}{task.deadline || '—'}</span>
                        </div>
                        {openRevision && (
                          <div style={{ marginTop: 8, padding: '6px 10px', background: '#fff8f0', borderRadius: 6, fontSize: 11, color: '#e67e22' }}>
                            Revision: {openRevision.comment}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{selected.clients?.name} · {selected.editorName}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 16 }}>{selected.title}</div>
            {[['Deadline', selected.deadline || '—'], ['Drive link', selected.drive_link || '—']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ color: '#888' }}>{l}</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Reassign to:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {editors.filter(e => e.id !== selected.editorId).map(e => (
                  <button key={e.id} onClick={() => reassign(selected.id, e.id)}
                    style={{ flex: 1, padding: '7px', border: '1px solid #eee', borderRadius: 8, background: '#f9f9f9', fontSize: 13, cursor: 'pointer', color: '#111' }}>
                    → {e.name}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 12, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Assign task modal */}
      {showAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>Assign task</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Editor</div>
              <select value={newTask.editorId} onChange={e => setNewTask({ ...newTask, editorId: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Client</div>
              <select value={newTask.client_id} onChange={e => setNewTask({ ...newTask, client_id: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {[
              { label: 'Video title', key: 'title', type: 'text', placeholder: 'e.g. DAMAC Lagoons tour' },
              { label: 'Deadline', key: 'deadline', type: 'date', placeholder: '' },
              { label: 'Google Drive link', key: 'drive_link', type: 'text', placeholder: 'Paste Drive link...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{f.label}</div>
                <input type={f.type} value={(newTask as any)[f.key]} onChange={e => setNewTask({ ...newTask, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setShowAssign(false)} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={addTask} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}