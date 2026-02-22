'use client'

/**
 * 헤더 - Client Component
 *
 * 모바일: 햄버거 메뉴 (Sheet 트리거) + 사이드바 콘텐츠를 Sheet으로 표시
 * 데스크탑: 사이드바 접힘 토글 + 페이지 타이틀
 * 우측: WebSocket 연결 상태 표시 (녹색/빨간 점)
 */
import { usePathname } from 'next/navigation'
import { Menu, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { SidebarContent } from '@/components/layout/sidebar'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

/** 경로 → 페이지 타이틀 매핑 */
const PAGE_TITLES: Record<string, string> = {
  '/portfolio': '포트폴리오',
  '/chart': '차트',
  '/trade': '거래',
  '/strategy': '전략 설정',
  '/history': '거래내역',
  '/settings': '설정',
}

/** 현재 경로에서 페이지 타이틀 추출 */
function getPageTitle(pathname: string): string {
  // 정확히 일치하는 경우
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  // /chart/KRW-BTC 등 하위 경로 매칭
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(path)) return title
  }

  return '대시보드'
}

export function Header() {
  const pathname = usePathname()
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen)
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen)
  const wsConnected = useUIStore((s) => s.wsConnected)

  const pageTitle = getPageTitle(pathname)

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      {/* 모바일: 햄버거 메뉴 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* 모바일: Sheet(슬라이드) 메뉴 */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>네비게이션 메뉴</SheetTitle>
            <SheetDescription>페이지 이동 메뉴입니다.</SheetDescription>
          </SheetHeader>
          <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 데스크탑: 사이드바 접힘 토글 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      {/* 페이지 타이틀 */}
      <h1 className="text-lg font-semibold">{pageTitle}</h1>

      {/* 우측 영역: spacer + WebSocket 상태 */}
      <div className="ml-auto flex items-center gap-2">
        {/* WebSocket 연결 상태 */}
        <div
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title={wsConnected ? 'WebSocket 연결됨' : 'WebSocket 연결 끊김'}
        >
          {wsConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <Wifi className={cn('h-4 w-4 text-green-500 hidden sm:block')} />
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <WifiOff className={cn('h-4 w-4 text-red-500 hidden sm:block')} />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
