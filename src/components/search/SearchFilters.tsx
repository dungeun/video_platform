'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Video, Users, TrendingUp, Filter as FilterIcon } from 'lucide-react'

export interface SearchFilters {
  category: string
  duration: string
  uploadDate: string
  sortBy: string
  viewCount: string
  type: string[]
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClose: () => void
}

export default function SearchFilters({ filters, onFiltersChange, onClose }: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  // 필터 적용
  const applyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  // 필터 초기화
  const resetFilters = () => {
    const defaultFilters: SearchFilters = {
      category: 'all',
      duration: 'all',
      uploadDate: 'all',
      sortBy: 'relevance',
      viewCount: 'all',
      type: []
    }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  // 콘텐츠 타입 토글
  const toggleType = (type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }))
  }

  const categories = [
    { value: 'all', label: '모든 카테고리' },
    { value: 'gaming', label: '게임' },
    { value: 'music', label: '음악' },
    { value: 'education', label: '교육' },
    { value: 'entertainment', label: '엔터테인먼트' },
    { value: 'sports', label: '스포츠' },
    { value: 'tech', label: '기술' },
    { value: 'lifestyle', label: '라이프스타일' },
    { value: 'news', label: '뉴스' },
    { value: 'cooking', label: '요리' }
  ]

  const durations = [
    { value: 'all', label: '모든 길이' },
    { value: 'short', label: '4분 미만' },
    { value: 'medium', label: '4-20분' },
    { value: 'long', label: '20분 이상' }
  ]

  const uploadDates = [
    { value: 'all', label: '전체 기간' },
    { value: 'hour', label: '지난 1시간' },
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번 주' },
    { value: 'month', label: '이번 달' },
    { value: 'year', label: '올해' }
  ]

  const sortOptions = [
    { value: 'relevance', label: '관련성' },
    { value: 'date', label: '업로드 날짜' },
    { value: 'views', label: '조회수' },
    { value: 'rating', label: '평점' }
  ]

  const viewCounts = [
    { value: 'all', label: '모든 조회수' },
    { value: '1k', label: '1천 이상' },
    { value: '10k', label: '1만 이상' },
    { value: '100k', label: '10만 이상' },
    { value: '1m', label: '100만 이상' }
  ]

  const contentTypes = [
    { value: 'hd', label: 'HD', icon: Video },
    { value: '4k', label: '4K', icon: Video },
    { value: 'live', label: '라이브', icon: Users },
    { value: 'vr', label: 'VR', icon: Video },
    { value: 'subtitled', label: '자막', icon: FilterIcon }
  ]

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">검색 필터</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              필터 초기화
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={localFilters.category}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 업로드 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              업로드 날짜
            </label>
            <select
              value={localFilters.uploadDate}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, uploadDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              {uploadDates.map(date => (
                <option key={date.value} value={date.value}>
                  {date.label}
                </option>
              ))}
            </select>
          </div>

          {/* 재생 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              재생 시간
            </label>
            <select
              value={localFilters.duration}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              {durations.map(dur => (
                <option key={dur.value} value={dur.value}>
                  {dur.label}
                </option>
              ))}
            </select>
          </div>

          {/* 정렬 기준 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              정렬 기준
            </label>
            <select
              value={localFilters.sortBy}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              {sortOptions.map(sort => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>

          {/* 조회수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조회수
            </label>
            <select
              value={localFilters.viewCount}
              onChange={(e) => setLocalFilters(prev => ({ ...prev, viewCount: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              {viewCounts.map(count => (
                <option key={count.value} value={count.value}>
                  {count.label}
                </option>
              ))}
            </select>
          </div>

          {/* 적용 버튼 */}
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              필터 적용
            </button>
          </div>
        </div>

        {/* 콘텐츠 타입 */}
        <div className="mt-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            콘텐츠 타입
          </label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map(type => {
              const Icon = type.icon
              const isSelected = localFilters.type.includes(type.value)
              
              return (
                <button
                  key={type.value}
                  onClick={() => toggleType(type.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                    isSelected
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}