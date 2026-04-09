'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientIdeas() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [newIdea, setNewIdea] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadIdeas()
  }, [])

  async function loadIdeas() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // GUARD: If no user is found, stop here to prevent the 'null' error
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('client_id')
      .eq('auth_id', user.id)
      .single()

    if (profile?.client_id) {
      const { data } = await supabase
        .from('ideas')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
      
      if (data) setIdeas(data)
    }
    setLoading(false)
  }

  async function handleSubmit() {
    if (!newIdea.title.trim()) return
    setSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    // GUARD: Ensuring user exists before submission
    if (!user) {
      alert("Please log in again to submit ideas.")
      setSubmitting(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('client_id')
      .eq('auth_id', user.id)
      .single()

    if (profile?.client_id) {
      const { error } = await supabase.from('ideas').insert({
        client_id: profile.client_id,
        title: newIdea.title,
        description: newIdea.description,
        status: 'pending'
      })

      if (!error) {
        setNewIdea({ title: '', description: '' })
        loadIdeas()
      }
    }
    setSubmitting(false)
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .page-container { max-width: 900px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        .idea-input { width: 100%; background: #0a0a0f; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; color: #fff; font-size: 14px; outline: none; margin-bottom: 16px; }
        .idea-input:focus { border-color: #7B61FF; }
        .idea-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; margin-bottom: 12px; }
        .status-pill { font-size: 10px; padding: 4px 10px; border-radius: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Content Brainstorming</div>
      </div>

      <div className="page-container">
        {/* Input Section */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Have a new idea?</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Drop your thoughts or reference links below. Our creative team will review them!</p>
          
          <input 
            className="idea-input" 
            placeholder="Idea Title (e.g., Day in the life at the office)" 
            value={newIdea.title}
            onChange={e => setNewIdea({...newIdea, title: e.target.value})}
          />
          <textarea 
            className="idea-input" 
            placeholder="Describe the concept or paste YouTube/Instagram links..." 
            style={{ minHeight: 120, resize: 'none' }}
            value={newIdea.description}
            onChange={e => setNewIdea({...newIdea, description: e.target.value})}
          />
          
          <button 
            onClick={handleSubmit}
            disabled={submitting || !newIdea.title}
            style={{ 
              width: '100%', padding: '14px', background: 'var(--primary-gradient)', 
              color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, 
              cursor: submitting ? 'default' : 'pointer', opacity: (submitting || !newIdea.title) ? 0.6 : 1 
            }}
          >
            {submitting ? 'Sending to Team...' : 'Submit Idea'}
          </button>
        </div>

        {/* List Section */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Previous Suggestions</div>
        
        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading your board...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ideas.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: 16, border: '1px dashed var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13 }}>
                No ideas submitted yet. Be the first to start the brainstorm!
              </div>
            ) : (
              ideas.map(idea => (
                <div key={idea.id} className="idea-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{idea.title}</div>
                    <span className="status-pill" style={{ 
                      background: idea.status === 'accepted' ? 'rgba(0, 208, 132, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      color: idea.status === 'accepted' ? '#00D084' : 'var(--text-secondary)'
                    }}>
                      {idea.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{idea.description}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}