'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Download, Search, ChevronLeft, ChevronRight, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface ApiAuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  request_id: string | null
  ip_address: string | null
  created_at: string
}

interface AuditEntry {
  id: string
  timestamp: string
  action: string
  actor: string
  entity: string
  details: string
  ip: string
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function mapAuditLog(a: ApiAuditLog): AuditEntry {
  const details = a.details
    ? Object.entries(a.details).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '—'
  return {
    id: a.id,
    timestamp: formatTimestamp(a.created_at),
    action: a.action,
    actor: a.user_email || a.user_id || 'system',
    entity: a.entity_type ? `${a.entity_type}${a.entity_id ? ` (${String(a.entity_id).slice(0, 8)}...)` : ''}` : '—',
    details: details.length > 120 ? details.slice(0, 120) + '...' : details,
    ip: a.ip_address || '—',
  }
}

const actionBadgeVariant: Record<string, 'blue' | 'purple' | 'green' | 'amber' | 'gray'> = {
  'document.upload': 'blue',
  'document.processed': 'blue',
  'generation.create': 'purple',
  'generation.approve': 'green',
  'generation.reject': 'amber',
  'chat.query': 'amber',
  'company.create': 'gray',
  'deal.create': 'gray',
}

const PAGE_SIZE = 10

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('')
  const [actorSearch, setActorSearch] = useState('')
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchLogs() {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { page, per_page: PAGE_SIZE }
      if (actionFilter) params.action = actionFilter
      if (actorSearch) params.user_id = actorSearch
      const res = await api.list<ApiAuditLog>('/api/v1/audit', params)
      setLogs(res.items.map(mapAuditLog))
      setTotal(res.meta.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [page, actionFilter])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Audit Log</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Complete activity trail — all user actions recorded and immutable</p>
          </div>
          <button className="h-9 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center gap-2 self-start md:self-auto">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative min-w-[200px]">
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="w-full h-9 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Actions</option>
              <option value="generation.create">Generation Created</option>
              <option value="generation.approve">Generation Approved</option>
              <option value="generation.reject">Generation Rejected</option>
              <option value="document.upload">Document Upload</option>
              <option value="chat.query">Chat Query</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              type="text"
              value={actorSearch}
              onChange={(e) => { setActorSearch(e.target.value); setPage(1) }}
              placeholder="Search by actor..."
              className="w-full h-9 bg-[#12121A] border border-[#1E293B] rounded-lg pl-9 pr-3 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          <span className="text-xs text-[#475569] sm:ml-auto">
            {loading ? '...' : `${total} entries`}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
            <span className="ml-3 text-sm text-[#94A3B8]">Loading audit logs...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
            <button onClick={fetchLogs} className="text-sm text-[#3B82F6] underline ml-2">Retry</button>
          </div>
        ) : (
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#1E293B]">
                    <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider w-[165px]">Timestamp</th>
                    <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Action</th>
                    <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Actor</th>
                    <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Entity</th>
                    <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Details</th>
                    <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[#475569]">
                        No audit entries found
                      </td>
                    </tr>
                  ) : (
                    logs.map((entry, i) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 transition-colors ${i % 2 === 1 ? 'bg-[#1A1A24]' : ''}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#475569] whitespace-nowrap">
                          {entry.timestamp}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={actionBadgeVariant[entry.action] || 'gray'}>
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[#F8FAFC] font-medium whitespace-nowrap">
                          {entry.actor}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] max-w-[160px]">
                          <div className="truncate">{entry.entity}</div>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] max-w-[280px]">
                          <div className="truncate text-xs">{entry.details}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#475569] whitespace-nowrap">
                          {entry.ip}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E293B]">
              <span className="text-xs text-[#475569]">
                {total === 0
                  ? 'No results'
                  : `Showing ${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded text-[#475569] hover:text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => idx + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                        page === p
                          ? 'bg-[#3B82F6] text-white'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded text-[#475569] hover:text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
