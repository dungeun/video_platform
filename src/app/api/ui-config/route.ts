import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/ui-config - 공개 UI 설정 조회 (모든 사용자 접근 가능)
export async function GET(request: NextRequest) {
  try {
    // 기본 설정 먼저 준비
    const defaultConfig = {
        header: {
          logo: {
            text: 'LinkPick',
            imageUrl: null
          },
          menus: [
            { id: 'menu-1', label: '캠페인', href: '/campaigns', order: 1, visible: true },
            { id: 'menu-2', label: '인플루언서', href: '/influencers', order: 2, visible: true },
            { id: 'menu-3', label: '커뮤니티', href: '/community', order: 3, visible: true },
            { id: 'menu-4', label: '요금제', href: '/pricing', order: 4, visible: true },
          ],
          ctaButton: {
            text: '시작하기',
            href: '/register',
            visible: true
          }
        },
        footer: {
          columns: [
            {
              id: 'column-1',
              title: '서비스',
              order: 1,
              links: [
                { id: 'link-1', label: '인플루언서 찾기', href: '/influencers', order: 1, visible: true },
                { id: 'link-2', label: '캠페인 만들기', href: '/campaigns/create', order: 2, visible: true },
              ]
            },
            {
              id: 'column-2',
              title: '회사',
              order: 2,
              links: [
                { id: 'link-3', label: '회사 소개', href: '/about', order: 1, visible: true },
                { id: 'link-4', label: '문의하기', href: '/contact', order: 2, visible: true },
              ]
            },
            {
              id: 'column-3',
              title: '법적 정보',
              order: 3,
              links: [
                { id: 'link-5', label: '이용약관', href: '/terms', order: 1, visible: true },
                { id: 'link-6', label: '개인정보처리방침', href: '/privacy', order: 2, visible: true },
              ]
            }
          ],
          social: [
            { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
            { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
            { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true }
          ],
          copyright: '© 2024 LinkPick. All rights reserved.'
        },
        mainPage: {
          heroSlides: [
            {
              id: 'slide-1',
              type: 'blue' as const,
              tag: '캠페인 혜택',
              title: '브랜드와 함께하는\\n완벽한 캠페인',
              subtitle: '최대 500만원 캠페인 참여 기회',
              bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
              order: 1,
              visible: true,
            },
            {
              id: 'slide-2',
              type: 'dark' as const,
              title: '이번달, 어떤 캠페인이\\n당신을 기다릴까요?',
              subtitle: '다양한 브랜드와의 만남',
              bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
              order: 2,
              visible: true,
            },
            {
              id: 'slide-3',
              type: 'green' as const,
              title: '인플루언서 매칭 시작',
              subtitle: 'AI가 찾아주는 최적의 파트너',
              bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
              order: 3,
              visible: true,
            },
            {
              id: 'slide-4',
              type: 'pink' as const,
              tag: '신규 오픈',
              title: '첫 캠페인\\n특별 혜택',
              subtitle: '수수료 50% 할인 이벤트',
              bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
              order: 4,
              visible: true,
            },
            {
              id: 'slide-5',
              type: 'blue' as const,
              title: 'AI 매칭\\n서비스 출시',
              subtitle: '최적의 인플루언서를 찾아드립니다',
              bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
              order: 5,
              visible: true,
            },
            {
              id: 'slide-6',
              type: 'dark' as const,
              tag: 'HOT',
              title: '인기 브랜드\\n대량 모집',
              subtitle: '지금 바로 지원하세요',
              bgColor: 'bg-gradient-to-br from-gray-700 to-gray-900',
              order: 6,
              visible: true,
            },
          ],
          categoryMenus: [
            { id: 'cat-1', name: '뷰티', categoryId: 'beauty', icon: '', order: 1, visible: true },
            { id: 'cat-2', name: '패션', categoryId: 'fashion', icon: '', order: 2, visible: true },
            { id: 'cat-3', name: '푸드', categoryId: 'food', icon: '', badge: 'HOT', order: 3, visible: true },
            { id: 'cat-4', name: '여행', categoryId: 'travel', icon: '', order: 4, visible: true },
            { id: 'cat-5', name: '테크', categoryId: 'tech', icon: '', order: 5, visible: true },
            { id: 'cat-6', name: '피트니스', categoryId: 'fitness', icon: '', order: 6, visible: true },
            { id: 'cat-7', name: '라이프스타일', categoryId: 'lifestyle', icon: '', order: 7, visible: true },
            { id: 'cat-8', name: '펫', categoryId: 'pet', icon: '', order: 8, visible: true },
            { id: 'cat-9', name: '육아', categoryId: 'parenting', icon: '', order: 9, visible: true },
            { id: 'cat-10', name: '게임', categoryId: 'game', icon: '', badge: '신규', order: 10, visible: true },
            { id: 'cat-11', name: '교육', categoryId: 'education', icon: '', order: 11, visible: true },
          ],
          quickLinks: [
            { id: 'quick-1', title: '이벤트', icon: '🎁', link: '/events', order: 1, visible: true },
            { id: 'quick-2', title: '쿠폰팩', icon: '🎟️', link: '/coupons', order: 2, visible: true },
            { id: 'quick-3', title: '랭킹', icon: '🏆', link: '/ranking', order: 3, visible: true },
          ],
          promoBanner: {
            title: '처음이니까, 수수료 50% 할인',
            subtitle: '첫 캠페인을 더 가볍게 시작하세요!',
            icon: '📦',
            visible: true,
          },
          sectionOrder: [
            { id: 'hero', type: 'hero', order: 1, visible: true },
            { id: 'category', type: 'category', order: 2, visible: true },
            { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
            { id: 'promo', type: 'promo', order: 4, visible: true },
            { id: 'ranking', type: 'ranking', order: 5, visible: true },
            { id: 'recommended', type: 'recommended', order: 6, visible: true }
          ]
        }
      };

    // 데이터베이스에서 UI 설정 조회 시도
    try {
      const uiConfig = await prisma.siteConfig.findFirst({
        where: { key: 'ui-config' },
      });

      if (uiConfig) {
        return NextResponse.json({ config: JSON.parse(uiConfig.value) });
      }
    } catch (dbError) {
      console.warn('Database connection failed, using default config:', dbError);
    }

    // 기본 설정 반환
    return NextResponse.json({ config: defaultConfig });
  } catch (error) {
    console.error('UI config 조회 오류:', error);
    
    // Fallback to default config defined above
    const defaultConfig = {
      header: {
        logo: {
          text: 'LinkPick',
          imageUrl: null
        },
        menus: [
          { id: 'menu-1', label: '캠페인', href: '/campaigns', order: 1, visible: true },
          { id: 'menu-2', label: '인플루언서', href: '/influencers', order: 2, visible: true },
          { id: 'menu-3', label: '커뮤니티', href: '/community', order: 3, visible: true },
          { id: 'menu-4', label: '요금제', href: '/pricing', order: 4, visible: true },
        ],
        ctaButton: {
          text: '시작하기',
          href: '/register',
          visible: true
        }
      },
      footer: {
        columns: [
          {
            id: 'column-1',
            title: '서비스',
            order: 1,
            links: [
              { id: 'link-1', label: '인플루언서 찾기', href: '/influencers', order: 1, visible: true },
              { id: 'link-2', label: '캠페인 만들기', href: '/campaigns/create', order: 2, visible: true },
            ]
          },
          {
            id: 'column-2',
            title: '회사',
            order: 2,
            links: [
              { id: 'link-3', label: '회사 소개', href: '/about', order: 1, visible: true },
              { id: 'link-4', label: '문의하기', href: '/contact', order: 2, visible: true },
            ]
          },
          {
            id: 'column-3',
            title: '법적 정보',
            order: 3,
            links: [
              { id: 'link-5', label: '이용약관', href: '/terms', order: 1, visible: true },
              { id: 'link-6', label: '개인정보처리방침', href: '/privacy', order: 2, visible: true },
            ]
          }
        ],
        social: [
          { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
          { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
          { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true }
        ],
        copyright: '© 2024 LinkPick. All rights reserved.'
      },
      mainPage: {
        heroSlides: [
          {
            id: 'slide-1',
            type: 'blue' as const,
            tag: '캠페인 혜택',
            title: '브랜드와 함께하는\\n완벽한 캠페인',
            subtitle: '최대 500만원 캠페인 참여 기회',
            bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
            order: 1,
            visible: true,
          },
          {
            id: 'slide-2',
            type: 'dark' as const,
            title: '이번달, 어떤 캠페인이\\n당신을 기다릴까요?',
            subtitle: '다양한 브랜드와의 만남',
            bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
            order: 2,
            visible: true,
          },
          {
            id: 'slide-3',
            type: 'green' as const,
            title: '인플루언서 매칭 시작',
            subtitle: 'AI가 찾아주는 최적의 파트너',
            bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
            order: 3,
            visible: true,
          },
          {
            id: 'slide-4',
            type: 'pink' as const,
            tag: '신규 오픈',
            title: '첫 캠페인\\n특별 혜택',
            subtitle: '수수료 50% 할인 이벤트',
            bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
            order: 4,
            visible: true,
          },
          {
            id: 'slide-5',
            type: 'blue' as const,
            title: 'AI 매칭\\n서비스 출시',
            subtitle: '최적의 인플루언서를 찾아드립니다',
            bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
            order: 5,
            visible: true,
          },
          {
            id: 'slide-6',
            type: 'dark' as const,
            tag: 'HOT',
            title: '인기 브랜드\\n대량 모집',
            subtitle: '지금 바로 지원하세요',
            bgColor: 'bg-gradient-to-br from-gray-700 to-gray-900',
            order: 6,
            visible: true,
          },
        ],
        categoryMenus: [
          { id: 'cat-1', name: '뷰티', categoryId: 'beauty', icon: '', order: 1, visible: true },
          { id: 'cat-2', name: '패션', categoryId: 'fashion', icon: '', order: 2, visible: true },
          { id: 'cat-3', name: '푸드', categoryId: 'food', icon: '', badge: 'HOT', order: 3, visible: true },
        ],
        quickLinks: [
          { id: 'quick-1', title: '이벤트', icon: '🎁', link: '/events', order: 1, visible: true },
          { id: 'quick-2', title: '쿠폰팩', icon: '🎟️', link: '/coupons', order: 2, visible: true },
          { id: 'quick-3', title: '랭킹', icon: '🏆', link: '/ranking', order: 3, visible: true },
        ],
        promoBanner: {
          title: '처음이니까, 수수료 50% 할인',
          subtitle: '첫 캠페인을 더 가볍게 시작하세요!',
          icon: '📦',
          visible: true,
        },
        sectionOrder: [
          { id: 'hero', type: 'hero', order: 1, visible: true },
          { id: 'category', type: 'category', order: 2, visible: true },
          { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
          { id: 'promo', type: 'promo', order: 4, visible: true },
          { id: 'ranking', type: 'ranking', order: 5, visible: true },
          { id: 'recommended', type: 'recommended', order: 6, visible: true }
        ]
      }
    };
    
    return NextResponse.json({ config: defaultConfig });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.warn('Failed to disconnect Prisma:', e);
    }
  }
}