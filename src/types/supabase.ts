/**
 * Supabase 테이블 Row 타입 정의
 *
 * Python 봇이 Upbit에서 데이터를 가져와 Supabase에 동기화하고,
 * 웹 대시보드는 Supabase에서 읽기만 합니다.
 *
 * 테이블:
 * - account_snapshots: 계좌 잔고 스냅샷 (봇이 주기적으로 동기화)
 * - order_history: 주문 체결 이력 (봇이 체결 시 기록)
 * - pending_orders: 웹에서 요청한 대기 주문 (봇이 처리)
 */

// ─────────────────────────────────────────────
// account_snapshots
// ─────────────────────────────────────────────

/** 계좌 잔고 스냅샷 Row */
export interface AccountSnapshotRow {
  id: number
  krw_balance: number
  krw_locked: number
  holdings: Array<{
    currency: string
    balance: string
    locked: string
    avg_buy_price: string
    avg_buy_price_modified?: boolean
    unit_currency: string
  }>
  snapshot_at: string
  bot_id: string
}

// ─────────────────────────────────────────────
// order_history
// ─────────────────────────────────────────────

/** 주문 체결 이력 Row */
export interface OrderHistoryRow {
  id: number
  upbit_uuid: string
  market: string
  side: 'bid' | 'ask'
  ord_type: 'limit' | 'price' | 'market'
  price: number | null
  volume: number | null
  amount: number
  pnl: number
  pnl_pct: number
  signal_reason: string
  state: string
  source: 'bot' | 'web'
  pending_order_id: number | null
  bot_id: string
  traded_at: string
  created_at: string
}

// ─────────────────────────────────────────────
// pending_orders
// ─────────────────────────────────────────────

/** 대기 주문 Row (웹 -> 봇 요청 큐) */
export interface PendingOrderRow {
  id: number
  request_uuid: string
  market: string
  side: 'bid' | 'ask'
  ord_type: 'limit' | 'price' | 'market'
  price: string | null
  volume: string | null
  status: 'pending' | 'processing' | 'done' | 'cancelled' | 'failed'
  upbit_uuid: string | null
  error_message: string | null
  requested_at: string
  processed_at: string | null
  bot_id: string
}
