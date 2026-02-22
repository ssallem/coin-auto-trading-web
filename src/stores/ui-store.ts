/**
 * UI 상태 Zustand 스토어
 *
 * 사이드바 접힘/펼침, 차트 설정, 주문폼, WebSocket 연결 상태 등
 * 전역에서 공유되는 UI 관련 상태를 관리합니다.
 */
import { create } from 'zustand'
import type { CandleInterval } from '@/types/upbit'

interface UIState {
  // ── 사이드바 ──────────────────────────────
  /** 사이드바 접힘 여부 */
  sidebarCollapsed: boolean
  /** 사이드바 접힘 상태 설정 */
  setSidebarCollapsed: (collapsed: boolean) => void
  /** 사이드바 접힘 토글 */
  toggleSidebar: () => void

  // ── 모바일 시트 메뉴 ─────────────────────
  /** 모바일 Sheet 메뉴 열림 여부 */
  mobileMenuOpen: boolean
  /** 모바일 Sheet 메뉴 열림 상태 설정 */
  setMobileMenuOpen: (open: boolean) => void

  // ── 차트 설정 ─────────────────────────────
  /** 선택된 마켓 코드 (예: "KRW-BTC") */
  selectedMarket: string
  /** 선택된 캔들 인터벌 (분 단위) */
  selectedInterval: CandleInterval
  /** 마켓 변경 */
  setSelectedMarket: (market: string) => void
  /** 캔들 인터벌 변경 */
  setSelectedInterval: (interval: CandleInterval) => void

  // ── 주문폼 ────────────────────────────────
  /** 활성 주문 방향: bid(매수) / ask(매도) */
  activeOrderSide: 'bid' | 'ask'
  /** 주문 방향 변경 */
  setActiveOrderSide: (side: 'bid' | 'ask') => void

  // ── WebSocket 상태 ────────────────────────
  /** WebSocket 연결 상태 */
  wsConnected: boolean
  /** WebSocket 연결 상태 설정 */
  setWsConnected: (connected: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  // 사이드바
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // 모바일 시트 메뉴
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // 차트 설정
  selectedMarket: 'KRW-BTC',
  selectedInterval: '15',
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setSelectedInterval: (interval) => set({ selectedInterval: interval }),

  // 주문폼
  activeOrderSide: 'bid',
  setActiveOrderSide: (side) => set({ activeOrderSide: side }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}))
