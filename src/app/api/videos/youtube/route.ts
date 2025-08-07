import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET - Fetch YouTube videos (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')

    const where: any = {}

    if (featured) {
      where.featured = true
    }

    if (category) {
      where.category = category
    }

    const videos = await prisma.youtube_videos.findMany({
      where,
      include: {
        users_youtube_videos_assignedUserIdTousers: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { featured: 'desc' },
        { displayOrder: 'asc' },
        { publishedAt: 'desc' }
      ],
      take: limit
    })

    // Serialize BigInt fields to strings for JSON response
    const serializedVideos = videos.map(video => ({
      ...video,
      viewCount: video.viewCount?.toString() || '0',
      likeCount: video.likeCount?.toString() || '0',
      commentCount: video.commentCount?.toString() || '0',
      duration: parseDuration(video.duration || 'PT0S'),
      assignedUser: video.users_youtube_videos_assignedUserIdTousers
    }))

    return NextResponse.json({ videos: serializedVideos })
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

// Parse ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}