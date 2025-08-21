import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // DB에서 공개 설정 조회
    const publicSettingKeys = ['general', 'website']
    const settings: Record<string, any> = {}
    
    // 각 설정 키에 대해 DB 조회
    for (const key of publicSettingKeys) {
      const config = await prisma.site_config.findUnique({
        where: { key }
      })
      
      if (config) {
        try {
          settings[key] = JSON.parse(config.value)
        } catch (e) {
          // JSON 파싱 실패 시 문자열 그대로 사용
          settings[key] = config.value
        }
      }
    }

    // 기본값 설정
    const defaultSettings = {
      website: {
        logo: '/logo.png',
        favicon: '/favicon.ico',
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
          ogImage: '/og-image.jpg'
        }
      },
      general: {
        siteName: '비디오픽',
        siteDescription: '비디오 플랫폼'
      }
    }

    // DB 설정과 기본값 병합
    const mergedSettings = {
      ...defaultSettings,
      ...settings
    }

    return NextResponse.json({
      settings: mergedSettings
    })

  } catch (error) {
    console.error('Public settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}