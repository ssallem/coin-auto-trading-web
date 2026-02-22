'use client'

/**
 * 주문 폼 컴포넌트
 *
 * react-hook-form + zodResolver(OrderSchema) 기반 주문 폼.
 * - Tabs: 매수(bid) / 매도(ask) 전환
 * - 주문 유형: 시장가 / 지정가
 * - 시장가 매수: 금액(KRW) + 잔고 비율 버튼
 * - 시장가 매도: 수량 + 보유량 비율 버튼
 * - 지정가: 가격 + 수량
 * - 최소 주문 5,000 KRW 검증
 * - ConfirmDialog 확인 후 useCreateOrder() mutation
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { OrderSchema, type OrderInput } from '@/lib/validations/order.schema'
import { useCreateOrder } from '@/hooks/use-orders'
import { useAccounts } from '@/hooks/use-accounts'
import { useUIStore } from '@/stores/ui-store'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { UpbitTicker } from '@/types/upbit'

/** 잔고 비율 버튼 옵션 */
const RATIO_BUTTONS = [
  { label: '10%', value: 0.1 },
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1.0 },
]

/** KRW 금액 포맷 */
function formatKRW(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(value))
}

interface OrderFormProps {
  /** 선택된 마켓 코드 (예: "KRW-BTC") */
  market: string
  /** 현재가 데이터 (없으면 null) */
  ticker: UpbitTicker | null
}

