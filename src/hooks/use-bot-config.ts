/**
 * 봇 전체 설정 TanStack Query 훅
 *
 * - useBotConfig(): GET /api/settings/config (전체 설정 조회)
 * - useUpdateBotConfig(): PUT /api/settings/config (부분 업데이트 mutation)
 *
 * 성공 시 botConfig + strategyConfig 캐시를 무효화합니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { BotConfig } from '@/types/trading'

// ─────────────────────────────────────────────
// API 호출 함수
// ─────────────────────────────────────────────

/** 봇 전체 설정 조회 */
async function fetchBotConfig(): Promise<BotConfig> {
  const { data } = await axios.get<BotConfig>('/api/settings/config')
  return data
}

/** 봇 설정 부분 업데이트 */
async function updateBotConfig(
  patch: Partial<BotConfig>
): Promise<{ message: string; config: BotConfig }> {
  const { data } = await axios.put<{ message: string; config: BotConfig }>(
    '/api/settings/config',
    patch
  )
  return data
}

// ─────────────────────────────────────────────
// 조회 훅
// ─────────────────────────────────────────────

/**
 * 봇 전체 설정 조회 훅
 *
 * @returns data - 봇 전체 설정 (BotConfig)
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 * @returns refetch - 수동 갱신 함수
 */
export function useBotConfig() {
  return useQuery({
    queryKey: queryKeys.botConfig.all,
    queryFn: fetchBotConfig,
    staleTime: QUERY_CONFIG.botConfig.staleTime,
  })
}

// ─────────────────────────────────────────────
// 업데이트 Mutation 훅
// ─────────────────────────────────────────────

/**
 * 봇 설정 부분 업데이트 mutation 훅
 *
 * 성공 시 botConfig + strategyConfig 캐시를 무효화하고 toast를 표시합니다.
 */
export function useUpdateBotConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateBotConfig,
    onSuccess: () => {
      /* botConfig 캐시 무효화 */
      queryClient.invalidateQueries({ queryKey: queryKeys.botConfig.all })
      /* strategyConfig 캐시도 무효화 (strategy/risk 섹션 동기화) */
      queryClient.invalidateQueries({ queryKey: queryKeys.strategyConfig() })
      toast.success('설정이 저장되었습니다')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : '설정 저장에 실패했습니다'
      toast.error(message)
    },
  })
}
