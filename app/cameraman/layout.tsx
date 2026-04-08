'use client'

import { ReactNode } from 'react'
import { useAuthGuard } from '@/lib/use-auth-guard'

export default function CameramanLayout({ children }: { children: ReactNode }) {
  const { checking } = useAuthGuard('cameraman')

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'system-ui, sans-serif' }}>
        Checking access...
      </div>
    )
  }

  return <>{children}</>
}
