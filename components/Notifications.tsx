'use client'
import { useState, useEffect } from 'react'

// Placeholder for your actual notification fetching logic
export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: '#1a1a22', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}
      >
        <span>🔔</span> Notifications
      </button>

      {/* The Dropdown Panel */}
      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '120%', 
          right: 0, 
          width: 360, 
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'rgba(10, 10, 15, 0.95)', 
          backdropFilter: 'blur(12px)', 
          border: '1px solid #1a1a22', 
          borderRadius: 16, 
          zIndex: 9999, /* 👈 THIS KEEPS IT ON TOP OF EVERYTHING */
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#D4AF37', borderBottom: '1px solid #1a1a22', paddingBottom: '12px' }}>Recent Activity</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <p style={{ margin: 0, fontSize: '13px', color: '#ccc' }}>No new notifications right now.</p>
             {/* Map your actual notifications here later */}
          </div>
        </div>
      )}
    </div>
  )
}