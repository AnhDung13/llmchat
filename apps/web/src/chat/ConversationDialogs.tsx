// Hộp thoại đổi tên / xác nhận xoá một conversation (shadcn Dialog, AlertDialog).
// Dùng chung cho menu "⋯" ở sidebar và menu trên header của ChatPage.

import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Conversation } from '../lib/types'

/** Khớp @Size(max = 200) của ConversationRequest ở backend */
export const TITLE_MAX = 200

type Target = Pick<Conversation, 'id' | 'title'>

/** Nút bo tròn hẳn như ChatGPT */
const pill = 'h-9 rounded-full px-4'


/**
 * Giữ lại conversation cuối cùng khác null, để nội dung hộp thoại không biến mất
 * trong lúc chạy hiệu ứng đóng (khi cha đã đặt về null).
 */
function useLastTarget(target: Target | null) {
  const [last, setLast] = useState(target)
  if (target !== null && target !== last) setLast(target)
  return target ?? last
}

type RenameProps = {
  /** null = đóng */
  target: Target | null
  onClose(): void
  onRename(id: string, title: string): void
}

export function RenameDialog({ target, onClose, onRename }: RenameProps) {
  const shown = useLastTarget(target)
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        {shown && (
          // key: mở cho conversation khác thì form khởi tạo lại với tên của nó
          <RenameForm
            key={shown.id}
            target={shown}
            onSubmit={(title) => {
              onRename(shown.id, title)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RenameForm({ target, onSubmit }: { target: Target; onSubmit(title: string): void }) {
  const { t } = useTranslation('sidebar')
  const [title, setTitle] = useState(target.title)
  const trimmed = title.trim()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (trimmed && trimmed !== target.title) onSubmit(trimmed)
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t('renameTitle')}</DialogTitle>
      </DialogHeader>
      <Input
        className="h-10 rounded-xl px-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        maxLength={TITLE_MAX}
        aria-label={t('renameTitle')}
        autoFocus
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className={pill}>
            {t('cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" className={pill} disabled={!trimmed || trimmed === target.title}>
          {t('save')}
        </Button>
      </DialogFooter>
    </form>
  )
}

type DeleteProps = {
  /** null = đóng */
  target: Target | null
  onClose(): void
  onDelete(id: string): void
}

export function DeleteDialog({ target, onClose, onDelete }: DeleteProps) {
  const { t } = useTranslation('sidebar')
  const shown = useLastTarget(target)
  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent showCloseButton>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {/* Tên cuộc trò chuyện in đậm: <b> trong locales/<lang>/sidebar.json → deleteDescription */}
            <Trans
              t={t}
              i18nKey="deleteDescription"
              values={{ title: shown?.title }}
              components={{ b: <strong className="font-medium text-foreground" /> }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={pill}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className={pill} onClick={() => shown && onDelete(shown.id)}>
            {t('deleteConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
