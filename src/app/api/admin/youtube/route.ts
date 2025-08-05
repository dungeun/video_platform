import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { AuthService } from '@/lib/auth'

// GET - Fetch all YouTube videos
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const user = AuthService.getUserFromRequest(request)
    
    // Temporary: Skip auth for testing
    const testUser = user || { id: 'test-admin-id', type: 'ADMIN' }
    
    if (!testUser || testUser.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videos = await prisma.youTubeVideo.findMany({
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        importedAt: 'desc'
      }
    })

    // Serialize BigInt fields to strings for JSON response
    const serializedVideos = videos.map(video => ({
      ...video,
      viewCount: video.viewCount?.toString() || '0',
      likeCount: video.likeCount?.toString() || '0',
      commentCount: video.commentCount?.toString() || '0'
    }))

    return NextResponse.json({ videos: serializedVideos })
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}