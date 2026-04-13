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
  
  // Upload Modal State
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { 
    loadPipeline() 

    const channel = supabase
      .channel('tasks-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          loadPipeline() 
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadPipeline() {
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        projects ( name, clients ( name ) ),
        users!tasks_editor_id_fkey ( name )
      `)
      .order('created_at', { ascending: true })
    
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
        await supabase.from('activity_logs').insert({
          task_id: taskId,
          user_id: userProfile.id,
          action_type: 'status_change',
          description: `Moved task to ${newStatus.replace('_', ' ')}`
        })
      }
    }
  }

  // --- THE UPLOAD ENGINE ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedTask) return
    const file = e.target.files[0]
    setUploading(true)

    // 1. Create a unique file name to prevent overwriting
    const fileExt = file.name.split('.').pop()
    const fileName = `${selectedTask.id}-${Math.random()}.${fileExt}`
    const filePath = `videos/${fileName}`

    try {
      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 3. Get the Public URL
      const { data: publicUrlData } = supabase.storage
        .from('deliverables')
        .getPublicUrl(filePath)

      // 4. Attach the URL to the task in the database and auto-move to internal_review
      await supabase.from('tasks').update({ 
        file_url: publicUrlData.publicUrl,
        status: 'internal_review' 
      }).eq('id', selectedTask.id)

      // 5. Log the activity
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data: userProfile } = await supabase.from('users').select('id').eq('auth_id', authData.user.id).single()
        if (userProfile) {
          await supabase.from('activity_logs').insert({
            task_id: selectedTask.id,
            user_id: userProfile.id,
            action_type: 'file_uploaded',
            description: `Uploaded new asset version.`
          })
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
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .kanban-board { display: flex; gap: 16px; padding: 32px; height: calc(100vh - 70px); width: 100%; align-items: stretch; }
        .kanban-col { flex: 1; min-width: 0; background: #0a0a0f; border: 1px solid #1a1a22; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .col-header { padding: 16px; border-bottom: 1px solid #1a1a22; display: flex; justify-content: space-between; align-items: center; background: #0f0f0f; }
        .col-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #fff; }
        .col-count { background: #1a1a22; color: #888; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .task-list { padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .task-card { background: #050505; border: 1px solid #1a1a22; border-radius: 8px; padding: 16px; cursor: grab; transition: all 0.2s; }
        .task-card:active { cursor: grabbing; border-color: #D4AF37; }
        .task-card:hover { border-color: #333; }
        .client-tag { font-size: 9px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-card { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 16px; padding: 40px; width: 100%; max-width: 500px; }
        .dropzone { border: 1px dashed #333; border-radius: 12px; padding: 40px; text-align: center; background: #050505; cursor: pointer; transition: 0.2s; margin-top: 24px; }
        .dropzone:hover { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
        .btn-ghost { background: transparent; color: #aaa; border: 1px solid #333; padding: 12px 24px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; margin-top: 24px; width: 100%; }
        .btn-ghost:hover { background: #111; color: #fff; }
      `}</style>

      <div className="glass-header" style={{ height: 70, display: 'flex', alignItems: 'center', padding: '0 40px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Production Pipeline</h1>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: '#666' }}>Syncing pipeline...</div>
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
                    // FIXED: Added onClick to open the upload modal
                    <div key={task.id} className="task-card" draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => setSelectedTask(task)}>
                      <div className="client-tag">{task.projects?.clients?.name || 'Internal'} - {task.projects?.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>{task.title}</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a22', paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '4px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 800 }}>
                            {task.users?.name?.[0] || '?'}
                          </div>
                          <span style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{task.users?.name?.split(' ')[0] || 'Unassigned'}</span>
                        </div>
                        {/* Visual indicator if a file is already attached */}
                        {task.file_url && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4AF37' }} title="Asset Attached" />}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <div style={{ padding: 20, textAlign: 'center', border: '1px dashed #1a1a22', borderRadius: 8, color: '#333', fontSize: 11 }}>Drop items here</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null) }}>
          <div className="modal-card">
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#fff', margin: '0 0 8px 0' }}>Task Details</h2>
            <div style={{ fontSize: 13, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>
              {selectedTask.projects?.clients?.name} — {selectedTask.title}
            </div>

            <div style={{ background: '#050505', padding: 16, borderRadius: 8, border: '1px solid #1a1a22', marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: 4 }}>Current Asset Link</div>
              {selectedTask.file_url ? (
                <a href={selectedTask.file_url} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: 12, wordBreak: 'break-all', textDecoration: 'none' }}>{selectedTask.file_url}</a>
              ) : (
                <div style={{ color: '#444', fontSize: 12 }}>No asset uploaded yet.</div>
              )}
            </div>

            <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
              {uploading ? (
                <div style={{ color: '#D4AF37', fontWeight: 600, fontSize: 14 }}>Uploading asset securely...</div>
              ) : (
                <>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Click to upload deliverable</div>
                  <div style={{ color: '#666', fontSize: 12 }}>MP4, MOV, or ZIP files supported</div>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
                accept="video/mp4,video/quicktime,application/zip"
              />
            </div>

            <button onClick={() => setSelectedTask(null)} className="btn-ghost">Close</button>
          </div>
        </div>
      )}
    </>
  )
}