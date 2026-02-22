'use client'

/**
 * 가격 표시 컴포넌트
 *
 * 한국 코인 관례에 맞게 가격을 포맷하여 표시합니다.
 * - 상승(RISE): 빨간색
 * - 하락(FALL): 파란색
 * - 보합(EVEN): 기본색
 */

import { cn } from '@/lib/utils'

/** 가격 변동 방향 */
type Change = 'RISE' | 'EVEN' | 'FALL'

interface PriceDisplayProps {
  /** 표시할 가격 (원화) */
  price: number
  /** 변동 방향 (상승/보합/하락) */
  change?: Change
  /** 추가 CSS 클래스 */
  className?: string
  /** 양수에 + 부호 표시 여부 */
  showSign?: boolean
}

/** 변동 방향에 따른 텍스트 색상 클래스 */
const changeColorMap: Record<Change, string> = {
  RISE: 'text-red-500',
  FALL: 'text-blue-500',
  EVEN: '',
}

/**
 * 가격을 한국 원화 관례에 맞게 포맷합니다.
 * - 100원 이상: 정수 (천단위 쉼표)
 * - 100원 미만: 소수점 포함
 */
function formatPrice(price: number): string {
  if (Math.abs(price) >= 100) {
    return new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 0,
    }).format(price)
  }

  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(price)
}

export function PriceDisplay({
  price,
  change,
  className,
  showSign = false,
}: PriceDisplayProps) {
  const colorClass = change ? changeColorMap[change] : ''
  const sign = showSign && price > 0 ? '+' : ''
  const formatted = formatPrice(price)

  return (
    <span className={cn('tabular-nums font-medium', colorClass, className)}>
      {sign}{formatted}
    </span>
  )
}
