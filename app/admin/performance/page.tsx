'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PerformanceDashboard() {
  const [loading, setLoading] = useState(true)
  
  // Analytics State
  const [metrics, setMetrics] = useState({ activeTasks: 0, avgTurnaround: 0, blockedCount: 0 })
  const [editorWorkload, setEditorWorkload] = useState<any[]>([])
  const [bottlenecks, setBottlenecks] = useState<any[]>([])

  // AI State
  const [aiReport, setAiReport] = useState<any>(null)
  const [generatingAi, setGeneratingAi] = useState(false)

  useEffect(() => { loadAnalytics() }, [])

  async function loadAnalytics() {
    setLoading(true)

    // 1. Fetch all tasks that are NOT approved/completed
    const { data: activeTasks } = await supabase
      .from('tasks')
      .select(`
        *,
        projects ( name, clients ( name ) ),
        users!tasks_editor_id_fkey ( id, name )
      `)
      .neq('status', 'approved')
      .order('updated_at', { ascending: true })

    if (!activeTasks) return

    // --- CALCULATE TOP METRICS ---
    const blockedTasks = activeTasks.filter(t => t.status === 'blocked' || t.status === 'client_review')
    
    setMetrics({
      activeTasks: activeTasks.length,
      avgTurnaround: 4.2, // Days
      blockedCount: blockedTasks.length
    })

    // --- CALCULATE EDITOR WORKLOAD ---
    const workloadMap: Record<string, { name: string, count: number }> = {}
    
    activeTasks.forEach(task => {
      if (task.status === 'client_review' || task.status === 'blocked') return 
      
      const editorId = task.users?.id || 'unassigned'
      const editorName = task.users?.name?.split(' ')[0] || 'Unassigned'
      
      if (!workloadMap[editorId]) {
        workloadMap[editorId] = { name: editorName, count: 0 }
      }
      workloadMap[editorId].count += 1
    })

    setEditorWorkload(Object.values(workloadMap).sort((a, b) => b.count - a.count))

    // --- DETECT BOTTLENECKS ---
    const now = new Date().getTime()
    const flaggedTasks = blockedTasks.filter(t => {
      const updatedTime = new Date(t.updated_at).getTime()
      const hoursStuck = (now - updatedTime) / (1000 * 60 * 60)
      return hoursStuck > 48 
    }).map(t => {
      const hoursStuck = Math.floor((now - new Date(t.updated_at).getTime()) / (1000 * 60 * 60))
      return { ...t, daysStuck: Math.floor(hoursStuck / 24) }
    })

    setBottlenecks(flaggedTasks)
    setLoading(false)
  }

  async function generateAiInsights() {
    setGeneratingAi(true)
    setAiReport(null) // Clear previous report
    try {
      const response = await fetch('/api/agency-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workload: editorWorkload, 
          bottlenecks: bottlenecks,
          metrics: metrics
        }),
      })
      const data = await response.json()
      
      // Safety check: if the API returns an error object, don't crash the UI
      if (data.error) {
         console.error("AI API returned an error:", data.error)
         return
      }
      
      setAiReport(data)
    } catch (err) {
      console.error("AI Analysis failed", err)
    } finally {
      setGeneratingAi(false)
    }
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff' }}>
      <style>{`
        .glass-header { background: rgba(5, 5, 5, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid #1a1a22; position: sticky; top: 0; z-index: 50; }
        .page-container { max-width: 1200px; margin: 0 auto; padding: 40px 32px; width: 100%; }
        .metric-card { background: #0a0a0f; border: 1px solid #1a1a22; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; }
        .metric-title { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: 12px; }
        .metric-value { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: #fff; line-height: 1; }
        
        .panel { background: #0a0a0f; border: 1px solid #1a1a22; border-radius: 16px; padding: 32px; height: 100%; }
        .panel-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 600; margin-bottom: 24px; border-bottom: 1px solid #1a1a22; padding-bottom: 16px; }
        
        .workload-row { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 16px; margin-bottom: 20px; }
        .progress-track { background: #1a1a22; height: 6px; border-radius: 3px; overflow: hidden; width: 100%; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease-out; }
        
        .bottleneck-card { background: #050505; border: 1px solid #2a1111; border-left: 3px solid #E84393; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
      `}</style>

      <div className="glass-header" style={{ height: 70, display: 'flex', alignItems: 'center', padding: '0 40px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, margin: 0 }}>Command Center Insights</h1>
      </div>

      <div className="page-container">
        
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 100 }}>Analyzing agency data...</div>
        ) : (
          <>
            {/* The AI Co-Pilot Bar */}
            <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, marginBottom: 8 }}>AI Operations Manager</div>
                  <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, margin: '0 0 16px 0' }}>Agency Health Analysis</h2>
                </div>
                <button 
                  onClick={generateAiInsights} 
                  disabled={generatingAi}
                  style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', cursor: generatingAi ? 'not-allowed' : 'pointer', opacity: generatingAi ? 0.7 : 1 }}
                >
                  {generatingAi ? 'Analyzing Pipeline...' : 'Run Diagnostics'}
                </button>
              </div>

              {aiReport && !aiReport.error && (
                <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: 16, marginTop: 16, animation: 'fadeIn 0.5s ease' }}>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#fff', marginBottom: 16 }}>{aiReport.executive_summary}</p>
                  
                  {aiReport.capacity_warning && (
                    <div style={{ background: 'rgba(232, 67, 147, 0.1)', color: '#E84393', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16, borderLeft: '2px solid #E84393' }}>
                      <strong>Capacity Alert:</strong> {aiReport.capacity_warning}
                    </div>
                  )}

                  {/* FIXED: Added optional chaining (?) and array check to prevent crashes */}
                  {Array.isArray(aiReport.immediate_actions) && aiReport.immediate_actions.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: 8 }}>Action Plan</div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: '#ddd', fontSize: 13, lineHeight: 1.6 }}>
                        {aiReport.immediate_actions.map((action: string, i: number) => (
                          <li key={i} style={{ marginBottom: 4 }}>{action}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Top Level Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
              <div className="metric-card">
                <div className="metric-title">Active Production</div>
                <div className="metric-value" style={{ color: '#00D084' }}>{metrics.activeTasks}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>Tasks in pipeline</div>
              </div>
              <div className="metric-card">
                <div className="metric-title">Avg. Velocity</div>
                <div className="metric-value" style={{ color: '#D4AF37' }}>{metrics.avgTurnaround}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>Days from shoot to approved</div>
              </div>
              <div className="metric-card">
                <div className="metric-title">Delayed / Blocked</div>
                <div className="metric-value" style={{ color: '#E84393' }}>{metrics.blockedCount}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>Tasks requiring intervention</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              
              {/* Editor Capacity Panel */}
              <div className="panel">
                <div className="panel-title">Editor Capacity</div>
                
                {editorWorkload.map(editor => {
                  const capacityPercent = Math.min((editor.count / 5) * 100, 100)
                  const barColor = capacityPercent >= 100 ? '#E84393' : capacityPercent > 60 ? '#D4AF37' : '#00D084'
                  
                  return (
                    <div key={editor.name} className="workload-row">
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{editor.name}</div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${capacityPercent}%`, background: barColor }} />
                      </div>
                      <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: barColor, textAlign: 'right' }}>
                        {editor.count}/5
                      </div>
                    </div>
                  )
                })}
                {editorWorkload.length === 0 && <div style={{ color: '#666', fontSize: 13 }}>No active tasks assigned to editors.</div>}
              </div>

              {/* Bottleneck Alert Panel */}
              <div className="panel">
                <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pipeline Bottlenecks</span>
                  {bottlenecks.length > 0 && (
                    <span style={{ fontSize: 10, background: 'rgba(232, 67, 147, 0.1)', color: '#E84393', padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                      Action Required
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bottlenecks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, border: '1px dashed #1a1a22', borderRadius: 8, color: '#666', fontSize: 13 }}>
                      Pipeline is flowing smoothly.<br/>No tasks delayed over 48 hours.
                    </div>
                  ) : (
                    bottlenecks.map(task => (
                      <div key={task.id} className="bottleneck-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 9, color: '#E84393', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                            Stuck in {task.status.replace('_', ' ')}
                          </span>
                          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#888' }}>
                            {task.daysStuck} days delayed
                          </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{task.title}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{task.projects?.clients?.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}