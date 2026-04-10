'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminIdeasBoard() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadIdeas() }, [])

  async function loadIdeas() {
    setLoading(true)
    // Fetch ideas and join with client names
    const { data } = await supabase
      .from('ideas')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
    
    if (data) setIdeas(data)
    setLoading(false)
  }

  async function pushToPipeline(idea: any) {
    // 1. Create a new task in the videos/pipeline table
    const { error } = await supabase.from('videos').insert({
      client_id: idea.client_id,
      title: idea.title,
      status: 'shoot_done', // Puts it in the first column of your Kanban board
    })

    if (!error) {
      // 2. Mark the idea as approved
      await supabase.from('ideas').update({ status: 'approved' }).eq('id', idea.id)
      loadIdeas() // Refresh
    } else {
      alert("Error pushing to pipeline. Check database rules.")
    }
  }

  async function rejectIdea(id: string) {
    await supabase.from('ideas').update({ status: 'rejected' }).eq('id', id)
    loadIdeas()
  }

  return (
    <div style={{ padding: '40px 48px', color: '#fff', maxWidth: 1200, margin: '0 auto' }}>
      
      <div style={{ borderBottom: '1px solid #1a1a22', paddingBottom: 32, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Strategy Review</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Review client concepts and push approved briefs to production.</p>
        </div>
        <div style={{ background: '#111', border: '1px solid #222', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#D4AF37' }}>
          {ideas.filter(i => i.status === 'pending').length} Pending Briefs
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#666' }}>Loading strategy board...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
          {ideas.map(idea => (
            <div key={idea.id} style={{ 
              background: '#0a0a0f', 
              border: `1px solid ${idea.status === 'pending' ? '#333' : '#1a1a22'}`, 
              borderRadius: 16, 
              padding: 24,
              opacity: idea.status === 'rejected' ? 0.5 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {idea.clients?.name || 'Unknown Client'}
                </span>
                <span style={{ 
                  fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase',
                  background: idea.status === 'approved' ? 'rgba(0, 208, 132, 0.1)' : idea.status === 'rejected' ? 'rgba(232, 67, 147, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                  color: idea.status === 'approved' ? '#00D084' : idea.status === 'rejected' ? '#E84393' : '#aaa'
                }}>
                  {idea.status}
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>{idea.title}</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 20, minHeight: 60 }}>{idea.description}</p>

              {idea.voice_url && (
                <div style={{ marginBottom: 24, background: '#111', padding: 12, borderRadius: 10, border: '1px solid #222' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8, fontWeight: 600 }}>🎤 Client Voice Note</div>
                  <audio src={idea.voice_url} controls style={{ width: '100%', height: 32 }} />
                </div>
              )}

              {idea.status === 'pending' && (
                <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #1a1a22', paddingTop: 20 }}>
                  <button onClick={() => pushToPipeline(idea)} style={{ flex: 1, padding: '12px', background: '#D4AF37', color: '#000', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    Push to Pipeline
                  </button>
                  <button onClick={() => rejectIdea(idea.id)} style={{ padding: '12px 20px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}