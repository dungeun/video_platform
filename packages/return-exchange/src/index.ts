// Export types
export type * from './types'

// Export services
export { ReturnExchangeService, returnExchangeService } from './services/ReturnExchangeService'

// Export entities
export { ReturnRequest } from './entities/ReturnRequest'
export { ExchangeRequest } from './entities/ExchangeRequest'

// Export components
export { ReturnRequestForm } from './components/ReturnRequestForm'
export { ExchangeRequestForm } from './components/ExchangeRequestForm'
export { RequestStatusTracker } from './components/RequestStatusTracker'

// Export hooks
export {
  useReturnExchange,
  useReturnRequest,
  useExchangeRequest,
  useEligibilityCheck
} from './hooks/useReturnExchange'

// Export validators
export {
  RequestValidator,
  requestValidator,
  validateField,
  ValidationRules,
  type ValidationResult,
  type ValidationError,
  type ValidationRule
} from './validators/RequestValidator'

// Export utilities
export {
  // Status utilities
  getStatusText,
  getStatusColor,
  isStatusFinal,
  isStatusActionable,
  
  // Reason utilities
  getReasonText,
  isReasonCustomerFault,
  isReasonCompanyFault,
  
  // Refund utilities
  getRefundMethodText,
  
  // Inspection utilities
  getInspectionResultText,
  getInspectionResultColor,
  
  // Date utilities
  formatDate,
  getRelativeTime,
  getDaysSince,
  
  // Price utilities
  formatPrice,
  formatPriceWithCurrency,
  
  // Request utilities
  getRequestTypeText,
  getRequestTotalAmount,
  getRequestItemCount,
  canRequestBeCancelled,
  getProcessingTime,
  
  // Validation utilities
  isValidPhoneNumber,
  isValidEmail,
  isValidPostalCode,
  
  // Image utilities
  getImageUrl,
  isImageFile,
  getImageFileSize,
  
  // Tracking utilities
  formatTrackingNumber,
  getTrackingUrl,
  
  // Utility object
  ReturnExchangeUtils,
  
  // Named exports for convenience
  statusText,
  statusColor,
  reasonText,
  refundMethodText,
  price,
  priceWithCurrency,
  date,
  relativeTime
} from './utils'

// Default export - main service instance
export { returnExchangeService as default } from './services/ReturnExchangeService'

// Re-export common types for convenience
export type {
  ReturnRequest as IReturnRequest,
  ExchangeRequest as IExchangeRequest,
  CreateReturnRequestData,
  CreateExchangeRequestData,
  RequestStatus,
  RequestReason,
  RefundMethod,
  InspectionResult,
  ReturnExchangePolicy,
  EligibilityResult
} from './types'