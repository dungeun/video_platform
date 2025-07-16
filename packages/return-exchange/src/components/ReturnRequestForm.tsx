'use client'

import React, { useState } from 'react'
import type {
  CreateReturnRequestData,
  RequestReason,
  RefundMethod,
  RefundAccount,
  OrderItem
} from '../types'

interface ReturnRequestFormProps {
  orderId: string
  orderItems: OrderItem[]
  onSubmit: (data: CreateReturnRequestData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

interface FormData {
  selectedItems: Array<{
    orderItemId: string
    quantity: number
    reason: RequestReason
    reasonDetail?: string
  }>
  refundMethod: RefundMethod
  refundAccount?: RefundAccount
  images: string[]
}

const RETURN_REASONS: Array<{ value: RequestReason; label: string }> = [
  { value: 'defective', label: '불량/파손' },
  { value: 'wrong-product', label: '다른 상품 배송' },
  { value: 'not-as-described', label: '상품 설명과 다름' },
  { value: 'size-issue', label: '사이즈 문제' },
  { value: 'color-issue', label: '색상 문제' },
  { value: 'change-mind', label: '단순 변심' },
  { value: 'other', label: '기타' }
]

const REFUND_METHODS: Array<{ value: RefundMethod; label: string }> = [
  { value: 'original', label: '원결제 수단으로 환불' },
  { value: 'points', label: '포인트로 환불' },
  { value: 'account', label: '계좌이체' }
]

export function ReturnRequestForm({
  orderId,
  orderItems,
  onSubmit,
  onCancel,
  loading = false
}: ReturnRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    selectedItems: [],
    refundMethod: 'original',
    images: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleItemSelect = (orderItemId: string, selected: boolean) => {
    if (selected) {
      setFormData(prev => ({
        ...prev,
        selectedItems: [
          ...prev.selectedItems,
          {
            orderItemId,
            quantity: 1,
            reason: 'other',
            reasonDetail: ''
          }
        ]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        selectedItems: prev.selectedItems.filter(item => item.orderItemId !== orderItemId)
      }))
    }
  }

  const handleItemUpdate = (orderItemId: string, field: keyof FormData['selectedItems'][0], value: any) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, [field]: value }
          : item
      )
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    // In real app, upload to server and get URLs
    const imageUrls = Array.from(files).map(file => URL.createObjectURL(file))
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.selectedItems.length === 0) {
      newErrors.items = '반품할 상품을 선택해주세요'
    }

    for (const item of formData.selectedItems) {
      if (!item.reason) {
        newErrors[`reason_${item.orderItemId}`] = '반품 사유를 선택해주세요'
      }
      if (item.reason === 'other' && !item.reasonDetail) {
        newErrors[`reasonDetail_${item.orderItemId}`] = '기타 사유를 입력해주세요'
      }
      if (item.quantity <= 0) {
        newErrors[`quantity_${item.orderItemId}`] = '올바른 수량을 입력해주세요'
      }
    }

    if (formData.refundMethod === 'account' && !formData.refundAccount) {
      newErrors.refundAccount = '환불받을 계좌 정보를 입력해주세요'
    }

    if (formData.refundMethod === 'account' && formData.refundAccount) {
      if (!formData.refundAccount.bankCode) {
        newErrors.bankCode = '은행을 선택해주세요'
      }
      if (!formData.refundAccount.accountNumber) {
        newErrors.accountNumber = '계좌번호를 입력해주세요'
      }
      if (!formData.refundAccount.accountHolder) {
        newErrors.accountHolder = '예금주명을 입력해주세요'
      }
    }

    if (formData.images.length === 0) {
      newErrors.images = '상품 사진을 첨부해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit({
        orderId,
        items: formData.selectedItems,
        refundMethod: formData.refundMethod,
        refundAccount: formData.refundAccount,
        images: formData.images
      })
    } catch (error) {
      console.error('반품 신청 중 오류:', error)
    }
  }

  const isItemSelected = (orderItemId: string) => {
    return formData.selectedItems.some(item => item.orderItemId === orderItemId)
  }

  const getSelectedItem = (orderItemId: string) => {
    return formData.selectedItems.find(item => item.orderItemId === orderItemId)
  }

  const getOrderItem = (orderItemId: string) => {
    return orderItems.find(item => item.id === orderItemId)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">반품 신청</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 상품 선택 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">반품할 상품 선택</h3>
          {errors.items && <p className="text-red-500 text-sm mb-2">{errors.items}</p>}
          
          <div className="space-y-4">
            {orderItems.map((orderItem) => {
              const selected = isItemSelected(orderItem.id)
              const selectedItem = getSelectedItem(orderItem.id)
              
              return (
                <div key={orderItem.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => handleItemSelect(orderItem.id, e.target.checked)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        {orderItem.image && (
                          <img src={orderItem.image} alt={orderItem.name} className="w-16 h-16 object-cover rounded" />
                        )}
                        <div>
                          <h4 className="font-medium">{orderItem.name}</h4>
                          <p className="text-gray-600">{orderItem.price?.toLocaleString()}원</p>
                          <p className="text-sm text-gray-500">주문 수량: {orderItem.quantity}</p>
                        </div>
                      </div>
                      
                      {selected && selectedItem && (
                        <div className="space-y-3 mt-4 pl-4 border-l-2 border-blue-200">
                          <div>
                            <label className="block text-sm font-medium mb-1">반품 수량</label>
                            <input
                              type="number"
                              min="1"
                              max={orderItem.quantity}
                              value={selectedItem.quantity}
                              onChange={(e) => handleItemUpdate(orderItem.id, 'quantity', parseInt(e.target.value))}
                              className="w-20 px-3 py-1 border rounded"
                            />
                            {errors[`quantity_${orderItem.id}`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`quantity_${orderItem.id}`]}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">반품 사유</label>
                            <select
                              value={selectedItem.reason}
                              onChange={(e) => handleItemUpdate(orderItem.id, 'reason', e.target.value as RequestReason)}
                              className="w-full px-3 py-2 border rounded"
                            >
                              {RETURN_REASONS.map(reason => (
                                <option key={reason.value} value={reason.value}>
                                  {reason.label}
                                </option>
                              ))}
                            </select>
                            {errors[`reason_${orderItem.id}`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`reason_${orderItem.id}`]}</p>
                            )}
                          </div>
                          
                          {selectedItem.reason === 'other' && (
                            <div>
                              <label className="block text-sm font-medium mb-1">상세 사유</label>
                              <textarea
                                value={selectedItem.reasonDetail || ''}
                                onChange={(e) => handleItemUpdate(orderItem.id, 'reasonDetail', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                rows={2}
                                placeholder="상세한 반품 사유를 입력해주세요"
                              />
                              {errors[`reasonDetail_${orderItem.id}`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`reasonDetail_${orderItem.id}`]}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 환불 방법 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">환불 방법</h3>
          <div className="space-y-2">
            {REFUND_METHODS.map(method => (
              <label key={method.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  value={method.value}
                  checked={formData.refundMethod === method.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, refundMethod: e.target.value as RefundMethod }))}
                />
                <span>{method.label}</span>
              </label>
            ))}
          </div>
          
          {formData.refundMethod === 'account' && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded">
              <h4 className="font-medium">환불 계좌 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">은행</label>
                  <select
                    value={formData.refundAccount?.bankCode || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      refundAccount: { ...prev.refundAccount!, bankCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">은행 선택</option>
                    <option value="004">KB국민은행</option>
                    <option value="011">NH농협은행</option>
                    <option value="020">우리은행</option>
                    <option value="088">신한은행</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">계좌번호</label>
                  <input
                    type="text"
                    value={formData.refundAccount?.accountNumber || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      refundAccount: { ...prev.refundAccount!, accountNumber: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="계좌번호 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">예금주</label>
                  <input
                    type="text"
                    value={formData.refundAccount?.accountHolder || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      refundAccount: { ...prev.refundAccount!, accountHolder: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="예금주명"
                  />
                </div>
              </div>
              {errors.refundAccount && <p className="text-red-500 text-sm">{errors.refundAccount}</p>}
            </div>
          )}
        </div>

        {/* 사진 첨부 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">상품 사진 첨부</h3>
          <p className="text-sm text-gray-600 mb-3">반품 사유를 증명할 수 있는 사진을 첨부해주세요.</p>
          
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border rounded"
            />
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img src={image} alt={`첨부 이미지 ${index + 1}`} className="w-full h-24 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.images && <p className="text-red-500 text-sm">{errors.images}</p>}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '신청 중...' : '반품 신청'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  )
}