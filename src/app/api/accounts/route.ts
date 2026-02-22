/**
 * 계좌 잔고 조회 API Route (Node.js Runtime)
 *
 * GET /api/accounts
 * → Supabase account_snapshots 최신 스냅샷 조회
 *
 * 세션 인증 필수 (JWT 쿠키 검증)
 * Python 봇이 Upbit에서 동기화한 데이터를 Supabase에서 읽습니다.
 *
 * 응답 형식: UpbitBalance[] (기존 프론트엔드 훅 호환)
 * 응답 헤더: X-Snapshot-At (데이터 신선도 확인용)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { getLatestAccountSnapshot } from '@/lib/supabase'
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

    // Supabase에서 최신 계좌 스냅샷 조회
    const snapshot = await getLatestAccountSnapshot()

    // 봇이 아직 동기화하지 않은 경우 빈 배열 반환
    if (!snapshot) {
      return NextResponse.json([] as UpbitBalance[])
    }

    // 스냅샷 → UpbitBalance[] 변환
    const balances: UpbitBalance[] = []

    // KRW 잔고
    balances.push({
      currency: 'KRW',
      balance: String(snapshot.krw_balance),
      locked: String(snapshot.krw_locked),
      avg_buy_price: '0',
      avg_buy_price_modified: false,
      unit_currency: 'KRW',
    })

    // 보유 코인 목록
    for (const holding of snapshot.holdings) {
      balances.push({
        currency: holding.currency,
        balance: holding.balance,
        locked: holding.locked,
        avg_buy_price: holding.avg_buy_price,
        avg_buy_price_modified: holding.avg_buy_price_modified ?? false,
        unit_currency: holding.unit_currency,
      })
    }

    // 데이터 신선도 헤더 추가
    const response = NextResponse.json(balances)
    response.headers.set('X-Snapshot-At', snapshot.snapshot_at)
    return response
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
