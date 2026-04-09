'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const stages = ['shoot_done', 'editing', 'internal_review', 'client_review', 'approved']
const stageLabels: Record<string, string> = {
  shoot_done: 'Shoot done', editing: 'Editing',
  internal_review: 'Internal review', client_review: 'Client review', approved: 'Approved'
}

const laneConfig: Record<string, any> = {
  shoot_done: { color: '#888', glow: 'rgba(136,136,136,0.15)' },
  editing: { color: '#E84393', glow: 'rgba(232, 67, 147, 0.15)' },
  internal_review: { color: '#4A90E2', glow: 'rgba(74, 144, 226, 0.15)' },
  client_review: { color: '#7B61FF', glow: 'rgba(123, 97, 255, 0.15)' },
  approved: { color: '#00D084', glow: 'rgba(0, 208, 132, 0.15)' },
}

export default function Pipeline() {
  const [videos, setVideos] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [editors, setEditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  // FIXED: Default type is now lowercase 'reel'
  const [newVideo, setNewVideo] = useState({ client_id: '', title: '', editor_id: '', type: 'reel', drive_link: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: vids } = await supabase.from('videos').select('*, clients(name), users(name)').order('created_at', { ascending: false })
    const { data: cls } = await supabase.from('clients').select('id, name')
    const { data: eds } = await supabase.from('users').select('id, name').eq('role', 'editor')
    
    if (vids) setVideos(vids)
    if (cls) setClients(cls)
    if (eds) setEditors(eds)
    setLoading(false)
  }

  async function moveCard(cardId: string, toLaneId: string) {
    setVideos(videos.map(v => v.id === cardId ? { ...v, status: toLaneId } : v))
    setSelected(null)
    
    await supabase.from('videos').update({ status: toLaneId }).eq('id', cardId)
    loadData() 
  }

  async function addVideo() {
    if (!newVideo.client_id || !newVideo.title) {
      alert("Please select a client and enter a title.");
      return;
    }
    
    const { data, error } = await supabase.from('videos').insert({
      title: newVideo.title,
      client_id: newVideo.client_id,
      editor_id: newVideo.editor_id || null,
      status: 'shoot_done',
      type: newVideo.type, // This will now send 'reel', 'carousel', etc.
      drive_link: newVideo.drive_link
    });

    if (error) {
      console.error("Supabase Insert Error:", error);
      alert(`Database Error: ${error.message}`);
      return;
    }

    setShowAdd(false);
    // FIXED: Reset uses lowercase 'reel'
    setNewVideo({ client_id: '', title: '', editor_id: '', type: 'reel', drive_link: '' });
    loadData();
  }

  const pipeline = stages.map(stage => ({
    id: stage,
    label: stageLabels[stage],
    color: laneConfig[stage].color,
    glow: laneConfig[stage].glow,
    cards: videos.filter(v => (v.status || 'shoot_done') === stage)
  }))

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .pipeline-lane { background: rgba(26, 26, 34, 0.4); border: 1px solid var(--border-subtle); border-radius: 16px; display: flex; flex-direction: column; min-height: 500px; }
        .kanban-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s ease; position: relative; }
        .kanban-card:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
        .modal-content { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 24px; width: 100%; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .dark-input { width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-subtle); border-radius: 8px; color: #fff; font-size: 13px; outline: none; transition: border 0.2s; }
        .dark-input:focus { border-color: #7B61FF; background: rgba(0,0,0,0.4); }
        .move-btn { padding: 10px 14px; border: 1px solid var(--border-subtle); border-radius: 8px; background: rgba(0,0,0,0.2); color: #fff; font-size: 13px; cursor: pointer; text-align: left; font-weight: 500; transition: all 0.2s; display: block; width: 100%; }
        .move-btn:hover { background: rgba(123, 97, 255, 0.1); border-color: #7B61FF; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Production Pipeline</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 20px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
          + Add Video
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-secondary)', fontSize: 14 }}>Syncing database...</div>
      ) : (
        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, overflowX: 'auto', alignItems: 'start' }}>
          {pipeline.map(lane => (
            <div key={lane.id} className="pipeline-lane">
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', borderRadius: '16px 16px 0 0' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: lane.color, boxShadow: `0 0 8px ${lane.color}` }}></span>
                  {lane.label}
                  <span style={{ marginLeft: 'auto', background: lane.glow, color: lane.color, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{lane.cards.length}</span>
                </div>
              </div>
              
              <div style={{ padding: 14, flex: 1, overflowY: 'auto' }}>
                {lane.cards.map(card => (
                  <div key={card.id} onClick={() => setSelected(card)} className="kanban-card" style={{ borderLeft: `3px solid ${lane.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.clients?.name || 'Unknown'}</div>
                      {card.video_uploaded && <div style={{ fontSize: 9, color: '#00D084', background: 'rgba(0, 208, 132, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>UPLOADED</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 12 }}>{card.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                        {card.users?.name || 'Unassigned'}
                      </span>
                      {/* Make sure the tag shows nicely capitalized even though the DB stores lowercase */}
                      <span style={{ fontSize: 11, color: lane.color, fontWeight: 500, textTransform: 'capitalize' }}>{card.type || 'Reel'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, color: '#7B61FF', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selected.clients?.name}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{selected.title}</div>
            
            {selected.video_url ? (
              <video src={selected.video_url} controls style={{ width: '100%', maxHeight: '35vh', borderRadius: 8, marginBottom: 20, background: '#000', outline: 'none', border: '1px solid var(--border-subtle)' }} />
            ) : (
              <div style={{ padding: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px dashed var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 20, fontSize: 13 }}>
                The editor hasn't uploaded a video file yet.
              </div>
            )}
            
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>Move to stage:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {stages.map(s => (
                <button key={s} onClick={() => moveCard(selected.id, s)} className="move-btn" style={{ borderColor: selected.status === s ? '#7B61FF' : 'var(--border-subtle)', background: selected.status === s ? 'rgba(123, 97, 255, 0.1)' : 'rgba(0,0,0,0.2)' }}>
                  → {stageLabels[s]} {selected.status === s && '(Current)'}
                </button>
              ))}
            </div>
            <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Inject New Video</div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Client</div>
              <select value={newVideo.client_id} onChange={e => setNewVideo({ ...newVideo, client_id: e.target.value })} className="dark-input">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Video Title</div>
              <input value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} placeholder="e.g. DAMAC Lagoons tour" className="dark-input" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Google Drive Link</div>
              <input value={newVideo.drive_link} onChange={e => setNewVideo({ ...newVideo, drive_link: e.target.value })} placeholder="Paste Drive link..." className="dark-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Assign Editor</div>
                <select value={newVideo.editor_id} onChange={e => setNewVideo({ ...newVideo, editor_id: e.target.value })} className="dark-input">
                  <option value="">Unassigned</option>
                  {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Type</div>
                {/* FIXED: The values sent to the DB are now lowercase to pass the check constraint */}
                <select value={newVideo.type} onChange={e => setNewVideo({ ...newVideo, type: e.target.value })} className="dark-input">
                  <option value="reel">Reel</option>
                  <option value="carousel">Carousel</option>
                  <option value="thumbnail">Thumbnail</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={addVideo} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--primary-gradient)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>Deploy to Pipeline</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}