/**
 * 서버사이드 전용 - PIN 인증 기반 세션 관리 유틸리티
 *
 * 인증 흐름:
 * 1. 사용자가 PIN 입력
 * 2. bcrypt로 PIN 검증
 * 3. 검증 성공 시 세션 JWT 생성 → HttpOnly 쿠키에 저장
 * 4. 이후 요청마다 쿠키에서 세션 검증
 *
 * JWT 스펙:
 * - 알고리즘: HS256
 * - payload: { sub: 'dashboard' }
 * - 만료: 7일
 * - secret: SESSION_SECRET 환경변수
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

/** 세션 쿠키 이름 */
const SESSION_COOKIE_NAME = 'session'

/** 세션 만료 기간 (일) */
const SESSION_EXPIRY_DAYS = 7

/** 세션 만료 기간 (초) */
const SESSION_MAX_AGE = SESSION_EXPIRY_DAYS * 24 * 60 * 60

/**
 * 환경변수에서 세션 시크릿을 로드합니다.
 * @throws SESSION_SECRET이 설정되지 않은 경우 에러
 */
function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다.')
  }
  return new TextEncoder().encode(secret)
}

/**
 * 세션 JWT 토큰을 생성합니다. (로그인 성공 시 호출)
 *
 * @returns 서명된 JWT 토큰 문자열
 */
export async function createSession(): Promise<string> {
  const secret = getSessionSecret()

  const token = await new SignJWT({ sub: 'dashboard' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(secret)

  return token
}

/**
 * 세션 JWT 토큰을 검증합니다.
 *
 * @param token - 검증할 JWT 토큰
 * @returns 유효하면 true, 아니면 false
 */
export async function verifySession(token: string): Promise<boolean> {
  try {
    const secret = getSessionSecret()
    await jwtVerify(token, secret)
    return true
  } catch {
    // 만료, 서명 불일치, 형식 오류 등 모든 검증 실패
    return false
  }
}

/**
 * 쿠키에서 세션 토큰을 가져와 검증합니다.
 * Server Component, API Route, 미들웨어에서 사용합니다.
 *
 * @returns 유효한 세션이 있으면 true, 아니면 false
 */
export async function getSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return false
    }

    return await verifySession(sessionCookie.value)
  } catch {
    return false
  }
}

/**
 * 세션 쿠키 설정 옵션을 반환합니다.
 * API Route에서 Set-Cookie 헤더 설정 시 사용합니다.
 *
 * @returns 쿠키 설정 옵션 객체
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
