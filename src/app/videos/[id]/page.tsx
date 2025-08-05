'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import PageLayout from '@/components/layouts/PageLayout'
import { VideoListVertical } from '@/components/video/VideoList'
import VideoPlayer from '@/components/video/VideoPlayer'
import { 
  Heart, 
  Share2, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Calendar,
  User,
  CheckCircle,
  MoreVertical,
  MessageCircle,
  TrendingUp
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDuration, formatViewCount, formatTimeAgo, getCategoryLabel } from '@/lib/utils/video'
import { transformCampaignToVideo } from '@/lib/utils/video'
import type { Video } from '@/types/video'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    profileImage?: string
    isVerified?: boolean
  }
  createdAt: string
  likeCount: number
  isLiked?: boolean
  replies?: Comment[]
}

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  
  // 비디오 플레이어 상태 - VideoPlayer 컴포넌트에서 관리
  const [currentVideoTime, setCurrentVideoTime] = useState(0)
  
  // 인터랙션 상태
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [dislikeCount, setDislikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  // 댓글 상태
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // 비디오 데이터 로드
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true)
        
        // 먼저 비디오 API 시도
        const videoResponse = await fetch(`/api/videos/${params.id}`, {
          headers: user ? {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          } : {}
        })
        
        if (videoResponse.ok) {
          const videoData = await videoResponse.json()
          setVideo(videoData.video)
          setIsLiked(videoData.video.isLiked || false)
          setIsDisliked(videoData.video.isDisliked || false)
          setLikeCount(videoData.video.likeCount || 0)
          setDislikeCount(videoData.video.dislikeCount || 0)
          setViewCount(videoData.video.viewCount || 0)
          setIsSubscribed(videoData.video.creator.isSubscribed || false)
        } else {
          // 비디오가 없으면 캠페인을 비디오로 변환하여 표시
          const campaignResponse = await fetch(`/api/campaigns/${params.id}`, {
            headers: user ? {
              'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
            } : {}
          })
          
          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json()
            const convertedVideo = transformCampaignToVideo(campaignData.campaign)
            setVideo(convertedVideo)
            setIsLiked(campaignData.campaign.isLiked || false)
            setLikeCount(campaignData.campaign._count?.likes || 0)
            setViewCount(convertedVideo.viewCount)
          } else {
            throw new Error('Video not found')
          }
        }
        
        // 관련 비디오 로드
        await loadRelatedVideos()
        
      } catch (error) {
        console.error('Failed to load video:', error)
        toast({
          title: '오류',
          description: '비디오를 불러올 수 없습니다.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [params.id, user, toast])

  // 관련 비디오 로드
  const loadRelatedVideos = async () => {
    try {
      const response = await fetch('/api/videos?limit=10')
      if (response.ok) {
        const data = await response.json()
        setRelatedVideos(data.videos.filter((v: Video) => v.id !== params.id))
      }
    } catch (error) {
      console.error('Failed to load related videos:', error)
    }
  }

  // 댓글 로드
  const loadComments = async () => {
    try {
      setCommentsLoading(true)
      const response = await fetch(`/api/videos/${params.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  // 좋아요/싫어요 처리
  const handleLike = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '좋아요를 누르려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/videos/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setIsDisliked(false) // 좋아요를 누르면 싫어요 해제
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
        if (isDisliked && data.liked) {
          setDislikeCount(prev => prev - 1)
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: '오류',
        description: '좋아요 처리 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const handleDislike = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '싫어요를 누르려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/videos/${params.id}/dislike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsDisliked(data.disliked)
        setIsLiked(false) // 싫어요를 누르면 좋아요 해제
        setDislikeCount(prev => data.disliked ? prev + 1 : prev - 1)
        if (isLiked && data.disliked) {
          setLikeCount(prev => prev - 1)
        }
      }
    } catch (error) {
      console.error('Error toggling dislike:', error)
      toast({
        title: '오류',
        description: '싫어요 처리 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 구독 처리
  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '구독하려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/users/${video?.creator.id}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIsSubscribed(data.subscribed)
        toast({
          title: data.subscribed ? '구독 완료' : '구독 취소',
          description: data.subscribed ? '크리에이터를 구독했습니다.' : '구독을 취소했습니다.'
        })
      }
    } catch (error) {
      console.error('Error toggling subscribe:', error)
      toast({
        title: '오류',
        description: '구독 처리 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  // 공유 처리
  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title,
          text: video?.description,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      toast({
        title: '링크 복사됨',
        description: '비디오 링크가 클립보드에 복사되었습니다.'
      })
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '댓글을 작성하려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`/api/videos/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        setShowCommentModal(false)
        toast({
          title: '댓글 작성 완료',
          description: '댓글이 성공적으로 작성되었습니다.'
        })
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast({
        title: '오류',
        description: '댓글 작성 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    )
  }

  if (!video) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">비디오를 찾을 수 없습니다</h1>
            <p className="text-gray-600 mb-4">요청하신 비디오가 존재하지 않거나 삭제되었습니다.</p>
            <Button asChild>
              <Link href="/videos">비디오 목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
        {/* 뒤로가기 버튼 */}
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="container mx-auto px-6 py-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로가기
            </Button>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 비디오 플레이어 및 정보 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 비디오 플레이어 */}
              <VideoPlayer
                videoUrl={video.videoUrl}
                thumbnailUrl={video.thumbnailUrl}
                title={video.title}
                duration={video.duration}
                onTimeUpdate={setCurrentVideoTime}
                onPlay={() => {
                  // 조회수 증가 로직을 여기에 추가할 수 있음
                  console.log('Video started playing')
                }}
              />

              {/* 비디오 정보 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>조회수 {formatViewCount(viewCount)}회</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimeAgo(video.createdAt)}</span>
                      </div>
                      {video.category && (
                        <Badge variant="secondary">
                          {getCategoryLabel(video.category)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      공유
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 크리에이터 정보 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                  <Link href={`/creators/${video.creator.id}`} className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {video.creator.profileImage ? (
                        <Image
                          src={video.creator.profileImage}
                          alt={video.creator.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                          {video.creator.name}
                        </h3>
                        {video.creator.isVerified && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">구독자 1.2만명</p>
                    </div>
                  </Link>
                  
                  <Button
                    onClick={handleSubscribe}
                    variant={isSubscribed ? "outline" : "default"}
                    className={isSubscribed ? "text-gray-600" : "bg-red-600 hover:bg-red-700"}
                  >
                    {isSubscribed ? '구독 중' : '구독'}
                  </Button>
                </div>

                {/* 인터랙션 버튼들 */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center bg-gray-100 rounded-full overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={`rounded-none px-4 ${isLiked ? 'text-indigo-600' : ''}`}
                    >
                      <ThumbsUp className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                      {formatViewCount(likeCount)}
                    </Button>
                    <div className="w-px h-6 bg-gray-300" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDislike}
                      className={`rounded-none px-4 ${isDisliked ? 'text-red-600' : ''}`}
                    >
                      <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
                      {dislikeCount > 0 && formatViewCount(dislikeCount)}
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCommentModal(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    댓글
                  </Button>
                </div>

                {/* 탭 메뉴 */}
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="description">설명</TabsTrigger>
                    <TabsTrigger value="comments">댓글 ({comments.length})</TabsTrigger>
                  </TabsList>

                  {/* 설명 탭 */}
                  <TabsContent value="description" className="mt-6">
                    <div className="space-y-4">
                      {video.description && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">설명</h3>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {video.description}
                          </p>
                        </div>
                      )}
                      
                      {video.tags && video.tags.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">태그</h3>
                          <div className="flex flex-wrap gap-2">
                            {video.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* 댓글 탭 */}
                  <TabsContent value="comments" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">댓글 {comments.length}개</h3>
                        <Button
                          size="sm"
                          onClick={() => setShowCommentModal(true)}
                        >
                          댓글 작성
                        </Button>
                      </div>
                      
                      {commentsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                      ) : comments.length > 0 ? (
                        <div className="space-y-4">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0">
                                {comment.author.profileImage ? (
                                  <Image
                                    src={comment.author.profileImage}
                                    alt={comment.author.name}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author.name}</span>
                                  {comment.author.isVerified && (
                                    <CheckCircle className="w-3 h-3 text-blue-500" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                    {comment.likeCount}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                    답글
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>첫 번째 댓글을 작성해보세요!</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* 오른쪽: 관련 비디오 */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  관련 비디오
                </h3>
                
                <VideoListVertical
                  videos={relatedVideos}
                  loading={false}
                  onVideoClick={(videoId) => router.push(`/videos/${videoId}`)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 작성 모달 */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>댓글 작성</DialogTitle>
            <DialogDescription>
              이 비디오에 대한 의견을 남겨주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCommentModal(false)
                setNewComment('')
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
            >
              {submittingComment ? '작성 중...' : '댓글 작성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}