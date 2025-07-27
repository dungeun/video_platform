/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // 로컬 개발시 주석 처리
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 환경 변수 런타임 설정
  publicRuntimeConfig: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || '',
  },

  // 이미지 도메인 설정
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'images.unsplash.com',
      'ui-avatars.com'
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