import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// TUS 업로드 서버를 직접 Next.js에 통합하는 대신
// 별도 TUS 서버로 프록시하는 방식 사용
export async function POST(req: NextRequest) {
  return handleTusRequest(req, 'POST')
}

export async function PATCH(req: NextRequest) {
  return handleTusRequest(req, 'PATCH')
}

export async function HEAD(req: NextRequest) {
  return handleTusRequest(req, 'HEAD')
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, HEAD, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Upload-Offset, Upload-Length, Upload-Metadata, Tus-Resumable, Content-Type, Authorization',
      'Access-Control-Expose-Headers': 'Upload-Offset, Upload-Length, Upload-Metadata, Tus-Resumable, Location',
      'Tus-Resumable': '1.0.0',
      'Tus-Version': '1.0.0',
      'Tus-Extension': 'creation,expiration,checksum,termination'
    }
  })
}

async function handleTusRequest(req: NextRequest, method: string) {
  try {
    // JWT 토큰 확인 (POST 요청의 경우만)
    if (method === 'POST') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const token = authHeader.substring(7)
      try {
        const decoded = verify(token, JWT_SECRET) as any
        const userId = decoded.userId
        
        // 메타데이터에 사용자 ID 추가
        const metadata = req.headers.get('upload-metadata') || ''
        const updatedMetadata = `${metadata}${metadata ? ',' : ''}userId ${btoa(userId)}`
        
        // 헤더 수정
        const newHeaders = new Headers(req.headers)
        newHeaders.set('upload-metadata', updatedMetadata)
        
        // 수정된 요청으로 TUS 서버에 전달
        const tusResponse = await fetch('http://localhost:3001/api/upload/video/tus', {
          method: method,
          headers: newHeaders,
          body: method !== 'GET' && method !== 'HEAD' ? await req.blob() : undefined,
        })

        return createTusResponse(tusResponse)
      } catch (jwtError) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    // 다른 HTTP 메소드는 그대로 TUS 서버로 전달
    const tusResponse = await fetch(`http://localhost:3001/api/upload/video/tus`, {
      method: method,
      headers: req.headers,
      body: method !== 'GET' && method !== 'HEAD' ? await req.blob() : undefined,
    })

    return createTusResponse(tusResponse)

  } catch (error) {
    console.error('TUS proxy error:', error)
    return NextResponse.json({ 
      error: 'Upload service unavailable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}

async function createTusResponse(tusResponse: Response): Promise<NextResponse> {
  const body = tusResponse.headers.get('content-type')?.includes('application/json') 
    ? await tusResponse.json()
    : await tusResponse.text()

  const response = new NextResponse(
    tusResponse.headers.get('content-type')?.includes('application/json') 
      ? JSON.stringify(body)
      : body,
    { 
      status: tusResponse.status,
      statusText: tusResponse.statusText
    }
  )

  // TUS 헤더 복사
  const tusHeaders = [
    'upload-offset',
    'upload-length',
    'upload-metadata', 
    'location',
    'tus-resumable',
    'tus-version',
    'tus-extension',
    'cache-control',
    'expires'
  ]

  tusHeaders.forEach(header => {
    const value = tusResponse.headers.get(header)
    if (value) {
      response.headers.set(header, value)
    }
  })

  // CORS 헤더 추가
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Expose-Headers', tusHeaders.join(', '))

  return response
}