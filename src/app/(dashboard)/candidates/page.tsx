import type { Metadata } from 'next'
import { CandidatesContent } from '@/components/candidates/candidates-content'

export const metadata: Metadata = {
  title: '매수 후보',
}

/**
 * 매수 후보 페이지
 *
 * TOP 30 코인의 RSI 지표를 모니터링하여 매수 후보 종목을 표시합니다.
 */
export default function CandidatesPage() {
  return <CandidatesContent />
}
