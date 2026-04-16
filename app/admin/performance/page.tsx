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
    setAiReport(null) 
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
    <>
      <style>{`
        /* CENTERED WRAPPER SYSTEM */
        .header-wrapper { width: 100%; border-bottom: 1px solid #1f1f2e; position: sticky; top: 0; z-index: 50; background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(12px); }
        .page-header { height: 76px; display: flex; align-items: center; max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        .page-wrapper { width: 100%; display: flex; justify-content: center; padding: 40px 0; }
        .page-container { max-width: 1200px; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        /* SLATE COMPONENT THEME */
        .metric-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 20px rgba(0,0,0,0.15); transition: border-color 0.2s ease; }
        .metric-card:hover { border-color: #3f3f46; }
        .metric-title { font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 12px; }
        .metric-value { font-size: 44px; font-weight: 600; color: #f4f4f5; line-height: 1; letter-spacing: -0.02em; }
        
        .panel { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; padding: 32px; height: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .panel-title { font-size: 18px; font-weight: 600; color: #f4f4f5; margin-bottom: 24px; border-bottom: 1px solid #1f1f2e; padding-bottom: 16px; letter-spacing: -0.01em; display: flex; justify-content: space-between; alignItems: center; }
        
        .workload-row { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 16px; margin-bottom: 24px; }
        .progress-track { background: #1f1f2e; height: 8px; border-radius: 4px; overflow: hidden; width: 100%; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
        
        .bottleneck-card { background: rgba(255,255,255,0.02); border: 1px solid #1f1f2e; border-left: 3px solid #f472b6; border-radius: 8px; padding: 18px; margin-bottom: 12px; transition: 0.2s ease; }
        .bottleneck-card:hover { border-color: #3f3f46; background: rgba(255,255,255,0.03); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="header-wrapper">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Command Center Insights</h1>
        </div>
      </div>

      <div className="page-wrapper">
        <div className="page-container">
          
          {loading ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: 100, fontSize: 14 }}>Analyzing agency data...</div>
          ) : (
            <>
              {/* The AI Co-Pilot Bar */}
              <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 12, padding: 32, marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 8 }}>AI Operations Manager</div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, color: '#f4f4f5', margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>Agency Health Analysis</h2>
                  </div>
                  <button 
                    onClick={generateAiInsights} 
                    disabled={generatingAi}
                    style={{ background: '#D4AF37', color: '#09090b', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', cursor: generatingAi ? 'not-allowed' : 'pointer', opacity: generatingAi ? 0.7 : 1, transition: '0.2s' }}
                  >
                    {generatingAi ? 'Analyzing Pipeline...' : 'Run Diagnostics'}
                  </button>
                </div>

                {aiReport && !aiReport.error && (
                  <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.1)', paddingTop: 20, marginTop: 20, animation: 'fadeIn 0.5s ease' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: '#e4e4e7', marginBottom: 20 }}>{aiReport.executive_summary}</p>
                    
                    {aiReport.capacity_warning && (
                      <div style={{ background: 'rgba(244, 114, 182, 0.05)', color: '#f472b6', padding: 16, borderRadius: 8, fontSize: 13, marginBottom: 20, borderLeft: '3px solid #f472b6' }}>
                        <strong style={{ fontWeight: 600 }}>Capacity Alert:</strong> {aiReport.capacity_warning}
                      </div>
                    )}

                    {Array.isArray(aiReport.immediate_actions) && aiReport.immediate_actions.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 12 }}>Action Plan</div>
                        <ul style={{ margin: 0, paddingLeft: 20, color: '#d4d4d8', fontSize: 14, lineHeight: 1.6 }}>
                          {aiReport.immediate_actions.map((action: string, i: number) => (
                            <li key={i} style={{ marginBottom: 8 }}>{action}</li>
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
                  <div className="metric-value" style={{ color: '#34d399' }}>{metrics.activeTasks}</div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 12, fontWeight: 500 }}>Tasks currently in pipeline</div>
                </div>
                <div className="metric-card">
                  <div className="metric-title">Avg. Velocity</div>
                  <div className="metric-value" style={{ color: '#D4AF37' }}>{metrics.avgTurnaround}</div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 12, fontWeight: 500 }}>Days from shoot to approved</div>
                </div>
                <div className="metric-card">
                  <div className="metric-title">Delayed / Blocked</div>
                  <div className="metric-value" style={{ color: '#f472b6' }}>{metrics.blockedCount}</div>
                  <div style={{ fontSize: 12, color: '#71717a', marginTop: 12, fontWeight: 500 }}>Tasks requiring intervention</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                
                {/* Editor Capacity Panel */}
                <div className="panel">
                  <div className="panel-title">Editor Capacity</div>
                  
                  {editorWorkload.map(editor => {
                    const capacityPercent = Math.min((editor.count / 5) * 100, 100)
                    const barColor = capacityPercent >= 100 ? '#f472b6' : capacityPercent > 60 ? '#D4AF37' : '#34d399'
                    
                    return (
                      <div key={editor.name} className="workload-row">
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#f4f4f5' }}>{editor.name}</div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${capacityPercent}%`, background: barColor }} />
                        </div>
                        <div style={{ fontSize: 12, color: barColor, textAlign: 'right', fontWeight: 600 }}>
                          {editor.count}/5
                        </div>
                      </div>
                    )
                  })}
                  {editorWorkload.length === 0 && <div style={{ color: '#71717a', fontSize: 13, paddingTop: 20 }}>No active tasks assigned to editors.</div>}
                </div>

                {/* Bottleneck Alert Panel */}
                <div className="panel">
                  <div className="panel-title">
                    <span>Pipeline Bottlenecks</span>
                    {bottlenecks.length > 0 && (
                      <span style={{ fontSize: 10, background: 'rgba(244, 114, 182, 0.1)', color: '#f472b6', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Action Required
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bottlenecks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, border: '1px dashed #1f1f2e', borderRadius: 8, color: '#71717a', fontSize: 13 }}>
                        Pipeline is flowing smoothly.<br/>No tasks delayed over 48 hours.
                      </div>
                    ) : (
                      bottlenecks.map(task => (
                        <div key={task.id} className="bottleneck-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 10, color: '#f472b6', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                              Stuck in {task.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>
                              {task.daysStuck} days delayed
                            </span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#f4f4f5', marginBottom: 6 }}>{task.title}</div>
                          <div style={{ fontSize: 12, color: '#71717a' }}>{task.projects?.clients?.name}</div>
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
    </>
  )
}