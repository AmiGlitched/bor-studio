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
      
      // Look up the client's company name from the database
      const { data: profile } = await supabase
        .from('users')
        .select('clients(name)')
        .eq('auth_id', user.id)
        .single()
        
      if (profile?.clients?.name) {
        setClientName(profile.clients.name)
      }
    }
    fetchClientName()
  }, [])

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'system-ui, sans-serif' }}>
        Checking access...
      </div>
    )
  }

  // The old horizontal tabs are now sidebar links!
  const navItems = [
    { id: 'videos', label: 'My Videos', href: '/client' },
    { id: 'schedule', label: 'Posting Schedule', href: '/client/schedule' },
    { id: 'shoots', label: 'Shoots', href: '/client/shoots' },
    { id: 'ideas', label: 'Send Ideas', href: '/client/ideas' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f5f5f5' }}>
      
      {/* Universal Sidebar */}
      <div style={{ width: 200, background: '#fff', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#111', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00', fontWeight: 700, fontSize: 13 }}>B</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{clientName}</div>
            <div style={{ fontSize: 10, color: '#999' }}>BOR Studio</div>
          </div>
        </div>
        
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/client' && pathname.startsWith(item.href))
            return (
              <Link key={item.id} href={item.href}
                style={{
                  display: 'block', padding: '8px 20px', fontSize: 13,
                  color: isActive ? '#111' : '#888',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  borderLeft: isActive ? '2px solid #111' : '2px solid transparent',
                  background: isActive ? '#f5f5f5' : 'transparent',
                }}>
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <SidebarProfile />
      </div>

      {/* Main Page Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      
    </div>
  )
}