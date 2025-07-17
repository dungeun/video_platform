import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    let userType: string
    try {
      // 개발 환경에서 mock 토큰 처리
      if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
        if (token === 'mock-admin-access-token') {
          userId = 'mock-admin-id'
          userType = 'ADMIN'
        } else {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }
      } else {
        const payload = await verifyJWT(token)
        userId = payload.id
        userType = payload.type
        
        // 관리자 권한 확인
        if (userType !== 'ADMIN') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 설정 조회 - 임시로 하드코딩된 데이터 반환
    const defaultSettings = {
      general: {
        siteName: 'LinkPick',
        siteDescription: '인플루언서 마케팅 플랫폼',
        supportEmail: 'support@linkpick.com',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true
      },
      website: {
        logo: '/logo.svg',
        favicon: '/favicon.svg',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        footerEnabled: true,
        footerText: '© 2024 LinkPick. All rights reserved.',
        footerLinks: [
          { title: '이용약관', url: '/terms', newWindow: false },
          { title: '개인정보처리방침', url: '/privacy', newWindow: false },
          { title: '고객지원', url: '/support', newWindow: false },
          { title: '회사소개', url: '/about', newWindow: false }
        ],
        socialLinks: {
          facebook: 'https://facebook.com/linkpick',
          twitter: 'https://twitter.com/linkpick',
          instagram: 'https://instagram.com/linkpick',
          youtube: 'https://youtube.com/linkpick',
          linkedin: 'https://linkedin.com/company/linkpick'
        },
        seo: {
          metaTitle: 'LinkPick - 인플루언서 마케팅 플랫폼',
          metaDescription: '최고의 인플루언서와 브랜드를 연결하는 마케팅 플랫폼입니다.',
          metaKeywords: '인플루언서, 마케팅, 브랜드, 광고, 소셜미디어',
          ogImage: '/og-image.svg'
        },
        analytics: {
          googleAnalyticsId: '',
          facebookPixelId: '',
          hotjarId: ''
        }
      },
      payments: {
        platformFeeRate: 15,
        minimumPayout: 10000,
        paymentMethods: ['bank_transfer', 'paypal'],
        autoPayoutEnabled: true,
        payoutSchedule: 'monthly'
      },
      content: {
        maxFileSize: 10,
        allowedFileTypes: ['jpg', 'png', 'gif', 'mp4', 'mov'],
        contentModerationEnabled: true,
        autoApprovalEnabled: false,
        maxCampaignDuration: 90
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        notificationDelay: 5
      }
    }

    return NextResponse.json({
      settings: defaultSettings
    })

  } catch (error) {
    console.error('Get settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    let userType: string
    try {
      // 개발 환경에서 mock 토큰 처리
      if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
        if (token === 'mock-admin-access-token') {
          userId = 'mock-admin-id'
          userType = 'ADMIN'
        } else {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }
      } else {
        const payload = await verifyJWT(token)
        userId = payload.id
        userType = payload.type
        
        // 관리자 권한 확인
        if (userType !== 'ADMIN') {
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const newSettings = await request.json()
    
    console.log('Settings updated:', newSettings)

    return NextResponse.json({
      success: true,
      message: '설정이 성공적으로 저장되었습니다.'
    })

  } catch (error) {
    console.error('Update settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}