'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SidebarProfile() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>('Loading...')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setDisplayName('Unknown user')
        return
      }

      const byAuth = await supabase
        .from('users')
        .select('name')
        .eq('auth_id', user.id)
        .maybeSingle()

      if (byAuth.data?.name) {
        setDisplayName(byAuth.data.name)
        return
      }

      const byEmail = await supabase
        .from('users')
        .select('name')
        .eq('email', user.email || '')
        .maybeSingle()

      setDisplayName(byEmail.data?.name || user.email || 'Unknown user')
    }
    fetchUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative border-t border-gray-100 bg-white">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <span className="text-xs font-medium text-gray-700 truncate pr-2">{displayName}</span>
        <span className="text-[10px] text-gray-400">{isOpen ? '▼' : '▲'}</span>
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-1 px-2 z-50">
          <div className="bg-white border border-gray-200 shadow-lg rounded-md p-1">
          <button
            onClick={handleLogout}
              className="w-full rounded-sm px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
          </div>
        </div>
      )}
    </div>
  )
}