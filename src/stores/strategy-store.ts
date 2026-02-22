/**
 * 전략 설정 임시 상태 Zustand 스토어
 *
 * 전략/리스크 설정 페이지에서 "저장" 전까지의 임시 변경 사항을 관리합니다.
 * - pendingStrategyConfig: 수정 중인 전략 설정 (null이면 변경 없음)
 * - pendingRiskConfig: 수정 중인 리스크 설정 (null이면 변경 없음)
 * - isDirty: 변경 사항 존재 여부 (저장 버튼 활성화 등에 사용)
 */
import { create } from 'zustand'
import type { StrategyConfig, RiskConfig } from '@/types/trading'

interface StrategyState {
  /** 수정 중인 전략 설정 (null이면 변경 없음) */
  pendingStrategyConfig: StrategyConfig | null
  /** 수정 중인 리스크 설정 (null이면 변경 없음) */
  pendingRiskConfig: RiskConfig | null
  /** 변경 사항 존재 여부 */
  isDirty: boolean

  /** 전략 설정 임시 저장 */
  setPendingStrategyConfig: (config: StrategyConfig) => void
  /** 리스크 설정 임시 저장 */
  setPendingRiskConfig: (config: RiskConfig) => void
  /** 임시 변경 사항 초기화 (저장 완료 또는 취소 시) */
  resetPending: () => void
}

export const useStrategyStore = create<StrategyState>()((set) => ({
  pendingStrategyConfig: null,
  pendingRiskConfig: null,
  isDirty: false,

  setPendingStrategyConfig: (config) =>
    set({ pendingStrategyConfig: config, isDirty: true }),

  setPendingRiskConfig: (config) =>
    set({ pendingRiskConfig: config, isDirty: true }),

  resetPending: () =>
    set({
      pendingStrategyConfig: null,
      pendingRiskConfig: null,
      isDirty: false,
    }),
}))
