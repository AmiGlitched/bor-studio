'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SidebarProfile() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>('User')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        // FIXED: Using getSession() instead of getUser() prevents the "Lock Stolen" race condition
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        const user = session?.user

        if (user) {
          const { data } = await supabase.from('users').select('name').eq('auth_id', user.id).maybeSingle()
          setDisplayName(data?.name || user.email?.split('@')[0] || 'User')
        }
      } catch (err) {
        console.warn("Sidebar auth check safely bypassed race condition", err)
      }
    }
    fetchUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ position: 'relative', padding: 20, borderTop: '1px solid #1a1a22' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7B61FF 0%, #E84393 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
            {displayName[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100, textAlign: 'left' }}>
            {displayName}
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#666' }}>{isOpen ? '▼' : '▲'}</span>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', bottom: '100%', left: 16, right: 16, marginBottom: 8, background: '#16161e', border: '1px solid #222', borderRadius: 12, padding: 4, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#E84393', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Logout Account
          </button>
        </div>
      )}
    </div>
  )
}