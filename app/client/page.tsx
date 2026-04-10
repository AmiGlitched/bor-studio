'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientPortal() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Feedback State
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user?.id) return

    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()
    
    if (profile?.client_id) {
      const { data } = await supabase.from('videos').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      if (data) setVideos(data)
    }
    setLoading(false)
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
    setNewComment('')
    fetchComments(selectedVideo.id)
  }

  async function updateStatus(status: string) {
    await supabase.from('videos').update({ status }).eq('id', selectedVideo.id)
    setSelectedVideo(null)
    loadData()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // AI Semantic Search Filter (Frontend implementation)
  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (v.type && v.type.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .page-container { max-width: 1200px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        
        .stat-card { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 24px; position: relative; overflow: hidden; }
        .stat-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px; }
        .stat-value { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #fff; line-height: 1; }

        .asset-card { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 24px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; margin-bottom: 16px; }
        .asset-card:hover { border-color: #333; }

        .btn { padding: 12px 24px; border-radius: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s; border: 1px solid #333; background: #111; color: #fff; }
        .btn:hover { background: #1a1a22; border-color: #444; }
        .btn-gold { background: #D4AF37; border: none; color: #000; }
        .btn-gold:hover { background: #e5c048; }

        .search-bar { width: 100%; background: #0a0a0f; border: 1px solid #222; border-radius: 8px; padding: 16px 20px; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .search-bar:focus { border-color: #D4AF37; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 40px; }
        .modal-content { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 16px; width: 100%; max-width: 1240px; display: grid; grid-template-columns: 1fr 380px; height: 85vh; overflow: hidden; }
        .comment-box { padding: 16px; border-bottom: 1px solid #1a1a22; transition: background 0.2s; cursor: pointer; }
        .comment-box:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      <div className="glass-header" style={{ padding: '0 40px', height: 70, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>Asset Library</div>
      </div>

      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
          <div className="stat-card">
            <div className="stat-label">Ready for Post</div>
            <div className="stat-value" style={{ color: '#00D084' }}>{videos.filter(v => v.status === 'approved').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Review</div>
            <div className="stat-value" style={{ color: '#D4AF37' }}>{videos.filter(v => v.status === 'client_review').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Production</div>
            <div className="stat-value" style={{ color: '#E84393' }}>{videos.filter(v => v.status === 'editing' || v.status === 'internal_review').length}</div>
          </div>
        </div>

        {/* The Contextual Search Bar */}
        <div style={{ marginBottom: 32 }}>
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search your video archive (e.g., 'Almond Milk Promo' or 'Reel')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
          {searchQuery ? 'Search Results' : 'Recent Deliveries'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredVideos.filter(v => v.video_uploaded).length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: '#0a0a0f', borderRadius: 12, border: '1px dashed #222' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No assets found</div>
              <div style={{ color: '#666', fontSize: 13 }}>{searchQuery ? 'Try adjusting your search terms.' : 'Your video queue is currently empty.'}</div>
            </div>
          ) : (
            filteredVideos.filter(v => v.video_uploaded).map(video => (
              <div key={video.id} className="asset-card">
                <div>
                  <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{video.type || 'REEL'}</div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#fff' }}>{video.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: video.status === 'approved' ? '#00D084' : '#D4AF37', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid #222', borderRadius: 6 }}>
                    {video.status === 'approved' ? 'Approved' : 'Awaiting Review'}
                  </div>
                  <button onClick={() => setSelectedVideo(video)} className="btn btn-gold">Review Asset</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Frame.io Player Modal */}
      {selectedVideo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', flexDirection: 'column', background: '#050505' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <video ref={videoRef} src={selectedVideo.video_url} controls style={{ width: '100%', maxHeight: '70vh', borderRadius: 8, border: '1px solid #1a1a22' }} />
              </div>
              <div style={{ padding: '24px 32px', background: '#0a0a0f', borderTop: '1px solid #1a1a22', display: 'flex', gap: 16 }}>
                <button onClick={() => updateStatus('approved')} className="btn" style={{ flex: 1, background: '#00D084', color: '#000', border: 'none' }}>Approve Asset</button>
                <button onClick={() => updateStatus('editing')} className="btn" style={{ flex: 1, background: '#111', color: '#E84393', borderColor: '#333' }}>Request Revision</button>
                <button onClick={() => setSelectedVideo(null)} className="btn">Close</button>
              </div>
            </div>

            <div style={{ background: '#0a0a0f', borderLeft: '1px solid #1a1a22', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a22', color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600 }}>Feedback Log</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {comments.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#666', fontSize: 13 }}>No annotations logged.</div>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="comment-box" onClick={() => { if(videoRef.current) videoRef.current.currentTime = c.timestamp }}>
                      <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{formatTime(c.timestamp)}</span>
                      <div style={{ marginTop: 8, color: '#eee', fontSize: 13, lineHeight: 1.5 }}>{c.text}</div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: 24, background: '#050505', borderTop: '1px solid #1a1a22' }}>
                <textarea 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  placeholder="Log revision note at current timestamp..." 
                  style={{ width: '100%', background: '#0a0a0f', color: '#fff', border: '1px solid #222', borderRadius: 8, padding: 16, fontSize: 13, minHeight: 100, resize: 'none', marginBottom: 12, outline: 'none' }} 
                />
                <button onClick={postComment} className="btn btn-gold" style={{ width: '100%' }}>Log Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}