/**
 * RSI 지표 조회 훅
 *
 * GET /api/indicators/rsi?markets=KRW-BTC,KRW-ETH&period=14&unit=15
 * → { market: string, rsi: number | null }[]
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'

export interface RsiData {
  market: string
  rsi: number | null
}

export function useRsi(markets: string[], period = 14, unit = 15) {
  return useQuery({
    queryKey: queryKeys.rsi(markets),
    queryFn: async () => {
      const { data } = await axios.get<RsiData[]>('/api/indicators/rsi', {
        params: { markets: markets.join(','), period, unit },
      })
      return data
    },
    staleTime: QUERY_CONFIG.rsi.staleTime,
    refetchInterval: QUERY_CONFIG.rsi.refetchInterval,
    enabled: markets.length > 0,
  })
}
