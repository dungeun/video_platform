'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, User } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        if (requiredRole && currentUser.type !== requiredRole) {
          router.push('/unauthorized')
          return
        }

        setUser(currentUser)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}