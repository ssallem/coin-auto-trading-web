'use client'

/**
 * 로그인 폼 - Client Component
 *
 * PIN 입력 → POST /api/auth/login → 성공 시 /portfolio 이동
 * shadcn/ui Card, Input, Button, Label 사용
 * sonner toast로 에러 메시지 표시
 */
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /** 로그인 폼 제출 핸들러 */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!pin.trim()) {
      toast.error('PIN을 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        toast.error(data.error ?? '로그인에 실패했습니다.')
        return
      }

      // 로그인 성공 → 포트폴리오 페이지로 이동
      toast.success('로그인 성공!')
      router.push('/portfolio')
    } catch {
      toast.error('서버에 연결할 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        {/* 아이콘 */}
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">코인 자동매매 대시보드</CardTitle>
        <CardDescription>PIN을 입력하세요</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* PIN 입력 필드 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              maxLength={10}
              placeholder="PIN 입력"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoading}
              autoFocus
              autoComplete="current-password"
            />
          </div>

          {/* 제출 버튼 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '인증 중...' : '로그인'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
