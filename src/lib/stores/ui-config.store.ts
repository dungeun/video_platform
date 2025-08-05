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

export interface SidebarMenuItem {
  id: string;
  label: string;
  href: string;
  icon: string; // lucide-react icon name
  order: number;
  visible: boolean;
  section: 'main' | 'category' | 'settings';
}

export interface SidebarConfig {
  mainMenu: SidebarMenuItem[];
  categoryMenu: SidebarMenuItem[];
  settingsMenu: SidebarMenuItem[];
  subscribedChannels: {
    id: string;
    name: string;
    avatar: string;
    isLive: boolean;
    order: number;
    visible: boolean;
  }[];
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
  sidebar: SidebarConfig;
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
  updateSidebarConfig: (sidebar: SidebarConfig) => void;
  updateSidebarMainMenu: (menus: SidebarMenuItem[]) => void;
  updateSidebarCategoryMenu: (menus: SidebarMenuItem[]) => void;
  updateSidebarSettingsMenu: (menus: SidebarMenuItem[]) => void;
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
      text: '비디오픽',
    },
    menus: [
      { id: '1', label: '홈', href: '/', order: 1, visible: true },
      { id: '2', label: '인기', href: '/videos?sort=popular', order: 2, visible: true },
      { id: '3', label: '구독', href: '/subscriptions', order: 3, visible: true },
      { id: '4', label: '라이브', href: '/live', order: 4, visible: true },
      { id: '5', label: '커뮤니티', href: '/community', order: 5, visible: true },
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
          { id: '1-1', label: '비디오 둘러보기', href: '/videos', order: 1, visible: true },
          { id: '1-2', label: '크리에이터 찾기', href: '/channels', order: 2, visible: true },
          { id: '1-3', label: '스튜디오', href: '/studio', order: 3, visible: true },
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
      { platform: 'twitter', url: 'https://twitter.com/videopick', visible: true },
      { platform: 'facebook', url: 'https://facebook.com/videopick', visible: true },
      { platform: 'instagram', url: 'https://instagram.com/videopick', visible: true },
      { platform: 'youtube', url: 'https://youtube.com/@videopick', visible: true },
    ],
    copyright: '© 2024 비디오픽. All rights reserved.',
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
        tag: '신규 콘텐츠',
        title: '크리에이터와 함께하는\n창의적인 비디오 세상',
        subtitle: '다양한 비디오 콘텐츠를 만나보세요',
        bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
        order: 1,
        visible: true,
      },
      {
        id: 'slide-2',
        type: 'dark' as const,
        title: '이번달 가장 핫한\n비디오 트렌드는?',
        subtitle: '인기 크리에이터들의 최신 콘텐츠',
        bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
        order: 2,
        visible: true,
      },
      {
        id: 'slide-3',
        type: 'green' as const,
        title: '당신만의 채널을 시작하세요',
        subtitle: '쉽고 빠른 비디오 업로드',
        bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
        order: 3,
        visible: true,
      },
      {
        id: 'slide-4',
        type: 'pink' as const,
        tag: '신규 크리에이터',
        title: '첫 비디오\n수익화 지원',
        subtitle: '구독자 1,000명 달성 지원 프로그램',
        bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
        order: 4,
        visible: true,
      },
      {
        id: 'slide-5',
        type: 'blue' as const,
        title: 'AI 추천\n알고리즘 도입',
        subtitle: '당신이 좋아할 비디오를 추천합니다',
        bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
        order: 5,
        visible: true,
      },
      {
        id: 'slide-6',
        type: 'dark' as const,
        tag: 'LIVE',
        title: '실시간 스트리밍\n지금 시작',
        subtitle: '시청자와 실시간으로 소통하세요',
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
      title: '크리에이터 지원 프로그램',
      subtitle: '수익화와 성장을 위한 다양한 혜택을 제공합니다',
      icon: '🎬',
      visible: true,
    },
    rankingSection: {
      visible: true,
      title: '🔥 인기 비디오 TOP 5',
      subtitle: '지금 가장 많이 시청되는 비디오를 만나보세요',
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
      updateSidebarConfig: (sidebar) =>
        set((state) => ({
          config: {
            ...state.config,
            sidebar,
          },
        })),
      updateSidebarMainMenu: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            sidebar: {
              ...state.config.sidebar,
              mainMenu: menus,
            },
          },
        })),
      updateSidebarCategoryMenu: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            sidebar: {
              ...state.config.sidebar,
              categoryMenu: menus,
            },
          },
        })),
      updateSidebarSettingsMenu: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            sidebar: {
              ...state.config.sidebar,
              settingsMenu: menus,
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
            } else {
              console.log('No config data, using default');
              set({ config: defaultConfig })
            }
          } else {
            console.error('Failed to load UI config:', uiConfigResponse.status);
            console.log('Using default config');
            set({ config: defaultConfig })
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