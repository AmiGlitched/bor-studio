'use client'

export default function ClientShoots() {
  return (
    <>
      <div style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>My Shoots</div>
      </div>
      <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
         <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Upcoming Shoots</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>We will notify you here when your next shoot is scheduled.</div>
        </div>
      </div>
    </>
  )
}