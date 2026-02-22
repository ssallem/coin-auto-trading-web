'use client'

/**
 * 미체결 주문 목록 컴포넌트
 *
 * useOrders({ state: 'wait' })로 미체결 주문을 조회하고,
 * 각 주문에 "취소" 버튼 + ConfirmDialog를 제공합니다.
 */

import { useState } from 'react'
import { useOrders, useCancelOrder } from '@/hooks/use-orders'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/common/loading-skeleton'

/** 날짜 포맷: MM/DD HH:mm */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

/** KRW 금액 포맷 */
function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(value))
}

export function OpenOrderList() {
  const { data: orders, isLoading } = useOrders({ state: 'wait' })
  const cancelOrder = useCancelOrder()

  /* 취소 대상 주문 UUID */
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  /* 취소 확인 다이얼로그 열림 */
  const [confirmOpen, setConfirmOpen] = useState(false)

  /** 취소 버튼 클릭 */
  const handleCancelClick = (uuid: string) => {
    setCancelTarget(uuid)
    setConfirmOpen(true)
  }

  /** 취소 확인 */
  const handleConfirmCancel = () => {
    if (cancelTarget) {
      cancelOrder.mutate(cancelTarget)
      setCancelTarget(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            미체결 주문
            {orders && orders.length > 0 && (
              <Badge variant="secondary">{orders.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 로딩 상태 */}
          {isLoading && <TableSkeleton rows={3} columns={5} />}

          {/* 빈 상태 */}
          {!isLoading && (!orders || orders.length === 0) && (
            <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
              미체결 주문이 없습니다
            </div>
          )}

          {/* 주문 목록 테이블 */}
          {!isLoading && orders && orders.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>마켓</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="text-right">주문가</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead>시간</TableHead>
                  <TableHead className="text-right">취소</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isBid = order.side === 'bid'
                  return (
                    <TableRow key={order.uuid}>
                      {/* 마켓 */}
                      <TableCell className="font-medium">
                        {order.market.replace('KRW-', '')}
                      </TableCell>

                      {/* 유형 (매수/매도) */}
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
                        </Badge>
                      </TableCell>

                      {/* 주문가 */}
                      <TableCell className="text-right tabular-nums">
                        {order.price ? formatKRW(parseFloat(order.price)) : '시장가'}
                      </TableCell>

                      {/* 수량 */}
                      <TableCell className="text-right tabular-nums">
                        {order.remaining_volume
                          ? parseFloat(order.remaining_volume).toFixed(8)
                          : '-'}
                      </TableCell>

                      {/* 시간 */}
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(order.created_at)}
                      </TableCell>

                      {/* 취소 버튼 */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancelClick(order.uuid)}
                          disabled={cancelOrder.isPending}
                        >
                          취소
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 주문 취소 확인 다이얼로그 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="주문 취소"
        description="이 주문을 취소하시겠습니까? 취소된 주문은 복구할 수 없습니다."
        onConfirm={handleConfirmCancel}
        confirmText="주문 취소"
        variant="destructive"
      />
    </>
  )
}
