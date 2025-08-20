import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// GET - 사용자의 스트림 키 가져오기
export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // 사용자의 활성 스트림 키 찾기
    const streamKey = await prisma.stream_keys.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        streamKey: true,
        userId: true,
        title: true,
        isActive: true,
        isLive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!streamKey) {
      return NextResponse.json(
        { error: '스트림 키를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(streamKey)

  } catch (error) {
    console.error('Error fetching stream key:', error)
    return NextResponse.json(
      { error: '스트림 키를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

// POST - 새 스트림 키 생성
export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    // 기존 활성 스트림 키들을 비활성화
    await prisma.stream_keys.updateMany({
      where: {
        userId: user.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // 새로운 스트림 키 생성 (32바이트 랜덤)
    const newStreamKey = randomBytes(32).toString('hex')

    // 새 스트림 키 레코드 생성
    const streamKeyRecord = await prisma.stream_keys.create({
      data: {
        streamKey: newStreamKey,
        userId: user.id,
        title: `${user.name}의 라이브`,
        isActive: true,
        isLive: false
      },
      select: {
        id: true,
        streamKey: true,
        userId: true,
        title: true,
        isActive: true,
        isLive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '새 스트림 키가 생성되었습니다',
      ...streamKeyRecord
    })

  } catch (error) {
    console.error('Error creating stream key:', error)
    return NextResponse.json(
      { error: '스트림 키 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT - 스트림 키 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = AuthService.verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: '제목은 필수입니다' },
        { status: 400 }
      )
    }

    // 사용자의 활성 스트림 키 업데이트
    const updatedStreamKey = await prisma.stream_keys.updateMany({
      where: {
        userId: user.id,
        isActive: true
      },
      data: {
        title: title.trim()
      }
    })

    if (updatedStreamKey.count === 0) {
      return NextResponse.json(
        { error: '업데이트할 스트림 키를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 업데이트된 스트림 키 정보 반환
    const streamKey = await prisma.stream_keys.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        streamKey: true,
        userId: true,
        title: true,
        isActive: true,
        isLive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '스트림 정보가 업데이트되었습니다',
      ...streamKey
    })

  } catch (error) {
    console.error('Error updating stream key:', error)
    return NextResponse.json(
      { error: '스트림 키 업데이트에 실패했습니다' },
      { status: 500 }
    )
  }
}