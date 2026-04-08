import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f9f9',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, background: '#111', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 20, color: '#CCFF00', fontWeight: 700
        }}>B</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#111', marginBottom: 8 }}>
          BOR Studio
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
          Choose your portal to continue
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/admin" style={{
            padding: '10px 24px', background: '#111', color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500
          }}>
            Admin / Team
          </Link>
          <Link href="/client" style={{
            padding: '10px 24px', background: '#fff', color: '#111',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
            border: '1px solid #e0e0e0'
          }}>
            Client Portal
          </Link>
        </div>
      </div>
    </main>
  )
}