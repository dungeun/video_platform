'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthService } from '@/lib/auth'

interface Post {
  id: string
  title: string
  content: string
  category: string
  views: number
  likes: number
  comments: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    avatar?: string
  }
}

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [user, setUser] = useState(AuthService.getCurrentUser())

  const categories = [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'tips', name: '캠페인 팁', icon: '💡' },
    { id: 'review', name: '후기', icon: '⭐' },
    { id: 'question', name: '질문', icon: '❓' },
    { id: 'free', name: '자유게시판', icon: '💬' },
    { id: 'notice', name: '공지사항', icon: '📢' }
  ]

  // 게시글 목록 불러오기
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchTerm,
        page: currentPage.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/posts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 및 필터/검색 변경 시 게시글 목록 불러오기
  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, searchTerm, currentPage])

  // 검색어 변경 시 페이지를 1로 리셋
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // 카테고리 변경 시 페이지를 1로 리셋
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  const getCategoryStyle = (categoryId: string) => {
    switch (categoryId) {
      case 'notice':
        return 'bg-red-100 text-red-700'
      case 'tips':
        return 'bg-yellow-100 text-yellow-700'
      case 'review':
        return 'bg-green-100 text-green-700'
      case 'question':
        return 'bg-blue-100 text-blue-700'
      case 'free':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : '기타'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티</h1>
            <p className="text-gray-600">
              인플루언서들과 경험을 공유하고 정보를 나누세요.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-cyan-50 text-cyan-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
              
              <Link 
                href="/community/write"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 ml-4"
              >
                글쓰기
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <input
              type="text"
              placeholder="제목 또는 작성자 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    작성자
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    날짜
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    조회
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    댓글
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    좋아요
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600"></div>
                        <span className="ml-2 text-gray-600">로딩 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">게시글이 없습니다</h3>
                      <p className="text-gray-600">검색 조건에 맞는 게시글이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {post.isPinned && (
                            <span className="text-red-500 font-bold">📌</span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${getCategoryStyle(post.category)}`}>
                            {getCategoryName(post.category)}
                          </span>
                          <Link 
                            href={`/community/${post.id}`} 
                            className="text-gray-900 font-medium hover:text-cyan-600 flex-1 min-w-0"
                            title={post.title}
                          >
                            {truncateTitle(post.title)}
                          </Link>
                          {post.comments > 0 && (
                            <span className="text-cyan-600 text-sm flex-shrink-0">
                              [{post.comments}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <div className="flex items-center justify-center space-x-1">
                          {post.author.avatar && (
                            <img 
                              src={post.author.avatar} 
                              alt={post.author.name}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="truncate max-w-20">{post.author.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{formatDate(post.createdAt)}</span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{post.views.toLocaleString()}</span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{post.comments}</span>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-600">
                        <span className="text-xs">{post.likes}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  다음
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}