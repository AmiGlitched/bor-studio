'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CalendarHub() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [summaryText, setSummaryText] = useState('')
  const [saving, setSaving] = useState(false)

  const [showNewModal, setShowNewModal] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '10:00', type: 'meeting', client_id: '' })
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => { loadData(); loadClients() }, [])

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
    if (!newEvent.title || !newEvent.date || !newEvent.client_id) {
      alert("Please fill in the Event Title, Date, and select a Client before saving.");
      return;
    }

    try {
      const dateTimeString = new Date(`${newEvent.date}T${newEvent.time}`).toISOString()
      
      const { error } = await supabase.from('shoots').insert({ 
        location: newEvent.title, 
        date: dateTimeString, 
        time: newEvent.time, 
        type: newEvent.type, 
        client_id: newEvent.client_id, 
        status: 'scheduled' 
      })

      if (error) throw error; 

      setShowNewModal(false)
      setNewEvent({ title: '', date: '', time: '10:00', type: 'meeting', client_id: '' })
      loadData()
    } catch (err: any) {
      console.error("Save Error:", err)
      alert(`Failed to save event: ${err.message}`)
    }
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
    <>
      <style>{`
        .header-wrapper { width: 100%; border-bottom: 1px solid #1f1f2e; position: sticky; top: 0; z-index: 50; background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(12px); }
        .page-header { height: 76px; display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; box-sizing: border-box; }
        .page-wrapper { width: 100%; display: flex; justify-content: center; padding: 40px 0; }
        .page-container { max-width: 1200px; width: 100%; padding: 0 40px; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; }
        
        .event-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 20px; transition: all 0.2s; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .event-card:hover { border-color: #3f3f46; background: rgba(255,255,255,0.02); }
        .event-card.active { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
        
        .btn { padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #1f1f2e; background: #0e0e11; color: #f4f4f5; transition: 0.2s; }
        .btn:hover { background: #1f1f2e; }
        .btn-gold { background: #D4AF37; border: none; color: #09090b; }
        .btn-gold:hover { background: #e5c048; }
        
        .input-dark { 
          box-sizing: border-box; width: 100%; background: rgba(255,255,255,0.02); 
          border: 1px solid #1f1f2e; border-radius: 8px; padding: 14px; 
          color: #f4f4f5; font-size: 14px; outline: none; margin-bottom: 16px; 
          transition: border-color 0.2s;
          color-scheme: dark; 
        }
        .input-dark:focus { border-color: #D4AF37; }
        .input-dark option { background: #0e0e11; color: #f4f4f5; }

        .tag { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 6px; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(5,5,5,0.9); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; box-sizing: border-box; }
        .modal-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 16px; padding: 40px; width: 100%; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); box-sizing: border-box; }
      `}</style>

      <div className="header-wrapper">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Calendar & Syncs</h1>
          <button onClick={() => setShowNewModal(true)} className="btn btn-gold">Schedule Event</button>
        </div>
      </div>

      <div className="page-wrapper">
        <div className="page-container">
          
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: '#f4f4f5', letterSpacing: '-0.01em' }}>Upcoming Agenda</h2>
            {loading ? <div style={{ color: '#71717a', fontSize: 14 }}>Syncing calendar...</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {events.map(ev => (
                  <div key={ev.id} className={`event-card ${selectedEvent?.id === ev.id ? 'active' : ''}`} onClick={() => { setSelectedEvent(ev); setSummaryText(ev.meeting_summary || ''); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="tag" style={{ background: ev.type === 'meeting' ? 'rgba(123, 97, 255, 0.1)' : 'rgba(212, 175, 55, 0.1)', color: ev.type === 'meeting' ? '#a78bfa' : '#D4AF37' }}>
                        {ev.type}
                      </span>
                      <span style={{ fontSize: 12, color: '#a1a1aa' }}>
                        {new Date(ev.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#f4f4f5', marginBottom: 6 }}>{ev.location}</div>
                    <div style={{ fontSize: 12, color: '#71717a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ev.clients?.name || 'Internal'}</div>
                  </div>
                ))}
                {events.length === 0 && <div style={{ color: '#71717a', fontSize: 13, border: '1px dashed #1f1f2e', padding: 30, borderRadius: 12, textAlign: 'center' }}>No upcoming events scheduled.</div>}
              </div>
            )}
          </div>

          <div>
            <div style={{ background: '#0e0e11', border: '1px solid #1f1f2e', borderRadius: 12, padding: 32, minHeight: 600, position: 'sticky', top: 110, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              {!selectedEvent ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#71717a', textAlign: 'center', fontSize: 14 }}>
                  Select a meeting from the agenda<br/>to log strategy summaries.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ borderBottom: '1px solid #1f1f2e', paddingBottom: 24, marginBottom: 24 }}>
                    <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Strategy Summary Logger</div>
                    <h3 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.01em' }}>{selectedEvent.location}</h3>
                    <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 8 }}>{selectedEvent.clients?.name}</div>
                  </div>

                  <textarea 
                    placeholder="Document key decisions, hooks discussed, and action items for the client here..."
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid #1f1f2e', borderRadius: 8, padding: 20, color: '#f4f4f5', fontSize: 14, lineHeight: 1.6, resize: 'none', outline: 'none', marginBottom: 24, transition: 'border-color 0.2s' }}
                    onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                    onBlur={(e) => e.target.style.borderColor = '#1f1f2e'}
                  />

                  <button onClick={saveSummary} disabled={saving} className="btn btn-gold" style={{ width: '100%' }}>
                    {saving ? 'Syncing...' : 'Publish Summary'}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {showNewModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewModal(false) }}>
          <div className="modal-card">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f4f4f5', marginBottom: 24, letterSpacing: '-0.01em' }}>Schedule Event</h2>
            
            <input type="text" placeholder="Event Title / Location" className="input-dark" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            
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
    </>
  )
}