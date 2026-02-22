'use client'

/**
 * 거래 내역 페이지
 *
 * useOrders({ state: 'done' })로 체결 완료 주문을 조회합니다.
 * - 매수: 빨간색 텍스트, 매도: 파란색 텍스트
 * - 마켓 필터 Select
 * - 빈 상태: "거래 내역이 없습니다"
 * - 모바일 반응형
 */

import { useMemo, useState } from 'react'
import { useOrders } from '@/hooks/use-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/common/loading-skeleton'

/** 날짜 포맷: YYYY-MM-DD HH:mm */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

/** KRW 금액 포맷 */
function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(value))
}

/** 전체 마켓 옵션 */
const ALL_MARKET = '__all__'

export default function HistoryPage() {
  const { data: orders, isLoading } = useOrders({ state: 'done' })
  const [selectedMarket, setSelectedMarket] = useState<string>(ALL_MARKET)

  /* 마켓 목록 추출 (중복 제거) */
  const marketOptions = useMemo(() => {
    if (!orders) return []
    const marketsSet = new Set(orders.map((o) => o.market))
    return Array.from(marketsSet).sort()
  }, [orders])

  /* 필터링된 주문 목록 */
  const filteredOrders = useMemo(() => {
    if (!orders) return []
    if (selectedMarket === ALL_MARKET) return orders
    return orders.filter((o) => o.market === selectedMarket)
  }, [orders, selectedMarket])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>거래 내역</CardTitle>
            {/* 마켓 필터 */}
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="마켓 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MARKET}>전체 마켓</SelectItem>
                {marketOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace('KRW-', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* 로딩 상태 */}
          {isLoading && <TableSkeleton rows={5} columns={6} />}

          {/* 빈 상태 */}
          {!isLoading && filteredOrders.length === 0 && (
            <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
              거래 내역이 없습니다
            </div>
          )}

          {/* 거래 내역 테이블 */}
          {!isLoading && filteredOrders.length > 0 && (
            <>
              {/* 데스크탑 테이블 */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>일시</TableHead>
                      <TableHead>마켓</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead className="text-right">체결가</TableHead>
                      <TableHead className="text-right">체결수량</TableHead>
                      <TableHead className="text-right">체결금액</TableHead>
                      <TableHead className="text-right">수수료</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const isBid = order.side === 'bid'
                      const executedVolume = parseFloat(order.executed_volume || '0')
                      const price = order.price ? parseFloat(order.price) : 0
                      const fee = parseFloat(order.paid_fee || '0')
                      const isMarketOrder = order.ord_type === 'price' || order.ord_type === 'market'

                      /* 체결금액 계산: 시장가 주문은 price가 null일 수 있으므로 수수료 기반 추정 */
                      let executedAmount = price * executedVolume
                      if (executedAmount === 0 && isMarketOrder && fee > 0) {
                        /* Upbit 수수료율 0.05% 기반 체결금액 추정 */
                        executedAmount = fee / 0.0005
                      }

                      return (
                        <TableRow key={order.uuid}>
                          {/* 일시 */}
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDate(order.created_at)}
                          </TableCell>

                          {/* 마켓 */}
                          <TableCell className="font-medium">
                            {order.market.replace('KRW-', '')}
                          </TableCell>

                          {/* 유형 */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                isBid
                                  ? 'border-red-500/50 text-red-500'
                                  : 'border-blue-500/50 text-blue-500'
                              }
                            >
                              {isBid ? '매수' : '매도'}
                              {isMarketOrder ? ' (시장가)' : ''}
                            </Badge>
                          </TableCell>

                          {/* 체결가 */}
                          <TableCell
                            className={`text-right tabular-nums ${isBid ? 'text-red-500' : 'text-blue-500'}`}
                          >
                            {price > 0 ? formatKRW(price) : '시장가'}
                          </TableCell>

                          {/* 체결수량 */}
                          <TableCell className="text-right tabular-nums">
                            {executedVolume > 0 ? executedVolume.toFixed(8) : '-'}
                          </TableCell>

                          {/* 체결금액 */}
                          <TableCell
                            className={`text-right tabular-nums font-medium ${isBid ? 'text-red-500' : 'text-blue-500'}`}
                          >
                            {executedAmount > 0 ? `${isMarketOrder && price === 0 ? '~' : ''}${formatKRW(executedAmount)}` : '-'}
                          </TableCell>

                          {/* 수수료 */}
                          <TableCell className="text-muted-foreground text-right tabular-nums text-xs">
                            {fee > 0 ? formatKRW(fee) : '0'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 모바일 카드 레이아웃 */}
              <div className="space-y-3 sm:hidden">
                {filteredOrders.map((order) => {
                  const isBid = order.side === 'bid'
                  const executedVolume = parseFloat(order.executed_volume || '0')
                  const price = order.price ? parseFloat(order.price) : 0
                  const fee = parseFloat(order.paid_fee || '0')
                  const isMarketOrder = order.ord_type === 'price' || order.ord_type === 'market'

                  /* 체결금액 계산: 시장가 주문은 price가 null일 수 있으므로 수수료 기반 추정 */
                  let executedAmount = price * executedVolume
                  if (executedAmount === 0 && isMarketOrder && fee > 0) {
                    executedAmount = fee / 0.0005
                  }

                  return (
                    <div
                      key={order.uuid}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      {/* 헤더: 마켓 + 유형 + 시간 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {order.market.replace('KRW-', '')}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              isBid
                                ? 'border-red-500/50 text-red-500'
                                : 'border-blue-500/50 text-blue-500'
                            }
                          >
                            {isBid ? '매수' : '매도'}
                            {isMarketOrder ? ' (시장가)' : ''}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(order.created_at)}
                        </span>
                      </div>

                      {/* 세부 정보 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">체결가</span>
                          <p
                            className={`tabular-nums ${isBid ? 'text-red-500' : 'text-blue-500'}`}
                          >
                            {price > 0 ? formatKRW(price) : '시장가'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">체결수량</span>
                          <p className="tabular-nums">
                            {executedVolume > 0 ? executedVolume.toFixed(8) : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">체결금액</span>
                          <p
                            className={`tabular-nums font-medium ${isBid ? 'text-red-500' : 'text-blue-500'}`}
                          >
                            {executedAmount > 0 ? `${isMarketOrder && price === 0 ? '~' : ''}${formatKRW(executedAmount)}` : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">수수료</span>
                          <p className="text-muted-foreground tabular-nums">
                            {fee > 0 ? formatKRW(fee) : '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
