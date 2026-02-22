/**
 * 주문 관리 훅
 *
 * TanStack Query v5로 주문 조회/생성/취소를 처리합니다.
 * - useOrders: GET /api/orders (주문 목록 조회)
 * - useCreateOrder: POST /api/orders (주문 생성 mutation)
 * - useCancelOrder: DELETE /api/orders/[uuid] (주문 취소 mutation)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { UpbitOrder, UpbitOrderRequest } from '@/types/upbit'

// ─────────────────────────────────────────────
// 주문 목록 조회
// ─────────────────────────────────────────────

/** 주문 목록 조회 파라미터 */
interface OrdersParams {
  /** 주문 상태 필터 */
  state?: string
  /** 마켓 코드 필터 */
  market?: string
}

/** 주문 목록을 조회합니다. */
async function fetchOrders(params?: OrdersParams): Promise<UpbitOrder[]> {
  const { data } = await axios.get<UpbitOrder[]>('/api/orders', { params })
  return data
}

/**
 * 주문 목록 조회 훅
 *
 * @param params - 선택적 필터 파라미터 (state, market)
 * @returns data - 주문 목록 (UpbitOrder[])
 * @returns isLoading - 로딩 상태
 * @returns error - 에러 객체
 */
export function useOrders(params?: OrdersParams) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => fetchOrders(params),
    staleTime: QUERY_CONFIG.orders.staleTime,
    refetchInterval: QUERY_CONFIG.orders.refetchInterval,
  })
}

// ─────────────────────────────────────────────
// 주문 생성 Mutation
// ─────────────────────────────────────────────

/** 주문을 생성합니다. */
async function createOrder(order: UpbitOrderRequest): Promise<UpbitOrder> {
  const { data } = await axios.post<UpbitOrder>('/api/orders', order)
  return data
}

/**
 * 주문 생성 mutation 훅
 *
 * 성공 시 주문 목록 및 계좌 잔고 캐시를 무효화합니다.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      /* 주문 목록 캐시 무효화 */
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      /* 계좌 잔고 캐시 무효화 (주문으로 잔고 변동) */
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('주문이 생성되었습니다')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : '주문 생성에 실패했습니다'
      toast.error(message)
    },
  })
}

// ─────────────────────────────────────────────
// 주문 취소 Mutation
// ─────────────────────────────────────────────

/** 주문을 취소합니다. */
async function cancelOrder(uuid: string): Promise<UpbitOrder> {
  const { data } = await axios.delete<UpbitOrder>(`/api/orders/${uuid}`)
  return data
}

/**
 * 주문 취소 mutation 훅
 *
 * 성공 시 주문 목록 캐시를 무효화합니다.
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      /* 주문 목록 캐시 무효화 */
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('주문이 취소되었습니다')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : '주문 취소에 실패했습니다'
      toast.error(message)
    },
  })
}
