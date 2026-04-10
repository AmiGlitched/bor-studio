'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SidebarProfile from '@/components/SidebarProfile'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Pipeline', href: '/admin/pipeline', icon: '🚀' },
    { name: 'Performance', href: '/admin/performance', icon: '📈' },
    { name: 'Needs Review', href: '/admin/reviews', icon: '⭐' },
    { name: 'Calendar', href: '/admin/calendar', icon: '📅' },
    { name: 'Editors', href: '/admin/editors', icon: '✂️' },
    { name: 'Clients', href: '/admin/clients', icon: '👤' },
    { name: 'Ideas', href: '/admin/ideas', icon: '💡' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0f', color: '#fff', margin: 0, padding: 0, overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a22', background: '#0a0a0f' }}>
        
        {/* Logo Section */}
        <div style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7B61FF 0%, #E84393 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 18 }}>
              R
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px' }}>Agency OS</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 12, 
                  background: isActive ? '#1a1a22' : 'transparent', 
                  color: isActive ? '#fff' : '#666', 
                  textDecoration: 'none', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' 
                }}
              >
                <span style={{ marginRight: 12, fontSize: 18 }}>{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Profile Component */}
        <SidebarProfile />
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#0a0a0f', position: 'relative' }}>
        {children}
      </main>
    </div>
  )
}