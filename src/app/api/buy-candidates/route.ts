/**
 * 매수 후보 조회 API
 *
 * GET /api/buy-candidates
 * → Supabase buy_candidates 테이블에서 Python 봇이 분석한 매수 후보 데이터를 조회합니다.
 *
 * 응답 형식: BuyCandidateRow[]
 * - id, bot_id, market, signal, confidence, reason, current_price, rsi, indicators, analyzed_at, created_at
 */
import { NextResponse } from 'next/server'
import { getBuyCandidates } from '@/lib/supabase'

export async function GET() {
  try {
    const candidates = await getBuyCandidates('main')
    return NextResponse.json(candidates)
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[Buy Candidates API] Supabase 조회 실패:', message)

    // 에러 발생 시 HTTP 500으로 에러 응답 반환 (프론트엔드에서 에러 감지 가능)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
