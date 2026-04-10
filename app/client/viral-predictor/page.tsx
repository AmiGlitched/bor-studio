'use client'
import { useState } from 'react'

export default function ViralPredictor() {
  const [hook, setHook] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [scanText, setScanText] = useState('')

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  async function analyzeHook() {
    if (!hook.trim()) return
    setAnalyzing(true)
    setResult(null)

    setScanText('Analyzing linguistic retention triggers...')
    
    try {
      const response = await fetch('/api/score-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hook }),
      })
      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("AI Analysis failed", err)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: '#fff', padding: '60px 40px' }}>
      <style>{`
        .btn-gold { background: #D4AF37; color: #000; border: none; padding: 16px 24px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 8px; cursor: pointer; transition: 0.2s; }
        .btn-gold:hover { background: #e5c048; transform: translateY(-2px); }
        .btn-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .metric-box { background: #0a0a0f; border: 1px solid #1a1a22; border-radius: 8px; padding: 16px; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ borderBottom: '1px solid #1a1a22', paddingBottom: 32, marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Viral Predictor</h1>
          <p style={{ color: '#888', fontSize: 14 }}>Analyze the first 3 seconds of your script for maximum retention.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          
          {/* Input Section */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a22', borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>The Hook (First 3 Seconds)</div>
            <textarea 
              placeholder="Paste the first sentence of your script here..."
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              style={{boxSizing: 'border-box', width: '100%', height: 160, background: '#050505', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: 20, fontSize: 16, lineHeight: 1.6, resize: 'none', outline: 'none', marginBottom: 24, fontFamily: 'Playfair Display, serif' }}
            />
            <button onClick={analyzeHook} disabled={!hook || analyzing} className="btn-gold" style={{ width: '100%' }}>
              {analyzing ? 'Running AI Diagnostics...' : 'Score My Hook'}
            </button>

            {analyzing && (
              <div style={{ marginTop: 20, fontSize: 12, color: '#D4AF37', fontFamily: 'JetBrains Mono, monospace', animation: 'pulse 1.5s infinite' }}>
                {'>'}_ {scanText}
              </div>
            )}
          </div>

          {/* Output / Analysis Section */}
          <div style={{ border: '1px solid #1a1a22', borderRadius: 16, padding: 32, position: 'relative', overflow: 'hidden' }}>
            {!result ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 13, textAlign: 'center' }}>
                Awaiting script input.<br/>A strong hook is responsible for 80% of video performance.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: '#fff' }}>Virality Score</div>
                  <div style={{ fontSize: 48, fontWeight: 800, color: result.score > 60 ? '#00D084' : '#E84393', lineHeight: 1 }}>
                    {result.score}<span style={{ fontSize: 20, color: '#666' }}>/100</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div className="metric-box">
                    <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Curiosity Gap</div>
                    <div style={{ color: result.curiosity === 'High' ? '#00D084' : '#E84393', fontWeight: 700, fontSize: 14 }}>{result.curiosity}</div>
                  </div>
                  <div className="metric-box">
                    <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Visual Direction</div>
                    <div style={{ color: '#D4AF37', fontWeight: 700, fontSize: 14 }}>{result.energy}</div>
                  </div>
                </div>

                <div style={{ background: '#0a0a0f', borderLeft: `3px solid ${result.score > 60 ? '#00D084' : '#E84393'}`, padding: 20, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 700 }}>AI Feedback</div>
                  <div style={{ fontSize: 14, color: '#ccc', lineHeight: 1.6 }}>{result.feedback}</div>
                </div>

                {result.rewrite && (
                  <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed #D4AF37', borderRadius: 8, padding: 20 }}>
                    <div style={{ fontSize: 11, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 800 }}>Suggested Rewrite</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#fff', fontStyle: 'italic' }}>{result.rewrite}</div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}