'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  order: number;
  visible: boolean;
  children?: MenuItem[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: MenuItem[];
  order: number;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
}

export interface HeroSlide {
  id: string;
  type: 'blue' | 'dark' | 'green' | 'pink';
  tag?: string;
  title: string;
  subtitle: string;
  bgColor: string;
  backgroundImage?: string;
  link?: string;
  order: number;
  visible: boolean;
}

export interface CategoryMenu {
  id: string;
  name: string;
  categoryId: string;
  icon: string; // 이미지 URL
  badge?: string;
  order: number;
  visible: boolean;
}

export interface QuickLink {
  id: string;
  title: string;
  icon: string; // 이미지 URL
  link: string;
  order: number;
  visible: boolean;
}

export interface PromoBanner {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  icon: string;
  link?: string;
  visible: boolean;
}

export interface RankingSection {
  visible: boolean;
  title: string;
  subtitle?: string;
  criteria: 'popular' | 'deadline' | 'reward' | 'participants'; // 인기순, 마감임박, 리워드 높은순, 참여자 많은순
  count: number; // 표시할 개수
  showBadge: boolean; // 순위 뱃지 표시 여부
}

export interface CustomSection {
  id: string;
  title: string;
  subtitle?: string;
  type: 'manual' | 'auto'; // manual: 수동 선택, auto: 자동 필터링
  visible: boolean;
  order: number;
  layout: 'grid' | 'list' | 'carousel'; // 레이아웃 형식
  columns: number; // 컬럼 수 (grid일 때)
  rows: number; // 행 수
  // 자동 필터링 옵션 (type이 'auto'일 때)
  filter?: {
    category?: string;
    platform?: string;
    minBudget?: number;
    maxBudget?: number;
    status?: string;
    sortBy?: 'latest' | 'popular' | 'deadline' | 'budget';
  };
  // 수동 선택 캠페인 (type이 'manual'일 때)
  campaignIds?: string[];
  showMoreButton?: boolean;
  moreButtonText?: string;
  moreButtonLink?: string;
}

export interface SectionOrder {
  id: string;
  type: 'hero' | 'category' | 'quicklinks' | 'promo' | 'ranking' | 'custom' | 'recommended';
  order: number;
  visible: boolean;
}

export interface UIConfig {
  header: {
    logo: {
      text: string;
      imageUrl?: string;
    };
    menus: MenuItem[];
    ctaButton: {
      text: string;
      href: string;
      visible: boolean;
    };
  };
  footer: {
    columns: FooterColumn[];
    social: {
      platform: string;
      url: string;
      visible: boolean;
    }[];
    copyright: string;
  };
  mainPage: {
    heroSlides: HeroSlide[]; // 히어로 배너 슬라이드
    categoryMenus: CategoryMenu[]; // 카테고리 메뉴
    quickLinks: QuickLink[]; // 바로가기 링크 (3단)
    promoBanner: PromoBanner; // 프로모션 배너 (1단)
    rankingSection: RankingSection; // 랭킹 섹션
    customSections: CustomSection[]; // 커스텀 섹션들
    sectionOrder?: SectionOrder[]; // 섹션 순서
  };
}

