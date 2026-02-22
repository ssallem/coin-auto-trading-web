'use client'

/**
 * 차트 도구바
 *
 * - 마켓 선택 (Select): /api/markets에서 KRW 마켓 목록을 조회하여 드롭다운 표시
 * - 인터벌 선택 (버튼 그룹): 1분, 3분, 5분, 15분, 30분, 1시간, 4시간
 * - 현재가/변동률 표시
 */

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import { useUIStore } from '@/stores/ui-store'
import { useTicker } from '@/hooks/use-ticker'
import { PriceDisplay } from '@/components/common/price-display'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UpbitMarket, CandleInterval } from '@/types/upbit'
import { cn } from '@/lib/utils'

/** 인터벌 옵션 목록 */
const INTERVAL_OPTIONS: { value: CandleInterval; label: string }[] = [
  { value: '1', label: '1분' },
  { value: '3', label: '3분' },
  { value: '5', label: '5분' },
  { value: '15', label: '15분' },
  { value: '30', label: '30분' },
  { value: '60', label: '1시간' },
  { value: '240', label: '4시간' },
]

export function ChartToolbar() {
  const router = useRouter()
  const {
    selectedMarket,
    selectedInterval,
    setSelectedMarket,
    setSelectedInterval,
  } = useUIStore()

  /** 마켓 목록 조회 */
  const { data: markets } = useQuery({
    queryKey: queryKeys.markets(),
    queryFn: async () => {
      const { data } = await axios.get<UpbitMarket[]>('/api/markets')
      return data
    },
    staleTime: QUERY_CONFIG.markets.staleTime,
  })

  /** KRW 마켓만 필터링 */
  const krwMarkets = markets?.filter((m) => m.market.startsWith('KRW-')) ?? []

  /** 현재가 조회 */
  const { data: tickerData } = useTicker([selectedMarket])
  const ticker = tickerData?.[0]

  /** 변동률 포맷 (소수 → %) */
  const changeRate = ticker
    ? `${ticker.signed_change_rate >= 0 ? '+' : ''}${(ticker.signed_change_rate * 100).toFixed(2)}%`
    : ''

  /** 마켓 변경 핸들러 */
  const handleMarketChange = (market: string) => {
    setSelectedMarket(market)
    router.push(`/chart/${market}`)
  }

  /** 인터벌 변경 핸들러 */
  const handleIntervalChange = (interval: CandleInterval) => {
    setSelectedInterval(interval)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* 좌측: 마켓 선택 + 현재가 */}
      <div className="flex items-center gap-3">
        {/* 마켓 선택 드롭다운 */}
        <Select value={selectedMarket} onValueChange={handleMarketChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="마켓 선택" />
          </SelectTrigger>
          <SelectContent>
            {krwMarkets.map((m) => (
              <SelectItem key={m.market} value={m.market}>
                {m.korean_name} ({m.market.replace('KRW-', '')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 현재가 + 변동률 */}
        {ticker && (
          <div className="flex items-center gap-2">
            <PriceDisplay
              price={ticker.trade_price}
              change={ticker.change}
              className="text-xl font-bold"
            />
            <Badge
              variant={
                ticker.change === 'RISE'
                  ? 'destructive'
                  : ticker.change === 'FALL'
                    ? 'default'
                    : 'secondary'
              }
              className={cn(
                'text-xs',
                ticker.change === 'FALL' && 'bg-blue-500 text-white hover:bg-blue-600'
              )}
            >
              {changeRate}
            </Badge>
          </div>
        )}
      </div>

      {/* 우측: 인터벌 선택 버튼 그룹 */}
      <div className="flex items-center gap-1">
        {INTERVAL_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={selectedInterval === opt.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleIntervalChange(opt.value)}
            className="text-xs px-2.5"
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
