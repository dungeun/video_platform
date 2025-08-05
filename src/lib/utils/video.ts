import type { Video, CampaignToVideoTransformer } from '@/types/video'

/**
 * 초를 MM:SS 또는 HH:MM:SS 형식으로 변환
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
}

/**
 * 조회수를 K, M 형식으로 변환
 */
export function formatViewCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  } else if (count < 1000000) {
    const k = Math.floor(count / 100) / 10
    return k % 1 === 0 ? `${Math.floor(k)}K` : `${k}K`
  } else if (count < 1000000000) {
    const m = Math.floor(count / 100000) / 10
    return m % 1 === 0 ? `${Math.floor(m)}M` : `${m}M`
  } else {
    const b = Math.floor(count / 100000000) / 10
    return b % 1 === 0 ? `${Math.floor(b)}B` : `${b}B`
  }
}

/**
 * 날짜를 "2일 전", "1주 전" 형식으로 변환
 */
export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return '방금 전'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}분 전`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}시간 전`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}일 전`
  } else if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `${weeks}주 전`
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months}개월 전`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years}년 전`
  }
}

/**
 * Campaign 데이터를 Video 형식으로 변환
 */
export const transformCampaignToVideo: CampaignToVideoTransformer = (campaign: any): Video => {
  return {
    id: campaign.id,
    title: campaign.title || '제목 없음',
    description: campaign.description,
    thumbnailUrl: campaign.thumbnailUrl || campaign.images?.[0] || '/images/video-default-thumbnail.jpg',
    videoUrl: campaign.videoUrl,
    duration: campaign.duration || 0,
    viewCount: campaign.viewCount || 0,
    likeCount: campaign.likeCount || 0,
    createdAt: campaign.createdAt || new Date().toISOString(),
    updatedAt: campaign.updatedAt,
    isLive: campaign.isLive || false,
    isPublic: campaign.status === 'ACTIVE',
    
    creator: {
      id: campaign.businessId || campaign.userId || 'unknown',
      name: campaign.businessName || campaign.userName || '알 수 없음',
      profileImage: campaign.businessLogo || campaign.userProfileImage,
      isVerified: campaign.isVerified || false
    },
    
    category: campaign.category,
    tags: campaign.tags || [],
    platforms: campaign.platforms || [],
    status: campaign.status || 'ACTIVE'
  }
}

/**
 * 여러 Campaign을 Video 배열로 변환
 */
export function transformCampaignsToVideos(campaigns: any[]): Video[] {
  return campaigns.map(transformCampaignToVideo).filter(video => video.id)
}

/**
 * 비디오 카테고리 한글 변환
 */
export function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    'beauty': '뷰티',
    'fashion': '패션',
    'food': '음식',
    'travel': '여행',
    'tech': '기술',
    'lifestyle': '라이프스타일',
    'fitness': '운동',
    'gaming': '게임',
    'music': '음악',
    'education': '교육',
    'entertainment': '엔터테인먼트',
    'news': '뉴스',
    'sports': '스포츠',
    'other': '기타'
  }
  
  return categoryMap[category] || category
}

/**
 * 비디오 품질 라벨 변환
 */
export function getQualityLabel(quality: string): string {
  const qualityMap: Record<string, string> = {
    'low': '360p',
    'medium': '480p', 
    'high': '720p',
    'hd': '1080p',
    '4k': '4K'
  }
  
  return qualityMap[quality] || quality
}

/**
 * 플랫폼 이름 한글 변환
 */
export function getPlatformLabel(platform: string): string {
  const platformMap: Record<string, string> = {
    'youtube': 'YouTube',
    'instagram': 'Instagram',
    'tiktok': 'TikTok',
    'facebook': 'Facebook',
    'twitter': 'Twitter',
    'naver': '네이버',
    'kakao': '카카오'
  }
  
  return platformMap[platform] || platform
}