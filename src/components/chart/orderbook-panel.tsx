'use client'

/**
 * 호가창 패널
 *
 * 매도 호가(상단, 빨간색) + 매수 호가(하단, 파란색)를 표시합니다.
 * 각 호가의 수량을 바 차트 형태(수량에 비례하는 width)로 시각화합니다.
 * 중앙에 현재 체결가를 강조 표시합니다.
 *
 * GET /api/orderbook?markets=KRW-BTC → 1초 간격 자동 갱신
 */

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import { useTicker } from '@/hooks/use-ticker'
import { PriceDisplay } from '@/components/common/price-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { UpbitOrderbook } from '@/types/upbit'
import { cn } from '@/lib/utils'

interface OrderbookPanelProps {
  /** 조회할 마켓 코드 (예: "KRW-BTC") */
  market: string
}

export function OrderbookPanel({ market }: OrderbookPanelProps) {
  /** 호가 데이터 조회 (1초 간격 자동 갱신) */
  const { data: orderbookData, isLoading } = useQuery({
    queryKey: queryKeys.orderbook(market),
    queryFn: async () => {
      const { data } = await axios.get<UpbitOrderbook[]>('/api/orderbook', {
        params: { markets: market },
      })
      return data[0] ?? null
    },
    staleTime: QUERY_CONFIG.orderbook.staleTime,
    refetchInterval: QUERY_CONFIG.orderbook.refetchInterval,
    enabled: !!market,
  })

  /** 현재가 조회 */
  const { data: tickerData } = useTicker([market])
  const ticker = tickerData?.[0]

  /** 호가 10단계 추출 */
  const units = orderbookData?.orderbook_units?.slice(0, 10) ?? []

  /** 매도/매수 최대 수량 (바 너비 비례 계산용) */
  const maxSize = units.reduce(
    (max, unit) => Math.max(max, unit.ask_size, unit.bid_size),
    0
  )

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">호가</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {Array.from({ length: 21 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-none">
        <CardTitle className="text-sm">호가</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-0 p-2 pt-0 overflow-y-auto">
        {/* ── 매도 호가 (역순: 가장 높은 가격이 위) ── */}
        <div className="flex flex-col gap-0.5">
          {[...units].reverse().map((unit, idx) => {
            const barWidth = maxSize > 0 ? (unit.ask_size / maxSize) * 100 : 0
            return (
              <div
                key={`ask-${idx}`}
                className="relative flex items-center justify-between px-2 py-0.5 text-xs"
              >
                {/* 배경 바 (우측 정렬) */}
                <div
                  className="absolute right-0 top-0 h-full bg-red-500/10"
                  style={{ width: `${barWidth}%` }}
                />
                {/* 가격 */}
                <PriceDisplay
                  price={unit.ask_price}
                  change="RISE"
                  className="relative z-10 text-xs"
                />
                {/* 수량 */}
                <span className="relative z-10 tabular-nums text-muted-foreground">
                  {formatVolume(unit.ask_size)}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── 중앙: 현재 체결가 ── */}
        <div className="flex items-center justify-center py-2 my-1 border-y bg-muted/50">
          {ticker ? (
            <div className="flex items-center gap-2">
              <PriceDisplay
                price={ticker.trade_price}
                change={ticker.change}
                className="text-sm font-bold"
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  ticker.change === 'RISE' && 'text-red-500',
                  ticker.change === 'FALL' && 'text-blue-500'
                )}
              >
                {ticker.signed_change_rate >= 0 ? '+' : ''}
                {(ticker.signed_change_rate * 100).toFixed(2)}%
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        {/* ── 매수 호가 (위에서 아래로: 가장 높은 가격이 위) ── */}
        <div className="flex flex-col gap-0.5">
          {units.map((unit, idx) => {
            const barWidth = maxSize > 0 ? (unit.bid_size / maxSize) * 100 : 0
            return (
              <div
                key={`bid-${idx}`}
                className="relative flex items-center justify-between px-2 py-0.5 text-xs"
              >
                {/* 배경 바 (우측 정렬) */}
                <div
                  className="absolute right-0 top-0 h-full bg-blue-500/10"
                  style={{ width: `${barWidth}%` }}
                />
                {/* 가격 */}
                <PriceDisplay
                  price={unit.bid_price}
                  change="FALL"
                  className="relative z-10 text-xs"
                />
                {/* 수량 */}
                <span className="relative z-10 tabular-nums text-muted-foreground">
                  {formatVolume(unit.bid_size)}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 거래량을 보기 좋게 포맷합니다.
 * - 1 이상: 소수점 4자리
 * - 1 미만: 소수점 6자리
 */
function formatVolume(volume: number): string {
  if (volume >= 1) {
    return volume.toFixed(4)
  }
  return volume.toFixed(6)
}
