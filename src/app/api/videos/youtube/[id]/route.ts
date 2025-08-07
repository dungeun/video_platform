import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET - Fetch single YouTube video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const video = await prisma.youtube_videos.findUnique({
      where: {
        id: params.id
      },
      include: {
        users_youtube_videos_assignedUserIdTousers: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Serialize BigInt fields to strings for JSON response
    const serializedVideo = {
      ...video,
      viewCount: video.viewCount?.toString() || '0',
      likeCount: video.likeCount?.toString() || '0',
      commentCount: video.commentCount?.toString() || '0',
      duration: parseDuration(video.duration || 'PT0S'),
      assignedUser: video.users_youtube_videos_assignedUserIdTousers
    }

    return NextResponse.json({ video: serializedVideo })
  } catch (error) {
    console.error('Error fetching YouTube video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
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