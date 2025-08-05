'use client'

import { useState, useEffect } from 'react'
import { apiGet } from '@/lib/api/client'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { DollarSign } from 'lucide-react'

interface SuperChat {
  id: string
  amount: number
  message?: string
  color: string
  createdAt: string
  user: {
    id: string
    name?: string
    email: string
    profile?: {
      profileImage?: string
    }
  }
}

interface SuperChatListProps {
  channelId?: string
  videoId?: string
  streamId?: string
  showChannel?: boolean
}

export default function SuperChatList({ 
  channelId, 
  videoId, 
  streamId,
  showChannel = false 
}: SuperChatListProps) {
  const [superChats, setSuperChats] = useState<SuperChat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)

  useEffect(() => {
    loadSuperChats()
  }, [channelId, videoId, streamId])

  const loadSuperChats = async (loadMore = false) => {
    try {
      const params = new URLSearchParams()
      if (channelId) params.append('channelId', channelId)
      if (videoId) params.append('videoId', videoId)
      if (streamId) params.append('streamId', streamId)
      if (loadMore && cursor) params.append('cursor', cursor)
      params.append('limit', '20')

      const response = await apiGet(`/api/superchat?${params.toString()}`)
      
      if (loadMore) {
        setSuperChats(prev => [...prev, ...response.superChats])
      } else {
        setSuperChats(response.superChats)
      }
      
      setHasMore(response.hasMore)
      setCursor(response.nextCursor)
    } catch (error) {
      console.error('Failed to load super chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
        ))}
      </div>
    )
  }

  if (superChats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 SuperChat이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {superChats.map((superChat) => (
        <div
          key={superChat.id}
          className="rounded-lg p-4 text-white shadow-lg transform transition-all hover:scale-105"
          style={{ backgroundColor: superChat.color }}
        >
          <div className="flex items-start gap-3">
            {/* 프로필 이미지 */}
            <div className="flex-shrink-0">
              {superChat.user.profile?.profileImage ? (
                <img
                  src={superChat.user.profile.profileImage}
                  alt={superChat.user.name || superChat.user.email}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {(superChat.user.name || superChat.user.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">
                  {superChat.user.name || superChat.user.email}
                </span>
                <span className="text-sm opacity-75">
                  {formatDistanceToNow(new Date(superChat.createdAt), { 
                    addSuffix: true,
                    locale: ko 
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-bold text-lg">
                  {superChat.amount.toLocaleString()}원
                </span>
              </div>

              {superChat.message && (
                <p className="text-sm break-words">
                  {superChat.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => loadSuperChats(true)}
          className="w-full py-3 text-center text-gray-600 hover:text-gray-800 font-medium"
        >
          더 보기
        </button>
      )}
    </div>
  )
}