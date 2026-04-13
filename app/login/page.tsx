'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Authenticate the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Fetch their specific role from the database
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', authData.user.id)
          .single()

        if (profileError) throw profileError

        // 3. The Smart Router: Hard Navigation to prevent race conditions
        if (userProfile?.role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else if (userProfile?.role === 'editor') {
          window.location.href = '/editor' // Forces a hard reload to their portal
        } else if (userProfile?.role === 'client') {
          window.location.href = '/client'
        } else {
          window.location.href = '/dashboard' 
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err)
      setError(err.message || 'Failed to login')
      setLoading(false) // Only stop loading if there is an error
    } 
    // Notice we removed the finally { setLoading(false) } here. 
    // If login is successful, we want the button to stay on "Authenticating..." while the hard reload happens!
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: 16, padding: 40 }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Agency OS</h1>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Sign in to your workspace</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(232, 67, 147, 0.1)', color: '#E84393', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 24, border: '1px solid rgba(232, 67, 147, 0.2)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', background: '#050505', border: '1px solid #1a1a22', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }}
              placeholder="you@agency.com"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: '#050505', border: '1px solid #1a1a22', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', background: '#D4AF37', color: '#000', border: 'none', padding: '14px', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  )
}