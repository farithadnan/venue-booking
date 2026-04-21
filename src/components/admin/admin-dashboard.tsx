'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { LogOut, CalendarDays, Clock, CheckCircle2, XCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { BookingsTable } from '@/components/admin/bookings-table'
import { useBookings } from '@/hooks/useBookings'
import { useAdminAuth } from '@/hooks/useAdminAuth'

const STATUS_TABS = [
  { value: 'all', label: 'All', icon: CalendarDays },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
] as const

type TabValue = (typeof STATUS_TABS)[number]['value']

interface AdminDashboardProps {
  adminEmail: string
}

export function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { signOut, loading: loggingOut } = useAdminAuth()

  const params = {
    status: activeTab === 'all' ? undefined : activeTab,
    page,
    limit: 20,
  }

  const { data, loading, error, reload } = useBookings(params)

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleBookingUpdated = useCallback(() => {
    reload()
  }, [reload])

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return data?.data ?? []
    return (data?.data ?? []).filter(
      (b) =>
        b.user_name.toLowerCase().includes(term) ||
        b.date.includes(term) ||
        b.reference_number.toLowerCase().includes(term)
    )
  }, [data?.data, search])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-xs text-slate-500">The Grand Hall at Majestic Place</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-500">{adminEmail}</span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/venue">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Venue Settings</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} disabled={loggingOut}>
                {loggingOut ? <Spinner size="sm" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Bookings" value={data.pagination.total} color="slate" />
            <StatCard
              label="Pending"
              value={data.data.filter((b) => b.status === 'pending').length}
              color="amber"
              note={activeTab === 'all' ? 'current page' : undefined}
            />
            <StatCard
              label="Approved"
              value={data.data.filter((b) => b.status === 'approved').length}
              color="green"
              note={activeTab === 'all' ? 'current page' : undefined}
            />
            <StatCard
              label="Rejected"
              value={data.data.filter((b) => b.status === 'rejected').length}
              color="red"
              note={activeTab === 'all' ? 'current page' : undefined}
            />
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by name, date, or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button variant="outline" onClick={reload} size="default">
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabValue)}>
          <TabsList className="w-full sm:w-auto">
            {STATUS_TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {STATUS_TABS.map(({ value }) => (
            <TabsContent key={value} value={value} className="mt-4">
              <BookingsTable
                bookings={filteredBookings}
                loading={loading}
                error={error}
                pagination={
                  data
                    ? {
                        page: data.pagination.page,
                        totalPages: data.pagination.totalPages,
                        total: data.pagination.total,
                      }
                    : undefined
                }
                onPageChange={setPage}
                onBookingUpdated={handleBookingUpdated}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  note,
}: {
  label: string
  value: number
  color: 'slate' | 'amber' | 'green' | 'red'
  note?: string
}) {
  const colorMap = {
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  }
  const numColorMap = {
    slate: 'text-slate-900',
    amber: 'text-amber-700',
    green: 'text-green-700',
    red: 'text-red-700',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${numColorMap[color]}`}>{value}</p>
      {note && <p className="text-xs opacity-50 mt-0.5">{note}</p>}
    </div>
  )
}
