'use client'

/**
 * 봇 설정 컨텐츠 (Client Component)
 *
 * 7개 탭으로 구성된 봇 전체 설정 관리 UI:
 * 거래설정 | 투자금액 | 리스크 | 전략 | 백테스팅 | 로깅 | 알림
 *
 * - useBotConfig()로 전체 설정 로드
 * - useUpdateBotConfig()로 섹션별 부분 업데이트
 * - 각 탭은 독립 섹션 컴포넌트로 분리
 */

import { useBotConfig, useUpdateBotConfig } from '@/hooks/use-bot-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardSkeleton } from '@/components/common/loading-skeleton'
import { TradingSection } from './sections/trading-section'
import { InvestmentSection } from './sections/investment-section'
import { RiskSection } from './sections/risk-section'
import { StrategySection } from './sections/strategy-section'
import { BacktestSection } from './sections/backtest-section'
import { LoggingSection } from './sections/logging-section'
import { NotificationSection } from './sections/notification-section'
import type { BotConfig } from '@/types/trading'

// ─────────────────────────────────────────────
// 탭 정의
// ─────────────────────────────────────────────

const TABS = [
  { value: 'trading', label: '거래설정' },
  { value: 'investment', label: '투자금액' },
  { value: 'risk', label: '리스크' },
  { value: 'strategy', label: '전략' },
  { value: 'backtest', label: '백테스팅' },
  { value: 'logging', label: '로깅' },
  { value: 'notification', label: '알림' },
] as const

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────

export function SettingsContent() {
  const { data, isLoading, error } = useBotConfig()
  const updateMutation = useUpdateBotConfig()

  /** 섹션별 저장 핸들러 */
  const handleSave = (patch: Partial<BotConfig>) => {
    updateMutation.mutate(patch)
  }

  /* 로딩 상태 */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  /* 에러 상태 */
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive text-sm font-medium">
          설정을 불러오는 중 오류가 발생했습니다
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="trading" className="w-full">
      {/* 탭 목록 - 모바일에서 가로 스크롤 */}
      <div className="overflow-x-auto">
        <TabsList className="w-full min-w-max">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* 거래설정 */}
      <TabsContent value="trading">
        <TradingSection
          data={data?.trading}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>

      {/* 투자금액 */}
      <TabsContent value="investment">
        <InvestmentSection
          data={data?.investment}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>

      {/* 리스크 */}
      <TabsContent value="risk">
        <RiskSection
          data={data?.risk}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>

      {/* 전략 */}
      <TabsContent value="strategy">
        <StrategySection
          data={data?.strategy}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>

      {/* 백테스팅 */}
      <TabsContent value="backtest">
        <BacktestSection
          data={data?.backtest}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>

      {/* 로깅 */}
      <TabsContent value="logging">
        <LoggingSection
          data={data?.logging}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>

      {/* 알림 */}
      <TabsContent value="notification">
        <NotificationSection
          data={data?.notification}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
        />
      </TabsContent>
    </Tabs>
  )
}
