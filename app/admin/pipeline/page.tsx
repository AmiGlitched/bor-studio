'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  { id: 'shoot_done', title: 'Ready for Edit' },
  { id: 'editing', title: 'In Production' },
  { id: 'internal_review', title: 'Internal QA' },
  { id: 'client_review', title: 'Client Review' },
  { id: 'approved', title: 'Approved' }
]

export default function PipelineBoard() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPipeline() }, [])

  async function loadPipeline() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*, clients(name), users!videos_editor_id_fkey(name)')
      .order('deadline', { ascending: true })
    
    if (data) setVideos(data)
    setLoading(false)
  }

  const handleDragStart = (e: React.DragEvent, videoId: string) => e.dataTransfer.setData('videoId', videoId)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const videoId = e.dataTransfer.getData('videoId')
    if (!videoId) return
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, status: newStatus } : v))
    await supabase.from('videos').update({ status: newStatus }).eq('id', videoId)
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        /* FIXED: Changed flex constraints to make columns responsive to screen width */
        .kanban-board { display: flex; gap: 16px; padding: 32px; height: calc(100vh - 70px); width: 100%; align-items: stretch; }
        .kanban-col { flex: 1; min-width: 0; background: #0a0a0f; border: 1px solid #1a1a22; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .col-header { padding: 16px; border-bottom: 1px solid #1a1a22; display: flex; justify-content: space-between; align-items: center; background: #0f0f0f; }
        .col-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #fff; }
        .col-count { background: #1a1a22; color: #888; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
        .task-list { padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .task-card { background: #050505; border: 1px solid #1a1a22; border-radius: 8px; padding: 16px; cursor: grab; transition: all 0.2s; }
        .task-card:active { cursor: grabbing; border-color: #D4AF37; }
        .task-card:hover { border-color: #333; }
        .client-tag { font-size: 9px; font-weight: 800; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
      `}</style>

      <div className="glass-header" style={{ height: 70, display: 'flex', alignItems: 'center', padding: '0 40px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Production Pipeline</h1>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: '#666' }}>Syncing pipeline...</div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colVideos = videos.filter(v => v.status === col.id)
            return (
              <div key={col.id} className="kanban-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                <div className="col-header">
                  <div className="col-title">{col.title}</div>
                  <div className="col-count">{colVideos.length}</div>
                </div>

                <div className="task-list">
                  {colVideos.map(video => (
                    <div key={video.id} className="task-card" draggable onDragStart={(e) => handleDragStart(e, video.id)}>
                      <div className="client-tag">{video.clients?.name || 'Internal'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>{video.title}</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a22', paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '4px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 800 }}>
                            {video.users?.name?.[0] || '?'}
                          </div>
                          <span style={{ fontSize: 10, color: '#666', fontWeight: 600 }}>{video.users?.name?.split(' ')[0] || 'Unassigned'}</span>
                        </div>
                        {video.deadline && (
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#888' }}>
                            {new Date(video.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {colVideos.length === 0 && <div style={{ padding: 20, textAlign: 'center', border: '1px dashed #1a1a22', borderRadius: 8, color: '#333', fontSize: 11 }}>Drop items here</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}