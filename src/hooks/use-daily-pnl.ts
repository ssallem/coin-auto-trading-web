/**
 * 일일 매매 손익 조회 훅
 *
 * TanStack Query v5로 일일 손익 통계를 조회합니다.
 * - useDailyPnl: GET /api/analytics/daily-pnl (일일 손익 통계 조회)
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { DailyPnlStats } from '@/types/trading'

// ─────────────────────────────────────────────
// 일일 손익 통계 조회
// ─────────────────────────────────────────────

/**
 * 일일 손익 통계를 조회합니다.
 *
 * @param date - 조회할 날짜 (YYYY-MM-DD 형식, 선택)
 * @returns DailyPnlStats 객체
 */
async function fetchDailyPnl(date?: string): Promise<DailyPnlStats> {
  const params = date ? { date } : {}
  const { data } = await axios.get<DailyPnlStats>('/api/analytics/daily-pnl', {
    params,
  })
  return data
}

/**
 * 일일 손익 통계 조회 훅
 *
 * @param date - 조회할 날짜 (YYYY-MM-DD 형식, 선택, 기본값: 오늘)
 * @returns data - 일일 손익 통계 (DailyPnlStats)
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 */
/**
 * KST(한국시간) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
function getKSTDate(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().split('T')[0]
}

export function useDailyPnl(date?: string) {
  // date가 없으면 KST 기준 오늘 날짜 사용
  const queryDate = date ?? getKSTDate()

  return useQuery({
    queryKey: queryKeys.dailyPnl(queryDate),
    queryFn: () => fetchDailyPnl(queryDate),
    staleTime: QUERY_CONFIG.dailyPnl.staleTime,
  })
}
