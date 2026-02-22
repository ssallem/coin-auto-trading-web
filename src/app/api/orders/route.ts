/**
 * 주문 관리 API Route (Node.js Runtime)
 *
 * GET  /api/orders?state=wait|done|cancel&market=KRW-BTC
 * → Upbit GET /v1/orders (주문 목록 조회)
 *
 * POST /api/orders
 * → Upbit POST /v1/orders (주문 생성)
 * → Body: { market, side, ord_type, price?, volume? }
 * → OrderSchema (zod)로 검증
 *
 * 세션 인증 필수
 * fetchUpbitAPI 사용 (requireAuth: true)
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { fetchUpbitAPI } from '@/lib/upbit-jwt'
import { OrderSchema } from '@/lib/validations/order.schema'
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

/** 주문 목록 조회 */
export async function GET(request: NextRequest) {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    const { searchParams } = new URL(request.url)

    // 선택적 필터 파라미터 구성
    const params: Record<string, string> = {}

    const state = searchParams.get('state')
    if (state) {
      params.state = state
    }

    const market = searchParams.get('market')
    if (market) {
      params.market = market
    }

    // Upbit 주문 목록 조회 API 호출
    const orders = await fetchUpbitAPI<UpbitOrder[]>('/v1/orders', {
      params: Object.keys(params).length > 0 ? params : undefined,
      requireAuth: true,
    })

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

    // Upbit 주문 생성 API 호출
    const orderBody: Record<string, unknown> = {
      market: orderData.market,
      side: orderData.side,
      ord_type: orderData.ord_type,
    }

    if (orderData.price) {
      orderBody.price = orderData.price
    }
    if (orderData.volume) {
      orderBody.volume = orderData.volume
    }

    const order = await fetchUpbitAPI<UpbitOrder>('/v1/orders', {
      method: 'POST',
      body: orderBody,
      requireAuth: true,
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
