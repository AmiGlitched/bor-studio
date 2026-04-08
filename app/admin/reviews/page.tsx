'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminReviewsPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [revisionNote, setRevisionNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadReviewVideos()
  }, [])

  async function loadReviewVideos() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*, clients(name), users(name)')
      .eq('status', 'internal_review')
      .order('updated_at', { ascending: false })
    
    if (data) setVideos(data)
    setLoading(false)
  }

  async function handleSendToClient(id: number) {
    setProcessing(true)
    await supabase
      .from('videos')
      .update({ status: 'client_review', revision_note: null }) // Exact snake_case
      .eq('id', id)
    
    setSelectedVideo(null)
    setProcessing(false)
    loadReviewVideos()
  }

  async function handleRequestRevision(id: number) {
    if (!revisionNote.trim()) return alert('Please enter revision notes')
    setProcessing(true)
    await supabase
      .from('videos')
      .update({ status: 'editing', revision_note: revisionNote, video_uploaded: false }) // Exact snake_case
      .eq('id', id)
    
    setRevisionNote('')
    setSelectedVideo(null)
    setProcessing(false)
    loadReviewVideos()
  }

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Needs Review</div>
      </div>

      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ color: '#bbb', fontSize: 14 }}>Loading videos...</div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px dashed #ddd', borderRadius: 12 }}>
            <div style={{ fontSize: 18, color: '#888', marginBottom: 8 }}>All caught up!</div>
            <div style={{ fontSize: 13, color: '#bbb' }}>No videos currently pending internal review.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {videos.map(video => (
              <div key={video.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{video.clients?.name}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 12 }}>{video.title}</div>
                
                <div style={{ fontSize: 12, color: '#666', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Editor: {video.users?.name || 'Unassigned'}</span>
                </div>

                <button 
                  onClick={() => setSelectedVideo(video)}
                  style={{ width: '100%', padding: '8px 0', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginTop: 'auto' }}
                >
                  Review Video
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, display: 'flex', overflow: 'hidden', maxHeight: '90vh' }}>
            
            {/* Video Player Side */}
            <div style={{ flex: 2, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedVideo.video_url ? (
                <video 
                  src={selectedVideo.video_url} 
                  controls 
                  style={{ width: '100%', maxHeight: '90vh', outline: 'none' }}
                />
              ) : (
                <div style={{ color: '#fff', textAlign: 'center' }}>
                  <p style={{ marginBottom: 10 }}>Video file not uploaded directly.</p>
                  <a href={selectedVideo.drive_link} target="_blank" rel="noreferrer" style={{ color: '#CCFF00' }}>Open External Link</a>
                </div>
              )}
            </div>

            {/* Actions Side */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', background: '#f9f9f9', borderLeft: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Review Actions</div>
                <button onClick={() => { setSelectedVideo(null); setRevisionNote(''); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
              </div>

              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Client: <strong>{selectedVideo.clients?.name}</strong></div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 24 }}>{selectedVideo.title}</div>

              {/* Action 1: Approve */}
              <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #eee', marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Looks good?</div>
                <button 
                  onClick={() => handleSendToClient(selectedVideo.id)}
                  disabled={processing}
                  style={{ width: '100%', padding: '10px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: processing ? 'default' : 'pointer' }}
                >
                  {processing ? 'Processing...' : 'Approve & Send to Client'}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginBottom: 24 }}>OR</div>

              {/* Action 2: Request Changes */}
              <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #eee', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Request Changes</div>
                <textarea
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Type revision notes for the editor..."
                  style={{ width: '100%', flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, resize: 'none', outline: 'none', marginBottom: 12, minHeight: 120 }}
                />
                <button 
                  onClick={() => handleRequestRevision(selectedVideo.id)}
                  disabled={processing || !revisionNote.trim()}
                  style={{ width: '100%', padding: '10px', background: revisionNote.trim() ? '#e74c3c' : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: (processing || !revisionNote.trim()) ? 'default' : 'pointer' }}
                >
                  {processing ? 'Processing...' : 'Send back to Editor'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}