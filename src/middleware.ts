import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the origin making the request
  const origin = request.headers.get('origin')

  // Define response headers
  const headers = {
    'Access-Control-Allow-Origin': origin || 'https://intranet.multiclubes.com.br',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { headers })
  }

  // Add headers to the response
  const response = NextResponse.next()
  
  // Add CORS headers to all responses
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Configure which routes should be handled by the middleware
export const config = {
  matcher: '/api/:path*',
}