export function OrderForm({ market, ticker }: OrderFormProps) {
  const { activeOrderSide, setActiveOrderSide } = useUIStore()
  const createOrder = useCreateOrder()
  const { data: accounts } = useAccounts()

  /* 주문 유형 상태: 시장가(market) / 지정가(limit) */
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  /* 확인 다이얼로그 상태 */
  const [confirmOpen, setConfirmOpen] = useState(false)
  /* 검증된 주문 데이터 저장 (다이얼로그 확인 시 stale 값 방지) */
  const validatedOrderRef = useRef<OrderInput | null>(null)

  /* KRW 잔고 */
  const krwBalance = useMemo(() => {
    const krwAccount = accounts?.find((a) => a.currency === 'KRW')
    return krwAccount ? parseFloat(krwAccount.balance) : 0
  }, [accounts])

  /* 코인 잔고 (선택된 마켓의 코인) */
  const coinCurrency = market.replace('KRW-', '')
  const coinBalance = useMemo(() => {
    const coinAccount = accounts?.find((a) => a.currency === coinCurrency)
    return coinAccount ? parseFloat(coinAccount.balance) : 0
  }, [accounts, coinCurrency])

  /* ord_type 결정: 매수 시장가 → 'price', 매도 시장가 → 'market', 지정가 → 'limit' */
  const getOrdType = useCallback(
    (side: 'bid' | 'ask'): 'price' | 'market' | 'limit' => {
      if (orderType === 'limit') return 'limit'
      return side === 'bid' ? 'price' : 'market'
    },
    [orderType]
  )

  /* react-hook-form 설정 */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<OrderInput>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      market,
      side: activeOrderSide,
      ord_type: getOrdType(activeOrderSide),
      price: '',
      volume: '',
    },
  })

  const watchPrice = watch('price')
  const watchVolume = watch('volume')

  /* 탭 변경 시 side 및 ord_type 갱신 */
  const handleSideChange = useCallback(
    (side: string) => {
      const s = side as 'bid' | 'ask'
      setActiveOrderSide(s)
      setValue('side', s)
      setValue('ord_type', getOrdType(s))
      /* 시장가 전환 시 불필요한 필드 초기화 */
      setValue('price', '')
      setValue('volume', '')
    },
    [setActiveOrderSide, setValue, getOrdType]
  )

  /* 주문 유형 변경 */
  const handleOrderTypeChange = useCallback(
    (type: string) => {
      const t = type as 'market' | 'limit'
      setOrderType(t)
      const ordType =
        t === 'limit' ? 'limit' : activeOrderSide === 'bid' ? 'price' : 'market'
      setValue('ord_type', ordType)
      setValue('price', '')
      setValue('volume', '')
    },
    [activeOrderSide, setValue]
  )

  /* 잔고 비율 버튼 클릭 */
  const handleRatio = useCallback(
    (ratio: number) => {
      if (activeOrderSide === 'bid' && orderType === 'market') {
        /* 시장가 매수: KRW 잔고 비율 → price 필드 */
        const amount = Math.floor(krwBalance * ratio)
        setValue('price', String(amount), { shouldValidate: true })
      } else if (activeOrderSide === 'ask' && orderType === 'market') {
        /* 시장가 매도: 코인 보유량 비율 → volume 필드 */
        const vol = coinBalance * ratio
        setValue('volume', String(vol), { shouldValidate: true })
      } else if (orderType === 'limit' && activeOrderSide === 'bid') {
        /* 지정가 매수: KRW 잔고 비율 → price로 수량 계산 */
        const priceVal = parseFloat(watchPrice || '0')
        if (priceVal > 0) {
          const amount = Math.floor(krwBalance * ratio)
          const vol = amount / priceVal
          setValue('volume', String(vol), { shouldValidate: true })
        }
      } else if (orderType === 'limit' && activeOrderSide === 'ask') {
        /* 지정가 매도: 코인 보유량 비율 → volume 필드 */
        const vol = coinBalance * ratio
        setValue('volume', String(vol), { shouldValidate: true })
      }
    },
    [activeOrderSide, orderType, krwBalance, coinBalance, setValue, watchPrice]
  )

  /* 예상 주문 금액 계산 */
  const estimatedAmount = useMemo(() => {
    if (activeOrderSide === 'bid' && orderType === 'market') {
      /* 시장가 매수: price 값이 곧 주문 금액 */
      return parseFloat(watchPrice || '0')
    }
    if (activeOrderSide === 'ask' && orderType === 'market' && ticker) {
      /* 시장가 매도: volume * 현재가 */
      return parseFloat(watchVolume || '0') * ticker.trade_price
    }
    if (orderType === 'limit') {
      /* 지정가: price * volume */
      return parseFloat(watchPrice || '0') * parseFloat(watchVolume || '0')
    }
    return 0
  }, [activeOrderSide, orderType, watchPrice, watchVolume, ticker])

  /* 폼 제출 전 마켓 코드 세팅 후 확인 다이얼로그 오픈 (검증된 데이터를 ref에 저장) */
  const onSubmit = handleSubmit((validatedData) => {
    validatedOrderRef.current = {
      ...validatedData,
      market,
      side: activeOrderSide,
      ord_type: getOrdType(activeOrderSide),
    }
    setConfirmOpen(true)
  })

  /* 확인 다이얼로그에서 실제 주문 생성 (ref에 저장된 검증 데이터 사용) */
  const handleConfirmOrder = useCallback(() => {
    const data = validatedOrderRef.current
    if (!data) return

    createOrder.mutate(
      {
        market: data.market,
        side: data.side,
        ord_type: data.ord_type,
        price: data.price,
        volume: data.volume,
      },
      {
        onSuccess: () => {
          validatedOrderRef.current = null
          reset({
            market,
            side: activeOrderSide,
            ord_type: getOrdType(activeOrderSide),
            price: '',
            volume: '',
          })
        },
      }
    )
  }, [market, activeOrderSide, getOrdType, createOrder, reset])

  /* 확인 다이얼로그 설명 텍스트 */
  const confirmDescription = useMemo(() => {
    const sideText = activeOrderSide === 'bid' ? '매수' : '매도'
    const typeText = orderType === 'market' ? '시장가' : '지정가'
    const amountText = estimatedAmount > 0 ? ` (약 ${formatKRW(estimatedAmount)} KRW)` : ''
    return `${market} ${typeText} ${sideText} 주문을 실행합니다.${amountText}`
  }, [activeOrderSide, orderType, market, estimatedAmount])

  /* 매수/매도 테마 색상 */
  const isBid = activeOrderSide === 'bid'
  const themeClass = isBid
    ? 'border-red-500/30 bg-red-500/5'
    : 'border-blue-500/30 bg-blue-500/5'
  const buttonClass = isBid
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-blue-500 hover:bg-blue-600 text-white'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>주문</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 매수/매도 탭 */}
          <Tabs value={activeOrderSide} onValueChange={handleSideChange}>
            <TabsList className="w-full">
              <TabsTrigger
                value="bid"
                className="flex-1 data-[state=active]:text-red-500"
              >
                매수
              </TabsTrigger>
              <TabsTrigger
                value="ask"
                className="flex-1 data-[state=active]:text-blue-500"
              >
                매도
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bid">
              <OrderFormFields
                side="bid"
                orderType={orderType}
                onOrderTypeChange={handleOrderTypeChange}
                onRatio={handleRatio}
                register={register}
                errors={errors}
                balance={krwBalance}
                balanceLabel={`잔고: ${formatKRW(krwBalance)} KRW`}
                estimatedAmount={estimatedAmount}
                themeClass={themeClass}
                buttonClass={buttonClass}
                onSubmit={onSubmit}
                isLoading={createOrder.isPending}
                ticker={ticker}
                watchPrice={watchPrice}
                watchVolume={watchVolume}
              />
            </TabsContent>

            <TabsContent value="ask">
              <OrderFormFields
                side="ask"
                orderType={orderType}
                onOrderTypeChange={handleOrderTypeChange}
                onRatio={handleRatio}
                register={register}
                errors={errors}
                balance={coinBalance}
                balanceLabel={`보유: ${coinBalance.toFixed(8)} ${coinCurrency}`}
                estimatedAmount={estimatedAmount}
                themeClass={themeClass}
                buttonClass={buttonClass}
                onSubmit={onSubmit}
                isLoading={createOrder.isPending}
                ticker={ticker}
                watchPrice={watchPrice}
                watchVolume={watchVolume}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 주문 확인 다이얼로그 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`${activeOrderSide === 'bid' ? '매수' : '매도'} 주문 확인`}
        description={confirmDescription}
        onConfirm={handleConfirmOrder}
        confirmText="주문 실행"
        variant={activeOrderSide === 'bid' ? 'default' : 'destructive'}
      />
    </>
  )
}

