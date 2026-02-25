'use client'

/**
 * 매수 후보 콘텐츠 컴포넌트
 *
 * TOP 30 코인의 RSI 지표를 실시간 모니터링하여 매수 후보를 표시합니다.
 * - useRsi()로 RSI 지표 조회
 * - useTicker()로 현재가 조회
 * - /api/markets로 한글명 조회
 * - RSI 기준으로 매수/매도 추천 제공
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useRsi } from '@/hooks/use-rsi'
import { useTicker } from '@/hooks/use-ticker'
import { TOP_30_MARKETS } from '@/lib/constants'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/common/price-display'
import { CardSkeleton, TableSkeleton } from '@/components/common/loading-skeleton'
import type { UpbitMarket } from '@/types/upbit'

/**
 * 매수 후보 데이터 (RSI + 현재가 + 한글명 조합)
 */
interface CandidateData {
  market: string
  symbol: string
  koreanName: string
  currentPrice: number
  change: 'RISE' | 'EVEN' | 'FALL'
  changeRate: number
  rsi: number | null
}

/**
 * RSI 값에 따른 상태 Badge를 반환합니다.
 */
function RsiStatusBadge({ rsi }: { rsi: number | null }) {
  if (rsi === null) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  if (rsi <= 25) {
    return (
      <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
        강력 매수
      </Badge>
    )
  }

  if (rsi <= 30) {
    return (
      <Badge variant="default" className="bg-blue-500 text-white hover:bg-blue-600">
        매수 추천
      </Badge>
    )
  }

  if (rsi <= 40) {
    return <Badge variant="secondary">매수 대기</Badge>
  }

  if (rsi <= 60) {
    return <Badge variant="outline">관망</Badge>
  }

  if (rsi <= 70) {
    return <Badge variant="secondary">매도 대기</Badge>
  }

  return <Badge variant="destructive">매도 추천</Badge>
}

export function CandidatesContent() {
  /* 1. RSI 지표 조회 (TOP 30) */
  const { data: rsiData, isLoading: isRsiLoading, isError: isRsiError } = useRsi(TOP_30_MARKETS)

  /* 2. 현재가 조회 (TOP 30) */
  const { data: tickers, isLoading: isTickerLoading, isError: isTickerError } = useTicker(TOP_30_MARKETS)

  /* 3. 마켓 한글명 조회 */
  const { data: markets, isLoading: isMarketsLoading, isError: isMarketsError } = useQuery({
    queryKey: queryKeys.markets(),
    queryFn: async () => {
      const { data } = await axios.get<UpbitMarket[]>('/api/markets')
      return data
    },
    staleTime: QUERY_CONFIG.markets.staleTime,
  })

  /* 4. 매수 후보 데이터 가공 */
  const candidates = useMemo<CandidateData[]>(() => {
    if (!rsiData || !tickers || !markets) return []

    // 마켓 코드 → 한글명 매핑 생성
    const marketNameMap = new Map(
      markets.map((m) => [m.market, m.korean_name])
    )

    // 마켓 코드 → 티커 매핑 생성 (O(1) 조회)
    const tickerMap = new Map(
      tickers.map((t) => [t.market, t])
    )

    // RSI + Ticker 데이터 조합
    const combined = rsiData.map((rsi) => {
      const ticker = tickerMap.get(rsi.market)
      const symbol = rsi.market.replace('KRW-', '')
      const koreanName = marketNameMap.get(rsi.market) || symbol

      return {
        market: rsi.market,
        symbol,
        koreanName,
        currentPrice: ticker?.trade_price ?? 0,
        change: ticker?.change ?? 'EVEN',
        changeRate: ticker?.signed_change_rate ?? 0,
        rsi: rsi.rsi,
      } as CandidateData
    })

    // RSI 오름차순 정렬 (낮을수록 매수 기회, null은 맨 뒤)
    return combined.sort((a, b) => {
      if (a.rsi === null && b.rsi === null) return 0
      if (a.rsi === null) return 1
      if (b.rsi === null) return -1
      return a.rsi - b.rsi
    })
  }, [rsiData, tickers, markets])

  /* 5. 매수 추천 종목 개수 (RSI < 30) */
  const buyCandidateCount = useMemo(() => {
    return candidates.filter((c) => c.rsi !== null && c.rsi < 30).length
  }, [candidates])

  /* ─── 로딩 상태 ─── */
  const isLoading = isRsiLoading || isTickerLoading || isMarketsLoading
  const isError = isRsiError || isTickerError || isMarketsError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={10} columns={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    )
  }

  /* ─── 메인 콘텐츠 ─── */
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>매수 후보 종목 스캐너</CardTitle>
          <CardDescription>
            TOP 30 코인의 RSI 지표를 실시간 모니터링합니다. RSI가 낮을수록 매수 기회입니다.
          </CardDescription>
          {/* 매수 추천 종목 개수 표시 */}
          <div className="pt-2">
            <p className="text-sm font-medium">
              현재 매수 추천 종목:{' '}
              <span className="text-blue-600 font-bold text-lg">
                {buyCandidateCount}개
              </span>
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>코인명</TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                  <TableHead className="text-right">24h 변동률</TableHead>
                  <TableHead className="text-right">RSI</TableHead>
                  <TableHead className="text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      데이터를 불러올 수 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((candidate) => (
                    <TableRow key={candidate.market}>
                      {/* 코인명 */}
                      <TableCell className="font-medium">
                        {candidate.koreanName}
                        <span className="text-muted-foreground text-xs ml-2">
                          {candidate.symbol}
                        </span>
                      </TableCell>

                      {/* 현재가 */}
                      <TableCell className="text-right">
                        <PriceDisplay
                          price={candidate.currentPrice}
                          change={candidate.change}
                        />
                      </TableCell>

                      {/* 24h 변동률 */}
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            candidate.change === 'RISE'
                              ? 'default'
                              : candidate.change === 'FALL'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            candidate.change === 'RISE'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : candidate.change === 'FALL'
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : ''
                          }
                        >
                          {candidate.change === 'RISE' ? '+' : candidate.change === 'FALL' ? '' : ''}
                          {(candidate.changeRate * 100).toFixed(2)}%
                        </Badge>
                      </TableCell>

                      {/* RSI */}
                      <TableCell className="text-right tabular-nums font-medium">
                        {candidate.rsi !== null ? candidate.rsi.toFixed(1) : '-'}
                      </TableCell>

                      {/* 상태 */}
                      <TableCell className="text-right">
                        <RsiStatusBadge rsi={candidate.rsi} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
