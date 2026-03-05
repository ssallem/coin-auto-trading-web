/**
 * 매수 후보 조회 훅 (Supabase buy_candidates 테이블)
 *
 * Python 봇이 분석한 매수 후보 데이터를 조회합니다.
 * RSI뿐만 아니라 signal, confidence, reason 등 추가 정보를 제공합니다.
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { BuyCandidateRow } from '@/types/supabase'

export function useBuyCandidates() {
  return useQuery({
    queryKey: queryKeys.buyCandidates(),
    queryFn: async () => {
      const { data } = await axios.get<BuyCandidateRow[]>('/api/buy-candidates')
      return data
    },
    staleTime: QUERY_CONFIG.buyCandidates.staleTime,
    refetchInterval: QUERY_CONFIG.buyCandidates.refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}
