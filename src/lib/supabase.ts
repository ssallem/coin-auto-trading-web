/**
 * Supabase 서버사이드 클라이언트 (Node.js Runtime 전용)
 *
 * service_role key를 사용하여 RLS를 바이패스합니다.
 * API Route에서만 사용하며, 클라이언트 컴포넌트에서 직접 호출하지 않습니다.
 *
 * 테이블: bot_config (id=1 고정 row)
 * 컬럼: trading, investment, risk, strategy, backtest, logging, notification (JSONB), updated_at
 */
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// Supabase 클라이언트 (싱글턴)
// ─────────────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.'
    )
  }

  return createClient(url, key)
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
