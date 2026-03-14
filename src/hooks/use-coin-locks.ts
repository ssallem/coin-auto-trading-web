/**
 * 코인 잠금 관리 훅
 *
 * TanStack Query v5로 코인 잠금 조회/토글을 처리합니다.
 * - useCoinLocks: GET /api/coin-locks (잠금 목록 조회)
 * - useToggleCoinLock: POST /api/coin-locks (잠금 상태 토글 mutation)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { CoinLockRow } from '@/types/supabase'

// ─────────────────────────────────────────────
// 잠금 목록 조회
// ─────────────────────────────────────────────

/**
 * 코인 잠금 목록 조회 훅
 *
 * @returns data - 잠금 목록 (CoinLockRow[])
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 */
export function useCoinLocks() {
  return useQuery({
    queryKey: queryKeys.coinLocks(),
    queryFn: async () => {
      const { data } = await axios.get<CoinLockRow[]>('/api/coin-locks')
      return data
    },
    staleTime: QUERY_CONFIG.coinLocks.staleTime,
    refetchInterval: QUERY_CONFIG.coinLocks.refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })
}

// ─────────────────────────────────────────────
// 잠금 토글 Mutation
// ─────────────────────────────────────────────

/** 잠금 토글 요청 파라미터 */
interface ToggleCoinLockParams {
  market: string
  is_locked: boolean
}

/**
 * 코인 잠금 토글 mutation 훅
 *
 * 성공 시 잠금 목록 캐시를 무효화합니다.
 */
export function useToggleCoinLock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ToggleCoinLockParams) => {
      const { data } = await axios.post<CoinLockRow>('/api/coin-locks', params)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coinLocks() })
      toast.success(
        data.is_locked
          ? `${data.market} 잠금되었습니다`
          : `${data.market} 잠금 해제되었습니다`
      )
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : '잠금 상태 변경에 실패했습니다'
      toast.error(message)
    },
  })
}
