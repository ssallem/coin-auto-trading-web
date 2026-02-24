'use client'

/**
 * 리스크 관리 설정 섹션
 *
 * - stop_loss_pct: 손절 비율 (%)
 * - take_profit_pct: 익절 비율 (%)
 * - trailing_stop: 트레일링 스탑 (enabled, pct)
 * - max_daily_loss: 일일 최대 손실 한도
 * - max_positions: 최대 동시 포지션 수
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  RiskConfigSchema,
  type RiskConfigInput,
} from '@/lib/validations/strategy.schema'
import { toast } from 'sonner'
import type { BotConfig, RiskConfig } from '@/types/trading'
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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface RiskSectionProps {
  data: RiskConfig | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_VALUES: RiskConfigInput = {
  stop_loss_pct: 3,
  take_profit_pct: 5,
  trailing_stop: { enabled: true, pct: 2.0 },
  max_daily_loss: 50_000,
  max_positions: 10,
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function RiskSection({ data, onSave, isSaving }: RiskSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RiskConfigInput>({
    resolver: zodResolver(RiskConfigSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* 서버 데이터로 폼 초기화 (방어적 병합) */
  useEffect(() => {
    if (data) {
      reset({
        ...DEFAULT_VALUES,
        ...data,
        trailing_stop: { ...DEFAULT_VALUES.trailing_stop, ...data.trailing_stop },
      })
    }
  }, [data, reset])

  /* 트레일링 스탑 활성화 상태 감시 */
  const trailingStopEnabled = watch('trailing_stop.enabled')

  /* 저장 핸들러 */
  const onSubmit = (values: RiskConfigInput) => {
    onSave({ risk: values as RiskConfig })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>리스크 관리</CardTitle>
        <CardDescription>
          손절/익절, 트레일링 스탑, 투자 한도 등 리스크 관리 설정을 구성합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="risk-form"
          onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
            console.error('Risk form validation errors:', fieldErrors)
            const firstError = Object.values(fieldErrors).find((e) => e?.message)
            toast.error(firstError?.message ?? '입력값을 확인해주세요')
          })}
          className="space-y-6"
        >
          {/* 손절 / 익절 비율 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="risk-stop-loss">손절 비율 (%)</Label>
              <Input
                id="risk-stop-loss"
                type="number"
                step="0.1"
                {...register('stop_loss_pct', { valueAsNumber: true })}
              />
              {errors.stop_loss_pct && (
                <p className="text-destructive text-xs">
                  {errors.stop_loss_pct.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                매수가 대비 이 비율만큼 하락 시 자동 손절
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-take-profit">익절 비율 (%)</Label>
              <Input
                id="risk-take-profit"
                type="number"
                step="0.1"
                {...register('take_profit_pct', { valueAsNumber: true })}
              />
              {errors.take_profit_pct && (
                <p className="text-destructive text-xs">
                  {errors.take_profit_pct.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                매수가 대비 이 비율만큼 상승 시 자동 익절
              </p>
            </div>
          </div>

          <Separator />

          {/* 트레일링 스탑 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">트레일링 스탑</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  최고가 대비 일정 비율 하락 시 자동 매도합니다
                </p>
              </div>
              <Switch
                checked={trailingStopEnabled}
                onCheckedChange={(checked) =>
                  setValue('trailing_stop.enabled', checked, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </div>
            {trailingStopEnabled && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="risk-trailing-pct">트레일링 스탑 비율 (%)</Label>
                <Input
                  id="risk-trailing-pct"
                  type="number"
                  step="0.1"
                  {...register('trailing_stop.pct', { valueAsNumber: true })}
                />
                {errors.trailing_stop?.pct && (
                  <p className="text-destructive text-xs">
                    {errors.trailing_stop.pct.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 투자 한도 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="risk-max-daily-loss">일일 최대 손실 한도 (KRW)</Label>
              <Input
                id="risk-max-daily-loss"
                type="number"
                {...register('max_daily_loss', { valueAsNumber: true })}
              />
              {errors.max_daily_loss && (
                <p className="text-destructive text-xs">
                  {errors.max_daily_loss.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-max-positions">최대 동시 포지션 수</Label>
              <Input
                id="risk-max-positions"
                type="number"
                {...register('max_positions', { valueAsNumber: true })}
              />
              {errors.max_positions && (
                <p className="text-destructive text-xs">
                  {errors.max_positions.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="risk-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
