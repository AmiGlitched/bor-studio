'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientDashboard() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()
    
    if (profile) {
      const { data } = await supabase.from('videos').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      setVideos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedVideo) fetchComments(selectedVideo.id)
  }, [selectedVideo])

  async function fetchComments(videoId: string) {
    const { data } = await supabase.from('comments').select('*').eq('video_id', videoId).order('timestamp', { ascending: true })
    setComments(data || [])
  }

  async function postComment() {
    if (!newComment.trim() || !videoRef.current) return
    await supabase.from('comments').insert({
      video_id: selectedVideo.id,
      author_name: 'Client',
      timestamp: videoRef.current.currentTime,
      text: newComment
    })
    setNewComment(''); fetchComments(selectedVideo.id)
  }

  async function updateStatus(status: string) {
    await supabase.from('videos').update({ status }).eq('id', selectedVideo.id)
    setSelectedVideo(null); loadData()
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .metric-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 16px 24px; position: relative; overflow: hidden; }
        .video-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; transition: all 0.2s; }
        .video-card:hover { transform: translateY(-2px); border-color: #7B61FF; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 40px; }
        .review-grid { background: #000; border: 1px solid var(--border-subtle); border-radius: 20px; width: 100%; max-width: 1100px; display: grid; grid-template-columns: 1fr 320px; height: 80vh; overflow: hidden; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>My Video Assets</div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div className="metric-card">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Ready to Post</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#00D084' }}>{videos.filter(v => v.status === 'approved').length}</div>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>In Review</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#7B61FF' }}>{videos.filter(v => v.status === 'client_review').length}</div>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Being Edited</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#E84393' }}>{videos.filter(v => v.status === 'editing').length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {videos.filter(v => v.video_uploaded).map(v => (
            <div key={v.id} className="video-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#7B61FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{v.type || 'Reel'}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{v.title}</div>
                </div>
                <button onClick={() => setSelectedVideo(v)} style={{ padding: '10px 24px', background: v.status === 'client_review' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  {v.status === 'client_review' ? 'Review & Approve' : 'Watch Video'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedVideo && (
        <div className="modal-overlay">
          <div className="review-grid">
            <div style={{ display: 'flex', flexDirection: 'column', background: '#000' }}>
              <video ref={videoRef} src={selectedVideo.video_url} controls style={{ width: '100%', flex: 1 }} />
              <div style={{ padding: 20, display: 'flex', gap: 12, background: '#0a0a0f' }}>
                <button onClick={() => updateStatus('approved')} style={{ flex: 1, background: '#00D084', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Approve ✅</button>
                <button onClick={() => updateStatus('editing')} style={{ flex: 1, background: '#E84393', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Request Edits ❌</button>
                <button onClick={() => setSelectedVideo(null)} style={{ flex: 0.3, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #333', padding: 12, borderRadius: 8, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', color: '#fff', fontWeight: 700, borderBottom: '1px solid #333' }}>Timestamps</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {comments.map((c, i) => (
                  <div key={i} style={{ marginBottom: 12, fontSize: 13, color: '#fff' }}>
                    <span style={{ color: '#7B61FF', fontWeight: 700 }}>{Math.floor(c.timestamp)}s:</span> {c.text}
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, borderTop: '1px solid #333' }}>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type feedback..." style={{ width: '100%', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 13 }} />
                <button onClick={postComment} style={{ width: '100%', padding: 10, background: '#7B61FF', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Post Feedback</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}