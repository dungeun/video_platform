import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get content type
    const contentType = request.headers.get('content-type')
    
    // Try different ways to get the body
    let body;
    let bodyText;
    let parseSuccess = false;
    let parseError = null;
    
    try {
      // Clone the request to read the body text
      const clonedRequest = request.clone()
      bodyText = await clonedRequest.text()
      
      // Try to parse JSON
      if (bodyText) {
        body = JSON.parse(bodyText)
        parseSuccess = true
      }
    } catch (error) {
      parseError = error instanceof Error ? error.message : 'Unknown error'
    }
    
    // Try the standard way as fallback
    if (!parseSuccess) {
      try {
        body = await request.json()
        parseSuccess = true
      } catch (error) {
        // Already captured the error above
      }
    }
    
    return NextResponse.json({
      debug: {
        contentType,
        bodyText: bodyText ? bodyText.substring(0, 200) : null,
        bodyLength: bodyText ? bodyText.length : 0,
        parseSuccess,
        parseError,
        parsedBody: body,
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries())
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test login endpoint - use POST method',
    expectedBody: {
      email: 'admin@videopick.com',
      password: 'admin123!@#'
    }
  })
}