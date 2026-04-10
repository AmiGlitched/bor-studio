'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientShootsCalendar() {
  const [shoots, setShoots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [formData, setFormData] = useState({ time: '10:00', location: '', brief: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadShoots() }, [])

  async function loadShoots() {
    setLoading(true)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user?.id) return

    const { data: profile } = await supabase.from('users').select('client_id').eq('auth_id', user.id).single()
    
    if (profile?.client_id) {
      setClientId(profile.client_id)
      const { data } = await supabase
        .from('shoots')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('date', { ascending: true })
      if (data) setShoots(data)
    }
    setLoading(false)
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
    setShowModal(true)
  }

  const handleSubmitRequest = async () => {
    if (!selectedDate || !clientId) return
    setSaving(true)

    // 1. Combine date and time
    const [hours, minutes] = formData.time.split(':')
    const finalDateTime = new Date(selectedDate)
    finalDateTime.setHours(parseInt(hours), parseInt(minutes))
    
    // Default to a 2-hour shoot block for the calendar
    const endDateTime = new Date(finalDateTime.getTime() + 2 * 60 * 60 * 1000) 

    // 2. Save to your Agency OS Database (Supabase)
    await supabase.from('shoots').insert({
      client_id: clientId,
      date: finalDateTime.toISOString(),
      location: formData.location,
      meeting_summary: formData.brief, 
      type: 'shoot',
      status: 'pending' 
    })

    // 3. Push the actual event to Google Calendar
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Agency Shoot: ${formData.location}`,
          location: formData.location,
          description: formData.brief,
          startTime: finalDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        })
      })
    } catch (err) {
      console.error("Failed to sync to Google Calendar", err)
    }

    // 4. Reset the UI
    setSaving(false)
    setShowModal(false)
    setFormData({ time: '10:00', location: '', brief: '' })
    loadShoots()
  }

  const getShootsForDay = (day: number) => {
    return shoots.filter(shoot => {
      const shootDate = new Date(shoot.date)
      return shootDate.getDate() === day && 
             shootDate.getMonth() === currentDate.getMonth() && 
             shootDate.getFullYear() === currentDate.getFullYear()
    })
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }
        .day-header { text-align: center; font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 0.1em; padding-bottom: 12px; }
        
        /* FIXED: Replaced aspect-ratio with min-height and added box-sizing */
        .day-cell { min-height: 120px; box-sizing: border-box; background: #0a0a0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 12px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; position: relative; }
        
        .day-cell:hover { border-color: #D4AF37; background: rgba(212, 175, 55, 0.05); }
        .day-cell.empty { background: transparent; border: none; cursor: default; }
        .day-number { font-family: 'Playfair Display', serif; font-size: 18px; color: #fff; font-weight: 600; margin-bottom: 8px; }
        .shoot-indicator { background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.3); color: #D4AF37; font-size: 9px; padding: 4px 6px; border-radius: 4px; font-weight: 700; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-card { box-sizing: border-box; background: #0f0f0f; border: 1px solid #1a1a22; border-radius: 16px; padding: 40px; width: 100%; max-width: 480px; }
        .input-dark { box-sizing: border-box; width: 100%; background: #050505; border: 1px solid #222; border-radius: 8px; padding: 14px; color: #fff; font-size: 14px; outline: none; margin-bottom: 24px; transition: 0.2s; font-family: 'JetBrains Mono', monospace; }
        .input-dark:focus { border-color: #D4AF37; }
        .input-label { display: block; font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800; margin-bottom: 8px; }
        .btn { padding: 14px 24px; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: 0.2s; border: none; }
        .btn-ghost { background: transparent; color: #aaa; border: 1px solid #333; }
        .btn-ghost:hover { background: #111; color: #fff; }
        .btn-gold { background: #D4AF37; color: #000; }
        .btn-gold:hover { background: #e5c048; transform: translateY(-2px); }
      `}</style>

      <div className="glass-header" style={{ padding: '0 40px', height: 70, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>Shoots & Schedule</div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 32px' }}>
        
        {/* FIXED UX: Added clear instructions under the month */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <button onClick={handlePrevMonth} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>← Previous</button>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, margin: '0 0 8px 0', color: '#D4AF37' }}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <p style={{ color: '#888', fontSize: 13, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Select a date to request a production slot
            </p>
          </div>

          <button onClick={handleNextMonth} className="btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Next →</button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
          
          {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} className="day-cell empty" />)}
          
          {[...Array(daysInMonth)].map((_, i) => {
            const dayNumber = i + 1
            const dayShoots = getShootsForDay(dayNumber)
            
            return (
              <div key={dayNumber} className="day-cell" onClick={() => handleDayClick(dayNumber)}>
                <div className="day-number">{dayNumber}</div>
                {dayShoots.map(shoot => (
                  <div key={shoot.id} className="shoot-indicator">
                    {shoot.location || 'Scheduled'}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {showModal && selectedDate && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#fff', margin: '0 0 8px 0' }}>Schedule Shoot</h2>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>Request a production slot for your project.</p>

            <div>
              <span className="input-label">Selected Date</span>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#D4AF37', marginBottom: 24 }}>
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div>
                <label className="input-label">Start Time</label>
                <input 
                  type="time" 
                  className="input-dark" 
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div>
                <label className="input-label">Location</label>
                <input 
                  type="text" 
                  className="input-dark" 
                  placeholder="Studio, Office, or Site..."
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Creative Brief</label>
              <textarea 
                className="input-dark" 
                placeholder="What are we filming? What's the core objective?"
                style={{ height: 120, resize: 'none' }}
                value={formData.brief}
                onChange={e => setFormData({...formData, brief: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleSubmitRequest} disabled={saving || !formData.location} className="btn btn-gold" style={{ flex: 1 }}>
                {saving ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}