/**
 * 전략 설정 관리 API Route (Node.js Runtime)
 *
 * GET  /api/strategy/config
 * → 전략 설정 파일을 읽어서 반환 (파일 없으면 기본값)
 *
 * POST /api/strategy/config
 * → 전략 설정을 파일에 저장
 * → Body: StrategyConfig
 * → StrategyConfigSchema (zod)로 검증
 *
 * 세션 인증 필수
 * 파일 기반 저장소: .strategy-config.json
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import {
  StrategyConfigSchema,
  RiskConfigSchema,
  type StrategyConfigOutput,
  type RiskConfigOutput,
} from '@/lib/validations/strategy.schema'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

/** strategy + risk 통합 스키마 */
const CombinedConfigSchema = z.object({
  strategy: StrategyConfigSchema,
  risk: RiskConfigSchema,
})

type CombinedConfigOutput = z.output<typeof CombinedConfigSchema>

/** 전략 설정 파일 경로 (process.cwd() 기반 상대경로) */
const CONFIG_FILE_PATH = path.join(process.cwd(), '.strategy-config.json')

/** 기본 전략 설정 (RSI 전략) */
const DEFAULT_STRATEGY: StrategyConfigOutput = {
  active: 'rsi',
  rsi: {
    period: 14,
    oversold: 30,
    overbought: 70,
  },
  ma_cross: {
    short_period: 5,
    long_period: 20,
    use_ema: false,
  },
  bollinger: {
    period: 20,
    std_dev: 2.0,
  },
}

/** 기본 리스크 관리 설정 */
const DEFAULT_RISK: RiskConfigOutput = {
  stop_loss_pct: 3,
  take_profit_pct: 5,
  trailing_stop: { enabled: false, pct: 2 },
  max_total_investment: 1_000_000,
  max_daily_loss: 100_000,
  max_positions: 5,
  per_trade_amount: 100_000,
}

/** 기본 통합 설정 */
const DEFAULT_CONFIG: CombinedConfigOutput = {
  strategy: DEFAULT_STRATEGY,
  risk: DEFAULT_RISK,
}

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
 * 설정 파일에서 전략+리스크 통합 설정을 읽어옵니다.
 * 파일이 없으면 기본값을 반환합니다.
 * Zod safeParse로 데이터 무결성을 검증합니다.
 * 기존 단일 StrategyConfig 형식도 하위 호환 처리합니다.
 */
async function readConfig(): Promise<CombinedConfigOutput> {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8')
    const parsed = JSON.parse(data) as unknown

    // 통합 구조({ strategy, risk }) 검증 시도
    const combinedResult = CombinedConfigSchema.safeParse(parsed)
    if (combinedResult.success) {
      return combinedResult.data
    }

    // 기존 단일 StrategyConfig 형식 하위 호환
    const strategyResult = StrategyConfigSchema.safeParse(parsed)
    if (strategyResult.success) {
      return { strategy: strategyResult.data, risk: DEFAULT_RISK }
    }

    // 모든 검증 실패 시 기본값 반환
    console.error('설정 파일 검증 실패:', combinedResult.error.issues)
    return DEFAULT_CONFIG
  } catch {
    // 파일이 없거나 읽기 실패 시 기본값 반환
    return DEFAULT_CONFIG
  }
}

/**
 * 전략+리스크 통합 설정을 파일에 저장합니다.
 * Vercel 서버리스 환경에서는 파일 쓰기가 불가하므로 에러를 적절히 처리합니다.
 */
async function writeConfig(config: CombinedConfigOutput): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.error('전략 설정 파일 저장 실패:', error)
    throw new Error(
      '설정 파일을 저장할 수 없습니다. 서버 환경에서 파일 시스템 쓰기가 지원되지 않을 수 있습니다.'
    )
  }
}

/** 전략+리스크 통합 설정 조회 */
export async function GET() {
  try {
    // 세션 검증
    const authError = await requireAuth()
    if (authError) return authError

    const config = await readConfig()
    return NextResponse.json(config)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** 전략+리스크 통합 설정 저장 */
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

    // Zod 스키마 검증 (통합 구조: { strategy, risk })
    const result = CombinedConfigSchema.safeParse(body)
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

    // 파일에 저장
    await writeConfig(result.data)

    return NextResponse.json({
      message: '설정이 저장되었습니다',
      config: result.data,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
