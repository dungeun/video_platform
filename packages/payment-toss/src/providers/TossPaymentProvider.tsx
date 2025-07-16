import React, { createContext, useContext, ReactNode } from 'react'
import { TossPaymentService } from '../services/TossPaymentService'
import { TossPaymentsConfig } from '../types'

interface TossPaymentContextType {
  service: TossPaymentService
  config: TossPaymentsConfig
}

const TossPaymentContext = createContext<TossPaymentContextType | undefined>(undefined)

interface TossPaymentProviderProps {
  children: ReactNode
  config: TossPaymentsConfig
}

/**
 * 토스페이먼츠 결제 서비스 Provider
 * 
 * @example
 * ```tsx
 * const config = {
 *   clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
 *   secretKey: process.env.TOSS_SECRET_KEY
 * }
 * 
 * <TossPaymentProvider config={config}>
 *   <App />
 * </TossPaymentProvider>
 * ```
 */
export const TossPaymentProvider: React.FC<TossPaymentProviderProps> = ({ children, config }) => {
  const service = new TossPaymentService(config)

  return (
    <TossPaymentContext.Provider value={{ service, config }}>
      {children}
    </TossPaymentContext.Provider>
  )
}

/**
 * 토스페이먼츠 결제 서비스 Context Hook
 * 
 * @example
 * ```tsx
 * const { service, config } = useTossPaymentContext()
 * ```
 */
export const useTossPaymentContext = (): TossPaymentContextType => {
  const context = useContext(TossPaymentContext)
  if (!context) {
    throw new Error('useTossPaymentContext must be used within a TossPaymentProvider')
  }
  return context
}

export default TossPaymentProvider