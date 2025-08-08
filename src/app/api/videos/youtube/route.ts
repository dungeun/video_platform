import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Mock data for development when database is not available
const mockVideos = [
  {
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
  },
  {
    id: 'mock-2',
    youtubeId: 'jNQXAC9IVRw',
    youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    title: 'Sample Video 2',
    description: 'Another sample video for testing.',
    thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    channelTitle: 'Test Channel',
    channelId: 'UC_test',
    duration: 'PT2M15S',
    viewCount: '500000',
    likeCount: '25000',
    commentCount: '500',
    publishedAt: new Date().toISOString(),
    tags: 'test, demo',
    category: 'Education',
    embedHtml: null,
    assignedUserId: null,
    assignedAt: null,
    importedBy: 'system',
    importedAt: new Date().toISOString(),
    status: 'imported',
    featured: false,
    displayOrder: 1
  }
];

// GET - Fetch YouTube videos (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // If database connection is skipped (local development), return mock data
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      const searchParams = request.nextUrl.searchParams
      const featured = searchParams.get('featured') === 'true'
      const limit = parseInt(searchParams.get('limit') || '10')
      const category = searchParams.get('category')

      let filteredVideos = [...mockVideos];

      if (featured) {
        filteredVideos = filteredVideos.filter(v => v.featured);
      }

      if (category) {
        filteredVideos = filteredVideos.filter(v => v.category === category);
      }

      const limitedVideos = filteredVideos.slice(0, limit);

      const serializedVideos = limitedVideos.map(video => ({
        ...video,
        viewCount: video.viewCount?.toString() || '0',
        likeCount: video.likeCount?.toString() || '0',
        commentCount: video.commentCount?.toString() || '0',
        duration: parseDuration(video.duration || 'PT0S'),
        assignedUser: null
      }));

      return NextResponse.json({ videos: serializedVideos });
    }

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