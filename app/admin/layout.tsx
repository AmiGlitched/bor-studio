'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import SidebarProfile from '@/components/SidebarProfile'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Removed all icons for a minimalist luxury feel
  const navItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Pipeline', href: '/admin/pipeline' },
    { name: 'Performance', href: '/admin/performance' },
    { name: 'Needs Review', href: '/admin/reviews' },
    { name: 'Calendar', href: '/admin/calendar' },
    { name: 'Editors', href: '/admin/editors' },
    { name: 'Clients', href: '/admin/clients' },
    { name: 'Strategy Board', href: '/admin/ideas' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050505', color: '#fff', margin: 0, padding: 0, overflow: 'hidden' }}>
      
      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a22', background: '#0a0a0f' }}>
        
        {/* Minimalist Logo Section */}
        <div style={{ padding: '40px 24px', textAlign: 'left' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, letterSpacing: '0.02em', color: '#fff' }}>
            Agency OS
          </div>
        </div>

        {/* Minimalist Navigation */}
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: 8, 
                  background: isActive ? '#111' : 'transparent', 
                  color: isActive ? '#fff' : '#666', 
                  border: isActive ? '1px solid #222' : '1px solid transparent',
                  textDecoration: 'none', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s' 
                }}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <SidebarProfile />
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', background: '#050505', position: 'relative' }}>
        {children}
      </main>
    </div>
  )
}