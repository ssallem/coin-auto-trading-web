'use client'

/**
 * 포트폴리오 요약 카드 컴포넌트
 *
 * 4개의 요약 카드를 그리드로 배치합니다.
 * - 총 평가자산: KRW 잔고 + 코인 평가액 합산
 * - 보유 KRW: 주문 가능 원화 잔고
 * - 총 투자금: 코인 매수에 사용된 원금 합산
 * - 총 손익: 평가손익 금액 및 손익률
 */

import { Wallet, Coins, TrendingUp, BarChart3, TrendingDown, TrendingUpDown, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PriceDisplay } from '@/components/common/price-display'
import { PnlBadge } from '@/components/common/pnl-badge'
import type { PortfolioSummary as PortfolioSummaryType, DailyPnlStats } from '@/types/trading'

interface PortfolioSummaryProps {
  /** 포트폴리오 요약 데이터 */
  summary: PortfolioSummaryType
  /** 일일 매매 실적 데이터 */
  dailyPnl?: DailyPnlStats
}

export function PortfolioSummary({ summary, dailyPnl }: PortfolioSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 카드 1: 총 평가자산 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 평가자산
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <PriceDisplay price={summary.totalAsset} />
              <span className="text-sm font-normal text-muted-foreground ml-1">
                원
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">투자 수익률</span>
              <PnlBadge value={summary.totalPnLPercent} className="text-xs" />
            </div>
          </CardContent>
        </Card>

      {/* 카드 2: 보유 KRW */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            보유 KRW
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PriceDisplay price={summary.totalKRW} />
            <span className="text-sm font-normal text-muted-foreground ml-1">
              원
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              자산 비중 {summary.totalAsset > 0 ? ((summary.totalKRW / summary.totalAsset) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 카드 3: 총 투자금 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            총 투자금
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <PriceDisplay price={summary.totalInvested} />
            <span className="text-sm font-normal text-muted-foreground ml-1">
              원
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              자산 비중 {summary.totalAsset > 0 ? ((summary.totalInvested / summary.totalAsset) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 카드 4: 총 손익 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            총 손익
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <PriceDisplay
                price={summary.totalPnL}
                change={
                  summary.totalPnL > 0
                    ? 'RISE'
                    : summary.totalPnL < 0
                      ? 'FALL'
                      : 'EVEN'
                }
                showSign
              />
              <span className="text-sm font-normal text-muted-foreground ml-1">
                원
              </span>
            </span>
            <PnlBadge value={summary.totalPnLPercent} />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* 일일 매매 실적 섹션 */}
      {dailyPnl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              일일 매매 실적 ({dailyPnl.date})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* 일일 실현 손익 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">일일 실현 손익</span>
                </div>
                <div className="text-xl font-bold">
                  <PriceDisplay
                    price={dailyPnl.totalPnl}
                    change={
                      dailyPnl.totalPnl > 0
                        ? 'RISE'
                        : dailyPnl.totalPnl < 0
                          ? 'FALL'
                          : 'EVEN'
                    }
                    showSign
                  />
                  <span className="text-sm font-normal text-muted-foreground ml-1">원</span>
                </div>
              </div>

              {/* 매수/매도 건수 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">매수/매도 건수</span>
                </div>
                <div className="text-xl font-bold tabular-nums">
                  <span className="text-red-500">{dailyPnl.buyCount}</span>
                  <span className="text-muted-foreground mx-1.5">/</span>
                  <span className="text-blue-500">{dailyPnl.sellCount}</span>
                  <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
                </div>
              </div>

              {/* 승률 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">승률</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tabular-nums">
                    {dailyPnl.sellCount === 0 ? '-' : `${dailyPnl.winRate.toFixed(1)}%`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({dailyPnl.winCount}승 {dailyPnl.loseCount}패)
                  </span>
                </div>
              </div>

              {/* 매수/매도 총액 */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">매수/매도 총액</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">
                    <span className="text-red-500">매수 </span>
                    <span className="tabular-nums">{dailyPnl.buyVolume.toLocaleString('ko-KR')}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">원</span>
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-blue-500">매도 </span>
                    <span className="tabular-nums">{dailyPnl.sellVolume.toLocaleString('ko-KR')}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">원</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
