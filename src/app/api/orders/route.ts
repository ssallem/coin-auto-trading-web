/**
 * 주문 관리 API Route (Node.js Runtime)
 *
 * GET  /api/orders?market=KRW-BTC&side=bid&limit=50
 * → Supabase order_history 조회
 *
 * POST /api/orders
 * → Supabase pending_orders INSERT (봇이 Upbit에 실행)
 * → Body: { market, side, ord_type, price?, volume? }
 * → OrderSchema (zod)로 검증
 *
 * 세션 인증 필수
 * Python 봇이 Upbit에서 동기화한 데이터를 Supabase에서 읽고,
 * 주문 요청은 pending_orders 테이블에 INSERT하여 봇이 처리합니다.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { getOrderHistory, createPendingOrder } from '@/lib/supabase'
import { OrderSchema } from '@/lib/validations/order.schema'
import type { UpbitOrder } from '@/types/upbit'
import type { OrderHistoryRow } from '@/types/supabase'

/**
 * 세션 검증 헬퍼 함수
 * @returns 유효하면 null, 아니면 에러 응답
 */
async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie?.value) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const isValid = await verifySession(sessionCookie.value)
  if (!isValid) {
    return NextResponse.json(
      { error: '세션이 만료되었거나 유효하지 않습니다' },
      { status: 401 }
    )
  }

  return null
}

/**
 * OrderHistoryRow → UpbitOrder 변환
 */
function toUpbitOrder(row: OrderHistoryRow): UpbitOrder {
  return {
    uuid: row.upbit_uuid,
    side: row.side,
    ord_type: row.ord_type,
    price: row.price != null ? String(row.price) : null,
    state: 'done',
    market: row.market,
    created_at: row.created_at,
    volume: row.volume != null ? String(row.volume) : null,
    remaining_volume: '0',
    executed_volume: row.volume != null ? String(row.volume) : '0',
    trades_count: 1,
    paid_fee: '0',
    locked: '0',
  }
}

/** 주문 목록 조회 */
export async function GET(request: NextRequest) {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    const { searchParams } = new URL(request.url)

    const market = searchParams.get('market') ?? undefined
    const sideParam = searchParams.get('side')
    const side = sideParam === 'bid' || sideParam === 'ask' ? sideParam : undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200) : 50

    // Supabase에서 주문 이력 조회
    const rows = await getOrderHistory({ market, side, limit })

    // OrderHistoryRow → UpbitOrder 변환
    const orders: UpbitOrder[] = rows.map(toUpbitOrder)

    return NextResponse.json(orders)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** 주문 생성 */
export async function POST(request: NextRequest) {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    // 요청 본문 파싱
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: '유효한 JSON 형식이 아닙니다' },
        { status: 400 }
      )
    }

    // Zod 스키마 검증
    const result = OrderSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: '주문 요청 검증 실패', details: errors },
        { status: 400 }
      )
    }

    const orderData = result.data

    // Supabase pending_orders에 주문 요청 INSERT
    const pendingOrder = await createPendingOrder({
      market: orderData.market,
      side: orderData.side,
      ord_type: orderData.ord_type,
      price: orderData.price,
      volume: orderData.volume,
    })

    // PendingOrderRow → UpbitOrder 변환 (state='wait': 봇이 처리 대기 중)
    const order: UpbitOrder = {
      uuid: pendingOrder.request_uuid,
      side: pendingOrder.side,
      ord_type: pendingOrder.ord_type,
      price: pendingOrder.price,
      state: 'wait',
      market: pendingOrder.market,
      created_at: pendingOrder.requested_at,
      volume: pendingOrder.volume,
      remaining_volume: pendingOrder.volume,
      executed_volume: '0',
      trades_count: 0,
      paid_fee: '0',
      locked: '0',
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
