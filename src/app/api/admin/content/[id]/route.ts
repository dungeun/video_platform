import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 미들웨어에서 설정한 헤더에서 사용자 정보 가져오기
    const userType = request.headers.get('x-user-type')
    const userId = request.headers.get('x-user-id')
    
    if (!userType || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { status } = await request.json()
    const contentId = params.id

    // 콘텐츠 상태 업데이트
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: { 
        status,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      content: updatedContent
    })

  } catch (error) {
    console.error('Content status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}