import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types'

interface StatusBadgeProps {
  status: BookingStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status} className="capitalize">
      {status}
    </Badge>
  )
}
