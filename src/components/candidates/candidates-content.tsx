'use client'

/**
 * 매수 후보 콘텐츠 컴포넌트 (Supabase 버전)
 *
 * Python 봇이 분석한 매수 후보 데이터를 Supabase에서 조회하여 표시합니다.
 * - useBuyCandidates()로 봇의 전략 분석 결과 조회
 * - useTicker()로 실시간 현재가 조회
 * - /api/markets로 한글명 조회
 * - signal, confidence, reason 등 상세 정보 제공
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useBuyCandidates } from '@/hooks/use-buy-candidates'
import { useTicker } from '@/hooks/use-ticker'
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
import type { BuyCandidateRow } from '@/types/supabase'

/**
 * 매수 후보 데이터 (Supabase + 현재가 + 한글명 조합)
 */
interface CandidateData extends BuyCandidateRow {
  symbol: string
  koreanName: string
  currentPrice: number
  change: 'RISE' | 'EVEN' | 'FALL'
  changeRate: number
}

/**
 * Signal 값에 따른 Badge를 반환합니다.
 */
function SignalBadge({ signal }: { signal: 'BUY' | 'SELL' | 'HOLD' }) {
  if (signal === 'BUY') {
    return (
      <Badge variant="default" className="bg-blue-600 text-white hover:bg-blue-700">
        매수 신호
      </Badge>
    )
  }

  if (signal === 'SELL') {
    return <Badge variant="destructive">매도 신호</Badge>
  }

  return <Badge variant="outline">관망</Badge>
}

/**
 * Confidence를 백분율로 표시합니다.
 */
function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100)

  let variant: 'default' | 'secondary' | 'outline' = 'outline'
  let className = ''

  if (percentage >= 80) {
    variant = 'default'
    className = 'bg-green-600 text-white hover:bg-green-700'
  } else if (percentage >= 60) {
    variant = 'secondary'
  }

  return (
    <Badge variant={variant} className={className}>
      {percentage}%
    </Badge>
  )
}

export function CandidatesContent() {
  /* 1. 매수 후보 조회 (Supabase buy_candidates) */
  const {
    data: buyCandidates,
    isLoading: isCandidatesLoading,
    isError: isCandidatesError
  } = useBuyCandidates()

  // 마켓 목록 추출
  const markets = useMemo(() => {
    if (!buyCandidates) return []
    return buyCandidates.map((c) => c.market)
  }, [buyCandidates])

  /* 2. 현재가 조회 (실시간 업데이트) */
  const {
    data: tickers,
    isLoading: isTickerLoading,
    isError: isTickerError
  } = useTicker(markets)

  /* 3. 마켓 한글명 조회 */
  const {
    data: marketList,
    isLoading: isMarketsLoading,
    isError: isMarketsError
  } = useQuery({
    queryKey: queryKeys.markets(),
    queryFn: async () => {
      const { data } = await axios.get<UpbitMarket[]>('/api/markets')
      return data
    },
    staleTime: QUERY_CONFIG.markets.staleTime,
  })

  /* 4. 매수 후보 데이터 가공 */
  const candidates = useMemo<CandidateData[]>(() => {
    if (!buyCandidates || !tickers || !marketList) return []

    // 마켓 코드 → 한글명 매핑 생성
    const marketNameMap = new Map(
      marketList.map((m) => [m.market, m.korean_name])
    )

    // 마켓 코드 → 티커 매핑 생성 (O(1) 조회)
    const tickerMap = new Map(
      tickers.map((t) => [t.market, t])
    )

    // Supabase 데이터 + Ticker 데이터 조합
    const combined = buyCandidates.map((candidate) => {
      const ticker = tickerMap.get(candidate.market)
      const symbol = candidate.market.replace('KRW-', '')
      const koreanName = marketNameMap.get(candidate.market) || symbol

      return {
        ...candidate,
        symbol,
        koreanName,
        currentPrice: ticker?.trade_price ?? candidate.current_price,
        change: ticker?.change ?? 'EVEN',
        changeRate: ticker?.signed_change_rate ?? 0,
      } as CandidateData
    })

    // Confidence 내림차순 정렬 (높을수록 확신도가 높음)
    return combined.sort((a, b) => b.confidence - a.confidence)
  }, [buyCandidates, tickers, marketList])

  /* 5. 매수 신호 종목 개수 (signal === 'BUY') */
  const buySignalCount = useMemo(() => {
    return candidates.filter((c) => c.signal === 'BUY').length
  }, [candidates])

  /* ─── 로딩 상태 ─── */
  const isLoading = isCandidatesLoading || isTickerLoading || isMarketsLoading
  const isError = isCandidatesError || isTickerError || isMarketsError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={10} columns={6} />
      </div>
    )
  }

  // 에러가 발생했지만 이전 데이터가 있으면 계속 표시 (깜빡임 방지)
  if (isError && candidates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Supabase 연결을 확인하거나, Python 봇이 실행 중인지 확인하세요.
          </p>
        </CardContent>
      </Card>
    )
  }

  // 데이터가 없을 경우
  if (!isError && candidates.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            아직 분석된 매수 후보가 없습니다.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Python 봇이 실행 중이면 곧 데이터가 표시됩니다.
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
            Python 봇이 분석한 매수 후보 데이터를 실시간 모니터링합니다.
            신호 강도(Confidence)와 사유를 확인하세요.
          </CardDescription>
          {/* 에러 발생 시 경고 배너 (이전 데이터가 있을 때) */}
          {isError && candidates.length > 0 && (
            <p className="text-destructive text-xs mt-1">
              ⚠ 최신 데이터 갱신에 실패했습니다. 이전 데이터를 표시 중입니다.
            </p>
          )}
          {/* 매수 신호 종목 개수 표시 */}
          <div className="pt-2">
            <p className="text-sm font-medium">
              현재 매수 신호 종목:{' '}
              <span className="text-blue-600 font-bold text-lg">
                {buySignalCount}개
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
                  <TableHead className="text-center">신호</TableHead>
                  <TableHead className="text-center">확신도</TableHead>
                  <TableHead>사유</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
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

                    {/* 신호 */}
                    <TableCell className="text-center">
                      <SignalBadge signal={candidate.signal} />
                    </TableCell>

                    {/* 확신도 */}
                    <TableCell className="text-center">
                      <ConfidenceBadge confidence={candidate.confidence} />
                    </TableCell>

                    {/* 사유 */}
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {candidate.reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 분석 시각 표시 */}
          {candidates.length > 0 && candidates[0].analyzed_at && (
            <div className="mt-4 text-xs text-muted-foreground text-center">
              마지막 분석: {new Date(candidates[0].analyzed_at).toLocaleString('ko-KR')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
