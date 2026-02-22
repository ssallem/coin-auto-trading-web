'use client'

/**
 * 손익률 배지 컴포넌트
 *
 * 손익률을 색상 배지로 표시합니다.
 * - 양수: 빨간색 배경 (상승)
 * - 음수: 파란색 배경 (하락)
 * - 0: 회색 배경 (보합)
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PnlBadgeProps {
  /** 손익률 (%, 예: 1.23 = +1.23%) */
  value: number
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 손익률 값에 따른 배지 스타일을 반환합니다.
 */
function getPnlStyle(value: number): string {
  if (value > 0) {
    return 'bg-red-500/15 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-800'
  }
  if (value < 0) {
    return 'bg-blue-500/15 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-800'
  }
  return 'bg-muted text-muted-foreground border-border'
}

/**
 * 손익률을 포맷하여 문자열로 반환합니다.
 * - 양수: "+1.23%"
 * - 음수: "-0.45%"
 * - 0: "0.00%"
 */
function formatPnl(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function PnlBadge({ value, className }: PnlBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'tabular-nums font-medium',
        getPnlStyle(value),
        className
      )}
    >
      {formatPnl(value)}
    </Badge>
  )
}
