/**
 * 내부 도메인 타입 정의
 * Upbit API 원시 타입을 가공한 프론트엔드용 타입
 */

// ─────────────────────────────────────────────
// 보유 코인 (가공된 타입)
// ─────────────────────────────────────────────

/** 보유 코인 정보 (API 응답을 가공한 프론트엔드용) */
export interface Holding {
  /** 화폐 코드 (예: "BTC") */
  currency: string
  /** 마켓 코드 (예: "KRW-BTC") */
  market: string
  /** 보유 수량 */
  balance: number
  /** 주문 중 묶인 수량 */
  locked: number
  /** 매수 평균가 (KRW) */
  avgBuyPrice: number
  /** 현재가 (실시간 갱신) */
  currentPrice: number
  /** 평가금액 (balance * currentPrice) */
  totalValue: number
  /** 투자금액 (balance * avgBuyPrice) */
  investedAmount: number
  /** 손익 금액 (totalValue - investedAmount) */
  pnl: number
  /** 손익률 (%, 예: 5.2 = +5.2%) */
  pnlPercent: number
}

// ─────────────────────────────────────────────
// 전략 설정 (Python 봇과 동일 구조)
// ─────────────────────────────────────────────

/** 활성 전략 이름 */
export type StrategyName = 'rsi' | 'ma_cross' | 'bollinger'

/** 전략 설정 (Python 봇 config와 동일 구조) */
export interface StrategyConfig {
  /** 현재 활성화된 전략 */
  active: StrategyName
  /** RSI 전략 파라미터 */
  rsi: {
    /** RSI 계산 기간 */
    period: number
    /** 과매도 기준선 (매수 시그널) */
    oversold: number
    /** 과매수 기준선 (매도 시그널) */
    overbought: number
  }
  /** 이동평균 교차 전략 파라미터 */
  ma_cross: {
    /** 단기 이동평균 기간 */
    short_period: number
    /** 장기 이동평균 기간 */
    long_period: number
    /** 이동평균 유형 (SMA 또는 EMA) */
    ma_type: 'SMA' | 'EMA'
  }
  /** 볼린저밴드 전략 파라미터 */
  bollinger: {
    /** 볼린저밴드 기간 */
    period: number
    /** 표준편차 배수 */
    std_dev: number
  }
}

// ─────────────────────────────────────────────
// 리스크 관리 설정
// ─────────────────────────────────────────────

/** 리스크 관리 설정 */
export interface RiskConfig {
  /** 손절 비율 (%, 예: 3 = -3% 시 손절) */
  stop_loss_pct: number
  /** 익절 비율 (%, 예: 5 = +5% 시 익절) */
  take_profit_pct: number
  /** 트레일링 스탑 설정 */
  trailing_stop: {
    /** 트레일링 스탑 활성화 여부 */
    enabled: boolean
    /** 트레일링 스탑 비율 (%) */
    pct: number
  }
  /** 일일 최대 손실 한도 (KRW) */
  max_daily_loss: number
  /** 최대 동시 보유 포지션 수 */
  max_positions: number
}

// ─────────────────────────────────────────────
// 거래 설정 전체
// ─────────────────────────────────────────────

/** 거래 설정 전체 (전략 + 리스크 + 마켓) */
export interface TradingConfig {
  /** 전략 설정 */
  strategy: StrategyConfig
  /** 리스크 관리 설정 */
  risk: RiskConfig
  /** 감시 대상 마켓 목록 (예: ["KRW-BTC", "KRW-ETH"]) */
  markets: string[]
  /** 분석 타임프레임 (예: "5m", "15m", "1h") */
  timeframe: string
  /** 폴링 간격 (초) */
  poll_interval: number
}

// ─────────────────────────────────────────────
// 포트폴리오 요약
// ─────────────────────────────────────────────

/** 포트폴리오 요약 정보 */
export interface PortfolioSummary {
  /** 총 평가금액 (KRW 잔고 + 코인 평가금) */
  totalAsset: number
  /** KRW 잔고 (주문 가능 금액) */
  totalKRW: number
  /** 총 투자금 (코인 매수에 사용된 금액) */
  totalInvested: number
  /** 총 손익 금액 */
  totalPnL: number
  /** 총 손익률 (%) */
  totalPnLPercent: number
  /** 보유 코인 목록 */
  holdings: Holding[]
}

// ─────────────────────────────────────────────
// UI 관련 타입
// ─────────────────────────────────────────────

/** 네비게이션 메뉴 아이템 */
export interface NavItem {
  /** 메뉴 제목 */
  title: string
  /** 라우트 경로 */
  href: string
  /** 아이콘 이름 (lucide-react) */
  icon: string
  /** 배지 텍스트 (선택) */
  badge?: string
}

// ─────────────────────────────────────────────
// 봇 전체 설정 (Supabase bot_config 테이블)
// ─────────────────────────────────────────────

/** 거래 기본 설정 (마켓, 폴링, 타임프레임) */
export interface TradingSettings {
  markets: string[]
  poll_interval: number
  timeframe: string
  candle_count: number
}

/** 투자금액 설정 */
export interface InvestmentConfig {
  max_total_investment: number
  per_trade_amount: number
  min_order_amount: number
}

/** 백테스트 설정 */
export interface BacktestConfig {
  period_days: number
  start_date: string
  end_date: string
  initial_capital: number
  commission_rate: number
}

/** 로그 레벨 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

/** 로깅 설정 */
export interface LoggingConfig {
  level: LogLevel
  file: string
  max_size_mb: number
  backup_count: number
}

/** 알림 채널 */
export type NotificationChannel = 'telegram' | 'slack'

/** 알림 설정 */
export interface NotificationConfig {
  enabled: boolean
  channel: NotificationChannel
  events: string[]
}

/** 봇 전체 설정 (7개 섹션 통합) */
export interface BotConfig {
  trading: TradingSettings
  investment: InvestmentConfig
  risk: RiskConfig
  strategy: StrategyConfig
  backtest: BacktestConfig
  logging: LoggingConfig
  notification: NotificationConfig
  updated_at?: string
}

// ─────────────────────────────────────────────
// 일일 매매 손익 통계
// ─────────────────────────────────────────────

/** 일일 매매 손익 통계 */
export interface DailyPnlStats {
  /** 날짜 (YYYY-MM-DD) */
  date: string
  /** 일일 실현 손익 합계 (KRW) */
  totalPnl: number
  /** 매도 총액 (KRW) */
  sellVolume: number
  /** 매수 총액 (KRW) */
  buyVolume: number
  /** 매도 건수 */
  sellCount: number
  /** 매수 건수 */
  buyCount: number
  /** 수익 거래 수 (pnl > 0) */
  winCount: number
  /** 손실 거래 수 (pnl < 0) */
  loseCount: number
  /** 승률 (%) */
  winRate: number
}
