import { useCachedData } from './useCachedData'
import { useAuth } from './useAuth'

// 캠페인 데이터 캐싱
export function useCampaignData(campaignId: string) {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch campaign')
      const data = await response.json()
      return data.campaign
    },
    {
      key: `campaign_${campaignId}`,
      ttl: 10 * 60 * 1000, // 10분
      staleWhileRevalidate: true
    }
  )
}

// 비즈니스 정보 캐싱
export function useBusinessData(businessId: string) {
  return useCachedData(
    async () => {
      const response = await fetch(`/api/business/${businessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch business')
      return response.json()
    },
    {
      key: `business_${businessId}`,
      ttl: 30 * 60 * 1000, // 30분
      staleWhileRevalidate: true
    }
  )
}

// 인플루언서 통계 캐싱
export function useInfluencerStats() {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch('/api/influencer/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    {
      key: `influencer_stats_${user?.id}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 템플릿 데이터 캐싱
export function useTemplates(type: 'campaign' | 'application') {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const endpoint = type === 'campaign' 
        ? '/api/business/campaign-templates'
        : '/api/application-templates'
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      return data.templates
    },
    {
      key: `${type}_templates_${user?.id}`,
      ttl: 15 * 60 * 1000, // 15분
      staleWhileRevalidate: true
    }
  )
}

// 좋아요한 캠페인 목록 캐싱
export function useLikedCampaigns(page = 1, limit = 20) {
  const { user } = useAuth()
  
  return useCachedData(
    async () => {
      const response = await fetch(
        `/api/mypage/liked-campaigns?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          }
        }
      )
      
      if (!response.ok) throw new Error('Failed to fetch liked campaigns')
      return response.json()
    },
    {
      key: `liked_campaigns_${user?.id}_${page}_${limit}`,
      ttl: 5 * 60 * 1000, // 5분
      staleWhileRevalidate: true
    }
  )
}

// 캠페인 목록 캐싱 (필터 포함)
export function useCampaignList(filters: any = {}) {
  const filterKey = JSON.stringify(filters)
  
  return useCachedData(
    async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value))
      })
      
      const response = await fetch(`/api/campaigns?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
    {
      key: `campaigns_${filterKey}`,
      ttl: 3 * 60 * 1000, // 3분 (자주 변경되는 데이터)
      staleWhileRevalidate: true
    }
  )
}