import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function createRealAccounts() {
  console.log('Creating real accounts with proper passwords...')
  
  try {
    // 실제 비밀번호 해시 생성
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // 관리자 계정 생성/업데이트
    const admin = await prisma.users.upsert({
      where: { email: 'admin@linkpick.co.kr' },
      update: {
        password: hashedPassword,
        name: '관리자',
        type: 'ADMIN',
        status: 'ACTIVE'
      },
      create: {
        id: 'admin-real-001',
        email: 'admin@linkpick.co.kr',
        password: hashedPassword,
        name: '관리자',
        type: 'ADMIN',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    console.log('Admin account created/updated:', admin.email)
    
    // 비즈니스 계정 생성/업데이트
    const business = await prisma.users.upsert({
      where: { email: 'business@company.com' },
      update: {
        password: hashedPassword,
        name: '테스트 비즈니스',
        type: 'BUSINESS',
        status: 'ACTIVE'
      },
      create: {
        id: 'business-real-001',
        email: 'business@company.com',
        password: hashedPassword,
        name: '테스트 비즈니스',
        type: 'BUSINESS',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        business_profiles: {
          create: {
            id: 'business-profile-real-001',
            companyName: '(주)테스트기업',
            businessNumber: '123-45-67890',
            representativeName: '홍길동',
            businessAddress: '서울시 강남구 테헤란로 123',
            businessCategory: '마케팅',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      include: {
        business_profiles: true
      }
    })
    console.log('Business account created/updated:', business.email)
    
    // 인플루언서 계정 생성/업데이트
    const influencer = await prisma.users.upsert({
      where: { email: 'influencer@example.com' },
      update: {
        password: hashedPassword,
        name: '테스트 인플루언서',
        type: 'INFLUENCER',
        status: 'ACTIVE'
      },
      create: {
        id: 'influencer-real-001',
        email: 'influencer@example.com',
        password: hashedPassword,
        name: '테스트 인플루언서',
        type: 'INFLUENCER',
        status: 'ACTIVE',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profiles: {
          create: {
            id: 'profile-real-001',
            bio: '테스트 인플루언서입니다',
            profileImage: 'https://example.com/profile.jpg',
            instagram: '@test_influencer',
            instagramFollowers: 50000,
            categories: JSON.stringify(['패션', '뷰티']),
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      include: {
        profiles: true
      }
    })
    console.log('Influencer account created/updated:', influencer.email)
    
    // 추가 테스트 계정들 생성
    const testAccounts = [
      {
        email: 'test.business@example.com',
        name: '테스트 비즈니스 2',
        type: 'BUSINESS' as const,
        business_profiles: {
          companyName: '테스트 컴퍼니',
          businessNumber: '987-65-43210',
          representativeName: '김영희',
          businessAddress: '서울시 송파구 올림픽로 300',
          businessCategory: 'IT',
          isVerified: true
        }
      },
      {
        email: 'test.influencer@example.com',
        name: '테스트 인플루언서 2',
        type: 'INFLUENCER' as const,
        profiles: {
          bio: '라이프스타일 인플루언서',
          profileImage: 'https://example.com/profile2.jpg',
          instagram: '@lifestyle_influencer',
          instagramFollowers: 30000,
          categories: JSON.stringify(['라이프스타일', '여행']),
          isVerified: true
        }
      }
    ]
    
    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      const user = await prisma.users.upsert({
        where: { email: account.email },
        update: {
          password: hashedPassword,
          name: account.name,
          type: account.type,
          status: 'ACTIVE'
        },
        create: {
          id: `test-user-${i + 1}`,
          email: account.email,
          password: hashedPassword,
          name: account.name,
          type: account.type,
          status: 'ACTIVE',
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(account.type === 'BUSINESS' && account.business_profiles ? {
            business_profiles: {
              create: {
                id: `test-business-profile-${i + 1}`,
                ...account.business_profiles,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          } : {}),
          ...(account.type === 'INFLUENCER' && account.profiles ? {
            profiles: {
              create: {
                id: `test-profile-${i + 1}`,
                ...account.profiles,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          } : {})
        }
      })
      console.log(`${account.type} account created/updated:`, user.email)
    }
    
    console.log('\n✅ Real accounts created successfully!')
    console.log('\n로그인 정보:')
    console.log('- 관리자: admin@linkpick.co.kr / password123')
    console.log('- 비즈니스: business@company.com / password123')
    console.log('- 인플루언서: influencer@example.com / password123')
    console.log('- 테스트 비즈니스 2: test.business@example.com / password123')
    console.log('- 테스트 인플루언서 2: test.influencer@example.com / password123')
    
  } catch (error) {
    console.error('❌ Error creating real accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
createRealAccounts()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

export { createRealAccounts }