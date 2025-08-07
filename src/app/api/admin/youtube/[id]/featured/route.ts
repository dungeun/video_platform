import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// PUT - Toggle featured status
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

    const { featured } = await request.json()

    const video = await prisma.youtube_videos.update({
      where: { id: params.id },
      data: { featured }
    })

    return NextResponse.json({ 
      success: true, 
      video: {
        ...video,
        viewCount: video.viewCount.toString()
      }
    })
  } catch (error) {
    console.error('Error updating featured status:', error)
    return NextResponse.json({ error: 'Failed to update featured' }, { status: 500 })
  }
}