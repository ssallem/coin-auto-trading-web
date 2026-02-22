/**
 * Upbit WebSocket 연결 관리 훅
 *
 * Upbit 실시간 시세 WebSocket(wss://api.upbit.com/websocket/v1)에 연결하여
 * ticker/orderbook/trade 메시지를 수신하고 TanStack Query 캐시를 업데이트합니다.
 *
 * 주요 기능:
 * - 자동 재연결: 지수 백오프 (1s → 2s → 4s → 최대 30s)
 * - 탭 비활성화 시 연결 해제, 활성화 시 재연결
 * - 컴포넌트 언마운트 시 자동 cleanup
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { UpbitTicker, UpbitWSTickerMessage } from '@/types/upbit'

/** WebSocket 연결 상태 */
type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error'

/** 구독 메시지 타입 */
type SubscriptionType = 'ticker' | 'orderbook' | 'trade'

/** WebSocket 훅 파라미터 */
interface UseUpbitWebSocketOptions {
  /** 구독할 마켓 코드 목록 (예: ["KRW-BTC", "KRW-ETH"]) */
  markets: string[]
  /** 구독할 메시지 타입 목록 */
  types: SubscriptionType[]
  /** WebSocket 연결 활성화 여부 (기본: true) */
  enabled?: boolean
}

/** WebSocket 훅 반환값 */
interface UseUpbitWebSocketReturn {
  /** 현재 연결 상태 */
  status: WebSocketStatus
  /** 수동 재연결 함수 */
  reconnect: () => void
}

/** Upbit WebSocket 엔드포인트 */
const WS_URL = 'wss://api.upbit.com/websocket/v1'

/** 재연결 최대 대기 시간 (ms) */
const MAX_RECONNECT_DELAY = 30_000

/** 재연결 기본 대기 시간 (ms) */
const BASE_RECONNECT_DELAY = 1_000

/**
 * Upbit WebSocket 실시간 시세 구독 훅
 *
 * @param options - 구독 설정 (마켓, 타입, 활성화 여부)
 * @returns status - 연결 상태, reconnect - 수동 재연결 함수
 */
