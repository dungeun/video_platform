import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { YouTubeService } from '@/lib/services/youtube.service'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Import YouTube video
export async function POST(request: NextRequest) {
  try {
    // Check admin auth - JWT 직접 검증
    let user: any = null;
    
    // Check both cookie names for compatibility
    let accessToken = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value
    
    // Also check Authorization header
    if (!accessToken) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7)
      }
    }

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, JWT_SECRET) as any
        user = {
          id: decoded.userId || decoded.id,
          email: decoded.email,
          name: decoded.name,
          type: decoded.type
        }
      } catch (error) {
        console.error('JWT verification error:', error)
      }
    }

    console.log('User from token:', user)
    
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
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
        importedBy: user.id,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({ 
      error: 'Failed to import video', 
      details: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
}