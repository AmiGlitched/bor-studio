'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientIdeas() {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const [loading, setLoading] = useState(false)

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    const chunks: Blob[] = []
    mediaRecorder.current.ondataavailable = e => chunks.push(e.data)
    mediaRecorder.current.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' }))
    mediaRecorder.current.start()
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  async function submitIdea() {
    setLoading(true)
    let audioUrl = ''
    
    if (audioBlob) {
      const fileName = `idea-${Date.now()}.webm`
      const { data } = await supabase.storage.from('ideas_audio').upload(fileName, audioBlob)
      if (data) {
        const { data: urlData } = supabase.storage.from('ideas_audio').getPublicUrl(fileName)
        audioUrl = urlData.publicUrl
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()

    await supabase.from('ideas').insert({
      client_id: profile.client_id,
      text_content: text,
      audio_url: audioUrl
    })

    setText(''); setAudioBlob(null); setLoading(false); alert("Idea sent to team!")
  }

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ background: '#1a1a22', border: '1px solid #333', borderRadius: 24, padding: 32, textAlign: 'center' }}>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Brainstorming Lab</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 32 }}>Share your thoughts, links, or a quick voice note.</p>
        
        <textarea 
          value={text} onChange={e => setText(e.target.value)}
          placeholder="What's on your mind? Reel ideas, trending audios, references..."
          style={{ width: '100%', minHeight: 150, background: '#111', border: '1px solid #333', borderRadius: 16, padding: 16, color: '#fff', fontSize: 14, marginBottom: 20 }}
        />

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center' }}>
          {!recording ? (
            <button onClick={startRecording} style={{ background: 'rgba(232, 67, 147, 0.1)', color: '#E84393', border: '1px solid #E84393', padding: '10px 20px', borderRadius: 20, cursor: 'pointer', fontWeight: 600 }}>🎤 Start Voice Note</button>
          ) : (
            <button onClick={stopRecording} style={{ background: '#E84393', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 20, cursor: 'pointer', fontWeight: 600 }}>⏹ Stop Recording</button>
          )}
          {audioBlob && <span style={{ color: '#00D084', fontSize: 13, display: 'flex', alignItems: 'center' }}>✓ Audio Ready</span>}
        </div>

        <button 
          onClick={submitIdea} disabled={loading || (!text && !audioBlob)}
          style={{ width: '100%', padding: 16, background: 'var(--primary-gradient)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
          {loading ? 'Sending...' : 'Send to Creative Team'}
        </button>
      </div>
    </div>
  )
}