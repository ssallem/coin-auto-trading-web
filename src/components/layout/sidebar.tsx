'use client'

/**
 * 사이드바 - Client Component
 *
 * 데스크탑: 고정 사이드바 (w-64), 접힘 모드 (w-16, 아이콘만)
 * 모바일: hidden (Header의 Sheet에서 SidebarContent를 재사용)
 * usePathname()으로 현재 경로 하이라이트
 * 하단: 로그아웃 버튼
 */
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CandlestickChart,
  ArrowLeftRight,
  Brain,
  History,
  Settings,
  LogOut,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

// ── 네비게이션 메뉴 정의 ──────────────────────
interface NavItemDef {
  title: string
  href: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItemDef[] = [
  { title: '포트폴리오', href: '/portfolio', icon: LayoutDashboard },
  { title: '매수 후보', href: '/candidates', icon: TrendingUp },
  { title: '차트', href: '/chart/KRW-BTC', icon: CandlestickChart },
  { title: '거래', href: '/trade', icon: ArrowLeftRight },
  { title: '전략', href: '/strategy', icon: Brain },
  { title: '거래내역', href: '/history', icon: History },
  { title: '설정', href: '/settings', icon: Settings },
]

/**
 * 사이드바 콘텐츠 (Sidebar, MobileSheet 공용)
 * @param onNavigate 네비게이션 후 콜백 (모바일 Sheet 닫기 등)
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  /** 로그아웃 처리: POST /api/auth/logout → /login 리다이렉트 */
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // 로그아웃 API 실패 시에도 클라이언트 측 리다이렉트 진행
    }
    router.push('/login')
  }

  /** 현재 경로가 메뉴 항목과 매칭되는지 확인 */
  function isActive(href: string): boolean {
    // /chart/KRW-BTC 등 하위 경로도 매칭
    if (href.startsWith('/chart')) {
      return pathname.startsWith('/chart')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="flex h-full flex-col">
      {/* 로고 / 앱 이름 */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CandlestickChart className="h-4 w-4" />
        </div>
        <span className="truncate text-lg font-bold tracking-tight">
          CoinAutoTrading
        </span>
      </div>

      <Separator />

      {/* 네비게이션 메뉴 */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant={active ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  active && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                )}
                onClick={() => {
                  router.push(item.href)
                  onNavigate?.()
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 로그아웃 버튼 */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">로그아웃</span>
        </Button>
      </div>
    </div>
  )
}

/**
 * 접힘 모드 사이드바 콘텐츠 (아이콘만 표시)
 */
function SidebarCollapsedContent() {
  const pathname = usePathname()
  const router = useRouter()

  /** 현재 경로가 메뉴 항목과 매칭되는지 확인 */
  function isActive(href: string): boolean {
    if (href.startsWith('/chart')) {
      return pathname.startsWith('/chart')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  /** 로그아웃 처리 */
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // 무시
    }
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col items-center">
      {/* 로고 (아이콘만) */}
      <div className="flex h-14 items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CandlestickChart className="h-4 w-4" />
        </div>
      </div>

      <Separator />

      {/* 네비게이션 (아이콘만) */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant={active ? 'secondary' : 'ghost'}
                size="icon"
                className={cn(
                  active && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
                title={item.title}
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 로그아웃 (아이콘만) */}
      <div className="py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          title="로그아웃"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * 데스크탑 사이드바
 *
 * 모바일에서는 hidden, md 이상에서 표시
 * sidebarCollapsed 상태에 따라 w-64 / w-16 전환
 */
export function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {sidebarCollapsed ? <SidebarCollapsedContent /> : <SidebarContent />}
    </aside>
  )
}
