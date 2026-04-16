'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  { id: 'todo', title: 'Ready for Edit', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  { id: 'in_progress', title: 'In Production', color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.1)' },
  { id: 'internal_review', title: 'Internal QA', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)' },
  { id: 'client_review', title: 'Client Review', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.1)' },
  { id: 'approved', title: 'Approved', color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' }
]

export default function PipelineBoard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Issue Task State
  const [showNewModal, setShowNewModal] = useState(false)
  const [editors, setEditors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [newTask, setNewTask] = useState({ title: '', editor_id: '', project_id: '', deadline: '', raw_footage_url: '' })

  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { 
    loadPipeline() 
    loadDropdowns()
    const channel = supabase.channel('tasks-db-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      loadPipeline() 
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadPipeline() {
    const { data } = await supabase.from('tasks').select(`*, projects ( name, clients ( name ) ), users!tasks_editor_id_fkey ( name )`).order('created_at', { ascending: true })
    if (data) setTasks(data)
    setLoading(false)
  }

  async function loadDropdowns() {
    const { data: eds } = await supabase.from('users').select('id, name').eq('role', 'editor')
    if (eds) setEditors(eds)
    const { data: projs } = await supabase.from('projects').select('id, name, clients(name)')
    if (projs) setProjects(projs)
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('taskId', taskId)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)

    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user) {
      const { data: userProfile } = await supabase.from('users').select('id').eq('auth_id', authData.user.id).single()
      if (userProfile) {
        await supabase.from('activity_logs').insert({ task_id: taskId, user_id: userProfile.id, action_type: 'status_change', description: `Moved task to ${newStatus.replace('_', ' ')}` })
      }
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.editor_id || !newTask.project_id) {
      alert("Please fill in the Editor, Client/Project, and Title.")
      return
    }

    try {
      const { error } = await supabase.from('tasks').insert({
        title: newTask.title,
        editor_id: newTask.editor_id,
        project_id: newTask.project_id,
        deadline: newTask.deadline || null,
        raw_footage_url: newTask.raw_footage_url || null,
        status: 'todo'
      })

      if (error) throw error
      
      setShowNewModal(false)
      setNewTask({ title: '', editor_id: '', project_id: '', deadline: '', raw_footage_url: '' })
      loadPipeline()
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedTask) return
    const file = e.target.files[0]
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${selectedTask.id}-${Math.random()}.${fileExt}`
    const filePath = `videos/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('deliverables').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: publicUrlData } = supabase.storage.from('deliverables').getPublicUrl(filePath)
      await supabase.from('tasks').update({ file_url: publicUrlData.publicUrl, status: 'internal_review' }).eq('id', selectedTask.id)

      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data: userProfile } = await supabase.from('users').select('id').eq('auth_id', authData.user.id).single()
        if (userProfile) {
          await supabase.from('activity_logs').insert({ task_id: selectedTask.id, user_id: userProfile.id, action_type: 'file_uploaded', description: `Uploaded new asset version.` })
        }
      }
    } catch (error) {
      alert('Upload failed. Check file size limits.')
    } finally {
      setUploading(false)
      setSelectedTask(null)
      loadPipeline()
    }
  }

  return (
    <>
      <style>{`
        .header-wrapper { background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 50; width: 100%; border-bottom: 1px solid #1f1f2e; }
        .page-header { height: 76px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; max-width: 1600px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        
        .board-wrapper { width: 100%; display: flex; justify-content: center; padding: 24px 0; }
        .kanban-board { display: flex; justify-content: flex-start; gap: 20px; padding: 0 40px; height: calc(100vh - 124px); width: 100%; max-width: 1600px; align-items: stretch; overflow-x: auto; box-sizing: border-box; }
        
        .kanban-col { flex: 1; min-width: 280px; max-width: 320px; background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
        .col-header { padding: 18px 20px; border-bottom: 1px solid #1f1f2e; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
        .col-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .col-count { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        
        .task-list { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; flex: 1; }
        .task-card { background: #141418; border: 1px solid #272730; border-radius: 10px; padding: 18px; cursor: grab; transition: all 0.2s ease; box-sizing: border-box; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .task-card:active { cursor: grabbing; transform: scale(0.98); }
        .task-card:hover { border-color: #444455; background: #1a1a22; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
        .client-tag { font-size: 11px; font-weight: 700; color: #a1a1aa; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(5,5,5,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box; }
        .modal-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 40px; width: 100%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); box-sizing: border-box; }
        .dropzone { border: 1px dashed #3f3f46; border-radius: 8px; padding: 40px; text-align: center; background: rgba(255,255,255,0.01); cursor: pointer; transition: 0.2s; margin-top: 24px; }
        .dropzone:hover { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
        
        .btn-gold { background: #D4AF37; border: none; color: #09090b; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-gold:hover { background: #e5c048; }
        .btn-ghost { background: transparent; color: #a1a1aa; border: 1px solid #1f1f2e; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: 0.2s; }
        .btn-ghost:hover { background: #1f1f2e; color: #f4f4f5; }

        .input-dark { box-sizing: border-box; width: 100%; background: rgba(255,255,255,0.02); border: 1px solid #1f1f2e; border-radius: 8px; padding: 14px; color: #f4f4f5; font-size: 14px; outline: none; margin-bottom: 16px; transition: border-color 0.2s; color-scheme: dark; }
        .input-dark:focus { border-color: #D4AF37; }
        .input-dark option { background: #0e0e11; color: #f4f4f5; }
        .form-label { display: block; font-size: 11px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
      `}</style>

      <div className="header-wrapper">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Production Pipeline</h1>
          <button onClick={() => setShowNewModal(true)} className="btn-gold">Issue Task</button>
        </div>
      </div>

      {loading ? (
        <div className="board-wrapper">
          <div style={{ padding: '40px', color: '#71717a', fontSize: 14, width: '100%', maxWidth: '1600px' }}>Syncing pipeline...</div>
        </div>
      ) : (
        <div className="board-wrapper">
          <div className="kanban-board">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id} className="kanban-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                  
                  <div className="col-header" style={{ borderTop: `3px solid ${col.color}` }}>
                    <div className="col-title" style={{ color: col.color }}>{col.title}</div>
                    <div className="col-count" style={{ color: col.color, background: col.bg }}>{colTasks.length}</div>
                  </div>

                  <div className="task-list">
                    {colTasks.map(task => (
                      <div key={task.id} className="task-card" draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => setSelectedTask(task)}>
                        <div className="client-tag">{task.projects?.clients?.name || 'Internal'} - {task.projects?.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#f4f4f5', marginBottom: 16, lineHeight: 1.4 }}>{task.title}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #272730', paddingTop: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '6px', background: col.bg, border: `1px solid ${col.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: col.color, fontWeight: 700 }}>
                              {task.users?.name?.[0] || '?'}
                            </div>
                            <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 500 }}>{task.users?.name?.split(' ')[0] || 'Unassigned'}</span>
                          </div>
                          {task.file_url && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 8px rgba(212, 175, 55, 0.5)' }} title="Asset Attached" />}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div style={{ padding: 30, textAlign: 'center', border: `1px dashed ${col.color}40`, borderRadius: 10, color: '#52525b', fontSize: 13, background: 'rgba(255,255,255,0.01)' }}>
                        Drop items here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ISSUE NEW TASK MODAL */}
      {showNewModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false) }}>
          <div className="modal-card">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f4f4f5', margin: '0 0 24px 0', letterSpacing: '-0.02em' }}>Issue New Task</h2>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Editor</label>
                <select className="input-dark" value={newTask.editor_id} onChange={e => setNewTask({...newTask, editor_id: e.target.value})}>
                  <option value="">Select editor...</option>
                  {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Client / Project</label>
                <select className="input-dark" value={newTask.project_id} onChange={e => setNewTask({...newTask, project_id: e.target.value})}>
                  <option value="">Select client...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.clients?.name} - {p.name}</option>)}
                </select>
              </div>
            </div>

            <label className="form-label">Video Title</label>
            <input type="text" placeholder="e.g. DAMAC Lagoons tour" className="input-dark" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />

            <label className="form-label">Deadline</label>
            <input type="date" className="input-dark" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />

            <label className="form-label">Raw Footage Link (Google Drive)</label>
            <input type="url" placeholder="Paste URL..." className="input-dark" value={newTask.raw_footage_url} onChange={e => setNewTask({...newTask, raw_footage_url: e.target.value})} />

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setShowNewModal(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleCreateTask} className="btn-gold" style={{ flex: 1, padding: '12px 24px' }}>Dispatch Task</button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD ASSET MODAL */}
      {selectedTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null) }}>
          <div className="modal-card">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f4f4f5', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Task Details</h2>
            <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedTask.projects?.clients?.name} — {selectedTask.title}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, border: '1px solid #1f1f2e', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 600, marginBottom: 8 }}>CURRENT ASSET LINK</div>
              {selectedTask.file_url ? (
                <a href={selectedTask.file_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13, wordBreak: 'break-all', textDecoration: 'none' }}>{selectedTask.file_url}</a>
              ) : (
                <div style={{ color: '#71717a', fontSize: 13 }}>No asset uploaded yet.</div>
              )}
            </div>

            <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
              {uploading ? (
                <div style={{ color: '#D4AF37', fontWeight: 500, fontSize: 14 }}>Uploading asset securely...</div>
              ) : (
                <>
                  <div style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Click to upload deliverable</div>
                  <div style={{ color: '#a1a1aa', fontSize: 13 }}>MP4, MOV, or ZIP files supported</div>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="video/mp4,video/quicktime,application/zip" />
            </div>

            <button onClick={() => setSelectedTask(null)} className="btn-ghost" style={{ width: '100%', marginTop: 24 }}>Close Window</button>
          </div>
        </div>
      )}
    </>
  )
}