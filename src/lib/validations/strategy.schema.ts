/**
 * 전략 및 리스크 설정 Zod 검증 스키마
 *
 * Python 봇 설정 파일과 동일한 구조를 검증합니다.
 * - 전략: RSI, 이동평균 교차, 볼린저밴드
 * - 리스크: 손절/익절, 트레일링 스탑, 투자 한도
 */
import { z } from 'zod'

// ─────────────────────────────────────────────
// 전략별 파라미터 스키마
// ─────────────────────────────────────────────

/** RSI 전략 파라미터 */
const RsiConfigSchema = z
  .object({
    /** RSI 계산 기간 (2~100) */
    period: z
      .number()
      .int('RSI 기간은 정수여야 합니다')
      .min(2, 'RSI 기간은 최소 2 이상이어야 합니다')
      .max(100, 'RSI 기간은 최대 100 이하여야 합니다'),

    /** 과매도 기준선 (0~100) - 이 값 이하면 매수 시그널 */
    oversold: z
      .number()
      .min(0, '과매도 기준선은 0 이상이어야 합니다')
      .max(100, '과매도 기준선은 100 이하여야 합니다'),

    /** 과매수 기준선 (0~100) - 이 값 이상이면 매도 시그널 */
    overbought: z
      .number()
      .min(0, '과매수 기준선은 0 이상이어야 합니다')
      .max(100, '과매수 기준선은 100 이하여야 합니다'),
  })
  .refine((data) => data.oversold < data.overbought, {
    message: '과매도 기준선은 과매수 기준선보다 작아야 합니다',
    path: ['oversold'],
  })

/** 이동평균 교차 전략 파라미터 */
const MaCrossConfigSchema = z
  .object({
    /** 단기 이동평균 기간 (2~200) */
    short_period: z
      .number()
      .int('단기 이평 기간은 정수여야 합니다')
      .min(2, '단기 이평 기간은 최소 2 이상이어야 합니다')
      .max(200, '단기 이평 기간은 최대 200 이하여야 합니다'),

    /** 장기 이동평균 기간 (2~500) */
    long_period: z
      .number()
      .int('장기 이평 기간은 정수여야 합니다')
      .min(2, '장기 이평 기간은 최소 2 이상이어야 합니다')
      .max(500, '장기 이평 기간은 최대 500 이하여야 합니다'),

    /** 이동평균 유형 (SMA 또는 EMA) */
    ma_type: z.enum(['SMA', 'EMA'], {
      message: '이동평균 유형은 SMA 또는 EMA 중 하나여야 합니다',
    }),
  })
  .refine((data) => data.short_period < data.long_period, {
    message: '단기 이평 기간은 장기 이평 기간보다 작아야 합니다',
    path: ['short_period'],
  })

/** 볼린저밴드 전략 파라미터 */
const BollingerConfigSchema = z.object({
  /** 볼린저밴드 기간 (2~100) */
  period: z
    .number()
    .int('볼린저 기간은 정수여야 합니다')
    .min(2, '볼린저 기간은 최소 2 이상이어야 합니다')
    .max(100, '볼린저 기간은 최대 100 이하여야 합니다'),

  /** 표준편차 배수 (0.5~4.0) */
  std_dev: z
    .number()
    .min(0.5, '표준편차 배수는 최소 0.5 이상이어야 합니다')
    .max(4.0, '표준편차 배수는 최대 4.0 이하여야 합니다'),
})

// ─────────────────────────────────────────────
// 전략 설정 통합 스키마
// ─────────────────────────────────────────────

/** 전략 설정 스키마 */
export const StrategyConfigSchema = z.object({
  /** 현재 활성화된 전략 */
  active: z.enum(['rsi', 'ma_cross', 'bollinger'], {
    message: '전략은 rsi, ma_cross, bollinger 중 하나여야 합니다',
  }),

  /** RSI 전략 파라미터 */
  rsi: RsiConfigSchema,

  /** 이동평균 교차 전략 파라미터 */
  ma_cross: MaCrossConfigSchema,

  /** 볼린저밴드 전략 파라미터 */
  bollinger: BollingerConfigSchema,
})

// ─────────────────────────────────────────────
// 리스크 관리 스키마
// ─────────────────────────────────────────────

/** 트레일링 스탑 설정 스키마 */
const TrailingStopSchema = z.object({
  /** 트레일링 스탑 활성화 여부 */
  enabled: z.boolean(),

  /** 트레일링 스탑 비율 (0~50%) */
  pct: z
    .number()
    .min(0, '트레일링 스탑 비율은 0 이상이어야 합니다')
    .max(50, '트레일링 스탑 비율은 50 이하여야 합니다'),
})

/** 리스크 관리 설정 스키마 */
export const RiskConfigSchema = z.object({
  /** 손절 비율 (0~50%) */
  stop_loss_pct: z
    .number()
    .min(0, '손절 비율은 0 이상이어야 합니다')
    .max(50, '손절 비율은 50 이하여야 합니다'),

  /** 익절 비율 (0~100%) */
  take_profit_pct: z
    .number()
    .min(0, '익절 비율은 0 이상이어야 합니다')
    .max(100, '익절 비율은 100 이하여야 합니다'),

  /** 트레일링 스탑 설정 */
  trailing_stop: TrailingStopSchema,

  /** 최대 총 투자금액 (최소 5,000 KRW) */
  max_total_investment: z
    .number()
    .min(5000, '최대 총 투자금액은 5,000 KRW 이상이어야 합니다'),

  /** 일일 최대 손실 한도 (0 이상, KRW) */
  max_daily_loss: z
    .number()
    .min(0, '일일 최대 손실 한도는 0 이상이어야 합니다'),

  /** 최대 동시 보유 포지션 수 (1~50) */
  max_positions: z
    .number()
    .int('최대 포지션 수는 정수여야 합니다')
    .min(1, '최대 포지션 수는 1 이상이어야 합니다')
    .max(50, '최대 포지션 수는 50 이하여야 합니다'),

  /** 건당 투자금액 (최소 5,000 KRW) */
  per_trade_amount: z
    .number()
    .min(5000, '건당 투자금액은 5,000 KRW 이상이어야 합니다'),
})

// ─────────────────────────────────────────────
// 추론된 타입 내보내기
// ─────────────────────────────────────────────

/** 전략 설정 입력 타입 */
export type StrategyConfigInput = z.input<typeof StrategyConfigSchema>

/** 전략 설정 출력 타입 */
export type StrategyConfigOutput = z.output<typeof StrategyConfigSchema>

/** 리스크 설정 입력 타입 */
export type RiskConfigInput = z.input<typeof RiskConfigSchema>

/** 리스크 설정 출력 타입 */
export type RiskConfigOutput = z.output<typeof RiskConfigSchema>
