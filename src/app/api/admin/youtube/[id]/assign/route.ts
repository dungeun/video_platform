import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// PUT - Assign video to user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin auth
    const user = AuthService.getUserFromRequest(request)
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()

    const video = await prisma.youtube_videos.update({
      where: { id: params.id },
      data: {
        assignedUserId: userId || null,
        assignedAt: userId ? new Date() : null
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
    console.error('Error assigning video:', error)
    return NextResponse.json({ error: 'Failed to assign video' }, { status: 500 })
  }
}