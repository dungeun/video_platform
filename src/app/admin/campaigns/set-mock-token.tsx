'use client'

import { useEffect } from 'react'

export default function SetMockToken() {
  useEffect(() => {
    // 개발 환경에서만 mock 토큰 설정
    if (process.env.NODE_ENV === 'development') {
      const token = localStorage.getItem('accessToken')
      if (!token || !token.startsWith('mock-')) {
        localStorage.setItem('accessToken', 'mock-admin-access-token')
        console.log('Mock admin token set')
      }
    }
  }, [])

  return null
}