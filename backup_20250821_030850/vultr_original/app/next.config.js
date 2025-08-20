/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      'videopick.kr',
      '64.176.226.119', // MinIO server
      '158.247.203.55', // App server
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_API_URL: process.env.API_URL,
    NEXT_PUBLIC_WS_URL: process.env.CENTRIFUGO_URL,
    NEXT_PUBLIC_HLS_URL: process.env.HLS_URL,
    NEXT_PUBLIC_RTMP_URL: process.env.RTMP_URL,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/stream/:path*',
        destination: `${process.env.HLS_URL}/:path*`,
      },
      {
        source: '/upload/:path*',
        destination: `${process.env.TUS_UPLOAD_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig