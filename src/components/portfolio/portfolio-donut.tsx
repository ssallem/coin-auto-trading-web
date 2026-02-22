'use client'

/**
 * 자산 배분 도넛 차트 컴포넌트
 *
 * Recharts PieChart로 각 보유 코인의 비중을 도넛 차트로 표시합니다.
 * - 중앙에 총 자산 금액 표시
 * - KRW 포함 전체 자산 비중
 * - 반응형: ResponsiveContainer
 * - 범례: 코인명 + 비중(%) 표시
 */

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Holding } from '@/types/trading'

interface PortfolioDonutProps {
  /** 보유 코인 목록 */
  holdings: Holding[]
  /** KRW 잔고 */
  krwBalance: number
  /** 총 자산 (KRW + 코인 평가액) */
  totalAsset: number
}

/** 차트 색상 팔레트 (최대 8개, 순환 사용) */
const COLORS = [
  '#f59e0b', // amber-500  (KRW)
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

/** 도넛 차트 데이터 항목 */
interface DonutDataItem {
  name: string
  value: number
  percent: number
}

/**
 * 커스텀 범례 렌더러
 * 코인명 + 비중(%) 형태로 표시
 */
function CustomLegend({
  payload,
}: {
  payload?: Array<{
    value: string
    color: string
    payload?: DonutDataItem
  }>
}) {
  if (!payload) return null

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.value} ({entry.payload?.percent?.toFixed(1) ?? 0}%)
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * 커스텀 툴팁 렌더러
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: DonutDataItem
  }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0]
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <p className="text-sm font-medium">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        {data.value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원 (
        {data.payload.percent.toFixed(1)}%)
      </p>
    </div>
  )
}

export function PortfolioDonut({
  holdings,
  krwBalance,
  totalAsset,
}: PortfolioDonutProps) {
  /** 도넛 차트 데이터 생성 (KRW 포함) */
  const chartData = useMemo<DonutDataItem[]>(() => {
    if (totalAsset === 0) return []

    const items: DonutDataItem[] = []

    /* KRW 항목 */
    if (krwBalance > 0) {
      items.push({
        name: 'KRW',
        value: krwBalance,
        percent: (krwBalance / totalAsset) * 100,
      })
    }

    /* 보유 코인 항목 */
    holdings.forEach((holding) => {
      if (holding.totalValue > 0) {
        items.push({
          name: holding.currency,
          value: holding.totalValue,
          percent: (holding.totalValue / totalAsset) * 100,
        })
      }
    })

    return items
  }, [holdings, krwBalance, totalAsset])

  /* 데이터가 없으면 빈 상태 표시 */
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">자산 배분</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              표시할 자산이 없습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">자산 배분</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            {/* 중앙 텍스트: 총 자산 금액 */}
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-xs"
            >
              총 자산
            </text>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-sm font-bold"
            >
              {totalAsset >= 100_000_000
                ? `${(totalAsset / 100_000_000).toFixed(1)}억`
                : totalAsset >= 10_000
                  ? `${(totalAsset / 10_000).toFixed(0)}만`
                  : totalAsset.toLocaleString('ko-KR')}
              원
            </text>

            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
