'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function Reviews() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [processing, setProcessing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      // FIXED: Switched ordering to created_at to avoid the 'updated_at' crash
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          clients (
            name
          )
        `)
        .in('status', ['internal_review', 'client_review'])
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Supabase Error:", error)
      }

      setVideos(data || [])
    } catch (err: any) {
      console.error("System Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedVideo) fetchComments(selectedVideo.id)
  }, [selectedVideo])

  async function fetchComments(videoId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('timestamp', { ascending: true })
    
    if (error) console.error("Comment Error:", error)
    if (data) setComments(data)
  }

  async function addTimestampedComment() {
    if (!newComment.trim() || !videoRef.current || !selectedVideo) return
    
    const timestamp = videoRef.current.currentTime

    const { error } = await supabase.from('comments').insert({
      video_id: selectedVideo.id,
      author_name: 'Admin', 
      timestamp: timestamp,
      text: newComment
    })

    if (!error) {
      setNewComment('')
      fetchComments(selectedVideo.id)
    }
  }

  async function handleStatusChange(status: 'client_review' | 'editing' | 'approved') {
    setProcessing(true)
    const { error } = await supabase.from('videos').update({ status }).eq('id', selectedVideo.id)
    if (error) alert(error.message)
    
    setProcessing(false)
    setSelectedVideo(null)
    loadData()
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
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

  const internalReviews = videos.filter(v => v.status === 'internal_review')
  const clientReviews = videos.filter(v => v.status === 'client_review')

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .review-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .review-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: #4A90E2; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 40px; }
        .modal-content { background: #000; border: 1px solid var(--border-subtle); border-radius: 20px; width: 100%; max-width: 1200px; display: grid; grid-template-columns: 1fr 350px; height: 85vh; overflow: hidden; }
        .comment-item { padding: 12px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.2s; }
        .comment-item:hover { background: rgba(255,255,255,0.05); }
        .timestamp-tag { background: rgba(123, 97, 255, 0.2); color: #7B61FF; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-right: 8px; }
        .dark-input { width: 100%; padding: 12px; background: #1a1a22; border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 13px; outline: none; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Review & Annotation Center</div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>Syncing Review Queue...</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <div style={{ background: 'rgba(74, 144, 226, 0.1)', border: '1px solid rgba(74, 144, 226, 0.3)', borderRadius: 12, padding: '16px 24px', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#4A90E2', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Internal QA</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{internalReviews.length}</div>
              </div>
              <div style={{ background: 'rgba(123, 97, 255, 0.1)', border: '1px solid rgba(123, 97, 255, 0.3)', borderRadius: 12, padding: '16px 24px', flex: 1 }}>
                <div style={{ fontSize: 11, color: '#7B61FF', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>With Client</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{clientReviews.length}</div>
              </div>
            </div>

            {videos.length === 0 ? (
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Review queue is empty</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                   Move videos to <strong>Internal Review</strong> or <strong>Client Review</strong> in the Pipeline to see them here.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {internalReviews.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase' }}>Needs Your Approval</div>
                    {internalReviews.map(v => (
                      <div key={v.id} className="review-card">
                        <div>
                          <div style={{ fontSize: 11, color: '#4A90E2', fontWeight: 700, marginBottom: 4 }}>{v.clients?.name || 'Client'}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{v.title}</div>
                        </div>
                        <button onClick={() => setSelectedVideo(v)} style={{ padding: '8px 16px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Watch & Annotate</button>
                      </div>
                    ))}
                  </div>
                )}

                {clientReviews.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase' }}>Currently with Client</div>
                    {clientReviews.map(v => (
                      <div key={v.id} className="review-card">
                        <div>
                          <div style={{ fontSize: 11, color: '#7B61FF', fontWeight: 700, marginBottom: 4 }}>{v.clients?.name || 'Client'}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{v.title}</div>
                        </div>
                        <button onClick={() => setSelectedVideo(v)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Open Player</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selectedVideo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', flexDirection: 'column', background: '#000' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {selectedVideo.video_url ? (
                  <video ref={videoRef} src={selectedVideo.video_url} controls style={{ width: '100%', maxHeight: '70vh' }} />
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>Video file missing.</div>
                )}
              </div>
              <div style={{ padding: '20px', borderTop: '1px solid var(--border-subtle)', background: '#0a0a0f', display: 'flex', gap: 12 }}>
                <button onClick={() => handleStatusChange('client_review')} className="dark-input" style={{ background: '#7B61FF', border: 'none', fontWeight: 700, cursor: 'pointer', flex: 1 }}>Approve & Send to Client</button>
                <button onClick={() => handleStatusChange('editing')} className="dark-input" style={{ background: '#E84393', border: 'none', fontWeight: 700, cursor: 'pointer', flex: 1 }}>Reject & Notify Editor</button>
                <button onClick={() => setSelectedVideo(null)} className="dark-input" style={{ flex: 0.3, cursor: 'pointer' }}>Close</button>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: '#0a0a0f' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 14, fontWeight: 700, color: '#fff' }}>Annotations</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {comments.length === 0 && (
                  <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center' }}>No annotations yet.</div>
                )}
                {comments.map((c, i) => (
                  <div key={i} className="comment-item" onClick={() => seekTo(c.timestamp)}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <span className="timestamp-tag">{formatTime(c.timestamp)}</span>
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{c.author_name}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '16px', background: '#13131a', borderTop: '1px solid var(--border-subtle)' }}>
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a comment..."
                  className="dark-input"
                  style={{ minHeight: 80, marginBottom: 12, resize: 'none' }}
                />
                <button onClick={addTimestampedComment} style={{ width: '100%', padding: '10px', background: 'var(--primary-gradient)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Post Annotation</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}