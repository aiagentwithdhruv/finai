'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import Badge from '@/components/Badge'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import { Plus, Search, TrendingUp, TrendingDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyRow extends Record<string, unknown> {
  id: string
  name: string
  number: string
  sector: string
  status: 'active' | 'dissolved' | 'liquidation' | 'active-deal' | 'watchlist' | 'archived'
  lastUpdated: string
  ebitdaMargin: string
  ebitdaMarginRaw: number
  marginTrend: 'up' | 'down'
  region: 'UK' | 'US'
}

type FilterKey = 'all' | 'uk' | 'us' | 'active-deals' | 'watchlist'

// ─── Mock data ────────────────────────────────────────────────────────────────

const COMPANIES: CompanyRow[] = [
  {
    id: 'meridian',
    name: 'Meridian Technology Solutions Ltd',
    number: '08745632',
    sector: 'SaaS',
    status: 'active-deal',
    lastUpdated: '15 Jan 2026',
    ebitdaMargin: '18.2%',
    ebitdaMarginRaw: 18.2,
    marginTrend: 'up',
    region: 'UK',
  },
  {
    id: 'hartwell',
    name: 'Hartwell Capital Group plc',
    number: '03291847',
    sector: 'Financial Services',
    status: 'active',
    lastUpdated: '12 Dec 2025',
    ebitdaMargin: '22.4%',
    ebitdaMarginRaw: 22.4,
    marginTrend: 'up',
    region: 'UK',
  },
  {
    id: 'apex',
    name: 'Apex Financial Partners Ltd',
    number: '11083924',
    sector: 'Asset Management',
    status: 'watchlist',
    lastUpdated: '08 Nov 2025',
    ebitdaMargin: '31.7%',
    ebitdaMarginRaw: 31.7,
    marginTrend: 'down',
    region: 'UK',
  },
  {
    id: 'cloudscale',
    name: 'CloudScale Infrastructure Ltd',
    number: '12654018',
    sector: 'Cloud / Infrastructure',
    status: 'active-deal',
    lastUpdated: '22 Oct 2025',
    ebitdaMargin: '14.1%',
    ebitdaMarginRaw: 14.1,
    marginTrend: 'up',
    region: 'UK',
  },
  {
    id: 'nexo',
    name: 'Nexo Health Technologies Ltd',
    number: '09318276',
    sector: 'HealthTech',
    status: 'active',
    lastUpdated: '14 Sep 2025',
    ebitdaMargin: '8.6%',
    ebitdaMarginRaw: 8.6,
    marginTrend: 'down',
    region: 'UK',
  },
  {
    id: 'sterling',
    name: 'Sterling Logistics Holdings Ltd',
    number: '06827453',
    sector: 'Logistics',
    status: 'watchlist',
    lastUpdated: '03 Sep 2025',
    ebitdaMargin: '11.2%',
    ebitdaMarginRaw: 11.2,
    marginTrend: 'up',
    region: 'UK',
  },
  {
    id: 'blackwood',
    name: 'Blackwood Renewables plc',
    number: '10293847',
    sector: 'Energy',
    status: 'active',
    lastUpdated: '29 Aug 2025',
    ebitdaMargin: '19.8%',
    ebitdaMarginRaw: 19.8,
    marginTrend: 'up',
    region: 'UK',
  },
  {
    id: 'castleford',
    name: 'Castleford Properties Ltd',
    number: '04872651',
    sector: 'Real Estate',
    status: 'dissolved',
    lastUpdated: '10 Jun 2025',
    ebitdaMargin: '38.4%',
    ebitdaMarginRaw: 38.4,
    marginTrend: 'down',
    region: 'UK',
  },
]

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'uk', label: 'UK' },
  { key: 'us', label: 'US' },
  { key: 'active-deals', label: 'Active Deals' },
  { key: 'watchlist', label: 'Watchlist' },
]

function statusBadge(status: CompanyRow['status']) {
  switch (status) {
    case 'active':
      return <Badge variant="green">Active</Badge>
    case 'active-deal':
      return <Badge variant="blue">Active Deal</Badge>
    case 'watchlist':
      return <Badge variant="amber">Watchlist</Badge>
    case 'dissolved':
      return <Badge variant="red">Dissolved</Badge>
    case 'liquidation':
      return <Badge variant="red">Liquidation</Badge>
    case 'archived':
      return <Badge variant="gray">Archived</Badge>
  }
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: ColumnDef<CompanyRow>[] = [
  {
    key: 'name',
    header: 'Company Name',
    sortable: true,
    render: (row) => (
      <span className="font-medium text-[#F8FAFC] hover:text-[#3B82F6] transition-colors cursor-pointer">
        {row.name}
      </span>
    ),
  },
  {
    key: 'sector',
    header: 'Sector',
    sortable: true,
    render: (row) => <span className="text-[#94A3B8]">{row.sector}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (row) => statusBadge(row.status),
  },
  {
    key: 'number',
    header: 'Company No.',
    render: (row) => (
      <span className="font-mono text-xs text-[#94A3B8]">{row.number}</span>
    ),
  },
  {
    key: 'ebitdaMargin',
    header: 'EBITDA Margin',
    align: 'right',
    sortable: true,
    render: (row) => (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-mono tabular-nums text-[#F8FAFC]">{row.ebitdaMargin}</span>
        {row.marginTrend === 'up' ? (
          <TrendingUp className="w-3 h-3 text-[#10B981]" />
        ) : (
          <TrendingDown className="w-3 h-3 text-[#EF4444]" />
        )}
      </div>
    ),
  },
  {
    key: 'lastUpdated',
    header: 'Last Updated',
    sortable: true,
    render: (row) => (
      <span className="font-mono text-xs text-[#94A3B8]">{row.lastUpdated}</span>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')

  const filtered = COMPANIES.filter((c) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'uk' && c.region === 'UK') ||
      (filter === 'us' && c.region === 'US') ||
      (filter === 'active-deals' && c.status === 'active-deal') ||
      (filter === 'watchlist' && c.status === 'watchlist')
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  function onFilterChange(key: FilterKey) {
    setFilter(key)
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">Companies</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              {filtered.length} compan{filtered.length === 1 ? 'y' : 'ies'} in portfolio
            </p>
          </div>
          <button className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] self-start sm:self-auto">
            <Plus className="w-3.5 h-3.5" />
            Add Company
          </button>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30'
                    : 'bg-[#12121A] text-[#94A3B8] border border-[#1E293B] hover:text-[#F8FAFC] hover:border-[#475569]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter companies..."
              className="bg-[#12121A] border border-[#1E293B] rounded-lg pl-8 pr-4 py-2 text-xs text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-all w-52"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-sm">
          <DataTable
            columns={COLUMNS}
            data={filtered}
            rowKey="id"
            onRowClick={(row) => router.push(`/companies/${row.id}`)}
            emptyMessage="No companies match your filters."
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
