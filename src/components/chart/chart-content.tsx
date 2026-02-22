'use client'

/**
 * 차트 메인 콘텐츠 (Client Component)
 *
 * 상단: ChartToolbar (마켓/인터벌 선택, 현재가 표시)
 * 중앙: CandleChart (캔들스틱 차트, dynamic import)
 * 우측/하단: OrderbookPanel (호가창)
 *
 * 반응형 레이아웃:
 * - 데스크탑(lg+): 차트 + 호가 나란히
 * - 모바일: 탭으로 전환 (차트 / 호가)
 */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useUIStore } from '@/stores/ui-store'
import { useCandles } from '@/hooks/use-candles'
import { useUpbitWebSocket } from '@/hooks/use-upbit-websocket'
import { ChartToolbar } from '@/components/chart/chart-toolbar'
import { OrderbookPanel } from '@/components/chart/orderbook-panel'
import { ChartSkeleton } from '@/components/common/loading-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

/** CandleChart는 lightweight-charts 사용으로 SSR 불가 → dynamic import */
const CandleChart = dynamic(() => import('./candle-chart'), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-full border-0" />,
})

interface ChartContentProps {
  /** URL 파라미터에서 전달받은 마켓 코드 */
  market: string
}

export function ChartContent({ market }: ChartContentProps) {
  const { selectedMarket, selectedInterval, setSelectedMarket } = useUIStore()

  /** URL 파라미터의 마켓 코드를 스토어에 동기화 */
  useEffect(() => {
    if (market && market !== selectedMarket) {
      setSelectedMarket(market)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market])

  /** 캔들 데이터 조회 */
  const { data: candles, isLoading: candlesLoading } = useCandles(
    selectedMarket,
    selectedInterval,
    200
  )

  /** 실시간 가격 WebSocket 연동 */
  const { status: wsStatus } = useUpbitWebSocket({
    markets: [selectedMarket],
    types: ['ticker'],
  })

  /** 모바일 탭 상태 */
  const [mobileTab, setMobileTab] = useState<string>('chart')

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── 상단: 도구바 ── */}
      <div className="flex items-center gap-2">
        <ChartToolbar />
        {/* WebSocket 연결 상태 뱃지 */}
        <Badge
          variant={wsStatus === 'open' ? 'default' : 'secondary'}
          className="text-[10px] px-1.5 py-0 h-5 hidden sm:inline-flex"
        >
          {wsStatus === 'open' ? 'LIVE' : 'OFF'}
        </Badge>
      </div>

      {/* ── 데스크탑: 차트 + 호가 나란히 (lg 이상) ── */}
      <div className="hidden lg:flex gap-4 flex-1 min-h-0">
        {/* 캔들 차트 (좌측, 넓은 영역) */}
        <Card className="flex-1 min-w-0">
          <CardContent className="p-0 h-full">
            {candlesLoading || !candles ? (
              <ChartSkeleton className="h-full border-0" />
            ) : (
              <CandleChart data={candles} />
            )}
          </CardContent>
        </Card>

        {/* 호가창 (우측, 고정 너비) */}
        <div className="w-[280px] flex-none">
          <OrderbookPanel market={selectedMarket} />
        </div>
      </div>

      {/* ── 모바일: 탭으로 전환 (lg 미만) ── */}
      <div className="lg:hidden flex-1 min-h-0">
        <Tabs value={mobileTab} onValueChange={setMobileTab} className="h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="chart" className="flex-1">
              차트
            </TabsTrigger>
            <TabsTrigger value="orderbook" className="flex-1">
              호가
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="flex-1 mt-2">
            <Card className="h-full min-h-[400px]">
              <CardContent className="p-0 h-full">
                {candlesLoading || !candles ? (
                  <ChartSkeleton className="h-full border-0" />
                ) : (
                  <CandleChart data={candles} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orderbook" className="flex-1 mt-2">
            <OrderbookPanel market={selectedMarket} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
