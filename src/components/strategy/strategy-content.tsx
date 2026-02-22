'use client'

/**
 * 전략 설정 컴포넌트
 *
 * - GET /api/strategy/config로 현재 설정 조회 (TanStack Query)
 * - Tabs로 전략 선택: RSI / MA Cross / Bollinger
 * - 각 전략별 파라미터 폼
 * - 리스크 관리 설정 섹션
 * - react-hook-form + zodResolver 사용
 * - 저장 성공 시 toast.success
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import {
  StrategyConfigSchema,
  type StrategyConfigInput,
} from '@/lib/validations/strategy.schema'
import {
  RiskConfigSchema,
  type RiskConfigInput,
} from '@/lib/validations/strategy.schema'
import { queryKeys, QUERY_CONFIG } from '@/lib/query-keys'
import type { StrategyConfig, RiskConfig } from '@/types/trading'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CardSkeleton } from '@/components/common/loading-skeleton'

// ─────────────────────────────────────────────
// API 호출 함수
// ─────────────────────────────────────────────

/** 전략 설정 조회 (strategy + risk 통합 응답) */
async function fetchStrategyConfig(): Promise<{
  strategy: StrategyConfig
  risk: RiskConfig
}> {
  const { data } = await axios.get('/api/strategy/config')
  /* API가 StrategyConfig만 반환할 수 있으므로 안전하게 분리 */
  if (data.strategy && data.risk) {
    return data as { strategy: StrategyConfig; risk: RiskConfig }
  }
  /* 단일 StrategyConfig 응답인 경우 기본 리스크 설정 사용 */
  return {
    strategy: data as StrategyConfig,
    risk: DEFAULT_RISK,
  }
}

/** 전략 설정 저장 (strategy + risk 통합 전송) */
async function saveStrategyConfig(payload: {
  strategy: StrategyConfig
  risk: RiskConfig
}): Promise<void> {
  await axios.post('/api/strategy/config', payload)
}

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_STRATEGY: StrategyConfigInput = {
  active: 'rsi',
  rsi: { period: 14, oversold: 30, overbought: 70 },
  ma_cross: { short_period: 5, long_period: 20, ma_type: 'SMA' as const },
  bollinger: { period: 20, std_dev: 2.0 },
}

