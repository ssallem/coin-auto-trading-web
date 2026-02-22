'use client'

/**
 * 거래 메인 컴포넌트
 *
 * 좌측: OrderForm (주문 폼), 우측: OpenOrderList (미체결 주문)
 * 상단: 마켓 선택 + 현재가 표시
 * 반응형: 데스크탑 나란히, 모바일 탭 전환
 */

import { useState } from 'react'
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

/** 주요 KRW 마켓 목록 */
const MARKETS = [
  { code: 'KRW-BTC', name: '비트코인' },
  { code: 'KRW-ETH', name: '이더리움' },
  { code: 'KRW-XRP', name: '리플' },
  { code: 'KRW-SOL', name: '솔라나' },
  { code: 'KRW-DOGE', name: '도지코인' },
  { code: 'KRW-ADA', name: '에이다' },
  { code: 'KRW-AVAX', name: '아발란체' },
  { code: 'KRW-DOT', name: '폴카닷' },
  { code: 'KRW-MATIC', name: '폴리곤' },
  { code: 'KRW-LINK', name: '체인링크' },
]

/** 가격을 한국 원화 관례에 맞게 포맷합니다. */
function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(value))
}

export function TradeContent() {
  const { selectedMarket, setSelectedMarket } = useUIStore()
  const [mobileTab, setMobileTab] = useState<string>('order')

  /* 현재가 조회 */
  const { data: tickers } = useTicker([selectedMarket])
  const ticker = tickers?.[0]

  /* 변동률 포맷 */
  const changeRate = ticker
    ? `${ticker.signed_change_rate >= 0 ? '+' : ''}${(ticker.signed_change_rate * 100).toFixed(2)}%`
    : '-'

  const marketName =
    MARKETS.find((m) => m.code === selectedMarket)?.name ?? selectedMarket

  return (
    <div className="space-y-4">
      {/* ── 상단: 마켓 선택 + 현재가 ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* 마켓 선택 */}
            <div className="flex items-center gap-3">
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKETS.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.name} ({m.code.replace('KRW-', '')})
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
