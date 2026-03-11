'use client'

import { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const BAR_HEIGHTS = [40, 55, 45, 70, 60, 85, 100]

interface Counts {
  deals: number
  documents: number
  materials: number
  companies: number
}

export default function MetricsRow() {
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [companies, documents, deals, materials] = await Promise.allSettled([
          api.list('/api/v1/companies', { per_page: 1 }),
          api.list('/api/v1/documents', { per_page: 1 }),
          api.list('/api/v1/deals', { per_page: 1 }),
          api.list('/api/v1/generate/materials', { per_page: 1 }),
        ])
        setCounts({
          companies: companies.status === 'fulfilled' ? companies.value.meta.total : 0,
          documents: documents.status === 'fulfilled' ? documents.value.meta.total : 0,
          deals: deals.status === 'fulfilled' ? deals.value.meta.total : 0,
          materials: materials.status === 'fulfilled' ? materials.value.meta.total : 0,
        })
      } catch {
        setCounts({ deals: 0, documents: 0, materials: 0, companies: 0 })
      }
    }
    load()
  }, [])

  if (!counts) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Active Deals */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Active Deals
          </span>
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">{counts.deals}</div>
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor: `rgba(59,130,246,${0.2 + i * 0.12})`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Documents
          </span>
          <FileText className="w-4 h-4 text-[#475569]" />
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">{counts.documents}</div>
        <div className="text-xs text-[#94A3B8] mt-2 font-mono">In Supabase</div>
      </div>

      {/* Materials Generated */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Materials Generated
          </span>
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">{counts.materials}</div>
        <div className="text-xs text-[#94A3B8] mt-2 font-mono">Credit memos & teasers</div>
      </div>

      {/* Companies Tracked */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Companies Tracked
          </span>
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">{counts.companies}</div>
        <div className="text-xs text-[#94A3B8] mt-2 font-mono">Live from Supabase</div>
      </div>

    </div>
  )
}
