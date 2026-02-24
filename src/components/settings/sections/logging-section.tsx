'use client'

/**
 * 로깅 설정 섹션
 *
 * - 로그 레벨 (Select 드롭다운)
 * - 로그 파일 경로
 * - 최대 크기 (MB), 백업 파일 수
 * - react-hook-form + zodResolver(LoggingConfigSchema)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  LoggingConfigSchema,
  type LoggingConfigInput,
} from '@/lib/validations/config.schema'
import { toast } from 'sonner'
import type { BotConfig, LoggingConfig } from '@/types/trading'
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

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface LoggingSectionProps {
  data: LoggingConfig | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

const LOG_LEVELS = [
  { value: 'DEBUG', label: 'DEBUG' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARNING', label: 'WARNING' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'CRITICAL', label: 'CRITICAL' },
] as const

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_VALUES: LoggingConfigInput = {
  level: 'INFO',
  file: 'logs/trading.log',
  max_size_mb: 10,
  backup_count: 5,
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function LoggingSection({ data, onSave, isSaving }: LoggingSectionProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoggingConfigInput>({
    resolver: zodResolver(LoggingConfigSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* 서버 데이터로 폼 초기화 (방어적 병합) */
  useEffect(() => {
    if (data) {
      reset({ ...DEFAULT_VALUES, ...data })
    }
  }, [data, reset])

  /* 현재 로그 레벨 */
  const currentLevel = watch('level')

  /* 저장 핸들러 */
  const onSubmit = (values: LoggingConfigInput) => {
    onSave({ logging: values })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>로깅 설정</CardTitle>
        <CardDescription>
          로그 레벨, 파일 경로, 파일 크기 등 로깅 관련 설정을 구성합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="logging-form"
          onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
            console.error('Logging form validation errors:', fieldErrors)
            const firstError = Object.values(fieldErrors).find((e) => e?.message)
            toast.error(firstError?.message ?? '입력값을 확인해주세요')
          })}
          className="space-y-6"
        >
          {/* 로그 레벨 */}
          <div className="space-y-2">
            <Label htmlFor="log-level">로그 레벨</Label>
            <Select
              value={currentLevel}
              onValueChange={(value) =>
                setValue('level', value as LoggingConfigInput['level'], {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="log-level" className="w-full sm:w-48">
                <SelectValue placeholder="로그 레벨 선택" />
              </SelectTrigger>
              <SelectContent>
                {LOG_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="text-destructive text-xs">
                {errors.level.message}
              </p>
            )}
          </div>

          {/* 로그 파일 경로 */}
          <div className="space-y-2">
            <Label htmlFor="log-file">로그 파일 경로</Label>
            <Input
              id="log-file"
              placeholder="logs/trading.log"
              {...register('file')}
            />
            {errors.file && (
              <p className="text-destructive text-xs">
                {errors.file.message}
              </p>
            )}
          </div>

          {/* 최대 크기 / 백업 파일 수 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="log-max-size">로그 파일 최대 크기 (MB)</Label>
              <Input
                id="log-max-size"
                type="number"
                min={1}
                max={1000}
                {...register('max_size_mb', { valueAsNumber: true })}
              />
              {errors.max_size_mb && (
                <p className="text-destructive text-xs">
                  {errors.max_size_mb.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-backup-count">백업 파일 수</Label>
              <Input
                id="log-backup-count"
                type="number"
                min={0}
                max={100}
                {...register('backup_count', { valueAsNumber: true })}
              />
              {errors.backup_count && (
                <p className="text-destructive text-xs">
                  {errors.backup_count.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="logging-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
