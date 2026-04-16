'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  { id: 'todo', title: 'Ready for Edit' },
  { id: 'in_progress', title: 'In Production' },
  { id: 'internal_review', title: 'Internal QA' },
  { id: 'client_review', title: 'Client Review' },
  { id: 'approved', title: 'Approved' }
]

export default function PipelineBoard() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { 
    loadPipeline() 
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
      console.error('Error uploading file:', error)
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
        .page-header { height: 76px; display: flex; align-items: center; padding: 0 40px; background: transparent; position: sticky; top: 0; z-index: 50; }
        .kanban-board { display: flex; gap: 16px; padding: 20px 40px; height: calc(100vh - 76px); width: 100%; align-items: stretch; overflow-x: auto; box-sizing: border-box; }
        .kanban-col { flex: 1; min-width: 280px; background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .col-header { padding: 16px 20px; border-bottom: 1px solid #1f1f2e; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); }
        .col-title { font-size: 13px; font-weight: 600; color: #f4f4f5; }
        .col-count { background: #1f1f2e; color: #a1a1aa; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .task-list { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .task-card { background: rgba(255,255,255,0.02); border: 1px solid #1f1f2e; border-radius: 8px; padding: 16px; cursor: grab; transition: all 0.2s ease; box-sizing: border-box; }
        .task-card:active { cursor: grabbing; border-color: #D4AF37; }
        .task-card:hover { border-color: #3f3f46; background: rgba(255,255,255,0.03); }
        .client-tag { font-size: 11px; font-weight: 600; color: #D4AF37; margin-bottom: 8px; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(5,5,5,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box; }
        .modal-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 40px; width: 100%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); box-sizing: border-box; }
        .dropzone { border: 1px dashed #3f3f46; border-radius: 8px; padding: 40px; text-align: center; background: rgba(255,255,255,0.01); cursor: pointer; transition: 0.2s; margin-top: 24px; }
        .dropzone:hover { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
        .btn-ghost { background: transparent; color: #a1a1aa; border: 1px solid #1f1f2e; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; margin-top: 24px; width: 100%; transition: 0.2s; }
        .btn-ghost:hover { background: #1f1f2e; color: #f4f4f5; }
      `}</style>

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Production Pipeline</h1>
      </div>

      {loading ? (
        <div style={{ padding: '0 40px', color: '#71717a', fontSize: 14 }}>Syncing pipeline...</div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="kanban-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                <div className="col-header">
                  <div className="col-title">{col.title}</div>
                  <div className="col-count">{colTasks.length}</div>
                </div>

                <div className="task-list">
                  {colTasks.map(task => (
                    <div key={task.id} className="task-card" draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => setSelectedTask(task)}>
                      <div className="client-tag">{task.projects?.clients?.name || 'Internal'} - {task.projects?.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#f4f4f5', marginBottom: 16, lineHeight: 1.4 }}>{task.title}</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1f1f2e', paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '4px', background: '#1f1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#f4f4f5', fontWeight: 600 }}>
                            {task.users?.name?.[0] || '?'}
                          </div>
                          <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 500 }}>{task.users?.name?.split(' ')[0] || 'Unassigned'}</span>
                        </div>
                        {task.file_url && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37' }} title="Asset Attached" />}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <div style={{ padding: 30, textAlign: 'center', border: '1px dashed #1f1f2e', borderRadius: 8, color: '#52525b', fontSize: 13 }}>Drop items here</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null) }}>
          <div className="modal-card">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f4f4f5', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Task Details</h2>
            <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600, marginBottom: 24 }}>
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

            <button onClick={() => setSelectedTask(null)} className="btn-ghost">Close Window</button>
          </div>
        </div>
      )}
    </>
  )
}