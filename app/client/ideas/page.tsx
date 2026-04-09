'use client'

export default function ClientIdeas() {
  return (
    <>
      <div style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', background: 'rgba(15, 15, 20, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Send Ideas</div>
      </div>
      <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Have a content idea?</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Drop your thoughts, reference links, or audio notes here for the creative team.</div>
          
          <textarea 
            placeholder="Describe your idea or paste TikTok/Reel links here..."
            style={{ width: '100%', minHeight: 150, padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 16 }}
          />
          <button style={{ padding: '12px 24px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
            Submit Idea to Team
          </button>
        </div>
      </div>
    </>
  )
}