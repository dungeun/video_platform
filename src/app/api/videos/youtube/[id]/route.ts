import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Mock data for development when database is not available
const mockVideo = {
  id: 'mock-1',
  youtubeId: 'dQw4w9WgXcQ',
  youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'Sample Video 1',
  description: 'This is a sample video for testing purposes.',
  thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  channelTitle: 'Sample Channel',
  channelId: 'UC_sample',
  duration: 'PT3M33S',
  viewCount: '1000000',
  likeCount: '50000',
  commentCount: '1000',
  publishedAt: new Date().toISOString(),
  tags: 'sample, test',
  category: 'Entertainment',
  embedHtml: null,
  assignedUserId: null,
  assignedAt: null,
  importedBy: 'system',
  importedAt: new Date().toISOString(),
  status: 'imported',
  featured: true,
  displayOrder: 0
};

// GET - Fetch single YouTube video
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // If database connection is skipped (local development), return mock data
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      const serializedVideo = {
        ...mockVideo,
        id: params.id, // Use the requested ID
        viewCount: mockVideo.viewCount?.toString() || '0',
        likeCount: mockVideo.likeCount?.toString() || '0',
        commentCount: mockVideo.commentCount?.toString() || '0',
        duration: parseDuration(mockVideo.duration || 'PT0S'),
        assignedUser: null
      };

      return NextResponse.json({ video: serializedVideo });
    }

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