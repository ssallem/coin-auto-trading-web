/**
 * 공유 상수 정의
 */

/** 모니터링 대상 유명 코인 (KRW 마켓 심볼) */
export const TOP_30_SYMBOLS = new Set([
  'BTC', 'ETH', 'XRP', 'SOL', 'DOGE',
  'ADA', 'AVAX', 'LINK', 'DOT', 'SHIB',
  'TRX', 'ATOM', 'ETC', 'XLM', 'ALGO',
  'NEAR', 'APT', 'ARB', 'OP', 'SAND',
  'MANA', 'AXS', 'HBAR', 'BTT', 'SUI',
  'SEI', 'STX', 'USDC',
])

/** 모니터링 대상 코인의 KRW 마켓 ID 배열 (e.g., 'KRW-BTC', 'KRW-ETH', ...) */
export const TOP_30_MARKETS = Array.from(TOP_30_SYMBOLS).map((symbol) => `KRW-${symbol}`)
