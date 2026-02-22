/**
 * 차트 페이지 (Server Component)
 *
 * URL 파라미터에서 마켓 코드를 추출하여 ChartContent 클라이언트 컴포넌트에 전달합니다.
 * 예: /chart/KRW-BTC → market="KRW-BTC"
 */
import { ChartContent } from '@/components/chart/chart-content'

export const metadata = {
  title: '차트 | Upbit 자동매매',
}

interface ChartPageProps {
  params: Promise<{ market: string }>
}

export default async function ChartPage({ params }: ChartPageProps) {
  const { market } = await params

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 클라이언트 콘텐츠 (차트 + 호가 + 도구바) */}
      <ChartContent market={market} />
    </div>
  )
}
