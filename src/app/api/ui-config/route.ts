import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CONFIG_FILE_PATH = path.join(process.cwd(), 'public/config/ui-config.json');

// GET /api/ui-config - 공개 UI 설정 조회 (JSON 파일 우선)
export async function GET(request: NextRequest) {
  try {
    // 1. JSON 파일에서 먼저 로드 시도
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      try {
        console.log('🔍 Loading from JSON file...');
        const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        const config = JSON.parse(configData);
        console.log('✅ Using JSON config');
        console.log('📋 JSON SectionOrder:', config.mainPage?.sectionOrder);
        return NextResponse.json({ config, source: 'json' });
      } catch (jsonError) {
        console.warn('⚠️ JSON file error, falling back to database:', jsonError);
      }
    }
    // 기본 설정 먼저 준비
    const defaultConfig = {
        header: {
          logo: {
            text: '비디오픽',
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
            { platform: 'twitter', url: 'https://twitter.com/videopick', visible: true },
            { platform: 'facebook', url: 'https://facebook.com/videopick', visible: true },
            { platform: 'instagram', url: 'https://instagram.com/videopick', visible: true }
          ],
          copyright: '© 2024 비디오픽. All rights reserved.'
        },
        sidebar: {
          mainMenu: [
            { id: 'home', label: '홈', href: '/', icon: 'Home', order: 1, visible: true, section: 'main' },
            { id: 'live', label: '라이브', href: '/live', icon: 'Tv', order: 2, visible: true, section: 'main' },
            { id: 'videos', label: '동영상', href: '/videos', icon: 'Video', order: 3, visible: true, section: 'main' },
            { id: 'trending', label: '인기 영상', href: '/trending', icon: 'Fire', order: 4, visible: true, section: 'main' },
            { id: 'new', label: '신규 영상', href: '/new', icon: 'Plus', order: 5, visible: true, section: 'main' },
          ],
          categoryMenu: [
            { id: 'realestate', label: '부동산', href: '/category/realestate', icon: 'Building', order: 1, visible: true, section: 'category' },
            { id: 'stock', label: '주식', href: '/category/stock', icon: 'TrendingUp', order: 2, visible: true, section: 'category' },
            { id: 'car', label: '자동차', href: '/category/car', icon: 'Car', order: 3, visible: true, section: 'category' },
            { id: 'food', label: '음식', href: '/category/food', icon: 'UtensilsCrossed', order: 4, visible: true, section: 'category' },
            { id: 'travel', label: '여행', href: '/category/travel', icon: 'Plane', order: 5, visible: true, section: 'category' },
            { id: 'game', label: '게임', href: '/category/game', icon: 'Gamepad2', order: 6, visible: true, section: 'category' },
          ],
          settingsMenu: [
            { id: 'settings', label: '설정', href: '/settings', icon: 'Settings', order: 1, visible: true, section: 'settings' },
            { id: 'help', label: '도움말', href: '/help', icon: 'HelpCircle', order: 2, visible: true, section: 'settings' },
            { id: 'feedback', label: '의견 보내기', href: '/feedback', icon: 'MessageSquare', order: 3, visible: true, section: 'settings' },
          ],
          subscribedChannels: [
            { id: 'channel1', name: '지창경', avatar: 'https://i.pravatar.cc/24?img=2', isLive: true, order: 1, visible: true },
            { id: 'channel2', name: '자랑맨', avatar: 'https://i.pravatar.cc/24?img=3', isLive: false, order: 2, visible: true },
            { id: 'channel3', name: '인순효그', avatar: 'https://i.pravatar.cc/24?img=4', isLive: false, order: 3, visible: true },
            { id: 'channel4', name: '주식왕', avatar: 'https://i.pravatar.cc/24?img=5', isLive: false, order: 4, visible: true },
          ],
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
          rankingSection: {
            visible: true,
            title: '인기 비디오',
            subtitle: '가장 많이 시청된 비디오들을 확인해보세요',
            criteria: 'popular' as const,
            count: 4,
            showBadge: true,
          },
          customSections: [
            {
              id: 'latest-realestate',
              title: '최신 부동산',
              subtitle: '업데이트된 부동산 영상을 확인해보세요',
              type: 'auto' as const,
              visible: true,
              order: 55,
              layout: 'grid' as const,
              columns: 4,
              rows: 1,
              filter: {
                category: 'realestate',
                sortBy: 'latest' as const
              },
              showMoreButton: true,
              moreButtonText: '더보기',
              moreButtonLink: '/category/realestate'
            }
          ],
          sectionOrder: [
            { id: 'hero', type: 'hero', order: 1, visible: true },
            { id: 'category', type: 'category', order: 2, visible: true },
            { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
            { id: 'promo', type: 'promo', order: 4, visible: true },
            { id: 'ranking', type: 'ranking', order: 5, visible: true },
            { id: 'latest-realestate', type: 'custom', order: 6, visible: true },
            { id: 'youtube', type: 'youtube', order: 7, visible: true },
            { id: 'recommended', type: 'recommended', order: 8, visible: true }
          ]
        }
      };

    // 데이터베이스에서 UI 설정 조회 시도
    try {
      const uiConfig = await prisma.site_config.findFirst({
        where: { key: 'ui-config' },
      });

      if (uiConfig && uiConfig.value) {
        const parsedConfig = JSON.parse(uiConfig.value);
        // 파싱된 config가 유효하고 필수 필드들이 있는지 확인
        if (parsedConfig && 
            parsedConfig.mainPage && 
            parsedConfig.mainPage.heroSlides && 
            parsedConfig.mainPage.categoryMenus &&
            parsedConfig.mainPage.heroSlides.length > 0 &&
            parsedConfig.mainPage.categoryMenus.length > 0) {
          console.log('Using database config with valid data');
          console.log('Database sectionOrder:', parsedConfig.mainPage.sectionOrder);
          return NextResponse.json({ config: parsedConfig });
        } else {
          console.warn('Database config incomplete, missing required fields. Using default config.');
          console.warn('parsedConfig structure:', {
            hasMainPage: !!parsedConfig?.mainPage,
            hasHeroSlides: !!parsedConfig?.mainPage?.heroSlides,
            hasCategoryMenus: !!parsedConfig?.mainPage?.categoryMenus,
            hasSectionOrder: !!parsedConfig?.mainPage?.sectionOrder,
            heroSlidesLength: parsedConfig?.mainPage?.heroSlides?.length || 0,
            categoryMenusLength: parsedConfig?.mainPage?.categoryMenus?.length || 0,
          });
        }
      } else {
        console.warn('No database config found. Using default config.');
      }
    } catch (dbError) {
      console.warn('Database connection failed, using default config:', dbError);
    }

    // 기본 설정 반환
    return NextResponse.json({ config: defaultConfig });
  } catch (error) {
    console.error('UI config 조회 오류:', error);
    
    // Fallback to basic default config
    return NextResponse.json({ 
      config: {
        header: { menus: [] },
        footer: { columns: [] },
        mainPage: { sectionOrder: ['video', 'community'] }
      }
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.warn('Failed to disconnect Prisma:', e);
    }
  }
}