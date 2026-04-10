'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  { id: 'shoot_done', title: 'Ready for Edit' },
  { id: 'editing', title: 'In Production' },
  { id: 'internal_review', title: 'Internal QA' },
  { id: 'client_review', title: 'Client Review' },
  { id: 'approved', title: 'Approved / Done' }
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

  // --- DRAG AND DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent, videoId: string) => {
    e.dataTransfer.setData('videoId', videoId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow dropping
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const videoId = e.dataTransfer.getData('videoId')
    if (!videoId) return

    // Optimistic UI update (feels instant)
    setVideos(prev => prev.map(v => v.id === videoId ? { ...v, status: newStatus } : v))

    // Update Database
    await supabase.from('videos').update({ status: newStatus }).eq('id', videoId)
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(10, 10, 15, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .kanban-board { display: flex; gap: 24px; padding: 32px; overflow-x: auto; min-height: calc(100vh - 65px); align-items: flex-start; }
        .kanban-col { flex: 0 0 320px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; display: flex; flex-direction: column; max-height: calc(100vh - 100px); }
        .col-header { padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; }
        .col-title { font-family: var(--font-serif); font-size: 16px; font-weight: 700; color: #fff; }
        .col-count { background: #1a1a22; color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; font-family: var(--font-mono); }
        .task-list { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .task-card { background: var(--bg-deep); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; cursor: grab; transition: all 0.2s; position: relative; }
        .task-card:active { cursor: grabbing; transform: scale(0.98); border-color: var(--accent-gold); }
        .task-card:hover { border-color: #333; }
        .client-tag { font-size: 10px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: inline-block; }
      `}</style>

      <div className="glass-header" style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
        <h1 className="serif-heading" style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Production Pipeline</h1>
      </div>

      {loading ? (
        <div style={{ padding: 40, color: 'var(--text-muted)' }}>Syncing pipeline...</div>
      ) : (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colVideos = videos.filter(v => v.status === col.id)
            return (
              <div 
                key={col.id} 
                className="kanban-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="col-header">
                  <div className="col-title">{col.title}</div>
                  <div className="col-count">{colVideos.length}</div>
                </div>

                <div className="task-list">
                  {colVideos.map(video => (
                    <div 
                      key={video.id} 
                      className="task-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, video.id)}
                    >
                      <div className="client-tag">{video.clients?.name || 'No Client'}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>{video.title}</div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a22', paddingTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>
                            {video.users?.name?.[0] || '?'}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{video.users?.name?.split(' ')[0] || 'Unassigned'}</span>
                        </div>
                        {video.deadline && (
                          <span className="mono-data" style={{ fontSize: 10, color: '#666' }}>
                            {new Date(video.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {colVideos.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', border: '1px dashed #222', borderRadius: 8, color: '#444', fontSize: 12 }}>
                      Drop items here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}