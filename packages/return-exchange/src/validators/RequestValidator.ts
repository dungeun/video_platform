import type {
  CreateReturnRequestData,
  CreateExchangeRequestData,
  RequestReason,
  RefundMethod,
  ShippingAddress,
  ReturnExchangePolicy
} from '../types'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export class RequestValidator {
  private policy: ReturnExchangePolicy | null = null

  constructor(policy?: ReturnExchangePolicy) {
    this.policy = policy || null
  }

  setPolicy(policy: ReturnExchangePolicy): void {
    this.policy = policy
  }

  // Validate return request
  validateReturnRequest(data: CreateReturnRequestData): ValidationResult {
    const errors: ValidationError[] = []

    // Basic validation
    if (!data.orderId) {
      errors.push({
        field: 'orderId',
        message: '주문 ID가 필요합니다',
        code: 'REQUIRED'
      })
    }

    if (!data.items || data.items.length === 0) {
      errors.push({
        field: 'items',
        message: '반품할 상품을 선택해주세요',
        code: 'REQUIRED'
      })
    }

    if (!data.refundMethod) {
      errors.push({
        field: 'refundMethod',
        message: '환불 방법을 선택해주세요',
        code: 'REQUIRED'
      })
    }

    // Items validation
    if (data.items) {
      data.items.forEach((item, index) => {
        this.validateReturnItem(item, index, errors)
      })
    }

    // Refund method validation
    this.validateRefundMethod(data.refundMethod, data.refundAccount, errors)

    // Image validation
    this.validateImages(data.images, errors)

    // Policy-based validation
    if (this.policy) {
      this.validateAgainstPolicy(data, errors)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validate exchange request
  validateExchangeRequest(data: CreateExchangeRequestData): ValidationResult {
    const errors: ValidationError[] = []

    // Basic validation
    if (!data.orderId) {
      errors.push({
        field: 'orderId',
        message: '주문 ID가 필요합니다',
        code: 'REQUIRED'
      })
    }

    if (!data.items || data.items.length === 0) {
      errors.push({
        field: 'items',
        message: '교환할 상품을 선택해주세요',
        code: 'REQUIRED'
      })
    }

    // Items validation
    if (data.items) {
      data.items.forEach((item, index) => {
        this.validateExchangeItem(item, index, errors)
      })
    }

    // Shipping address validation
    if (data.shippingAddress) {
      this.validateShippingAddress(data.shippingAddress, errors)
    }

    // Image validation
    this.validateImages(data.images, errors)

    // Policy-based validation
    if (this.policy) {
      this.validateAgainstPolicy(data, errors)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validate individual return item
  private validateReturnItem(item: any, index: number, errors: ValidationError[]): void {
    const fieldPrefix = `items[${index}]`

    if (!item.orderItemId) {
      errors.push({
        field: `${fieldPrefix}.orderItemId`,
        message: '주문 상품 ID가 필요합니다',
        code: 'REQUIRED'
      })
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push({
        field: `${fieldPrefix}.quantity`,
        message: '올바른 수량을 입력해주세요',
        code: 'INVALID_VALUE'
      })
    }

    if (!item.reason) {
      errors.push({
        field: `${fieldPrefix}.reason`,
        message: '반품 사유를 선택해주세요',
        code: 'REQUIRED'
      })
    }

    if (item.reason === 'other' && !item.reasonDetail) {
      errors.push({
        field: `${fieldPrefix}.reasonDetail`,
        message: '기타 사유를 입력해주세요',
        code: 'REQUIRED'
      })
    }

    // Validate reason detail length
    if (item.reasonDetail && item.reasonDetail.length > 500) {
      errors.push({
        field: `${fieldPrefix}.reasonDetail`,
        message: '사유는 500자 이내로 입력해주세요',
        code: 'MAX_LENGTH'
      })
    }
  }

  // Validate individual exchange item
  private validateExchangeItem(item: any, index: number, errors: ValidationError[]): void {
    const fieldPrefix = `items[${index}]`

    if (!item.orderItemId) {
      errors.push({
        field: `${fieldPrefix}.orderItemId`,
        message: '주문 상품 ID가 필요합니다',
        code: 'REQUIRED'
      })
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push({
        field: `${fieldPrefix}.quantity`,
        message: '올바른 수량을 입력해주세요',
        code: 'INVALID_VALUE'
      })
    }

    if (!item.reason) {
      errors.push({
        field: `${fieldPrefix}.reason`,
        message: '교환 사유를 선택해주세요',
        code: 'REQUIRED'
      })
    }

    if (item.reason === 'other' && !item.reasonDetail) {
      errors.push({
        field: `${fieldPrefix}.reasonDetail`,
        message: '기타 사유를 입력해주세요',
        code: 'REQUIRED'
      })
    }

    if (!item.newProductId) {
      errors.push({
        field: `${fieldPrefix}.newProductId`,
        message: '교환할 상품을 선택해주세요',
        code: 'REQUIRED'
      })
    }

    // Validate reason detail length
    if (item.reasonDetail && item.reasonDetail.length > 500) {
      errors.push({
        field: `${fieldPrefix}.reasonDetail`,
        message: '사유는 500자 이내로 입력해주세요',
        code: 'MAX_LENGTH'
      })
    }
  }

  // Validate refund method
  private validateRefundMethod(
    refundMethod: RefundMethod,
    refundAccount: any,
    errors: ValidationError[]
  ): void {
    if (refundMethod === 'account') {
      if (!refundAccount) {
        errors.push({
          field: 'refundAccount',
          message: '환불받을 계좌 정보를 입력해주세요',
          code: 'REQUIRED'
        })
        return
      }

      if (!refundAccount.bankCode) {
        errors.push({
          field: 'refundAccount.bankCode',
          message: '은행을 선택해주세요',
          code: 'REQUIRED'
        })
      }

      if (!refundAccount.accountNumber) {
        errors.push({
          field: 'refundAccount.accountNumber',
          message: '계좌번호를 입력해주세요',
          code: 'REQUIRED'
        })
      } else if (!this.validateAccountNumber(refundAccount.accountNumber)) {
        errors.push({
          field: 'refundAccount.accountNumber',
          message: '올바른 계좌번호를 입력해주세요',
          code: 'INVALID_FORMAT'
        })
      }

      if (!refundAccount.accountHolder) {
        errors.push({
          field: 'refundAccount.accountHolder',
          message: '예금주명을 입력해주세요',
          code: 'REQUIRED'
        })
      } else if (!this.validateAccountHolder(refundAccount.accountHolder)) {
        errors.push({
          field: 'refundAccount.accountHolder',
          message: '올바른 예금주명을 입력해주세요 (한글 2-20자)',
          code: 'INVALID_FORMAT'
        })
      }
    }
  }

  // Validate shipping address
  private validateShippingAddress(address: ShippingAddress, errors: ValidationError[]): void {
    if (!address.recipientName) {
      errors.push({
        field: 'shippingAddress.recipientName',
        message: '받는 분 이름을 입력해주세요',
        code: 'REQUIRED'
      })
    } else if (!this.validateName(address.recipientName)) {
      errors.push({
        field: 'shippingAddress.recipientName',
        message: '올바른 이름을 입력해주세요 (한글 2-20자)',
        code: 'INVALID_FORMAT'
      })
    }

    if (!address.recipientPhone) {
      errors.push({
        field: 'shippingAddress.recipientPhone',
        message: '연락처를 입력해주세요',
        code: 'REQUIRED'
      })
    } else if (!this.validatePhoneNumber(address.recipientPhone)) {
      errors.push({
        field: 'shippingAddress.recipientPhone',
        message: '올바른 연락처를 입력해주세요',
        code: 'INVALID_FORMAT'
      })
    }

    if (!address.postalCode) {
      errors.push({
        field: 'shippingAddress.postalCode',
        message: '우편번호를 입력해주세요',
        code: 'REQUIRED'
      })
    } else if (!this.validatePostalCode(address.postalCode)) {
      errors.push({
        field: 'shippingAddress.postalCode',
        message: '올바른 우편번호를 입력해주세요 (5자리 숫자)',
        code: 'INVALID_FORMAT'
      })
    }

    if (!address.address) {
      errors.push({
        field: 'shippingAddress.address',
        message: '주소를 입력해주세요',
        code: 'REQUIRED'
      })
    }
  }

  // Validate images
  private validateImages(images: string[] | undefined, errors: ValidationError[]): void {
    if (this.policy?.requiresPhoto && (!images || images.length === 0)) {
      errors.push({
        field: 'images',
        message: '상품 사진을 첨부해주세요',
        code: 'REQUIRED'
      })
    }

    if (images && images.length > 10) {
      errors.push({
        field: 'images',
        message: '사진은 최대 10장까지 첨부할 수 있습니다',
        code: 'MAX_COUNT'
      })
    }
  }

  // Validate against policy
  private validateAgainstPolicy(
    data: CreateReturnRequestData | CreateExchangeRequestData,
    errors: ValidationError[]
  ): void {
    if (!this.policy) return

    // Check if items belong to non-returnable categories
    // This would require product category information
    // For now, this is a placeholder

    // Validate reasons
    if (data.items) {
      data.items.forEach((item, index) => {
        if (!this.isValidReason(item.reason)) {
          errors.push({
            field: `items[${index}].reason`,
            message: '선택할 수 없는 사유입니다',
            code: 'INVALID_REASON'
          })
        }
      })
    }
  }

  // Helper validation methods
  private validateAccountNumber(accountNumber: string): boolean {
    // Basic account number validation (10-20 digits)
    const accountRegex = /^\d{10,20}$/
    return accountRegex.test(accountNumber.replace(/-/g, ''))
  }

  private validateAccountHolder(name: string): boolean {
    // Korean name validation (2-20 characters)
    const nameRegex = /^[가-힣]{2,20}$/
    return nameRegex.test(name)
  }

  private validateName(name: string): boolean {
    // Name validation (Korean or English, 2-20 characters)
    const nameRegex = /^[가-힣a-zA-Z\s]{2,20}$/
    return nameRegex.test(name)
  }

  private validatePhoneNumber(phone: string): boolean {
    // Korean phone number validation
    const phoneRegex = /^01[016789]-?\d{3,4}-?\d{4}$/
    return phoneRegex.test(phone.replace(/[\s-]/g, ''))
  }

  private validatePostalCode(postalCode: string): boolean {
    // Korean postal code validation (5 digits)
    const postalRegex = /^\d{5}$/
    return postalRegex.test(postalCode)
  }

  private isValidReason(reason: RequestReason): boolean {
    const validReasons: RequestReason[] = [
      'defective',
      'wrong-product',
      'change-mind',
      'size-issue',
      'color-issue',
      'not-as-described',
      'other'
    ]
    return validReasons.includes(reason)
  }
}

// Utility functions for form validation
export const validateField = (value: any, rules: ValidationRule[]): ValidationError[] => {
  const errors: ValidationError[] = []

  for (const rule of rules) {
    const result = rule.validate(value)
    if (!result.valid) {
      errors.push({
        field: rule.field,
        message: result.message,
        code: rule.code
      })
    }
  }

  return errors
}

export interface ValidationRule {
  field: string
  code: string
  validate: (value: any) => { valid: boolean; message: string }
}

// Pre-defined validation rules
export const ValidationRules = {
  required: (field: string, message?: string): ValidationRule => ({
    field,
    code: 'REQUIRED',
    validate: (value: any) => ({
      valid: value !== null && value !== undefined && value !== '',
      message: message || `${field}는 필수입니다`
    })
  }),

  minLength: (field: string, min: number, message?: string): ValidationRule => ({
    field,
    code: 'MIN_LENGTH',
    validate: (value: string) => ({
      valid: !value || value.length >= min,
      message: message || `${field}는 최소 ${min}자 이상이어야 합니다`
    })
  }),

  maxLength: (field: string, max: number, message?: string): ValidationRule => ({
    field,
    code: 'MAX_LENGTH',
    validate: (value: string) => ({
      valid: !value || value.length <= max,
      message: message || `${field}는 최대 ${max}자까지 입력할 수 있습니다`
    })
  }),

  pattern: (field: string, pattern: RegExp, message: string): ValidationRule => ({
    field,
    code: 'INVALID_FORMAT',
    validate: (value: string) => ({
      valid: !value || pattern.test(value),
      message
    })
  }),

  min: (field: string, min: number, message?: string): ValidationRule => ({
    field,
    code: 'MIN_VALUE',
    validate: (value: number) => ({
      valid: value >= min,
      message: message || `${field}는 ${min} 이상이어야 합니다`
    })
  }),

  max: (field: string, max: number, message?: string): ValidationRule => ({
    field,
    code: 'MAX_VALUE',
    validate: (value: number) => ({
      valid: value <= max,
      message: message || `${field}는 ${max} 이하여야 합니다`
    })
  })
}

// Export default validator instance
export const requestValidator = new RequestValidator()