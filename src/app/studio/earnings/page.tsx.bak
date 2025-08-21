'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { apiGet, apiPost } from '@/lib/api/client'
import { DollarSign, TrendingUp, Clock, CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import SuperChatList from '@/components/superchat/SuperChatList'

export default function StudioEarnings() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [earnings, setEarnings] = useState<any>(null)
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [settlementAmount, setSettlementAmount] = useState('')
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    bankAccount: '',
    accountHolder: ''
  })
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [settlementError, setSettlementError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadEarnings()
  }, [])

  const loadEarnings = async () => {
    try {
      const data = await apiGet('/api/creator/earnings')
      setEarnings(data)
    } catch (error) {
      console.error('Failed to load earnings:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettlementRequest = async () => {
    if (!settlementAmount || parseInt(settlementAmount) < 10000) {
      setSettlementError('최소 정산 금액은 10,000원입니다.')
      return
    }

    if (!bankInfo.bankName || !bankInfo.bankAccount || !bankInfo.accountHolder) {
      setSettlementError('모든 계좌 정보를 입력해주세요.')
      return
    }

    setSettlementLoading(true)
    setSettlementError('')

    try {
      await apiPost('/api/creator/settlement', {
        amount: parseInt(settlementAmount),
        ...bankInfo
      })

      setShowSettlementModal(false)
      setSettlementAmount('')
      setBankInfo({ bankName: '', bankAccount: '', accountHolder: '' })
      loadEarnings() // 데이터 새로고침
      
      // 성공 알림
      alert('정산 신청이 완료되었습니다. 영업일 기준 3-5일 내에 처리됩니다.')
    } catch (error: any) {
      setSettlementError(error.message || '정산 신청 중 오류가 발생했습니다.')
    } finally {
      setSettlementLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!earnings) return null

  const { channel, totalStats, monthlyEarnings, recentSuperChats } = earnings

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">수익 관리</h1>

        {/* 수익 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">총 수익</h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₩{channel.totalEarnings.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">누적 총 수익</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">정산 가능 금액</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₩{channel.pendingSettlement.toLocaleString()}
            </p>
            <button
              onClick={() => setShowSettlementModal(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              disabled={channel.pendingSettlement < 10000}
            >
              정산 신청 →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">SuperChat 수익</h3>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₩{channel.totalSuperChatAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">총 SuperChat 금액</p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`${
                activeTab === 'monthly'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              월별 수익
            </button>
            <button
              onClick={() => setActiveTab('superchats')}
              className={`${
                activeTab === 'superchats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              SuperChat
            </button>
          </nav>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 최근 SuperChat */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 SuperChat</h3>
              {recentSuperChats.length > 0 ? (
                <SuperChatList channelId={channel.id} />
              ) : (
                <p className="text-gray-500 text-center py-8">
                  아직 받은 SuperChat이 없습니다.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 수익 내역</h3>
            {monthlyEarnings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        기간
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SuperChat
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 수익
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        수수료
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        순수익
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyEarnings.map((month: any) => (
                      <tr key={`${month.year}-${month.month}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {month.year}년 {month.month}월
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ₩{month.superchat.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ₩{month.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                          -₩{month.fee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          ₩{month.netTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                아직 수익 내역이 없습니다.
              </p>
            )}
          </div>
        )}

        {activeTab === 'superchats' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">전체 SuperChat</h3>
            <SuperChatList channelId={channel.id} />
          </div>
        )}
      </div>

      {/* 정산 신청 모달 */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">정산 신청</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                정산 가능 금액: <span className="font-bold">₩{channel.pendingSettlement.toLocaleString()}</span>
              </p>
            </div>

            {/* 정산 금액 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정산 신청 금액
              </label>
              <input
                type="number"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                placeholder="10,000원 이상"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="10000"
                max={channel.pendingSettlement}
              />
            </div>

            {/* 계좌 정보 */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  은행명
                </label>
                <select
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">은행 선택</option>
                  <option value="KB국민은행">KB국민은행</option>
                  <option value="신한은행">신한은행</option>
                  <option value="우리은행">우리은행</option>
                  <option value="하나은행">하나은행</option>
                  <option value="NH농협은행">NH농협은행</option>
                  <option value="카카오뱅크">카카오뱅크</option>
                  <option value="토스뱅크">토스뱅크</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={bankInfo.bankAccount}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankAccount: e.target.value })}
                  placeholder="'-' 없이 입력"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예금주명
                </label>
                <input
                  type="text"
                  value={bankInfo.accountHolder}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                  placeholder="실명 입력"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {settlementError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {settlementError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettlementModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={settlementLoading}
              >
                취소
              </button>
              <button
                onClick={handleSettlementRequest}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                disabled={settlementLoading}
              >
                {settlementLoading ? '처리 중...' : '정산 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}