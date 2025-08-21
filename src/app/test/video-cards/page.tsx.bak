'use client'

import React, { useState } from 'react'
import { VideoGrid, LargeVideoGrid, CompactVideoGrid, VideoListVertical } from '@/components/video'
import { transformCampaignToVideo } from '@/lib/utils/video'
import type { Video } from '@/types/video'

// 테스트용 더미 데이터
const mockVideos: Video[] = [
  {
    id: '1',
    title: '맛집 투어 브이로그 - 강남 맛집 5곳 완전 정복!',
    description: '강남에서 찾은 숨겨진 맛집들을 소개합니다. 정말 맛있는 곳들만 골라서 가봤어요!',
    thumbnailUrl: '/images/video-default-thumbnail.jpg',
    duration: 1260, // 21분
    viewCount: 15420,
    likeCount: 1230,
    createdAt: '2024-01-15T10:30:00Z',
    isLive: false,
    creator: {
      id: 'creator1',
      name: '먹방요정',
      profileImage: '/images/default-avatar.png',
      isVerified: true
    },
    category: 'food',
    tags: ['맛집', '강남', '브이로그'],
    status: 'ACTIVE'
  },
  {
    id: '2',
    title: '[LIVE] 실시간 게임 스트리밍 - 롤 랭크 게임',
    description: '다이아 티어 도전! 오늘도 열심히 랭크 올려봅시다',
    thumbnailUrl: '/images/video-default-thumbnail.jpg',
    duration: 0, // 라이브는 duration 0
    viewCount: 892,
    likeCount: 156,
    createdAt: '2024-01-20T15:45:00Z',
    isLive: true,
    creator: {
      id: 'creator2',
      name: '게임마스터',
      profileImage: '/images/default-avatar.png',
      isVerified: false
    },
    category: 'gaming',
    tags: ['롤', '랭크', '라이브'],
    status: 'ACTIVE'
  },
  {
    id: '3',
    title: '새해 운동 루틴 추천 - 집에서 할 수 있는 홈트레이닝',
    description: '집에서 간단하게 할 수 있는 운동 루틴을 알려드려요. 기구 없이도 충분히 운동할 수 있어요!',
    thumbnailUrl: '/images/video-default-thumbnail.jpg',
    duration: 900, // 15분
    viewCount: 8340,
    likeCount: 567,
    createdAt: '2024-01-18T09:20:00Z',
    isLive: false,
    creator: {
      id: 'creator3',
      name: '헬스트레이너 김코치',
      profileImage: '/images/default-avatar.png',
      isVerified: true
    },
    category: 'fitness',
    tags: ['홈트', '운동', '루틴'],
    status: 'ACTIVE'
  },
  {
    id: '4',
    title: '2024 신상 화장품 리뷰 - 가성비 최고 제품들',
    description: '올해 나온 신상 화장품 중에서 가성비 좋은 제품들만 골라서 리뷰해봤어요.',
    thumbnailUrl: '/images/video-default-thumbnail.jpg',
    duration: 720, // 12분
    viewCount: 23450,
    likeCount: 1890,
    createdAt: '2024-01-12T14:15:00Z',
    isLive: false,
    creator: {
      id: 'creator4',
      name: '뷰티구루',
      profileImage: '/images/default-avatar.png',
      isVerified: true
    },
    category: 'beauty',
    tags: ['화장품', '리뷰', '신상'],
    status: 'ACTIVE'
  }
]

export default function VideoCardsTestPage() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  const handleVideoClick = (videoId: string) => {
    setSelectedVideo(videoId)
    console.log('Video clicked:', videoId)
    // 실제 앱에서는 라우터로 이동
    // router.push(`/videos/${videoId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            VideoCard 컴포넌트 테스트
          </h1>
          <p className="text-gray-600">
            다양한 VideoCard 변형들을 테스트해볼 수 있습니다.
          </p>
          {selectedVideo && (
            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <p className="text-blue-800">
                선택된 비디오 ID: <strong>{selectedVideo}</strong>
              </p>
            </div>
          )}
        </div>

        {/* 기본 그리드 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            기본 비디오 그리드 (4열)
          </h2>
          <VideoGrid
            videos={mockVideos}
            onVideoClick={handleVideoClick}
          />
        </section>

        {/* 큰 카드 그리드 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            큰 비디오 카드 (3열, 설명 포함)
          </h2>
          <LargeVideoGrid
            videos={mockVideos}
            onVideoClick={handleVideoClick}
          />
        </section>

        {/* 컴팩트 그리드 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            컴팩트 비디오 그리드 (6열)
          </h2>
          <CompactVideoGrid
            videos={mockVideos}
            onVideoClick={handleVideoClick}
          />
        </section>

        {/* 세로 목록 (사이드바용) */}
        <section className="mb-12">
          <div className="flex gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                메인 콘텐츠 영역
              </h2>
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <p className="text-gray-600">
                  여기는 메인 비디오 플레이어나 콘텐츠가 들어갈 영역입니다.
                </p>
              </div>
            </div>
            <div className="w-80">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                관련 비디오
              </h3>
              <VideoListVertical
                videos={mockVideos}
                onVideoClick={handleVideoClick}
              />
            </div>
          </div>
        </section>

        {/* 로딩 상태 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            로딩 상태
          </h2>
          <VideoGrid
            videos={[]}
            loading={true}
            onVideoClick={handleVideoClick}
          />
        </section>

        {/* 빈 상태 테스트 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            빈 상태 (비디오 없음)
          </h2>
          <VideoGrid
            videos={[]}
            loading={false}
            onVideoClick={handleVideoClick}
          />
        </section>
      </div>
    </div>
  )
}