'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return // 중복 제출 방지
    
    setError('')
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('=== handleSubmit 로그인 성공 ===');
        console.log('User type:', data.user.type);
        
        // 토큰 저장
        if (data.token) {
          localStorage.setItem('auth-token', data.token)
          localStorage.setItem('accessToken', data.token) // 관리자 페이지 호환성
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // AuthService 업데이트
        AuthService.login(data.user.type, data.user)
        
        // 직접 리다이렉트 실행 - 전체 URL 사용
        const url = data.user.type === 'ADMIN' ? '/admin' : 
                    data.user.type === 'BUSINESS' ? '/business/dashboard' : '/';
        console.log('리다이렉트 실행:', url);
        
        // 디버깅: 현재 위치 확인
        console.log('현재 위치:', window.location.pathname);
        console.log('리다이렉트 전 document.readyState:', document.readyState);
        
        // 모든 작업이 완료된 후 리다이렉트
        setTimeout(() => {
          console.log('setTimeout 내부 - 리다이렉트 실행');
          window.location.href = url;
        }, 0);
        
        return;
      } else {
        setError(data.error || data.message || '이메일 또는 비밀번호가 올바르지 않습니다.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (userType: 'user' | 'admin' | 'business') => {
    if (isLoading) return // 중복 클릭 방지
    
    setIsLoading(true)
    setError('')
    
    const credentials = {
      user: { email: 'user@example.com', password: 'user123' },
      business: { email: 'business@company.com', password: 'business123' },
      admin: { email: 'admin@linkpick.co.kr', password: 'admin123!' }
    }
    
    const cred = credentials[userType]
    setFormData({ email: cred.email, password: cred.password })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('=== handleQuickLogin 로그인 성공 ===');
        console.log('User type:', data.user.type);
        
        // 토큰 저장
        if (data.token) {
          localStorage.setItem('auth-token', data.token)
          localStorage.setItem('accessToken', data.token) // 관리자 페이지 호환성
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // AuthService 업데이트
        AuthService.login(data.user.type, data.user)
        
        // 직접 리다이렉트 실행 - 전체 URL 사용
        const url = data.user.type === 'ADMIN' ? '/admin' : 
                    data.user.type === 'BUSINESS' ? '/business/dashboard' : '/';
        console.log('리다이렉트 실행:', url);
        
        // 디버깅: 현재 위치 확인
        console.log('현재 위치:', window.location.pathname);
        console.log('리다이렉트 전 document.readyState:', document.readyState);
        
        // 모든 작업이 완료된 후 리다이렉트
        setTimeout(() => {
          console.log('setTimeout 내부 - 리다이렉트 실행');
          window.location.href = url;
        }, 0);
        
        return;
      } else {
        setError(data.error || data.message || '로그인에 실패했습니다.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Quick login error:', error)
      setError('로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10 border border-white/20">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                LinkPick
              </h1>
            </Link>
            <h2 className="text-xl text-white/80">다시 만나서 반가워요!</h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                이메일
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur disabled:opacity-50"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                required
                disabled={isLoading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-cyan-400 bg-white/10 border-white/20" />
                <span className="ml-2 text-sm text-white/70">로그인 상태 유지</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
            >
              {isLoading ? '처리 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/50">또는</span>
              </div>
            </div>

            {/* Quick Login Buttons */}
            <div className="mt-6 space-y-3">
              <div className="text-center">
                <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full">데모 로그인</span>
                <div className="mt-2 text-xs text-white/50">
                  <p>테스트 계정:</p>
                  <p className="mt-1">인플루언서: user@example.com / user123</p>
                  <p>클라이언트: business@company.com / business123</p>
                  <p>관리자: admin@linkpick.co.kr / admin123!</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickLogin('user')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center px-3 py-3 bg-emerald-500/20 border border-emerald-400/30 rounded-lg hover:bg-emerald-500/30 transition-colors backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-emerald-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs text-emerald-400 font-medium">인플루언서</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('business')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center px-3 py-3 bg-blue-500/20 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-colors backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs text-blue-400 font-medium">클라이언트</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center px-3 py-3 bg-purple-500/20 border border-purple-400/30 rounded-lg hover:bg-purple-500/30 transition-colors backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 text-purple-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs text-purple-400 font-medium">관리자</span>
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-white/50">소셜 로그인</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2 text-sm text-white/80">Google</span>
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
                  </svg>
                  <span className="ml-2 text-sm text-white/80">Kakao</span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-white/70">
            아직 계정이 없으신가요?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}