'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientPortal() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  
  // Feedback State
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
      if (data) setVideos(data)
    }
  }

  useEffect(() => {
    if (selectedVideo) fetchComments(selectedVideo.id)
  }, [selectedVideo])

  async function fetchComments(videoId: string) {
    const { data } = await supabase.from('comments').select('*').eq('video_id', videoId).order('timestamp', { ascending: true })
    if (data) setComments(data)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .page-container { max-width: 1200px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; marginBottom: 48px; }
        .stat-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px 32px; position: relative; overflow: hidden; }
        .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 8px; }
        .stat-value { font-size: 36px; font-weight: 800; color: #fff; line-height: 1; }
        .stat-glow { position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; filter: blur(40px); opacity: 0.1; }

        /* Video List */
        .asset-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 20px; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; margin-bottom: 16px; }
        .asset-card:hover { transform: translateY(-2px); border-color: #7B61FF; box-shadow: 0 12px 32px rgba(0,0,0,0.4); }

        /* Buttons */
        .btn { padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-subtle); background: rgba(255,255,255,0.03); color: #fff; }
        .btn:hover { background: rgba(255,255,255,0.08); border-color: #fff; }
        .btn-primary { background: var(--primary-gradient); border: none; box-shadow: 0 4px 15px rgba(123, 97, 255, 0.3); }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 40px; }
        .modal-content { background: #000; border: 1px solid var(--border-subtle); border-radius: 24px; width: 100%; max-width: 1240px; display: grid; grid-template-columns: 1fr 380px; height: 85vh; overflow: hidden; }
        .comment-box { padding: 16px; border-bottom: 1px solid var(--border-subtle); transition: background 0.2s; cursor: pointer; }
        .comment-box:hover { background: rgba(255,255,255,0.05); }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>My Assets</div>
      </div>

      <div className="page-container">
        {/* Metrics Section - More spaced out */}
        <div className="stats-grid">
          {[
            { label: 'Ready for Post', value: videos.filter(v => v.status === 'approved').length, color: '#00D084' },
            { label: 'In QA / Review', value: videos.filter(v => v.status === 'client_review').length, color: '#7B61FF' },
            { label: 'In Production', value: videos.filter(v => v.status === 'editing' || v.status === 'internal_review').length, color: '#E84393' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-glow" style={{ background: stat.color }}></div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: 16, background: '#7B61FF', borderRadius: 2 }}></div>
          Recent Deliveries
        </div>

        {/* Video List - Larger cards with better spacing */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {videos.filter(v => v.video_uploaded).length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 24, border: '1px dashed var(--border-subtle)' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
              <div style={{ color: '#fff', fontWeight: 600 }}>Your video queue is being prepared</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Once a video is ready for your review, it will appear here.</div>
            </div>
          ) : (
            videos.filter(v => v.video_uploaded).map(video => (
              <div key={video.id} className="asset-card">
                <div>
                  <div style={{ fontSize: 11, color: '#7B61FF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{video.type || 'REEL'}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{video.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: video.status === 'approved' ? '#00D084' : '#F5A623', padding: '6px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 20 }}>
                    {video.status === 'approved' ? '✓ Approved' : '• Awaiting Approval'}
                  </div>
                  <button onClick={() => setSelectedVideo(video)} className="btn btn-primary">Watch Video</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Professional Player Modal */}
      {selectedVideo && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Player Side */}
            <div style={{ display: 'flex', flexDirection: 'column', background: '#000' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video ref={videoRef} src={selectedVideo.video_url} controls style={{ width: '100%', maxHeight: '70vh' }} />
              </div>
              <div style={{ padding: '24px 32px', background: '#0a0a0f', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16 }}>
                <button onClick={() => updateStatus('approved')} className="btn" style={{ flex: 1, background: '#00D084', color: '#000', border: 'none' }}>Approve for Posting ✅</button>
                <button onClick={() => updateStatus('editing')} className="btn" style={{ flex: 1, background: '#E84393', border: 'none' }}>Request Edits ❌</button>
                <button onClick={() => setSelectedVideo(null)} className="btn">Close</button>
              </div>
            </div>

            {/* Feedback Side */}
            <div style={{ background: '#0a0a0f', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 700, fontSize: 15 }}>Feedback Panel</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {comments.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>No feedback yet. Add your thoughts at specific timestamps!</div>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="comment-box" onClick={() => { if(videoRef.current) videoRef.current.currentTime = c.timestamp }}>
                      <span style={{ fontSize: 10, background: 'rgba(123, 97, 255, 0.2)', color: '#7B61FF', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{formatTime(c.timestamp)}</span>
                      <div style={{ marginTop: 8, color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{c.text}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: 24, background: '#111', borderTop: '1px solid var(--border-subtle)' }}>
                <textarea 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  placeholder="Drop a note at this time..." 
                  style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, fontSize: 13, minHeight: 100, resize: 'none', marginBottom: 12 }} 
                />
                <button onClick={postComment} className="btn btn-primary" style={{ width: '100%' }}>Post Comment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}