'use client'

import { supabase } from '@/lib/supabase'

export type AppRole = 'admin' | 'editor' | 'cameraman' | 'client'

export type UserProfile = {
  id?: string
  role?: AppRole
  client_id?: string
}

export async function getUserProfile() {
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData.session

  if (!session?.user) return null

  const userId = session.user.id
  const email = session.user.email

  const byAuth = await supabase
    .from('users')
    .select('id, role, client_id')
    .eq('auth_id', userId)
    .maybeSingle()

  if (byAuth.data) return byAuth.data as UserProfile

  if (!email) return null

  const byEmail = await supabase
    .from('users')
    .select('id, role, client_id')
    .eq('email', email)
    .maybeSingle()

  if (byEmail.data) return byEmail.data as UserProfile

  return null
}

export function routeForRole(role?: AppRole, clientId?: string) {
  if (role === 'admin') return '/admin'
  if (role === 'editor') return '/editor'
  if (role === 'cameraman') return '/cameraman'
  if (role === 'client') return clientId ? `/client/${clientId}` : '/client'
  return '/'
}
