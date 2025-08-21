/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포용 설정 - standalone 모드 제거하여 정적 생성 문제 해결
  typescript: {
    ignoreBuildErrors: true,  // 타입 에러 무시 (빌드용)
  },
  eslint: {
    ignoreDuringBuilds: true,  // ESLint 체크 무시 (빌드용)
  },
  
  // 환경 변수 런타임 설정
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`,
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || '',
  },

  // 이미지 도메인 설정
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'images.unsplash.com',
      'ui-avatars.com',
      'i.pravatar.cc',
      'img.youtube.com',
      'i.ytimg.com',
      'storage.one-q.xyz',
      '64.176.226.119'
    ],
  },

  // 실험적 기능
  experimental: {
    // Server Actions 활성화 (필요시)
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/dashboard/my-campaigns',
        destination: '/mypage?tab=campaigns',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;