export function useUpbitWebSocket({
  markets,
  types,
  enabled = true,
}: UseUpbitWebSocketOptions): UseUpbitWebSocketReturn {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<WebSocketStatus>('closed')

  /** WebSocket 인스턴스 참조 */
  const wsRef = useRef<WebSocket | null>(null)
  /** 재연결 시도 횟수 (지수 백오프 계산용) */
  const reconnectCountRef = useRef(0)
  /** 재연결 타이머 ID */
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 의도적 종료 여부 (cleanup 시 재연결 방지) */
  const intentionalCloseRef = useRef(false)
  /** 최신 옵션 값을 참조하기 위한 ref */
  const marketsRef = useRef(markets)
  const typesRef = useRef(types)

  /** 옵션 값 동기화 */
  marketsRef.current = markets
  typesRef.current = types

  /**
   * WebSocket 구독 메시지를 생성합니다.
   * Upbit WebSocket 형식: [{"ticket":"..."}, {"type":"ticker","codes":["KRW-BTC"],"isOnlyRealtime":true}]
   */
  const buildSubscription = useCallback((): string => {
    const ticket = { ticket: `upbit-ws-${Date.now()}` }
    const subscriptions = typesRef.current.map((type) => ({
      type,
      codes: marketsRef.current,
      isOnlyRealtime: true,
    }))
    return JSON.stringify([ticket, ...subscriptions])
  }, [])

  /**
   * ticker 메시지를 수신하여 TanStack Query 캐시를 업데이트합니다.
   * 기존 캐시에서 해당 마켓 데이터만 교체합니다.
   */
  const handleTickerMessage = useCallback(
    (msg: UpbitWSTickerMessage) => {
      /* 현재 캐시된 모든 ticker 쿼리를 순회하며 업데이트 */
      queryClient.setQueriesData<UpbitTicker[]>(
        { queryKey: ['ticker'] },
        (oldData) => {
          if (!oldData) return oldData

          return oldData.map((ticker) => {
            if (ticker.market !== msg.code) return ticker

            /* WebSocket 메시지의 필드를 기존 ticker에 병합 */
            return {
              ...ticker,
              trade_price: msg.trade_price,
              signed_change_price: msg.signed_change_price,
              signed_change_rate: msg.signed_change_rate,
              acc_trade_price_24h: msg.acc_trade_price_24h,
              acc_trade_volume_24h: msg.acc_trade_volume_24h,
              high_price: msg.high_price,
              low_price: msg.low_price,
              opening_price: msg.opening_price,
              change: msg.change,
              timestamp: msg.timestamp,
            }
          })
        }
      )
    },
    [queryClient]
  )

  /**
   * WebSocket 연결을 생성합니다.
   */
  const connect = useCallback(() => {
    /* 마켓/타입이 없으면 연결하지 않음 */
    if (marketsRef.current.length === 0 || typesRef.current.length === 0) {
      return
    }

    /* 기존 연결이 있으면 정리 */
    if (wsRef.current) {
      intentionalCloseRef.current = true
      wsRef.current.close()
      wsRef.current = null
    }

    intentionalCloseRef.current = false
    setStatus('connecting')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('open')
      reconnectCountRef.current = 0

      /* 구독 메시지 전송 */
      ws.send(buildSubscription())
    }

    ws.onmessage = async (event: MessageEvent) => {
      try {
        /* Upbit WebSocket은 Blob으로 메시지를 전송 */
        let text: string
        if (event.data instanceof Blob) {
          text = await event.data.text()
        } else {
          text = event.data as string
        }

        const parsed: unknown = JSON.parse(text)

        /* 타입 가드: ticker 메시지인지 확인 */
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'type' in parsed &&
          (parsed as { type: string }).type === 'ticker'
        ) {
          handleTickerMessage(parsed as UpbitWSTickerMessage)
        }
      } catch {
        /* JSON 파싱 실패 시 무시 (ping/pong 등) */
      }
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus('closed')
      wsRef.current = null

      /* 의도적 종료가 아닌 경우 자동 재연결 */
      if (!intentionalCloseRef.current) {
        scheduleReconnect()
      }
    }
  }, [buildSubscription, handleTickerMessage])

  /**
   * 지수 백오프 방식으로 재연결을 예약합니다.
   * 1s → 2s → 4s → 8s → 16s → 30s (최대)
   */
  const scheduleReconnect = useCallback(() => {
    /* 기존 타이머가 있으면 취소 */
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectCountRef.current),
      MAX_RECONNECT_DELAY
    )

    reconnectCountRef.current += 1

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null
      connect()
    }, delay)
  }, [connect])

  /**
   * 수동 재연결 함수 (외부에서 호출 가능)
   */
  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0
    connect()
  }, [connect])

  /**
   * WebSocket 연결/해제 및 visibility 이벤트 관리
   */
  useEffect(() => {
    if (!enabled || markets.length === 0 || types.length === 0) {
      /* 비활성화 시 기존 연결 정리 */
      if (wsRef.current) {
        intentionalCloseRef.current = true
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      setStatus('closed')
      return
    }

    /* 초기 연결 */
    connect()

    /**
     * 탭 가시성 변화 핸들러
     * - 비활성화 시 연결 해제 (트래픽 절약)
     * - 활성화 시 재연결
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        /* 탭 비활성화: 연결 해제 */
        intentionalCloseRef.current = true
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current)
          reconnectTimerRef.current = null
        }
        setStatus('closed')
      } else {
        /* 탭 활성화: 재연결 */
        reconnectCountRef.current = 0
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    /* Cleanup: 언마운트 시 연결 해제 */
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      intentionalCloseRef.current = true

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [enabled, markets.join(','), types.join(','), connect])

  return { status, reconnect }
}
