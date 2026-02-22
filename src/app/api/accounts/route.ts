/**
 * 계좌 잔고 조회 API Route (Node.js Runtime)
 *
 * GET /api/accounts
 * → Upbit GET /v1/accounts
 *
 * 세션 인증 필수 (JWT 쿠키 검증)
 * fetchUpbitAPI 사용 (requireAuth: true)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { fetchUpbitAPI } from '@/lib/upbit-jwt'
import type { UpbitBalance } from '@/types/upbit'

export async function GET() {
  try {
    // 세션 쿠키 검증
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const isValid = await verifySession(sessionCookie.value)
    if (!isValid) {
      return NextResponse.json(
        { error: '세션이 만료되었거나 유효하지 않습니다' },
        { status: 401 }
      )
    }

    // Upbit 계좌 조회 API 호출 (인증 필요)
    const accounts = await fetchUpbitAPI<UpbitBalance[]>('/v1/accounts', {
      requireAuth: true,
    })

    return NextResponse.json(accounts)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
