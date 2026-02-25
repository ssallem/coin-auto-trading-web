/**
 * 공유 상수 정의
 */

/** 유명 코인 30개 (KRW 마켓 심볼) */
export const TOP_30_SYMBOLS = new Set([
  'BTC', 'ETH', 'XRP', 'SOL', 'DOGE',
  'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC',
  'TRX', 'ATOM', 'ETC', 'XLM', 'ALGO',
  'NEAR', 'ICP', 'APT', 'ARB', 'OP',
  'SAND', 'MANA', 'AXS', 'HBAR', 'EOS',
  'BTT', 'SUI', 'SEI', 'STX', 'USDC',
])

/** 유명 코인 30개의 KRW 마켓 ID 배열 (e.g., 'KRW-BTC', 'KRW-ETH', ...) */
export const TOP_30_MARKETS = Array.from(TOP_30_SYMBOLS).map((symbol) => `KRW-${symbol}`)
