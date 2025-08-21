'use client'

import { useState } from 'react'
import PageLayout from '@/components/layouts/PageLayout'
import { 
  HelpCircle, Search, ChevronDown, ChevronRight, 
  MessageSquare, Mail, Phone, BookOpen, 
  Video, Upload, Users, Shield
} from 'lucide-react'

const faqCategories = [
  {
    id: 'getting-started',
    title: '시작하기',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-700',
    faqs: [
      {
        question: '계정은 어떻게 만드나요?',
        answer: '화면 우상단의 "회원가입" 버튼을 클릭하여 이메일, 전화번호, 또는 소셜 계정으로 가입할 수 있습니다. 가입 후 이메일 인증을 완료하면 모든 기능을 이용할 수 있습니다.'
      },
      {
        question: '무료로 이용할 수 있나요?',
        answer: '네, 기본적인 시청 기능은 무료로 이용하실 수 있습니다. 프리미엄 기능(광고 없는 시청, 오프라인 다운로드 등)은 유료 구독이 필요합니다.'
      },
      {
        question: '모바일 앱이 있나요?',
        answer: '현재 웹 버전만 제공하고 있으며, 모바일 브라우저에서도 원활하게 이용하실 수 있습니다. 모바일 앱은 개발 예정입니다.'
      }
    ]
  },
  {
    id: 'videos',
    title: '비디오 시청',
    icon: Video,
    color: 'from-green-500 to-green-700',
    faqs: [
      {
        question: '비디오가 재생되지 않아요',
        answer: '브라우저를 최신 버전으로 업데이트하고, 쿠키와 캐시를 삭제해보세요. 네트워크 연결 상태도 확인해주세요. 문제가 지속되면 고객센터로 문의해주세요.'
      },
      {
        question: '화질을 변경하려면 어떻게 하나요?',
        answer: '비디오 재생 중 화면 우하단의 설정 버튼(톱니바퀴)을 클릭하여 화질을 선택할 수 있습니다. 자동, 480p, 720p, 1080p 등의 옵션이 있습니다.'
      },
      {
        question: '자막은 어떻게 켜나요?',
        answer: '비디오 재생 중 하단의 자막 버튼(CC)을 클릭하면 자막을 켜거나 끌 수 있습니다. 한국어, 영어 등 여러 언어의 자막을 지원합니다.'
      }
    ]
  },
  {
    id: 'upload',
    title: '업로드',
    icon: Upload,
    color: 'from-purple-500 to-purple-700',
    faqs: [
      {
        question: '비디오를 업로드하려면 어떻게 해야 하나요?',
        answer: '크리에이터 계정으로 로그인 후 상단의 "업로드" 버튼을 클릭하세요. 지원 형식은 MP4, MOV, AVI 등이며, 최대 2GB까지 업로드 가능합니다.'
      },
      {
        question: '업로드 시간이 오래 걸려요',
        answer: '파일 크기와 인터넷 속도에 따라 업로드 시간이 달라집니다. 고화질 영상은 시간이 더 오래 걸릴 수 있으며, 업로드 중에는 페이지를 닫지 마세요.'
      },
      {
        question: '썸네일은 어떻게 설정하나요?',
        answer: '업로드 과정에서 자동 생성된 썸네일 중 선택하거나, 직접 이미지 파일을 업로드할 수 있습니다. JPG, PNG 형식을 지원합니다.'
      }
    ]
  },
  {
    id: 'community',
    title: '커뮤니티',
    icon: Users,
    color: 'from-orange-500 to-orange-700',
    faqs: [
      {
        question: '댓글은 어떻게 달아요?',
        answer: '비디오 하단의 댓글 섹션에서 댓글을 작성할 수 있습니다. 로그인이 필요하며, 커뮤니티 가이드라인을 준수해야 합니다.'
      },
      {
        question: '구독은 어떻게 하나요?',
        answer: '마음에 드는 크리에이터의 채널 페이지에서 "구독" 버튼을 클릭하세요. 구독하면 새로운 영상 업로드 알림을 받을 수 있습니다.'
      },
      {
        question: '부적절한 콘텐츠를 신고하려면?',
        answer: '비디오나 댓글 옆의 "..." 메뉴에서 "신고" 옵션을 선택하세요. 신고 사유를 선택하면 검토 후 적절한 조치를 취하겠습니다.'
      }
    ]
  }
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started')

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0)

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold">❓ 도움말</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8">
              궁금한 것이 있으시나요? 자주 묻는 질문과 해답을 찾아보세요
            </p>
            
            {/* 검색바 */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="질문을 검색해보세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-lg"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FAQ 섹션 */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">자주 묻는 질문</h2>
              
              <div className="space-y-4">
                {filteredFaqs.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <div key={category.id} className="bg-gray-800 rounded-lg overflow-hidden">
                      {/* 카테고리 헤더 */}
                      <button
                        onClick={() => setExpandedCategory(
                          expandedCategory === category.id ? null : category.id
                        )}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">{category.title}</h3>
                          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                            {category.faqs.length}
                          </span>
                        </div>
                        {expandedCategory === category.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {/* FAQ 목록 */}
                      {expandedCategory === category.id && (
                        <div className="border-t border-gray-700">
                          {category.faqs.map((faq, index) => (
                            <div key={index} className="border-b border-gray-700 last:border-b-0">
                              <button
                                onClick={() => setExpandedFaq(
                                  expandedFaq === `${category.id}-${index}` ? null : `${category.id}-${index}`
                                )}
                                className="w-full text-left p-4 hover:bg-gray-750 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-white font-medium pr-4">{faq.question}</h4>
                                  {expandedFaq === `${category.id}-${index}` ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                              
                              {expandedFaq === `${category.id}-${index}` && (
                                <div className="px-4 pb-4">
                                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {searchTerm && filteredFaqs.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-500">다른 검색어를 시도해보세요.</p>
                </div>
              )}
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
              {/* 문의하기 */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">문의하기</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                    <MessageSquare className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">라이브 채팅</span>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    <Mail className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">이메일 문의</span>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">전화 문의</span>
                  </button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-400 text-sm text-center">
                    평일 09:00 - 18:00<br />
                    (주말 및 공휴일 제외)
                  </p>
                </div>
              </div>

              {/* 피드백 링크 */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">의견 보내기</h3>
                </div>
                <p className="text-purple-100 text-sm mb-4">
                  서비스 개선을 위한 소중한 의견을 보내주세요!
                </p>
                <a 
                  href="/feedback"
                  className="w-full block bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors text-center"
                >
                  의견 보내기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}