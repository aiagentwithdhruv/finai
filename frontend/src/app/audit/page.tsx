'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Download, Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

type AuditAction =
  | 'document_upload'
  | 'material_generated'
  | 'material_approved'
  | 'chat_query'
  | 'deal_created'
  | 'company_added'
  | 'settings_changed'
  | 'user_login'

interface AuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  actor: string
  entity: string
  details: string
  ip: string
}

const AUDIT_LOGS: AuditEntry[] = [
  { id: '1', timestamp: '2026-03-11 14:32:08', action: 'material_approved', actor: 'James Whitfield', entity: 'Project Atlas Teaser', details: 'Approved for distribution to 3 counterparties', ip: '10.0.1.42' },
  { id: '2', timestamp: '2026-03-11 14:18:55', action: 'chat_query', actor: 'Sarah Reeves', entity: 'Kainos Group plc', details: 'Query: "What is the net debt position as of FY25?"', ip: '10.0.1.61' },
  { id: '3', timestamp: '2026-03-11 13:52:21', action: 'material_generated', actor: 'Sarah Reeves', entity: 'Kainos Credit Memo FY25', details: 'Generated using claude-3-5-sonnet — 18 pages, 4 source docs', ip: '10.0.1.61' },
  { id: '4', timestamp: '2026-03-11 13:40:07', action: 'document_upload', actor: 'Peter Hamilton', entity: 'Kainos_Annual_Report_2025.pdf', details: '112 pages ingested, 847 chunks indexed via pgvector', ip: '10.0.2.18' },
  { id: '5', timestamp: '2026-03-11 12:15:33', action: 'deal_created', actor: 'James Whitfield', entity: 'Project Titan', details: 'New debt deal created — Glenbrook Property Group, £175M', ip: '10.0.1.42' },
  { id: '6', timestamp: '2026-03-11 11:48:14', action: 'chat_query', actor: 'Amanda Mills', entity: 'AVEVA Group plc', details: 'Query: "Summarise the key risks from the FY24 annual report"', ip: '10.0.1.77' },
  { id: '7', timestamp: '2026-03-11 11:22:06', action: 'company_added', actor: 'Peter Hamilton', entity: 'Meridian Technology Solutions', details: 'Added to deal tracker — Companies House no: 09847231', ip: '10.0.2.18' },
  { id: '8', timestamp: '2026-03-11 10:55:44', action: 'material_generated', actor: 'Amanda Mills', entity: 'AVEVA Group Credit Memo Q4', details: 'Generated using claude-3-5-sonnet — 22 pages, 6 source docs', ip: '10.0.1.77' },
  { id: '9', timestamp: '2026-03-11 10:31:18', action: 'document_upload', actor: 'Sarah Reeves', entity: 'AVEVA_H1_2025_Results.pdf', details: '48 pages ingested, 362 chunks indexed', ip: '10.0.1.61' },
  { id: '10', timestamp: '2026-03-11 09:48:52', action: 'settings_changed', actor: 'James Whitfield', entity: 'API Keys', details: 'OpenAI API key rotated — previous key revoked', ip: '10.0.1.42' },
  { id: '11', timestamp: '2026-03-11 09:15:03', action: 'user_login', actor: 'Amanda Mills', entity: 'Auth Session', details: 'Login via Chrome 122 on macOS 14.3 — MFA verified', ip: '10.0.1.77' },
  { id: '12', timestamp: '2026-03-11 09:02:29', action: 'user_login', actor: 'Peter Hamilton', entity: 'Auth Session', details: 'Login via Chrome 122 on Windows 11 — MFA verified', ip: '10.0.2.18' },
  { id: '13', timestamp: '2026-03-10 17:44:11', action: 'material_approved', actor: 'James Whitfield', entity: 'Sage Group Company Profile', details: 'Approved with no redactions — ready for deal team', ip: '10.0.1.42' },
  { id: '14', timestamp: '2026-03-10 16:30:58', action: 'chat_query', actor: 'Peter Hamilton', entity: 'Sage Group plc', details: 'Query: "Compare revenue growth to AVEVA over last 3 years"', ip: '10.0.2.18' },
  { id: '15', timestamp: '2026-03-10 15:12:37', action: 'document_upload', actor: 'Amanda Mills', entity: 'Sage_FY25_Annual_Report.pdf', details: '156 pages ingested, 1,203 chunks indexed', ip: '10.0.1.77' },
]

const ACTION_LABELS: Record<AuditAction, string> = {
  document_upload: 'Document Upload',
  material_generated: 'Material Generated',
  material_approved: 'Material Approved',
  chat_query: 'Chat Query',
  deal_created: 'Deal Created',
  company_added: 'Company Added',
  settings_changed: 'Settings Changed',
  user_login: 'User Login',
}

const actionBadgeVariant: Record<AuditAction, 'blue' | 'purple' | 'green' | 'amber' | 'gray'> = {
  document_upload: 'blue',
  material_generated: 'purple',
  material_approved: 'green',
  chat_query: 'amber',
  deal_created: 'gray',
  company_added: 'gray',
  settings_changed: 'gray',
  user_login: 'gray',
}

const ACTION_FILTER_OPTIONS = ['All Actions', ...Object.keys(ACTION_LABELS)] as const
const PAGE_SIZE = 8

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState('All Actions')
  const [actorSearch, setActorSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = AUDIT_LOGS.filter((e) => {
    const matchAction = actionFilter === 'All Actions' || e.action === actionFilter
    const matchActor = actorSearch === '' || e.actor.toLowerCase().includes(actorSearch.toLowerCase())
    return matchAction && matchActor
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleActionChange(val: string) {
    setActionFilter(val)
    setPage(1)
  }

  function handleSearchChange(val: string) {
    setActorSearch(val)
    setPage(1)
  }

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
          {/* Action type dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={actionFilter}
              onChange={(e) => handleActionChange(e.target.value)}
              className="w-full h-9 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors appearance-none cursor-pointer"
            >
              {ACTION_FILTER_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a === 'All Actions' ? 'All Actions' : ACTION_LABELS[a as AuditAction]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
          </div>

          {/* Actor search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              type="text"
              value={actorSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by actor..."
              className="w-full h-9 bg-[#12121A] border border-[#1E293B] rounded-lg pl-9 pr-3 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          <span className="text-xs text-[#475569] sm:ml-auto">{filtered.length} entries</span>
        </div>

        {/* Table */}
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
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#475569]">
                      No audit entries match the current filters
                    </td>
                  </tr>
                ) : (
                  paginated.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 transition-colors ${i % 2 === 1 ? 'bg-[#1A1A24]' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#475569] whitespace-nowrap">
                        {entry.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={actionBadgeVariant[entry.action]}>
                          {ACTION_LABELS[entry.action]}
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
              {filtered.length === 0
                ? 'No results'
                : `Showing ${((page - 1) * PAGE_SIZE) + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
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
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
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
      </div>
    </AppShell>
  )
}
