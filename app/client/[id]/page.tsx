'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function ReviewRoom() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // AI State
  const [aiSummary, setAiSummary] = useState<string[] | null>(null)
  const [generatingAi, setGeneratingAi] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function loadData() {
      // 1. Get logged in user
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data: userProfile } = await supabase.from('users').select('*').eq('auth_id', authData.user.id).single()
        setCurrentUser(userProfile)
      }

      // 2. Fetch Task and Video URL
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`*, projects ( name, clients ( name ) )`)
        .eq('id', taskId)
        .single()
      
      if (taskData) setTask(taskData)

      // 3. Fetch Comments
      fetchComments()
      setLoading(false)
    }
    loadData()
  }, [taskId])

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select(`*, users ( name, role )`)
      .eq('task_id', taskId)
      .order('timestamp_seconds', { ascending: true })
    
    if (data) setComments(data)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      videoRef.current.play()
    }
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser) return

    const currentTime = videoRef.current?.currentTime || 0

    await supabase.from('comments').insert({
      task_id: taskId,
      user_id: currentUser.id,
      timestamp_seconds: currentTime,
      content: newComment
    })

    setNewComment('')
    fetchComments()
    
    // Auto-pause video when they submit so they can keep reviewing
    if (videoRef.current) videoRef.current.pause()
  }

  const generateSummary = async () => {
    setGeneratingAi(true)
    try {
      // Format comments for AI
      const formattedComments = comments.map(c => ({
        time: formatTime(c.timestamp_seconds),
        author: c.users?.name,
        text: c.content
      }))

      const response = await fetch('/api/summarize-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: formattedComments, taskTitle: task?.title }),
      })
      
      const data = await response.json()
      if (data.action_plan) setAiSummary(data.action_plan)
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingAi(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: '#D4AF37', background: '#050505', minHeight: '100vh' }}>Loading Review Room...</div>

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050505', color: '#fff' }}>
      
      {/* Left Side: Video Player */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a22' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #1a1a22', background: '#0a0a0f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {task?.projects?.clients?.name} • {task?.projects?.name}
            </div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, margin: 0 }}>{task?.title}</h1>
          </div>
          <button onClick={() => router.back()} style={{ background: '#1a1a22', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            ← Back
          </button>
        </div>

        <div style={{ flex: 1, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          {task?.file_url ? (
            <video 
              ref={videoRef}
              src={task.file_url} 
              controls 
              style={{ width: '100%', maxHeight: '70vh', borderRadius: 12, border: '1px solid #1a1a22', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} 
            />
          ) : (
            <div style={{ color: '#666', border: '1px dashed #1a1a22', padding: 40, borderRadius: 12 }}>No video asset uploaded yet.</div>
          )}
        </div>
      </div>

      {/* Right Side: Comments & AI Summary */}
      <div style={{ width: 400, display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
        <div style={{ padding: 24, borderBottom: '1px solid #1a1a22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Timestamped Feedback</h2>
          {currentUser?.role !== 'client' && (
            <button 
              onClick={generateSummary}
              disabled={generatingAi || comments.length === 0}
              style={{ background: 'transparent', color: '#D4AF37', border: '1px solid #D4AF37', padding: '6px 12px', borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', cursor: generatingAi ? 'not-allowed' : 'pointer', opacity: (generatingAi || comments.length === 0) ? 0.5 : 1 }}
            >
              {generatingAi ? 'Summarizing...' : 'AI Summary'}
            </button>
          )}
        </div>

        {/* AI Summary Banner (Only shows when generated) */}
        {aiSummary && (
          <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 100%)', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', padding: 20 }}>
            <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>AI Action Plan</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#fff', fontSize: 13, lineHeight: 1.5 }}>
              {aiSummary.map((point, i) => (
                <li key={i} style={{ marginBottom: 8 }}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Comments List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {comments.length === 0 ? (
            <div style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No comments yet. Play the video and add a note.</div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ background: '#050505', border: '1px solid #1a1a22', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.users?.role === 'client' ? '#E84393' : '#D4AF37' }}>{c.users?.name}</span>
                  <button 
                    onClick={() => handleSeek(c.timestamp_seconds)}
                    style={{ background: '#1a1a22', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer' }}
                  >
                    {formatTime(c.timestamp_seconds)}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#ccc', lineHeight: 1.5 }}>{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Input */}
        <div style={{ padding: 24, borderTop: '1px solid #1a1a22', background: '#050505' }}>
          <form onSubmit={submitComment} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a note at current time..."
              style={{ flex: 1, background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 13, outline: 'none' }}
            />
            <button type="submit" style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '0 20px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}