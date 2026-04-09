'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientIdeas() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [newIdea, setNewIdea] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    loadIdeas()
  }, [])

  async function loadIdeas() {
    setLoading(true)
    const { data: auth } = await supabase.auth.getUser()
    
    // VERCEL FIX: Explicitly check and capture ID to satisfy the linter
    if (!auth?.user?.id) {
      setLoading(false)
      return
    }

    const userId = auth.user.id

    const { data: profile } = await supabase
      .from('users')
      .select('client_id')
      .eq('auth_id', userId)
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

  // Voice Recording Logic
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    const chunks: BlobPart[] = []

    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' })
      setAudioBlob(blob)
      setAudioURL(URL.createObjectURL(blob))
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  async function handleSubmit() {
    if (!newIdea.title.trim() && !audioBlob) return
    setSubmitting(true)
    
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user?.id) return

    const userId = auth.user.id
    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', userId).single()

    if (profile?.client_id) {
      let voiceUrl = null

      // If there's a voice note, upload it to storage
      if (audioBlob) {
        const fileName = `${Date.now()}-voice.ogg`
        const { data: uploadData } = await supabase.storage.from('videos').upload(`ideas/${fileName}`, audioBlob)
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('videos').getPublicUrl(`ideas/${fileName}`)
          voiceUrl = urlData.publicUrl
        }
      }

      await supabase.from('ideas').insert({
        client_id: profile.client_id,
        title: newIdea.title || 'Untitled Idea',
        description: newIdea.content,
        voice_url: voiceUrl,
        status: 'pending'
      })

      setNewIdea({ title: '', content: '' })
      setAudioURL(null)
      setAudioBlob(null)
      loadIdeas()
    }
    setSubmitting(false)
  }

  return (
    <>
      <style>{`
        .glass-header { background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0; z-index: 50; }
        .page-container { max-width: 900px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        .input-box { width: 100%; background: #0a0a0f; border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; color: #fff; font-size: 14px; outline: none; margin-bottom: 16px; }
        .input-box:focus { border-color: #7B61FF; }
        .idea-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; margin-bottom: 12px; }
        .record-btn { padding: 12px; border-radius: 12px; border: 1px solid #333; background: #111; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .record-btn.active { background: rgba(232, 67, 147, 0.1); border-color: #E84393; color: #E84393; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Send Ideas</div>
      </div>

      <div className="page-container">
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 28, marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Creative Brainstorm</h2>
          
          <input 
            className="input-box" 
            placeholder="Topic or Title..." 
            value={newIdea.title}
            onChange={e => setNewIdea({...newIdea, title: e.target.value})}
          />
          <textarea 
            className="input-box" 
            placeholder="Describe your idea or paste links (TikTok, Reels, etc.)..." 
            style={{ minHeight: 100, resize: 'none' }}
            value={newIdea.content}
            onChange={e => setNewIdea({...newIdea, content: e.target.value})}
          />

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {!isRecording ? (
              <button onClick={startRecording} className="record-btn">🎤 Start Voice Note</button>
            ) : (
              <button onClick={stopRecording} className="record-btn active">🛑 Stop Recording...</button>
            )}
            {audioURL && <audio src={audioURL} controls style={{ height: 40, borderRadius: 8 }} />}
          </div>
          
          <button 
            onClick={handleSubmit}
            disabled={submitting || (!newIdea.title && !audioBlob)}
            style={{ 
              width: '100%', padding: '14px', background: 'var(--primary-gradient)', 
              color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
            }}
          >
            {submitting ? 'Sending...' : 'Submit to Team'}
          </button>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Previous Ideas</div>
        
        {loading ? <div style={{ color: 'var(--text-secondary)' }}>Loading...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ideas.map(idea => (
              <div key={idea.id} className="idea-card">
                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{idea.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{idea.description}</div>
                {idea.voice_url && <audio src={idea.voice_url} controls style={{ width: '100%', height: 32 }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}