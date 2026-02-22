/**
 * 계좌 잔고 조회 훅
 *
 * TanStack Query v5로 Upbit 계좌 잔고를 조회합니다.
 * GET /api/accounts → UpbitBalance[]
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { UpbitBalance } from '@/types/upbit'

/** 계좌 잔고 목록을 조회합니다. */
async function fetchAccounts(): Promise<UpbitBalance[]> {
  const { data } = await axios.get<UpbitBalance[]>('/api/accounts')
  return data
}

/**
 * 계좌 잔고 조회 훅
 *
 * @returns data - 잔고 목록 (UpbitBalance[])
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 * @returns refetch - 수동 갱신 함수
 */
export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: fetchAccounts,
    staleTime: QUERY_CONFIG.accounts.staleTime,
    refetchInterval: QUERY_CONFIG.accounts.refetchInterval,
  })
}
