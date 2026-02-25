/**
 * TanStack Query v5 - Query Key Factory 패턴
 *
 * 모든 Query Key를 중앙에서 관리하여 일관성을 보장합니다.
 * 키 배열은 as const로 선언하여 타입 안전성을 확보합니다.
 *
 * 참고: https://tanstack.com/query/v5/docs/framework/react/guides/query-keys
 */

/** Query Key 팩토리 */
export const queryKeys = {
  // ─────────────────────────────────────────
  // 시세 데이터 (Quotation API - 인증 불필요, Edge Runtime)
  // ─────────────────────────────────────────

  /** 현재가(Ticker) 조회 키 - 마켓 코드 정렬하여 캐시 일관성 보장 */
  ticker: (markets: string[]) =>
    ['ticker', ...markets.sort()] as const,

  /** 캔들(봉) 조회 키 */
  candles: (market: string, interval: string, count: number) =>
    ['candles', market, interval, count] as const,

  /** 호가 조회 키 */
  orderbook: (market: string) =>
    ['orderbook', market] as const,

  /** 마켓 목록 조회 키 */
  markets: () =>
    ['markets'] as const,

  // ─────────────────────────────────────────
  // 계좌 데이터 (Exchange API - 인증 필요)
  // ─────────────────────────────────────────

  /** 계좌 잔고 조회 키 */
  accounts: () =>
    ['accounts'] as const,

  // ─────────────────────────────────────────
  // 주문 데이터 (Exchange API - 인증 필요)
  // ─────────────────────────────────────────

  /** 주문 목록 조회 키 (필터 파라미터 포함) */
  orders: (params?: { state?: string; market?: string }) =>
    ['orders', params ?? {}] as const,

  /** 개별 주문 조회 키 */
  order: (uuid: string) =>
    ['order', uuid] as const,

  // ─────────────────────────────────────────
  // 전략 설정
  // ─────────────────────────────────────────

  /** 전략 설정 조회 키 */
  strategyConfig: () =>
    ['strategy', 'config'] as const,

  // ─────────────────────────────────────────
  // 봇 전체 설정 (Supabase bot_config)
  // ─────────────────────────────────────────

  /** 봇 전체 설정 키 */
  botConfig: {
    all: ['settings', 'bot-config'] as const,
  },

  // ─────────────────────────────────────────
  // 분석 통계 (Analytics)
  // ─────────────────────────────────────────

  /** 일일 손익 통계 키 */
  dailyPnl: (date: string) =>
    ['analytics', 'daily-pnl', date] as const,
}

/**
 * Query 갱신 설정 (staleTime, refetchInterval)
 *
 * - staleTime: 데이터가 "신선"한 것으로 간주되는 시간 (ms)
 * - refetchInterval: 자동 리패치 간격 (ms, false면 비활성)
 *
 * 실시간성이 중요한 시세 데이터는 짧은 간격으로,
 * 상대적으로 정적인 마켓 목록은 긴 간격으로 설정합니다.
 */
export const QUERY_CONFIG = {
  /** 현재가: 1초 신선, 2초 갱신 */
  ticker: {
    staleTime: 1_000,
    refetchInterval: 2_000,
  },
  /** 캔들: 30초 신선, 60초 갱신 */
  candles: {
    staleTime: 30_000,
    refetchInterval: 60_000,
  },
  /** 호가: 0.5초 신선, 1초 갱신 */
  orderbook: {
    staleTime: 500,
    refetchInterval: 1_000,
  },
  /** 계좌: 5초 신선, 10초 갱신 */
  accounts: {
    staleTime: 5_000,
    refetchInterval: 10_000,
  },
  /** 주문 목록: 3초 신선, 5초 갱신 */
  orders: {
    staleTime: 3_000,
    refetchInterval: 5_000,
  },
  /** 마켓 목록: 1시간 신선, 자동 갱신 없음 (거의 변하지 않음) */
  markets: {
    staleTime: 3_600_000,
    refetchInterval: false as const,
  },
  /** 전략 설정: 5초 신선, 10초 갱신 */
  strategyConfig: {
    staleTime: 5_000,
    refetchInterval: 10_000,
  },
  /** 봇 전체 설정: 30초 신선 */
  botConfig: {
    staleTime: 30_000,
  },
  /** 일일 손익 통계: 1분 신선 */
  dailyPnl: {
    staleTime: 60_000,
  },
} as const
