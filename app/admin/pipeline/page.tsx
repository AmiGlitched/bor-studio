'use client'
import { useState } from 'react'

const initialPipeline = [
  {
    id: 'shoot_done', label: 'Shoot done', color: '#888', cards: [
      { id: 1, client: 'Hamdan', title: 'DAMAC Lagoons — building B tour', editor: 'Unassigned', type: 'Reel' },
      { id: 2, client: 'Sachin', title: 'Jumeirah Park — new listing', editor: 'Unassigned', type: 'Reel' },
    ]
  },
  {
    id: 'editing', label: 'Editing', color: '#e67e22', cards: [
      { id: 3, client: 'Valentino', title: 'Milestone reel — 10K', editor: 'Ayush', type: 'Reel', urgent: true },
      { id: 4, client: 'Erman', title: 'Marina listing video', editor: 'Ayush', type: 'Reel' },
      { id: 5, client: 'Bassel', title: 'Agency intro reel', editor: 'Ayush', type: 'Reel' },
    ]
  },
  {
    id: 'internal_review', label: 'Internal review', color: '#2980b9', cards: [
      { id: 6, client: 'Ahad', title: 'European market reel', editor: 'Vishesh', type: 'Reel' },
      { id: 7, client: 'Hamdan', title: 'Community launch', editor: 'Vishesh', type: 'Reel' },
    ]
  },
  {
    id: 'client_review', label: 'Client review', color: '#8e44ad', cards: [
      { id: 8, client: 'Sachin', title: 'Jumeirah Park promo', editor: 'Vishesh', type: 'Reel', urgent: true },
      { id: 9, client: 'Olea', title: 'Property showcase reel', editor: 'Ayush', type: 'Reel' },
    ]
  },
  {
    id: 'approved', label: 'Approved', color: '#27ae60', cards: [
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
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Dashboard</a>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Pipeline</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ fontSize: 12, padding: '6px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + Add video
        </button>
      </div>

      {/* Board */}
      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {pipeline.map(lane => (
          <div key={lane.id} style={{ background: '#ebebeb', borderRadius: 12, padding: 12, minHeight: 400 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: lane.color, display: 'inline-block' }}></span>
              {lane.label}
              <span style={{ marginLeft: 'auto', background: '#ddd', borderRadius: 20, padding: '1px 7px', fontSize: 10, color: '#888' }}>{lane.cards.length}</span>
            </div>
            {lane.cards.map(card => (
              <div key={card.id} onClick={() => setSelected(card)} style={{
                background: '#fff',
                border: card.urgent ? '1px solid #e74c3c' : '1px solid #e8e8e8',
                borderLeft: card.urgent ? '3px solid #e74c3c' : '3px solid transparent',
                borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer',
                transition: 'box-shadow 0.15s'
              }}>
                <div style={{ fontSize: 10, color: '#bbb', marginBottom: 3 }}>{card.client}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111', lineHeight: 1.4, marginBottom: 8 }}>{card.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: '#f0f0f0', color: '#666' }}>{card.editor}</span>
                  <span style={{ fontSize: 10, color: '#bbb' }}>{card.type}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Card detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{selected.client}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 16 }}>{selected.title}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Move to stage:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {stages.map(s => (
                <button key={s} onClick={() => moveCard(selected.id, s)} style={{
                  padding: '8px 14px', border: '1px solid #eee', borderRadius: 8,
                  background: '#f9f9f9', color: '#111', fontSize: 13, cursor: 'pointer',
                  textAlign: 'left', fontWeight: 400
                }}>
                  → {stageLabels[s]}
                </button>
              ))}
            </div>
            <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add video modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 360 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>Add video</div>
            {[
              { label: 'Client name', key: 'client', placeholder: 'e.g. Hamdan' },
              { label: 'Video title', key: 'title', placeholder: 'e.g. DAMAC Lagoons tour' },
              { label: 'Google Drive link', key: 'driveLink', placeholder: 'Paste Drive link...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{f.label}</div>
                <input
                  value={(newVideo as any)[f.key]}
                  onChange={e => setNewVideo({ ...newVideo, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Assign editor</div>
              <select value={newVideo.editor} onChange={e => setNewVideo({ ...newVideo, editor: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                {editors.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Type</div>
              <select value={newVideo.type} onChange={e => setNewVideo({ ...newVideo, type: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                {['Reel', 'Carousel', 'Thumbnail', 'YouTube'].map(t => <option key={t}>{t}</option>)}
              </select>
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