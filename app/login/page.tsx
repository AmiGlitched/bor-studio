'use client'

import { FormEvent, useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserProfile, routeForRole } from '@/lib/auth'

function LoginForm() {
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
    <div style={{ width: '100%', maxWidth: 400, background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: '36px 28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative', zIndex: 10 }}>
      
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>Welcome to Wahid Route Portal</h1>
      </div>

      {warning && (
        <div style={{ fontSize: 13, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
          {warning}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              border: '1px solid #111', 
              borderRadius: 8, 
              padding: '12px 14px', 
              fontSize: 14,
              background: '#222', // Dark background to make light text visible
              color: '#f8f9fa',   // Light gray/white text color
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 8 }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              border: '1px solid #111', 
              borderRadius: 8, 
              padding: '12px 14px', 
              fontSize: 14,
              background: '#222', // Dark background to make light text visible
              color: '#f8f9fa',   // Light gray/white text color
              outline: 'none'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', border: 'none', borderRadius: 8, background: '#111', color: '#fff', padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.2s' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(180deg, #020617 0%, #1e3a8a 100%)', // Fading from near-black blue to richer blue
      fontFamily: 'system-ui, sans-serif', 
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Large Realtors Branding */}
      <div style={{ 
        position: 'absolute', 
        top: 40, 
        left: 40, 
        fontSize: '3rem', 
        fontWeight: 800, 
        color: '#fff', 
        letterSpacing: '-0.02em',
        zIndex: 5
      }}>
        Realtors
      </div>

      <Suspense fallback={<div style={{ color: '#fff', fontWeight: 500 }}>Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}