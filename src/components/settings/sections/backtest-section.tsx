'use client'

/**
 * 백테스팅 설정 섹션
 *
 * - period_days: 백테스트 기간 (일)
 * - start_date / end_date: 시작일/종료일 (YYYY-MM-DD)
 * - initial_capital: 초기 자본금
 * - commission_rate: 수수료율
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BacktestConfigSchema,
  type BacktestConfigInput,
} from '@/lib/validations/config.schema'
import { toast } from 'sonner'
import type { BotConfig, BacktestConfig } from '@/types/trading'
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

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface BacktestSectionProps {
  data: BacktestConfig | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_VALUES: BacktestConfigInput = {
  period_days: 30,
  start_date: '',
  end_date: '',
  initial_capital: 1_000_000,
  commission_rate: 0.0005,
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function BacktestSection({ data, onSave, isSaving }: BacktestSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BacktestConfigInput>({
    resolver: zodResolver(BacktestConfigSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* 서버 데이터로 폼 초기화 (방어적 병합) */
  useEffect(() => {
    if (data) {
      reset({ ...DEFAULT_VALUES, ...data })
    }
  }, [data, reset])

  /* 저장 핸들러 */
  const onSubmit = (values: BacktestConfigInput) => {
    onSave({ backtest: values })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>백테스팅 설정</CardTitle>
        <CardDescription>
          전략 백테스트에 사용할 기간, 자본금, 수수료 등을 설정합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="backtest-form"
          onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
            console.error('Backtest form validation errors:', fieldErrors)
            const firstError = Object.values(fieldErrors).find((e) => e?.message)
            toast.error(firstError?.message ?? '입력값을 확인해주세요')
          })}
          className="space-y-6"
        >
          {/* 백테스트 기간 */}
          <div className="space-y-2">
            <Label htmlFor="bt-period-days">백테스트 기간 (일)</Label>
            <Input
              id="bt-period-days"
              type="number"
              min={1}
              max={365}
              {...register('period_days', { valueAsNumber: true })}
            />
            {errors.period_days && (
              <p className="text-destructive text-xs">
                {errors.period_days.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              시작일을 비워두면 이 기간만큼 과거부터 백테스트합니다
            </p>
          </div>

          {/* 시작일 / 종료일 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bt-start-date">시작일</Label>
              <Input
                id="bt-start-date"
                type="date"
                {...register('start_date')}
              />
              {errors.start_date && (
                <p className="text-destructive text-xs">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-end-date">종료일</Label>
              <Input
                id="bt-end-date"
                type="date"
                {...register('end_date')}
              />
              {errors.end_date && (
                <p className="text-destructive text-xs">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* 초기 자본금 / 수수료율 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bt-initial-capital">초기 자본금 (KRW)</Label>
              <Input
                id="bt-initial-capital"
                type="number"
                min={5000}
                {...register('initial_capital', { valueAsNumber: true })}
              />
              {errors.initial_capital && (
                <p className="text-destructive text-xs">
                  {errors.initial_capital.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-commission-rate">수수료율</Label>
              <Input
                id="bt-commission-rate"
                type="number"
                step="0.0001"
                min={0}
                max={0.1}
                {...register('commission_rate', { valueAsNumber: true })}
              />
              {errors.commission_rate && (
                <p className="text-destructive text-xs">
                  {errors.commission_rate.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                0 ~ 0.1 (0% ~ 10%)
              </p>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="backtest-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
