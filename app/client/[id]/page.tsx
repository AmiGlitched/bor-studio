'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'

const statusConfig: Record<string, { label: string, bg: string, text: string }> = {
  client_review: { label: 'Ready for review', bg: '#f5f3ff', text: '#8e44ad' },
  editing: { label: 'Being edited', bg: '#eff6ff', text: '#2980b9' },
  internal_review: { label: 'In review', bg: '#eff6ff', text: '#2980b9' },
  approved: { label: 'Approved', bg: '#f0fdf4', text: '#27ae60' },
  revision: { label: 'Revision requested', bg: '#fff8f0', text: '#e67e22' },
  shoot_done: { label: 'Shoot done', bg: '#f5f5f5', text: '#888' },
}

const ideaStatusConfig: Record<string, { label: string, color: string }> = {
  received: { label: 'Received — being reviewed', color: '#888' },
  in_production: { label: 'Approved — in production', color: '#2980b9' },
  done: { label: 'Done', color: '#27ae60' },
}

const videoTypes = ['All', 'reel', 'carousel', 'thumbnail', 'youtube']
const months = ['All months', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function ClientPortal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [client, setClient] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [ideas, setIdeas] = useState<any[]>([])
  const [shoots, setShoots] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('videos')
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [revisionText, setRevisionText] = useState('')
  const [showRevisionBox, setShowRevisionBox] = useState(false)
  const [newIdea, setNewIdea] = useState('')
  const [ideaType, setIdeaType] = useState('text')
  const [showShootRequest, setShowShootRequest] = useState(false)
  const [shootRequest, setShootRequest] = useState({ date: '', time: '', note: '' })
  const [shootRequestSent, setShootRequestSent] = useState(false)
  const [filterType, setFilterType] = useState('All')
  const [filterMonth, setFilterMonth] = useState('All months')

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', id).single()
    const { data: videoData } = await supabase.from('videos').select('*').eq('client_id', id).order('created_at', { ascending: false })
    const { data: ideaData } = await supabase.from('ideas').select('*').eq('client_id', id).order('created_at', { ascending: false })
    const { data: shootData } = await supabase.from('shoots').select('*').eq('client_id', id).order('date')
    const { data: scheduleData } = await supabase.from('posting_schedule').select('*, videos(title)').eq('client_id', id).order('scheduled_at')
    if (clientData) setClient(clientData)
    if (videoData) setVideos(videoData)
    if (ideaData) setIdeas(ideaData)
    if (shootData) setShoots(shootData)
    if (scheduleData) setSchedule(scheduleData)
    setLoading(false)
  }

  async function approveVideo(videoId: string) {
    await supabase.from('videos').update({ status: 'approved' }).eq('id', videoId)
    setVideos(videos.map(v => v.id === videoId ? { ...v, status: 'approved' } : v))
    setSelectedVideo(null)
  }

  async function submitRevision(videoId: string) {
    if (!revisionText.trim()) return
    await supabase.from('revisions').insert({ video_id: videoId, comment: revisionText, resolved: false })
    await supabase.from('videos').update({ status: 'revision' }).eq('id', videoId)
    setVideos(videos.map(v => v.id === videoId ? { ...v, status: 'revision' } : v))
    setRevisionText('')
    setShowRevisionBox(false)
    setSelectedVideo(null)
  }

  async function submitIdea() {
    if (!newIdea.trim()) return
    await supabase.from('ideas').insert({ client_id: id, type: ideaType, content: newIdea, status: 'received' })
    setNewIdea('')
    await loadData()
  }

  async function sendShootRequest() {
    if (!shootRequest.date) return
    await supabase.from('shoots').insert({
      client_id: id, date: shootRequest.date, time: shootRequest.time,
      notes: shootRequest.note, status: 'pending', raw_uploaded: false,
    })
    setShootRequestSent(true)
    setShowShootRequest(false)
    await loadData()
  }

  const filteredVideos = videos.filter(v => {
    if (filterType !== 'All' && v.type !== filterType) return false
    return true
  })

  const needsReview = videos.filter(v => v.status === 'client_review').length
  const inProgress = videos.filter(v => ['editing', 'internal_review', 'shoot_done'].includes(v.status)).length
  const done = videos.filter(v => v.status === 'approved').length
  const isDetailed = client?.portal_mode === 'detailed'

  const tabs = [
    { id: 'videos', label: 'My videos' },
    { id: 'schedule', label: 'Posting schedule' },
    { id: 'shoots', label: 'Shoots' },
    { id: 'ideas', label: 'Send ideas' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', color: '#bbb', fontSize: 14 }}>
      Loading...
    </div>
  )

  if (!client) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', color: '#bbb', fontSize: 14 }}>
      Client not found
    </div>
  )

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00', fontWeight: 700, fontSize: 14 }}>B</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{client.name}</div>
              <div style={{ fontSize: 11, color: '#999' }}>{client.plan} · {isDetailed ? 'Detailed view' : 'Simple view'}</div>
            </div>
          </div>
          {needsReview > 0 && (
            <div style={{ fontSize: 12, padding: '6px 14px', background: '#f5f3ff', color: '#8e44ad', borderRadius: 20, fontWeight: 500 }}>
              {needsReview} video{needsReview > 1 ? 's' : ''} ready for your review
            </div>
          )}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#111' }}>
            {client.name[0]}
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab.id ? '#111' : '#999', fontWeight: activeTab === tab.id ? 600 : 400, borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent', marginBottom: -1 }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>

        {/* VIDEOS */}
        {activeTab === 'videos' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Package', value: client.videos_per_month, sub: 'videos this month' },
                { label: 'Done', value: done, sub: 'approved', color: '#27ae60' },
                { label: 'In progress', value: inProgress, sub: 'being worked on' },
                { label: 'Needs your review', value: needsReview, sub: 'waiting for you', color: needsReview > 0 ? '#8e44ad' : '#111' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: s.color || '#111', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {isDetailed && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#999' }}>Filter by:</span>
                {videoTypes.map(t => (
                  <button key={t} onClick={() => setFilterType(t)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid #eee', background: filterType === t ? '#111' : '#fff', color: filterType === t ? '#fff' : '#888' }}>
                    {t === 'All' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
                <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid #eee', background: '#fff', color: '#888', cursor: 'pointer' }}>
                  {months.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            )}

            {filteredVideos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13 }}>No videos yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredVideos.map(video => {
                  const sc = statusConfig[video.status] || statusConfig.editing
                  const isReady = video.status === 'client_review'
                  const isLocked = ['editing', 'internal_review', 'shoot_done'].includes(video.status)
                  return (
                    <div key={video.id} style={{ background: '#fff', border: isReady ? '1px solid #8e44ad' : '1px solid #eee', borderRadius: 14, padding: '14px 18px', cursor: isLocked ? 'default' : 'pointer' }}
                      onClick={() => !isLocked && setSelectedVideo(video)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 72, height: 50, borderRadius: 8, background: isLocked ? '#f5f5f5' : '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {!isLocked && <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #fff', marginLeft: 3 }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 3 }}>{video.title}</div>
                          <div style={{ fontSize: 11, color: '#bbb' }}>{video.type} {video.deadline && `· Due ${video.deadline}`}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, fontWeight: 500 }}>{sc.label}</span>
                          {isReady && (
                            <button onClick={e => { e.stopPropagation(); setSelectedVideo(video) }} style={{ fontSize: 12, padding: '5px 14px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>
              {client.posting_included ? "We handle posting for you. Here's what's going up and when." : 'Your approved videos and suggested posting times.'}
            </div>
            {schedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13 }}>No scheduled posts yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {schedule.map(post => (
                  <div key={post.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 2 }}>{post.videos?.title}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{post.platform} · {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : '—'}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: post.posted ? '#f0fdf4' : '#f5f5f5', color: post.posted ? '#27ae60' : '#888' }}>
                      {post.posted ? 'Posted' : 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHOOTS */}
        {activeTab === 'shoots' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#888' }}>Your upcoming shoots</div>
              <button onClick={() => setShowShootRequest(true)} style={{ fontSize: 12, padding: '7px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Request a shoot</button>
            </div>
            {shootRequestSent && (
              <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, color: '#27ae60', marginBottom: 16 }}>
                Shoot request sent — we'll confirm your slot shortly.
              </div>
            )}
            {shoots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#bbb', fontSize: 13 }}>No shoots scheduled yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shoots.map(shoot => (
                  <div key={shoot.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 4 }}>{shoot.date} · {shoot.time}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>📍 {shoot.location || 'Location TBC'}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: shoot.status === 'confirmed' ? '#f0fdf4' : '#fff8f0', color: shoot.status === 'confirmed' ? '#27ae60' : '#e67e22' }}>
                        {shoot.status === 'confirmed' ? 'Confirmed' : 'Pending confirmation'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IDEAS */}
        {activeTab === 'ideas' && (
          <div>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 12 }}>Share a content idea</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[{ id: 'text', label: 'Message' }, { id: 'link', label: 'Link' }].map(t => (
                  <button key={t.id} onClick={() => setIdeaType(t.id)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid #eee', background: ideaType === t.id ? '#111' : '#fff', color: ideaType === t.id ? '#fff' : '#888' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newIdea} onChange={e => setNewIdea(e.target.value)}
                  placeholder={ideaType === 'link' ? 'Paste a link to a reference video...' : 'Describe your content idea...'}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #eee', borderRadius: 10, fontSize: 13, color: '#111', outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && submitIdea()} />
                <button onClick={submitIdea} style={{ padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>Send</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ideas.map((idea, i) => {
                const is = ideaStatusConfig[idea.status] || ideaStatusConfig.received
                return (
                  <div key={idea.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#888', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#111', marginBottom: 3 }}>{idea.content}</div>
                      <div style={{ fontSize: 11, color: is.color }}>{is.label}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f5f5f5', color: '#888', textTransform: 'capitalize' }}>{idea.type}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Video review modal */}
      {selectedVideo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{selectedVideo.type}</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#111', marginBottom: 16 }}>{selectedVideo.title}</div>
            {selectedVideo.video_url ? (
              <video src={selectedVideo.video_url} controls style={{ width: '100%', borderRadius: 12, marginBottom: 20, background: '#111' }} />
            ) : (
              <div style={{ width: '100%', height: 200, background: '#111', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderLeft: '28px solid #fff', marginLeft: 6 }} />
              </div>
            )}
            {!showRevisionBox ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowRevisionBox(true)} style={{ flex: 1, padding: '10px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Request changes</button>
                <button onClick={() => approveVideo(selectedVideo.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 10, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Approve</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>What needs to change?</div>
                <textarea value={revisionText} onChange={e => setRevisionText(e.target.value)}
                  placeholder="e.g. Make the intro shorter, change the music..."
                  style={{ width: '100%', height: 90, padding: '10px', border: '1px solid #eee', borderRadius: 10, fontSize: 13, color: '#111', outline: 'none', resize: 'none', fontFamily: 'system-ui', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowRevisionBox(false)} style={{ flex: 1, padding: '9px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => submitRevision(selectedVideo.id)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 10, background: '#e67e22', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Send revision</button>
                </div>
              </div>
            )}
            <button onClick={() => { setSelectedVideo(null); setShowRevisionBox(false); setRevisionText('') }}
              style={{ width: '100%', marginTop: 10, padding: '8px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#bbb', fontSize: 13, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Shoot request modal */}
      {showShootRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 380 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>Request a shoot</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Let us know when works for you.</div>
            {[{ label: 'Preferred date', key: 'date', type: 'date', placeholder: '' }, { label: 'Preferred time', key: 'time', type: 'text', placeholder: 'e.g. 10:00 AM – 12:00 PM' }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>{f.label}</div>
                <input type={f.type} value={(shootRequest as any)[f.key]} onChange={e => setShootRequest({ ...shootRequest, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #eee', borderRadius: 10, fontSize: 13, color: '#111', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 5 }}>What do you want to shoot?</div>
              <textarea value={shootRequest.note} onChange={e => setShootRequest({ ...shootRequest, note: e.target.value })}
                placeholder="e.g. 2-3 videos inside the model unit..."
                style={{ width: '100%', height: 80, padding: '9px 12px', border: '1px solid #eee', borderRadius: 10, fontSize: 13, color: '#111', outline: 'none', resize: 'none', fontFamily: 'system-ui' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowShootRequest(false)} style={{ flex: 1, padding: '9px', border: '1px solid #eee', borderRadius: 10, background: '#fff', color: '#888', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={sendShootRequest} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 10, background: '#111', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Send request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}