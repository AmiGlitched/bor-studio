'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/auth'

export default function ClientRootPage() {
  const router = useRouter()

  useEffect(() => {
    async function goToClientPage() {
      const profile = await getUserProfile()
      if (profile?.client_id) {
        router.replace(`/client/${profile.client_id}`)
        return
      }
      router.replace('/login?error=unauthorized')
    }

    goToClientPage()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'system-ui, sans-serif' }}>
      Opening your portal...
    </div>
  )
}
