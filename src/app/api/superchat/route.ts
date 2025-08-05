import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// SuperChat 색상 티어 설정
const getSuperChatColor = (amount: number) => {
  if (amount >= 50000) return '#ff0000' // 빨간색 - 5만원 이상
  if (amount >= 10000) return '#ff9500' // 주황색 - 1만원 이상
  if (amount >= 5000) return '#ffd700' // 노란색 - 5천원 이상
  if (amount >= 1000) return '#1de9b6' // 민트색 - 1천원 이상
  return '#1e88e5' // 파란색 - 기본
}

// POST - SuperChat 보내기
export async function POST(request: NextRequest) {
  try {
    const user = AuthService.getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { channelId, videoId, streamId, amount, message } = await request.json()

    if (!channelId || !amount) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    if (amount < 100) {
      return NextResponse.json({ error: '최소 100원 이상 후원 가능합니다.' }, { status: 400 })
    }

    // 채널 존재 확인
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    // SuperChat 생성
    const superChat = await prisma.superChat.create({
      data: {
        userId: user.id,
        channelId,
        videoId,
        streamId,
        amount,
        message: message?.slice(0, 200), // 메시지 길이 제한
        color: getSuperChatColor(amount),
        currency: 'KRW',
        isPaid: false // 결제 완료 후 true로 변경
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      superChat,
      paymentRequired: true,
      message: '결제를 진행해주세요.'
    })
  } catch (error) {
    console.error('SuperChat creation error:', error)
    return NextResponse.json({ 
      error: 'SuperChat 생성 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// GET - SuperChat 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const videoId = searchParams.get('videoId')
    const streamId = searchParams.get('streamId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const where: any = {
      isPaid: true // 결제 완료된 것만 표시
    }

    if (channelId) where.channelId = channelId
    if (videoId) where.videoId = videoId
    if (streamId) where.streamId = streamId

    const superChats = await prisma.superChat.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            handle: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      })
    })

    const nextCursor = superChats.length === limit ? superChats[superChats.length - 1].id : null

    return NextResponse.json({
      superChats,
      nextCursor,
      hasMore: superChats.length === limit
    })
  } catch (error) {
    console.error('SuperChat fetch error:', error)
    return NextResponse.json({ 
      error: 'SuperChat 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}