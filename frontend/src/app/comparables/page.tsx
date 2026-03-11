'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Plus, RefreshCw, Download, TrendingUp, TrendingDown } from 'lucide-react'

interface Comparable {
  id: string
  company: string
  ticker: string
  sector: 'Technology' | 'Financial Services' | 'Healthcare' | 'Energy'
  marketCap: string
  ev: string
  revenue: string
  ebitda: string
  evEbitda: number | null
  evRevenue: number
  pe: number | null
  revenueGrowth: number
}

const COMPARABLES: Comparable[] = [
  { id: '1', company: 'Sage Group plc', ticker: 'SGE.L', sector: 'Technology', marketCap: '£12.4B', ev: '£13.1B', revenue: '£2.3B', ebitda: '£580M', evEbitda: 22.6, evRevenue: 5.7, pe: 28.4, revenueGrowth: 8.1 },
  { id: '2', company: 'AVEVA Group plc', ticker: 'AVV.L', sector: 'Technology', marketCap: '£9.8B', ev: '£10.2B', revenue: '£1.5B', ebitda: '£420M', evEbitda: 24.3, evRevenue: 6.8, pe: 31.2, revenueGrowth: 12.3 },
  { id: '3', company: 'Kainos Group plc', ticker: 'KNOS.L', sector: 'Technology', marketCap: '£1.2B', ev: '£1.1B', revenue: '£380M', ebitda: '£72M', evEbitda: 15.3, evRevenue: 2.9, pe: 18.7, revenueGrowth: 5.2 },
  { id: '4', company: 'GSK plc', ticker: 'GSK.L', sector: 'Healthcare', marketCap: '£68.5B', ev: '£75.2B', revenue: '£29.3B', ebitda: '£8.2B', evEbitda: 9.2, evRevenue: 2.6, pe: 12.4, revenueGrowth: 3.8 },
  { id: '5', company: 'AstraZeneca plc', ticker: 'AZN.L', sector: 'Healthcare', marketCap: '£182.4B', ev: '£194.8B', revenue: '£37.4B', ebitda: '£11.8B', evEbitda: 16.5, evRevenue: 5.2, pe: 24.8, revenueGrowth: 14.2 },
  { id: '6', company: 'Rolls-Royce Holdings', ticker: 'RR.L', sector: 'Technology', marketCap: '£38.2B', ev: '£42.5B', revenue: '£15.4B', ebitda: '£2.8B', evEbitda: 15.2, evRevenue: 2.8, pe: 18.6, revenueGrowth: 22.4 },
  { id: '7', company: 'Lloyds Banking Group', ticker: 'LLOY.L', sector: 'Financial Services', marketCap: '£36.8B', ev: '£38.2B', revenue: '£18.2B', ebitda: '£6.4B', evEbitda: 6.0, evRevenue: 2.1, pe: 8.2, revenueGrowth: -2.1 },
  { id: '8', company: 'Barclays plc', ticker: 'BARC.L', sector: 'Financial Services', marketCap: '£28.4B', ev: '£29.8B', revenue: '£24.6B', ebitda: '£7.8B', evEbitda: 3.8, evRevenue: 1.2, pe: 6.8, revenueGrowth: 1.4 },
  { id: '9', company: 'BP plc', ticker: 'BP.L', sector: 'Energy', marketCap: '£78.3B', ev: '£104.6B', revenue: '£182.3B', ebitda: '£22.4B', evEbitda: 4.7, evRevenue: 0.6, pe: 7.1, revenueGrowth: -6.2 },
  { id: '10', company: 'Shell plc', ticker: 'SHEL.L', sector: 'Energy', marketCap: '£148.2B', ev: '£186.4B', revenue: '£234.8B', ebitda: '£38.6B', evEbitda: 4.8, evRevenue: 0.8, pe: 9.3, revenueGrowth: -8.4 },
]

const SECTORS = ['All', 'Technology', 'Financial Services', 'Healthcare', 'Energy'] as const
type SectorFilter = typeof SECTORS[number]

const sectorBadgeVariant: Record<Comparable['sector'], 'blue' | 'gray' | 'green' | 'amber'> = {
  Technology: 'blue',
  'Financial Services': 'gray',
  Healthcare: 'green',
  Energy: 'amber',
}

function evEbitdaColor(val: number | null): string {
  if (val === null) return 'text-[#475569]'
  if (val < 8) return 'text-[#10B981]'
  if (val > 18) return 'text-[#EF4444]'
  return 'text-[#F8FAFC]'
}

