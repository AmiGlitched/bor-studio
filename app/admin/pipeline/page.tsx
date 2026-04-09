'use client'
import { useState } from 'react'

// Upgraded brand colors for the mock data
const initialPipeline = [
  {
    id: 'shoot_done', label: 'Shoot done', color: '#888', glow: 'rgba(136,136,136,0.15)', cards: [
      { id: 1, client: 'Hamdan', title: 'DAMAC Lagoons — building B tour', editor: 'Unassigned', type: 'Reel' },
      { id: 2, client: 'Sachin', title: 'Jumeirah Park — new listing', editor: 'Unassigned', type: 'Reel' },
    ]
  },
  {
    id: 'editing', label: 'Editing', color: '#E84393', glow: 'rgba(232, 67, 147, 0.15)', cards: [
      { id: 3, client: 'Valentino', title: 'Milestone reel — 10K', editor: 'Ayush', type: 'Reel', urgent: true },
      { id: 4, client: 'Erman', title: 'Marina listing video', editor: 'Ayush', type: 'Reel' },
      { id: 5, client: 'Bassel', title: 'Agency intro reel', editor: 'Ayush', type: 'Reel' },
    ]
  },
  {
    id: 'internal_review', label: 'Internal review', color: '#4A90E2', glow: 'rgba(74, 144, 226, 0.15)', cards: [
      { id: 6, client: 'Ahad', title: 'European market reel', editor: 'Vishesh', type: 'Reel' },
      { id: 7, client: 'Hamdan', title: 'Community launch', editor: 'Vishesh', type: 'Reel' },
    ]
  },
  {
    id: 'client_review', label: 'Client review', color: '#7B61FF', glow: 'rgba(123, 97, 255, 0.15)', cards: [
      { id: 8, client: 'Sachin', title: 'Jumeirah Park promo', editor: 'Vishesh', type: 'Reel', urgent: true },
      { id: 9, client: 'Olea', title: 'Property showcase reel', editor: 'Ayush', type: 'Reel' },
    ]
  },
  {
    id: 'approved', label: 'Approved', color: '#00D084', glow: 'rgba(0, 208, 132, 0.15)', cards: [
      { id: 10, client: 'Ali Saleh', title: 'SBRe launch video', editor: 'Vishesh', type: 'Reel' },
      { id: 11, client: 'Hamdan', title: 'Community walkthrough', editor: 'Vishesh', type: 'Reel' },
    ]
  },
]

const editors = ['Unassigned', 'Vishesh', 'Ayush']
const stages = ['shoot_done', 'editing', 'internal_review', 'client_review', 'approved']
const stageLabels: Record<string, string> = {
  shoot_done: 'Shoot done', editing: 'Editing',
  internal_review: 'Internal review', client_review: 'Client review', approved: 'Approved'
}

export default function Pipeline() {
  const [pipeline, setPipeline] = useState(initialPipeline)
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newVideo, setNewVideo] = useState({ client: '', title: '', editor: 'Unassigned', type: 'Reel', driveLink: '' })

  function moveCard(cardId: number, toLaneId: string) {
    let card: any = null
    const updated = pipeline.map(lane => ({
      ...lane,
      cards: lane.cards.filter(c => { if (c.id === cardId) { card = c; return false } return true })
    }))
    setPipeline(updated.map(lane =>
      lane.id === toLaneId ? { ...lane, cards: [...lane.cards, card] } : lane
    ))
    setSelected(null)
  }

  function addVideo() {
    if (!newVideo.client || !newVideo.title) return
    const card = { id: Date.now(), ...newVideo, urgent: false }
    setPipeline(pipeline.map(lane =>
      lane.id === 'shoot_done' ? { ...lane, cards: [...lane.cards, card] } : lane
    ))
    setNewVideo({ client: '', title: '', editor: 'Unassigned', type: 'Reel', driveLink: '' })
    setShowAdd(false)
  }

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .pipeline-lane {
          background: rgba(26, 26, 34, 0.4); border: 1px solid var(--border-subtle);
          border-radius: 16px; display: flex; flex-direction: column; min-height: 500px;
        }
        .kanban-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 12px; padding: 14px; margin-bottom: 12px;
          cursor: pointer; transition: all 0.2s ease; position: relative;
        }
        .kanban-card:hover {
          transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 24px; width: 100%; max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .dark-input {
          width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle); border-radius: 8px;
          color: #fff; font-size: 13px; outline: none; transition: border 0.2s;
        }
        .dark-input:focus { border-color: #7B61FF; background: rgba(0,0,0,0.4); }
        .move-btn {
          padding: 10px 14px; border: 1px solid var(--border-subtle); border-radius: 8px;
          background: rgba(0,0,0,0.2); color: #fff; font-size: 13px; cursor: pointer;
          text-align: left; font-weight: 500; transition: all 0.2s; display: block; width: 100%;
        }
        .move-btn:hover { background: rgba(123, 97, 255, 0.1); border-color: #7B61FF; }
      `}</style>

      {/* Header */}
      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Production Pipeline</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 20px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
          + Add Video
        </button>
      </div>

      {/* Board */}
      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, overflowX: 'auto' }}>
        {pipeline.map(lane => (
          <div key={lane.id} className="pipeline-lane">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', borderRadius: '16px 16px 0 0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: lane.color, boxShadow: `0 0 8px ${lane.color}` }}></span>
                {lane.label}
                <span style={{ marginLeft: 'auto', background: lane.glow, color: lane.color, padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>{lane.cards.length}</span>
              </div>
            </div>
            
            <div style={{ padding: 14, flex: 1 }}>
              {lane.cards.map(card => (
                <div key={card.id} onClick={() => setSelected(card)} className="kanban-card" style={{ borderLeft: `3px solid ${card.urgent ? '#E84393' : lane.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.client}</div>
                    {card.urgent && <div style={{ fontSize: 9, color: '#E84393', background: 'rgba(232,67,147,0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>URGENT</div>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 12 }}>{card.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.3)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>{card.editor}</span>
                    <span style={{ fontSize: 11, color: lane.color, fontWeight: 500 }}>{card.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Card Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, color: '#7B61FF', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selected.client}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>{selected.title}</div>
            
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>Move to stage:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {stages.map(s => (
                <button key={s} onClick={() => moveCard(selected.id, s)} className="move-btn">
                  → {stageLabels[s]}
                </button>
              ))}
            </div>
            <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Inject New Video</div>
            {[
              { label: 'Client name', key: 'client', placeholder: 'e.g. Hamdan' },
              { label: 'Video title', key: 'title', placeholder: 'e.g. DAMAC Lagoons tour' },
              { label: 'Google Drive link', key: 'driveLink', placeholder: 'Paste Drive link...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{f.label}</div>
                <input
                  value={(newVideo as any)[f.key]}
                  onChange={e => setNewVideo({ ...newVideo, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="dark-input"
                />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Assign editor</div>
                <select value={newVideo.editor} onChange={e => setNewVideo({ ...newVideo, editor: e.target.value })} className="dark-input">
                  {editors.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Type</div>
                <select value={newVideo.type} onChange={e => setNewVideo({ ...newVideo, type: e.target.value })} className="dark-input">
                  {['Reel', 'Carousel', 'Thumbnail', 'YouTube'].map(t => <option key={t}>{t}</option>)}
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