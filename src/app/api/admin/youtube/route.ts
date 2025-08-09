import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET - Fetch all YouTube videos
export async function GET(request: NextRequest) {
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
    
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const videos = await prisma.youtube_videos.findMany({
      include: {
        users_youtube_videos_assignedUserIdTousers: {
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
      commentCount: video.commentCount?.toString() || '0',
      assignedUser: video.users_youtube_videos_assignedUserIdTousers
    }))

    return NextResponse.json({ videos: serializedVideos })
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}