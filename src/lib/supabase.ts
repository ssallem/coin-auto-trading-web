/**
 * Supabase 서버사이드 클라이언트 (Node.js Runtime 전용)
 *
 * service_role key를 사용하여 RLS를 바이패스합니다.
 * API Route에서만 사용하며, 클라이언트 컴포넌트에서 직접 호출하지 않습니다.
 *
 * 테이블: bot_config (id=1 고정 row)
 * 컬럼: trading, investment, risk, strategy, backtest, logging, notification (JSONB), updated_at
 *
 * 테이블: account_snapshots, order_history, pending_orders
 * → Python 봇이 Upbit에서 동기화한 데이터를 읽기 위한 함수 제공
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AccountSnapshotRow,
  OrderHistoryRow,
  PendingOrderRow,
} from '@/types/supabase'

// ─────────────────────────────────────────────
// Supabase 클라이언트 (싱글턴)
// ─────────────────────────────────────────────

let _client: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다'
    )
  }

  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

// ─────────────────────────────────────────────
// bot_config 조회/수정
// ─────────────────────────────────────────────

/** bot_config 테이블에서 반환되는 전체 설정 타입 */
export interface BotConfigRow {
  trading: Record<string, unknown>
  investment: Record<string, unknown>
  risk: Record<string, unknown>
  strategy: Record<string, unknown>
  backtest: Record<string, unknown>
  logging: Record<string, unknown>
  notification: Record<string, unknown>
  updated_at: string
}

/**
 * bot_config id=1에서 7개 섹션 + updated_at 를 조회합니다.
 *
 * @returns 전체 설정 객체
 * @throws 조회 실패 시 에러
 */
export async function getBotConfig(): Promise<BotConfigRow> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('bot_config')
    .select('trading, investment, risk, strategy, backtest, logging, notification, updated_at')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('bot_config 조회 실패:', error.message)
    throw new Error(`설정을 불러올 수 없습니다: ${error.message}`)
  }

  return data as BotConfigRow
}

/**
 * bot_config id=1을 부분 업데이트합니다.
 * 전달된 필드만 업데이트되며, 나머지는 유지됩니다.
 *
 * @param patch - 업데이트할 필드 (7개 섹션 중 일부)
 * @returns 업데이트된 전체 설정 객체
 * @throws 업데이트 실패 시 에러
 */
export async function updateBotConfig(
  patch: Partial<Omit<BotConfigRow, 'updated_at'>>
): Promise<BotConfigRow> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('bot_config')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('trading, investment, risk, strategy, backtest, logging, notification, updated_at')
    .single()

  if (error) {
    console.error('bot_config 업데이트 실패:', error.message)
    throw new Error(`설정을 저장할 수 없습니다: ${error.message}`)
  }

  return data as BotConfigRow
}

// ─────────────────────────────────────────────
// account_snapshots 조회
// ─────────────────────────────────────────────

/**
 * 최신 계좌 스냅샷 1건을 조회합니다.
 * 봇이 아직 동기화하지 않았으면 null을 반환합니다.
 *
 * @param botId - 봇 식별자 (기본값: 'main')
 * @returns 최신 스냅샷 또는 null
 */
export async function getLatestAccountSnapshot(
  botId: string = 'main'
): Promise<AccountSnapshotRow | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('account_snapshots')
    .select('*')
    .eq('bot_id', botId)
    .order('snapshot_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('account_snapshots 조회 실패:', error.message)
    throw new Error(`계좌 스냅샷을 불러올 수 없습니다: ${error.message}`)
  }

  return data as AccountSnapshotRow | null
}

// ─────────────────────────────────────────────
// order_history 조회
// ─────────────────────────────────────────────

/** getOrderHistory 함수의 옵션 타입 */
interface GetOrderHistoryOptions {
  market?: string
  side?: string
  limit?: number
  botId?: string
}

/**
 * 주문 체결 이력을 조회합니다.
 *
 * @param options - 필터 옵션 (market, side, limit, botId)
 * @returns 주문 이력 배열
 */
export async function getOrderHistory(
  options: GetOrderHistoryOptions = {}
): Promise<OrderHistoryRow[]> {
  const { market, side, limit = 50, botId = 'main' } = options
  const supabase = getSupabaseClient()

  let query = supabase
    .from('order_history')
    .select('*')
    .eq('bot_id', botId)
    .order('traded_at', { ascending: false })
    .limit(limit)

  if (market) {
    query = query.eq('market', market)
  }

  if (side) {
    query = query.eq('side', side)
  }

  const { data, error } = await query

  if (error) {
    console.error('order_history 조회 실패:', error.message)
    throw new Error(`주문 이력을 불러올 수 없습니다: ${error.message}`)
  }

  return (data ?? []) as OrderHistoryRow[]
}

/**
 * Upbit UUID로 주문 이력 단건을 조회합니다.
 *
 * @param upbitUuid - Upbit 주문 UUID
 * @returns 주문 이력 또는 null
 */
