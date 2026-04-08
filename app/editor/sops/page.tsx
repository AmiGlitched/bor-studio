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
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Client Assets & SOPs</div>
      </div>

      <div style={{ padding: 24, maxWidth: 1000 }}>
        <div style={{ marginBottom: 24 }}>
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: 300, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none' }}
          />
        </div>

        {loading ? (
          <div style={{ color: '#bbb', fontSize: 14 }}>Loading client assets...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredClients.map(client => (
              <div key={client.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 2 }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{client.plan}</div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>Social Handles</div>
                  <div style={{ fontSize: 13, color: '#333', background: '#f9f9f9', padding: '8px 12px', borderRadius: 6, border: '1px solid #eee' }}>
                    {client.social_handles || 'No handles added yet.'}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={client.sop_link || '#'} target={client.sop_link ? "_blank" : "_self"} rel="noreferrer" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', background: '#f5f5f5', color: client.sop_link ? '#111' : '#ccc', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, border: '1px solid #eee', pointerEvents: client.sop_link ? 'auto' : 'none' }}>
                    📄 {client.sop_link ? 'Open SOPs (Google Doc)' : 'No SOP Link'}
                  </a>
                  
                  <a href={client.raw_folder_link || '#'} target={client.raw_folder_link ? "_blank" : "_self"} rel="noreferrer" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', background: client.raw_folder_link ? '#111' : '#eee', color: client.raw_folder_link ? '#fff' : '#aaa', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, pointerEvents: client.raw_folder_link ? 'auto' : 'none' }}>
                    📁 {client.raw_folder_link ? 'Master Raw Folder' : 'No Folder Link'}
                  </a>
                </div>

              </div>
            ))}
            {filteredClients.length === 0 && (
              <div style={{ color: '#888', fontSize: 14 }}>No clients found.</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}   