'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useUpdateBookingStatus } from '@/hooks/useUpdateBookingStatus'
import { toast } from '@/hooks/useToast'
import type { Booking } from '@/types'

interface BookingActionsProps {
  booking: Booking
  onUpdated: () => void
}

type Action = 'approved' | 'rejected' | null

export function BookingActions({ booking, onUpdated }: BookingActionsProps) {
  const [pendingAction, setPendingAction] = useState<Action>(null)
  const { update, loading } = useUpdateBookingStatus()

  if (booking.status !== 'pending') return null

  async function confirm() {
    if (!pendingAction) return
    const updated = await update(booking.id, pendingAction)
    if (updated) {
      onUpdated()
      toast({
        title: `Booking ${pendingAction}`,
        description: `${booking.user_name}'s booking has been ${pendingAction}.`,
        variant: pendingAction === 'approved' ? 'success' : 'default',
      })
    } else {
      toast({ title: 'Update failed', description: 'Please try again.', variant: 'destructive' })
    }
    setPendingAction(null)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => setPendingAction('approved')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setPendingAction('rejected')}
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>

      <Dialog open={pendingAction !== null} onOpenChange={() => setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === 'approved' ? 'Approve Booking?' : 'Reject Booking?'}
            </DialogTitle>
            <DialogDescription>
              This will {pendingAction === 'approved' ? 'approve' : 'reject'} the booking for{' '}
              <strong>{booking.user_name}</strong> ({booking.event_name}). An email notification will
              be sent to the guest. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={pendingAction === 'rejected' ? 'destructive' : 'default'}
              onClick={confirm}
              disabled={loading}
              className={pendingAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {loading ? <Spinner size="sm" /> : null}
              {pendingAction === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
