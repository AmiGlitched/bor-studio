'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientVideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()
    
    if (profile?.client_id) {
      const { data: clientData } = await supabase.from('clients').select('*').eq('id', profile.client_id).single()
      setClient(clientData)

      const { data: videoData } = await supabase
        .from('videos')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('deadline', { ascending: true })
      
      if (videoData) setVideos(videoData)
    }
    setLoading(false)
  }

  async function handleReviewSubmit(status: 'approved' | 'editing') {
    if (status === 'editing' && !feedback.trim()) {
      return alert("Please enter revision notes so the editor knows what to fix.")
    }
    
    setProcessing(true)
    await supabase.from('videos').update({ 
      status: status, 
      revision_note: status === 'editing' ? feedback : null
    }).eq('id', selectedVideo.id)
    
    setProcessing(false)
    setSelectedVideo(null)
    setFeedback('')
    loadData()
  }

  const approvedCount = videos.filter(v => v.status === 'approved').length
  const inProgressCount = videos.filter(v => ['editing', 'internal_review'].includes(v.status)).length
  const needsReviewCount = videos.filter(v => v.status === 'client_review').length
  const packageTotal = client?.videos_per_month || 0

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
        .video-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center;
          transition: all 0.2s;
        }
        .video-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: #7B61FF; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; width: 100%; max-width: 900px; display: flex; overflow: hidden; max-height: 90vh;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .dark-textarea {
          width: 100%; flex: 1; padding: 14px; background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle); border-radius: 10px;
          color: #fff; font-size: 13px; resize: none; outline: none; transition: border 0.2s;
        }
        .dark-textarea:focus { border-color: #E84393; background: rgba(0,0,0,0.4); }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>My Videos</div>
        
        {needsReviewCount > 0 && (
          <div style={{ fontSize: 12, padding: '6px 16px', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid rgba(123, 97, 255, 0.3)', color: '#7B61FF', borderRadius: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, background: '#7B61FF', borderRadius: '50%', boxShadow: '0 0 8px #7B61FF' }}></span>
            {needsReviewCount} {needsReviewCount === 1 ? 'video' : 'videos'} ready for review
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        
        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', marginTop: 80 }}>Loading your assets...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
              {[
                { label: 'Package', value: packageTotal, sub: 'Videos/mo', color: '#4A90E2' },
                { label: 'Approved', value: approvedCount, sub: 'Ready to post', color: '#00D084' },
                { label: 'In Progress', value: inProgressCount, sub: 'Being edited', color: '#F5A623' },
                { label: 'Needs Review', value: needsReviewCount, sub: 'Action needed', color: '#7B61FF' },
              ].map(s => (
                <div key={s.label} className="metric-card">
                  <div className="metric-glow" style={{ background: s.color }}></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.color, marginTop: 8, fontWeight: 500 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {videos.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--border-subtle)', borderRadius: 16, color: 'var(--text-secondary)', fontSize: 14, background: 'rgba(0,0,0,0.2)' }}>
                  No videos found for this month yet.
                </div>
              )}

              {videos.map(video => {
                const isReady = video.status === 'client_review'
                const isApproved = video.status === 'approved'
                
                return (
                  <div key={video.id} className="video-card" style={{ borderLeft: `3px solid ${isReady ? '#7B61FF' : isApproved ? '#00D084' : 'var(--border-subtle)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 56, height: 56, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '12px solid var(--text-secondary)', marginLeft: 4 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{video.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}><span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#4A90E2' }}>{video.type || 'REEL'}</span> · Due {video.deadline || 'TBD'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      {isReady && <span style={{ fontSize: 11, padding: '4px 12px', background: 'rgba(123, 97, 255, 0.1)', color: '#7B61FF', borderRadius: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Needed</span>}
                      {isApproved && <span style={{ fontSize: 11, padding: '4px 12px', background: 'rgba(0, 208, 132, 0.1)', color: '#00D084', borderRadius: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</span>}
                      {['editing', 'internal_review'].includes(video.status) && <span style={{ fontSize: 11, padding: '4px 12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', borderRadius: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Production</span>}

                      {isReady && (
                        <button onClick={() => setSelectedVideo(video)} style={{ padding: '8px 24px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
                          Review Video
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Client Review Modal */}
      {selectedVideo && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            {/* Video Player Area */}
            <div style={{ flex: 1.5, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-subtle)' }}>
              {selectedVideo.video_url ? (
                <video src={selectedVideo.video_url} controls style={{ width: '100%', maxHeight: '90vh', outline: 'none' }} />
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>No video file available.</div>
              )}
            </div>

            {/* Feedback Sidebar */}
            <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Review Feedback</div>
                <button onClick={() => { setSelectedVideo(null); setFeedback(''); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{selectedVideo.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.4 }}>Watch the preview. If it looks good, approve it for publishing. Otherwise, request specific edits.</div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Ready to publish?</div>
                <button 
                  onClick={() => handleReviewSubmit('approved')}
                  disabled={processing}
                  style={{ width: '100%', padding: '12px', background: '#00D084', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: processing ? 'default' : 'pointer', boxShadow: '0 4px 12px rgba(0, 208, 132, 0.2)' }}
                >
                  {processing ? 'Processing...' : 'Approve Video'}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>OR</div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Request Revisions</div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What needs to be changed? Be specific (e.g., 'At 0:15, swap the logo')."
                  className="dark-textarea"
                  style={{ marginBottom: 16, minHeight: 120 }}
                />
                <button 
                  onClick={() => handleReviewSubmit('editing')}
                  disabled={processing || !feedback.trim()}
                  style={{ width: '100%', padding: '12px', background: feedback.trim() ? '#E84393' : 'rgba(255,255,255,0.1)', color: feedback.trim() ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (processing || !feedback.trim()) ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: feedback.trim() ? '0 4px 12px rgba(232, 67, 147, 0.3)' : 'none' }}
                >
                  {processing ? 'Processing...' : 'Send Back for Edits'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}