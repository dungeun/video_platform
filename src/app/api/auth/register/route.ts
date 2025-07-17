import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/services'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (role !== 'business' && role !== 'influencer') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Register user
    const registerResponse = await authService.register({ 
      email, 
      password, 
      name,
      type: role
    })

    // Set cookies
    const response = NextResponse.json({
      user: registerResponse.user,
      tokens: {
        accessToken: registerResponse.token,
        refreshToken: registerResponse.refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      }
    })

    // Set httpOnly cookies for tokens
    response.cookies.set('accessToken', registerResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    })

    response.cookies.set('refreshToken', registerResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    )
  }
}