const DEFAULT_RISK: RiskConfig = {
  stop_loss_pct: 3,
  take_profit_pct: 5,
  trailing_stop: { enabled: false, pct: 2 },
  max_daily_loss: 100_000,
  max_positions: 5,
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export function StrategyContent() {
  const queryClient = useQueryClient()

  /* 현재 전략 설정 조회 */
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.strategyConfig(),
    queryFn: fetchStrategyConfig,
    staleTime: QUERY_CONFIG.strategyConfig.staleTime,
  })

  /* 전략 설정 폼 */
  const strategyForm = useForm<StrategyConfigInput>({
    resolver: zodResolver(StrategyConfigSchema),
    defaultValues: DEFAULT_STRATEGY,
  })

  /* 리스크 설정 폼 */
  const riskForm = useForm<RiskConfigInput>({
    resolver: zodResolver(RiskConfigSchema),
    defaultValues: DEFAULT_RISK,
  })

  /* 서버 데이터로 폼 초기화 */
  useEffect(() => {
    if (data) {
      strategyForm.reset(data.strategy)
      riskForm.reset(data.risk)
    }
  }, [data, strategyForm, riskForm])

  /* 저장 mutation */
  const saveMutation = useMutation({
    mutationFn: saveStrategyConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.strategyConfig() })
      toast.success('설정이 저장되었습니다')
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : '설정 저장에 실패했습니다'
      toast.error(message)
    },
  })

  /* 전체 저장 핸들러 */
  const handleSave = async () => {
    /* 두 폼 모두 검증 */
    const strategyValid = await strategyForm.trigger()
    const riskValid = await riskForm.trigger()

    if (!strategyValid || !riskValid) {
      toast.error('입력 값을 확인해주세요')
      return
    }

    const strategyValues = strategyForm.getValues()
    const riskValues = riskForm.getValues()

    saveMutation.mutate({
      strategy: strategyValues as StrategyConfig,
      risk: riskValues as RiskConfig,
    })
  }

  /* 활성 전략 탭 */
  const activeStrategy = strategyForm.watch('active')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── 전략 설정 섹션 ── */}
      <Card>
        <CardHeader>
          <CardTitle>전략 설정</CardTitle>
          <CardDescription>
            자동매매에 사용할 기술적 지표 전략을 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeStrategy}
            onValueChange={(v) =>
              strategyForm.setValue('active', v as StrategyConfigInput['active'], {
                shouldValidate: true,
              })
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="rsi" className="flex-1">
                RSI
              </TabsTrigger>
              <TabsTrigger value="ma_cross" className="flex-1">
                MA Cross
              </TabsTrigger>
              <TabsTrigger value="bollinger" className="flex-1">
                Bollinger
              </TabsTrigger>
            </TabsList>

            {/* RSI 파라미터 */}
            <TabsContent value="rsi">
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rsi-period">RSI 기간</Label>
                  <Input
                    id="rsi-period"
                    type="number"
                    {...strategyForm.register('rsi.period', { valueAsNumber: true })}
                  />
                  {strategyForm.formState.errors.rsi?.period && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.rsi.period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsi-oversold">과매도 기준 (매수 시그널)</Label>
                  <Input
                    id="rsi-oversold"
                    type="number"
                    {...strategyForm.register('rsi.oversold', {
                      valueAsNumber: true,
                    })}
                  />
                  {strategyForm.formState.errors.rsi?.oversold && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.rsi.oversold.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsi-overbought">과매수 기준 (매도 시그널)</Label>
                  <Input
                    id="rsi-overbought"
                    type="number"
                    {...strategyForm.register('rsi.overbought', {
                      valueAsNumber: true,
                    })}
                  />
                  {strategyForm.formState.errors.rsi?.overbought && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.rsi.overbought.message}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* MA Cross 파라미터 */}
            <TabsContent value="ma_cross">
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ma-short">단기 이평 기간</Label>
                  <Input
                    id="ma-short"
                    type="number"
                    {...strategyForm.register('ma_cross.short_period', {
                      valueAsNumber: true,
                    })}
                  />
                  {strategyForm.formState.errors.ma_cross?.short_period && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.ma_cross.short_period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ma-long">장기 이평 기간</Label>
                  <Input
                    id="ma-long"
                    type="number"
                    {...strategyForm.register('ma_cross.long_period', {
                      valueAsNumber: true,
                    })}
                  />
                  {strategyForm.formState.errors.ma_cross?.long_period && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.ma_cross.long_period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ma-type">이동평균 유형</Label>
                  <select
                    id="ma-type"
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
                    value={strategyForm.watch('ma_cross.ma_type')}
                    onChange={(e) =>
                      strategyForm.setValue(
                        'ma_cross.ma_type',
                        e.target.value as 'SMA' | 'EMA',
                        { shouldValidate: true }
                      )
                    }
                  >
                    <option value="SMA">SMA (단순이동평균)</option>
                    <option value="EMA">EMA (지수이동평균)</option>
                  </select>
                  {strategyForm.formState.errors.ma_cross?.ma_type && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.ma_cross.ma_type.message}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Bollinger 파라미터 */}
            <TabsContent value="bollinger">
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bb-period">볼린저 기간</Label>
                  <Input
                    id="bb-period"
                    type="number"
                    {...strategyForm.register('bollinger.period', {
                      valueAsNumber: true,
                    })}
                  />
                  {strategyForm.formState.errors.bollinger?.period && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.bollinger.period.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bb-stddev">표준편차 배수</Label>
                  <Input
                    id="bb-stddev"
                    type="number"
                    step="0.1"
                    {...strategyForm.register('bollinger.std_dev', {
                      valueAsNumber: true,
                    })}
                  />
                  {strategyForm.formState.errors.bollinger?.std_dev && (
                    <p className="text-destructive text-xs">
                      {strategyForm.formState.errors.bollinger.std_dev.message}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── 리스크 관리 설정 ── */}
      <Card>
        <CardHeader>
          <CardTitle>리스크 관리</CardTitle>
          <CardDescription>
            손절/익절, 투자 한도 등 리스크 관리 설정을 구성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 손절/익절 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stop-loss">손절 비율 (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                step="0.1"
                {...riskForm.register('stop_loss_pct', { valueAsNumber: true })}
              />
              {riskForm.formState.errors.stop_loss_pct && (
                <p className="text-destructive text-xs">
                  {riskForm.formState.errors.stop_loss_pct.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                매수가 대비 이 비율만큼 하락 시 자동 손절
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="take-profit">익절 비율 (%)</Label>
              <Input
                id="take-profit"
                type="number"
                step="0.1"
                {...riskForm.register('take_profit_pct', { valueAsNumber: true })}
              />
              {riskForm.formState.errors.take_profit_pct && (
                <p className="text-destructive text-xs">
                  {riskForm.formState.errors.take_profit_pct.message}
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
                <p className="text-muted-foreground text-xs mt-1">
                  최고가 대비 하락 시 자동 매도합니다
                </p>
              </div>
              <Switch
                checked={riskForm.watch('trailing_stop.enabled')}
                onCheckedChange={(checked) =>
                  riskForm.setValue('trailing_stop.enabled', checked, {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            {riskForm.watch('trailing_stop.enabled') && (
              <div className="max-w-xs space-y-2">
                <Label htmlFor="trailing-pct">트레일링 스탑 비율 (%)</Label>
                <Input
                  id="trailing-pct"
                  type="number"
                  step="0.1"
                  {...riskForm.register('trailing_stop.pct', {
                    valueAsNumber: true,
                  })}
                />
                {riskForm.formState.errors.trailing_stop?.pct && (
                  <p className="text-destructive text-xs">
                    {riskForm.formState.errors.trailing_stop.pct.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 투자 한도 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-daily-loss">일일 최대 손실 한도 (KRW)</Label>
              <Input
                id="max-daily-loss"
                type="number"
                {...riskForm.register('max_daily_loss', { valueAsNumber: true })}
              />
              {riskForm.formState.errors.max_daily_loss && (
                <p className="text-destructive text-xs">
                  {riskForm.formState.errors.max_daily_loss.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-positions">최대 동시 포지션 수</Label>
              <Input
                id="max-positions"
                type="number"
                {...riskForm.register('max_positions', { valueAsNumber: true })}
              />
              {riskForm.formState.errors.max_positions && (
                <p className="text-destructive text-xs">
                  {riskForm.formState.errors.max_positions.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 저장 버튼 ── */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  )
}
