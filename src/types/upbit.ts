/**
 * Upbit REST API 응답 타입 정의
 * 참고: https://docs.upbit.com
 */

// ─────────────────────────────────────────────
// 마켓 정보
// ─────────────────────────────────────────────

/** 마켓 코드 목록 응답 */
export interface UpbitMarket {
  /** 마켓 코드 (예: "KRW-BTC") */
  market: string
  /** 한글 이름 (예: "비트코인") */
  korean_name: string
  /** 영문 이름 (예: "Bitcoin") */
  english_name: string
}

// ─────────────────────────────────────────────
// 현재가 (Ticker)
// ─────────────────────────────────────────────

/** 현재가 정보 응답 */
export interface UpbitTicker {
  /** 마켓 코드 */
  market: string
  /** 현재가 (종가) */
  trade_price: number
  /** 부호 있는 변동 금액 */
  signed_change_price: number
  /** 부호 있는 변동률 (소수, 예: 0.05 = 5%) */
  signed_change_rate: number
  /** 24시간 누적 거래대금 (KRW) */
  acc_trade_price_24h: number
  /** 24시간 누적 거래량 */
  acc_trade_volume_24h: number
  /** 당일 고가 */
  high_price: number
  /** 당일 저가 */
  low_price: number
  /** 당일 시가 */
  opening_price: number
  /** 전일 종가 */
  prev_closing_price: number
  /** 전일 대비: RISE(상승), EVEN(보합), FALL(하락) */
  change: 'RISE' | 'EVEN' | 'FALL'
  /** 타임스탬프 (밀리초) */
  timestamp: number
}

// ─────────────────────────────────────────────
// 캔들 (봉)
// ─────────────────────────────────────────────

/** 캔들 응답 (분/일/주/월 공통) */
export interface UpbitCandle {
  /** 마켓 코드 */
  market: string
  /** 캔들 기준 시각 (UTC, ISO 8601) */
  candle_date_time_utc: string
  /** 캔들 기준 시각 (KST, ISO 8601) */
  candle_date_time_kst: string
  /** 시가 */
  opening_price: number
  /** 고가 */
  high_price: number
  /** 저가 */
  low_price: number
  /** 종가 */
  trade_price: number
  /** 캔들 기간 누적 거래량 */
  candle_acc_trade_volume: number
  /** 캔들 기간 누적 거래대금 */
  candle_acc_trade_price: number
  /** 타임스탬프 (밀리초) */
  timestamp: number
  /** 분 단위 (분봉 전용, 예: 1, 3, 5, 10, 15, 30, 60, 240) */
  unit?: number
}

// ─────────────────────────────────────────────
// 호가 (Orderbook)
// ─────────────────────────────────────────────

/** 개별 호가 단위 */
export interface UpbitOrderbookUnit {
  /** 매도 호가 */
  ask_price: number
  /** 매수 호가 */
  bid_price: number
  /** 매도 잔량 */
  ask_size: number
  /** 매수 잔량 */
  bid_size: number
}

/** 호가 정보 응답 */
export interface UpbitOrderbook {
  /** 마켓 코드 */
  market: string
  /** 타임스탬프 (밀리초) */
  timestamp: number
  /** 매도 총 잔량 */
  total_ask_size: number
  /** 매수 총 잔량 */
  total_bid_size: number
  /** 호가 목록 (최우선 호가부터) */
  orderbook_units: UpbitOrderbookUnit[]
}

// ─────────────────────────────────────────────
// 계좌 잔고 (Exchange API - 인증 필요)
// ─────────────────────────────────────────────

/** 계좌 잔고 응답 */
export interface UpbitBalance {
  /** 화폐 코드 (예: "KRW", "BTC") */
  currency: string
  /** 주문 가능 수량 (문자열) */
  balance: string
  /** 주문 중 묶인 수량 (문자열) */
  locked: string
  /** 매수 평균가 (문자열) */
  avg_buy_price: string
  /** 매수 평균가 수정 여부 */
  avg_buy_price_modified: boolean
  /** 평단가 기준 화폐 (예: "KRW") */
  unit_currency: string
}

// ─────────────────────────────────────────────
// 주문 (Exchange API - 인증 필요)
// ─────────────────────────────────────────────

/** 주문 응답 */
export interface UpbitOrder {
  /** 주문 고유 식별자 */
  uuid: string
  /** 주문 종류: bid(매수), ask(매도) */
  side: 'bid' | 'ask'
  /** 주문 타입: limit(지정가), price(시장가 매수), market(시장가 매도) */
  ord_type: 'limit' | 'price' | 'market'
  /** 주문 가격 (시장가 매도 시 null) */
  price: string | null
  /** 주문 상태 */
  state: 'wait' | 'watch' | 'done' | 'cancel'
  /** 마켓 코드 */
  market: string
  /** 주문 생성 시각 (ISO 8601) */
  created_at: string
  /** 주문 수량 (시장가 매수 시 null) */
  volume: string | null
  /** 미체결 잔량 */
  remaining_volume: string | null
  /** 체결된 수량 */
  executed_volume: string
  /** 체결 건수 */
  trades_count: number
  /** 사용된 수수료 */
  paid_fee: string
  /** 묶여 있는 비용 */
  locked: string
}

/** 주문 생성 요청 파라미터 */
export interface UpbitOrderRequest {
  /** 마켓 코드 (예: "KRW-BTC") */
  market: string
  /** 주문 종류: bid(매수), ask(매도) */
  side: 'bid' | 'ask'
  /** 주문 타입: limit(지정가), price(시장가 매수), market(시장가 매도) */
  ord_type: 'limit' | 'price' | 'market'
  /** 주문 가격 (시장가 매수 시 필수: KRW 금액) */
  price?: string
  /** 주문 수량 (시장가 매도 시 필수: 코인 수량) */
  volume?: string
}

// ─────────────────────────────────────────────
// WebSocket 메시지 타입
// ─────────────────────────────────────────────

/** WebSocket Ticker 메시지 */
export interface UpbitWSTickerMessage {
  /** 메시지 타입 */
  type: 'ticker'
  /** 마켓 코드 (예: "KRW-BTC") */
  code: string
  /** 현재가 */
  trade_price: number
  /** 부호 있는 변동 금액 */
  signed_change_price: number
  /** 부호 있는 변동률 (소수) */
  signed_change_rate: number
  /** 24시간 누적 거래대금 */
  acc_trade_price_24h: number
  /** 24시간 누적 거래량 */
  acc_trade_volume_24h: number
  /** 당일 고가 */
  high_price: number
  /** 당일 저가 */
  low_price: number
  /** 당일 시가 */
  opening_price: number
  /** 전일 대비 */
  change: 'RISE' | 'EVEN' | 'FALL'
  /** 타임스탬프 (밀리초) */
  timestamp: number
}

// ─────────────────────────────────────────────
// 공통 타입
// ─────────────────────────────────────────────

/** 분봉 캔들 인터벌 (분 단위) */
export type CandleInterval = '1' | '3' | '5' | '10' | '15' | '30' | '60' | '240'
