import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { transformCampaignToVideo } from '@/lib/utils/video'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        videos: [],
        channels: [],
        tags: []
      })
    }

    const results: any = {}

    // 비디오 검색 (캠페인을 비디오로 변환)
    if (type === 'videos' || type === 'all') {
      const campaigns = await prisma.campaign.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { hashtags: { some: { contains: query.replace('#', ''), mode: 'insensitive' } } }
          ],
          status: 'ACTIVE',
          OR: [
            { imageUrl: { not: null } }, // Use imageUrl instead of videoUrl for now
            { status: 'ACTIVE' } // Just ensure it's active for now
          ]
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              businessProfile: {
                select: {
                  companyName: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true,
              likes: true
            }
          }
        },
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      })

      results.videos = campaigns.map(campaign => {
        const video = transformCampaignToVideo(campaign)
        return {
          id: video.id,
          title: video.title,
          viewCount: video.viewCount,
          channelName: video.creator.name,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          createdAt: video.createdAt
        }
      })
    }

    // 채널 검색 (비즈니스 계정)
    if (type === 'channels' || type === 'all') {
      const businesses = await prisma.business.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { 
              businessProfile: {
                companyName: { contains: query, mode: 'insensitive' }
              }
            }
          ]
        },
        include: {
          businessProfile: {
            select: {
              companyName: true,
              businessCategory: true
            }
          },
          campaigns: {
            where: { status: 'ACTIVE' },
            select: { id: true }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit
      })

      results.channels = businesses.map(business => ({
        id: business.id,
        name: business.businessProfile?.companyName || business.name || '크리에이터',
        subscriberCount: Math.floor(Math.random() * 50000) + 1000, // 임시 데이터
        videoCount: business.campaigns.length,
        category: business.businessProfile?.businessCategory,
        avatarUrl: business.logo
      }))
    }

    // 인기 태그 검색
    if (type === 'tags' || type === 'all') {
      // 태그는 캠페인의 hashtags에서 추출
      const tagResults = await prisma.campaign.findMany({
        where: {
          hashtags: {
            some: {
              contains: query.replace('#', ''),
              mode: 'insensitive'
            }
          },
          status: 'ACTIVE'
        },
        select: {
          hashtags: true
        },
        take: 50 // 더 많은 캠페인에서 태그 추출
      })

      // 태그 빈도 계산
      const tagCounts: Record<string, number> = {}
      tagResults.forEach(campaign => {
        campaign.hashtags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            const cleanTag = tag.replace('#', '')
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1
          }
        })
      })

      // 빈도순으로 정렬하여 상위 태그 반환
      results.tags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({
          tag: `#${tag}`,
          count
        }))
    }

    return NextResponse.json({
      success: true,
      ...results
    })

  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load search suggestions',
        videos: [],
        channels: [],
        tags: []
      },
      { status: 500 }
    )
  }
}