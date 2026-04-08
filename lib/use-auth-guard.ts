'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/lib/auth'
import { getUserProfile } from '@/lib/auth'

type GuardState = {
  checking: boolean
  role?: AppRole
}

export function useAuthGuard(requiredRole?: AppRole): GuardState {
  const [checking, setChecking] = useState(true)
  const [role, setRole] = useState<AppRole>()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session

      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`)
        if (!cancelled) setChecking(false)
        return
      }

      const profile = await getUserProfile()
      const currentRole = profile?.role

      if (currentRole) setRole(currentRole)

      if (requiredRole && currentRole !== requiredRole) {
        router.replace('/login?error=unauthorized')
        if (!cancelled) setChecking(false)
        return
      }

      if (!cancelled) setChecking(false)
    }

    checkAccess()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login')
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [pathname, requiredRole, router])

  return { checking, role }
}
