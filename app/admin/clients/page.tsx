'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Mock data for the UI flair shown in your screenshot
// (We map this over your actual database clients)
const PLAN_MOCKS = ['Foundation', 'IDS™ Sustain', 'Foundation Plus']
const VIDS_MOCKS = [6, 8, 10, 12, 16]

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: true })
    
    // Attaching some mock data so your UI looks exactly like your screenshot
    if (data) {
      const enriched = data.map((c, i) => ({
        ...c,
        plan: PLAN_MOCKS[i % PLAN_MOCKS.length],
        vids: VIDS_MOCKS[i % VIDS_MOCKS.length],
        hasPosting: i % 3 === 0, // 1 in 3 has posting
        isDetailed: i % 4 === 0  // 1 in 4 has detailed portal
      }))
      setClients(enriched)
    }
    setLoading(false)
  }

  const filteredClients = clients.filter(c => {
    if (activeTab === 'posting') return c.hasPosting
    if (activeTab === 'detailed') return c.isDetailed
    return true
  })

  return (
    <>
      <style>{`
        /* CENTERED WRAPPER SYSTEM */
        .header-wrapper { width: 100%; border-bottom: 1px solid #1f1f2e; position: sticky; top: 0; z-index: 50; background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(12px); }
        .page-header { height: 76px; display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; box-sizing: border-box; }
        .page-wrapper { width: 100%; display: flex; justify-content: center; padding: 40px 0; }
        .page-container { max-width: 1200px; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        .btn-ghost { background: transparent; color: #f4f4f5; border: 1px solid #1f1f2e; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-ghost:hover { background: #1f1f2e; border-color: #3f3f46; }

        /* METRIC CARDS */
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .metric-glow { position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; filter: blur(40px); opacity: 0.15; }
        .metric-title { font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px; }
        .metric-value { font-size: 36px; font-weight: 600; color: #f4f4f5; line-height: 1; letter-spacing: -0.02em; margin-bottom: 8px; }
        .metric-sub { font-size: 12px; font-weight: 500; }

        /* TABS */
        .tabs { display: flex; gap: 12px; margin-bottom: 32px; }
        .tab { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
        .tab.active { background: #f4f4f5; color: #09090b; }
        .tab.inactive { background: transparent; color: #a1a1aa; }
        .tab.inactive:hover { color: #f4f4f5; background: rgba(255,255,255,0.05); }

        /* CLIENT CARDS (THE FIX) */
        .client-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .client-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 24px; display: flex; align-items: center; justify-content: space-between; transition: 0.2s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.1); cursor: pointer; }
        .client-card:hover { border-color: #3f3f46; background: rgba(255,255,255,0.02); transform: translateY(-2px); }
        
        .client-avatar { width: 44px; height: 44px; background: #1f1f2e; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #f4f4f5; flex-shrink: 0; }
        .tag-posting { background: rgba(52, 211, 153, 0.1); color: #34d399; font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .tag-simple { color: #a1a1aa; font-size: 12px; font-weight: 500; }
      `}</style>

      <div className="header-wrapper">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Client Roster</h1>
          <button className="btn-ghost">+ Add Client</button>
        </div>
      </div>

      <div className="page-wrapper">
        <div className="page-container">
          
          {/* Top Metrics */}
          <div className="metric-grid">
            <div className="metric-card">
              <div className="metric-glow" style={{ background: '#60a5fa' }}></div>
              <div className="metric-title">Total Clients</div>
              <div className="metric-value">{clients.length}</div>
              <div className="metric-sub" style={{ color: '#60a5fa' }}>Active accounts</div>
            </div>
            <div className="metric-card">
              <div className="metric-glow" style={{ background: '#34d399' }}></div>
              <div className="metric-title">Monthly Revenue</div>
              <div className="metric-value">AED 0</div>
              <div className="metric-sub" style={{ color: '#34d399' }}>Across all plans</div>
            </div>
            <div className="metric-card">
              <div className="metric-glow" style={{ background: '#f472b6' }}></div>
              <div className="metric-title">Posting Included</div>
              <div className="metric-value">{clients.filter(c => c.hasPosting).length}</div>
              <div className="metric-sub" style={{ color: '#f472b6' }}>We post for them</div>
            </div>
            <div className="metric-card">
              <div className="metric-glow" style={{ background: '#a78bfa' }}></div>
              <div className="metric-title">Detailed Portal</div>
              <div className="metric-value">{clients.filter(c => c.isDetailed).length}</div>
              <div className="metric-sub" style={{ color: '#a78bfa' }}>Advanced view</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="tabs">
            <button onClick={() => setActiveTab('all')} className={`tab ${activeTab === 'all' ? 'active' : 'inactive'}`}>All clients</button>
            <button onClick={() => setActiveTab('posting')} className={`tab ${activeTab === 'posting' ? 'active' : 'inactive'}`}>Posting included</button>
            <button onClick={() => setActiveTab('detailed')} className={`tab ${activeTab === 'detailed' ? 'active' : 'inactive'}`}>Detailed portal</button>
          </div>

          {loading ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: 40, fontSize: 14 }}>Loading clients...</div>
          ) : (
            <div className="client-grid">
              {filteredClients.map(client => (
                <div key={client.id} className="client-card">
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="client-avatar">{client.name[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f4f4f5', marginBottom: 4 }}>{client.name}</div>
                      <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                        {client.plan} · <span style={{ color: '#60a5fa' }}>{client.vids} vids/mo</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    {client.hasPosting && <div className="tag-posting">Posting</div>}
                    <div className="tag-simple">{client.isDetailed ? 'detailed' : 'simple'}</div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}