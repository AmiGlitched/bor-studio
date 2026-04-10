'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientMeetings() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)

  useEffect(() => { loadMeetings() }, [])

  async function loadMeetings() {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user?.id) return

    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()
    
    if (profile?.client_id) {
      // Fetch only meetings that have a summary written
      const { data } = await supabase
        .from('shoots')
        .select('*')
        .eq('client_id', profile.client_id)
        .eq('type', 'meeting')
        .not('meeting_summary', 'is', null)
        .order('date', { ascending: false })
      
      if (data) {
        setMeetings(data)
        if (data.length > 0) setSelectedMeeting(data[0]) // Auto-select the most recent
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .meeting-card { padding: 20px; border-bottom: 1px solid #1a1a22; cursor: pointer; transition: all 0.2s; border-left: 2px solid transparent; }
        .meeting-card:hover { background: rgba(255,255,255,0.02); }
        .meeting-card.active { border-left-color: #D4AF37; background: #0f0f0f; }
      `}</style>

      <div className="glass-header" style={{ padding: '0 40px', height: 70, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700 }}>Strategy Syncs</div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '350px 1fr', gap: 40, alignItems: 'start' }}>
        
        {/* Left Column: Meeting History */}
        <div style={{ background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #1a1a22' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, margin: 0 }}>Archive</h2>
          </div>
          
          {loading ? <div style={{ padding: 20, color: '#666' }}>Loading records...</div> : (
            <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              {meetings.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666', fontSize: 13 }}>No strategy notes available yet.</div>
              ) : (
                meetings.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className={`meeting-card ${selectedMeeting?.id === meeting.id ? 'active' : ''}`}
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(meeting.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: selectedMeeting?.id === meeting.id ? '#fff' : '#ccc' }}>
                      {meeting.location}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: The Summary Document */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a22', borderRadius: 16, padding: '48px 56px', minHeight: 600 }}>
          {!selectedMeeting ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
              Select a sync to view notes.
            </div>
          ) : (
            <>
              <div style={{ borderBottom: '1px solid #1a1a22', paddingBottom: 32, marginBottom: 32 }}>
                <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Executive Summary</div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, color: '#fff', marginBottom: 12 }}>{selectedMeeting.location}</h1>
                <div style={{ fontSize: 13, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                  Recorded on {new Date(selectedMeeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              
              <div style={{ fontSize: 15, lineHeight: 1.8, color: '#ddd', whiteSpace: 'pre-wrap' }}>
                {selectedMeeting.meeting_summary}
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  )
}