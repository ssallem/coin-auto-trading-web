/**
 * 마켓 코드 목록 조회 API Route (Edge Runtime)
 *
 * GET /api/markets
 * → Upbit GET /v1/market/all?is_details=false
 *
 * 응답에서 KRW 마켓만 필터링하여 반환
 * 인증 불필요 (공개 데이터)
 * Edge Runtime에서 직접 fetch 사용
 */
import { NextResponse } from 'next/server'
import type { UpbitMarket } from '@/types/upbit'

export const runtime = 'edge'

/** Upbit API 기본 URL */
const UPBIT_API_BASE = 'https://api.upbit.com'

export async function GET() {
  try {
    // Upbit API 호출 (인증 불필요)
    const response = await fetch(
      `${UPBIT_API_BASE}/v1/market/all?is_details=false`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      return NextResponse.json(
        { error: `Upbit API 요청 실패: ${response.status} - ${errorBody}` },
        { status: response.status }
      )
    }

    const allMarkets: UpbitMarket[] = await response.json()

    // KRW 마켓만 필터링
    const krwMarkets = allMarkets.filter((market) =>
      market.market.startsWith('KRW-')
    )

    return NextResponse.json(krwMarkets)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
