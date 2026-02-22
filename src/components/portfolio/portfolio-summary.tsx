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

import { Wallet, Coins, TrendingUp, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PriceDisplay } from '@/components/common/price-display'
import { PnlBadge } from '@/components/common/pnl-badge'
import type { PortfolioSummary as PortfolioSummaryType } from '@/types/trading'

interface PortfolioSummaryProps {
  /** 포트폴리오 요약 데이터 */
  summary: PortfolioSummaryType
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  return (
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
  )
}
