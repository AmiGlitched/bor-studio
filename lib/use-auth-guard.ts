'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'

export function useAuthGuard(requiredRole: string) {
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function verify() {
      const { data } = await supabase.auth.getSession()
      
      // 1. Not logged in at all? Kick to login screen.
      if (!data.session?.user) {
        router.replace('/login')
        return
      }

      // 2. Fetch their actual role from your auth file
      const profile = await getUserProfile()
      
      if (!profile) {
        router.replace('/login')
        return
      }

      // 3. GOD MODE: If the user is an admin, bypass the locks and let them see everything.
      if (profile.role === 'admin') {
        setChecking(false)
        return
      }

      // 4. STRICT MODE: If they aren't an admin, their role MUST match the page they are trying to view.
      if (profile.role !== requiredRole) {
        // Sends them to login with the custom warning message we built earlier
        router.replace('/login?error=unauthorized')
        return
      }

      // 5. Passed all checks, reveal the page!
      setChecking(false)
    }

    verify()
  }, [requiredRole, router])

  return { checking }
}