/**
 * 로그인 페이지 - Server Component
 *
 * LoginForm 클라이언트 컴포넌트를 중앙 정렬하여 렌더링합니다.
 */
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: '로그인 | CoinAutoTrading',
  description: 'PIN을 입력하여 대시보드에 접근하세요.',
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginForm />
    </main>
  )
}
