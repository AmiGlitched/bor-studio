'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CameramanDashboard() {
  const [shoots, setShoots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShoot, setSelectedShoot] = useState<any>(null)
  const [uploadUrl, setUploadUrl] = useState('')
  const [processing, setProcessing] = useState(false)

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => { loadShoots() }, [])

  async function loadShoots() {
    setLoading(true)
    const { data } = await supabase
      .from('shoots')
      .select('*, clients(name)')
      .order('date', { ascending: true })
    
    if (data) setShoots(data)
    setLoading(false)
  }

  async function handleMarkUploaded(id: number) {
    if (!uploadUrl.trim()) return alert("Please provide the drive link")
    setProcessing(true)
    
    await supabase
      .from('shoots')
      .update({ status: 'completed', raw_footage_link: uploadUrl })
      .eq('id', id)
      
    setProcessing(false)
    setSelectedShoot(null)
    setUploadUrl('')
    loadShoots()
  }

  // Calendar Helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(selectedDate === dateStr ? null : dateStr) // Toggle selection
  }

  // Filter shoots for the right panel
  const displayedShoots = selectedDate 
    ? shoots.filter(s => s.date === selectedDate)
    : shoots.filter(s => s.status === 'confirmed' || s.status === 'pending')

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Shoot Calendar</div>
      </div>

      <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24, height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
        
        {/* Left Side: Calendar */}
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20, height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{monthNames[month]} {year}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={prevMonth} style={{ background: '#f5f5f5', border: 'none', width: 28, height: 28, borderRadius: 6, cursor: 'pointer' }}>←</button>
              <button onClick={nextMonth} style={{ background: '#f5f5f5', border: 'none', width: 28, height: 28, borderRadius: 6, cursor: 'pointer' }}>→</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#999' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayShoots = shoots.filter(s => s.date === dateStr)
              const hasShoot = dayShoots.length > 0
              const isSelected = selectedDate === dateStr
              
              return (
                <button 
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{ 
                    height: 40, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: isSelected ? '#111' : hasShoot ? '#f0fdf4' : 'transparent',
                    color: isSelected ? '#fff' : hasShoot ? '#27ae60' : '#333',
                    border: hasShoot && !isSelected ? '1px solid #bbf7d0' : '1px solid transparent',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: hasShoot ? 600 : 400,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {day}
                  {hasShoot && !isSelected && (
                    <div style={{ width: 4, height: 4, background: '#27ae60', borderRadius: '50%', position: 'absolute', bottom: 4 }} />
                  )}
                </button>
              )
            })}
          </div>
          
          {selectedDate && (
             <button 
                onClick={() => setSelectedDate(null)}
                style={{ width: '100%', marginTop: 16, padding: '8px', fontSize: 12, color: '#888', background: 'transparent', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer' }}
             >
               Clear Selection
             </button>
          )}
        </div>

        {/* Right Side: Shoot Details */}
        <div style={{ overflowY: 'auto', paddingRight: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 16 }}>
            {selectedDate ? `Shoots on ${selectedDate}` : 'All Upcoming Shoots'}
          </div>

          {loading ? (
             <div style={{ color: '#bbb', fontSize: 14 }}>Loading...</div>
          ) : displayedShoots.length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #ddd', color: '#888', fontSize: 13 }}>
               No shoots scheduled for this view.
             </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {displayedShoots.map(shoot => (
                <div key={shoot.id} style={{ background: '#fff', border: '1px solid #eee', borderLeft: shoot.status === 'completed' ? '3px solid #27ae60' : '3px solid #e67e22', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>{shoot.clients?.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 8 }}>{shoot.title || 'Client Shoot'}</div>
                    <div style={{ fontSize: 13, color: '#666', display: 'flex', gap: 16 }}>
                      <span>📅 {shoot.date}</span>
                      <span>⏰ {shoot.time || 'TBD'}</span>
                      <span>📍 {shoot.location || 'TBD'}</span>
                    </div>
                  </div>
                  <div>
                    {shoot.status === 'completed' ? (
                       <span style={{ fontSize: 12, color: '#27ae60', fontWeight: 500, padding: '6px 12px', background: '#f0fdf4', borderRadius: 6 }}>✓ Uploaded</span>
                    ) : (
                      <button 
                        onClick={() => setSelectedShoot(shoot)}
                        style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Upload Footage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {selectedShoot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>Submit Raw Footage</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{selectedShoot.clients?.name} · {selectedShoot.date}</div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#111', display: 'block', marginBottom: 8 }}>
                Google Drive Link (Raw Files)
              </label>
              <input
                value={uploadUrl}
                onChange={e => setUploadUrl(e.target.value)}
                placeholder="Paste Drive link here..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9', outline: 'none', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setSelectedShoot(null); setUploadUrl(''); }}
                style={{ flex: 1, padding: '10px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => handleMarkUploaded(selectedShoot.id)}
                disabled={processing || !uploadUrl.trim()}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: uploadUrl.trim() ? '#111' : '#ccc', color: '#fff', fontSize: 13, cursor: uploadUrl.trim() ? 'pointer' : 'default', fontWeight: 500 }}>
                {processing ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}