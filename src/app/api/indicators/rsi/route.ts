/**
 * RSI 지표 조회 API
 *
 * GET /api/indicators/rsi?markets=KRW-BTC,KRW-ETH&period=14&unit=15
 * → 각 마켓의 현재 RSI 값을 계산하여 반환
 *
 * Upbit 캔들 API에서 데이터를 가져와 서버에서 RSI를 계산합니다.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const UPBIT_API_BASE = 'https://api.upbit.com'
const BATCH_DELAY_MS = 400

interface RsiResult {
  market: string
  rsi: number | null
}

/**
 * Wilder's RSI 계산 (period 기간의 평균 상승/하락폭 기반)
 */
function calculateRSI(closePrices: number[], period: number): number | null {
  if (closePrices.length < period + 1) return null

  let avgGain = 0
  let avgLoss = 0

  // 초기 평균 (첫 period 기간)
  for (let i = 1; i <= period; i++) {
    const change = closePrices[i] - closePrices[i - 1]
    if (change > 0) avgGain += change
    else avgLoss += Math.abs(change)
  }
  avgGain /= period
  avgLoss /= period

  // Wilder's smoothing (나머지 데이터)
  for (let i = period + 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketsStr = searchParams.get('markets')
    const periodStr = searchParams.get('period') ?? '14'
    const unitStr = searchParams.get('unit') ?? '15'

    if (!marketsStr) {
      return NextResponse.json(
        { error: 'markets 파라미터가 필요합니다 (예: KRW-BTC,KRW-ETH)' },
        { status: 400 },
      )
    }

    const markets = marketsStr.split(',').map((m) => m.trim()).filter(Boolean)
    const period = parseInt(periodStr, 10)
    const unit = parseInt(unitStr, 10)

    if (isNaN(period) || period < 2 || period > 50) {
      return NextResponse.json({ error: 'period는 2~50 사이 정수여야 합니다' }, { status: 400 })
    }

    // 각 마켓별로 캔들 데이터를 배치 처리하여 RSI 계산 (타임아웃 방지)
    const count = period + 10 // 충분한 데이터
    const results: RsiResult[] = []
    const BATCH_SIZE = 3

    for (let i = 0; i < markets.length; i += BATCH_SIZE) {
      const batch = markets.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (market) => {
          try {
            const params = new URLSearchParams({ market, count: String(count) })
            const res = await fetch(
              `${UPBIT_API_BASE}/v1/candles/minutes/${unit}?${params.toString()}`,
              { headers: { 'Content-Type': 'application/json' } },
            )

            if (!res.ok) {
              console.error(`[RSI API] Upbit API 실패: ${market}, status: ${res.status}`)
              return { market, rsi: null }
            }

            const candles = await res.json() as { trade_price: number }[]

            if (!Array.isArray(candles) || candles.length === 0) {
              console.error(`[RSI API] ${market} 캔들 데이터 없음`)
              return { market, rsi: null }
            }

            // Upbit 캔들은 최신순이므로 역순으로 정렬 (오래된 것 먼저)
            const closePrices = candles.map((c) => c.trade_price).reverse()
            const rsi = calculateRSI(closePrices, period)

            return { market, rsi: rsi !== null ? Math.round(rsi * 10) / 10 : null }
          } catch (error) {
            console.error(`[RSI API] ${market} 처리 실패:`, error instanceof Error ? error.message : error)
            return { market, rsi: null }
          }
        }),
      )
      results.push(...batchResults)

      // 배치 사이 딜레이 (Upbit rate limit 준수)
      if (i + BATCH_SIZE < markets.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
