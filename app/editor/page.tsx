'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const statusConfig: Record<string, { label: string, bg: string, text: string }> = {
  editing: { label: 'Editing', bg: '#fff8f0', text: '#e67e22' },
  internal_review: { label: 'Submitted for review', bg: '#eff6ff', text: '#2980b9' },
  client_review: { label: 'With client', bg: '#f5f3ff', text: '#8e44ad' },
  approved: { label: 'Approved', bg: '#f0fdf4', text: '#27ae60' },
}

export default function EditorView() {
  const [tasks, setTasks] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    loadEditorData()
  }, [])

  async function loadEditorData() {
    setLoading(true)
    
    // 1. Figure out who is logged in securely
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 2. Get their editor profile from your public.users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (profile) {
      setCurrentUser(profile)
      
      // 3. ONLY fetch videos assigned to their specific ID
      const { data: videos } = await supabase
        .from('videos')
        .select('*, clients(name)')
        .eq('editor_id', profile.id)
        .order('deadline', { ascending: true })

      if (videos) setTasks(videos)
    }
    setLoading(false)
  }

  const activeTasks = tasks.filter((t: any) => t.status !== 'approved')
  const doneTasks = tasks.filter((t: any) => t.status === 'approved')

  // Real Upload Logic to Supabase & updating DB
  const handleRealUpload = async () => {
    if (!file || !selectedTask) return
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-task-${selectedTask.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      // EXACT MATCH TO SUPABASE COLUMNS
      const { error: updateError } = await supabase
        .from('videos')
        .update({ 
          video_uploaded: true, 
          status: 'internal_review', 
          video_url: publicUrl,
          revision_note: null 
        })
        .eq('id', selectedTask.id)

      if (updateError) throw updateError

      setUploading(false)
      setUploaded(true)

      // Reload tasks from DB to reflect changes instantly
      await loadEditorData()

      setTimeout(() => {
        setUploaded(false)
        setShowUpload(false)
        setSelectedTask(null)
        setFile(null)
      }, 2000)

    } catch (error) {
      console.error('Upload Error:', error)
      alert('Upload failed. Check the console for details.')
      setUploading(false)
    }
  }

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>My Tasks</div>
        {currentUser && (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#111' }}>
            {currentUser.name?.[0] || 'E'}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, width: '100%' }}>

        {loading ? (
          <div style={{ color: '#bbb', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Loading your tasks...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Active tasks', value: activeTasks.length, color: '#111' },
                { label: 'Pending upload', value: activeTasks.filter((t: any) => !t.video_uploaded && t.status === 'editing').length, color: '#e67e22' },
                { label: 'With revision notes', value: tasks.filter((t: any) => t.revision_note).length, color: '#e74c3c' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Active tasks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {activeTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13, background: '#fff', borderRadius: 12, border: '1px dashed #ddd' }}>
                  You have no active tasks right now.
                </div>
              )}
              {activeTasks.map((task: any) => {
                const sc = statusConfig[task.status] || statusConfig.editing
                const isOverdue = task.deadline && new Date(task.deadline) < new Date()
                const needsUpload = task.status === 'editing' && !task.video_uploaded
                
                return (
                  <div key={task.id} style={{
                    background: '#fff',
                    border: task.revision_note ? '1px solid #e67e22' : '1px solid #eee',
                    borderLeft: task.revision_note ? '3px solid #e67e22' : isOverdue ? '3px solid #e74c3c' : '3px solid transparent',
                    borderRadius: 12, padding: '16px 18px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 3 }}>{task.clients?.name} · {task.type || 'Video'}</div>
                        <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{task.title}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {sc.label}
                      </span>
                    </div>

                    {task.revision_note && (
                      <div style={{ padding: '10px 14px', background: '#fff8f0', borderRadius: 8, marginBottom: 12, border: '1px solid #fde8cc' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#e67e22', marginBottom: 4 }}>Revision requested</div>
                        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{task.revision_note}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: isOverdue ? '#e74c3c' : '#999' }}>
                          {isOverdue ? 'Overdue · ' : 'Due · '}{task.deadline || 'No deadline'}
                        </span>
                        {task.video_uploaded
                          ? <span style={{ fontSize: 11, color: '#27ae60' }}>✓ Video uploaded</span>
                          : <span style={{ fontSize: 11, color: '#bbb' }}>No upload yet</span>
                        }
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {task.drive_link && (
                          <a href={task.drive_link} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #eee', borderRadius: 8, background: '#f9f9f9', color: '#111', textDecoration: 'none' }}>
                            Open Drive Link
                          </a>
                        )}
                        {(needsUpload || task.revision_note) && (
                          <button onClick={() => { setSelectedTask(task); setShowUpload(true) }}
                            style={{ fontSize: 12, padding: '5px 14px', border: 'none', borderRadius: 8, background: task.revision_note ? '#e67e22' : '#111', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                            {task.revision_note ? 'Resubmit Video' : 'Submit Video'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {doneTasks.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Completed</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doneTasks.map((task: any) => (
                    <div key={task.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#bbb', marginBottom: 2 }}>{task.clients?.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{task.title}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#27ae60' }}>Approved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420 }}>
            {uploaded ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#27ae60', marginBottom: 6 }}>Uploaded successfully</div>
                <div style={{ fontSize: 13, color: '#888' }}>The video has been securely sent to the Admin for review.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>Upload Final Video</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{selectedTask.clients?.name} · {selectedTask.title}</div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#111', display: 'block', marginBottom: 8 }}>
                    Select MP4 or MOV file
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowUpload(false); setFile(null) }}
                    style={{ flex: 1, padding: '10px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleRealUpload}
                    disabled={!file || uploading}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: file ? '#111' : '#ccc', color: '#fff', fontSize: 13, cursor: file ? 'pointer' : 'default', fontWeight: 500 }}>
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}