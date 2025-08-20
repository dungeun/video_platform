'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import { useChatFilter } from '@/components/live/ChatFilter'
import ChatModerationPanel from '@/components/live/ChatModerationPanel'
import { 
  Send, 
  Smile, 
  Gift, 
  Settings, 
  MoreVertical,
  DollarSign,
  Heart,
  Shield
} from 'lucide-react'

interface User {
  id: string
  name: string
  profileImage?: string
  type: 'VIEWER' | 'CREATOR' | 'MODERATOR' | 'ADMIN'
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  userType: 'VIEWER' | 'CREATOR' | 'MODERATOR' | 'ADMIN'
  message: string
  timestamp: Date
  type: 'regular' | 'superchat' | 'system'
  superChatAmount?: number
  highlighted?: boolean
  emojis?: string[]
}

interface ChatRoomProps {
  streamId: string
  enabled: boolean
  superChatEnabled: boolean
  isAuthenticated: boolean
  user?: User | null
}

export default function ChatRoom({ 
  streamId, 
  enabled, 
  superChatEnabled, 
  isAuthenticated, 
  user 
}: ChatRoomProps) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showSuperChatModal, setShowSuperChatModal] = useState(false)
  const [showModerationPanel, setShowModerationPanel] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 채팅 웹소켓 연결
  const {
    messages,
    isConnected,
    isConnecting,
    onlineUsers,
    sendMessage,
    sendSuperChat,
    connect,
    disconnect
  } = useChat(streamId)

  // 채팅 필터링
  const {
    filterMessage,
    banUser,
    unbanUser,
    muteUser,
    unmuteUser,
    stats
  } = useChatFilter()

  // 채팅 연결
  useEffect(() => {
    if (enabled && streamId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, streamId, connect, disconnect])

  // 자동 스크롤 관리
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  // 스크롤 이벤트 처리
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottomNow = scrollHeight - scrollTop - clientHeight < 50
    setIsAtBottom(isAtBottomNow)
  }

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !isAuthenticated || !isConnected) return

    // 메시지 필터링 검사
    const filterResult = filterMessage({
      id: Date.now().toString(),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown',
      message: message.trim(),
      timestamp: new Date(),
      type: 'regular'
    })

    if (!filterResult.allowed) {
      alert(`메시지 전송이 차단되었습니다: ${filterResult.reason}`)
      return
    }

    try {
      // 필터링된 메시지가 있으면 해당 메시지로 전송
      const messageToSend = filterResult.filteredMessage || message.trim()
      await sendMessage(messageToSend)
      setMessage('')
      setIsAtBottom(true)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // 슈퍼챗 전송
  const handleSuperChat = async (amount: number) => {
    if (!message.trim() || !isAuthenticated || !isConnected) return

    try {
      await sendSuperChat(message.trim(), amount)
      setMessage('')
      setShowSuperChatModal(false)
      setIsAtBottom(true)
    } catch (error) {
      console.error('Failed to send super chat:', error)
    }
  }

  // 이모지 추가
  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // 사용자 타입별 배지 색상
  const getUserBadgeColor = (userType: string) => {
    switch (userType) {
      case 'CREATOR': return 'bg-red-600 text-white'
      case 'MODERATOR': return 'bg-green-600 text-white'
      case 'ADMIN': return 'bg-purple-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  // 사용자 타입별 배지 텍스트
  const getUserBadgeText = (userType: string) => {
    switch (userType) {
      case 'CREATOR': return '방송자'
      case 'MODERATOR': return '모더레이터'
      case 'ADMIN': return '관리자'
      default: return ''
    }
  }

  // 메시지 렌더링
  const renderMessage = (msg: ChatMessage) => {
    const isSuperchat = msg.type === 'superchat'
    const isSystem = msg.type === 'system'
    
    return (
      <div
        key={msg.id}
        className={`p-3 border-b border-gray-800 hover:bg-gray-850 transition-colors ${
          isSuperchat ? 'bg-yellow-900/20 border-yellow-600/30' : ''
        } ${isSystem ? 'bg-blue-900/20 border-blue-600/30' : ''}`}
      >
        {isSuperchat && (
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 font-bold text-sm">
              슈퍼챗 ${msg.superChatAmount}
            </span>
          </div>
        )}

        {!isSystem ? (
          <div className="flex items-start gap-2">
            <img
              src={msg.userAvatar || `https://i.pravatar.cc/32?img=${msg.userId}`}
              alt={msg.userName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm truncate">
                  {msg.userName}
                </span>
                
                {msg.userType !== 'VIEWER' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getUserBadgeColor(msg.userType)}`}>
                    {getUserBadgeText(msg.userType)}
                  </span>
                )}
                
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className="text-gray-100 text-sm break-words">
                {msg.message}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-blue-400 text-sm">{msg.message}</p>
          </div>
        )}
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <p>채팅이 비활성화되었습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 채팅 헤더 */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold">실시간 채팅</h3>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {onlineUsers.length}명 참여 중
            </span>
            
            {/* 모더레이션 패널 (방송자/모더레이터만) */}
            {(user?.type === 'CREATOR' || user?.type === 'MODERATOR' || user?.type === 'ADMIN') && (
              <button 
                onClick={() => setShowModerationPanel(true)}
                className="text-gray-400 hover:text-white p-1 rounded"
                title="모더레이션 패널"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
            
            <button className="text-gray-400 hover:text-white p-1 rounded">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 연결 상태 */}
      {isConnecting && (
        <div className="p-3 bg-yellow-900/20 border-b border-yellow-600/30">
          <p className="text-yellow-400 text-sm text-center">채팅에 연결하는 중...</p>
        </div>
      )}

      {!isConnected && !isConnecting && (
        <div className="p-3 bg-red-900/20 border-b border-red-600/30">
          <p className="text-red-400 text-sm text-center">채팅 연결이 끊어졌습니다</p>
        </div>
      )}

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">💬</p>
              <p className="text-sm">아직 채팅이 없습니다</p>
              <p className="text-xs">첫 번째 메시지를 남겨보세요!</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 하단 스크롤 버튼 */}
        {!isAtBottom && (
          <button
            onClick={() => {
              setIsAtBottom(true)
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="fixed bottom-24 right-8 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors z-10"
          >
            ↓
          </button>
        )}
      </div>

      {/* 채팅 입력 */}
      {isAuthenticated ? (
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {/* 메시지 입력 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  disabled={!isConnected}
                  maxLength={500}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={!isConnected}
                    className="text-gray-400 hover:text-yellow-400 p-1 rounded disabled:opacity-50"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!message.trim() || !isConnected}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* 슈퍼챗 버튼 */}
            {superChatEnabled && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuperChatModal(true)}
                  disabled={!message.trim() || !isConnected}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  슈퍼챗
                </button>
                
                <p className="text-xs text-gray-400">
                  슈퍼챗으로 메시지를 강조해보세요
                </p>
              </div>
            )}

            {/* 글자 수 카운터 */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{message.length}/500</span>
              {!isConnected && <span>연결 끊김</span>}
            </div>
          </form>

          {/* 이모지 피커 */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg z-20">
              <div className="grid grid-cols-6 gap-2">
                {['😀', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="text-xl hover:bg-gray-700 p-1 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 슈퍼챗 모달 */}
          {showSuperChatModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-30">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-white text-lg font-bold mb-4">슈퍼챗 전송</h3>
                
                <p className="text-gray-300 text-sm mb-4">
                  메시지: "{message}"
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[2, 5, 10, 20].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleSuperChat(amount)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuperChatModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm mb-3">
            채팅에 참여하려면 로그인하세요
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            로그인
          </button>
        </div>
      )}

      {/* 모더레이션 패널 */}
      {showModerationPanel && (
        <ChatModerationPanel
          streamId={streamId}
          isVisible={showModerationPanel}
          onClose={() => setShowModerationPanel(false)}
          userRole={user?.type || 'CREATOR'}
        />
      )}
    </div>
  )
}