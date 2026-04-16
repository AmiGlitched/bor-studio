'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReviewsPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviews()
    const channel = supabase.channel('reviews-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
      loadReviews()
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select(`
        *,
        projects ( name, clients ( name ) ),
        users!tasks_editor_id_fkey ( name )
      `)
      .in('status', ['internal_review', 'client_review'])
      .order('updated_at', { ascending: false })
    
    if (data) setTasks(data)
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user) {
      const { data: userProfile } = await supabase.from('users').select('id').eq('auth_id', authData.user.id).single()
      if (userProfile) {
        await supabase.from('activity_logs').insert({
          task_id: id,
          user_id: userProfile.id,
          action_type: 'status_change',
          description: `Moved task to ${newStatus.replace('_', ' ')}`
        })
      }
    }
    loadReviews()
  }

  return (
    <>
      <style>{`
        /* CENTERED WRAPPER SYSTEM */
        .header-wrapper { width: 100%; border-bottom: 1px solid #1f1f2e; position: sticky; top: 0; z-index: 50; background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(12px); }
        .page-header { height: 76px; display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        .page-wrapper { width: 100%; display: flex; justify-content: center; padding: 40px 0; }
        .page-container { max-width: 1200px; width: 100%; padding: 0 40px; box-sizing: border-box; }
        
        /* SLATE COMPONENT THEME */
        .review-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }
        .review-card { background: #0e0e11; border: 1px solid #1f1f2e; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.15); transition: 0.2s ease; }
        .review-card:hover { border-color: #3f3f46; box-shadow: 0 8px 30px rgba(0,0,0,0.2); transform: translateY(-2px); }
        
        .video-container { width: 100%; background: #050505; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #1f1f2e; }
        .video-player { width: 100%; height: 100%; object-fit: contain; }
        
        .card-content { padding: 24px; display: flex; flex-direction: column; flex: 1; }
        .client-tag { font-size: 11px; font-weight: 600; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .task-title { font-size: 16px; font-weight: 600; color: #f4f4f5; margin: 0 0 16px 0; line-height: 1.4; letter-spacing: -0.01em; }
        
        .status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .status-internal { background: rgba(167, 139, 250, 0.1); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.2); }
        .status-client { background: rgba(244, 114, 182, 0.1); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.2); }
        
        .action-bar { display: flex; gap: 12px; margin-top: auto; padding-top: 20px; border-top: 1px solid #1f1f2e; }
        .btn-approve { flex: 1; background: #34d399; color: #064e3b; border: none; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-approve:hover { background: #10b981; }
        .btn-reject { flex: 1; background: transparent; color: #a1a1aa; border: 1px solid #1f1f2e; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-reject:hover { background: #1f1f2e; color: #f4f4f5; border-color: #3f3f46; }
      `}</style>

      <div className="header-wrapper">
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#f4f4f5', margin: 0, letterSpacing: '-0.02em' }}>Needs Review</h1>
        </div>
      </div>

      <div className="page-wrapper">
        <div className="page-container">
          
          {loading ? (
            <div style={{ color: '#71717a', textAlign: 'center', padding: 100, fontSize: 14 }}>Fetching review queue...</div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, background: '#0e0e11', border: '1px dashed #1f1f2e', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#f4f4f5', marginBottom: 8 }}>All caught up!</div>
              <div style={{ fontSize: 14, color: '#a1a1aa' }}>No videos are currently pending your review.</div>
            </div>
          ) : (
            <div className="review-grid">
              {tasks.map(task => (
                <div key={task.id} className="review-card">
                  
                  {/* Video Player Section */}
                  <div className="video-container">
                    {task.file_url ? (
                      <video src={task.file_url} controls className="video-player" />
                    ) : (
                      <div style={{ color: '#52525b', fontSize: 13 }}>No video file attached</div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="client-tag">{task.projects?.clients?.name || 'Internal'} - {task.projects?.name}</div>
                      <div className={`status-badge ${task.status === 'internal_review' ? 'status-internal' : 'status-client'}`}>
                        {task.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <h3 className="task-title">{task.title}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '6px', background: '#1f1f2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#f4f4f5', fontWeight: 600 }}>
                        {task.users?.name?.[0] || '?'}
                      </div>
                      <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>Edited by {task.users?.name?.split(' ')[0] || 'Unassigned'}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-bar">
                      <button onClick={() => updateStatus(task.id, 'in_progress')} className="btn-reject">
                        Request Changes
                      </button>
                      <button onClick={() => updateStatus(task.id, task.status === 'internal_review' ? 'client_review' : 'approved')} className="btn-approve">
                        {task.status === 'internal_review' ? 'Send to Client' : 'Approve Final'}
                      </button>
                    </div>
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