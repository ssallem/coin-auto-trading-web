/**
 * 로그아웃 API - POST /api/auth/logout
 *
 * 세션 쿠키를 삭제(maxAge: 0)하고 { ok: true }를 반환합니다.
 */
import { NextResponse } from 'next/server'

/** 세션 쿠키 이름 (session.ts와 동일) */
const SESSION_COOKIE_NAME = 'session'

export async function POST() {
  const response = NextResponse.json({ ok: true })

  // 세션 쿠키 삭제 (maxAge: 0으로 설정하여 즉시 만료)
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })

  return response
}
