'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newClient, setNewClient] = useState({ 
    name: '', instagram_handle: '', plan: 'IDS™ Foundation', 
    videos_per_month: 8, posting_included: false, portal_mode: 'simple', monthly_fee: 5000,
    social_handles: '', sop_link: '', raw_folder_link: '' 
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (data) setClients(data)
    setLoading(false)
  }

  async function updateClientField(clientId: string, field: string, value: string) {
    await supabase.from('clients').update({ [field]: value }).eq('id', clientId)
    setClients(clients.map(c => c.id === clientId ? { ...c, [field]: value } : c))
    setSelected((prev: any) => prev ? { ...prev, [field]: value } : prev)
  }

  async function addClient() {
    if (!newClient.name) return
    await supabase.from('clients').insert({
      name: newClient.name,
      instagram_handle: newClient.instagram_handle,
      plan: newClient.plan,
      videos_per_month: Number(newClient.videos_per_month),
      posting_included: newClient.posting_included,
      portal_mode: newClient.portal_mode,
      social_handles: newClient.social_handles,
      sop_link: newClient.sop_link,
      raw_folder_link: newClient.raw_folder_link
    })
    setShowAdd(false)
    await loadData()
  }

  const filtered = clients.filter(c => {
    if (filter === 'posting') return c.posting_included
    if (filter === 'detailed') return c.portal_mode === 'detailed'
    return true
  })

  const totalMRR = clients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0)

  return (
    <>
      <style>{`
        .glass-header {
          background: rgba(15, 15, 20, 0.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky; top: 0; z-index: 50;
        }
        .metric-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 16px 20px; position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .metric-glow {
          position: absolute; top: -20px; right: -20px; width: 80px; height: 80px;
          border-radius: 50%; filter: blur(30px); opacity: 0.15; pointer-events: none;
        }
        .client-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 12px; padding: 14px 18px; cursor: pointer;
          display: flex; alignItems: center; gap: 16px; transition: all 0.2s;
        }
        .client-card:hover {
          border-color: #7B61FF; transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        }
        .filter-btn {
          padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer;
          border: 1px solid var(--border-subtle); transition: all 0.2s;
        }
        .filter-btn.active { background: #fff; color: #111; border-color: #fff; }
        .filter-btn.inactive { background: var(--bg-card); color: var(--text-secondary); }
        .filter-btn.inactive:hover { background: var(--bg-hover); color: #fff; }
        
        /* Modals */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 16px; padding: 24px; width: 100%; max-width: 460px;
          max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .dark-input {
          width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle); border-radius: 8px;
          color: #fff; font-size: 13px; outline: none; transition: border 0.2s;
        }
        .dark-input:focus { border-color: #7B61FF; background: rgba(0,0,0,0.4); }
      `}</style>

      <div className="glass-header" style={{ padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Client Roster</div>
        <button onClick={() => setShowAdd(true)} style={{ padding: '8px 20px', background: 'var(--primary-gradient)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
          + Add Client
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-secondary)', fontSize: 14 }}>Accessing database...</div>
      ) : (
        <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total clients', value: clients.length, sub: 'Active accounts', color: '#4A90E2' },
              { label: 'Monthly revenue', value: `AED ${totalMRR.toLocaleString()}`, sub: 'Across all plans', color: '#00D084' },
              { label: 'Posting included', value: clients.filter(c => c.posting_included).length, sub: 'We post for them', color: '#E84393' },
              { label: 'Detailed portal', value: clients.filter(c => c.portal_mode === 'detailed').length, sub: 'Advanced view', color: '#7B61FF' },
            ].map(s => (
              <div key={s.label} className="metric-card">
                <div className="metric-glow" style={{ background: s.color }}></div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: s.color, marginTop: 8, fontWeight: 500 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[{ id: 'all', label: 'All clients' }, { id: 'posting', label: 'Posting included' }, { id: 'detailed', label: 'Detailed portal' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={`filter-btn ${filter === f.id ? 'active' : 'inactive'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
            {filtered.map(client => (
              <div key={client.id} onClick={() => setSelected(client)} className="client-card">
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {client.name[0]}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{client.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {client.plan} <span style={{ color: '#4A90E2' }}>· {client.videos_per_month} vids/mo</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {client.posting_included && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(0, 208, 132, 0.1)', color: '#00D084', fontWeight: 600 }}>Posting</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{client.portal_mode}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>
                {selected.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.instagram_handle}</div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
              {[
                ['Plan', selected.plan],
                ['Videos per month', selected.videos_per_month],
                ['Posting included', selected.posting_included ? 'Yes' : 'No'],
              ].map(([l, v], i) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: i === 2 ? '8px 0 0' : '8px 0', borderBottom: i === 2 ? 'none' : '1px solid var(--border-subtle)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Portal View Mode</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['simple', 'detailed'].map(mode => (
                  <button key={mode} onClick={() => updateClientField(selected.id, 'portal_mode', mode)} 
                    style={{ flex: 1, padding: '10px', border: mode === selected.portal_mode ? '1px solid #7B61FF' : '1px solid var(--border-subtle)', borderRadius: 8, background: mode === selected.portal_mode ? 'rgba(123, 97, 255, 0.1)' : 'rgba(0,0,0,0.2)', color: mode === selected.portal_mode ? '#fff' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', fontWeight: mode === selected.portal_mode ? 600 : 400, transition: 'all 0.2s' }}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Asset Links */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Asset Management</div>
              
              {[
                { key: 'social_handles', label: 'Social Handles', placeholder: 'e.g. IG: @handle | TikTok: @handle' },
                { key: 'sop_link', label: 'SOP Document Link', placeholder: 'https://docs.google.com/...' },
                { key: 'raw_folder_link', label: 'Raw Footage Folder', placeholder: 'https://drive.google.com/...' }
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{f.label}</div>
                  <input 
                    defaultValue={selected[f.key] || ''}
                    onBlur={(e) => updateClientField(selected.id, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="dark-input"
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}>Close</button>
              <a href={`/client/${selected.id}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: '#fff', borderRadius: 8, fontSize: 13, color: '#111', textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s' }}>
                Open Portal ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 24 }}>New Client Profile</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Full name', key: 'name', type: 'text', placeholder: 'e.g. Hamdan Al Mansoori' },
                { label: 'Instagram handle', key: 'instagram_handle', type: 'text', placeholder: '@handle' },
                { label: 'Videos per month', key: 'videos_per_month', type: 'number', placeholder: '8' },
                { label: 'Social Handles', key: 'social_handles', type: 'text', placeholder: 'IG: @... | TikTok: @...' },
                { label: 'SOP Link', key: 'sop_link', type: 'text', placeholder: 'https://docs...' },
                { label: 'Master Raw Folder', key: 'raw_folder_link', type: 'text', placeholder: 'https://drive...' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{f.label}</div>
                  <input type={f.type} value={(newClient as any)[f.key]} onChange={e => setNewClient({ ...newClient, [f.key]: e.target.value })}
                    placeholder={f.placeholder} className="dark-input" />
                </div>
              ))}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Plan</div>
                <select value={newClient.plan} onChange={e => setNewClient({ ...newClient, plan: e.target.value })} className="dark-input">
                  <option>IDS™ Foundation</option>
                  <option>IDS™ Sustain</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Portal mode</div>
                <select value={newClient.portal_mode} onChange={e => setNewClient({ ...newClient, portal_mode: e.target.value })} className="dark-input">
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <input type="checkbox" id="posting" checked={newClient.posting_included} onChange={e => setNewClient({ ...newClient, posting_included: e.target.checked })} style={{ accentColor: '#7B61FF', width: 16, height: 16 }} />
              <label htmlFor="posting" style={{ fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>Posting & Publishing Included</label>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={addClient} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: 8, background: 'var(--primary-gradient)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>Create Client</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}