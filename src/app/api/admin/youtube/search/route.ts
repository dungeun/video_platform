import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { YouTubeService } from '@/lib/services/youtube.service'

// POST - Search YouTube videos
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const user = AuthService.getUserFromRequest(request)
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, limit = 10 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Search videos on YouTube
    const videos = await YouTubeService.searchVideos(query, limit)

    // Get existing video IDs to check for duplicates
    const existingVideos = await prisma.youtube_videos.findMany({
      where: {
        youtubeId: {
          in: videos.map(v => v.youtubeId)
        }
      },
      select: {
        youtubeId: true
      }
    })

    const existingIds = new Set(existingVideos.map(v => v.youtubeId))

    // Mark videos that are already imported
    const videosWithStatus = videos.map(video => ({
      ...video,
      viewCount: video.viewCount.toString(),
      alreadyImported: existingIds.has(video.youtubeId)
    }))

    return NextResponse.json({ 
      success: true, 
      videos: videosWithStatus 
    })
  } catch (error) {
    console.error('Error searching YouTube videos:', error)
    return NextResponse.json({ 
      error: 'Failed to search videos', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}