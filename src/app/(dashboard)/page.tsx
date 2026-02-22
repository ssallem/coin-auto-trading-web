/**
 * 대시보드 루트 페이지
 *
 * / 경로 접근 시 /portfolio로 리다이렉트합니다.
 */
import { redirect } from 'next/navigation'

export default function DashboardRootPage() {
  redirect('/portfolio')
}
