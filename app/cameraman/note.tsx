'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function CameramanPortal() {
  const [shoots, setShoots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShoot, setSelectedShoot] = useState<any>(null)
  
  // Voice Recording
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  useEffect(() => { loadShoots() }, [])

  async function loadShoots() {
    const { data } = await supabase.from('shoots').select('*, clients(name)').order('date', { ascending: true })
    if (data) setShoots(data)
    setLoading(false)
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    const chunks: any[] = []
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.current.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/ogg' }))
    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  async function saveShootUpdate(id: string, status: string) {
    let voiceUrl = null
    if (audioBlob) {
      const fileName = `voice-${id}-${Date.now()}.ogg`
      await supabase.storage.from('videos').upload(`voice-notes/${fileName}`, audioBlob)
      const { data } = supabase.storage.from('videos').getPublicUrl(`voice-notes/${fileName}`)
      voiceUrl = data.publicUrl
    }

    await supabase.from('shoots').update({ status, voice_note_url: voiceUrl }).eq('id', id)
    setSelectedShoot(null)
    loadShoots()
  }

  return (
    <div style={{ padding: 24, background: '#000', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ fontWeight: 800, marginBottom: 24 }}>Shoot Schedule</h2>
      
      {shoots.map(s => (
        <div key={s.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ color: '#7B61FF', fontSize: 11, fontWeight: 700 }}>{s.clients?.name}</div>
          <div style={{ fontSize: 18, fontWeight: 600, margin: '4px 0' }}>{s.location}</div>
          <div style={{ fontSize: 13, color: '#666' }}>{s.date}</div>
          
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => saveShootUpdate(s.id, 'completed')} style={{ flex: 1, padding: 12, background: '#00D084', border: 'none', borderRadius: 8, fontWeight: 700 }}>Complete ✅</button>
            <button onClick={() => setSelectedShoot(s)} style={{ flex: 1, padding: 12, background: '#222', border: '1px solid #333', borderRadius: 8, color: '#fff' }}>Notes 🎤</button>
          </div>
        </div>
      ))}

      {selectedShoot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', padding: 32, zIndex: 100 }}>
          <h3 style={{ marginBottom: 20 }}>Add Shoot Feedback</h3>
          <div style={{ marginBottom: 20 }}>
            {!isRecording ? (
              <button onClick={startRecording} style={{ padding: '16px 24px', background: '#E84393', border: 'none', borderRadius: 12, color: '#fff', width: '100%' }}>🎤 Start Voice Message</button>
            ) : (
              <button onClick={stopRecording} style={{ padding: '16px 24px', background: '#333', border: 'none', borderRadius: 12, color: '#fff', width: '100%' }}>🛑 Stop Recording</button>
            )}
          </div>
          <button onClick={() => saveShootUpdate(selectedShoot.id, 'postponed')} style={{ width: '100%', padding: 16, background: '#F5A623', border: 'none', borderRadius: 12, marginBottom: 12 }}>Mark Postponed</button>
          <button onClick={() => setSelectedShoot(null)} style={{ width: '100%', padding: 16, background: '#222', border: 'none', borderRadius: 12, color: '#fff' }}>Close</button>
        </div>
      )}
    </div>
  )
}