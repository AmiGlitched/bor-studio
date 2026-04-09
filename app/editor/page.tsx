'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const statusConfig: Record<string, { label: string, bg: string, text: string }> = {
  editing: { label: 'Editing', bg: 'rgba(232, 67, 147, 0.1)', text: '#E84393' },
  internal_review: { label: 'Submitted for Review', bg: 'rgba(74, 144, 226, 0.1)', text: '#4A90E2' },
  client_review: { label: 'With Client', bg: 'rgba(123, 97, 255, 0.1)', text: '#7B61FF' },
  approved: { label: 'Approved', bg: 'rgba(0, 208, 132, 0.1)', text: '#00D084' },
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (profile) {
      setCurrentUser(profile)
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
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .metric-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 16px 20px; position: relative; overflow: hidden;
        }
        .metric-glow {
          position: absolute; top: -20px; right: -20px; width: 80px; height: 80px;
          border-radius: 50%; filter: blur(30px); opacity: 0.15; pointer-events: none;
        }
        .task-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 20px; transition: all 0.2s;
        }
        .task-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: #4A90E2; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 28px; width: 100%; max-width: 440px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .dark-btn {
          background: rgba(0,0,0,0.2); border: 1px solid var(--border-subtle);
          color: #fff; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block;
        }
        .dark-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>My Tasks</div>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{currentUser.name}</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              {currentUser.name?.[0] || 'E'}
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 32px', width: '100%' }}>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', marginTop: 80 }}>Syncing your workspace...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Active tasks', value: activeTasks.length, color: '#4A90E2' },
                { label: 'Pending upload', value: activeTasks.filter((t: any) => !t.video_uploaded && t.status === 'editing').length, color: '#F5A623' },
                { label: 'Revisions', value: tasks.filter((t: any) => t.revision_note).length, color: '#E84393' },
              ].map(s => (
                <div key={s.label} className="metric-card">
                  <div className="metric-glow" style={{ background: s.color }}></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>Active Queue</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
              {activeTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: 14, background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: '1px dashed var(--border-subtle)' }}>
                  Your queue is empty. Great job!
                </div>
              )}
              {activeTasks.map((task: any) => {
                const sc = statusConfig[task.status] || statusConfig.editing
                const isOverdue = task.deadline && new Date(task.deadline) < new Date()
                const needsUpload = task.status === 'editing' && !task.video_uploaded
                
                return (
                  <div key={task.id} className="task-card" style={{
                    borderLeft: `3px solid ${task.revision_note ? '#F5A623' : isOverdue ? '#E84393' : '#4A90E2'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#7B61FF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{task.clients?.name} · {task.type || 'Video'}</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{task.title}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 16 }}>
                        {sc.label}
                      </span>
                    </div>

                    {task.revision_note && (
                      <div style={{ padding: '12px 16px', background: 'rgba(245, 166, 35, 0.1)', borderRadius: 8, marginBottom: 16, border: '1px solid rgba(245, 166, 35, 0.3)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Revision Requested</div>
                        <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5 }}>{task.revision_note}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: isOverdue ? '#E84393' : 'var(--text-secondary)', fontWeight: 500 }}>
                          {isOverdue ? '⚠️ Overdue · ' : 'Target · '}{task.deadline || 'No deadline'}
                        </span>
                        {task.video_uploaded
                          ? <span style={{ fontSize: 12, color: '#00D084', fontWeight: 500 }}>✓ Ready for Review</span>
                          : <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Awaiting Upload</span>
                        }
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {task.drive_link && (
                          <a href={task.drive_link} target="_blank" rel="noreferrer" className="dark-btn">
                            Raw Footage ↗
                          </a>
                        )}
                        {(needsUpload || task.revision_note) && (
                          <button onClick={() => { setSelectedTask(task); setShowUpload(true) }}
                            style={{ fontSize: 12, padding: '8px 16px', border: 'none', borderRadius: 8, background: task.revision_note ? '#F5A623' : 'var(--primary-gradient)', color: '#fff', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(123, 97, 255, 0.2)' }}>
                            {task.revision_note ? 'Submit Revision' : 'Upload Final'}
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
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', opacity: 0.7 }}>Completed Archives</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {doneTasks.map((task: any) => (
                    <div key={task.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{task.clients?.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{task.title}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(0, 208, 132, 0.1)', color: '#00D084', fontWeight: 600 }}>Approved</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            {uploaded ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00D084', marginBottom: 8 }}>Upload Successful</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>The video has been securely encrypted and deployed to the Admin review queue.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Upload Final Asset</div>
                <div style={{ fontSize: 13, color: '#7B61FF', fontWeight: 600, marginBottom: 24, letterSpacing: '0.05em' }}>{selectedTask.clients?.name} · {selectedTask.title}</div>

                <div style={{ marginBottom: 32, background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, border: '1px dashed var(--border-subtle)' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 12 }}>
                    Select MP4 or MOV file
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    style={{ width: '100%', color: 'var(--text-secondary)', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => { setShowUpload(false); setFile(null) }}
                    style={{ flex: 1, padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleRealUpload}
                    disabled={!file || uploading}
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: file ? 'var(--primary-gradient)' : '#333', color: '#fff', fontSize: 13, cursor: file ? 'pointer' : 'default', fontWeight: 600, boxShadow: file ? '0 4px 12px rgba(123, 97, 255, 0.3)' : 'none' }}>
                    {uploading ? 'Encrypting & Uploading...' : 'Deploy Asset'}
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