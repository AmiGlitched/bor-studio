'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserProfile, routeForRole } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next')

  const warning = useMemo(() => {
    const currentError = searchParams.get('error')
    if (currentError === 'unauthorized') return 'This login does not have access to that portal.'
    return ''
  }, [searchParams])

  useEffect(() => {
    async function redirectIfSignedIn() {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) return

      const profile = await getUserProfile()
      const fallback = routeForRole(profile?.role, profile?.client_id)
      router.replace(nextPath || fallback)
    }

    redirectIfSignedIn()
  }, [nextPath, router])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const profile = await getUserProfile()
    const fallback = routeForRole(profile?.role, profile?.client_id)
    router.replace(nextPath || fallback)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', fontFamily: 'system-ui, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCFF00', fontWeight: 700, fontSize: 14 }}>B</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>BOR Studio</div>
            <div style={{ fontSize: 11, color: '#888' }}>Sign in</div>
          </div>
        </div>

        {warning && (
          <div style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
            {warning}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 10px', marginBottom: 12 }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', border: 'none', borderRadius: 8, background: '#111', color: '#fff', padding: '10px 12px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 12, color: '#888' }}>
          Back to <Link href="/" style={{ color: '#111' }}>home</Link>
        </div>
      </div>
    </main>
  )
}
