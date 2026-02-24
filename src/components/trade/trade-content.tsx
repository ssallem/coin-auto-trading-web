'use client'

/**
 * 거래 메인 컴포넌트
 *
 * 좌측: OrderForm (주문 폼), 우측: OpenOrderList (미체결 주문)
 * 상단: 마켓 선택 + 현재가 표시
 * 반응형: 데스크탑 나란히, 모바일 탭 전환
 */

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import { useUIStore } from '@/stores/ui-store'
import { useTicker } from '@/hooks/use-ticker'
import { PriceDisplay } from '@/components/common/price-display'
import { OrderForm } from '@/components/trade/order-form'
import { OpenOrderList } from '@/components/trade/open-order-list'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { UpbitMarket } from '@/types/upbit'

/** 유명 코인 30개 (KRW 마켓 심볼) */
const TOP_30_SYMBOLS = new Set([
  'BTC', 'ETH', 'XRP', 'SOL', 'DOGE',
  'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC',
  'TRX', 'ATOM', 'ETC', 'XLM', 'ALGO',
  'NEAR', 'ICP', 'APT', 'ARB', 'OP',
  'SAND', 'MANA', 'AXS', 'HBAR', 'EOS',
  'BTT', 'SUI', 'SEI', 'STX', 'USDC',
])

/** 가격을 한국 원화 관례에 맞게 포맷합니다. */
function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(value))
}

export function TradeContent() {
  const { selectedMarket, setSelectedMarket } = useUIStore()
  const [mobileTab, setMobileTab] = useState<string>('order')

  /* 마켓 목록 조회 */
  const { data: markets, isLoading: isMarketsLoading } = useQuery({
    queryKey: queryKeys.markets(),
    queryFn: async () => {
      const { data } = await axios.get<UpbitMarket[]>('/api/markets')
      return data
    },
    staleTime: QUERY_CONFIG.markets.staleTime,
  })

  /* KRW 마켓 중 유명 30개만 필터링 + 이름순 정렬 */
  const krwMarkets = (markets
    ?.filter((m) => m.market.startsWith('KRW-') && TOP_30_SYMBOLS.has(m.market.replace('KRW-', '')))
    .sort((a, b) => a.korean_name.localeCompare(b.korean_name, 'ko')) ?? [])

  /* selectedMarket 동기화: krwMarkets 로드 후 목록에 없으면 첫 번째 마켓으로 설정 */
  useEffect(() => {
    if (krwMarkets.length > 0 && !krwMarkets.find((m) => m.market === selectedMarket)) {
      setSelectedMarket(krwMarkets[0].market)
    }
  }, [krwMarkets, selectedMarket, setSelectedMarket])

  /* 현재가 조회 */
  const { data: tickers } = useTicker([selectedMarket])
  const ticker = tickers?.[0]

  /* 변동률 포맷 */
  const changeRate = ticker
    ? `${ticker.signed_change_rate >= 0 ? '+' : ''}${(ticker.signed_change_rate * 100).toFixed(2)}%`
    : '-'

  const marketName =
    krwMarkets.find((m) => m.market === selectedMarket)?.korean_name ?? selectedMarket

  return (
    <div className="space-y-4">
      {/* ── 상단: 마켓 선택 + 현재가 ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* 마켓 선택 */}
            <div className="flex items-center gap-3">
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[180px]" disabled={isMarketsLoading}>
                  <SelectValue placeholder={isMarketsLoading ? "마켓 로딩 중..." : "마켓 선택"} />
                </SelectTrigger>
                <SelectContent>
                  {krwMarkets.map((m) => (
                    <SelectItem key={m.market} value={m.market}>
                      {m.korean_name} ({m.market.replace('KRW-', '')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <CardTitle className="text-lg">{marketName}</CardTitle>
            </div>

            {/* 현재가 + 변동률 */}
            {ticker && (
              <div className="flex items-center gap-3">
                <PriceDisplay
                  price={ticker.trade_price}
                  change={ticker.change}
                  className="text-2xl font-bold"
                />
                <Badge
                  variant={
                    ticker.change === 'RISE'
                      ? 'destructive'
                      : ticker.change === 'FALL'
                        ? 'default'
                        : 'secondary'
                  }
                  className={
                    ticker.change === 'FALL'
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : ''
                  }
                >
                  {changeRate}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  거래대금 {formatKRW(ticker.acc_trade_price_24h / 1_000_000)}백만
                </span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* ── 데스크탑: 나란히 배치 (md 이상) ── */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        <OrderForm market={selectedMarket} ticker={ticker ?? null} />
        <OpenOrderList />
      </div>

      {/* ── 모바일: 탭 전환 (md 미만) ── */}
      <div className="md:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
          <TabsList className="w-full">
            <TabsTrigger value="order" className="flex-1">
              주문
            </TabsTrigger>
            <TabsTrigger value="open-orders" className="flex-1">
              미체결 주문
            </TabsTrigger>
          </TabsList>
          <TabsContent value="order">
            <OrderForm market={selectedMarket} ticker={ticker ?? null} />
          </TabsContent>
          <TabsContent value="open-orders">
            <OpenOrderList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
