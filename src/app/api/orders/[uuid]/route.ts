/**
 * 개별 주문 관리 API Route (Node.js Runtime)
 *
 * GET    /api/orders/[uuid]
 * → Supabase order_history에서 upbit_uuid로 단건 조회
 *
 * DELETE /api/orders/[uuid]
 * → Supabase pending_orders에서 request_uuid로 주문 취소
 *
 * 세션 인증 필수
 * Python 봇이 Upbit에서 동기화한 데이터를 Supabase에서 읽고,
 * 주문 취소는 pending_orders 상태를 변경하여 봇이 처리합니다.
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { getOrderHistoryByUuid, cancelPendingOrder } from '@/lib/supabase'
import type { UpbitOrder } from '@/types/upbit'

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

/** 주문 상세 조회 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    const { uuid } = await params

    if (!uuid) {
      return NextResponse.json(
        { error: '주문 UUID가 필요합니다' },
        { status: 400 }
      )
    }

    // Supabase에서 주문 이력 단건 조회
    const row = await getOrderHistoryByUuid(uuid)

    if (!row) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // OrderHistoryRow → UpbitOrder 변환
    const order: UpbitOrder = {
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

    return NextResponse.json(order)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** 주문 취소 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    const { uuid } = await params

    if (!uuid) {
      return NextResponse.json(
        { error: '주문 UUID가 필요합니다' },
        { status: 400 }
      )
    }

    // Supabase pending_orders에서 주문 취소
    const cancelled = await cancelPendingOrder(uuid)

    if (!cancelled) {
      return NextResponse.json(
        { error: '취소할 수 없는 주문입니다 (이미 처리되었거나 존재하지 않음)' },
        { status: 409 }
      )
    }

    // 취소 성공 응답
    return NextResponse.json({
      uuid: cancelled.request_uuid,
      market: cancelled.market,
      side: cancelled.side,
      ord_type: cancelled.ord_type,
      status: cancelled.status,
      cancelled_at: new Date().toISOString(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
