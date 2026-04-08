'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const paymentColors: Record<string, { bg: string, text: string, label: string }> = {
  paid: { bg: '#f0fdf4', text: '#27ae60', label: 'Paid' },
  overdue: { bg: '#fef2f2', text: '#e74c3c', label: 'Overdue' },
  upcoming: { bg: '#fff8f0', text: '#e67e22', label: 'Due soon' },
}

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newClient, setNewClient] = useState({ name: '', instagram_handle: '', plan: 'IDS™ Foundation', videos_per_month: 8, posting_included: false, portal_mode: 'simple', monthly_fee: 5000 })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*')
    if (data) setClients(data)
    setLoading(false)
  }

  async function updatePortalMode(clientId: string, mode: string) {
    await supabase.from('clients').update({ portal_mode: mode }).eq('id', clientId)
    setClients(clients.map(c => c.id === clientId ? { ...c, portal_mode: mode } : c))
    setSelected((prev: any) => prev ? { ...prev, portal_mode: mode } : prev)
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
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/admin" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Dashboard</a>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Clients</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ fontSize: 12, padding: '6px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>+ Add client</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#bbb', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total clients', value: clients.length, sub: 'active accounts' },
              { label: 'Monthly revenue', value: `AED ${totalMRR.toLocaleString()}`, sub: 'across all plans', color: '#27ae60' },
              { label: 'Posting included', value: clients.filter(c => c.posting_included).length, sub: 'we post for them' },
              { label: 'Detailed portal', value: clients.filter(c => c.portal_mode === 'detailed').length, sub: 'advanced view' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: s.color || '#111', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[{ id: 'all', label: 'All clients' }, { id: 'posting', label: 'Posting included' }, { id: 'detailed', label: 'Detailed portal' }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid #eee', background: filter === f.id ? '#111' : '#fff', color: filter === f.id ? '#fff' : '#888' }}>
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(client => (
              <div key={client.id} onClick={() => setSelected(client)}
                style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#111', flexShrink: 0 }}>
                  {client.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {client.plan} · {client.videos_per_month} videos/mo
                    {client.posting_included && <span style={{ marginLeft: 8, color: '#27ae60' }}>· Posting included</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#27ae60' }}>Active</span>
                  <span style={{ fontSize: 11, color: '#888' }}>{client.portal_mode} portal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client detail */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 400, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#111' }}>
                {selected.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{selected.instagram_handle}</div>
              </div>
            </div>
            {[
              ['Plan', selected.plan],
              ['Videos per month', selected.videos_per_month],
              ['Posting included', selected.posting_included ? 'Yes' : 'No'],
              ['Portal mode', selected.portal_mode],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <span style={{ color: '#888' }}>{l}</span>
                <span style={{ color: '#111', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Portal mode</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['simple', 'detailed'].map(mode => (
                  <button key={mode} onClick={() => updatePortalMode(selected.id, mode)} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: selected.portal_mode === mode ? '#111' : '#fff', color: selected.portal_mode === mode ? '#fff' : '#888', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <a href={`/client/${selected.id}`} style={{ display: 'block', marginTop: 14, padding: '9px', textAlign: 'center', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#111', textDecoration: 'none' }}>
              View client portal →
            </a>
            <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 8, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Add client modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16 }}>Add client</div>
            {[
              { label: 'Full name', key: 'name', type: 'text', placeholder: 'e.g. Hamdan Al Mansoori' },
              { label: 'Instagram handle', key: 'instagram_handle', type: 'text', placeholder: '@handle' },
              { label: 'Videos per month', key: 'videos_per_month', type: 'number', placeholder: '8' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{f.label}</div>
                <input type={f.type} value={(newClient as any)[f.key]} onChange={e => setNewClient({ ...newClient, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Plan</div>
              <select value={newClient.plan} onChange={e => setNewClient({ ...newClient, plan: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                <option>IDS™ Foundation</option>
                <option>IDS™ Sustain</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Portal mode</div>
              <select value={newClient.portal_mode} onChange={e => setNewClient({ ...newClient, portal_mode: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #eee', borderRadius: 8, fontSize: 13, color: '#111' }}>
                <option value="simple">Simple</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="posting" checked={newClient.posting_included} onChange={e => setNewClient({ ...newClient, posting_included: e.target.checked })} />
              <label htmlFor="posting" style={{ fontSize: 13, color: '#111', cursor: 'pointer' }}>Posting included</label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: 8, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={addClient} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Add client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}