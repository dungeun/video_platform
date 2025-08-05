import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { AuthService } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET - Get single video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching YouTube video:', params.id)
    
    const video = await prisma.youTubeVideo.findUnique({
      where: { id: params.id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          }
        }
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        youtubeUrl: video.youtubeUrl,
        youtubeId: video.youtubeId,
        channelTitle: video.channelTitle,
        publishedAt: video.publishedAt,
        duration: 0, // YouTube duration is stored as string, needs conversion
        viewCount: video.viewCount?.toString() || '0',
        likeCount: video.likeCount?.toString() || '0',
        commentCount: video.commentCount?.toString() || '0',
        category: video.category,
        featured: video.featured,
        assignedUser: video.assignedUser,
        videoUrl: null // YouTube videos don't have direct video files yet
      }
    })
  } catch (error) {
    console.error('YouTube video fetch error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to fetch video', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Delete video
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin auth
    const user = AuthService.getUserFromRequest(request)
    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.youTubeVideo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}