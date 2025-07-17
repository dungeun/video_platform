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
}

interface UIConfigStore {
  config: UIConfig;
  websiteSettings: any;
  updateHeaderMenus: (menus: MenuItem[]) => void;
  updateFooterColumns: (columns: FooterColumn[]) => void;
  updateLogo: (logo: UIConfig['header']['logo']) => void;
  updateCTAButton: (cta: UIConfig['header']['ctaButton']) => void;
  updateCopyright: (copyright: string) => void;
  updateWebsiteSettings: (settings: any) => void;
  loadSettingsFromAPI: () => Promise<void>;
  resetToDefault: () => void;
}

const defaultConfig: UIConfig = {
  header: {
    logo: {
      text: 'LinkPick',
    },
    menus: [
      { id: '1', label: '회사 소개', href: '/about', order: 1, visible: true },
      { id: '2', label: '캠페인', href: '/campaigns', order: 2, visible: true },
      { id: '3', label: '인플루언서', href: '/influencers', order: 3, visible: true },
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
      updateWebsiteSettings: (settings) =>
        set({ websiteSettings: settings }),
      loadSettingsFromAPI: async () => {
        try {
          // UI config 로드 (공개 API 사용)
          const uiConfigResponse = await fetch('/api/ui-config')
          if (uiConfigResponse.ok) {
            const uiData = await uiConfigResponse.json()
            if (uiData.config) {
              set({ config: uiData.config })
            }
          }
          
          // 일반 설정 로드
          const response = await fetch('/api/settings')
          if (response.ok) {
            const data = await response.json()
            set({ websiteSettings: data.settings?.website || null })
          }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      },
      resetToDefault: () => set({ config: defaultConfig }),
    }),
    {
      name: 'ui-config-storage',
    }
  )
);