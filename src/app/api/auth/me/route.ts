import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/services'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Check both cookie names for compatibility
    const accessToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate token
    const tokenData = await authService.validateToken(accessToken)
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user
    const user = await authService.getUserById(tokenData.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    )
  }
}