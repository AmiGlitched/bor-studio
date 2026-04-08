'use client'
import { useState } from 'react'

const editorData: Record<string, any> = {
  'vishesh': {
    name: 'Vishesh',
    tasks: [
      { id: 1, client: 'Hamdan', title: 'Community launch reel', status: 'internal_review', deadline: '2026-04-08', driveLink: 'https://drive.google.com', videoUploaded: true, revisionNote: '', type: 'Reel' },
      { id: 2, client: 'Ahad', title: 'European market reel', status: 'internal_review', deadline: '2026-04-09', driveLink: 'https://drive.google.com', videoUploaded: true, revisionNote: '', type: 'Reel' },
      { id: 3, client: 'Hamdan', title: 'WhatsApp community promo', status: 'editing', deadline: '2026-04-10', driveLink: 'https://drive.google.com', videoUploaded: false, revisionNote: '', type: 'Reel' },
      { id: 4, client: 'Sachin', title: 'Jumeirah Park promo', status: 'client_review', deadline: '2026-04-07', driveLink: 'https://drive.google.com', videoUploaded: true, revisionNote: '', type: 'Reel' },
    ]
  },
  'ayush': {
    name: 'Ayush',
    tasks: [
      { id: 5, client: 'Valentino', title: 'Milestone reel — 10K', status: 'editing', deadline: '2026-04-07', driveLink: 'https://drive.google.com', videoUploaded: false, revisionNote: 'Make intro shorter, change music to something more energetic', type: 'Reel' },
      { id: 6, client: 'Erman', title: 'Marina listing video', status: 'editing', deadline: '2026-04-09', driveLink: 'https://drive.google.com', videoUploaded: false, revisionNote: '', type: 'Reel' },
      { id: 7, client: 'Bassel', title: 'Agency intro reel', status: 'editing', deadline: '2026-04-10', driveLink: 'https://drive.google.com', videoUploaded: false, revisionNote: '', type: 'Reel' },
      { id: 8, client: 'Olea', title: 'Property showcase reel', status: 'client_review', deadline: '2026-04-08', driveLink: 'https://drive.google.com', videoUploaded: true, revisionNote: '', type: 'Reel' },
    ]
  }
}

const statusConfig: Record<string, { label: string, bg: string, text: string }> = {
  editing: { label: 'Editing', bg: '#fff8f0', text: '#e67e22' },
  internal_review: { label: 'Submitted for review', bg: '#eff6ff', text: '#2980b9' },
  client_review: { label: 'With client', bg: '#f5f3ff', text: '#8e44ad' },
  approved: { label: 'Approved', bg: '#f0fdf4', text: '#27ae60' },
}

