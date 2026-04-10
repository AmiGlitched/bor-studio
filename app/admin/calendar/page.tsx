'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CalendarHub() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [summaryText, setSummaryText] = useState('')
  const [saving, setSaving] = useState(false)

  // Added 'time' to state
  const [showNewModal, setShowNewModal] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '10:00', type: 'meeting', client_id: '' })
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => { 
    loadData()
    loadClients()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('shoots').select('*, clients(name)').order('date', { ascending: true })
    if (data) setEvents(data)
    setLoading(false)
  }

  async function loadClients() {
    const { data } = await supabase.from('clients').select('id, name')
    if (data) setClients(data)
  }

  async function handleCreateEvent() {
    // Combine date and time into a single timestamp
    const dateTimeString = new Date(`${newEvent.date}T${newEvent.time}`).toISOString()

    await supabase.from('shoots').insert({
      location: newEvent.title,
      date: dateTimeString,
      type: newEvent.type,
      client_id: newEvent.client_id,
      status: 'scheduled'
    })
    setShowNewModal(false)
    setNewEvent({ title: '', date: '', time: '10:00', type: 'meeting', client_id: '' })
    loadData()
  }

  async function saveSummary() {
    if (!selectedEvent) return
    setSaving(true)
    await supabase.from('shoots').update({ meeting_summary: summaryText, status: 'completed' }).eq('id', selectedEvent.id)
    setSaving(false)
    setSelectedEvent(null)
    loadData()
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .event-card { background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 20px; transition: all 0.2s; cursor: pointer; }
        .event-card:hover { border-color: #333; background: #111; }
        .event-card.active { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
        .btn { padding: 12px 24px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; border: 1px solid #333; background: #111; color: #fff; transition: 0.2s; }
        .btn:hover { background: #1a1a22; }
        .btn-gold { background: #D4AF37; border: none; color: #000; }
        .btn-gold:hover { background: #e5c048; }
        .input-dark { box-sizing: border-box; width: 100%; background: #050505; border: 1px solid #222; border-radius: 8px; padding: 14px; color: #fff; font-size: 13px; outline: none; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; }
        .input-dark:focus { border-color: #D4AF37; }
        .tag { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 4px; }
      `}</style>

      {/* Unified Header Font */}
      <div className="glass-header" style={{ padding: '0 40px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, margin: 0 }}>Calendar & Syncs</h1>
        <button onClick={() => setShowNewModal(true)} className="btn btn-gold">Schedule Event</button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40 }}>
        
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 24, color: '#fff' }}>Upcoming Agenda</h2>
          {loading ? <div style={{ color: '#666', fontSize: 13 }}>Syncing calendar...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {events.map(ev => (
                <div key={ev.id} className={`event-card ${selectedEvent?.id === ev.id ? 'active' : ''}`} onClick={() => { setSelectedEvent(ev); setSummaryText(ev.meeting_summary || ''); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="tag" style={{ background: ev.type === 'meeting' ? 'rgba(123, 97, 255, 0.1)' : 'rgba(212, 175, 55, 0.1)', color: ev.type === 'meeting' ? '#7B61FF' : '#D4AF37' }}>
                      {ev.type}
                    </span>
                    {/* FIXED: Now renders Time + Date beautifully */}
                    <span style={{ fontSize: 11, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(ev.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{ev.location}</div>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ev.clients?.name || 'Internal'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a22', borderRadius: 12, padding: 32, minHeight: 600, position: 'sticky', top: 100 }}>
            {!selectedEvent ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#444', textAlign: 'center', fontSize: 13 }}>
                Select a meeting from the agenda<br/>to log strategy summaries.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ borderBottom: '1px solid #1a1a22', paddingBottom: 24, marginBottom: 24 }}>
                  <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Strategy Summary Logger</div>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#fff', margin: 0 }}>{selectedEvent.location}</h3>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>{selectedEvent.clients?.name}</div>
                </div>

                <textarea 
                  placeholder="Document key decisions, hooks discussed, and action items for the client here..."
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  style={{ flex: 1, background: '#050505', border: '1px solid #222', borderRadius: 8, padding: 20, color: '#fff', fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none', marginBottom: 24 }}
                />

                <button onClick={saveSummary} disabled={saving} className="btn btn-gold" style={{ width: '100%' }}>
                  {saving ? 'Syncing...' : 'Publish Summary'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a22', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 24 }}>Schedule Event</h2>
            
            <input type="text" placeholder="Event Title / Location" className="input-dark" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            
            {/* Added Time alongside Date */}
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="date" className="input-dark" style={{ flex: 1 }} value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
              <input type="time" className="input-dark" style={{ width: 140 }} value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
            </div>
            
            <select className="input-dark" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
              <option value="meeting">Strategy Meeting</option>
              <option value="shoot">Production Shoot</option>
            </select>

            <select className="input-dark" value={newEvent.client_id} onChange={e => setNewEvent({...newEvent, client_id: e.target.value})}>
              <option value="">Select Client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setShowNewModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleCreateEvent} className="btn btn-gold" style={{ flex: 1 }}>Save Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}