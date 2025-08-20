'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  MoreVertical,
  Flag,
  Heart,
  Pin,
  Send,
  SortAsc,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    isCreator?: boolean
    isVerified?: boolean
  }
  likes: number
  dislikes: number
  replies?: Comment[]
  createdAt: string
  isPinned?: boolean
  isHearted?: boolean
  userReaction?: 'like' | 'dislike' | null
}

interface CommentSectionProps {
  videoId: string
  commentsEnabled: boolean
}

export default function CommentSection({ videoId, commentsEnabled }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('popular')
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [user, setUser] = useState<{ id: string; name: string; avatar?: string } | null>(null)

  // 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }

    loadUser()
  }, [])

  // 댓글 로드
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/videos/${videoId}/comments?sort=${sortBy}`)
        
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (commentsEnabled) {
      loadComments()
    }
  }, [videoId, sortBy, commentsEnabled])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments(prev => [newCommentData, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    }
  }

  const handleReaction = async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const updatedCounts = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes: updatedCounts.likes,
                dislikes: updatedCounts.dislikes,
                userReaction: updatedCounts.userReaction
              }
            : comment
        ))
      }
    } catch (error) {
      console.error('Failed to react to comment:', error)
    }
  }

  const handleReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !user) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/comments/${parentCommentId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: replyText.trim()
        })
      })

      if (response.ok) {
        const replyData = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === parentCommentId
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), replyData]
              }
            : comment
        ))
        setReplyText('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
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

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex space-x-3 ${isReply ? 'ml-12' : ''}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
        <AvatarFallback className="text-xs">
          {getInitials(comment.author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {comment.author.name}
          </span>
          
          {comment.author.isCreator && (
            <Badge variant="secondary" className="text-xs">
              크리에이터
            </Badge>
          )}
          
          {comment.author.isVerified && (
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
          
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: ko
            })}
          </span>
          
          {comment.isPinned && (
            <Pin className="w-3 h-3 text-muted-foreground" />
          )}
          
          {comment.isHearted && (
            <Heart className="w-3 h-3 text-red-500 fill-current" />
          )}
        </div>

        <p className="text-sm text-foreground whitespace-pre-wrap mb-2">
          {comment.content}
        </p>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(comment.id, 'like')}
              className={`h-6 px-2 text-xs ${
                comment.userReaction === 'like' 
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              {comment.likes > 0 && formatNumber(comment.likes)}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(comment.id, 'dislike')}
              className={`h-6 px-2 text-xs ${
                comment.userReaction === 'dislike' 
                  ? 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>

          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              답글
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Flag className="w-4 h-4 mr-2" />
                신고하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 답글 작성 폼 */}
        {replyingTo === comment.id && user && (
          <div className="mt-3 flex space-x-2">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="답글 추가..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyText('')
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim()}
                >
                  답글
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 답글 표시 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {!showReplies[comment.id] ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: true }))}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                {comment.replies.length}개의 답글 보기
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: false }))}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                >
                  답글 숨기기
                </Button>
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (!commentsEnabled) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">이 동영상은 댓글이 비활성화되어 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          댓글 {comments.length > 0 && formatNumber(comments.length)}개
        </h3>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <SortAsc className="w-4 h-4 mr-2" />
                {sortBy === 'popular' ? '인기순' : '최신순'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                인기순
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('latest')}>
                최신순
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      {user ? (
        <div className="flex space-x-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="댓글 추가..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end space-x-2 mt-3">
              <Button
                variant="ghost"
                onClick={() => setNewComment('')}
                disabled={!newComment}
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                댓글
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground mb-3">댓글을 작성하려면 로그인해주세요.</p>
          <Button asChild>
            <a href="/auth/login">로그인</a>
          </Button>
        </div>
      )}

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
        </div>
      )}
    </div>
  )
}