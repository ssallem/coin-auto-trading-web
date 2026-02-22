'use client'

/**
 * 거래 설정 섹션
 *
 * - markets: 콤마 구분 텍스트 입력 -> 저장 시 배열 변환
 * - poll_interval: 숫자 입력 (10~3600초)
 * - timeframe: Select 드롭다운
 * - candle_count: 숫자 입력 (10~500)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import type { BotConfig, TradingSettings } from '@/types/trading'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface TradingSectionProps {
  data: TradingSettings | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 폼 전용 스키마 (markets를 문자열로 입력받음)
// ─────────────────────────────────────────────

const TradingFormSchema = z.object({
  /** 콤마 구분 마켓 문자열 (폼 입력용) */
  markets_str: z
    .string()
    .min(1, '최소 1개 이상의 마켓을 입력해야 합니다')
    .refine(
      (val) =>
        val
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
          .every((m) => /^KRW-/.test(m)),
      '모든 마켓 코드는 KRW- 접두사가 필요합니다 (예: KRW-BTC)',
    ),

  /** 폴링 간격 (초, 10~3600) */
  poll_interval: z
    .number({ message: '숫자를 입력해주세요' })
    .int('폴링 간격은 정수여야 합니다')
    .min(10, '폴링 간격은 최소 10초 이상이어야 합니다')
    .max(3600, '폴링 간격은 최대 3600초 이하여야 합니다'),

  /** 분석 타임프레임 (Python 업비트 API 포맷) */
  timeframe: z.enum([
    'minute1', 'minute3', 'minute5', 'minute10', 'minute15',
    'minute30', 'minute60', 'minute240', 'day', 'week', 'month',
  ], {
    message: '유효한 타임프레임을 선택해주세요',
  }),

  /** 캔들 조회 수 (10~500) */
  candle_count: z
    .number({ message: '숫자를 입력해주세요' })
    .int('캔들 수는 정수여야 합니다')
    .min(10, '캔들 수는 최소 10 이상이어야 합니다')
    .max(500, '캔들 수는 최대 500 이하여야 합니다'),
})

type TradingFormValues = z.infer<typeof TradingFormSchema>

// ─────────────────────────────────────────────
// 타임프레임 옵션
// ─────────────────────────────────────────────

const TIMEFRAME_OPTIONS = [
  { value: 'minute1', label: '1분' },
  { value: 'minute3', label: '3분' },
  { value: 'minute5', label: '5분' },
  { value: 'minute10', label: '10분' },
  { value: 'minute15', label: '15분' },
  { value: 'minute30', label: '30분' },
  { value: 'minute60', label: '1시간' },
  { value: 'minute240', label: '4시간' },
  { value: 'day', label: '일봉' },
  { value: 'week', label: '주봉' },
  { value: 'month', label: '월봉' },
] as const

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function TradingSection({ data, onSave, isSaving }: TradingSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TradingFormValues>({
    resolver: zodResolver(TradingFormSchema),
    defaultValues: {
      markets_str: '',
      poll_interval: 60,
      timeframe: 'minute60',
      candle_count: 200,
    },
  })

  /* 서버 데이터로 폼 초기화 */
  useEffect(() => {
    if (data) {
      reset({
        markets_str: data.markets.join(','),
        poll_interval: data.poll_interval,
        timeframe: data.timeframe as TradingFormValues['timeframe'],
        candle_count: data.candle_count,
      })
    }
  }, [data, reset])

  /* 폼 제출 핸들러 */
  const onSubmit = (values: TradingFormValues) => {
    /* 콤마 구분 문자열을 배열로 변환 (공백 제거, 빈 값 필터) */
    const markets = values.markets_str
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)

    onSave({
      trading: {
        markets,
        poll_interval: values.poll_interval,
        timeframe: values.timeframe,
        candle_count: values.candle_count,
      },
    })
  }

  const currentTimeframe = watch('timeframe')

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 설정</CardTitle>
        <CardDescription>
          감시 대상 마켓, 폴링 간격, 분석 타임프레임 등 기본 거래 설정을 구성합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="trading-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* 마켓 목록 */}
          <div className="space-y-2">
            <Label htmlFor="trading-markets">감시 대상 마켓</Label>
            <Input
              id="trading-markets"
              placeholder="KRW-BTC,KRW-ETH,KRW-XRP"
              {...register('markets_str')}
            />
            {errors.markets_str && (
              <p className="text-destructive text-xs">
                {errors.markets_str.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              콤마(,)로 구분하여 입력하세요. 예: KRW-BTC,KRW-ETH
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* 폴링 간격 */}
            <div className="space-y-2">
              <Label htmlFor="trading-poll-interval">폴링 간격 (초)</Label>
              <Input
                id="trading-poll-interval"
                type="number"
                min={10}
                max={3600}
                {...register('poll_interval', { valueAsNumber: true })}
              />
              {errors.poll_interval && (
                <p className="text-destructive text-xs">
                  {errors.poll_interval.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                10초 ~ 3,600초 (1시간)
              </p>
            </div>

            {/* 타임프레임 */}
            <div className="space-y-2">
              <Label htmlFor="trading-timeframe">분석 타임프레임</Label>
              <Select
                value={currentTimeframe}
                onValueChange={(v) =>
                  setValue('timeframe', v as TradingFormValues['timeframe'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="trading-timeframe" className="w-full">
                  <SelectValue placeholder="타임프레임 선택" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timeframe && (
                <p className="text-destructive text-xs">
                  {errors.timeframe.message}
                </p>
              )}
            </div>

            {/* 캔들 조회 수 */}
            <div className="space-y-2">
              <Label htmlFor="trading-candle-count">캔들 조회 수</Label>
              <Input
                id="trading-candle-count"
                type="number"
                min={10}
                max={500}
                {...register('candle_count', { valueAsNumber: true })}
              />
              {errors.candle_count && (
                <p className="text-destructive text-xs">
                  {errors.candle_count.message}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                10 ~ 500개
              </p>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="trading-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
