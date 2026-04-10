'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ContentStrategy() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [rawIdea, setRawIdea] = useState('')
  const [generatedScript, setGeneratedScript] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  useEffect(() => { loadIdeas() }, [])

  async function loadIdeas() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user?.id) return
    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', auth.user.id).single()
    if (profile?.client_id) {
      const { data } = await supabase.from('ideas').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      if (data) setIdeas(data)
    }
  }

  // AI Script Logic (Simulated for Frontend)
  async function generateHormoziScript() {
    if (!rawIdea) return
    setIsGenerating(true)
    // In production, this calls your /api/generate route
    setTimeout(() => {
      setGeneratedScript({
        hook: "STOP scrolling if you want to scale your brand...",
        value: "Most people think almond milk is just water and nuts. They're wrong. Here's why...",
        cta: "Click the link in bio for the clean label revolution."
      })
      setIsGenerating(false)
    }, 1500)
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    const chunks: any[] = []
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/ogg' })
      setAudioBlob(blob)
      setAudioURL(URL.createObjectURL(blob))
    }
    mediaRecorder.current.start()
    setIsRecording(true)
  }

  async function submitToTeam() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user?.id) return
    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', auth.user.id).single()
    
    let voiceUrl = null
    if (audioBlob) {
      const fileName = `${Date.now()}-voice.ogg`
      const { data: upload } = await supabase.storage.from('videos').upload(`ideas/${fileName}`, audioBlob)
      if (upload) {
        const { data: url } = supabase.storage.from('videos').getPublicUrl(`ideas/${fileName}`)
        voiceUrl = url.publicUrl
      }
    }

    await supabase.from('ideas').insert({
      client_id: profile?.client_id,
      title: rawIdea.substring(0, 30) + "...",
      description: rawIdea,
      voice_url: voiceUrl,
      status: 'pending'
    })
    
    const slackWebhookUrl = "https://hooks.slack.com/services/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RE"; 

try {
  await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 *New Concept Submitted!*\n*Client:* A client just submitted a new idea.\n*Title:* ${rawIdea.substring(0, 30)}...\n<https://your-domain.com/admin/ideas|Click here to review the brief>`
    })
  });
} catch (err) {
  console.log("Slack notification failed", err);
}
    setRawIdea(''); setAudioURL(null); setGeneratedScript(null); loadIdeas()
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 40px', background: '#050505', minHeight: '100vh', color: '#fff' }}>
      
      <div style={{ borderBottom: '1px solid #1a1a22', paddingBottom: 32, marginBottom: 48 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>Content Strategy</h1>
        <p style={{ color: '#666', fontSize: 14, fontWeight: 500 }}>Turn high-level concepts into high-retention production assets.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'start' }}>
        
        {/* Input Column */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a22', padding: 32, borderRadius: 12 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#D4AF37', marginBottom: 24 }}>The Concept</h2>
          
          <textarea 
            placeholder="Input your raw idea or a specific topic..."
            value={rawIdea}
            onChange={(e) => setRawIdea(e.target.value)}
            style={{ width: '100%', height: 180, background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: 16, fontSize: 15, lineHeight: 1.6, resize: 'none', outline: 'none', marginBottom: 20 }}
          />

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {!isRecording ? (
              <button onClick={startRecording} style={{ flex: 1, padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>🎤 Voice Briefing</button>
            ) : (
              <button onClick={() => mediaRecorder.current?.stop()} style={{ flex: 1, padding: '12px', background: 'rgba(232, 67, 147, 0.1)', border: '1px solid #E84393', color: '#E84393', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>🛑 Stop Recording</button>
            )}
            <button onClick={generateHormoziScript} disabled={!rawIdea || isGenerating} style={{ flex: 1, padding: '12px', background: '#D4AF37', border: 'none', color: '#000', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
              {isGenerating ? 'Analyzing...' : 'AI Script'}
            </button>
          </div>

          {audioURL && <audio src={audioURL} controls style={{ width: '100%', marginBottom: 20, height: 36 }} />}

          <button onClick={submitToTeam} style={{ width: '100%', padding: '16px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
            Submit to Production
          </button>
        </div>

        {/* AI Output Column */}
        <div style={{ border: '1px solid #1a1a22', padding: 32, borderRadius: 12, minHeight: 400 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#fff', marginBottom: 24 }}>Production Brief</h2>
          
          {!generatedScript && !isGenerating ? (
            <div style={{ color: '#444', fontSize: 13, textAlign: 'center', marginTop: 100 }}>Use the AI Script tool to generate a framework.</div>
          ) : (
            <div style={{ opacity: isGenerating ? 0.3 : 1, transition: '0.3s' }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#D4AF37', display: 'block', marginBottom: 8, fontWeight: 700 }}>[ 00:00 — THE HOOK ]</span>
                <p style={{ color: '#eee', fontSize: 14, lineHeight: 1.6 }}>{generatedScript?.hook}</p>
              </div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#666', display: 'block', marginBottom: 8, fontWeight: 700 }}>[ 00:03 — CORE VALUE ]</span>
                <p style={{ color: '#eee', fontSize: 14, lineHeight: 1.6 }}>{generatedScript?.value}</p>
              </div>
              <div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#fff', display: 'block', marginBottom: 8, fontWeight: 700 }}>[ 00:25 — CONVERSION ]</span>
                <p style={{ color: '#eee', fontSize: 14, lineHeight: 1.6 }}>{generatedScript?.cta}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}