// ─────────────────────────────────────────────
// 주문 폼 내부 필드 컴포넌트
// ─────────────────────────────────────────────

interface OrderFormFieldsProps {
  side: 'bid' | 'ask'
  orderType: 'market' | 'limit'
  onOrderTypeChange: (type: string) => void
  onRatio: (ratio: number) => void
  register: ReturnType<typeof useForm<OrderInput>>['register']
  errors: ReturnType<typeof useForm<OrderInput>>['formState']['errors']
  balance: number
  balanceLabel: string
  estimatedAmount: number
  themeClass: string
  buttonClass: string
  onSubmit: () => void
  isLoading: boolean
  ticker: UpbitTicker | null
  watchPrice: string | undefined
  watchVolume: string | undefined
}

function OrderFormFields({
  side,
  orderType,
  onOrderTypeChange,
  onRatio,
  register,
  errors,
  balance: _balance,
  balanceLabel,
  estimatedAmount,
  themeClass,
  buttonClass,
  onSubmit,
  isLoading,
  ticker,
  watchPrice,
  watchVolume,
}: OrderFormFieldsProps) {
  const isBid = side === 'bid'
  const isMarket = orderType === 'market'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className={`mt-4 space-y-4 rounded-lg border p-4 ${themeClass}`}
    >
      {/* 잔고 표시 */}
      <div className="text-muted-foreground text-sm">{balanceLabel}</div>

      {/* 주문 유형 선택 */}
      <div className="space-y-2">
        <Label>주문 유형</Label>
        <Select value={orderType} onValueChange={onOrderTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="market">시장가</SelectItem>
            <SelectItem value="limit">지정가</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 지정가: 가격 입력 */}
      {!isMarket && (
        <div className="space-y-2">
          <Label htmlFor="price">가격 (KRW)</Label>
          <Input
            id="price"
            type="number"
            placeholder={ticker ? String(ticker.trade_price) : '가격 입력'}
            {...register('price')}
          />
          {errors.price && (
            <p className="text-destructive text-xs">{errors.price.message}</p>
          )}
        </div>
      )}

      {/* 시장가 매수: 금액 입력 */}
      {isMarket && isBid && (
        <div className="space-y-2">
          <Label htmlFor="price">주문 금액 (KRW)</Label>
          <Input
            id="price"
            type="number"
            placeholder="최소 5,000 KRW"
            {...register('price')}
          />
          {errors.price && (
            <p className="text-destructive text-xs">{errors.price.message}</p>
          )}
          <p className="text-muted-foreground text-xs">
            최소 주문 금액: 5,000 KRW
          </p>
        </div>
      )}

      {/* 시장가 매도 또는 지정가: 수량 입력 */}
      {(isMarket && !isBid) || !isMarket ? (
        <div className="space-y-2">
          <Label htmlFor="volume">
            {isMarket && !isBid ? '매도 수량' : '수량'}
          </Label>
          <Input
            id="volume"
            type="number"
            step="any"
            placeholder="수량 입력"
            {...register('volume')}
          />
          {errors.volume && (
            <p className="text-destructive text-xs">{errors.volume.message}</p>
          )}
        </div>
      ) : null}

      {/* 비율 버튼 */}
      <div className="flex gap-2">
        {RATIO_BUTTONS.map((btn) => (
          <Button
            key={btn.label}
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onRatio(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* 예상 주문 금액 */}
      {estimatedAmount > 0 && (
        <div className="bg-muted/50 flex items-center justify-between rounded-md p-3">
          <span className="text-muted-foreground text-sm">예상 주문 금액</span>
          <span className="font-semibold tabular-nums">
            {formatKRW(estimatedAmount)} KRW
          </span>
        </div>
      )}

      {/* 주문 실행 버튼 */}
      <Button
        type="submit"
        className={`w-full ${buttonClass}`}
        disabled={isLoading}
      >
        {isLoading
          ? '주문 처리중...'
          : `${isBid ? '매수' : '매도'} ${orderType === 'market' ? '시장가' : '지정가'}`}
      </Button>

      {/* 숨겨진 필드 */}
      <input type="hidden" {...register('market')} />
      <input type="hidden" {...register('side')} />
      <input type="hidden" {...register('ord_type')} />
    </form>
  )
}
