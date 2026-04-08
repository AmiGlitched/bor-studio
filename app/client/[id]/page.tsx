'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function ClientVideosDynamicPage() {
  const params = useParams()
  // Extract ID depending on folder structure
  const clientId = params?.id || params?.clientId 

  const [videos, setVideos] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId])

  async function loadData() {
    setLoading(true)
    
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single()
    if (clientData) setClient(clientData)

    const { data: videoData } = await supabase
      .from('videos')
      .select('*')
      .eq('client_id', clientId)
      .order('deadline', { ascending: true })
    
    if (videoData) setVideos(videoData)
    
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
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>My Videos</div>
        
        {needsReviewCount > 0 && (
          <div style={{ fontSize: 12, padding: '6px 16px', background: '#f5f3ff', color: '#8e44ad', borderRadius: 20, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, background: '#8e44ad', borderRadius: '50%', display: 'inline-block' }}></span>
            {needsReviewCount} {needsReviewCount === 1 ? 'video' : 'videos'} ready for your review
          </div>
        )}
      </div>

      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        
        {loading ? (
          <div style={{ color: '#bbb', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Loading client videos...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Package</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#111' }}>{packageTotal}</div>
                <div style={{ fontSize: 11, color: '#bbb' }}>videos this month</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Done</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#27ae60' }}>{approvedCount}</div>
                <div style={{ fontSize: 11, color: '#bbb' }}>approved</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>In Progress</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#111' }}>{inProgressCount}</div>
                <div style={{ fontSize: 11, color: '#bbb' }}>being worked on</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Needs Review</div>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#8e44ad' }}>{needsReviewCount}</div>
                <div style={{ fontSize: 11, color: '#bbb' }}>waiting for you</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {videos.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, border: '1px dashed #ddd', borderRadius: 12, color: '#888', fontSize: 14 }}>
                  No videos found for this month yet.
                </div>
              )}

              {videos.map(video => {
                const isReady = video.status === 'client_review'
                const isApproved = video.status === 'approved'
                
                return (
                  <div key={video.id} style={{ background: '#fff', border: isReady ? '1px solid #8e44ad' : '1px solid #eee', borderLeft: isReady ? '3px solid #8e44ad' : isApproved ? '3px solid #27ae60' : '3px solid transparent', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '10px solid #fff', marginLeft: 4 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 }}>{video.title}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{video.type || 'reel'} · Due {video.deadline || 'TBD'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      {isReady && <span style={{ fontSize: 11, padding: '4px 10px', background: '#f5f3ff', color: '#8e44ad', borderRadius: 20, fontWeight: 500 }}>Ready for review</span>}
                      {isApproved && <span style={{ fontSize: 11, padding: '4px 10px', background: '#f0fdf4', color: '#27ae60', borderRadius: 20, fontWeight: 500 }}>Approved</span>}
                      {['editing', 'internal_review'].includes(video.status) && <span style={{ fontSize: 11, padding: '4px 10px', background: '#f5f5f5', color: '#666', borderRadius: 20, fontWeight: 500 }}>Being edited</span>}

                      {isReady && (
                        <button onClick={() => setSelectedVideo(video)} style={{ padding: '8px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                          Review
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

      {selectedVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, display: 'flex', overflow: 'hidden', maxHeight: '90vh' }}>
            
            <div style={{ flex: 2, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedVideo.video_url ? (
                <video src={selectedVideo.video_url} controls style={{ width: '100%', maxHeight: '90vh', outline: 'none' }} />
              ) : (
                <div style={{ color: '#fff' }}>No video file available.</div>
              )}
            </div>

            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', background: '#f9f9f9', borderLeft: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Review Video</div>
                <button onClick={() => { setSelectedVideo(null); setFeedback(''); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>{selectedVideo.title}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 32 }}>Please review the video and approve it, or request changes.</div>

              <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #eee', marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Ready to post?</div>
                <button 
                  onClick={() => handleReviewSubmit('approved')}
                  disabled={processing}
                  style={{ width: '100%', padding: '10px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: processing ? 'default' : 'pointer' }}
                >
                  {processing ? 'Processing...' : 'Approve Video'}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginBottom: 24 }}>OR</div>

              <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #eee', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Request Edits</div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What needs to be changed? Please be specific."
                  style={{ width: '100%', flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', marginBottom: 12, minHeight: 120 }}
                />
                <button 
                  onClick={() => handleReviewSubmit('editing')}
                  disabled={processing || !feedback.trim()}
                  style={{ width: '100%', padding: '10px', background: feedback.trim() ? '#e74c3c' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: (processing || !feedback.trim()) ? 'default' : 'pointer' }}
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