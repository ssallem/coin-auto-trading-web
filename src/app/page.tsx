/**
 * 루트 페이지 (/)
 *
 * /portfolio로 리다이렉트합니다.
 * 미들웨어가 인증 여부를 먼저 확인하므로,
 * 비인증 사용자는 /login으로 리다이렉트됩니다.
 */
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/portfolio')
}
