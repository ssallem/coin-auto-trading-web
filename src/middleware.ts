/**
 * Edge Runtime 미들웨어 - 세션 기반 접근 제어
 *
 * jose의 jwtVerify로 세션 쿠키를 검증합니다.
 * - 보호 경로: /(dashboard)/*, /api/* (auth 제외)
 * - 공개 경로: /login, /api/auth/*, /_next/*, /favicon.ico
 * - 세션 없거나 만료 → /login 리다이렉트
 * - /login에 유효한 세션 → /portfolio 리다이렉트
 */
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/** 세션 쿠키 이름 (session.ts와 동일) */
const SESSION_COOKIE_NAME = 'session'

/** 공개 경로 패턴 (인증 불필요) - logout은 인증된 사용자만 호출 가능 */
const PUBLIC_PATHS = ['/login', '/api/auth/login']

/**
 * 세션 토큰의 유효성을 검증합니다.
 * Edge Runtime에서 실행 가능한 jose의 jwtVerify를 사용합니다.
 */
async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET
    if (!secret) return false

    const key = new TextEncoder().encode(secret)
    await jwtVerify(token, key)
    return true
  } catch {
    // 만료, 서명 불일치, 형식 오류 등 모든 검증 실패
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로인지 확인
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path)

  // 세션 쿠키에서 토큰 추출
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isValidSession = sessionToken
    ? await verifySessionToken(sessionToken)
    : false

  // /login 페이지에 유효한 세션이 있으면 /portfolio로 리다이렉트
  if (pathname === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/portfolio', request.url))
  }

  // 공개 경로는 그대로 통과
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 보호 경로인데 세션이 없거나 만료된 경우 → /login 리다이렉트
  if (!isValidSession) {
    // API 요청인 경우 JSON 401 응답
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 페이지 요청인 경우 /login으로 리다이렉트
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

/**
 * 미들웨어 매처 설정
 * - 정적 파일(_next, favicon.ico)과 인증 API를 제외한 모든 경로에 적용
 */
export const config = {
  matcher: ['/((?!_next|favicon.ico|api/auth/login).*)'],
}
