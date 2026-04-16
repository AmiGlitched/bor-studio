'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🚨 CHANGE THIS TO YOUR EXACT LOGIN EMAIL 🚨
  const MASTER_ADMIN_EMAIL = ['divyanshwr@gmail.com', 'mdsfahad97@gmail.com']
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      if (authData.user) {
        if (authData.user.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
           window.location.href = '/admin'
           return
        }
        const { data: userProfile } = await supabase.from('users').select('role').eq('auth_id', authData.user.id).single()
        const role = userProfile?.role || 'editor'
        window.location.href = role === 'admin' ? '/admin' : role === 'editor' ? '/editor' : '/client'
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login')
      setLoading(false)
    } 
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', padding: 20, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0a0a0f', border: '1px solid #1a1a22', borderRadius: 24, padding: '48px 40px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>Agency OS</h1>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>Enter your credentials to access your workspace</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(232, 67, 147, 0.1)', color: '#E84393', padding: '14px', borderRadius: 12, fontSize: 13, marginBottom: 24, border: '1px solid rgba(232, 67, 147, 0.2)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', boxSizing: 'border-box', background: '#050505', border: '1px solid #1a1a22', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none', transition: 'border-color 0.2s' }}
              placeholder="name@agency.com"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box', background: '#050505', border: '1px solid #1a1a22', borderRadius: 12, padding: '14px 45px 14px 16px', color: '#fff', fontSize: 15, outline: 'none' }}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', boxSizing: 'border-box', background: '#D4AF37', color: '#000', border: 'none', padding: '16px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 12, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}