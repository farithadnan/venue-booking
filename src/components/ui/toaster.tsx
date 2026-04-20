'use client'

import { useEffect } from 'react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast, setToastListener, type ToastMessage } from '@/hooks/useToast'

export function Toaster() {
  const { toasts, toast, dismiss } = useToast()

  useEffect(() => {
    setToastListener(toast)
    return () => setToastListener(null)
  }, [toast])

  return (
    <ToastProvider>
      {toasts.map((t: ToastMessage) => (
        <Toast key={t.id} variant={t.variant} onOpenChange={(open) => !open && dismiss(t.id)}>
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
