/**
 * 서버사이드 전용 - Upbit API 인증용 JWT 생성 유틸리티
 *
 * Upbit Exchange API는 JWT 인증이 필요하며, 다음 스펙을 따름:
 * - 알고리즘: HS256
 * - payload: { access_key, nonce, [query_hash, query_hash_alg] }
 * - nonce: UUID v4
 * - query_hash: 쿼리스트링의 SHA512 해시 (파라미터가 있는 요청)
 *
 * 참고: https://docs.upbit.com/docs/create-authorization-token
 */
import { SignJWT } from 'jose'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

/** Upbit API 기본 URL */
const UPBIT_API_BASE = 'https://api.upbit.com'

/**
 * 환경변수에서 Upbit API 키를 로드합니다.
 * @throws 환경변수가 설정되지 않은 경우 에러
 */
function getApiKeys(): { accessKey: string; secretKey: string } {
  const accessKey = process.env.UPBIT_ACCESS_KEY
  const secretKey = process.env.UPBIT_SECRET_KEY

  if (!accessKey || !secretKey) {
    throw new Error(
      'UPBIT_ACCESS_KEY 또는 UPBIT_SECRET_KEY 환경변수가 설정되지 않았습니다.'
    )
  }

  return { accessKey, secretKey }
}

/**
 * Upbit API JWT 토큰 생성 (파라미터 없는 요청용)
 *
 * 계좌 조회 등 쿼리 파라미터가 필요 없는 GET 요청에 사용합니다.
 *
 * @returns "Bearer {token}" 형태의 인증 헤더 값
 */
export async function generateUpbitJWT(): Promise<string> {
  const { accessKey, secretKey } = getApiKeys()

  const secret = new TextEncoder().encode(secretKey)

  const token = await new SignJWT({
    access_key: accessKey,
    nonce: uuidv4(),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secret)

  return `Bearer ${token}`
}

/**
 * Upbit API JWT 토큰 생성 (쿼리 파라미터가 있는 요청용)
 *
 * 주문 생성, 주문 조회 등 쿼리 파라미터가 필요한 요청에 사용합니다.
 * query_hash: 쿼리스트링을 SHA512로 해싱한 값
 *
 * @param queryParams - 쿼리 파라미터 키-값 쌍
 * @returns "Bearer {token}" 형태의 인증 헤더 값
 */
export async function generateUpbitJWTWithQuery(
  queryParams: Record<string, string>
): Promise<string> {
  const { accessKey, secretKey } = getApiKeys()

  // 쿼리스트링 직렬화
  const queryString = new URLSearchParams(queryParams).toString()

  // SHA512 해시 생성
  const queryHash = crypto
    .createHash('sha512')
    .update(queryString, 'utf-8')
    .digest('hex')

  const secret = new TextEncoder().encode(secretKey)

  const token = await new SignJWT({
    access_key: accessKey,
    nonce: uuidv4(),
    query_hash: queryHash,
    query_hash_alg: 'SHA512',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secret)

  return `Bearer ${token}`
}

/**
 * Upbit API 호출 래퍼 함수
 *
 * 인증이 필요한/불필요한 요청을 모두 처리합니다.
 * - requireAuth=true: JWT 토큰을 자동 생성하여 Authorization 헤더에 추가
 * - GET: params를 쿼리스트링으로 변환
 * - POST/DELETE: body를 JSON으로 전송
 *
 * @param endpoint - API 엔드포인트 (예: "/v1/accounts")
 * @param options - 요청 옵션
 * @returns 파싱된 JSON 응답
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchUpbitAPI<T>(
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'DELETE'
    params?: Record<string, string>
    body?: Record<string, unknown>
    requireAuth?: boolean
  }
): Promise<T> {
  const { method = 'GET', params, body, requireAuth = false } = options ?? {}

  // 요청 URL 구성
  let url = `${UPBIT_API_BASE}${endpoint}`

  // 요청 헤더 구성
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // 인증이 필요한 경우 JWT 토큰 생성
  if (requireAuth) {
    if (params && Object.keys(params).length > 0) {
      // 파라미터가 있는 인증 요청
      headers['Authorization'] = await generateUpbitJWTWithQuery(params)
    } else if (body && Object.keys(body).length > 0) {
      // POST body를 쿼리 파라미터 형태로 변환하여 해시 생성 (undefined/null 필터링)
      const bodyParams: Record<string, string> = {}
      for (const [key, value] of Object.entries(body)) {
        if (value !== undefined && value !== null) {
          bodyParams[key] = String(value)
        }
      }
      headers['Authorization'] = await generateUpbitJWTWithQuery(bodyParams)
    } else {
      // 파라미터 없는 인증 요청
      headers['Authorization'] = await generateUpbitJWT()
    }
  }

  // GET 요청: 쿼리스트링 추가
  if (method === 'GET' && params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  // fetch 요청 실행
  const response = await fetch(url, {
    method,
    headers,
    ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
  })

  // HTTP 에러 처리
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Upbit API 요청 실패: ${response.status} ${response.statusText} - ${errorBody}`
    )
  }

  // JSON 응답 파싱
  const data = (await response.json()) as T
  return data
}
