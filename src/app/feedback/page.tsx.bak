'use client'

import { useState } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { 
  MessageSquare, Send, Star, ThumbsUp, ThumbsDown, 
  Bug, Lightbulb, Heart, CheckCircle, AlertCircle,
  Smile, Meh, Frown
} from 'lucide-react'

const feedbackTypes = [
  {
    id: 'suggestion',
    title: '개선 제안',
    description: '더 나은 서비스를 위한 아이디어를 제안해주세요',
    icon: Lightbulb,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'bug',
    title: '버그 신고',
    description: '서비스 이용 중 발견한 문제를 신고해주세요',
    icon: Bug,
    color: 'from-red-500 to-pink-500'
  },
  {
    id: 'feature',
    title: '기능 요청',
    description: '새로운 기능에 대한 요청을 보내주세요',
    icon: Star,
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'compliment',
    title: '칭찬하기',
    description: '좋았던 점이나 감사 인사를 전해주세요',
    icon: Heart,
    color: 'from-pink-500 to-rose-500'
  }
]

const satisfactionLevels = [
  { value: 'very-satisfied', label: '매우 만족', icon: Smile, color: 'text-green-500' },
  { value: 'satisfied', label: '만족', icon: ThumbsUp, color: 'text-blue-500' },
  { value: 'neutral', label: '보통', icon: Meh, color: 'text-gray-500' },
  { value: 'dissatisfied', label: '불만족', icon: ThumbsDown, color: 'text-orange-500' },
  { value: 'very-dissatisfied', label: '매우 불만족', icon: Frown, color: 'text-red-500' }
]

const categories = [
  '비디오 재생',
  '업로드',
  '검색',
  '댓글',
  '구독',
  '알림',
  '모바일 경험',
  '성능',
  '디자인',
  '기타'
]

export default function FeedbackPage() {
  const [selectedType, setSelectedType] = useState('')
  const [satisfaction, setSatisfaction] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // 실제 API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  if (isSubmitted) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">피드백이 전송되었습니다!</h1>
            <p className="text-gray-400 mb-6">
              소중한 의견 감사합니다. 더 나은 서비스를 위해 검토 후 반영하겠습니다.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setSelectedType('')
                  setSatisfaction('')
                  setCategory('')
                  setTitle('')
                  setDescription('')
                  setEmail('')
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                다른 피드백 보내기
              </button>
              <a
                href="/"
                className="w-full block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors text-center"
              >
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold">💬 의견 보내기</h1>
            </div>
            <p className="text-xl text-purple-100">
              여러분의 소중한 의견으로 더 나은 서비스를 만들어가겠습니다
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 피드백 유형 선택 */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">어떤 종류의 피드백인가요?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbackTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-6 rounded-lg border-2 transition-all text-left ${
                          selectedType === type.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{type.title}</h3>
                            <p className="text-gray-400 text-sm">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedType && (
                <>
                  {/* 만족도 조사 */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">전반적인 만족도는 어떠신가요?</h2>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {satisfactionLevels.map((level) => {
                        const IconComponent = level.icon
                        return (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setSatisfaction(level.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-w-[100px] ${
                              satisfaction === level.value
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            }`}
                          >
                            <IconComponent className={`w-8 h-8 ${level.color}`} />
                            <span className="text-white text-sm font-medium">{level.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 카테고리 선택 */}
                  <div>
                    <label className="block text-lg font-semibold text-white mb-4">
                      어떤 부분에 대한 피드백인가요?
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    >
                      <option value="">카테고리를 선택해주세요</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* 제목 */}
                  <div>
                    <label className="block text-lg font-semibold text-white mb-4">
                      제목
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="피드백 제목을 간단히 적어주세요"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  {/* 상세 내용 */}
                  <div>
                    <label className="block text-lg font-semibold text-white mb-4">
                      상세 내용
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="자세한 내용을 적어주세요. 구체적인 설명일수록 더 도움이 됩니다."
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                      required
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      최소 10자 이상 작성해주세요 ({description.length}/10)
                    </p>
                  </div>

                  {/* 이메일 (선택사항) */}
                  <div>
                    <label className="block text-lg font-semibold text-white mb-4">
                      이메일 주소 (선택사항)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="답변을 받고 싶으시면 이메일 주소를 입력해주세요"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      답변이 필요한 경우에만 연락드립니다.
                    </p>
                  </div>

                  {/* 제출 버튼 */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedType || !category || !title || description.length < 10}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          전송 중...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          피드백 보내기
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            {/* 안내 메시지 */}
            <div className="mt-12 bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">피드백 처리 안내</h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• 모든 피드백은 검토 후 서비스 개선에 반영됩니다</li>
                    <li>• 답변이 필요한 경우 1-3일 내에 이메일로 회신드립니다</li>
                    <li>• 부적절한 내용이나 스팸은 관리자에 의해 제거될 수 있습니다</li>
                    <li>• 개인정보나 민감한 정보는 포함하지 마세요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}