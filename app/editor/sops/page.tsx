'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientSOPs() {
  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, name, plan, social_handles, sop_link, raw_folder_link')
        .order('name', { ascending: true })
      
      if (data) setClients(data)
      setLoading(false)
    }
    loadClients()
  }, [])

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .sop-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 20px; display: flex; flex-direction: column;
          transition: all 0.2s ease; position: relative; overflow: hidden;
        }
        .sop-card:hover {
          transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          border-color: #7B61FF;
        }
        .dark-input {
          width: 100%; max-width: 340px; padding: 12px 16px; background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle); border-radius: 10px;
          color: #fff; font-size: 13px; outline: none; transition: border 0.2s;
        }
        .dark-input:focus { border-color: #7B61FF; background: rgba(0,0,0,0.4); }
        .asset-btn {
          display: flex; align-items: center; justify-content: center; width: 100%;
          padding: 12px; border-radius: 8px; text-decoration: none; font-size: 13px;
          font-weight: 600; transition: all 0.2s; border: 1px solid transparent;
        }
        .asset-btn.secondary {
          background: rgba(0,0,0,0.2); border-color: var(--border-subtle); color: #fff;
        }
        .asset-btn.secondary:hover { background: rgba(255,255,255,0.1); }
        .asset-btn.primary {
          background: var(--primary-gradient); color: #fff; box-shadow: 0 4px 12px rgba(123, 97, 255, 0.2);
        }
        .asset-btn.primary:hover { filter: brightness(1.1); }
        .asset-btn.disabled {
          background: rgba(0,0,0,0.1); border-color: var(--border-subtle); color: var(--text-secondary);
          pointer-events: none; opacity: 0.6;
        }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Client Assets & SOPs</div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <input 
            type="text" 
            placeholder="🔍 Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark-input"
          />
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Decrypting asset vault...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filteredClients.map(client => (
              <div key={client.id} className="sop-card">
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {client.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{client.name}</div>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: 'rgba(74, 144, 226, 0.1)', color: '#4A90E2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {client.plan}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 24, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social Handles</div>
                  <div style={{ fontSize: 13, color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-subtle)', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    {client.social_handles || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No handles provided.</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                  <a href={client.sop_link || '#'} target={client.sop_link ? "_blank" : "_self"} rel="noreferrer" 
                    className={`asset-btn ${client.sop_link ? 'secondary' : 'disabled'}`}>
                    📄 {client.sop_link ? 'Read SOP Document' : 'No SOP Available'}
                  </a>
                  
                  <a href={client.raw_folder_link || '#'} target={client.raw_folder_link ? "_blank" : "_self"} rel="noreferrer" 
                    className={`asset-btn ${client.raw_folder_link ? 'primary' : 'disabled'}`}>
                    📁 {client.raw_folder_link ? 'Access Raw Footage' : 'No Folder Linked'}
                  </a>
                </div>

              </div>
            ))}
            {filteredClients.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: '1px dashed var(--border-subtle)' }}>
                No clients match your search criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}