/**
 * 주문 요청 Zod 검증 스키마
 *
 * Upbit 주문 규칙:
 * - 시장가 매수 (ord_type='price'): price 필수 (최소 5000 KRW), volume 없음
 * - 시장가 매도 (ord_type='market'): volume 필수 (양수), price 없음
 * - 지정가 (ord_type='limit'): price + volume 모두 필수
 * - market 코드: "KRW-" 접두사 필수 (예: "KRW-BTC")
 * - 최소 주문금액: 5,000 KRW
 */
import { z } from 'zod'

/** 마켓 코드 패턴: KRW-로 시작하고 영문 대문자 */
const marketRegex = /^KRW-[A-Z0-9]+$/

/** 주문 기본 필드 스키마 */
const OrderBaseSchema = z.object({
  /** 마켓 코드 (예: "KRW-BTC") */
  market: z
    .string()
    .regex(marketRegex, '마켓 코드는 "KRW-"로 시작해야 합니다 (예: KRW-BTC)'),

  /** 주문 종류: bid(매수), ask(매도) */
  side: z.enum(['bid', 'ask'], {
    message: '주문 종류는 bid(매수) 또는 ask(매도)만 가능합니다',
  }),

  /** 주문 타입: limit(지정가), price(시장가 매수), market(시장가 매도) */
  ord_type: z.enum(['limit', 'price', 'market'], {
    message: '주문 타입은 limit, price, market만 가능합니다',
  }),

  /** 주문 가격 (문자열, 선택) */
  price: z.string().optional(),

  /** 주문 수량 (문자열, 선택) */
  volume: z.string().optional(),
})

/**
 * 주문 스키마 (교차 필드 검증 포함)
 *
 * ord_type별 필수 필드:
 * - price: price 필수(>=5000), volume 없어야 함
 * - market: volume 필수(>0), price 없어야 함
 * - limit: price + volume 모두 필수
 */
export const OrderSchema = OrderBaseSchema.superRefine((data, ctx) => {
  const priceNum = data.price ? parseFloat(data.price) : undefined
  const volumeNum = data.volume ? parseFloat(data.volume) : undefined

  switch (data.ord_type) {
    // 시장가 매수: price 필수 (최소 5000 KRW), volume 없어야 함
    case 'price': {
      if (!data.price || priceNum === undefined || isNaN(priceNum)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '시장가 매수 시 주문 금액(price)은 필수입니다',
          path: ['price'],
        })
      } else if (priceNum < 5000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '최소 주문 금액은 5,000 KRW입니다',
          path: ['price'],
        })
      }
      if (data.volume) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '시장가 매수 시 수량(volume)을 지정할 수 없습니다',
          path: ['volume'],
        })
      }
      break
    }

    // 시장가 매도: volume 필수 (양수), price 없어야 함
    case 'market': {
      if (!data.volume || volumeNum === undefined || isNaN(volumeNum)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '시장가 매도 시 수량(volume)은 필수입니다',
          path: ['volume'],
        })
      } else if (volumeNum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '수량은 0보다 커야 합니다',
          path: ['volume'],
        })
      }
      if (data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '시장가 매도 시 가격(price)을 지정할 수 없습니다',
          path: ['price'],
        })
      }
      break
    }

    // 지정가: price + volume 모두 필수
    case 'limit': {
      if (!data.price || priceNum === undefined || isNaN(priceNum)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '지정가 주문 시 가격(price)은 필수입니다',
          path: ['price'],
        })
      } else if (priceNum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '가격은 0보다 커야 합니다',
          path: ['price'],
        })
      }
      if (!data.volume || volumeNum === undefined || isNaN(volumeNum)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '지정가 주문 시 수량(volume)은 필수입니다',
          path: ['volume'],
        })
      } else if (volumeNum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '수량은 0보다 커야 합니다',
          path: ['volume'],
        })
      }
      break
    }
  }
})

/** 주문 스키마의 입력 타입 */
export type OrderInput = z.input<typeof OrderSchema>

/** 주문 스키마의 출력 타입 */
export type OrderOutput = z.output<typeof OrderSchema>
