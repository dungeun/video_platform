import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// PUT - Update video status
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

    const { status } = await request.json()

    if (!['imported', 'published', 'hidden'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const video = await prisma.youtube_videos.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json({ 
      success: true, 
      video: {
        ...video,
        viewCount: video.viewCount.toString()
      }
    })
  } catch (error) {
    console.error('Error updating video status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}