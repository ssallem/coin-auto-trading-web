'use client'

/**
 * 포트폴리오 메인 콘텐츠 컴포넌트
 *
 * 데이터 조회 및 가공 로직을 담당합니다.
 * - useAccounts()로 잔고 조회
 * - useTicker()로 보유 코인 현재가 조회
 * - useUpbitWebSocket()으로 실시간 가격 업데이트
 * - UpbitBalance → Holding 변환
 * - PortfolioSummary, HoldingList, PortfolioDonut 합성
 */

import { useMemo } from 'react'
import { useAccounts } from '@/hooks/use-accounts'
import { useTicker } from '@/hooks/use-ticker'
import { useUpbitWebSocket } from '@/hooks/use-upbit-websocket'
import { useDailyPnl } from '@/hooks/use-daily-pnl'
import { useRsi } from '@/hooks/use-rsi'
import type { RsiData } from '@/hooks/use-rsi'
import { CardSkeleton, TableSkeleton } from '@/components/common/loading-skeleton'
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary'
import { HoldingList } from '@/components/portfolio/holding-list'
import { PortfolioDonut } from '@/components/portfolio/portfolio-donut'
import type { UpbitBalance, UpbitTicker } from '@/types/upbit'
import type { Holding, PortfolioSummary as PortfolioSummaryType } from '@/types/trading'

/**
 * KRW 잔고를 추출합니다.
 * balance + locked를 합산하여 총 KRW 잔고를 반환합니다.
 */
function extractKRW(accounts: UpbitBalance[]): number {
  const krw = accounts.find((a) => a.currency === 'KRW')
  if (!krw) return 0
  return parseFloat(krw.balance) + parseFloat(krw.locked)
}

/**
 * KRW 이외의 보유 코인 마켓 코드 목록을 생성합니다.
 * 예: ["KRW-BTC", "KRW-ETH"]
 */
function buildMarketCodes(accounts: UpbitBalance[]): string[] {
  return accounts
    .filter((a) => a.currency !== 'KRW')
    .map((a) => `KRW-${a.currency}`)
}

/**
 * UpbitBalance를 Holding으로 변환합니다.
 * ticker 데이터에서 현재가를 조회하여 손익을 계산합니다.
 */
function toHolding(
  account: UpbitBalance,
  tickers: UpbitTicker[]
): Holding {
  const market = `KRW-${account.currency}`
  const balance = parseFloat(account.balance) + parseFloat(account.locked)
  const avgBuyPrice = parseFloat(account.avg_buy_price)

  /* 해당 마켓의 현재가 조회 */
  const ticker = tickers.find((t) => t.market === market)
  const currentPrice = ticker?.trade_price ?? avgBuyPrice

  const totalValue = balance * currentPrice
  const investedAmount = balance * avgBuyPrice
  const pnl = totalValue - investedAmount
  const pnlPercent = investedAmount > 0 ? (pnl / investedAmount) * 100 : 0

  return {
    currency: account.currency,
    market,
    balance, /* 총 보유량 (balance + locked) - totalValue/investedAmount 계산과 일치 */
    locked: parseFloat(account.locked),
    avgBuyPrice,
    currentPrice,
    totalValue,
    investedAmount,
    pnl,
    pnlPercent,
  }
}

/**
 * 전체 포트폴리오 요약 데이터를 생성합니다.
 */
function buildSummary(
  holdings: Holding[],
  krwBalance: number
): PortfolioSummaryType {
  const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0)
  const totalCoinValue = holdings.reduce((sum, h) => sum + h.totalValue, 0)
  const totalAsset = krwBalance + totalCoinValue
  const totalPnL = totalCoinValue - totalInvested
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return {
    totalAsset,
    totalKRW: krwBalance,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    holdings,
  }
}

export function PortfolioContent() {
  /* 1. 잔고 조회 */
  const {
    data: accounts,
    isLoading: isAccountsLoading,
  } = useAccounts()

  /* 2. 보유 코인 마켓 코드 생성 (KRW 제외) */
  const marketCodes = useMemo(
    () => (accounts ? buildMarketCodes(accounts) : []),
    [accounts]
  )

  /* 3. 현재가 조회 */
  const { data: tickers, isLoading: isTickerLoading } = useTicker(marketCodes)

  /* 4. WebSocket으로 실시간 가격 업데이트 */
  useUpbitWebSocket({
    markets: marketCodes,
    types: ['ticker'],
    enabled: marketCodes.length > 0,
  })

  /* 5. 일일 매매 손익 조회 (오늘 날짜) */
  const { data: dailyPnl } = useDailyPnl()

  /* 5-1. 보유 코인 RSI 지표 조회 */
  const { data: rsiData } = useRsi(marketCodes)

  /* 6. Holding 데이터 변환 */
  const holdings = useMemo<Holding[]>(() => {
    if (!accounts || !tickers) return []

    return accounts
      .filter((a) => a.currency !== 'KRW')
      .filter((a) => parseFloat(a.balance) + parseFloat(a.locked) > 0)
      .map((a) => toHolding(a, tickers))
  }, [accounts, tickers])

  /* 7. KRW 잔고 추출 */
  const krwBalance = useMemo(
    () => (accounts ? extractKRW(accounts) : 0),
    [accounts]
  )

  /* 8. 포트폴리오 요약 생성 */
  const summary = useMemo(
    () => buildSummary(holdings, krwBalance),
    [holdings, krwBalance]
  )

  /* ─── 로딩 상태 ─── */
  if (isAccountsLoading) {
    return (
      <div className="space-y-6">
        {/* 요약 카드 스켈레톤 (4개) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={`summary-skeleton-${i}`} />
          ))}
        </div>
        {/* 테이블 스켈레톤 */}
        <TableSkeleton rows={5} columns={7} />
      </div>
    )
  }

  /* ─── 메인 콘텐츠 ─── */
  return (
    <div className="space-y-6">
      {/* 상단: 포트폴리오 요약 카드 + 일일 매매 실적 */}
      <PortfolioSummary summary={summary} dailyPnl={dailyPnl} />

      {/* 하단: 차트 + 보유 코인 목록 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* 자산 배분 도넛 차트 */}
        <PortfolioDonut
          holdings={holdings}
          krwBalance={krwBalance}
          totalAsset={summary.totalAsset}
        />

        {/* 보유 코인 목록 테이블 */}
        <HoldingList
          holdings={holdings}
          tickers={tickers ?? []}
          totalAsset={summary.totalAsset}
          rsiData={rsiData ?? []}
        />
      </div>
    </div>
  )
}
