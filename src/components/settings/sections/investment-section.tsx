'use client'

/**
 * 투자금액 설정 섹션
 *
 * - max_total_investment: 총 투자 한도 (KRW)
 * - per_trade_amount: 1회 매수금액 (KRW)
 * - min_order_amount: 최소 주문금액 (기본 5,000 KRW)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { InvestmentConfigSchema } from '@/lib/validations/config.schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { BotConfig, InvestmentConfig } from '@/types/trading'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface InvestmentSectionProps {
  data: InvestmentConfig | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_VALUES: InvestmentConfig = {
  max_total_investment: 1_000_000,
  per_trade_amount: 50_000,
  min_order_amount: 5_000,
}

// ─────────────────────────────────────────────
// KRW 포맷 헬퍼
// ─────────────────────────────────────────────

function formatKRW(value: number): string {
  return value.toLocaleString('ko-KR')
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function InvestmentSection({
  data,
  onSave,
  isSaving,
}: InvestmentSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InvestmentConfig>({
    resolver: zodResolver(InvestmentConfigSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* 서버 데이터로 폼 초기화 (방어적 병합) */
  useEffect(() => {
    if (data) {
      reset({ ...DEFAULT_VALUES, ...data })
    }
  }, [data, reset])

  /* 폼 제출 핸들러 */
  const onSubmit = (values: InvestmentConfig) => {
    onSave({ investment: values })
  }

  /* 실시간 값 포맷 표시용 */
  const maxTotal = watch('max_total_investment')
  const perTrade = watch('per_trade_amount')
  const minOrder = watch('min_order_amount')

  return (
    <Card>
      <CardHeader>
        <CardTitle>투자금액 설정</CardTitle>
        <CardDescription>
          총 투자 한도, 1회 매수금액, 최소 주문금액을 설정합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="investment-form"
          onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
            console.error('Investment form validation errors:', fieldErrors)
            const firstError = Object.values(fieldErrors).find((e) => e?.message)
            toast.error(firstError?.message ?? '입력값을 확인해주세요')
          })}
          className="space-y-6"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 최대 총 투자금액 */}
            <div className="space-y-2">
              <Label htmlFor="inv-max-total">최대 총 투자금액 (KRW)</Label>
              <Input
                id="inv-max-total"
                type="number"
                min={5000}
                {...register('max_total_investment', { valueAsNumber: true })}
              />
              {errors.max_total_investment && (
                <p className="text-destructive text-xs">
                  {errors.max_total_investment.message}
                </p>
              )}
              {typeof maxTotal === 'number' && !isNaN(maxTotal) && (
                <p className="text-muted-foreground text-xs">
                  {formatKRW(maxTotal)} 원
                </p>
              )}
            </div>

            {/* 1회 매수금액 */}
            <div className="space-y-2">
              <Label htmlFor="inv-per-trade">1회 매수금액 (KRW)</Label>
              <Input
                id="inv-per-trade"
                type="number"
                min={5000}
                {...register('per_trade_amount', { valueAsNumber: true })}
              />
              {errors.per_trade_amount && (
                <p className="text-destructive text-xs">
                  {errors.per_trade_amount.message}
                </p>
              )}
              {typeof perTrade === 'number' && !isNaN(perTrade) && (
                <p className="text-muted-foreground text-xs">
                  {formatKRW(perTrade)} 원
                </p>
              )}
            </div>

            {/* 최소 주문금액 */}
            <div className="space-y-2">
              <Label htmlFor="inv-min-order">최소 주문금액 (KRW)</Label>
              <Input
                id="inv-min-order"
                type="number"
                min={5000}
                {...register('min_order_amount', { valueAsNumber: true })}
              />
              {errors.min_order_amount && (
                <p className="text-destructive text-xs">
                  {errors.min_order_amount.message}
                </p>
              )}
              {typeof minOrder === 'number' && !isNaN(minOrder) && (
                <p className="text-muted-foreground text-xs">
                  {formatKRW(minOrder)} 원
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="investment-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
