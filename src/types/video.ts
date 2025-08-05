export interface Video {
  id: string
  title: string
  description?: string
  thumbnailUrl: string
  videoUrl?: string
  duration: number // seconds
  viewCount: number
  likeCount?: number
  createdAt: string
  updatedAt?: string
  isLive?: boolean
  isPublic?: boolean
  
  // Creator information
  creator: {
    id: string
    name: string
    profileImage?: string
    isVerified?: boolean
  }
  
  // Video metadata
  category?: string
  tags?: string[]
  quality?: 'low' | 'medium' | 'high' | 'hd' | '4k'
  
  // Platform specific
  platforms?: string[]
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'DELETED'
}

export interface VideoCardProps {
  video: Video
  variant?: 'default' | 'compact' | 'large'
  onClick?: (videoId: string) => void
  showDescription?: boolean
  showCreator?: boolean
  className?: string
}

export interface VideoListProps {
  videos: Video[]
  loading?: boolean
  onVideoClick?: (videoId: string) => void
  variant?: VideoCardProps['variant']
  columns?: number
  className?: string
}

// Campaign을 Video로 변환하는 트랜스포머를 위한 타입
export interface CampaignToVideoTransformer {
  (campaign: any): Video
}

// 비디오 통계 인터페이스
export interface VideoStats {
  totalVideos: number
  totalViews: number
  totalLikes: number
  averageDuration: number
  topCategories: Array<{
    category: string
    count: number
  }>
}