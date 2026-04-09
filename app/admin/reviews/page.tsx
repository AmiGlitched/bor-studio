'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Reviews() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*, clients(name)')
      .eq('status', 'client_review')
      .order('updated_at', { ascending: true })
    
    if (data) setVideos(data)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .review-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 20px; transition: all 0.2s;
          display: flex; justify-content: space-between; align-items: center;
        }
        .review-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); border-color: #7B61FF; }
        .action-btn {
          padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; border: 1px solid var(--border-subtle); background: rgba(0,0,0,0.2); color: #fff; text-decoration: none; display: inline-block;
        }
        .action-btn:hover { background: rgba(123, 97, 255, 0.1); border-color: #7B61FF; color: #7B61FF; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Awaiting Client Approval</div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-secondary)', fontSize: 14 }}>Scanning review queue...</div>
      ) : (
        <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            <div style={{ background: 'rgba(123, 97, 255, 0.1)', border: '1px solid rgba(123, 97, 255, 0.3)', borderRadius: 12, padding: '16px 24px', flex: 1 }}>
              <div style={{ fontSize: 11, color: '#7B61FF', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Total in Queue</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{videos.length}</div>
            </div>
            <div style={{ background: 'rgba(232, 67, 147, 0.1)', border: '1px solid rgba(232, 67, 147, 0.3)', borderRadius: 12, padding: '16px 24px', flex: 1 }}>
              {/* FIXED LINE HERE: Changed > to &gt; */}
              <div style={{ fontSize: 11, color: '#E84393', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Stale (&gt; 2 Days)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
                {videos.filter(v => Math.floor((new Date().getTime() - new Date(v.updated_at || v.created_at).getTime()) / 86400000) >= 2).length}
              </div>
            </div>
          </div>

          {videos.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Inbox zero!</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>No videos are currently waiting for client approval.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {videos.map(video => {
                const daysWaiting = Math.floor((new Date().getTime() - new Date(video.updated_at || video.created_at).getTime()) / 86400000)
                const isUrgent = daysWaiting >= 2
                
                return (
                  <div key={video.id} className="review-card" style={{ borderLeft: `3px solid ${isUrgent ? '#E84393' : '#7B61FF'}`, background: isUrgent ? 'rgba(232, 67, 147, 0.03)' : 'var(--bg-card)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{video.clients?.name}</span>
                        {isUrgent ? (
                          <span style={{ fontSize: 9, background: 'rgba(232, 67, 147, 0.1)', color: '#E84393', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>STALE: CHASE UP</span>
                        ) : (
                          <span style={{ fontSize: 9, background: 'rgba(123, 97, 255, 0.1)', color: '#7B61FF', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>PENDING</span>
                        )}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{video.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Waiting for {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a href={`/client/${video.client_id}`} target="_blank" rel="noreferrer" className="action-btn">
                        View as Client ↗
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}