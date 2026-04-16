'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SidebarProfile from '@/components/SidebarProfile'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 🚨 ADD BOTH ADMIN EMAILS HERE 🚨
  const MASTER_ADMIN_EMAILS = ['admin1@gmail.com', 'admin2@gmail.com']

  useEffect(() => {
    async function enforceSecurity() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }

      const userEmail = session.user.email?.toLowerCase() || ''

      // --- MASTER KEY BYPASS (Now checks if email is in the list) ---
      if (MASTER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(userEmail)) {
        setUserRole('admin')
        setLoading(false)
        return
      }

      // Normal database check
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', session.user.id)
        .single()
      
      const role = data?.role || 'editor'
      setUserRole(role)

      if (role === 'editor') {
        window.location.href = '/editor' 
      } else {
        setLoading(false)
      }
    }

    enforceSecurity()
  }, [pathname, router])

  if (loading) {
    return <div style={{ background: '#050505', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontFamily: 'Playfair Display, serif' }}>Authenticating Workspace...</div>
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050505', color: '#fff', overflow: 'hidden' }}>
      <style>{`
        .sidebar-link { display: block; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; transition: 0.2s; margin-bottom: 8px; letter-spacing: 0.02em; }
        .sidebar-link.active { background: #1a1a22; color: #D4AF37; }
        .sidebar-link.inactive { color: #888; }
        .sidebar-link.inactive:hover { color: #fff; background: rgba(26, 26, 34, 0.5); }
      `}</style>

      <div style={{ width: '260px', borderRight: '1px solid #1a1a22', background: '#0a0a0f', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 100 }}>
        <div>
          <div style={{ padding: '32px 24px' }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700, margin: 0, color: '#fff' }}>Agency OS</h1>
          </div>

          <nav style={{ padding: '0 16px' }}>
            {/* Link points to /admin root dashboard */}
            <Link href="/admin" className={`sidebar-link ${pathname === '/admin' ? 'active' : 'inactive'}`}>Dashboard</Link>
            <Link href="/admin/pipeline" className={`sidebar-link ${pathname.includes('pipeline') ? 'active' : 'inactive'}`}>Pipeline</Link>
            <Link href="/admin/performance" className={`sidebar-link ${pathname.includes('performance') ? 'active' : 'inactive'}`}>Performance</Link>
            <Link href="/admin/reviews" className={`sidebar-link ${pathname.includes('reviews') ? 'active' : 'inactive'}`}>Needs Review</Link>
            <Link href="/admin/calendar" className={`sidebar-link ${pathname.includes('calendar') ? 'active' : 'inactive'}`}>Calendar</Link>
            <Link href="/admin/editors" className={`sidebar-link ${pathname.includes('editors') ? 'active' : 'inactive'}`}>Editors</Link>
            <Link href="/admin/clients" className={`sidebar-link ${pathname.includes('clients') ? 'active' : 'inactive'}`}>Clients</Link>
          </nav>
        </div>
        <div style={{ borderTop: '1px solid #1a1a22' }}>
          <SidebarProfile />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}