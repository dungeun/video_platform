'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import PageLayout from '@/components/layouts/PageLayout'
import LivePlayer from '@/components/streaming/LivePlayer'
import ChatRoom from '@/components/live/ChatRoom'
import { useAuth } from '@/hooks/useAuth'
import useLiveStream from '@/hooks/useLiveStream'
import { 
  Users, 
  Heart, 
  Share2, 
  Settings, 
  Volume2, 
  VolumeX,
  Maximize,
  ArrowLeft,
  MoreVertical,
  DollarSign
} from 'lucide-react'

interface StreamData {
  id: string
  title: string
  description: string
  streamKey: string
  isLive: boolean
  thumbnailUrl?: string
  category: string
  createdAt: string
  creator: {
    id: string
    name: string
    profileImage?: string
    isVerified: boolean
    followers: number
  }
  viewers: number
  likes: number
  superChatEnabled: boolean
  chatEnabled: boolean
}

export default function WatchLivePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const streamId = params.streamId as string

  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 라이브 스트림 상태 관리
  const { 
    isConnected, 
    viewers, 
    likes,
    connectToStream, 
    disconnectFromStream,
    sendLike
  } = useLiveStream(streamId)

  // 스트림 데이터 로드
  useEffect(() => {
    const loadStreamData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/streaming/streams/${streamId}`)
        
        if (response.status === 404) {
          notFound()
        }
        
        if (!response.ok) {
          throw new Error('스트림을 불러올 수 없습니다')
        }
        
        const data = await response.json()
        setStreamData(data)
        
        // 라이브가 아닌 경우 처리
        if (!data.isLive) {
          setError('이 방송은 현재 종료되었습니다')
          return
        }

        // 스트림 연결
        await connectToStream()
        
      } catch (error) {
        console.error('Failed to load stream:', error)
        setError(error instanceof Error ? error.message : '스트림을 불러올 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    if (streamId) {
      loadStreamData()
    }

    return () => {
      disconnectFromStream()
    }
  }, [streamId, connectToStream, disconnectFromStream])

  // 팔로우 상태 확인
  useEffect(() => {
    if (isAuthenticated && streamData) {
      const checkFollowStatus = async () => {
        try {
          const response = await fetch(`/api/users/${streamData.creator.id}/follow/status`)
          if (response.ok) {
            const data = await response.json()
            setIsFollowing(data.isFollowing)
          }
        } catch (error) {
          console.error('Failed to check follow status:', error)
        }
      }
      checkFollowStatus()
    }
  }, [isAuthenticated, streamData])

  const handleFollow = async () => {
    if (!isAuthenticated || !streamData) return

    try {
      const response = await fetch(`/api/users/${streamData.creator.id}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST'
      })

      if (response.ok) {
        setIsFollowing(!isFollowing)
        // 팔로워 수 업데이트
        setStreamData(prev => prev ? {
          ...prev,
          creator: {
            ...prev.creator,
            followers: isFollowing ? prev.creator.followers - 1 : prev.creator.followers + 1
          }
        } : null)
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) return

    try {
      await sendLike()
      setIsLiked(true)
      // 좋아요 애니메이션 후 상태 초기화
      setTimeout(() => setIsLiked(false), 1000)
    } catch (error) {
      console.error('Failed to send like:', error)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    const title = streamData?.title || '라이브 방송'
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // 클립보드 복사
      try {
        await navigator.clipboard.writeText(url)
        // TODO: 토스트 메시지 표시
        alert('링크가 클립보드에 복사되었습니다!')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-white text-lg">방송을 불러오는 중...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !streamData) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-4xl">📺</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {error || '방송을 찾을 수 없습니다'}
            </h1>
            <p className="text-gray-400 mb-6">
              방송이 종료되었거나 존재하지 않는 방송입니다.
            </p>
            <button
              onClick={() => router.push('/live')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              라이브 방송 목록으로
            </button>
          </div>
        </div>
      </PageLayout>
    )
  }

  // HLS 스트림 URL 생성
  const streamUrl = `${process.env.NEXT_PUBLIC_STREAMING_SERVER_URL || 'http://localhost:8888'}/hls/${streamData.streamKey}/index.m3u8`

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900">
        {/* 모바일 헤더 */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={() => router.back()}
            className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 text-sm font-bold">LIVE</span>
          </div>

          <button
            onClick={() => setIsChatVisible(!isChatVisible)}
            className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors md:hidden"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-screen">
          {/* 비디오 영역 */}
          <div className="flex-1 flex flex-col">
            {/* 비디오 플레이어 */}
            <div className="relative aspect-video md:h-[60vh] lg:h-[70vh] bg-black">
              <LivePlayer
                streamUrl={streamUrl}
                streamType="hls"
                autoPlay={true}
                muted={isMuted}
                controls={true}
                onError={(error) => {
                  console.error('Player error:', error)
                  setError('스트림 재생 중 오류가 발생했습니다')
                }}
                onViewerCountUpdate={(count) => {
                  // 시청자 수 업데이트는 useLiveStream에서 처리
                }}
                className="w-full h-full"
              />

              {/* 라이브 상태 표시 */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
                
                <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {formatNumber(viewers || streamData.viewers)}
                </div>
              </div>

              {/* 컨트롤 버튼 (모바일) */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 md:hidden">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 비디오 정보 */}
            <div className="p-4 md:p-6 flex-1 overflow-y-auto">
              {/* 제목 */}
              <h1 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2">
                {streamData.title}
              </h1>

              {/* 크리에이터 정보 & 액션 버튼 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={streamData.creator.profileImage || `https://i.pravatar.cc/48?img=${streamData.creator.id}`}
                    alt={streamData.creator.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{streamData.creator.name}</h3>
                      {streamData.creator.isVerified && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      팔로워 {formatNumber(streamData.creator.followers)}명
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        isFollowing
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isFollowing ? '팔로잉' : '팔로우'}
                    </button>
                  )}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isLiked
                        ? 'bg-red-600 text-white scale-110'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{formatNumber(likes || streamData.likes)}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white px-4 py-2 rounded-full transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>공유</span>
                  </button>

                  {streamData.superChatEnabled && isAuthenticated && (
                    <button className="flex items-center gap-2 bg-yellow-600 text-white hover:bg-yellow-700 px-4 py-2 rounded-full transition-colors">
                      <DollarSign className="w-5 h-5" />
                      <span>슈퍼챗</span>
                    </button>
                  )}
                </div>

                <div className="text-gray-400 text-sm">
                  카테고리: {streamData.category}
                </div>
              </div>

              {/* 설명 */}
              {streamData.description && (
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-2">방송 소개</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {streamData.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 채팅 영역 */}
          {streamData.chatEnabled && (
            <div className={`w-full md:w-96 lg:w-[400px] border-l border-gray-800 ${isChatVisible ? 'block' : 'hidden'} md:block`}>
              <ChatRoom
                streamId={streamId}
                enabled={streamData.chatEnabled}
                superChatEnabled={streamData.superChatEnabled}
                isAuthenticated={isAuthenticated}
                user={user}
              />
            </div>
          )}
        </div>

        {/* 모바일 채팅 토글 버튼 */}
        {streamData.chatEnabled && (
          <button
            onClick={() => setIsChatVisible(!isChatVisible)}
            className={`fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all md:hidden ${
              isChatVisible ? 'rotate-45' : ''
            }`}
          >
            💬
          </button>
        )}
      </div>
    </PageLayout>
  )
}