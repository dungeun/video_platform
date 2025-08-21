'use client';

import Link from 'next/link'
import { useEffect } from 'react'
import { useUIConfigStore } from '@/lib/stores/ui-config.store'

export default function Footer() {
  const { config, websiteSettings, loadSettingsFromAPI } = useUIConfigStore()
  
  // 기본 Footer 설정 (config가 아직 로드되지 않았을 때 사용)
  const defaultFooter = {
    columns: [
      {
        id: '1',
        title: '서비스',
        order: 1,
        links: [
          { id: '1-1', label: '비디오 둘러보기', href: '/videos', order: 1, visible: true },
          { id: '1-2', label: '인기 비디오', href: '/trending', order: 2, visible: true },
          { id: '1-3', label: '최신 비디오', href: '/new', order: 3, visible: true },
          { id: '1-4', label: '랭킹', href: '/ranking', order: 4, visible: true },
          { id: '1-5', label: '라이브', href: '/live', order: 5, visible: true },
          { id: '1-6', label: '카테고리', href: '/categories', order: 6, visible: true },
        ],
      },
      {
        id: '2',
        title: '크리에이터',
        order: 2,
        links: [
          { id: '2-1', label: '스튜디오', href: '/studio/dashboard', order: 1, visible: true },
          { id: '2-2', label: '비디오 업로드', href: '/studio/upload', order: 2, visible: true },
          { id: '2-3', label: '수익 관리', href: '/studio/earnings', order: 3, visible: true },
          { id: '2-4', label: '대시보드', href: '/dashboard', order: 4, visible: true },
        ],
      },
      {
        id: '3',
        title: '회사',
        order: 3,
        links: [
          { id: '3-1', label: '회사 소개', href: '/about', order: 1, visible: true },
          { id: '3-2', label: '블로그', href: '/blog', order: 2, visible: true },
          { id: '3-3', label: '채용', href: '/careers', order: 3, visible: true },
          { id: '3-4', label: '이벤트', href: '/events', order: 4, visible: true },
        ],
      },
      {
        id: '4',
        title: '지원',
        order: 4,
        links: [
          { id: '4-1', label: '도움말', href: '/help', order: 1, visible: true },
          { id: '4-2', label: '문의하기', href: '/contact', order: 2, visible: true },
          { id: '4-3', label: '피드백', href: '/feedback', order: 3, visible: true },
          { id: '4-4', label: '이용약관', href: '/terms', order: 4, visible: true },
          { id: '4-5', label: '개인정보처리방침', href: '/privacy', order: 5, visible: true },
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
  };

  const { columns, social, copyright } = config.footer || defaultFooter

  useEffect(() => {
    loadSettingsFromAPI()
  }, [])

  // 관리자 설정이 있으면 우선 사용, 없으면 기본 설정 사용
  const footerEnabled = websiteSettings?.footerEnabled ?? true

  if (!footerEnabled) {
    return null
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* 브랜드 정보 */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              {config.header?.logo?.text || '비디오픽'}
            </h3>
            <p className="text-gray-400 mb-4">
              크리에이터와 시청자를 연결하는 차세대 비디오 플랫폼
            </p>
            <div className="flex space-x-4">
              {social && social
                .filter(s => s.visible)
                .map((socialItem, index) => {
                  const icons: { [key: string]: JSX.Element } = {
                    twitter: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    ),
                    facebook: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    ),
                    youtube: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    ),
                    instagram: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    ),
                    linkedin: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )
                  };
                  
                  return (
                    <a 
                      key={index}
                      href={socialItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {icons[socialItem.platform] || null}
                    </a>
                  );
                })}
            </div>
          </div>

          {/* UI Config의 컬럼 사용 */}
          {columns
            .sort((a, b) => a.order - b.order)
            .map(column => (
              <div key={column.id}>
                <h4 className="text-lg font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links
                    .filter(link => link.visible)
                    .sort((a, b) => a.order - b.order)
                    .map(link => (
                      <li key={link.id}>
                        <Link href={link.href} className="text-gray-400 hover:text-white transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              <p>{copyright}</p>
              <p className="mt-1">
                사업자등록번호: 123-45-67890 | 대표: 김비디오 | 
                <br className="md:hidden" />
                주소: 서울특별시 강남구 테헤란로 456, 789호
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-gray-400 text-sm">
                <p>고객센터: 1588-1234</p>
                <p>평일 09:00~18:00 (주말/공휴일 휴무)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}