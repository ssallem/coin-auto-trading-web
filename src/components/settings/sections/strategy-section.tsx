'use client'

/**
 * 전략 설정 섹션
 *
 * - active: 활성 전략 Select (rsi / ma_cross / bollinger)
 * - 활성 전략에 해당하는 파라미터만 표시
 *   - RSI: period, oversold, overbought
 *   - MA Cross: short_period, long_period, ma_type (SMA/EMA)
 *   - Bollinger: period, std_dev
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  StrategyConfigSchema,
  type StrategyConfigInput,
} from '@/lib/validations/strategy.schema'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BotConfig, StrategyConfig } from '@/types/trading'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface StrategySectionProps {
  data: StrategyConfig | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_VALUES: StrategyConfigInput = {
  active: 'rsi',
  rsi: { period: 14, oversold: 30, overbought: 70 },
  ma_cross: { short_period: 5, long_period: 20, ma_type: 'SMA' as const },
  bollinger: { period: 20, std_dev: 2.0 },
}

// ─────────────────────────────────────────────
// 전략 옵션
// ─────────────────────────────────────────────

const STRATEGY_OPTIONS = [
  { value: 'rsi', label: 'RSI (상대강도지수)' },
  { value: 'ma_cross', label: 'MA Cross (이동평균 교차)' },
  { value: 'bollinger', label: 'Bollinger (볼린저밴드)' },
] as const

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function StrategySection({
  data,
  onSave,
  isSaving,
}: StrategySectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StrategyConfigInput>({
    resolver: zodResolver(StrategyConfigSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* 서버 데이터로 폼 초기화 */
  useEffect(() => {
    if (data) {
      reset(data)
    }
  }, [data, reset])

  /* 폼 제출 핸들러 */
  const onSubmit = (values: StrategyConfigInput) => {
    onSave({ strategy: values as StrategyConfig })
  }

  /* 활성 전략 감시 */
  const activeStrategy = watch('active')
  const maType = watch('ma_cross.ma_type')

  return (
    <Card>
      <CardHeader>
        <CardTitle>전략 설정</CardTitle>
        <CardDescription>
          자동매매에 사용할 기술적 지표 전략과 파라미터를 설정합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="strategy-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* 활성 전략 선택 */}
          <div className="space-y-2">
            <Label htmlFor="strategy-active">활성 전략</Label>
            <Select
              value={activeStrategy}
              onValueChange={(v) =>
                setValue('active', v as StrategyConfigInput['active'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="strategy-active" className="w-full sm:w-64">
                <SelectValue placeholder="전략 선택" />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.active && (
              <p className="text-destructive text-xs">
                {errors.active.message}
              </p>
            )}
          </div>

          {/* ── RSI 파라미터 ── */}
          {activeStrategy === 'rsi' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">RSI 파라미터</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rsi-period">RSI 기간</Label>
                  <Input
                    id="rsi-period"
                    type="number"
                    {...register('rsi.period', { valueAsNumber: true })}
                  />
                  {errors.rsi?.period && (
                    <p className="text-destructive text-xs">
                      {errors.rsi.period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsi-oversold">과매도 기준 (매수 시그널)</Label>
                  <Input
                    id="rsi-oversold"
                    type="number"
                    {...register('rsi.oversold', { valueAsNumber: true })}
                  />
                  {errors.rsi?.oversold && (
                    <p className="text-destructive text-xs">
                      {errors.rsi.oversold.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsi-overbought">
                    과매수 기준 (매도 시그널)
                  </Label>
                  <Input
                    id="rsi-overbought"
                    type="number"
                    {...register('rsi.overbought', { valueAsNumber: true })}
                  />
                  {errors.rsi?.overbought && (
                    <p className="text-destructive text-xs">
                      {errors.rsi.overbought.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── MA Cross 파라미터 ── */}
          {activeStrategy === 'ma_cross' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">이동평균 교차 파라미터</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ma-short-period">단기 이평 기간</Label>
                  <Input
                    id="ma-short-period"
                    type="number"
                    {...register('ma_cross.short_period', {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.ma_cross?.short_period && (
                    <p className="text-destructive text-xs">
                      {errors.ma_cross.short_period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ma-long-period">장기 이평 기간</Label>
                  <Input
                    id="ma-long-period"
                    type="number"
                    {...register('ma_cross.long_period', {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.ma_cross?.long_period && (
                    <p className="text-destructive text-xs">
                      {errors.ma_cross.long_period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ma-type">이동평균 유형</Label>
                  <Select
                    value={maType}
                    onValueChange={(v) =>
                      setValue('ma_cross.ma_type', v as 'SMA' | 'EMA', {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="ma-type" className="w-full">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMA">SMA (단순이동평균)</SelectItem>
                      <SelectItem value="EMA">EMA (지수이동평균)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.ma_cross?.ma_type && (
                    <p className="text-destructive text-xs">
                      {errors.ma_cross.ma_type.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Bollinger 파라미터 ── */}
          {activeStrategy === 'bollinger' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">볼린저밴드 파라미터</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bb-period">볼린저 기간</Label>
                  <Input
                    id="bb-period"
                    type="number"
                    {...register('bollinger.period', { valueAsNumber: true })}
                  />
                  {errors.bollinger?.period && (
                    <p className="text-destructive text-xs">
                      {errors.bollinger.period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bb-std-dev">표준편차 배수</Label>
                  <Input
                    id="bb-std-dev"
                    type="number"
                    step="0.1"
                    {...register('bollinger.std_dev', { valueAsNumber: true })}
                  />
                  {errors.bollinger?.std_dev && (
                    <p className="text-destructive text-xs">
                      {errors.bollinger.std_dev.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="strategy-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
