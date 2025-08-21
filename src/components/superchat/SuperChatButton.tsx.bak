'use client'

import { useState } from 'react'
import { DollarSign, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { apiPost } from '@/lib/api/client'
import { useRouter } from 'next/navigation'

interface SuperChatButtonProps {
  channelId: string
  videoId?: string
  streamId?: string
  onSuccess?: () => void
}

export default function SuperChatButton({ 
  channelId, 
  videoId, 
  streamId,
  onSuccess 
}: SuperChatButtonProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const presetAmounts = [1000, 5000, 10000, 50000]

  const handleSuperChat = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!amount || parseInt(amount) < 100) {
      setError('최소 100원 이상 후원 가능합니다.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // SuperChat 생성
      const response = await apiPost('/api/superchat', {
        channelId,
        videoId,
        streamId,
        amount: parseInt(amount),
        message: message.trim()
      })

      if ((response as any).paymentRequired) {
        // TODO: 결제 모듈 연동
        // 임시로 바로 확인 처리
        await apiPost('/api/superchat/confirm', {
          superChatId: (response as any).superChat.id,
          paymentId: 'temp-payment-id'
        })
      }

      setShowModal(false)
      setAmount('')
      setMessage('')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      setError(error.message || 'SuperChat 전송에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
      >
        <DollarSign className="w-5 h-5" />
        <span className="font-medium">SuperChat</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">SuperChat 보내기</h2>

            {/* 금액 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                후원 금액
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset.toString())}
                    className={`py-2 px-3 rounded-lg border-2 transition-all ${
                      amount === preset.toString()
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {preset.toLocaleString()}원
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="직접 입력"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="100"
              />
            </div>

            {/* 메시지 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메시지 (선택사항)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="응원 메시지를 남겨주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">{message.length}/200</p>
            </div>

            {/* SuperChat 미리보기 */}
            {amount && parseInt(amount) >= 100 && (
              <div 
                className="mb-6 p-4 rounded-lg text-white"
                style={{ 
                  backgroundColor: amount && parseInt(amount) >= 50000 ? '#ff0000' :
                                 parseInt(amount) >= 10000 ? '#ff9500' :
                                 parseInt(amount) >= 5000 ? '#ffd700' :
                                 parseInt(amount) >= 1000 ? '#1de9b6' : '#1e88e5'
                }}
              >
                <div className="font-bold text-lg">{parseInt(amount).toLocaleString()}원</div>
                {message && <p className="mt-2 text-sm">{message}</p>}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={handleSuperChat}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 font-medium disabled:opacity-50"
                disabled={isLoading || !amount || parseInt(amount) < 100}
              >
                {isLoading ? '처리 중...' : '후원하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}