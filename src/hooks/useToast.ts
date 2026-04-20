'use client'

import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

let listenerFn: ((toast: ToastMessage) => void) | null = null

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast: addToast, dismiss }
}

export function toast(message: Omit<ToastMessage, 'id'>) {
  if (listenerFn) listenerFn({ ...message, id: crypto.randomUUID() })
}

export function setToastListener(fn: ((toast: ToastMessage) => void) | null) {
  listenerFn = fn
}
