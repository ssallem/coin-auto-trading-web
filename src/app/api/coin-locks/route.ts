/**
 * 코인 잠금 API
 *
 * GET  /api/coin-locks
 * → Supabase coin_locks 테이블에서 전체 잠금 목록을 조회합니다.
 *
 * POST /api/coin-locks
 * → body: { market: string, is_locked: boolean }
 * → 코인 잠금 상태를 upsert합니다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getCoinLocks, upsertCoinLock } from '@/lib/supabase'

export async function GET() {
  try {
    const locks = await getCoinLocks()
    return NextResponse.json(locks)
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[Coin Locks API] 조회 실패:', message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { market, is_locked } = body as { market: string; is_locked: boolean }

    if (!market || typeof is_locked !== 'boolean') {
      return NextResponse.json(
        { error: 'market(string)과 is_locked(boolean)이 필요합니다' },
        { status: 400 }
      )
    }

    const result = await upsertCoinLock(market, is_locked)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[Coin Locks API] upsert 실패:', message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
