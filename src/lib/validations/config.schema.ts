/**
 * 봇 전체 설정 Zod 검증 스키마
 *
 * bot_config 테이블의 7개 JSONB 섹션 전체를 검증합니다.
 * - trading: 마켓, 폴링 간격, 타임프레임, 캔들 수
 * - investment: 투자금액 설정
 * - risk: 리스크 관리 (strategy.schema.ts에서 import)
 * - strategy: 전략 파라미터 (strategy.schema.ts에서 import)
 * - backtest: 백테스트 설정
 * - logging: 로깅 설정
 * - notification: 알림 설정
 */
import { z } from 'zod'
import {
  StrategyConfigSchema,
  RiskConfigSchema,
} from './strategy.schema'

// ─────────────────────────────────────────────
// Trading (거래 기본 설정)
// ─────────────────────────────────────────────

/** 거래 기본 설정 스키마 */
export const TradingConfigSchema = z.object({
  /** 감시 대상 마켓 목록 (KRW- 접두사 필수) */
  markets: z
    .array(
      z.string().regex(/^KRW-/, '마켓 코드는 KRW- 접두사가 필요합니다')
    )
    .min(1, '최소 1개 이상의 마켓을 선택해야 합니다'),

  /** 폴링 간격 (초, 10~3600) */
  poll_interval: z
    .number()
    .int('폴링 간격은 정수여야 합니다')
    .min(10, '폴링 간격은 최소 10초 이상이어야 합니다')
    .max(3600, '폴링 간격은 최대 3600초 이하여야 합니다'),

  /** 분석 타임프레임 */
  timeframe: z.enum(['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'], {
    message: '유효한 타임프레임을 선택해주세요',
  }),

  /** 캔들 조회 수 (10~500) */
  candle_count: z
    .number()
    .int('캔들 수는 정수여야 합니다')
    .min(10, '캔들 수는 최소 10 이상이어야 합니다')
    .max(500, '캔들 수는 최대 500 이하여야 합니다'),
})

// ─────────────────────────────────────────────
// Investment (투자금액 설정)
// ─────────────────────────────────────────────

/** 투자금액 설정 스키마 */
export const InvestmentConfigSchema = z.object({
  /** 최대 총 투자금액 (최소 5,000 KRW) */
  max_total_investment: z
    .number()
    .min(5000, '최대 총 투자금액은 5,000 KRW 이상이어야 합니다'),

  /** 건당 투자금액 (최소 5,000 KRW) */
  per_trade_amount: z
    .number()
    .min(5000, '건당 투자금액은 5,000 KRW 이상이어야 합니다'),

  /** 최소 주문 금액 (최소 5,000 KRW) */
  min_order_amount: z
    .number()
    .min(5000, '최소 주문 금액은 5,000 KRW 이상이어야 합니다'),
})

// ─────────────────────────────────────────────
// Backtest (백테스트 설정)
// ─────────────────────────────────────────────

/** 백테스트 설정 스키마 */
export const BacktestConfigSchema = z.object({
  /** 백테스트 기간 (일, 1~365) */
  period_days: z
    .number()
    .int('백테스트 기간은 정수여야 합니다')
    .min(1, '백테스트 기간은 최소 1일 이상이어야 합니다')
    .max(365, '백테스트 기간은 최대 365일 이하여야 합니다'),

  /** 시작일 (YYYY-MM-DD 형식) */
  start_date: z.string().min(1, '시작일을 입력해주세요'),

  /** 종료일 (YYYY-MM-DD 형식) */
  end_date: z.string().min(1, '종료일을 입력해주세요'),

  /** 초기 자본금 (최소 5,000 KRW) */
  initial_capital: z
    .number()
    .min(5000, '초기 자본금은 5,000 KRW 이상이어야 합니다'),

  /** 수수료율 (0~0.1, 즉 0~10%) */
  commission_rate: z
    .number()
    .min(0, '수수료율은 0 이상이어야 합니다')
    .max(0.1, '수수료율은 0.1 이하여야 합니다'),
})

// ─────────────────────────────────────────────
// Logging (로깅 설정)
// ─────────────────────────────────────────────

/** 로깅 설정 스키마 */
export const LoggingConfigSchema = z.object({
  /** 로그 레벨 */
  level: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'], {
    message: '로그 레벨은 DEBUG, INFO, WARNING, ERROR, CRITICAL 중 하나여야 합니다',
  }),

  /** 로그 파일 경로 */
  file: z.string().min(1, '로그 파일 경로를 입력해주세요'),

  /** 로그 파일 최대 크기 (MB, 1~1000) */
  max_size_mb: z
    .number()
    .int('로그 파일 크기는 정수여야 합니다')
    .min(1, '로그 파일 크기는 최소 1MB 이상이어야 합니다')
    .max(1000, '로그 파일 크기는 최대 1000MB 이하여야 합니다'),

  /** 백업 파일 수 (0~100) */
  backup_count: z
    .number()
    .int('백업 파일 수는 정수여야 합니다')
    .min(0, '백업 파일 수는 0 이상이어야 합니다')
    .max(100, '백업 파일 수는 최대 100 이하여야 합니다'),
})

// ─────────────────────────────────────────────
// Notification (알림 설정)
// ─────────────────────────────────────────────

/** 알림 설정 스키마 */
export const NotificationConfigSchema = z.object({
  /** 알림 활성화 여부 */
  enabled: z.boolean(),

  /** 알림 채널 */
  channel: z.enum(['telegram', 'slack'], {
    message: '알림 채널은 telegram 또는 slack 중 하나여야 합니다',
  }),

  /** 알림 이벤트 목록 */
  events: z.array(z.string()),
})

// ─────────────────────────────────────────────
// BotConfig (전체 통합 스키마)
// ─────────────────────────────────────────────

/** 봇 전체 설정 스키마 (7개 섹션 통합) */
export const BotConfigSchema = z.object({
  trading: TradingConfigSchema,
  investment: InvestmentConfigSchema,
  risk: RiskConfigSchema,
  strategy: StrategyConfigSchema,
  backtest: BacktestConfigSchema,
  logging: LoggingConfigSchema,
  notification: NotificationConfigSchema,
})

// ─────────────────────────────────────────────
// 추론된 타입 내보내기
// ─────────────────────────────────────────────

/** 거래 기본 설정 타입 */
export type TradingConfigInput = z.input<typeof TradingConfigSchema>
export type TradingConfigOutput = z.output<typeof TradingConfigSchema>

/** 투자금액 설정 타입 */
export type InvestmentConfigInput = z.input<typeof InvestmentConfigSchema>
export type InvestmentConfigOutput = z.output<typeof InvestmentConfigSchema>

/** 백테스트 설정 타입 */
export type BacktestConfigInput = z.input<typeof BacktestConfigSchema>
export type BacktestConfigOutput = z.output<typeof BacktestConfigSchema>

/** 로깅 설정 타입 */
export type LoggingConfigInput = z.input<typeof LoggingConfigSchema>
export type LoggingConfigOutput = z.output<typeof LoggingConfigSchema>

/** 알림 설정 타입 */
export type NotificationConfigInput = z.input<typeof NotificationConfigSchema>
export type NotificationConfigOutput = z.output<typeof NotificationConfigSchema>

/** 봇 전체 설정 타입 */
export type BotConfigInput = z.input<typeof BotConfigSchema>
export type BotConfigOutput = z.output<typeof BotConfigSchema>