function GrowthCell({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <div className={`flex items-center justify-end gap-1 font-mono tabular-nums text-xs ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{value.toFixed(1)}%
    </div>
  )
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export default function ComparablesPage() {
  const [activeSector, setActiveSector] = useState<SectorFilter>('All')

  const filtered = activeSector === 'All'
    ? COMPARABLES
    : COMPARABLES.filter((c) => c.sector === activeSector)

  const validEvEbitda = filtered.filter((c) => c.evEbitda !== null).map((c) => c.evEbitda as number)
  const validEvRevenue = filtered.map((c) => c.evRevenue)
  const validPe = filtered.filter((c) => c.pe !== null).map((c) => c.pe as number)

  const medianEvEbitda = validEvEbitda.length ? median(validEvEbitda) : null
  const medianEvRevenue = validEvRevenue.length ? median(validEvRevenue) : null
  const medianPe = validPe.length ? median(validPe) : null

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Comparable Companies</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Peer company tracking with live market multiples — {filtered.length} companies</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="h-9 px-3 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh All
            </button>
            <button className="h-9 px-3 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </div>
        </div>

        {/* Sector filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSector(s)}
              className={`h-8 px-4 rounded-full text-xs font-medium transition-colors ${
                activeSector === s
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#12121A] border border-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#475569]'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-xs text-[#475569] font-mono ml-1">Last updated: 11 Mar 2026, 08:00 GMT</span>
        </div>

        {/* Data table */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E293B]">
            <h3 className="text-sm font-medium text-[#F8FAFC]">Market Comparables</h3>
            <span className="text-xs text-[#475569]">EV/EBITDA highlighted above 18x</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead>
                <tr className="border-b border-[#1E293B]">
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Company Name</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Ticker</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Sector</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Market Cap</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">EV</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Revenue</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">EBITDA</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">EV/EBITDA</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">EV/Revenue</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">P/E</th>
                  <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Rev Growth</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-[#1A1A24]' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-[#F8FAFC] min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#3B82F6]/10 flex-shrink-0 flex items-center justify-center text-[#3B82F6] text-[10px] font-bold">
                          {c.company[0]}
                        </div>
                        {c.company}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#94A3B8]">{c.ticker}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sectorBadgeVariant[c.sector]}>{c.sector}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#F8FAFC]">{c.marketCap}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#94A3B8]">{c.ev}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#94A3B8]">{c.revenue}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#94A3B8]">{c.ebitda}</td>
                    <td className={`px-4 py-3 text-right font-mono text-sm tabular-nums font-medium ${evEbitdaColor(c.evEbitda)}`}>
                      {c.evEbitda !== null ? `${c.evEbitda.toFixed(1)}x` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#94A3B8]">
                      {c.evRevenue.toFixed(1)}x
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#94A3B8]">
                      {c.pe !== null ? `${c.pe.toFixed(1)}x` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <GrowthCell value={c.revenueGrowth} />
                    </td>
                  </tr>
                ))}
                {/* Sector median row */}
                <tr className="border-t border-[#1E293B] bg-[#3B82F6]/5">
                  <td colSpan={7} className="px-4 py-3 text-[11px] text-[#3B82F6] font-medium uppercase tracking-wider">
                    {activeSector === 'All' ? 'Universe' : activeSector} Median
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-sm tabular-nums font-semibold ${evEbitdaColor(medianEvEbitda)}`}>
                    {medianEvEbitda !== null ? `${medianEvEbitda.toFixed(1)}x` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums font-semibold text-[#F8FAFC]">
                    {medianEvRevenue !== null ? `${medianEvRevenue.toFixed(1)}x` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums font-semibold text-[#F8FAFC]">
                    {medianPe !== null ? `${medianPe.toFixed(1)}x` : '—'}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">
            {activeSector === 'All' ? 'Universe' : activeSector} Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-1">Median EV/EBITDA</div>
              <div className={`text-2xl font-mono font-medium tabular-nums ${evEbitdaColor(medianEvEbitda)}`}>
                {medianEvEbitda !== null ? `${medianEvEbitda.toFixed(1)}x` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-1">Median EV/Revenue</div>
              <div className="text-2xl font-mono font-medium tabular-nums text-[#F8FAFC]">
                {medianEvRevenue !== null ? `${medianEvRevenue.toFixed(1)}x` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-1">Median P/E</div>
              <div className="text-2xl font-mono font-medium tabular-nums text-[#F8FAFC]">
                {medianPe !== null ? `${medianPe.toFixed(1)}x` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-1">Companies</div>
              <div className="text-2xl font-mono font-medium tabular-nums text-[#F8FAFC]">{filtered.length}</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
