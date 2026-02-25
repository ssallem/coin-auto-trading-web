/**
 * 일일 매매 손익 조회 API Route (Node.js Runtime)
 *
 * GET /api/analytics/daily-pnl?date=2026-02-24
 * → Supabase order_history에서 해당 날짜의 거래 데이터를 조회하고 손익 통계를 반환합니다.
 *
 * 인증 불필요 (읽기 전용 통계 API)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getDailyPnlStats } from '@/lib/supabase'

/**
 * 일일 손익 통계 조회
 *
 * Query Parameters:
 * - date: 조회할 날짜 (YYYY-MM-DD 형식, 선택, 기본값: 오늘)
 *
 * Response:
 * - date: 조회 날짜
 * - totalPnl: 일일 실현 손익 합계 (KRW)
 * - sellVolume: 매도 총액 (KRW)
 * - buyVolume: 매수 총액 (KRW)
 * - sellCount: 매도 건수
 * - buyCount: 매수 건수
 * - winCount: 수익 거래 수 (pnl > 0)
 * - loseCount: 손실 거래 수 (pnl < 0)
 * - winRate: 승률 (%)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // date 파라미터 처리 (없으면 오늘 날짜 사용)
    const dateParam = searchParams.get('date')
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const date = dateParam ?? today

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요.' },
        { status: 400 }
      )
    }

    // Supabase에서 일일 손익 통계 조회
    const stats = await getDailyPnlStats(date)

    return NextResponse.json(stats)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
