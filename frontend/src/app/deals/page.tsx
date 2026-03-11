'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Plus, Clock, ChevronDown, Filter, User } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type DealType = 'M&A' | 'Debt' | 'Equity'
type DealStage = 'Origination' | 'NDA Signed' | 'Due Diligence' | 'Negotiation' | 'Closed'

interface Deal {
  id: string
  codename: string
  company: string
  type: DealType
  stage: DealStage
  value: string
  estimatedValueRaw: number
  lastActivity: string
  team: string[]
  sector: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DEALS: Deal[] = [
  {
    id: '1',
    codename: 'Project Atlas',
    company: 'Meridian Technology Solutions',
    type: 'M&A',
    stage: 'Origination',
    value: '£142m',
    estimatedValueRaw: 142,
    lastActivity: '2h ago',
    team: ['JW', 'SR', 'PH'],
    sector: 'Technology',
  },
  {
    id: '2',
    codename: 'Project Mercury',
    company: 'Confidential — Retail',
    type: 'M&A',
    stage: 'NDA Signed',
    value: '£88m',
    estimatedValueRaw: 88,
    lastActivity: '5h ago',
    team: ['AM', 'TK'],
    sector: 'Retail',
  },
  {
    id: '3',
    codename: 'Project Vanguard',
    company: 'Apex Infrastructure Partners',
    type: 'Debt',
    stage: 'Due Diligence',
    value: '£220m',
    estimatedValueRaw: 220,
    lastActivity: '1d ago',
    team: ['RB', 'CL', 'JP', 'NM'],
    sector: 'Infrastructure',
  },
  {
    id: '4',
    codename: 'Project Falcon',
    company: 'SkyBridge Logistics Ltd',
    type: 'Equity',
    stage: 'Due Diligence',
    value: '£35m',
    estimatedValueRaw: 35,
    lastActivity: '3d ago',
    team: ['DG'],
    sector: 'Logistics',
  },
  {
    id: '5',
    codename: 'Project Orion',
    company: 'Castellan Healthcare plc',
    type: 'M&A',
    stage: 'Negotiation',
    value: '£310m',
    estimatedValueRaw: 310,
    lastActivity: '4h ago',
    team: ['JW', 'SR', 'AM', 'PH'],
    sector: 'Healthcare',
  },
  {
    id: '6',
    codename: 'Project Titan',
    company: 'Glenbrook Property Group',
    type: 'Debt',
    stage: 'NDA Signed',
    value: '£175m',
    estimatedValueRaw: 175,
    lastActivity: '4h ago',
    team: ['RB', 'DG', 'CL'],
    sector: 'Real Estate',
  },
  {
    id: '7',
    codename: 'Project Nova',
    company: 'Aldgate Fintech Ltd',
    type: 'Equity',
    stage: 'Closed',
    value: '£52m',
    estimatedValueRaw: 52,
    lastActivity: '2w ago',
    team: ['TK', 'NM'],
    sector: 'Fintech',
  },
]

const STAGES: DealStage[] = ['Origination', 'NDA Signed', 'Due Diligence', 'Negotiation', 'Closed']

const dealTypeConfig: Record<DealType, { variant: 'blue' | 'amber' | 'green' }> = {
  'M&A':    { variant: 'blue' },
  'Debt':   { variant: 'amber' },
  'Equity': { variant: 'green' },
}

// Stage accent colors for left border + column header
const stageAccent: Record<DealStage, string> = {
  Origination:    '#3B82F6',
  'NDA Signed':   '#8B5CF6',
  'Due Diligence': '#F59E0B',
  Negotiation:    '#06B6D4',
  Closed:         '#10B981',
}

// Stage header bg tints
const stageHeaderBg: Record<DealStage, string> = {
  Origination:    'bg-[#3B82F6]/5',
  'NDA Signed':   'bg-[#8B5CF6]/5',
  'Due Diligence': 'bg-[#F59E0B]/5',
  Negotiation:    'bg-[#06B6D4]/5',
  Closed:         'bg-[#10B981]/5',
}

const stageTextColor: Record<DealStage, string> = {
  Origination:    'text-[#3B82F6]',
  'NDA Signed':   'text-[#8B5CF6]',
  'Due Diligence': 'text-[#F59E0B]',
  Negotiation:    'text-[#06B6D4]',
  Closed:         'text-[#10B981]',
}

const AVATAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4']

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, index }: { initials: string; index: number }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white border-2 border-[#0A0A0F]"
      style={{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
    >
      {initials}
    </div>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div
      className="bg-[#12121A] border border-[#1E293B] rounded-lg p-3 cursor-pointer hover:shadow-lg hover:border-[#2D3748] transition-all group border-l-[3px]"
      style={{ borderLeftColor: stageAccent[deal.stage] }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#F8FAFC] truncate">{deal.codename}</div>
        </div>
        <Badge variant={dealTypeConfig[deal.type].variant}>{deal.type}</Badge>
      </div>

      {/* Company */}
      <p className="text-xs text-[#94A3B8] truncate mb-3">{deal.company}</p>

      {/* Value + sector */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm font-semibold text-[#F8FAFC] tabular-nums">{deal.value}</span>
        <span className="text-[10px] text-[#475569] px-1.5 py-0.5 rounded bg-[#0A0A0F] border border-[#1E293B]">
          {deal.sector}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {deal.team.slice(0, 3).map((initials, i) => (
            <Avatar key={initials} initials={initials} index={i} />
          ))}
          {deal.team.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-[#1E293B] border-2 border-[#0A0A0F] flex items-center justify-center text-[9px] text-[#94A3B8] font-medium">
              +{deal.team.length - 3}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#475569]">
          <Clock className="w-3 h-3" />
          {deal.lastActivity}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [view, setView] = useState<'board' | 'list'>('board')
  const [typeFilter, setTypeFilter] = useState<DealType | 'All Deal Types'>('All Deal Types')

  const dealsByStage = (stage: DealStage) =>
    DEALS.filter((d) => {
      const matchesType = typeFilter === 'All Deal Types' || d.type === typeFilter
      return d.stage === stage && matchesType
    })

  const stageTotal = (stage: DealStage) =>
    dealsByStage(stage).reduce((sum, d) => sum + d.estimatedValueRaw, 0)

  const visibleDeals =
    typeFilter === 'All Deal Types' ? DEALS : DEALS.filter((d) => d.type === typeFilter)

  return (
    <AppShell>
      <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Deals</h1>
            <p className="text-[#94A3B8] text-sm mt-0.5">
              Manage your deal pipeline and track progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center bg-[#12121A] border border-[#1E293B] rounded-lg p-0.5">
              <button
                onClick={() => setView('board')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  view === 'board'
                    ? 'bg-[#16161F] text-[#F8FAFC] shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-[#16161F] text-[#F8FAFC] shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                List
              </button>
            </div>
            <button className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <Plus className="w-4 h-4" />
              New Deal
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DealType | 'All Deal Types')}
              className="appearance-none bg-[#12121A] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] pl-7 pr-7 py-2 focus:outline-none focus:border-[#3B82F6] cursor-pointer transition-colors"
            >
              <option value="All Deal Types">All Deal Types</option>
              <option value="M&A">M&amp;A</option>
              <option value="Debt">Debt</option>
              <option value="Equity">Equity</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
          </div>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
            <select
              className="appearance-none bg-[#12121A] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] pl-7 pr-7 py-2 focus:outline-none focus:border-[#3B82F6] cursor-pointer transition-colors"
            >
              <option>All Team Members</option>
              <option>J. Wilson</option>
              <option>S. Reynolds</option>
              <option>P. Hughes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
          </div>
        </div>

        {view === 'board' ? (
          /* Kanban Board */
          <div className="overflow-x-auto pb-4 flex-1">
            <div className="flex gap-5 min-w-max h-full">
              {STAGES.map((stage) => {
                const stageDeals = dealsByStage(stage)
                return (
                  <div key={stage} className="w-72 bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden flex flex-col">
                    {/* Column header */}
                    <div className={`px-4 py-3 border-b border-[#1E293B] ${stageHeaderBg[stage]}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium flex items-center gap-2 ${stageTextColor[stage]}`}>
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stageAccent[stage] }}
                          />
                          {stage}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#475569] font-mono tabular-nums">
                            £{stageTotal(stage)}m
                          </span>
                          <span
                            className="text-[10px] text-[#475569] px-1.5 py-0.5 rounded-full border border-[#1E293B] bg-[#0A0A0F]"
                          >
                            {stageDeals.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                      {stageDeals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="border border-dashed border-[#1E293B] rounded-lg p-6 text-center text-[#475569] text-xs">
                          No deals in this stage
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#1E293B]">
                    {['Codename', 'Company', 'Type', 'Stage', 'Value', 'Team', 'Last Activity'].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {visibleDeals.map((deal, i) => (
                    <tr
                      key={deal.id}
                      className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 cursor-pointer transition-colors ${
                        i % 2 === 1 ? 'bg-[#1A1A24]' : ''
                      }`}
                      style={{ height: '52px', borderLeft: `3px solid ${stageAccent[deal.stage]}` }}
                    >
                      <td className="px-4 py-3 font-semibold text-[#F8FAFC]">{deal.codename}</td>
                      <td className="px-4 py-3 text-[#94A3B8] max-w-[180px]">
                        <div className="truncate">{deal.company}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={dealTypeConfig[deal.type].variant}>{deal.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stageAccent[deal.stage] }}
                          />
                          <span className="text-[#94A3B8]">{deal.stage}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#F8FAFC] tabular-nums font-semibold">
                        {deal.value}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex -space-x-1.5">
                          {deal.team.slice(0, 3).map((initials, idx) => (
                            <Avatar key={initials} initials={initials} index={idx} />
                          ))}
                          {deal.team.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-[#1E293B] border-2 border-[#0A0A0F] flex items-center justify-center text-[9px] text-[#94A3B8] font-medium">
                              +{deal.team.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#475569] text-xs font-mono">{deal.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#1E293B]">
              <span className="text-xs text-[#475569]">
                {visibleDeals.length} deal{visibleDeals.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
