'use client'

import React from 'react'
import Link from 'next/link'

export default function StudioRouteTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Studio 라우트 테스트
          </h1>
          <p className="text-gray-600">
            Studio 라우트가 Business 라우트로 제대로 리다이렉트되는지 테스트합니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            테스트 링크들
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Studio 대시보드</h3>
                <p className="text-sm text-gray-600">
                  /studio/dashboard → /business/dashboard로 리다이렉트
                </p>
              </div>
              <Link 
                href="/studio/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                target="_blank"
              >
                테스트
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Studio 캠페인</h3>
                <p className="text-sm text-gray-600">
                  /studio/campaigns → /business/campaigns로 리다이렉트
                </p>
              </div>
              <Link 
                href="/studio/campaigns"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                target="_blank"
              >
                테스트
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Studio 새 캠페인</h3>
                <p className="text-sm text-gray-600">
                  /studio/campaigns/new → /business/campaigns/new로 리다이렉트
                </p>
              </div>
              <Link 
                href="/studio/campaigns/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                target="_blank"
              >
                테스트
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Studio 지원서 관리</h3>
                <p className="text-sm text-gray-600">
                  /studio/applications → /business/applications로 리다이렉트
                </p>
              </div>
              <Link 
                href="/studio/applications"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                target="_blank"
              >
                테스트
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            기존 Business 라우트 (정상 작동 확인)
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Business 대시보드</h3>
                <p className="text-sm text-gray-600">
                  기존 /business/dashboard 경로
                </p>
              </div>
              <Link 
                href="/business/dashboard"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                target="_blank"
              >
                테스트
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Business 캠페인</h3>
                <p className="text-sm text-gray-600">
                  기존 /business/campaigns 경로
                </p>
              </div>
              <Link 
                href="/business/campaigns"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                target="_blank"
              >
                테스트
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            테스트 방법
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 각 "테스트" 버튼을 클릭하여 새 탭에서 페이지를 열어보세요</li>
            <li>• Studio 라우트들이 해당하는 Business 라우트로 리다이렉트되는지 확인하세요</li>
            <li>• URL 주소창에서 /business로 바뀌는지 확인하세요</li>
            <li>• 페이지 내용이 정상적으로 표시되는지 확인하세요</li>
            <li>• 인증이 필요한 페이지는 로그인 후 테스트하세요</li>
          </ul>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            구현된 기능
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ✅ Middleware에서 /studio/* → /business/* 리라이트</li>
            <li>• ✅ Studio 라우트에 대한 BUSINESS 권한 인증</li>
            <li>• ✅ 헤더 네비게이션에 Studio 링크 추가</li>
            <li>• ✅ 기존 Business 라우트 완전 호환성 유지</li>
            <li>• ✅ 비디오 크리에이터를 위한 전용 진입점 제공</li>
          </ul>
        </div>
      </div>
    </div>
  )
}