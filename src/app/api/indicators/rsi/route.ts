/**
 * 매수 후보 조회 API (Supabase buy_candidates 테이블에서 조회)
 *
 * GET /api/indicators/rsi?markets=KRW-BTC,KRW-ETH
 * → Python 봇이 분석한 매수 후보 데이터를 Supabase에서 가져옵니다.
 *
 * 기존: Upbit API를 직접 호출하여 RSI 계산 (Rate Limit 문제)
 * 개선: Supabase buy_candidates 테이블에서 Python 봇이 분석한 결과 조회
 *
 * 쿼리 파라미터:
 * - markets: 조회할 마켓 코드 (쉼표 구분, 예: "KRW-BTC,KRW-ETH")
 *            전달되지 않으면 전체 매수 후보 반환
 * - period, unit: 현재는 무시 (Python 봇이 미리 계산한 값 사용)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getBuyCandidates } from '@/lib/supabase'

interface RsiResult {
  market: string
  rsi: number | null
}

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams
    const marketsParam = searchParams.get('markets')

    // markets 파라미터가 있으면 배열로 변환
    const requestedMarkets = marketsParam
      ? marketsParam.split(',').map(m => m.trim())
      : null

    // Supabase에서 매수 후보 데이터 조회
    const candidates = await getBuyCandidates('main')

    // 기존 API 응답 형식에 맞게 변환
    // candidates-content.tsx가 기대하는 { market, rsi }[] 형식 유지
    let results: RsiResult[] = candidates.map((candidate) => ({
      market: candidate.market,
      rsi: candidate.rsi,
    }))

    // markets 파라미터가 전달된 경우, 해당 마켓만 필터링 (하위 호환성)
    if (requestedMarkets) {
      const marketSet = new Set(requestedMarkets)
      results = results.filter((r) => marketSet.has(r.market))
    }

    return NextResponse.json(results)
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('[RSI API] Supabase 조회 실패:', message)

    // 에러 발생 시 HTTP 500으로 에러 응답 반환 (프론트엔드에서 에러 감지 가능)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
