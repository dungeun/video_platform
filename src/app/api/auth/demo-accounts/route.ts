import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 연결 스킵 시 mock 데이터 반환
    if (process.env.SKIP_DB_CONNECTION === 'true') {
      return NextResponse.json({
        influencer: {
          email: 'test@example.com',
          name: '테스트 인플루언서',
          type: 'influencer'
        },
        business: {
          email: 'business@example.com',
          name: '테스트 비즈니스', 
          type: 'business'
        },
        admin: {
          email: 'admin@example.com',
          name: '테스트 관리자',
          type: 'admin'
        }
      })
    }

    // 활성 상태인 비즈니스와 인플루언서 계정만 가져오기 (관리자 제외)
    const users = await prisma.users.findMany({
      where: {
        type: {
          in: ['BUSINESS', 'INFLUENCER']
        },
        status: 'ACTIVE' // 활성 계정만 선택
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        status: true
      }
    })

    // 타입별로 분류
    const businessUsers = users.filter(u => u.type === 'BUSINESS')
    const influencerUsers = users.filter(u => u.type === 'INFLUENCER')

    // 각 타입에서 랜덤하게 1개씩 선택
    const randomBusiness = businessUsers.length > 0 
      ? businessUsers[Math.floor(Math.random() * businessUsers.length)]
      : null
    
    const randomInfluencer = influencerUsers.length > 0
      ? influencerUsers[Math.floor(Math.random() * influencerUsers.length)]
      : null

    // 관리자 계정 추가 - admin@videopick.com 우선 사용
    const adminUser = await prisma.users.findFirst({
      where: { 
        type: 'ADMIN',
        email: 'admin@videopick.com'
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true
      }
    }) || await prisma.users.findFirst({
      where: { type: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        type: true
      }
    })

    return NextResponse.json({
      influencer: randomInfluencer ? {
        email: randomInfluencer.email,
        name: randomInfluencer.name,
        type: 'influencer'
      } : null,
      business: randomBusiness ? {
        email: randomBusiness.email,
        name: randomBusiness.name,
        type: 'business'
      } : null,
      admin: adminUser ? {
        email: adminUser.email,
        name: adminUser.name,
        type: 'admin'
      } : null
    })
  } catch (error) {
    console.error('Demo accounts fetch error:', error)
    return NextResponse.json(
      { error: '데모 계정 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}