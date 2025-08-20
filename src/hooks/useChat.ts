'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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

interface OnlineUser {
  id: string
  name: string
  avatar?: string
  type: 'VIEWER' | 'CREATOR' | 'MODERATOR' | 'ADMIN'
  joinedAt: Date
}

interface UseChatReturn {
  messages: ChatMessage[]
  onlineUsers: OnlineUser[]
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  sendSuperChat: (message: string, amount: number) => Promise<void>
  connect: () => void
  disconnect: () => void
  clearMessages: () => void
}

export function useChat(streamId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const maxMessages = 500 // 메시지 최대 개수

  // 웹소켓 연결
  const connect = useCallback(() => {
    if (!streamId || isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      // Centrifugo WebSocket 연결
      const wsUrl = `${process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:8000'}/connection/websocket`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log(`Connected to chat for stream ${streamId}`)
        
        // 채널 구독 요청
        const subscribeMessage = {
          id: 1,
          method: 'subscribe',
          params: {
            channel: `stream:${streamId}:chat`,
            token: localStorage.getItem('chatToken') // JWT 토큰 (선택사항)
          }
        }
        
        ws.send(JSON.stringify(subscribeMessage))

        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttempts.current = 0

        // 하트비트 시작
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              id: Date.now(),
              method: 'ping'
            }))
          }
        }, 25000) // 25초마다 ping
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Centrifugo 응답 처리
          if (data.id && data.result) {
            // 구독 성공 등의 응답
            console.log('Chat subscription response:', data)
            return
          }

          // 채널 메시지 처리
          if (data.push && data.push.channel === `stream:${streamId}:chat`) {
            const pushData = data.push.data
            
            switch (pushData.type) {
              case 'message':
                const newMessage: ChatMessage = {
                  id: pushData.id || Date.now().toString(),
                  userId: pushData.userId,
                  userName: pushData.userName,
                  userAvatar: pushData.userAvatar,
                  userType: pushData.userType || 'VIEWER',
                  message: pushData.message,
                  timestamp: new Date(pushData.timestamp),
                  type: 'regular'
                }
                
                setMessages(prev => {
                  const updated = [...prev, newMessage]
                  // 메시지 수 제한
                  if (updated.length > maxMessages) {
                    return updated.slice(-maxMessages)
                  }
                  return updated
                })
                break

              case 'superchat':
                const superChatMessage: ChatMessage = {
                  id: pushData.id || Date.now().toString(),
                  userId: pushData.userId,
                  userName: pushData.userName,
                  userAvatar: pushData.userAvatar,
                  userType: pushData.userType || 'VIEWER',
                  message: pushData.message,
                  timestamp: new Date(pushData.timestamp),
                  type: 'superchat',
                  superChatAmount: pushData.amount,
                  highlighted: true
                }
                
                setMessages(prev => {
                  const updated = [...prev, superChatMessage]
                  if (updated.length > maxMessages) {
                    return updated.slice(-maxMessages)
                  }
                  return updated
                })
                break

              case 'system':
                const systemMessage: ChatMessage = {
                  id: pushData.id || Date.now().toString(),
                  userId: 'system',
                  userName: 'System',
                  userType: 'ADMIN',
                  message: pushData.message,
                  timestamp: new Date(pushData.timestamp),
                  type: 'system'
                }
                
                setMessages(prev => {
                  const updated = [...prev, systemMessage]
                  if (updated.length > maxMessages) {
                    return updated.slice(-maxMessages)
                  }
                  return updated
                })
                break

              case 'user_joined':
                const newUser: OnlineUser = {
                  id: pushData.userId,
                  name: pushData.userName,
                  avatar: pushData.userAvatar,
                  type: pushData.userType || 'VIEWER',
                  joinedAt: new Date(pushData.timestamp)
                }
                
                setOnlineUsers(prev => {
                  if (prev.find(u => u.id === newUser.id)) return prev
                  return [...prev, newUser]
                })
                break

              case 'user_left':
                setOnlineUsers(prev => prev.filter(u => u.id !== pushData.userId))
                break

              case 'online_users':
                setOnlineUsers(pushData.users || [])
                break

              default:
                console.log('Unknown chat message type:', pushData.type)
            }
          }

        } catch (error) {
          console.error('Failed to parse chat message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('Chat WebSocket connection closed:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)

        // 하트비트 정리
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // 비정상 종료인 경우 재연결 시도
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
          
          console.log(`Attempting to reconnect chat in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('채팅 연결에 실패했습니다. 새로고침 후 다시 시도해주세요.')
        }
      }

      ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error)
        setError('채팅 연결 중 오류가 발생했습니다')
        setIsConnecting(false)
      }

      wsRef.current = ws

    } catch (error) {
      console.error('Failed to connect to chat:', error)
      setError(error instanceof Error ? error.message : '채팅 연결에 실패했습니다')
      setIsConnecting(false)
    }
  }, [streamId, isConnected, isConnecting])

  // 웹소켓 연결 해제
  const disconnect = useCallback(() => {
    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // 하트비트 정리
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    // WebSocket 연결 종료
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setOnlineUsers([])
    reconnectAttempts.current = 0
  }, [])

  // 일반 메시지 전송
  const sendMessage = useCallback(async (message: string) => {
    if (!isConnected || !wsRef.current || !message.trim()) return

    try {
      // 사용자 정보 가져오기 (localStorage 또는 API에서)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      // Centrifugo publish 메시지
      const publishMessage = {
        id: Date.now(),
        method: 'publish',
        params: {
          channel: `stream:${streamId}:chat`,
          data: {
            type: 'message',
            userId: user.id,
            userName: user.name,
            userAvatar: user.profileImage,
            userType: user.type || 'VIEWER',
            message: message.trim(),
            timestamp: new Date().toISOString()
          }
        }
      }

      wsRef.current.send(JSON.stringify(publishMessage))

      // HTTP API로도 전송 (영속성과 모더레이션 위해)
      await fetch(`/api/streaming/streams/${streamId}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          type: 'regular'
        })
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }, [streamId, isConnected])

  // 슈퍼챗 전송
  const sendSuperChat = useCallback(async (message: string, amount: number) => {
    if (!isConnected || !wsRef.current || !message.trim() || amount <= 0) return

    try {
      // 결제 처리 (실제 결제 API 연동 필요)
      const paymentResponse = await fetch('/api/payments/superchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          streamId,
          amount,
          message: message.trim()
        })
      })

      if (!paymentResponse.ok) {
        throw new Error('결제에 실패했습니다')
      }

      const paymentData = await paymentResponse.json()
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      // Centrifugo publish 메시지
      const publishMessage = {
        id: Date.now(),
        method: 'publish',
        params: {
          channel: `stream:${streamId}:chat`,
          data: {
            type: 'superchat',
            id: paymentData.id,
            userId: user.id,
            userName: user.name,
            userAvatar: user.profileImage,
            userType: user.type || 'VIEWER',
            message: message.trim(),
            amount,
            timestamp: new Date().toISOString()
          }
        }
      }

      wsRef.current.send(JSON.stringify(publishMessage))

    } catch (error) {
      console.error('Failed to send super chat:', error)
      throw error
    }
  }, [streamId, isConnected])

  // 메시지 초기화
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    messages,
    onlineUsers,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    sendSuperChat,
    connect,
    disconnect,
    clearMessages
  }
}