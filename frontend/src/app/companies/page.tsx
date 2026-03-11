'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import Badge from '@/components/Badge'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyRow extends Record<string, unknown> {
  id: string
  name: string
  number: string
  sector: string
  status: 'active' | 'dissolved' | 'liquidation' | 'active-deal' | 'watchlist' | 'archived'
  lastUpdated: string
  country: string
}

type FilterKey = 'all' | 'uk' | 'us' | 'active' | 'dissolved'

// ─── API response shape ──────────────────────────────────────────────────────

interface ApiCompany {
  id: string
  name: string
  company_number: string | null
  sector: string | null
  country: string | null
  company_status: string | null
  website: string | null
  description: string | null
  created_at: string
  updated_at: string
}

function mapStatus(s: string | null): CompanyRow['status'] {
  if (!s) return 'active'
  const lower = s.toLowerCase()
  if (lower.includes('dissolved')) return 'dissolved'
  if (lower.includes('liquidation')) return 'liquidation'
  if (lower.includes('archived')) return 'archived'
  return 'active'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mapCompany(c: ApiCompany): CompanyRow {
  return {
    id: c.id,
    name: c.name,
    number: c.company_number || '—',
    sector: c.sector || 'General',
    status: mapStatus(c.company_status),
    lastUpdated: formatDate(c.updated_at),
    country: c.country || 'UK',
  }
}

// ─── Filters ─────────────────────────────────────────────────────────────────

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'uk', label: 'UK' },
  { key: 'us', label: 'US' },
  { key: 'active', label: 'Active' },
  { key: 'dissolved', label: 'Dissolved' },
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
    key: 'country',
    header: 'Country',
    render: (row) => <span className="text-[#94A3B8]">{row.country as string}</span>,
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

// ─── Add Company Modal ───────────────────────────────────────────────────────

function AddCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [country, setCountry] = useState('UK')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await api.post('/api/v1/companies', {
        name: name.trim(),
        sector: sector || undefined,
        country: country || undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-[#16161F] border border-[#1E1E2E] rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-[#F8FAFC]">Add Company</h3>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div>
          <label className="block text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Company Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]" />
        </div>
        <div>
          <label className="block text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Sector</label>
          <input value={sector} onChange={(e) => setSector(e.target.value)}
            placeholder="e.g. Technology, Healthcare"
            className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6]" />
        </div>
        <div>
          <label className="block text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 h-10 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !name.trim()}
            className="flex-1 h-10 bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  async function fetchCompanies() {
    setLoading(true)
    setError('')
    try {
      const res = await api.list<ApiCompany>('/api/v1/companies', { per_page: 100 })
      setCompanies(res.items.map(mapCompany))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const filtered = companies.filter((c) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'uk' && (c.country as string).toUpperCase().includes('UK')) ||
      (filter === 'us' && (c.country as string).toUpperCase().includes('US')) ||
      (filter === 'active' && c.status === 'active') ||
      (filter === 'dissolved' && c.status === 'dissolved')
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">Companies</h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              {loading ? 'Loading...' : `${filtered.length} compan${filtered.length === 1 ? 'y' : 'ies'} in portfolio`}
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] self-start sm:self-auto">
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
                onClick={() => setFilter(key)}
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

        {/* Loading / Error / Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
            <span className="ml-3 text-sm text-[#94A3B8]">Loading companies from Supabase...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
            <button onClick={fetchCompanies} className="text-sm text-[#3B82F6] underline ml-2">Retry</button>
          </div>
        ) : (
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-sm">
            <DataTable
              columns={COLUMNS}
              data={filtered}
              rowKey="id"
              onRowClick={(row) => router.push(`/companies/${row.id}`)}
              emptyMessage="No companies match your filters."
            />
          </div>
        )}
      </div>

      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onCreated={fetchCompanies} />}
    </DashboardLayout>
  )
}
