/**
 * 포트폴리오 페이지 (Server Component)
 *
 * 포트폴리오 대시보드의 진입점입니다.
 * 제목을 렌더링하고 클라이언트 컴포넌트(PortfolioContent)를 마운트합니다.
 */
import { PortfolioContent } from '@/components/portfolio/portfolio-content'

export const metadata = {
  title: '포트폴리오 | Upbit 자동매매',
}

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">포트폴리오</h1>
        <p className="text-muted-foreground text-sm">
          보유 자산 현황과 손익을 실시간으로 확인합니다.
        </p>
      </div>

      {/* 클라이언트 콘텐츠 */}
      <PortfolioContent />
    </div>
  )
}
