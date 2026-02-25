/**
 * 현재가(Ticker) 조회 훅
 *
 * TanStack Query v5로 Upbit 현재가를 조회합니다.
 * GET /api/ticker?markets=KRW-BTC,KRW-ETH → UpbitTicker[]
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { UpbitTicker } from '@/types/upbit'

/** 현재가 데이터를 조회합니다. */
async function fetchTicker(markets: string[]): Promise<UpbitTicker[]> {
  const { data } = await axios.get<UpbitTicker[]>('/api/ticker', {
    params: { markets: markets.join(',') },
  })
  return data
}

/**
 * 현재가 조회 훅
 *
 * @param markets - 조회할 마켓 코드 배열 (예: ["KRW-BTC", "KRW-ETH"])
 * @returns data - 현재가 목록 (UpbitTicker[])
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 */
export function useTicker(markets: string[]) {
  return useQuery({
    queryKey: queryKeys.ticker(markets),
    queryFn: () => fetchTicker(markets),
    staleTime: QUERY_CONFIG.ticker.staleTime,
    refetchInterval: QUERY_CONFIG.ticker.refetchInterval,
    /** 마켓 코드가 있을 때만 조회 */
    enabled: markets.length > 0,
    retry: 1,
    retryDelay: () => 2000 + Math.random() * 1000,
  })
}
