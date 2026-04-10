'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientPortal() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // Filters: all, pending, approved, posted
  
  const [portalMode, setPortalMode] = useState<'simple' | 'advanced'>('advanced')
  const [userId, setUserId] = useState<string | null>(null)

  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user?.id) return

    setUserId(user.id)
    const { data: profile } = await supabase.from('users').select('client_id, portal_mode').eq('auth_id', user.id).single()
    
    if (profile) {
      if (profile.portal_mode) setPortalMode(profile.portal_mode as 'simple' | 'advanced')
      
      if (profile.client_id) {
        const { data } = await supabase.from('videos').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
        if (data) setVideos(data)
      }
    }
    setLoading(false)
  }

  async function togglePortalMode() {
    const newMode = portalMode === 'simple' ? 'advanced' : 'simple'
    setPortalMode(newMode)
    if (userId) await supabase.from('users').update({ portal_mode: newMode }).eq('auth_id', userId)
  }

  useEffect(() => { if (selectedVideo) fetchComments(selectedVideo.id) }, [selectedVideo])

  async function fetchComments(videoId: string) {
    const { data } = await supabase.from('comments').select('*').eq('video_id', videoId).order('timestamp', { ascending: true })
    if (data) setComments(data)
  }

  async function postComment() {
    if (!newComment.trim() || !videoRef.current) return
    await supabase.from('comments').insert({ video_id: selectedVideo.id, author_name: 'Client', timestamp: videoRef.current.currentTime, text: newComment })
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

  // Enhanced Filtering Logic
  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || (v.type && v.type.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'pending' 
        ? (v.status !== 'approved' && v.status !== 'posted') 
        : v.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const needsReview = videos.filter(v => v.status === 'client_review')

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .page-container { max-width: 1200px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        .stat-card { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 24px; }
        .asset-card { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 24px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; margin-bottom: 16px; }
        .asset-card:hover { border-color: #333; }
        .btn { padding: 12px 24px; border-radius: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; border: 1px solid #333; background: #111; color: #fff; }
        .btn-gold { background: #D4AF37; border: none; color: #000; }
        .search-bar { box-sizing: border-box; width: 100%; background: #0a0a0f; border: 1px solid #222; border-radius: 8px; padding: 16px 20px; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
        .search-bar:focus { border-color: #D4AF37; }
        .toggle-switch { display: flex; background: #111; border: 1px solid #222; border-radius: 8px; overflow: hidden; cursor: pointer; }
        .toggle-btn { padding: 8px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; transition: 0.2s; }
        .filter-btn { background: transparent; border: 1px solid #222; color: #666; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: 0.2s; }
        .filter-btn.active { background: #222; color: #fff; border-color: #444; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 40px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>Client Portal</div>
        <div className="toggle-switch" onClick={togglePortalMode}>
          <div className="toggle-btn" style={{ background: portalMode === 'simple' ? '#D4AF37' : 'transparent', color: portalMode === 'simple' ? '#000' : '#666' }}>Simple</div>
          <div className="toggle-btn" style={{ background: portalMode === 'advanced' ? '#D4AF37' : 'transparent', color: portalMode === 'advanced' ? '#000' : '#666' }}>Advanced</div>
        </div>
      </div>

      <div className="page-container">
        
        {/* === SIMPLE MODE VIEW === */}
        {portalMode === 'simple' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, marginBottom: 8 }}>Action Required</h1>
              <p style={{ color: '#888', fontSize: 14 }}>Videos awaiting your final approval before publishing.</p>
            </div>

            {needsReview.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', background: '#0a0a0f', borderRadius: 12, border: '1px dashed #222' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>You're all caught up!</div>
                <div style={{ color: '#666', fontSize: 13 }}>No pending videos to review right now.</div>
              </div>
            ) : (
              needsReview.map(video => (
                <div key={video.id} className="asset-card" style={{ borderLeft: '3px solid #D4AF37' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Ready for Review</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#fff' }}>{video.title}</div>
                  </div>
                  <button onClick={() => setSelectedVideo(video)} className="btn btn-gold">Review & Approve</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* === ADVANCED MODE VIEW === */}
        {portalMode === 'advanced' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
              <div className="stat-card">
                <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>Posted</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#7B61FF', lineHeight: 1 }}>{videos.filter(v => v.status === 'posted').length}</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>Ready for Post</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#00D084', lineHeight: 1 }}>{videos.filter(v => v.status === 'approved').length}</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>In Review</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>{needsReview.length}</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>In Production</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#E84393', lineHeight: 1 }}>{videos.filter(v => v.status === 'editing' || v.status === 'internal_review').length}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 32, alignItems: 'center' }}>
              <input type="text" className="search-bar" style={{ margin: 0, flex: 1 }} placeholder="Search your video archive..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              
              <div style={{ display: 'flex', gap: 8 }}>
                {['all', 'pending', 'approved', 'posted'].map(status => (
                  <button key={status} className={`filter-btn ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              {searchQuery ? 'Search Results' : 'Asset Library'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredVideos.filter(v => v.video_uploaded).map(video => (
                <div key={video.id} className="asset-card">
                  <div>
                    <div style={{ fontSize: 10, color: '#666', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{video.type || 'REEL'}</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#fff' }}>{video.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid #222', borderRadius: 6,
                      color: video.status === 'posted' ? '#7B61FF' : video.status === 'approved' ? '#00D084' : '#D4AF37' 
                    }}>
                      {video.status === 'client_review' ? 'Review Needed' : video.status}
                    </div>
                    <button onClick={() => setSelectedVideo(video)} className="btn btn-gold">View Asset</button>
                  </div>
                </div>
              ))}
              {filteredVideos.filter(v => v.video_uploaded).length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#666', border: '1px dashed #222', borderRadius: 12 }}>No assets found matching your criteria.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Frame.io Player Modal */}
      {selectedVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 40 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a22', borderRadius: 16, width: '100%', maxWidth: 1240, display: 'grid', gridTemplateColumns: '1fr 380px', height: '85vh', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', background: '#050505' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <video ref={videoRef} src={selectedVideo.video_url} controls style={{ width: '100%', maxHeight: '70vh', borderRadius: 8, border: '1px solid #1a1a22' }} />
              </div>
              <div style={{ padding: '24px 32px', background: '#0a0a0f', borderTop: '1px solid #1a1a22', display: 'flex', gap: 16 }}>
                
                {/* Dynamically show buttons based on status */}
                {selectedVideo.status !== 'approved' && selectedVideo.status !== 'posted' && (
                  <button onClick={() => updateStatus('approved')} className="btn" style={{ flex: 1, background: '#00D084', color: '#000', border: 'none' }}>Approve Asset</button>
                )}
                
                {selectedVideo.status === 'approved' && (
                  <button onClick={() => updateStatus('posted')} className="btn" style={{ flex: 1, background: '#7B61FF', color: '#fff', border: 'none' }}>Mark as Posted</button>
                )}

                <button onClick={() => updateStatus('editing')} className="btn" style={{ flex: 1, background: '#111', color: '#E84393', borderColor: '#333' }}>Request Revision</button>
                <button onClick={() => setSelectedVideo(null)} className="btn">Close</button>
              </div>
            </div>

            <div style={{ background: '#0a0a0f', borderLeft: '1px solid #1a1a22', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a22', color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600 }}>Feedback Log</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {comments.map((c, i) => (
                  <div key={i} onClick={() => { if(videoRef.current) videoRef.current.currentTime = c.timestamp }} style={{ padding: 16, borderBottom: '1px solid #1a1a22', cursor: 'pointer' }}>
                    <span style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{formatTime(c.timestamp)}</span>
                    <div style={{ marginTop: 8, color: '#eee', fontSize: 13, lineHeight: 1.5 }}>{c.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 24, background: '#050505', borderTop: '1px solid #1a1a22' }}>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Log revision note at current timestamp..." style={{ boxSizing: 'border-box', width: '100%', background: '#0a0a0f', color: '#fff', border: '1px solid #222', borderRadius: 8, padding: 16, fontSize: 13, minHeight: 100, resize: 'none', marginBottom: 12, outline: 'none' }} />
                <button onClick={postComment} className="btn btn-gold" style={{ width: '100%' }}>Log Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}