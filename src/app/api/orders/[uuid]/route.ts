/**
 * 개별 주문 관리 API Route (Node.js Runtime)
 *
 * GET    /api/orders/[uuid]
 * → Upbit GET /v1/order?uuid=... (주문 상세 조회)
 *
 * DELETE /api/orders/[uuid]
 * → Upbit DELETE /v1/order?uuid=... (주문 취소)
 *
 * 세션 인증 필수
 * fetchUpbitAPI 사용 (requireAuth: true)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { fetchUpbitAPI } from '@/lib/upbit-jwt'
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

    // Upbit 주문 상세 조회 API 호출
    const order = await fetchUpbitAPI<UpbitOrder>('/v1/order', {
      params: { uuid },
      requireAuth: true,
    })

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

    // Upbit 주문 취소 API 호출
    const order = await fetchUpbitAPI<UpbitOrder>('/v1/order', {
      method: 'DELETE',
      params: { uuid },
      requireAuth: true,
    })

    return NextResponse.json(order)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
