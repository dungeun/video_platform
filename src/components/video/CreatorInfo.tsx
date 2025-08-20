'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CheckCircle, 
  Bell,
  BellOff,
  Users,
  Video,
  Calendar,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Creator {
  id: string
  name: string
  email: string
  avatar?: string
  subscriberCount: number
  isVerified: boolean
  createdAt?: string
  videoCount?: number
  description?: string
}

interface CreatorInfoProps {
  creator: Creator
  isSubscribed: boolean
  onSubscribe: () => void
  className?: string
}

export default function CreatorInfo({ 
  creator, 
  isSubscribed, 
  onSubscribe,
  className = ''
}: CreatorInfoProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`bg-card rounded-lg p-4 space-y-4 ${className}`}>
      {/* 크리에이터 헤더 정보 */}
      <div className="flex items-start space-x-4">
        <Link 
          href={`/channel/${creator.id}`}
          className="flex-shrink-0"
        >
          <Avatar className="w-12 h-12 md:w-14 md:h-14">
            <AvatarImage 
              src={creator.avatar} 
              alt={creator.name}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(creator.name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Link 
              href={`/channel/${creator.id}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {creator.name}
            </Link>
            {creator.isVerified && (
              <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>구독자 {formatNumber(creator.subscriberCount)}명</span>
            </div>

            {creator.videoCount !== undefined && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  <span>동영상 {formatNumber(creator.videoCount)}개</span>
                </div>
              </>
            )}

            {creator.createdAt && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(creator.createdAt), {
                      addSuffix: true,
                      locale: ko
                    })}에 가입
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 크리에이터 설명 */}
          {creator.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {creator.description}
            </p>
          )}
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* 구독/구독 취소 버튼 */}
          <Button
            onClick={onSubscribe}
            variant={isSubscribed ? "outline" : "default"}
            className={`${
              isSubscribed 
                ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950" 
                : "bg-red-600 hover:bg-red-700 text-white"
            } rounded-full px-6`}
          >
            {isSubscribed ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                구독 취소
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                구독
              </>
            )}
          </Button>

          {/* 알림 설정 (구독한 경우에만 표시) */}
          {isSubscribed && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Bell className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 채널 방문 버튼 */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="rounded-full"
        >
          <Link href={`/channel/${creator.id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            채널 보기
          </Link>
        </Button>
      </div>

      {/* 추가 정보 (검증됨, 가입일 등) */}
      <div className="flex flex-wrap gap-2">
        {creator.isVerified && (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            인증된 크리에이터
          </Badge>
        )}
        
        {creator.subscriberCount >= 100000 && (
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            인기 크리에이터
          </Badge>
        )}

        {creator.subscriberCount >= 1000000 && (
          <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
            ⭐ 골드 크리에이터
          </Badge>
        )}
      </div>

      {/* 구독자 수에 따른 특별 메시지 */}
      {creator.subscriberCount >= 1000000 && (
        <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            🎉 100만 구독자를 달성한 크리에이터입니다!
          </p>
        </div>
      )}
    </div>
  )
}