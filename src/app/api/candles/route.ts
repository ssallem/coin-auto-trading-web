/**
 * 캔들(봉) 조회 API Route (Edge Runtime)
 *
 * GET /api/candles?market=KRW-BTC&unit=15&count=200
 * → Upbit GET /v1/candles/minutes/{unit}?market=...&count=...
 *
 * unit 유효값: 1, 3, 5, 10, 15, 30, 60, 240
 * count 최대: 200
 * 인증 불필요 (공개 시세 데이터)
 * Edge Runtime에서 직접 fetch 사용
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/** Upbit API 기본 URL */
const UPBIT_API_BASE = 'https://api.upbit.com'

/** 허용되는 분봉 단위 */
const VALID_UNITS = [1, 3, 5, 10, 15, 30, 60, 240] as const

/** 최대 캔들 조회 개수 */
const MAX_COUNT = 200

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market')
    const unitStr = searchParams.get('unit')
    const countStr = searchParams.get('count')

    // 필수 파라미터 검증
    if (!market) {
      return NextResponse.json(
        { error: 'market 파라미터가 필요합니다 (예: KRW-BTC)' },
        { status: 400 }
      )
    }

    if (!unitStr) {
      return NextResponse.json(
        { error: 'unit 파라미터가 필요합니다 (1, 3, 5, 10, 15, 30, 60, 240)' },
        { status: 400 }
      )
    }

    // unit 유효성 검증
    const unit = parseInt(unitStr, 10)
    if (!VALID_UNITS.includes(unit as (typeof VALID_UNITS)[number])) {
      return NextResponse.json(
        {
          error: `유효하지 않은 unit 값입니다. 허용값: ${VALID_UNITS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // count 유효성 검증 (기본값 200)
    let count = MAX_COUNT
    if (countStr) {
      count = parseInt(countStr, 10)
      if (isNaN(count) || count < 1) {
        return NextResponse.json(
          { error: 'count는 1 이상의 정수여야 합니다' },
          { status: 400 }
        )
      }
      if (count > MAX_COUNT) {
        count = MAX_COUNT
      }
    }

    // Upbit API 호출 (인증 불필요)
    const params = new URLSearchParams({
      market,
      count: String(count),
    })

    const response = await fetch(
      `${UPBIT_API_BASE}/v1/candles/minutes/${unit}?${params.toString()}`,
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
