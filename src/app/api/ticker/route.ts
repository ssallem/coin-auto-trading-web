/**
 * 현재가(Ticker) 조회 API Route (Edge Runtime)
 *
 * GET /api/ticker?markets=KRW-BTC,KRW-ETH
 * → Upbit GET /v1/ticker?markets=...
 *
 * 인증 불필요 (공개 시세 데이터)
 * Edge Runtime에서 직접 fetch 사용 (crypto 모듈 미지원)
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/** Upbit API 기본 URL */
const UPBIT_API_BASE = 'https://api.upbit.com'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const markets = searchParams.get('markets')

    // 필수 파라미터 검증
    if (!markets) {
      return NextResponse.json(
        { error: 'markets 파라미터가 필요합니다 (예: KRW-BTC,KRW-ETH)' },
        { status: 400 }
      )
    }

    // markets 파라미터 형식 및 개수 검증
    const marketList = markets.split(',')
    const MARKET_PATTERN = /^KRW-[A-Z0-9]+$/
    const MAX_MARKETS = 100

    if (marketList.length > MAX_MARKETS) {
      return NextResponse.json(
        { error: `마켓은 최대 ${MAX_MARKETS}개까지 조회할 수 있습니다.` },
        { status: 400 }
      )
    }

    const invalidMarkets = marketList.filter((m) => !MARKET_PATTERN.test(m))
    if (invalidMarkets.length > 0) {
      return NextResponse.json(
        { error: `유효하지 않은 마켓 코드: ${invalidMarkets.join(', ')}` },
        { status: 400 }
      )
    }

    // Upbit API 호출 (인증 불필요)
    const response = await fetch(
      `${UPBIT_API_BASE}/v1/ticker?markets=${encodeURIComponent(markets)}`,
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

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
