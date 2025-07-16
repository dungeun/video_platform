'use client'

import React, { useState } from 'react'
import type {
  CreateExchangeRequestData,
  RequestReason,
  ShippingAddress,
  OrderItem,
  Product
} from '../types'

interface ExchangeRequestFormProps {
  orderId: string
  orderItems: OrderItem[]
  availableProducts?: Product[]
  onSubmit: (data: CreateExchangeRequestData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

interface FormData {
  selectedItems: Array<{
    orderItemId: string
    quantity: number
    reason: RequestReason
    reasonDetail?: string
    newProductId: string
    newVariantId?: string
  }>
  shippingAddress?: ShippingAddress
  images: string[]
}

const EXCHANGE_REASONS: Array<{ value: RequestReason; label: string }> = [
  { value: 'defective', label: '불량/파손' },
  { value: 'wrong-product', label: '다른 상품 배송' },
  { value: 'not-as-described', label: '상품 설명과 다름' },
  { value: 'size-issue', label: '사이즈 문제' },
  { value: 'color-issue', label: '색상 문제' },
  { value: 'change-mind', label: '단순 변심' },
  { value: 'other', label: '기타' }
]

export function ExchangeRequestForm({
  orderId,
  orderItems,
  availableProducts = [],
  onSubmit,
  onCancel,
  loading = false
}: ExchangeRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    selectedItems: [],
    images: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [useNewAddress, setUseNewAddress] = useState(false)

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
            reasonDetail: '',
            newProductId: ''
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

  const handleAddressUpdate = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress!,
        [field]: value
      }
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.selectedItems.length === 0) {
      newErrors.items = '교환할 상품을 선택해주세요'
    }

    for (const item of formData.selectedItems) {
      if (!item.reason) {
        newErrors[`reason_${item.orderItemId}`] = '교환 사유를 선택해주세요'
      }
      if (item.reason === 'other' && !item.reasonDetail) {
        newErrors[`reasonDetail_${item.orderItemId}`] = '기타 사유를 입력해주세요'
      }
      if (item.quantity <= 0) {
        newErrors[`quantity_${item.orderItemId}`] = '올바른 수량을 입력해주세요'
      }
      if (!item.newProductId) {
        newErrors[`newProduct_${item.orderItemId}`] = '교환할 상품을 선택해주세요'
      }
    }

    if (useNewAddress && formData.shippingAddress) {
      const addr = formData.shippingAddress
      if (!addr.recipientName) newErrors.recipientName = '받는 분 이름을 입력해주세요'
      if (!addr.recipientPhone) newErrors.recipientPhone = '연락처를 입력해주세요'
      if (!addr.postalCode) newErrors.postalCode = '우편번호를 입력해주세요'
      if (!addr.address) newErrors.address = '주소를 입력해주세요'
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
        shippingAddress: useNewAddress ? formData.shippingAddress : undefined,
        images: formData.images
      })
    } catch (error) {
      console.error('교환 신청 중 오류:', error)
    }
  }

  const isItemSelected = (orderItemId: string) => {
    return formData.selectedItems.some(item => item.orderItemId === orderItemId)
  }

  const getSelectedItem = (orderItemId: string) => {
    return formData.selectedItems.find(item => item.orderItemId === orderItemId)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">교환 신청</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 상품 선택 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">교환할 상품 선택</h3>
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
                        <div className="space-y-4 mt-4 pl-4 border-l-2 border-green-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">교환 수량</label>
                              <input
                                type="number"
                                min="1"
                                max={orderItem.quantity}
                                value={selectedItem.quantity}
                                onChange={(e) => handleItemUpdate(orderItem.id, 'quantity', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded"
                              />
                              {errors[`quantity_${orderItem.id}`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`quantity_${orderItem.id}`]}</p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">교환 사유</label>
                              <select
                                value={selectedItem.reason}
                                onChange={(e) => handleItemUpdate(orderItem.id, 'reason', e.target.value as RequestReason)}
                                className="w-full px-3 py-2 border rounded"
                              >
                                {EXCHANGE_REASONS.map(reason => (
                                  <option key={reason.value} value={reason.value}>
                                    {reason.label}
                                  </option>
                                ))}
                              </select>
                              {errors[`reason_${orderItem.id}`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`reason_${orderItem.id}`]}</p>
                              )}
                            </div>
                          </div>
                          
                          {selectedItem.reason === 'other' && (
                            <div>
                              <label className="block text-sm font-medium mb-1">상세 사유</label>
                              <textarea
                                value={selectedItem.reasonDetail || ''}
                                onChange={(e) => handleItemUpdate(orderItem.id, 'reasonDetail', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                rows={2}
                                placeholder="상세한 교환 사유를 입력해주세요"
                              />
                              {errors[`reasonDetail_${orderItem.id}`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`reasonDetail_${orderItem.id}`]}</p>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">교환할 상품 선택</label>
                            <select
                              value={selectedItem.newProductId}
                              onChange={(e) => handleItemUpdate(orderItem.id, 'newProductId', e.target.value)}
                              className="w-full px-3 py-2 border rounded"
                            >
                              <option value="">상품을 선택하세요</option>
                              {availableProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - {product.price?.toLocaleString()}원
                                </option>
                              ))}
                            </select>
                            {errors[`newProduct_${orderItem.id}`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`newProduct_${orderItem.id}`]}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 배송 주소 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">배송 주소</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!useNewAddress}
                onChange={() => setUseNewAddress(false)}
              />
              <span>기존 주문 주소로 배송</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={useNewAddress}
                onChange={() => setUseNewAddress(true)}
              />
              <span>새로운 주소로 배송</span>
            </label>
          </div>
          
          {useNewAddress && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">받는 분</label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.recipientName || ''}
                    onChange={(e) => handleAddressUpdate('recipientName', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="받는 분 이름"
                  />
                  {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">연락처</label>
                  <input
                    type="tel"
                    value={formData.shippingAddress?.recipientPhone || ''}
                    onChange={(e) => handleAddressUpdate('recipientPhone', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="연락처"
                  />
                  {errors.recipientPhone && <p className="text-red-500 text-xs mt-1">{errors.recipientPhone}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">우편번호</label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.postalCode || ''}
                    onChange={(e) => handleAddressUpdate('postalCode', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="우편번호"
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">주소</label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.address || ''}
                    onChange={(e) => handleAddressUpdate('address', e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="주소"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">상세주소</label>
                <input
                  type="text"
                  value={formData.shippingAddress?.detailAddress || ''}
                  onChange={(e) => handleAddressUpdate('detailAddress', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="상세주소"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">배송 메모</label>
                <input
                  type="text"
                  value={formData.shippingAddress?.memo || ''}
                  onChange={(e) => handleAddressUpdate('memo', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="배송 시 요청사항"
                />
              </div>
            </div>
          )}
        </div>

        {/* 사진 첨부 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">상품 사진 첨부</h3>
          <p className="text-sm text-gray-600 mb-3">교환 사유를 증명할 수 있는 사진을 첨부해주세요.</p>
          
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

        {/* 안내사항 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">교환 안내사항</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 교환 상품의 가격 차이만큼 추가 결제하거나 환불받을 수 있습니다.</li>
            <li>• 교환 승인 후 기존 상품을 수거하고 새 상품을 배송해드립니다.</li>
            <li>• 교환 처리 기간은 영업일 기준 3-7일 소요됩니다.</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '신청 중...' : '교환 신청'}
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