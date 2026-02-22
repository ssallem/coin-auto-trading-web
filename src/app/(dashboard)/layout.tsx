/**
 * 대시보드 레이아웃 - Server Component
 *
 * (dashboard) 라우트 그룹 하위 모든 페이지의 공통 레이아웃입니다.
 * Sidebar + Header + Main Content 구조.
 * 반응형: 데스크탑은 고정 사이드바, 모바일은 Header의 Sheet(슬라이드) 메뉴.
 */
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* 데스크탑 사이드바 (모바일에서는 hidden) */}
      <Sidebar />

      {/* 메인 영역: 헤더 + 콘텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
