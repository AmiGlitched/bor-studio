'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function EditorPortal() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Upload Modal State
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let channel: any;

    async function init() {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data: userProfile } = await supabase.from('users').select('*').eq('auth_id', authData.user.id).single()
        setCurrentUser(userProfile)
        
        if (userProfile) {
          fetchTasks(userProfile.id)
          
          // FIXED: Unique channel name prevents Strict Mode collisions
          channel = supabase.channel(`editor-tasks-${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
              fetchTasks(userProfile.id)
            })
            .subscribe()
        }
      }
    }

    init()

    // FIXED: Proper React cleanup scope
    return () => { 
      if (channel) supabase.removeChannel(channel) 
    }
  }, [])

  async function fetchTasks(userId: string) {
    const { data } = await supabase
      .from('tasks')
      .select(`*, projects ( name, clients ( name ) )`)
      .eq('editor_id', userId)
      .neq('status', 'approved') // Hide fully completed tasks
      .order('updated_at', { ascending: false })
    
    if (data) setTasks(data)
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    await supabase.from('activity_logs').insert({ 
      task_id: id, 
      user_id: currentUser.id, 
      action_type: 'status_change', 
      description: `Editor moved task to ${newStatus.replace('_', ' ')}` 
    })
    fetchTasks(currentUser.id)
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

      // Automatically push to internal review once uploaded
      await supabase.from('tasks').update({ file_url: publicUrlData.publicUrl, status: 'internal_review' }).eq('id', selectedTask.id)

      await supabase.from('activity_logs').insert({ task_id: selectedTask.id, user_id: currentUser.id, action_type: 'file_uploaded', description: `Uploaded new asset version.` })
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Upload failed. Check file size limits.')
    } finally {
      setUploading(false)
      setSelectedTask(null)
      fetchTasks(currentUser.id)
    }
  }

  // Helper for dynamic colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', border: 'rgba(96, 165, 250, 0.2)', label: 'Ready for Edit' }
      case 'in_progress': return { color: '#D4AF37', bg: 'rgba(212, 175, 55, 0.1)', border: 'rgba(212, 175, 55, 0.2)', label: 'In Production' }
      case 'internal_review': return { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.2)', label: 'Internal QA' }
      case 'client_review': return { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.1)', border: 'rgba(244, 114, 182, 0.2)', label: 'Client Review' }
      case 'blocked': return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)', label: 'Blocked' }
      default: return { color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.1)', border: 'rgba(161, 161, 170, 0.2)', label: status }
    }
  }

  return (
    <>
      <style>{`
        .header-wrapper { width: 100%; border-bottom: 1px solid #1f1f2e; position: sticky; top: 0; z-index: 50; background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(12px); }
        .page-header { height: 76px; display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        .page-wrapper { width: 100%; display: flex; justify-content: center; padding: 40px 0; }
        .page-container { max-width: 1200px; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        .task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
        .task-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.15); transition: 0.2s ease; }
        .task-card:hover { border-color: #3f3f46; box-shadow: 0 8px 30px rgba(0,0,0,0.2); transform: translateY(-2px); }
        
        .client-tag { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .task-title { font-size: 18px; font-weight: 600; color: #f4f4f5; margin: 0 0 16px 0; line-height: 1.4; letter-spacing: -0.01em; }
        
        .status-badge { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px; }
        
        .action-bar { display: flex; gap: 12px; margin-top: auto; padding-top: 20px; border-top: 1px solid #1f1f2e; }
        .btn-primary { flex: 1; background: #f4f4f5; color: #09090b; border: none; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; text-align: center; }
        .btn-primary:hover { background: #d4d4d8; }
        .btn-secondary { flex: 1; background: transparent; color: #a1a1aa; border: 1px solid #1f1f2e; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; text-align: center; }
        .btn-secondary:hover { background: #1f1f2e; color: #f4f4f5; border-color: #3f3f46; }
        .btn-danger { background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.2); padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-danger:hover { background: rgba(248, 113, 113, 0.2); }

        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(5,5,5,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box; }
        .modal-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 40px; width: 100%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); box-sizing: border-box; }
        .dropzone { border: 1px dashed #3f3f46; border-radius: 8px; padding: 40px; text-align: center; background: rgba(255,255,255,0.01); cursor: pointer; transition: 0.2s; margin-top: 24px; }
        .dropzone:hover { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
      `}</style>

      <div className="header-wrapper">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>My Workspace</h1>
        </div>
      </div>

      <div className="page-wrapper">
        <div className="page-container">
          
          {loading ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: 100, fontSize: 14 }}>Loading your assignments...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, background: '#0e0e11', border: '1px dashed #1f1f2e', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🎬</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#f4f4f5', marginBottom: 8 }}>No active tasks</div>
              <div style={{ fontSize: 14, color: '#a1a1aa' }}>You are completely caught up on your assignments!</div>
            </div>
          ) : (
            <div className="task-grid">
              {tasks.map(task => {
                const statusTheme = getStatusColor(task.status)
                return (
                  <div key={task.id} className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="client-tag">{task.projects?.clients?.name || 'Internal'} - {task.projects?.name}</div>
                    </div>
                    
                    <h3 className="task-title">{task.title}</h3>

                    <div>
                      <div className="status-badge" style={{ background: statusTheme.bg, color: statusTheme.color, border: `1px solid ${statusTheme.border}` }}>
                        {statusTheme.label}
                      </div>
                    </div>

                    <div className="action-bar">
                      {task.status === 'todo' && (
                        <button onClick={() => updateStatus(task.id, 'in_progress')} className="btn-primary" style={{ width: '100%' }}>
                          Start Editing
                        </button>
                      )}
                      
                      {task.status === 'in_progress' && (
                        <>
                          <button onClick={() => updateStatus(task.id, 'blocked')} className="btn-danger">
                            Mark Blocked
                          </button>
                          <button onClick={() => setSelectedTask(task)} className="btn-primary">
                            Submit Deliverable
                          </button>
                        </>
                      )}

                      {(task.status === 'internal_review' || task.status === 'client_review') && (
                        <button disabled className="btn-secondary" style={{ width: '100%', cursor: 'not-allowed', opacity: 0.5 }}>
                          Awaiting Review
                        </button>
                      )}

                      {task.status === 'blocked' && (
                        <button onClick={() => updateStatus(task.id, 'in_progress')} className="btn-primary" style={{ width: '100%' }}>
                          Resume Editing
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* Reusable Upload Modal for Editors */}
      {selectedTask && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTask(null) }}>
          <div className="modal-card">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f4f4f5', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Submit Deliverable</h2>
            <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedTask.projects?.clients?.name} — {selectedTask.title}
            </div>

            <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
              {uploading ? (
                <div style={{ color: '#D4AF37', fontWeight: 500, fontSize: 14 }}>Uploading asset securely...</div>
              ) : (
                <>
                  <div style={{ color: '#f4f4f5', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Click to upload file</div>
                  <div style={{ color: '#a1a1aa', fontSize: 13 }}>MP4, MOV, or ZIP files supported</div>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="video/mp4,video/quicktime,application/zip" />
            </div>

            <button onClick={() => setSelectedTask(null)} className="btn-secondary" style={{ width: '100%', marginTop: 24 }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}