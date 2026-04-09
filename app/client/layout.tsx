'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useAuthGuard } from '@/lib/use-auth-guard'
import SidebarProfile from '@/components/SidebarProfile'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { checking } = useAuthGuard('client')
  const pathname = usePathname()
  const [clientName, setClientName] = useState('Client Portal')

  useEffect(() => {
    async function fetchClientName() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('users')
        .select('client_id')
        .eq('auth_id', user.id)
        .single()
        
      if (profile?.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', profile.client_id)
          .single()

        if (clientData?.name) {
          setClientName(clientData.name)
        }
      }
    }
    fetchClientName()
  }, [])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f14', color: '#a0a0b0', fontFamily: 'system-ui, sans-serif' }}>
        <div className="loader">Initializing Client Portal...</div>
      </div>
    )
  }

  const navItems = [
    { id: 'videos', label: 'My Videos', icon: '🎬', href: '/client' },
    { id: 'schedule', label: 'Posting Schedule', icon: '📅', href: '/client/schedule' },
    { id: 'shoots', label: 'Shoots', icon: '📸', href: '/client/shoots' },
    { id: 'ideas', label: 'Send Ideas', icon: '💡', href: '/client/ideas' },
  ]

  return (
    <>
      <style>{`
        :root {
          --bg-main: #0f0f14;
          --bg-sidebar: #13131a;
          --bg-card: #1a1a22;
          --bg-hover: #22222c;
          --border-subtle: #2a2a35;
          --text-primary: #ffffff;
          --text-secondary: #a0a0b0;
          --primary-gradient: linear-gradient(135deg, #7B61FF, #E84393, #4A90E2);
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg-main); color: var(--text-primary); }
        .nav-item {
          transition: all 0.2s ease;
          position: relative;
        }
        .nav-item:hover {
          background: var(--bg-hover) !important;
          color: #fff !important;
        }
        .nav-item.active {
          background: linear-gradient(90deg, rgba(123, 97, 255, 0.1) 0%, transparent 100%) !important;
          color: #fff !important;
        }
        .nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
          background: var(--primary-gradient);
          border-radius: 0 4px 4px 0;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: 'var(--bg-main)' }}>
        
        {/* Universal Sidebar */}
        <div style={{ width: 220, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 10 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-gradient)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)' }}>
              R
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{clientName}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wahid Route</div>
            </div>
          </div>
          
          <nav style={{ padding: '16px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/client' && pathname.startsWith(item.href))
              return (
                <Link key={item.id} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', fontSize: 13,
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    background: 'transparent'
                  }}>
                  <span style={{ fontSize: 14, opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <SidebarProfile />
          </div>
        </div>

        {/* Main Page Content */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {children}
        </div>
        
      </div>
    </>
  )
}