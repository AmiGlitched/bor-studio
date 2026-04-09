'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const statusConfig: Record<string, { label: string, bg: string, text: string, color: string }> = {
  shoot_done: { label: 'New Task', bg: 'rgba(136, 136, 136, 0.1)', text: '#a0a0b0', color: '#888' },
  editing: { label: 'In Progress', bg: 'rgba(232, 67, 147, 0.1)', text: '#E84393', color: '#E84393' },
  internal_review: { label: 'In QA Review', bg: 'rgba(74, 144, 226, 0.1)', text: '#4A90E2', color: '#4A90E2' },
  client_review: { label: 'With Client', bg: 'rgba(123, 97, 255, 0.1)', text: '#7B61FF', color: '#7B61FF' },
  approved: { label: 'Approved', bg: 'rgba(0, 208, 132, 0.1)', text: '#00D084', color: '#00D084' },
}

export default function EditorView() {
  const [tasks, setTasks] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  
  // Feedback Data
  const [comments, setComments] = useState<any[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // Upload Logic
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => { loadEditorData() }, [])

  async function loadEditorData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('users').select('*').eq('auth_id', user.id).single()

    if (profile) {
      setCurrentUser(profile)
      const { data: videos } = await supabase.from('videos').select('*, clients(name)').eq('editor_id', profile.id).order('deadline', { ascending: true })
      if (videos) setTasks(videos)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (showFeedback && selectedTask) fetchComments(selectedTask.id)
  }, [showFeedback, selectedTask])

  async function fetchComments(videoId: string) {
    const { data } = await supabase.from('comments').select('*').eq('video_id', videoId).order('timestamp', { ascending: true })
    if (data) setComments(data)
  }

  async function startEditing(taskId: string) {
    await supabase.from('videos').update({ status: 'editing' }).eq('id', taskId)
    loadEditorData()
  }

  const handleRealUpload = async () => {
    if (!file || !selectedTask) return
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-task-${selectedTask.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName)

      const { error: updateError } = await supabase.from('videos').update({ 
        video_uploaded: true, 
        status: 'internal_review', 
        video_url: publicUrl 
      }).eq('id', selectedTask.id)

      if (updateError) throw updateError

      setUploaded(true)
      await loadEditorData()
      setTimeout(() => {
        setUploaded(false)
        setShowUpload(false)
        setFile(null)
      }, 2000)
    } catch (error) {
      alert('Upload failed.')
      setUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play()
    }
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .metric-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 16px 24px; position: relative; overflow: hidden; }
        .metric-glow { position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; filter: blur(30px); opacity: 0.15; pointer-events: none; }
        .task-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; transition: all 0.2s ease; }
        .task-card:hover { transform: translateY(-2px); border-color: #4A90E2; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .action-btn { padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.03); color: #fff; }
        .action-btn:hover { background: rgba(255,255,255,0.1); border-color: #fff; }
        .action-btn.primary { background: var(--primary-gradient); border: none; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 40px; }
        .feedback-grid { background: #000; border: 1px solid var(--border-subtle); border-radius: 20px; width: 100%; max-width: 1100px; display: grid; grid-template-columns: 1fr 320px; height: 80vh; overflow: hidden; }
        .comment-item { padding: 14px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.2s; }
        .comment-item:hover { background: rgba(255,255,255,0.05); }
        .timestamp-tag { background: rgba(123, 97, 255, 0.2); color: #7B61FF; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-right: 8px; }
      `}</style>

      {/* Header */}
      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Editor Workspace</div>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{currentUser.name}</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>{currentUser.name?.[0]}</div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px', width: '100%' }}>
        
        {/* Metrics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'approved').length, color: '#4A90E2' },
            { label: 'Pending Upload', value: tasks.filter(t => t.status === 'editing' && !t.video_uploaded).length, color: '#E84393' },
            { label: 'Needs Revision', value: tasks.filter(t => t.status === 'editing' && t.video_uploaded).length, color: '#F5A623' },
          ].map(m => (
            <div key={m.label} className="metric-card">
              <div className="metric-glow" style={{ background: m.color }}></div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Task List */}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' }}>Your Production Queue</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 40 }}>Syncing...</div> : null}
          
          {tasks.filter(t => t.status !== 'approved').map(task => {
            const sc = statusConfig[task.status] || statusConfig.editing
            return (
              <div key={task.id} className="task-card" style={{ borderLeft: `4px solid ${sc.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#7B61FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{task.clients?.name} · {task.type || 'Reel'}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{task.title}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontWeight: 700, textTransform: 'uppercase' }}>{sc.label}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Deadline: {task.deadline || 'Flexible'}</div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {task.drive_link && <a href={task.drive_link} target="_blank" className="action-btn">Raw Footage ↗</a>}
                    
                    {task.status === 'shoot_done' && (
                      <button onClick={() => startEditing(task.id)} className="action-btn" style={{ background: '#E84393', border: 'none' }}>Start Editing ✂️</button>
                    )}

                    {task.video_url && (
                      <button onClick={() => { setSelectedTask(task); setShowFeedback(true); }} className="action-btn">View Feedback 💬</button>
                    )}

                    {task.status === 'editing' && (
                      <button onClick={() => { setSelectedTask(task); setShowUpload(true); }} className="action-btn primary">
                        {task.video_uploaded ? 'Upload New Version' : 'Upload Final'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Frame.io Style Feedback Modal */}
      {showFeedback && selectedTask && (
        <div className="modal-overlay">
          <div className="feedback-grid">
            <div style={{ display: 'flex', flexDirection: 'column', background: '#000' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video ref={videoRef} src={selectedTask.video_url} controls style={{ width: '100%', maxHeight: '70vh' }} />
              </div>
              <div style={{ padding: 20, borderTop: '1px solid var(--border-subtle)', background: '#0a0a0f', textAlign: 'right' }}>
                <button onClick={() => setShowFeedback(false)} className="action-btn">Close Player</button>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 700, fontSize: 14 }}>Annotations</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {comments.length === 0 ? <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>No feedback yet.</div> : null}
                {comments.map((c, i) => (
                  <div key={i} className="comment-item" onClick={() => seekTo(c.timestamp)}>
                    <span className="timestamp-tag">{formatTime(c.timestamp)}</span>
                    <div style={{ fontSize: 13, color: '#fff', marginTop: 6, lineHeight: 1.4 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polished Upload Modal */}
      {showUpload && selectedTask && (
        <div className="modal-overlay">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 32, width: '100%', max_width: 400, textAlign: 'center' }}>
            {uploaded ? (
              <div style={{ color: '#00D084', fontWeight: 700 }}>🚀 Asset Deployed Successfully!</div>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Upload New Asset</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{selectedTask.title}</div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ color: '#fff', fontSize: 12 }} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowUpload(false)} className="action-btn" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={handleRealUpload} disabled={!file || uploading} className="action-btn primary" style={{ flex: 1 }}>
                    {uploading ? 'Uploading...' : 'Deploy Version'}
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