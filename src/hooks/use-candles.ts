/**
 * 캔들(봉) 데이터 조회 훅
 *
 * TanStack Query v5로 Upbit 캔들 데이터를 조회합니다.
 * GET /api/candles?market=KRW-BTC&unit=15&count=200 → UpbitCandle[]
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { UpbitCandle, CandleInterval } from '@/types/upbit'

/** 캔들 데이터를 조회합니다. */
async function fetchCandles(
  market: string,
  interval: CandleInterval,
  count: number
): Promise<UpbitCandle[]> {
  const { data } = await axios.get<UpbitCandle[]>('/api/candles', {
    params: { market, unit: interval, count },
  })
  return data
}

/**
 * 캔들 데이터 조회 훅
 *
 * @param market - 마켓 코드 (예: "KRW-BTC")
 * @param interval - 분봉 간격 (예: "15")
 * @param count - 조회할 봉 수 (기본: 200)
 * @returns data - 캔들 목록 (UpbitCandle[])
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 */
export function useCandles(
  market: string,
  interval: CandleInterval,
  count: number = 200
) {
  return useQuery({
    queryKey: queryKeys.candles(market, interval, count),
    queryFn: () => fetchCandles(market, interval, count),
    staleTime: QUERY_CONFIG.candles.staleTime,
    refetchInterval: QUERY_CONFIG.candles.refetchInterval,
    /** 마켓 코드가 있을 때만 조회 */
    enabled: !!market,
  })
}
