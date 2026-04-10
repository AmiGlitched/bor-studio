'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LuxuryLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)

    if (authData.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('client_id')
        .eq('auth_id', authData.user.id)
        .single()

      setTimeout(() => {
        if (profile?.client_id) {
          router.push('/client') 
        } else {
          router.push('/admin') 
        }
      }, 1500) 
    }
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Animated Breathing Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90vw', height: '90vw', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.04) 0%, rgba(0,0,0,0) 60%)', pointerEvents: 'none', zIndex: 0, animation: 'glow-pulse 6s infinite alternate ease-in-out' }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;700&display=swap');
        
        @keyframes glow-pulse {
          0% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.9); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }

        /* FIXED: box-sizing: border-box prevents inputs from spilling out */
        .luxury-input { box-sizing: border-box; width: 100%; background: #050505; border: 1px solid #222; border-radius: 8px; padding: 16px; color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 14px; outline: none; transition: all 0.3s ease; }
        .luxury-input:focus { border-color: #D4AF37; box-shadow: 0 0 15px rgba(212, 175, 55, 0.1); }
        .luxury-label { display: block; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 8px; text-align: left; }
        .toggle-btn { background: transparent; border: 1px solid #222; color: #aaa; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; margin-top: 8px; align-self: flex-start; }
        .toggle-btn:hover { color: #D4AF37; border-color: #D4AF37; }
        .submit-btn { box-sizing: border-box; width: 100%; background: #D4AF37; color: #000; border: none; padding: 18px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-top: 32px; }
        .submit-btn:hover { background: #e5c048; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(212, 175, 55, 0.15); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 420, padding: '0 24px' }}>
        
        {/* Logo Text Only */}
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Realtors Agency OS</h1>
        </div>

        {/* The Login Card */}
        <div style={{ width: '100%', background: '#0f0f0f', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 16, padding: '40px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ color: '#00D084', fontSize: 40, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#fff', fontSize: 20, marginBottom: 8 }}>Authentication Successful</h2>
              <p style={{ color: '#888', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>Redirecting to Command Center...</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#D4AF37', margin: 0 }}>Access Your Agency OS</h2>
              </div>

              {error && (
                <div style={{ background: 'rgba(232, 67, 147, 0.1)', border: '1px solid #E84393', color: '#E84393', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 24, textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 24, width: '100%' }}>
                <label className="luxury-label">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="luxury-input" 
                  placeholder="name@agency.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <label className="luxury-label">Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="luxury-input" 
                  placeholder="••••••••••••"
                  required
                />
                
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-btn"
                >
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Authenticating...' : 'Log In'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}