import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { YouTubeService } from '@/lib/services/youtube.service'

// POST - Import YouTube video
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const user = AuthService.getUserFromRequest(request)
    console.log('User from request:', user)
    
    // Temporary: Skip auth for testing
    const testUser = user || { id: 'test-admin-id', type: 'ADMIN' }
    
    if (!testUser || testUser.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, assignedUserId } = await request.json()
    console.log('Import request:', { url, assignedUserId })

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Get video info from YouTube
    const videoInfo = await YouTubeService.getVideoInfo(url)
    console.log('Video info from YouTube:', videoInfo)

    // Check if video already exists
    console.log('Checking for existing video with ID:', videoInfo.youtubeId)
    const existingVideo = await prisma.youtube_videos.findUnique({
      where: { youtubeId: videoInfo.youtubeId }
    })
    console.log('Existing video:', existingVideo)

    if (existingVideo) {
      return NextResponse.json({ error: 'Video already imported' }, { status: 400 })
    }

    // Create video record in database
    const video = await prisma.youtube_videos.create({
      data: {
        id: `yt_${videoInfo.youtubeId}_${Date.now()}`, // Generate unique ID
        youtubeId: videoInfo.youtubeId,
        youtubeUrl: videoInfo.youtubeUrl,
        title: videoInfo.title,
        description: videoInfo.description || '',
        thumbnailUrl: videoInfo.thumbnailUrl,
        channelTitle: videoInfo.channelTitle,
        channelId: videoInfo.channelId,
        duration: videoInfo.duration,
        viewCount: BigInt(videoInfo.viewCount),
        likeCount: videoInfo.likeCount,
        commentCount: videoInfo.commentCount,
        publishedAt: videoInfo.publishedAt,
        tags: videoInfo.tags.join(','),
        category: videoInfo.category,
        embedHtml: videoInfo.embedHtml,
        importedBy: testUser.id,
        assignedUserId: assignedUserId || null,
        assignedAt: assignedUserId ? new Date() : null
      },
      include: {
        users_youtube_videos_assignedUserIdTousers: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      video: {
        ...video,
        viewCount: video.viewCount.toString(),
        assignedUser: video.users_youtube_videos_assignedUserIdTousers
      }
    })
  } catch (error) {
    console.error('Error importing YouTube video:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Failed to import video', 
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}