import { NextResponse } from 'next/server'

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: any
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// 공통 에러 타입
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

// 에러 응답 생성
export function createErrorResponse(error: unknown): NextResponse {
  // AppError 인스턴스인 경우
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && { details: error.details })
        }
      },
      { status: error.statusCode }
    )
  }

  // Prisma 에러 처리
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            message: '이미 존재하는 데이터입니다.',
            code: ErrorTypes.CONFLICT
          }
        },
        { status: 409 }
      )
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            message: '요청한 데이터를 찾을 수 없습니다.',
            code: ErrorTypes.NOT_FOUND
          }
        },
        { status: 404 }
      )
    }
    
    // Foreign key constraint
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        {
          error: {
            message: '참조하는 데이터가 존재하지 않습니다.',
            code: ErrorTypes.VALIDATION_ERROR
          }
        },
        { status: 400 }
      )
    }
  }

  // 일반 Error 인스턴스
  if (error instanceof Error) {
    // 인증 관련 에러
    if (error.message.toLowerCase().includes('unauthorized') || 
        error.message.toLowerCase().includes('invalid credentials')) {
      return NextResponse.json(
        {
          error: {
            message: '인증에 실패했습니다.',
            code: ErrorTypes.AUTHENTICATION_ERROR
          }
        },
        { status: 401 }
      )
    }

    // 권한 관련 에러
    if (error.message.toLowerCase().includes('forbidden') || 
        error.message.toLowerCase().includes('permission')) {
      return NextResponse.json(
        {
          error: {
            message: '권한이 없습니다.',
            code: ErrorTypes.AUTHORIZATION_ERROR
          }
        },
        { status: 403 }
      )
    }

    // 일반적인 에러
    return NextResponse.json(
      {
        error: {
          message: process.env.NODE_ENV === 'production' 
            ? '서버 오류가 발생했습니다.' 
            : error.message,
          code: ErrorTypes.INTERNAL_ERROR,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
      },
      { status: 500 }
    )
  }

  // 알 수 없는 에러
  console.error('Unknown error:', error)
  return NextResponse.json(
    {
      error: {
        message: '알 수 없는 오류가 발생했습니다.',
        code: ErrorTypes.INTERNAL_ERROR
      }
    },
    { status: 500 }
  )
}

// 에러 로깅
export function logError(error: unknown, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  
  if (error instanceof AppError) {
    console.error(`[${timestamp}] AppError:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      details: error.details,
      context,
      stack: error.stack
    })
  } else if (error instanceof Error) {
    console.error(`[${timestamp}] Error:`, {
      message: error.message,
      context,
      stack: error.stack
    })
  } else {
    console.error(`[${timestamp}] Unknown error:`, {
      error,
      context
    })
  }
  
  // TODO: 프로덕션에서는 Sentry 등의 에러 모니터링 서비스로 전송
  // if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context })
  // }
}

// 비동기 에러 핸들러 래퍼
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error, { function: fn.name, args })
      throw error
    }
  }) as T
}