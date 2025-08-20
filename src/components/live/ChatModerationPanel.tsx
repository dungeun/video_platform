'use client'

import { useState, useEffect } from 'react'
import { Shield, Eye, EyeOff, Trash2, Ban, Volume2, VolumeX, Settings, AlertTriangle } from 'lucide-react'
import { apiGet, apiPost, apiDelete } from '@/lib/api/client'

interface ModerationAction {
  id: string
  type: 'mute' | 'ban' | 'delete' | 'warn'
  userId: string
  userName: string
  reason: string
  duration?: number
  createdAt: string
  moderatorId: string
  moderatorName: string
}

interface FilterRule {
  id: string
  type: 'keyword' | 'regex' | 'spam'
  pattern: string
  action: 'warn' | 'mute' | 'ban' | 'delete'
  enabled: boolean
  severity: 'low' | 'medium' | 'high'
  createdAt: string
}

interface ChatModerationPanelProps {
  streamId: string
  isVisible: boolean
  onClose: () => void
  userRole: 'CREATOR' | 'MODERATOR' | 'ADMIN'
}

export default function ChatModerationPanel({ 
  streamId, 
  isVisible, 
  onClose, 
  userRole 
}: ChatModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'filters' | 'settings'>('actions')
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([])
  const [filterRules, setFilterRules] = useState<FilterRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 새 필터 규칙 추가
  const [newFilter, setNewFilter] = useState({
    type: 'keyword' as FilterRule['type'],
    pattern: '',
    action: 'warn' as FilterRule['action'],
    severity: 'medium' as FilterRule['severity']
  })

  // 데이터 로드
  useEffect(() => {
    if (isVisible) {
      loadModerationData()
    }
  }, [isVisible, streamId])

  const loadModerationData = async () => {
    try {
      const [actionsResponse, filtersResponse] = await Promise.all([
        apiGet(`/api/streaming/streams/${streamId}/moderation/actions`),
        apiGet(`/api/streaming/streams/${streamId}/moderation/filters`)
      ])
      
      setModerationActions((actionsResponse as any).actions || [])
      setFilterRules((filtersResponse as any).filters || [])
    } catch (error) {
      console.error('Failed to load moderation data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 사용자 음소거
  const muteUser = async (userId: string, duration: number, reason: string) => {
    try {
      await apiPost(`/api/streaming/streams/${streamId}/moderation/mute`, {
        userId,
        duration,
        reason
      })
      await loadModerationData()
    } catch (error) {
      console.error('Failed to mute user:', error)
    }
  }

  // 사용자 차단
  const banUser = async (userId: string, reason: string, permanent = false) => {
    try {
      await apiPost(`/api/streaming/streams/${streamId}/moderation/ban`, {
        userId,
        reason,
        permanent
      })
      await loadModerationData()
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  // 메시지 삭제
  const deleteMessage = async (messageId: string, reason: string) => {
    try {
      await apiDelete(`/api/streaming/streams/${streamId}/chat/messages/${messageId}`, {
        reason
      })
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  // 필터 규칙 추가
  const addFilterRule = async () => {
    if (!newFilter.pattern.trim()) return

    try {
      await apiPost(`/api/streaming/streams/${streamId}/moderation/filters`, newFilter)
      setNewFilter({
        type: 'keyword',
        pattern: '',
        action: 'warn',
        severity: 'medium'
      })
      await loadModerationData()
    } catch (error) {
      console.error('Failed to add filter rule:', error)
    }
  }

  // 필터 규칙 토글
  const toggleFilterRule = async (filterId: string, enabled: boolean) => {
    try {
      await apiPost(`/api/streaming/streams/${streamId}/moderation/filters/${filterId}/toggle`, {
        enabled
      })
      await loadModerationData()
    } catch (error) {
      console.error('Failed to toggle filter rule:', error)
    }
  }

  // 필터 규칙 삭제
  const deleteFilterRule = async (filterId: string) => {
    try {
      await apiDelete(`/api/streaming/streams/${streamId}/moderation/filters/${filterId}`)
      await loadModerationData()
    } catch (error) {
      console.error('Failed to delete filter rule:', error)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-white text-lg font-semibold">채팅 모더레이션</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            ×
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'actions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            모더레이션 기록
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'filters'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            필터 규칙
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            설정
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 모더레이션 기록 탭 */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">최근 모더레이션 액션</h3>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : moderationActions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  아직 모더레이션 기록이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {moderationActions.map((action) => (
                    <div
                      key={action.id}
                      className="bg-gray-700 rounded-lg p-4 flex items-start justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                          action.type === 'ban' ? 'bg-red-600' :
                          action.type === 'mute' ? 'bg-yellow-600' :
                          action.type === 'delete' ? 'bg-orange-600' :
                          'bg-blue-600'
                        }`}>
                          {action.type === 'ban' ? <Ban className="w-4 h-4" /> :
                           action.type === 'mute' ? <VolumeX className="w-4 h-4" /> :
                           action.type === 'delete' ? <Trash2 className="w-4 h-4" /> :
                           <AlertTriangle className="w-4 h-4" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{action.userName}</span>
                            <span className="text-sm px-2 py-0.5 bg-gray-600 text-gray-300 rounded">
                              {action.type}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">{action.reason}</p>
                          <div className="text-xs text-gray-500 mt-2 flex gap-4">
                            <span>모더레이터: {action.moderatorName}</span>
                            <span>{new Date(action.createdAt).toLocaleString('ko-KR')}</span>
                            {action.duration && <span>기간: {action.duration}분</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 필터 규칙 탭 */}
          {activeTab === 'filters' && (
            <div className="space-y-6">
              {/* 새 필터 추가 */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">새 필터 규칙 추가</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">필터 타입</label>
                      <select
                        value={newFilter.type}
                        onChange={(e) => setNewFilter(prev => ({ 
                          ...prev, 
                          type: e.target.value as FilterRule['type'] 
                        }))}
                        className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                      >
                        <option value="keyword">키워드</option>
                        <option value="regex">정규식</option>
                        <option value="spam">스팸 감지</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">액션</label>
                      <select
                        value={newFilter.action}
                        onChange={(e) => setNewFilter(prev => ({ 
                          ...prev, 
                          action: e.target.value as FilterRule['action'] 
                        }))}
                        className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                      >
                        <option value="warn">경고</option>
                        <option value="mute">음소거</option>
                        <option value="ban">차단</option>
                        <option value="delete">메시지 삭제</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      {newFilter.type === 'keyword' ? '금지 단어' : 
                       newFilter.type === 'regex' ? '정규식 패턴' : '스팸 감지 설정'}
                    </label>
                    <input
                      type="text"
                      value={newFilter.pattern}
                      onChange={(e) => setNewFilter(prev => ({ ...prev, pattern: e.target.value }))}
                      placeholder={
                        newFilter.type === 'keyword' ? '예: 욕설, 비방' :
                        newFilter.type === 'regex' ? '예: \\b(spam|광고)\\b' :
                        '스팸 감지 임계값 (1-100)'
                      }
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">심각도</label>
                      <select
                        value={newFilter.severity}
                        onChange={(e) => setNewFilter(prev => ({ 
                          ...prev, 
                          severity: e.target.value as FilterRule['severity'] 
                        }))}
                        className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500"
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                      </select>
                    </div>
                    
                    <div className="flex-1 flex items-end">
                      <button
                        onClick={addFilterRule}
                        disabled={!newFilter.pattern.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        규칙 추가
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 기존 필터 규칙 */}
              <div>
                <h3 className="text-white font-medium mb-4">현재 필터 규칙</h3>
                
                {filterRules.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    설정된 필터 규칙이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filterRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleFilterRule(rule.id, !rule.enabled)}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              rule.enabled ? 'bg-green-600' : 'bg-gray-500'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                              rule.enabled ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{rule.pattern}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                rule.type === 'keyword' ? 'bg-blue-600' :
                                rule.type === 'regex' ? 'bg-purple-600' :
                                'bg-orange-600'
                              } text-white`}>
                                {rule.type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                rule.severity === 'high' ? 'bg-red-600' :
                                rule.severity === 'medium' ? 'bg-yellow-600' :
                                'bg-green-600'
                              } text-white`}>
                                {rule.severity}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">
                              액션: {rule.action} | 생성일: {new Date(rule.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteFilterRule(rule.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">모더레이션 설정</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">자동 필터링</h4>
                      <p className="text-gray-300 text-sm">설정된 규칙에 따라 자동으로 메시지를 필터링합니다</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">스팸 감지</h4>
                      <p className="text-gray-300 text-sm">반복 메시지와 스팸을 자동으로 감지합니다</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">링크 차단</h4>
                      <p className="text-gray-300 text-sm">승인되지 않은 링크를 자동으로 차단합니다</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">메시지 길이 제한</h4>
                    <input 
                      type="range" 
                      min="50" 
                      max="500" 
                      defaultValue="200" 
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>50자</span>
                      <span>500자</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}