export async function getOrderHistoryByUuid(
  upbitUuid: string
): Promise<OrderHistoryRow | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('order_history')
    .select('*')
    .eq('upbit_uuid', upbitUuid)
    .maybeSingle()

  if (error) {
    console.error('order_history 단건 조회 실패:', error.message)
    throw new Error(`주문 이력을 불러올 수 없습니다: ${error.message}`)
  }

  return data as OrderHistoryRow | null
}

// ─────────────────────────────────────────────
// pending_orders 생성/취소
// ─────────────────────────────────────────────

/** createPendingOrder 함수의 입력 타입 */
interface CreatePendingOrderInput {
  market: string
  side: 'bid' | 'ask'
  ord_type: 'limit' | 'price' | 'market'
  price?: string
  volume?: string
  botId?: string
}

/**
 * 대기 주문을 생성합니다.
 * 웹에서 주문을 요청하면 pending_orders에 INSERT하고,
 * Python 봇이 이를 폴링하여 Upbit에 실제 주문을 실행합니다.
 *
 * @param input - 주문 요청 정보
 * @returns 생성된 대기 주문 Row
 */
export async function createPendingOrder(
  input: CreatePendingOrderInput
): Promise<PendingOrderRow> {
  const { market, side, ord_type, price, volume, botId = 'main' } = input
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('pending_orders')
    .insert({
      market,
      side,
      ord_type,
      price: price ?? null,
      volume: volume ?? null,
      bot_id: botId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('pending_orders INSERT 실패:', error.message)
    throw new Error(`주문 요청을 저장할 수 없습니다: ${error.message}`)
  }

  return data as PendingOrderRow
}

/**
 * 대기 주문을 취소합니다.
 * 아직 pending 상태인 주문만 취소할 수 있습니다.
 *
 * @param requestUuid - 대기 주문의 request_uuid
 * @returns 취소된 주문 Row 또는 null (이미 처리된 경우)
 */
export async function cancelPendingOrder(
  requestUuid: string
): Promise<PendingOrderRow | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('pending_orders')
    .update({ status: 'cancelled' })
    .eq('request_uuid', requestUuid)
    .in('status', ['pending'])
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('pending_orders 취소 실패:', error.message)
    throw new Error(`주문 취소에 실패했습니다: ${error.message}`)
  }

  return data as PendingOrderRow | null
}

// ─────────────────────────────────────────────
// 일일 매매 손익 통계
// ─────────────────────────────────────────────

/** 일일 매매 손익 통계 타입 */
export interface DailyPnlStats {
  date: string
  totalPnl: number
  sellVolume: number
  buyVolume: number
  sellCount: number
  buyCount: number
  winCount: number
  loseCount: number
  winRate: number
}

/**
 * 특정 날짜의 매매 손익 통계를 조회합니다.
 *
 * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
 * @param botId - 봇 식별자 (기본값: 'main')
 * @returns 일일 손익 통계
 */
export async function getDailyPnlStats(
  date: string,
  botId: string = 'main'
): Promise<DailyPnlStats> {
  const supabase = getSupabaseClient()

  // 날짜 범위 계산 (KST 기준 00:00:00 ~ 23:59:59.999)
  // KST = UTC+9이므로 +09:00 타임존 사용
  const startDate = `${date}T00:00:00+09:00`
  // 다음날 00:00:00 직전까지
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDateStr = nextDay.toISOString().split('T')[0]
  const endDate = `${nextDateStr}T00:00:00+09:00`

  // order_history에서 해당 날짜의 모든 거래 조회
  const { data, error } = await supabase
    .from('order_history')
    .select('side, amount, pnl')
    .eq('bot_id', botId)
    .gte('traded_at', startDate)
    .lt('traded_at', endDate)

  if (error) {
    console.error('일일 손익 조회 실패:', error.message)
    throw new Error(`일일 손익을 불러올 수 없습니다: ${error.message}`)
  }

  const orders = data ?? []

  // 클라이언트에서 집계
  let totalPnl = 0
  let sellVolume = 0
  let buyVolume = 0
  let sellCount = 0
  let buyCount = 0
  let winCount = 0
  let loseCount = 0

  for (const order of orders) {
    // 손익 합계
    totalPnl += order.pnl

    // 매수/매도 집계
    if (order.side === 'bid') {
      buyVolume += order.amount
      buyCount++
    } else if (order.side === 'ask') {
      sellVolume += order.amount
      sellCount++
    }

    // 승/패 집계 (매도 시에만 손익 발생)
    if (order.side === 'ask') {
      if (order.pnl > 0) {
        winCount++
      } else if (order.pnl < 0) {
        loseCount++
      }
    }
  }

  // 승률 계산 (매도 거래 기준)
  const totalSellTrades = winCount + loseCount
  const winRate = totalSellTrades > 0 ? (winCount / totalSellTrades) * 100 : 0

  return {
    date,
    totalPnl,
    sellVolume,
    buyVolume,
    sellCount,
    buyCount,
    winCount,
    loseCount,
    winRate,
  }
}
