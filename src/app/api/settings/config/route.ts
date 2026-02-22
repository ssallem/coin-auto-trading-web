/**
 * 봇 전체 설정 관리 API Route (Node.js Runtime)
 *
 * GET  /api/settings/config
 * → Supabase bot_config에서 7개 섹션 전체 + updated_at 반환
 *
 * PUT  /api/settings/config
 * → 부분 업데이트 (patch) - 전달된 섹션만 업데이트
 * → Body: BotConfigSchema.partial() 로 검증
 *
 * 세션 인증 필수
 * 저장소: Supabase bot_config 테이블 (id=1)
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { getBotConfig, updateBotConfig } from '@/lib/supabase'
import { BotConfigSchema } from '@/lib/validations/config.schema'

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

/** 봇 전체 설정 조회 */
export async function GET() {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    const config = await getBotConfig()
    return NextResponse.json(config)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** 봇 전체 설정 부분 업데이트 */
export async function PUT(request: NextRequest) {
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

    // Zod 스키마 검증 (부분 업데이트: partial)
    const PartialBotConfigSchema = BotConfigSchema.partial()
    const result = PartialBotConfigSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: '설정 검증 실패', details: errors },
        { status: 400 }
      )
    }

    // 빈 객체 체크
    const data = result.data
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 설정이 없습니다' },
        { status: 400 }
      )
    }

    // Supabase에 부분 업데이트
    const updated = await updateBotConfig(
      data as Record<string, unknown>
    )

    return NextResponse.json({
      message: '설정이 저장되었습니다',
      config: updated,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
