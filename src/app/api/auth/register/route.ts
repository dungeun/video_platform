import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/services'
import { uploadFile } from '@/lib/file-upload'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let email, password, name, type, phone, address, companyName, businessNumber
    let businessFileUrl = null
    let businessFileName = null
    let businessFileSize = null

    // FormData 처리 (파일 업로드가 있는 경우)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      
      email = formData.get('email') as string
      password = formData.get('password') as string
      name = formData.get('name') as string
      type = formData.get('type') as string
      phone = formData.get('phone') as string
      address = formData.get('address') as string
      companyName = formData.get('companyName') as string
      businessNumber = formData.get('businessNumber') as string
      
      // 비즈니스 계정인 경우 파일 처리
      if (type === 'BUSINESS') {
        const businessFile = formData.get('businessFile') as File
        if (businessFile && businessFile instanceof File) {
          // 파일 크기 검증 (5MB)
          if (businessFile.size > 5 * 1024 * 1024) {
            return NextResponse.json(
              { error: '파일 크기는 5MB 이하여야 합니다.' },
              { status: 400 }
            )
          }
          
          // 파일 업로드
          businessFileUrl = await uploadFile(businessFile, 'business-registration')
          businessFileName = businessFile.name
          businessFileSize = businessFile.size
        } else if (type === 'BUSINESS') {
          return NextResponse.json(
            { error: '비즈니스 계정은 사업자등록증이 필수입니다.' },
            { status: 400 }
          )
        }
      }
    } else {
      // JSON 처리 (기존 방식)
      const body = await request.json()
      email = body.email
      password = body.password
      name = body.name
      type = body.type || body.role
      phone = body.phone
      address = body.address
    }

    if (!email || !password || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedType = type.toLowerCase()
    if (normalizedType !== 'business' && normalizedType !== 'influencer') {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Register user with business file info
    const registerResponse = await authService.register({ 
      email, 
      password, 
      name,
      type: normalizedType,
      phone,
      address,
      companyName,
      businessNumber,
      businessFileUrl,
      businessFileName,
      businessFileSize
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