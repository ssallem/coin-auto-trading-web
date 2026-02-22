/**
 * 로그인 API - POST /api/auth/login
 *
 * Body: { pin: string }
 * - bcryptjs로 PIN 검증 (DASHBOARD_PIN_HASH 환경변수와 비교)
 * - 성공 시: 세션 JWT 생성 → Set-Cookie → { ok: true }
 * - 실패 시: 401 { error: 'Invalid PIN' }
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession, getSessionCookieOptions } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // 환경변수 검증
    const pinHash = process.env.DASHBOARD_PIN_HASH
    if (!pinHash) {
      console.error('DASHBOARD_PIN_HASH 환경변수가 설정되지 않았습니다.')
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 요청 바디 파싱
    const body = (await request.json()) as { pin?: string }
    const { pin } = body

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'PIN을 입력해주세요.' },
        { status: 400 }
      )
    }

    // PIN 검증
    const isValid = await bcrypt.compare(pin, pinHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // 세션 JWT 생성
    const token = await createSession()

    // 쿠키 설정 옵션
    const cookieOptions = getSessionCookieOptions()

    // 응답 생성 및 Set-Cookie 설정
    const response = NextResponse.json({ ok: true })
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
