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
import FireworksAnimation from '@/components/animations/FireworksAnimation'
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
  TrendingUp,
  DollarSign,
  Sparkles
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
import type { Video as BaseVideo } from '@/types/video'

// Extended Video interface with API response fields
interface Video extends Omit<BaseVideo, 'creator'> {
  description?: string
  videoUrl: string
  views?: number  // API field name
  likes?: number  // API field name
  dislikes?: number  // API field name
  dislikeCount?: number  // Alternative field name
  status?: 'processing' | 'published' | 'failed' | 'scheduled'
  visibility?: 'public' | 'unlisted' | 'private' | 'scheduled'
  language?: string
  isCommentsEnabled?: boolean
  isRatingsEnabled?: boolean
  ageRestriction?: boolean
  isLiked?: boolean  // User's like status
  isDisliked?: boolean  // User's dislike status
  creator: {
    id: string
    name: string
    handle?: string
    avatar?: string
    profileImage?: string
    subscriberCount?: number
    isVerified?: boolean
    isSubscribed?: boolean  // User's subscription status
  }
}

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
  const [showSuperChatModal, setShowSuperChatModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(30000)
  const [superChatMessage, setSuperChatMessage] = useState('')
  const [sendingSuperChat, setSendingSuperChat] = useState(false)

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
          // API returns video data directly, not wrapped in a "video" property
          setVideo(videoData)
          setIsLiked(videoData.isLiked || false)
          setIsDisliked(videoData.isDisliked || false)
          setLikeCount(videoData.likes || videoData.likeCount || 0)
          setDislikeCount(videoData.dislikes || videoData.dislikeCount || 0)
          setViewCount(videoData.views || videoData.viewCount || 0)
          // Check if creator exists before accessing isSubscribed
          setIsSubscribed(videoData.creator?.isSubscribed || false)
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

  // 슈퍼챗 전송
  const handleSendSuperChat = async () => {
    if (!user) {
      toast({
        title: '로그인 필요',
        description: '슈퍼챗을 보내려면 로그인이 필요합니다.',
        variant: 'destructive'
      })
      return
    }

    try {
      setSendingSuperChat(true)
      
      // 여기에 실제 슈퍼챗 API 호출 로직 추가
      // const response = await fetch(`/api/videos/${params.id}/superchat`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     amount: selectedAmount,
      //     message: superChatMessage
      //   })
      // })

      // 임시로 성공 처리
      setShowSuperChatModal(false)
      setSuperChatMessage('')
      
      // 폭죽 애니메이션 트리거
      triggerFireworks()
      
      toast({
        title: '슈퍼챗 전송 완료!',
        description: `${selectedAmount.toLocaleString()}원을 후원했습니다!`,
        className: 'bg-yellow-500 text-white border-yellow-600'
      })
    } catch (error) {
      console.error('Error sending superchat:', error)
      toast({
        title: '오류',
        description: '슈퍼챗 전송 중 문제가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setSendingSuperChat(false)
    }
  }

  // 폭죽 애니메이션
  const triggerFireworks = () => {
    if (typeof window !== 'undefined') {
      // GSAP 애니메이션은 별도 컴포넌트로 구현
      const event = new CustomEvent('superchat-sent', { 
        detail: { amount: selectedAmount } 
      })
      window.dispatchEvent(event)
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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </PageLayout>
    )
  }

  if (!video) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">비디오를 찾을 수 없습니다</h1>
            <p className="text-gray-400 mb-4">요청하신 비디오가 존재하지 않거나 삭제되었습니다.</p>
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
      <FireworksAnimation />
      <div className="min-h-screen bg-gray-900">
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
              <div className="bg-gray-800/80 rounded-xl p-6">
                <div className="space-y-4">
                  {/* 제목과 메타 정보 */}
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-3">{video.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>조회수 {formatViewCount(viewCount)}회</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimeAgo(video.createdAt)}</span>
                      </div>
                      {video.category && (
                        <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">
                          {getCategoryLabel(video.category)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 크리에이터 정보 */}
                  <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                    <Link href={`/creators/${video.creator.id}`} className="flex items-center gap-3 group">
                      <div className="w-12 h-12 rounded-full bg-gray-600 overflow-hidden">
                        {video.creator.profileImage ? (
                          <Image
                            src={video.creator.profileImage}
                            alt={video.creator.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white group-hover:text-indigo-400">
                            {video.creator.name}
                          </h3>
                          {video.creator.isVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">구독자 1.2만명</p>
                      </div>
                    </Link>
                    
                    <Button
                      onClick={handleSubscribe}
                      variant={isSubscribed ? "outline" : "default"}
                      className={isSubscribed ? "text-gray-300 border-gray-600" : "bg-red-600 hover:bg-red-700"}
                    >
                      {isSubscribed ? '구독 중' : '구독'}
                    </Button>
                  </div>

                  {/* 인터랙션 버튼들 */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-gray-700/50 rounded-full overflow-hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLike}
                          className={`rounded-none px-4 py-2 hover:bg-gray-600 ${isLiked ? 'text-indigo-400' : 'text-gray-300'}`}
                        >
                          <ThumbsUp className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                          {formatViewCount(likeCount)}
                        </Button>
                        <div className="w-px h-6 bg-gray-600" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDislike}
                          className={`rounded-none px-4 py-2 hover:bg-gray-600 ${isDisliked ? 'text-red-400' : 'text-gray-300'}`}
                        >
                          <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
                          {dislikeCount > 0 && formatViewCount(dislikeCount)}
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => setShowCommentModal(true)}
                        className="bg-gray-700/50 text-gray-300 hover:bg-gray-600 hover:text-white px-4 py-2"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        댓글
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => setShowSuperChatModal(true)}
                        className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 px-4 py-2 font-medium"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        슈퍼챗
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        공유
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 탭 메뉴 */}
                  <Tabs defaultValue="description" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-700/50">
                      <TabsTrigger value="description" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-600">설명</TabsTrigger>
                      <TabsTrigger value="comments" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-600">댓글 ({comments.length})</TabsTrigger>
                    </TabsList>

                  {/* 설명 탭 */}
                  <TabsContent value="description" className="mt-6">
                    <div className="space-y-4">
                      {video.description && (
                        <div>
                          <h3 className="font-semibold text-white mb-2">설명</h3>
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {video.description}
                          </p>
                        </div>
                      )}
                      
                      {video.tags && video.tags.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-white mb-2">태그</h3>
                          <div className="flex flex-wrap gap-2">
                            {video.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-indigo-900 text-indigo-300 rounded-full text-sm">
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
                        <h3 className="font-semibold text-white">댓글 {comments.length}개</h3>
                        <Button
                          size="sm"
                          onClick={() => setShowCommentModal(true)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          댓글 작성
                        </Button>
                      </div>
                      
                      {commentsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                        </div>
                      ) : comments.length > 0 ? (
                        <div className="space-y-4">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0">
                                {comment.author.profileImage ? (
                                  <Image
                                    src={comment.author.profileImage}
                                    alt={comment.author.name}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-white">{comment.author.name}</span>
                                  {comment.author.isVerified && (
                                    <CheckCircle className="w-3 h-3 text-blue-400" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300">{comment.content}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700">
                                    <ThumbsUp className="w-3 h-3 mr-1" />
                                    {comment.likeCount}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-gray-700">
                                    답글
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                          <p>첫 번째 댓글을 작성해보세요!</p>
                        </div>
                      )}
                    </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* 오른쪽: 관련 비디오 */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
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

      {/* 슈퍼챗 모달 */}
      <Dialog open={showSuperChatModal} onOpenChange={setShowSuperChatModal}>
        <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              슈퍼챗 보내기
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              크리에이터를 응원하는 메시지와 함께 후원하세요!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 금액 선택 */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-3 block">후원 금액 선택</label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={selectedAmount === 30000 ? "default" : "outline"}
                  onClick={() => setSelectedAmount(30000)}
                  className={selectedAmount === 30000 
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  3만원
                </Button>
                <Button
                  variant={selectedAmount === 50000 ? "default" : "outline"}
                  onClick={() => setSelectedAmount(50000)}
                  className={selectedAmount === 50000 
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  5만원
                </Button>
                <Button
                  variant={selectedAmount === 100000 ? "default" : "outline"}
                  onClick={() => setSelectedAmount(100000)}
                  className={selectedAmount === 100000 
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  10만원
                </Button>
              </div>
            </div>
            
            {/* 메시지 입력 */}
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">응원 메시지 (선택)</label>
              <Textarea
                placeholder="크리에이터에게 전하고 싶은 메시지를 남겨주세요..."
                value={superChatMessage}
                onChange={(e) => setSuperChatMessage(e.target.value)}
                className="min-h-[80px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{superChatMessage.length}/200</p>
            </div>
            
            {/* 후원 정보 */}
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">후원 금액</span>
                <span className="text-xl font-bold text-yellow-400">
                  ₩{selectedAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                * 후원금은 크리에이터에게 전달되며, 환불이 불가능합니다.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuperChatModal(false)
                setSuperChatMessage('')
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              취소
            </Button>
            <Button
              onClick={handleSendSuperChat}
              disabled={sendingSuperChat}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {sendingSuperChat ? '전송 중...' : `₩${selectedAmount.toLocaleString()} 후원하기`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 댓글 작성 모달 */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">댓글 작성</DialogTitle>
            <DialogDescription className="text-gray-400">
              이 비디오에 대한 의견을 남겨주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCommentModal(false)
                setNewComment('')
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submittingComment ? '작성 중...' : '댓글 작성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}