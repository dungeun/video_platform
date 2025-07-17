'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  
  const defaultRole = searchParams.get('type') as 'business' | 'influencer' | null
  
  const [formData, setFormData] = useState({
    role: defaultRole || '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    agreeTerms: false,
    agreeMarketing: false
  })

  const handleRoleSelect = (role: 'business' | 'influencer') => {
    setFormData({ ...formData, role })
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (!formData.agreeTerms) {
      setError('이용약관에 동의해주세요.')
      return
    }

    setIsLoading(true)

    try {
      // 임시 회원가입 처리
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 1 && !defaultRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="w-full max-w-2xl px-6">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                LinkPick
              </h1>
            </Link>
            <h2 className="text-2xl text-white mb-2">환영합니다!</h2>
            <p className="text-white/70">어떤 목적으로 LinkPick을 사용하시나요?</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => handleRoleSelect('business')}
              className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/20 hover:border-cyan-400 hover:bg-white/20"
            >
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">비즈니스</h3>
              <p className="text-white/70">
                인플루언서를 찾고 마케팅 캠페인을 진행하고 싶어요
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect('influencer')}
              className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/20 hover:border-emerald-400 hover:bg-white/20"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">인플루언서</h3>
              <p className="text-white/70">
                브랜드와 협업하고 콘텐츠로 수익을 창출하고 싶어요
              </p>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-white/70">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10 border border-white/20">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                LinkPick
              </h1>
            </Link>
            <h2 className="text-xl text-white/80">
              {formData.role === 'business' ? '비즈니스' : '인플루언서'} 계정 만들기
            </h2>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                이메일
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur"
                placeholder="8자 이상 입력해주세요"
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur"
                placeholder="비밀번호를 다시 입력해주세요"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-1 rounded text-cyan-400 bg-white/10 border-white/20"
                />
                <span className="ml-2 text-sm text-white/70">
                  <Link href="/terms" className="text-cyan-400 hover:text-cyan-300">이용약관</Link> 및{' '}
                  <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300">개인정보처리방침</Link>에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeMarketing}
                  onChange={(e) => setFormData({ ...formData, agreeMarketing: e.target.checked })}
                  className="mt-1 rounded text-cyan-400 bg-white/10 border-white/20"
                />
                <span className="ml-2 text-sm text-white/70">
                  마케팅 정보 수신에 동의합니다 (선택)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-105"
            >
              {isLoading ? '회원가입 중...' : '회원가입 완료'}
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

          <p className="mt-8 text-center text-sm text-white/70">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}