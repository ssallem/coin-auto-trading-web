'use client'

/**
 * 보유 코인 목록 컴포넌트
 *
 * shadcn/ui Table로 보유 코인의 상세 정보를 테이블로 표시합니다.
 * 컬럼: 코인명, 보유수량, 매수평균가, 현재가, 평가금액, 손익, 손익률
 * 모바일 반응형: 좁은 화면에서 일부 컬럼 숨김
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PriceDisplay } from '@/components/common/price-display'
import { PnlBadge } from '@/components/common/pnl-badge'
import type { Holding } from '@/types/trading'
import type { UpbitTicker } from '@/types/upbit'

interface HoldingListProps {
  /** 보유 코인 목록 */
  holdings: Holding[]
  /** 티커 데이터 (change 정보 참조용) */
  tickers: UpbitTicker[]
  /** 전체 자산 금액 (비중 계산용) */
  totalAsset: number
}

/**
 * 해당 마켓의 change 정보를 티커에서 조회합니다.
 */
function getChange(
  market: string,
  tickers: UpbitTicker[]
): 'RISE' | 'EVEN' | 'FALL' | undefined {
  const ticker = tickers.find((t) => t.market === market)
  return ticker?.change
}

export function HoldingList({ holdings, tickers, totalAsset }: HoldingListProps) {
  /* 보유 코인이 없는 경우 */
  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <p className="text-muted-foreground text-sm">
          보유 중인 코인이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>코인명</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              보유수량
            </TableHead>
            <TableHead className="hidden md:table-cell text-right">
              매수평균가
            </TableHead>
            <TableHead className="text-right">현재가</TableHead>
            <TableHead className="hidden sm:table-cell text-right">
              평가금액
            </TableHead>
            <TableHead className="text-right">손익</TableHead>
            <TableHead className="text-right">손익률</TableHead>
            <TableHead className="text-right">비중</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => {
            const change = getChange(holding.market, tickers)
            const weight = totalAsset > 0 ? (holding.totalValue / totalAsset) * 100 : 0

            return (
              <TableRow key={holding.currency}>
                {/* 코인명 */}
                <TableCell className="font-medium">
                  {holding.currency}
                  <span className="text-muted-foreground text-xs ml-1 hidden sm:inline">
                    {holding.market}
                  </span>
                </TableCell>

                {/* 보유수량 */}
                <TableCell className="hidden sm:table-cell text-right tabular-nums">
                  {holding.balance.toLocaleString('ko-KR', {
                    maximumFractionDigits: 8,
                  })}
                </TableCell>

                {/* 매수평균가 */}
                <TableCell className="hidden md:table-cell text-right">
                  <PriceDisplay price={holding.avgBuyPrice} />
                </TableCell>

                {/* 현재가 (change 색상 반영) */}
                <TableCell className="text-right">
                  <PriceDisplay
                    price={holding.currentPrice}
                    change={change}
                  />
                </TableCell>

                {/* 평가금액 */}
                <TableCell className="hidden sm:table-cell text-right">
                  <PriceDisplay price={holding.totalValue} />
                </TableCell>

                {/* 손익 */}
                <TableCell className="text-right">
                  <PriceDisplay
                    price={holding.pnl}
                    change={
                      holding.pnl > 0
                        ? 'RISE'
                        : holding.pnl < 0
                          ? 'FALL'
                          : 'EVEN'
                    }
                    showSign
                  />
                </TableCell>

                {/* 손익률 */}
                <TableCell className="text-right">
                  <PnlBadge value={holding.pnlPercent} />
                </TableCell>

                {/* 비중 */}
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {weight.toFixed(1)}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
