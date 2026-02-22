'use client'

/**
 * 로딩 스켈레톤 컴포넌트 모음
 *
 * 데이터 로딩 중 표시할 다양한 형태의 스켈레톤을 제공합니다.
 * - CardSkeleton: 카드 형태 (3줄 텍스트)
 * - TableSkeleton: 테이블 형태 (지정 행 수)
 * - ChartSkeleton: 차트 영역 형태
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// CardSkeleton: 카드 모양 스켈레톤 (3줄)
// ─────────────────────────────────────────────

interface CardSkeletonProps {
  /** 추가 CSS 클래스 */
  className?: string
}

/** 카드 형태 스켈레톤 (제목 + 본문 3줄) */
export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn('rounded-lg border p-6 space-y-4', className)}>
      {/* 제목 영역 */}
      <Skeleton className="h-5 w-1/3" />
      {/* 본문 3줄 */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TableSkeleton: 테이블 형태 스켈레톤
// ─────────────────────────────────────────────

interface TableSkeletonProps {
  /** 스켈레톤 행 수 (기본: 5) */
  rows?: number
  /** 스켈레톤 열 수 (기본: 4) */
  columns?: number
  /** 추가 CSS 클래스 */
  className?: string
}

/** 테이블 형태 스켈레톤 (헤더 + 지정 행 수) */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('rounded-lg border', className)}>
      {/* 테이블 헤더 */}
      <div className="border-b px-4 py-3 flex gap-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* 테이블 행 */}
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="border-b last:border-b-0 px-4 py-3 flex gap-4"
        >
          {Array.from({ length: columns }, (_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// ChartSkeleton: 차트 영역 스켈레톤
// ─────────────────────────────────────────────

interface ChartSkeletonProps {
  /** 추가 CSS 클래스 */
  className?: string
}

/** 차트 영역 스켈레톤 (큰 직사각형 + 하단 x축) */
export function ChartSkeleton({ className }: ChartSkeletonProps) {
  return (
    <div className={cn('rounded-lg border p-6 space-y-4', className)}>
      {/* 차트 제목 영역 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* 차트 본문 영역 */}
      <Skeleton className="h-[300px] w-full" />
      {/* 하단 x축 레이블 영역 */}
      <div className="flex justify-between">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={`label-${i}`} className="h-3 w-12" />
        ))}
      </div>
    </div>
  )
}