export default function EditorView() {
  const [selectedEditor, setSelectedEditor] = useState('vishesh')
  const [tasks, setTasks] = useState(editorData)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const editor = tasks[selectedEditor]
  const activeTasks = editor.tasks.filter((t: any) => t.status !== 'approved')
  const doneTasks = editor.tasks.filter((t: any) => t.status === 'approved')

  function markUploaded(taskId: number, url: string) {
    setTasks({
      ...tasks,
      [selectedEditor]: {
        ...editor,
        tasks: editor.tasks.map((t: any) =>
          t.id === taskId ? { ...t, videoUploaded: true, status: 'internal_review', videoUrl: url } : t
        )
      }
    })
    setUploading(false)
    setUploaded(true)
    setTimeout(() => {
      setUploaded(false)
      setShowUpload(false)
      setSelectedTask(null)
      setUploadUrl('')
    }, 2000)
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00', fontWeight: 700, fontSize: 14 }}>B</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Editor portal</div>
            <div style={{ fontSize: 11, color: '#999' }}>BOR Studio</div>
          </div>
        </div>

        {/* Editor switcher */}
        <div style={{ display: 'flex', gap: 6, background: '#f5f5f5', padding: 4, borderRadius: 10 }}>
          {Object.keys(editorData).map(key => (
            <button key={key} onClick={() => setSelectedEditor(key)} style={{
              padding: '6px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none',
              background: selectedEditor === key ? '#111' : 'transparent',
              color: selectedEditor === key ? '#fff' : '#888',
              fontWeight: selectedEditor === key ? 500 : 400,
              textTransform: 'capitalize'
            }}>
              {editorData[key].name}
            </button>
          ))}
        </div>

        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#111' }}>
          {editor.name[0]}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Active tasks', value: activeTasks.length, color: '#111' },
            { label: 'Pending upload', value: activeTasks.filter((t: any) => !t.videoUploaded && t.status === 'editing').length, color: '#e67e22' },
            { label: 'With revision notes', value: editor.tasks.filter((t: any) => t.revisionNote).length, color: '#e74c3c' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Active tasks */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Active tasks</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {activeTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13, background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
              No active tasks right now
            </div>
          )}
          {activeTasks.map((task: any) => {
            const sc = statusConfig[task.status]
            const isOverdue = new Date(task.deadline) < new Date()
            const needsUpload = task.status === 'editing' && !task.videoUploaded
            return (
              <div key={task.id} style={{
                background: '#fff',
                border: task.revisionNote ? '1px solid #e67e22' : '1px solid #eee',
                borderLeft: task.revisionNote ? '3px solid #e67e22' : isOverdue ? '3px solid #e74c3c' : '3px solid transparent',
                borderRadius: 12, padding: '16px 18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#bbb', marginBottom: 3 }}>{task.client} · {task.type}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{task.title}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 12 }}>
                    {sc.label}
                  </span>
                </div>

                {task.revisionNote && (
                  <div style={{ padding: '10px 14px', background: '#fff8f0', borderRadius: 8, marginBottom: 12, border: '1px solid #fde8cc' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#e67e22', marginBottom: 4 }}>Revision requested</div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{task.revisionNote}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: isOverdue ? '#e74c3c' : '#999' }}>
                      {isOverdue ? 'Overdue · ' : 'Due · '}{task.deadline}
                    </span>
                    {task.videoUploaded
                      ? <span style={{ fontSize: 11, color: '#27ae60' }}>✓ Video uploaded</span>
                      : <span style={{ fontSize: 11, color: '#bbb' }}>No upload yet</span>
                    }
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={task.driveLink} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #eee', borderRadius: 8, background: '#f9f9f9', color: '#111', textDecoration: 'none' }}>
                      Open Drive
                    </a>
                    {needsUpload && (
                      <button onClick={() => { setSelectedTask(task); setShowUpload(true) }}
                        style={{ fontSize: 12, padding: '5px 14px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                        Submit video
                      </button>
                    )}
                    {task.revisionNote && task.videoUploaded && (
                      <button onClick={() => { setSelectedTask(task); setShowUpload(true) }}
                        style={{ fontSize: 12, padding: '5px 14px', border: 'none', borderRadius: 8, background: '#e67e22', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                        Resubmit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 10 }}>Completed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {doneTasks.map((task: any) => (
                <div key={task.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#bbb', marginBottom: 2 }}>{task.client}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{task.title}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#27ae60' }}>Approved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420 }}>
            {uploaded ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#27ae60', marginBottom: 6 }}>Submitted successfully</div>
                <div style={{ fontSize: 13, color: '#888' }}>Fahad and Divyansh have been notified to review.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>Submit video</div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{selectedTask.client} · {selectedTask.title}</div>

                {selectedTask.revisionNote && (
                  <div style={{ padding: '10px 14px', background: '#fff8f0', borderRadius: 8, marginBottom: 16, border: '1px solid #fde8cc' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#e67e22', marginBottom: 4 }}>Revision notes to address</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{selectedTask.revisionNote}</div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Paste video link or upload path</div>
                  <input
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    placeholder="e.g. Google Drive link to final video..."
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #eee', borderRadius: 10, fontSize: 13, color: '#111', outline: 'none' }}
                  />
                </div>

                <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: 10, border: '2px dashed #eee', textAlign: 'center', marginBottom: 20, cursor: 'pointer' }}>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Or drag and drop video file here</div>
                  <div style={{ fontSize: 11, color: '#bbb' }}>MP4, MOV up to 2GB</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowUpload(false); setUploadUrl('') }}
                    style={{ flex: 1, padding: '10px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => { setUploading(true); setTimeout(() => markUploaded(selectedTask.id, uploadUrl), 1000) }}
                    disabled={!uploadUrl.trim()}
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: uploadUrl.trim() ? '#111' : '#ccc', color: '#fff', fontSize: 13, cursor: uploadUrl.trim() ? 'pointer' : 'default', fontWeight: 500 }}>
                    {uploading ? 'Submitting...' : 'Submit for review'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}