'use client'

/**
 * 알림 설정 섹션
 *
 * - 알림 활성화 (Switch)
 * - 알림 채널 (Select: telegram / slack) - enabled일 때만 표시
 * - 알림 이벤트 (Checkbox 그룹) - enabled일 때만 표시
 * - react-hook-form + zodResolver(NotificationConfigSchema)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  NotificationConfigSchema,
  type NotificationConfigInput,
} from '@/lib/validations/config.schema'
import { toast } from 'sonner'
import type { BotConfig, NotificationConfig } from '@/types/trading'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface NotificationSectionProps {
  data: NotificationConfig | undefined
  onSave: (patch: Partial<BotConfig>) => void
  isSaving: boolean
}

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

/** 알림 이벤트 목록 (value + 한글 라벨) */
const NOTIFICATION_EVENTS = [
  { value: 'order_executed', label: '주문 체결' },
  { value: 'stop_loss_triggered', label: '손절 발동' },
  { value: 'take_profit_triggered', label: '익절 발동' },
  { value: 'daily_report', label: '일일 리포트' },
  { value: 'error', label: '오류 발생' },
] as const

// ─────────────────────────────────────────────
// 기본값
// ─────────────────────────────────────────────

const DEFAULT_VALUES: NotificationConfigInput = {
  enabled: false,
  channel: 'telegram',
  events: [],
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

export function NotificationSection({
  data,
  onSave,
  isSaving,
}: NotificationSectionProps) {
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NotificationConfigInput>({
    resolver: zodResolver(NotificationConfigSchema),
    defaultValues: DEFAULT_VALUES,
  })

  /* 서버 데이터로 폼 초기화 (방어적 병합) */
  useEffect(() => {
    if (data) {
      reset({ ...DEFAULT_VALUES, ...data })
    }
  }, [data, reset])

  /* 감시 값 */
  const enabled = watch('enabled')
  const channel = watch('channel')
  const events = watch('events')

  /* 이벤트 체크박스 토글 핸들러 */
  const handleEventToggle = (eventValue: string, checked: boolean) => {
    const current = events ?? []
    const updated = checked
      ? [...current, eventValue]
      : current.filter((e) => e !== eventValue)
    setValue('events', updated, { shouldValidate: true, shouldDirty: true })
  }

  /* 저장 핸들러 */
  const onSubmit = (values: NotificationConfigInput) => {
    onSave({ notification: values })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>알림 설정</CardTitle>
        <CardDescription>
          거래 이벤트 알림 채널과 수신할 이벤트를 설정합니다.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="notification-form"
          onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
            console.error('Notification form validation errors:', fieldErrors)
            const firstError = Object.values(fieldErrors).find((e) => e?.message)
            toast.error(firstError?.message ?? '입력값을 확인해주세요')
          })}
          className="space-y-6"
        >
          {/* 알림 활성화 */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">알림 활성화</Label>
              <p className="text-muted-foreground mt-1 text-xs">
                거래 이벤트 발생 시 알림을 받습니다
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(checked) =>
                setValue('enabled', checked, { shouldValidate: true, shouldDirty: true })
              }
            />
          </div>

          {enabled && (
            <>
              <Separator />

              {/* 알림 채널 */}
              <div className="space-y-2">
                <Label htmlFor="noti-channel">알림 채널</Label>
                <Select
                  value={channel}
                  onValueChange={(value) =>
                    setValue(
                      'channel',
                      value as NotificationConfigInput['channel'],
                      { shouldValidate: true, shouldDirty: true }
                    )
                  }
                >
                  <SelectTrigger id="noti-channel" className="w-full sm:w-48">
                    <SelectValue placeholder="알림 채널 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                  </SelectContent>
                </Select>
                {errors.channel && (
                  <p className="text-destructive text-xs">
                    {errors.channel.message}
                  </p>
                )}
              </div>

              <Separator />

              {/* 알림 이벤트 */}
              <div className="space-y-3">
                <Label className="text-base">알림 이벤트</Label>
                <p className="text-muted-foreground text-xs">
                  알림을 받을 이벤트를 선택하세요
                </p>
                <div className="space-y-3 pt-1">
                  {NOTIFICATION_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`noti-event-${event.value}`}
                        checked={events?.includes(event.value) ?? false}
                        onCheckedChange={(checked) =>
                          handleEventToggle(event.value, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`noti-event-${event.value}`}
                        className="cursor-pointer font-normal"
                      >
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.events && (
                  <p className="text-destructive text-xs">
                    {errors.events.message}
                  </p>
                )}
              </div>
            </>
          )}
        </form>
      </CardContent>

      <CardFooter className="justify-end">
        <Button
          type="submit"
          form="notification-form"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </CardFooter>
    </Card>
  )
}