interface UIConfigStore {
  config: UIConfig;
  websiteSettings: any;
  updateHeaderMenus: (menus: MenuItem[]) => void;
  updateFooterColumns: (columns: FooterColumn[]) => void;
  updateLogo: (logo: UIConfig['header']['logo']) => void;
  updateCTAButton: (cta: UIConfig['header']['ctaButton']) => void;
  updateCopyright: (copyright: string) => void;
  updateMainPageHeroSlides: (slides: HeroSlide[]) => void;
  updateMainPageCategoryMenus: (menus: CategoryMenu[]) => void;
  updateMainPageQuickLinks: (links: QuickLink[]) => void;
  updateMainPagePromoBanner: (banner: PromoBanner) => void;
  updateMainPageRankingSection: (ranking: RankingSection) => void;
  updateMainPageCustomSections: (sections: CustomSection[]) => void;
  addCustomSection: (section: CustomSection) => void;
  updateCustomSection: (id: string, section: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;
  updateSectionOrder: (order: SectionOrder[]) => void;
  updateWebsiteSettings: (settings: any) => void;
  loadSettingsFromAPI: () => Promise<void>;
  resetToDefault: () => void;
  setConfig: (config: UIConfig) => void;
}

const defaultConfig: UIConfig = {
  header: {
    logo: {
      text: 'LinkPick',
    },
    menus: [
      { id: '1', label: '캠페인', href: '/campaigns', order: 1, visible: true },
      { id: '2', label: '인플루언서', href: '/influencers', order: 2, visible: true },
      { id: '3', label: '커뮤니티', href: '/community', order: 3, visible: true },
      { id: '4', label: '요금제', href: '/pricing', order: 4, visible: true },
    ],
    ctaButton: {
      text: '무료로 시작하기',
      href: '/register',
      visible: true,
    },
  },
  footer: {
    columns: [
      {
        id: '1',
        title: '서비스',
        order: 1,
        links: [
          { id: '1-1', label: '캠페인 찾기', href: '/campaigns', order: 1, visible: true },
          { id: '1-2', label: '인플루언서 찾기', href: '/influencers', order: 2, visible: true },
          { id: '1-3', label: '요금제', href: '/pricing', order: 3, visible: true },
        ],
      },
      {
        id: '2',
        title: '회사',
        order: 2,
        links: [
          { id: '2-1', label: '회사 소개', href: '/about', order: 1, visible: true },
          { id: '2-2', label: '블로그', href: '/blog', order: 2, visible: true },
          { id: '2-3', label: '채용', href: '/careers', order: 3, visible: true },
        ],
      },
      {
        id: '3',
        title: '지원',
        order: 3,
        links: [
          { id: '3-1', label: '도움말', href: '/help', order: 1, visible: true },
          { id: '3-2', label: '문의하기', href: '/contact', order: 2, visible: true },
          { id: '3-3', label: '이용약관', href: '/terms', order: 3, visible: true },
        ],
      },
    ],
    social: [
      { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
      { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
      { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true },
    ],
    copyright: '© 2024 LinkPick. All rights reserved.',
  },
  mainPage: {
    heroSlides: [
      {
        id: 'slide-1',
        type: 'blue' as const,
        tag: '캠페인 혜택',
        title: '브랜드와 함께하는\n완벽한 캠페인',
        subtitle: '최대 500만원 캠페인 참여 기회',
        bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
        order: 1,
        visible: true,
      },
      {
        id: 'slide-2',
        type: 'dark' as const,
        title: '이번달, 어떤 캠페인이\n당신을 기다릴까요?',
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
        title: '첫 캠페인\n특별 혜택',
        subtitle: '수수료 50% 할인 이벤트',
        bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
        order: 4,
        visible: true,
      },
      {
        id: 'slide-5',
        type: 'blue' as const,
        title: 'AI 매칭\n서비스 출시',
        subtitle: '최적의 인플루언서를 찾아드립니다',
        bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
        order: 5,
        visible: true,
      },
      {
        id: 'slide-6',
        type: 'dark' as const,
        tag: 'HOT',
        title: '인기 브랜드\n대량 모집',
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
      title: '🔥 인기 캠페인 TOP 5',
      subtitle: '지금 가장 핫한 캠페인을 만나보세요',
      criteria: 'popular' as const,
      count: 5,
      showBadge: true,
    },
    customSections: [],
    sectionOrder: [
      { id: 'hero', type: 'hero', order: 1, visible: true },
      { id: 'category', type: 'category', order: 2, visible: true },
      { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
      { id: 'promo', type: 'promo', order: 4, visible: true },
      { id: 'ranking', type: 'ranking', order: 5, visible: true },
      { id: 'recommended', type: 'recommended', order: 6, visible: true },
    ],
  },
};

export const useUIConfigStore = create<UIConfigStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      websiteSettings: null,
      updateHeaderMenus: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            header: {
              ...state.config.header,
              menus,
            },
          },
        })),
      updateFooterColumns: (columns) =>
        set((state) => ({
          config: {
            ...state.config,
            footer: {
              ...state.config.footer,
              columns,
            },
          },
        })),
      updateLogo: (logo) =>
        set((state) => ({
          config: {
            ...state.config,
            header: {
              ...state.config.header,
              logo,
            },
          },
        })),
      updateCTAButton: (ctaButton) =>
        set((state) => ({
          config: {
            ...state.config,
            header: {
              ...state.config.header,
              ctaButton,
            },
          },
        })),
      updateCopyright: (copyright) =>
        set((state) => ({
          config: {
            ...state.config,
            footer: {
              ...state.config.footer,
              copyright,
            },
          },
        })),
      updateMainPageHeroSlides: (slides) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              heroSlides: slides,
            },
          },
        })),
      updateMainPageCategoryMenus: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              categoryMenus: menus,
            },
          },
        })),
      updateMainPageQuickLinks: (links) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              quickLinks: links,
            },
          },
        })),
      updateMainPagePromoBanner: (banner) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              promoBanner: banner,
            },
          },
        })),
      updateMainPageRankingSection: (ranking) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              rankingSection: ranking,
            },
          },
        })),
      updateMainPageCustomSections: (sections) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: sections,
            },
          },
        })),
      addCustomSection: (section) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: [...(state.config.mainPage?.customSections || []), section],
            },
          },
        })),
      updateCustomSection: (id, sectionUpdate) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: (state.config.mainPage?.customSections || []).map((section) =>
                section.id === id ? { ...section, ...sectionUpdate } : section
              ),
            },
          },
        })),
      removeCustomSection: (id) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: (state.config.mainPage?.customSections || []).filter(
                (section) => section.id !== id
              ),
            },
          },
        })),
      updateSectionOrder: (order) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              sectionOrder: order,
            },
          },
        })),
      updateWebsiteSettings: (settings) =>
        set({ websiteSettings: settings }),
      loadSettingsFromAPI: async () => {
        try {
          // UI config 로드 (공개 API 사용)
          console.log('Loading UI config from API...');
          const uiConfigResponse = await fetch('/api/ui-config')
          if (uiConfigResponse.ok) {
            const uiData = await uiConfigResponse.json()
            console.log('UI config loaded:', uiData.config);
            if (uiData.config) {
              set({ config: uiData.config })
            }
          } else {
            console.error('Failed to load UI config:', uiConfigResponse.status);
          }
          
          // 일반 설정 로드
          const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('auth-token')) : null;
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch('/api/settings', {
            headers,
          })
          if (response.ok) {
            const data = await response.json()
            set({ websiteSettings: data.settings?.website || null })
          }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      },
      resetToDefault: () => set({ config: defaultConfig }),
      setConfig: (config) => set({ config }),
    }),
    {
      name: 'ui-config-storage',
    }
  )
);