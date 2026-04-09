'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Upgraded Brand Status Colors
const statusConfig: Record<string, { label: string, bg: string, text: string, border: string }> = {
  editing: { label: 'Editing', bg: 'rgba(232, 67, 147, 0.1)', text: '#E84393', border: '#E84393' },
  internal_review: { label: 'Internal Review', bg: 'rgba(74, 144, 226, 0.1)', text: '#4A90E2', border: '#4A90E2' },
  client_review: { label: 'With Client', bg: 'rgba(123, 97, 255, 0.1)', text: '#7B61FF', border: '#7B61FF' },
  approved: { label: 'Approved', bg: 'rgba(0, 208, 132, 0.1)', text: '#00D084', border: '#00D084' },
  shoot_done: { label: 'Shoot Done', bg: 'rgba(136, 136, 136, 0.1)', text: '#a0a0b0', border: '#888' },
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
        
        const activeTasks = tasks?.filter(t => t.status !== 'approved') || []
        const doneTasks = tasks?.filter(t => t.status === 'approved') || []

        return { ...e, activeTasks, doneTasks }
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
    if (count <= 4) return { label: 'Optimal', color: '#00D084', width: Math.round((count / 8) * 100) }
    if (count <= 6) return { label: 'Heavy', color: '#F5A623', width: Math.round((count / 8) * 100) }
    return { label: 'Overloaded', color: '#E84393', width: 100 }
  }

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .editor-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 20px;
        }
        .task-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;
        }
        .task-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: #4A90E2; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 24px; width: 100%; max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .dark-input {
          width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle); border-radius: 8px;
          color: #fff; font-size: 13px; outline: none; transition: border 0.2s;
        }
        .dark-input:focus { border-color: #7B61FF; background: rgba(0,0,0,0.4); }
        .reassign-btn {
          padding: 8px 12px; border: 1px solid var(--border-subtle); border-radius: 8px;
          background: rgba(0,0,0,0.2); color: #fff; font-size: 13px; cursor: pointer;
          transition: all 0.2s; flex: 1; text-align: center;
        }
        .reassign-btn:hover { background: rgba(74, 144, 226, 0.1); border-color: #4A90E2; color: #4A90E2; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Editor Capacity & Routing</div>
        <button onClick={() => setShowAssign(true)} style={{ padding: '8px 20px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
          + Assign Task
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-secondary)', fontSize: 14 }}>Syncing team data...</div>
      ) : (
        <div style={{ padding: '24px 32px' }}>
          
          {/* Editor Capacity KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
            {editors.map(editor => {
              const load = getLoad(editor.activeTasks.length)
              return (
                <div key={editor.id} className="editor-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                      {editor.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{editor.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{editor.activeTasks.length}</span> Active · <span style={{ color: '#fff', fontWeight: 600 }}>{editor.doneTasks.length}</span> Done
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: load.color + '18', color: load.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{load.label}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${load.width}%`, background: load.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active Tasks Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            {editors.map(editor => (
              <div key={editor.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4A90E2' }}></div>
                  {editor.name.split(' ')[0]}'s Queue
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {editor.activeTasks.length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '24px 0', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px dashed var(--border-subtle)' }}>Clear queue.</div>
                  )}
                  {editor.activeTasks.map((task: any) => {
                    const sc = statusConfig[task.status] || statusConfig.editing
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date()
                    const openRevision = task.revisions?.find((r: any) => !r.resolved)
                    const borderColor = openRevision ? '#F5A623' : isOverdue ? '#E84393' : sc.border;

                    return (
                      <div key={task.id} onClick={() => setSelected({ ...task, editorId: editor.id, editorName: editor.name })} className="task-card" style={{ borderLeft: `3px solid ${borderColor}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{task.clients?.name}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{task.title}</div>
                          </div>
                          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: 'nowrap', marginLeft: 12, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                          <span style={{ fontSize: 11, color: isOverdue ? '#E84393' : 'var(--text-secondary)', fontWeight: isOverdue ? 600 : 400 }}>
                            {isOverdue ? '⚠️ Overdue: ' : 'Target: '}
                            {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'No date'}
                          </span>
                          {openRevision && <span style={{ fontSize: 10, color: '#F5A623', background: 'rgba(245, 166, 35, 0.1)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>Needs Revision</span>}
                        </div>
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
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, color: '#7B61FF', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selected.clients?.name}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>{selected.title}</div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
              {[['Current Editor', selected.editorName], ['Deadline', selected.deadline || 'None Set'], ['Drive link', selected.drive_link ? 'Available' : 'Missing']].map(([l, v], i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: i === 2 ? '8px 0 0' : '8px 0', borderBottom: i === 2 ? 'none' : '1px solid var(--border-subtle)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{v as string}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Reassign to:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {editors.filter(e => e.id !== selected.editorId).map(e => (
                  <button key={e.id} onClick={() => reassign(selected.id, e.id)} className="reassign-btn">
                    {e.name}
                  </button>
                ))}
                {editors.filter(e => e.id !== selected.editorId).length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No other editors available.</div>
                )}
              </div>
            </div>

            <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Assign task modal */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Issue New Task</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Editor</div>
                <select value={newTask.editorId} onChange={e => setNewTask({ ...newTask, editorId: e.target.value })} className="dark-input">
                  {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Client</div>
                <select value={newTask.client_id} onChange={e => setNewTask({ ...newTask, client_id: e.target.value })} className="dark-input">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {[
              { label: 'Video title', key: 'title', type: 'text', placeholder: 'e.g. DAMAC Lagoons tour' },
              { label: 'Deadline', key: 'deadline', type: 'date', placeholder: '' },
              { label: 'Raw Footage Link (Google Drive)', key: 'drive_link', type: 'text', placeholder: 'Paste URL...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{f.label}</div>
                <input type={f.type} value={(newTask as any)[f.key]} onChange={e => setNewTask({ ...newTask, [f.key]: e.target.value })}
                  placeholder={f.placeholder} className="dark-input" />
              </div>
            ))}
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowAssign(false)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={addTask} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--primary-gradient)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>Dispatch Task</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}