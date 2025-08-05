import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = await verifyJWT(token)
    const userId = payload.userId
    const videoId = params.id

    // 캠페인에는 dislike 기능이 없으므로 임시로 시뮬레이션
    // 실제 비디오 테이블이 생기면 실제 dislike 기능 구현
    
    // 현재는 항상 false를 반환 (캠페인에는 dislike가 없음)
    return NextResponse.json({
      success: true,
      disliked: false,
      dislikeCount: 0
    })

  } catch (error) {
    console.error('Error toggling video dislike:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}