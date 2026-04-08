'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const stages = ['shoot_done', 'editing', 'internal_review', 'client_review', 'approved']
const stageConfig: Record<string, { label: string, color: string }> = {
  shoot_done: { label: 'Shoot done', color: '#888' },
  editing: { label: 'Editing', color: '#e67e22' },
  internal_review: { label: 'Internal review', color: '#2980b9' },
  client_review: { label: 'Client review', color: '#8e44ad' },
  approved: { label: 'Approved', color: '#27ae60' },
}

export default function Pipeline() {
  const [pipeline, setPipeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [editors, setEditors] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [newVideo, setNewVideo] = useState({ title: '', client_id: '', editor_id: '', type: 'reel', drive_link: '', deadline: '' })
  const [moving, setMoving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: videos } = await supabase.from('videos').select('*, clients(name), users(name)')
    const { data: editorList } = await supabase.from('users').select('*').eq('role', 'editor')
    const { data: clientList } = await supabase.from('clients').select('*')
    if (videos) {
      setPipeline(stages.map(status => ({
        id: status,
        ...stageConfig[status],
        cards: videos.filter(v => v.status === status).map(v => ({
          id: v.id, client: v.clients?.name || '—', title: v.title,
          editor: v.users?.name || 'Unassigned', type: v.type,
          urgent: v.deadline && new Date(v.deadline) < new Date(),
          driveLink: v.drive_link,
        }))
      })))
    }
    if (editorList) setEditors(editorList)
    if (clientList) setClients(clientList)
    setLoading(false)
  }

  async function moveCard(videoId: string, toStatus: string) {
    setMoving(true)
    await supabase.from('videos').update({ status: toStatus }).eq('id', videoId)
    await loadData()
    setMoving(false)
    setSelected(null)
  }

  async function addVideo() {
    if (!newVideo.title || !newVideo.client_id) return
    await supabase.from('videos').insert({
      title: newVideo.title, client_id: newVideo.client_id,
      editor_id: newVideo.editor_id || null, type: newVideo.type,
      drive_link: newVideo.drive_link, deadline: newVideo.deadline || null,
      status: 'shoot_done'
    })
    setNewVideo({ title: '', client_id: '', editor_id: '', type: 'reel', drive_link: '', deadline: '' })
    setShowAdd(false)
    await loadData()
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Dashboard</a>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Pipeline</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ fontSize: 12, padding: '6px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>+ Add video</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#bbb', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {pipeline.map(lane => (
            <div key={lane.id} style={{ background: '#ebebeb', borderRadius: 12, padding: 12, minHeight: 400 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: lane.color, display: 'inline-block' }}></span>
                {lane.label}
                <span style={{ marginLeft: 'auto', background: '#ddd', borderRadius: 20, padding: '1px 7px', fontSize: 10, color: '#888' }}>{lane.cards.length}</span>
              </div>
              {lane.cards.map((card: any) => (
                <div key={card.id} onClick={() => setSelected(card)} style={{
                  background: '#fff', border: card.urgent ? '1px solid #e74c3c' : '1px solid #e8e8e8',
                  borderLeft: card.urgent ? '3px solid #e74c3c' : '3px solid transparent',
                  borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer'
                }}>
                  <div style={{ fontSize: 10, color: '#bbb', marginBottom: 3 }}>{card.client}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#111', lineHeight: 1.4, marginBottom: 8 }}>{card.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f0f0f0', color: '#666' }}>{card.editor}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{card.type}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Move card modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 360 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{selected.client}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 16 }}>{selected.title}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Move to stage:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {stages.map(s => (
                <button key={s} onClick={() => moveCard(selected.id, s)} disabled={moving} style={{
                  padding: '8px 14px', border: '1px solid #eee', borderRadius: 8,
                  background: '#f9f9f9', color: '#111', fontSize: 13, cursor: 'pointer', textAlign: 'left'
                }}>
                  → {stageConfig[s].label}
                </button>
              ))}
            </div>
            {selected.driveLink && (
              <a href={selected.driveLink} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '8px', textAlign: 'center', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#111', textDecoration: 'none', marginBottom: 10 }}>
                Open Drive folder →
              </a>
            )}
            <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Add video modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>Add video</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Client</div>
              <select value={newVideo.client_id} onChange={e => setNewVideo({ ...newVideo, client_id: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Video title</div>
              <input value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                placeholder="e.g. DAMAC Lagoons tour"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Assign editor</div>
              <select value={newVideo.editor_id} onChange={e => setNewVideo({ ...newVideo, editor_id: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                <option value="">Unassigned</option>
                {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Type</div>
              <select value={newVideo.type} onChange={e => setNewVideo({ ...newVideo, type: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                {['reel', 'carousel', 'thumbnail', 'youtube'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Google Drive link</div>
              <input value={newVideo.drive_link} onChange={e => setNewVideo({ ...newVideo, drive_link: e.target.value })}
                placeholder="Paste Drive link..."
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Deadline</div>
              <input type="date" value={newVideo.deadline} onChange={e => setNewVideo({ ...newVideo, deadline: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={addVideo} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Add video</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}