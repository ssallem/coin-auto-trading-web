'use client'

/**
 * 확인 다이얼로그 컴포넌트
 *
 * 주문 생성/취소 등 중요한 작업 전에 사용자 확인을 받습니다.
 * shadcn/ui Dialog 기반으로 확인/취소 버튼을 제공합니다.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  /** 다이얼로그 열림 여부 */
  open: boolean
  /** 열림/닫힘 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void
  /** 다이얼로그 제목 */
  title: string
  /** 다이얼로그 설명 */
  description: string
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void
  /** 확인 버튼 텍스트 (기본: "확인") */
  confirmText?: string
  /** 취소 버튼 텍스트 (기본: "취소") */
  cancelText?: string
  /** 확인 버튼 스타일 변형 (기본: "default") */
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
}: ConfirmDialogProps) {
  /** 확인 버튼 클릭 시 핸들러 실행 후 다이얼로그 닫기 */
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
