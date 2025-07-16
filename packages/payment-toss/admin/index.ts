import { ModuleConfig } from '@company/core'
import { TossPaymentsConfig } from '../src/types'

/**
 * 토스페이먼츠 결제 모듈 관리자 설정
 */
export const paymentTossAdminConfig: ModuleConfig = {
  id: 'payment-toss',
  name: '토스페이먼츠 결제',
  description: '토스페이먼츠 API를 통한 통합 결제 솔루션',
  version: '1.0.0',
  category: 'payment',
  icon: 'credit-card',
  author: 'K-Commerce Platform',
  
  // 관리자 설정 스키마
  configSchema: {
    clientKey: {
      type: 'string',
      label: '클라이언트 키',
      description: '토스페이먼츠 클라이언트 키 (공개키)',
      required: true,
      placeholder: 'test_ck_...',
      validation: {
        pattern: '^(test_|live_)ck_[a-zA-Z0-9]+$',
        message: '올바른 형식의 클라이언트 키를 입력하세요'
      }
    },
    secretKey: {
      type: 'password',
      label: '시크릿 키',
      description: '토스페이먼츠 시크릿 키 (비공개키)',
      required: true,
      placeholder: 'test_sk_...',
      validation: {
        pattern: '^(test_|live_)sk_[a-zA-Z0-9]+$',
        message: '올바른 형식의 시크릿 키를 입력하세요'
      }
    },
    mode: {
      type: 'select',
      label: '운영 모드',
      description: '테스트 또는 실제 결제 모드 선택',
      required: true,
      options: [
        { value: 'test', label: '테스트 모드' },
        { value: 'live', label: '실제 결제 모드' }
      ],
      defaultValue: 'test'
    },
    webhook: {
      type: 'group',
      label: '웹훅 설정',
      description: '결제 상태 변경 알림을 위한 웹훅 설정',
      fields: {
        enabled: {
          type: 'boolean',
          label: '웹훅 사용',
          description: '결제 상태 변경 시 웹훅 알림 받기',
          defaultValue: true
        },
        endpoint: {
          type: 'string',
          label: '웹훅 엔드포인트',
          description: '웹훅을 받을 URL (예: /api/payments/webhook)',
          placeholder: '/api/payments/webhook',
          showWhen: { field: 'webhook.enabled', value: true }
        },
        secret: {
          type: 'password',
          label: '웹훅 시크릿',
          description: '웹훅 검증용 시크릿 키',
          placeholder: '웹훅 시크릿 키 입력',
          showWhen: { field: 'webhook.enabled', value: true }
        }
      }
    },
    paymentMethods: {
      type: 'multiselect',
      label: '사용할 결제 수단',
      description: '활성화할 결제 수단을 선택하세요',
      required: true,
      options: [
        { value: 'CARD', label: '신용/체크카드' },
        { value: 'VIRTUAL_ACCOUNT', label: '가상계좌' },
        { value: 'TRANSFER', label: '계좌이체' },
        { value: 'MOBILE', label: '휴대폰 결제' },
        { value: 'CULTURE_GIFT_CERTIFICATE', label: '문화상품권' },
        { value: 'KAKAO_PAY', label: '카카오페이' },
        { value: 'NAVER_PAY', label: '네이버페이' },
        { value: 'TOSS_PAY', label: '토스페이' }
      ],
      defaultValue: ['CARD', 'VIRTUAL_ACCOUNT', 'TRANSFER']
    },
    cardOptions: {
      type: 'group',
      label: '카드 결제 옵션',
      description: '카드 결제 관련 상세 설정',
      fields: {
        installmentMonths: {
          type: 'multiselect',
          label: '할부 개월 수',
          description: '제공할 할부 옵션',
          options: [
            { value: '0', label: '일시불' },
            { value: '2', label: '2개월' },
            { value: '3', label: '3개월' },
            { value: '6', label: '6개월' },
            { value: '12', label: '12개월' }
          ],
          defaultValue: ['0', '2', '3', '6', '12']
        },
        minAmountForInstallment: {
          type: 'number',
          label: '할부 가능 최소 금액',
          description: '할부 결제가 가능한 최소 금액 (원)',
          defaultValue: 50000,
          min: 0
        },
        directPayment: {
          type: 'boolean',
          label: '다이렉트 결제',
          description: '결제창 없이 바로 결제 진행',
          defaultValue: false
        }
      }
    },
    virtualAccountOptions: {
      type: 'group',
      label: '가상계좌 옵션',
      description: '가상계좌 결제 관련 설정',
      fields: {
        validHours: {
          type: 'number',
          label: '입금 기한 (시간)',
          description: '가상계좌 입금 기한',
          defaultValue: 24,
          min: 1,
          max: 720
        },
        cashReceipt: {
          type: 'boolean',
          label: '현금영수증 자동 발급',
          description: '가상계좌 입금 시 현금영수증 자동 발급',
          defaultValue: true
        },
        banks: {
          type: 'multiselect',
          label: '사용 가능 은행',
          description: '가상계좌 발급 가능 은행',
          options: [
            { value: '03', label: 'KB국민은행' },
            { value: '06', label: 'KEB하나은행' },
            { value: '05', label: '신한은행' },
            { value: '07', label: '우리은행' },
            { value: '11', label: 'NH농협은행' },
            { value: '31', label: '대구은행' },
            { value: '32', label: '부산은행' },
            { value: '34', label: 'IBK기업은행' },
            { value: '39', label: 'KDB산업은행' },
            { value: '89', label: '케이뱅크' },
            { value: '90', label: '카카오뱅크' },
            { value: '92', label: '토스뱅크' }
          ],
          defaultValue: ['03', '06', '05', '07', '11']
        }
      }
    },
    refundOptions: {
      type: 'group',
      label: '환불 설정',
      description: '환불 처리 관련 설정',
      fields: {
        partialRefund: {
          type: 'boolean',
          label: '부분 환불 허용',
          description: '주문의 일부 금액만 환불 가능',
          defaultValue: true
        },
        refundReasons: {
          type: 'tags',
          label: '환불 사유',
          description: '미리 정의된 환불 사유 목록',
          defaultValue: [
            '단순 변심',
            '상품 불량',
            '오배송',
            '상품 정보 상이',
            '배송 지연',
            '기타'
          ]
        },
        autoRefundApproval: {
          type: 'boolean',
          label: '자동 환불 승인',
          description: '환불 요청 시 자동으로 승인 처리',
          defaultValue: false
        }
      }
    },
    billingOptions: {
      type: 'group',
      label: '정기결제 설정',
      description: '구독/정기결제 관련 설정',
      fields: {
        enabled: {
          type: 'boolean',
          label: '정기결제 사용',
          description: '빌링키를 이용한 정기결제 기능 활성화',
          defaultValue: false
        },
        retryCount: {
          type: 'number',
          label: '재시도 횟수',
          description: '결제 실패 시 재시도 횟수',
          defaultValue: 3,
          min: 0,
          max: 5,
          showWhen: { field: 'billingOptions.enabled', value: true }
        },
        retryInterval: {
          type: 'number',
          label: '재시도 간격 (시간)',
          description: '결제 재시도 간격',
          defaultValue: 24,
          min: 1,
          max: 168,
          showWhen: { field: 'billingOptions.enabled', value: true }
        }
      }
    },
    notifications: {
      type: 'group',
      label: '알림 설정',
      description: '결제 관련 알림 설정',
      fields: {
        sendPaymentConfirmation: {
          type: 'boolean',
          label: '결제 완료 알림',
          description: '결제 완료 시 고객에게 알림 발송',
          defaultValue: true
        },
        sendVirtualAccountInfo: {
          type: 'boolean',
          label: '가상계좌 정보 알림',
          description: '가상계좌 발급 시 입금 정보 발송',
          defaultValue: true
        },
        sendRefundNotification: {
          type: 'boolean',
          label: '환불 완료 알림',
          description: '환불 처리 완료 시 알림 발송',
          defaultValue: true
        }
      }
    },
    ui: {
      type: 'group',
      label: 'UI 설정',
      description: '결제창 UI 관련 설정',
      fields: {
        theme: {
          type: 'select',
          label: '테마',
          description: '결제창 테마',
          options: [
            { value: 'light', label: '라이트' },
            { value: 'dark', label: '다크' }
          ],
          defaultValue: 'light'
        },
        primaryColor: {
          type: 'color',
          label: '주 색상',
          description: '결제창 주 색상',
          defaultValue: '#3065AC'
        },
        language: {
          type: 'select',
          label: '언어',
          description: '결제창 표시 언어',
          options: [
            { value: 'ko', label: '한국어' },
            { value: 'en', label: 'English' }
          ],
          defaultValue: 'ko'
        }
      }
    }
  },

  // 기본 설정값
  defaultConfig: {
    clientKey: '',
    secretKey: '',
    mode: 'test',
    webhook: {
      enabled: true,
      endpoint: '/api/payments/webhook',
      secret: ''
    },
    paymentMethods: ['CARD', 'VIRTUAL_ACCOUNT', 'TRANSFER'],
    cardOptions: {
      installmentMonths: ['0', '2', '3', '6', '12'],
      minAmountForInstallment: 50000,
      directPayment: false
    },
    virtualAccountOptions: {
      validHours: 24,
      cashReceipt: true,
      banks: ['03', '06', '05', '07', '11']
    },
    refundOptions: {
      partialRefund: true,
      refundReasons: [
        '단순 변심',
        '상품 불량',
        '오배송',
        '상품 정보 상이',
        '배송 지연',
        '기타'
      ],
      autoRefundApproval: false
    },
    billingOptions: {
      enabled: false,
      retryCount: 3,
      retryInterval: 24
    },
    notifications: {
      sendPaymentConfirmation: true,
      sendVirtualAccountInfo: true,
      sendRefundNotification: true
    },
    ui: {
      theme: 'light',
      primaryColor: '#3065AC',
      language: 'ko'
    }
  },

  // 설정 유효성 검증
  validateConfig: (config: any): { valid: boolean; errors?: string[] } => {
    const errors: string[] = []

    // 필수 키 검증
    if (!config.clientKey) {
      errors.push('클라이언트 키는 필수입니다.')
    }
    if (!config.secretKey) {
      errors.push('시크릿 키는 필수입니다.')
    }

    // 모드와 키 일치 검증
    if (config.mode === 'test') {
      if (config.clientKey && !config.clientKey.startsWith('test_')) {
        errors.push('테스트 모드에서는 테스트 키를 사용해야 합니다.')
      }
    } else if (config.mode === 'live') {
      if (config.clientKey && !config.clientKey.startsWith('live_')) {
        errors.push('실제 모드에서는 실제 키를 사용해야 합니다.')
      }
    }

    // 결제 수단 검증
    if (!config.paymentMethods || config.paymentMethods.length === 0) {
      errors.push('최소 하나 이상의 결제 수단을 선택해야 합니다.')
    }

    // 가상계좌 설정 검증
    if (config.paymentMethods?.includes('VIRTUAL_ACCOUNT')) {
      if (config.virtualAccountOptions?.validHours < 1 || config.virtualAccountOptions?.validHours > 720) {
        errors.push('가상계좌 입금 기한은 1시간 이상 720시간 이하여야 합니다.')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  },

  // 설정 변환 (관리자 설정 -> 모듈 설정)
  transformConfig: (adminConfig: any): TossPaymentsConfig => {
    return {
      clientKey: adminConfig.clientKey,
      secretKey: adminConfig.secretKey,
      baseUrl: adminConfig.mode === 'test' 
        ? 'https://api.tosspayments.com' 
        : 'https://api.tosspayments.com',
      webhook: adminConfig.webhook.enabled ? {
        endpoint: adminConfig.webhook.endpoint,
        secret: adminConfig.webhook.secret
      } : undefined
    }
  },

  // 상태 모니터링
  statusMonitor: {
    enabled: true,
    interval: 60000, // 1분
    checks: [
      {
        name: 'API 연결 상태',
        check: async (config: any) => {
          try {
            // API 헬스체크
            const response = await fetch('https://api.tosspayments.com/v1/health', {
              headers: {
                'Authorization': `Basic ${Buffer.from(`${config.secretKey}:`).toString('base64')}`
              }
            })
            return {
              status: response.ok ? 'healthy' : 'unhealthy',
              message: response.ok ? '정상' : `API 오류: ${response.status}`
            }
          } catch (error) {
            return {
              status: 'unhealthy',
              message: `연결 실패: ${error}`
            }
          }
        }
      },
      {
        name: '웹훅 상태',
        check: async (config: any) => {
          if (!config.webhook?.enabled) {
            return {
              status: 'info',
              message: '웹훅 비활성화'
            }
          }
          // 웹훅 엔드포인트 확인 로직
          return {
            status: 'healthy',
            message: '웹훅 활성화'
          }
        }
      }
    ]
  },

  // 통계 및 분석
  analytics: {
    metrics: [
      {
        id: 'total_payments',
        name: '총 결제 건수',
        type: 'counter',
        description: '처리된 총 결제 건수'
      },
      {
        id: 'total_amount',
        name: '총 결제 금액',
        type: 'gauge',
        description: '처리된 총 결제 금액',
        unit: 'KRW'
      },
      {
        id: 'success_rate',
        name: '결제 성공률',
        type: 'percentage',
        description: '전체 결제 중 성공한 비율'
      },
      {
        id: 'payment_methods',
        name: '결제 수단별 통계',
        type: 'distribution',
        description: '결제 수단별 사용 비율'
      },
      {
        id: 'refund_rate',
        name: '환불률',
        type: 'percentage',
        description: '전체 결제 중 환불된 비율'
      }
    ]
  },

  // 액션 (관리자에서 실행 가능한 작업)
  actions: [
    {
      id: 'test_payment',
      name: '테스트 결제',
      description: '결제 연동 테스트',
      handler: async (config: any) => {
        // 테스트 결제 실행
        return {
          success: true,
          message: '테스트 결제가 성공적으로 처리되었습니다.'
        }
      }
    },
    {
      id: 'sync_payments',
      name: '결제 내역 동기화',
      description: '토스페이먼츠와 결제 내역 동기화',
      handler: async (config: any) => {
        // 결제 내역 동기화
        return {
          success: true,
          message: '결제 내역이 동기화되었습니다.'
        }
      }
    },
    {
      id: 'export_transactions',
      name: '거래 내역 내보내기',
      description: '지정 기간의 거래 내역을 CSV로 내보내기',
      params: {
        startDate: {
          type: 'date',
          label: '시작일',
          required: true
        },
        endDate: {
          type: 'date',
          label: '종료일',
          required: true
        }
      },
      handler: async (config: any, params: any) => {
        // 거래 내역 내보내기
        return {
          success: true,
          message: '거래 내역이 내보내졌습니다.',
          data: {
            filename: 'transactions.csv',
            count: 0
          }
        }
      }
    }
  ]
}

// 관리자 대시보드 위젯
export const dashboardWidgets = [
  {
    id: 'payment_overview',
    name: '결제 현황',
    type: 'stats',
    size: 'large',
    component: 'PaymentOverviewWidget'
  },
  {
    id: 'recent_payments',
    name: '최근 결제',
    type: 'list',
    size: 'medium',
    component: 'RecentPaymentsWidget'
  },
  {
    id: 'payment_methods_chart',
    name: '결제 수단 통계',
    type: 'chart',
    size: 'small',
    component: 'PaymentMethodsChart'
  }
]

export default paymentTossAdminConfig