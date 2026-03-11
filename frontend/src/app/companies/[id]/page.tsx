'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import Badge from '@/components/Badge'
import {
  ChevronRight,
  RefreshCw,
  Plus,
  Sparkles,
  FileText,
  FileIcon,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  BarChart2,
  MapPin,
  Calendar,
  Hash,
  Globe,
  Building2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'financials' | 'documents' | 'officers'

interface FinancialRow {
  metric: string
  fy2021: { value: string; trend: 'up' | 'down' | 'neutral' }
  fy2022: { value: string; trend: 'up' | 'down' | 'neutral' }
  fy2023: { value: string; trend: 'up' | 'down' | 'neutral' }
  fy2024: { value: string; trend: 'up' | 'down' | 'neutral' }
  fy2025: { value: string; trend: 'up' | 'down' | 'neutral' }
  isAlt?: boolean
  invertTrend?: boolean
}

interface CompanyDocument {
  name: string
  type: string
  typeBadge: 'blue' | 'amber' | 'gray' | 'green'
  pages: string
  uploaded: string
  status: 'processed' | 'processing'
  icon: 'pdf' | 'word' | 'excel'
}

interface Officer {
  name: string
  role: string
  appointed: string
  resigned: string | null
  isAlt?: boolean
}

interface Charge {
  description: string
  status: 'outstanding' | 'satisfied'
  created: string
  delivered: string
  isAlt?: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const FINANCIALS: FinancialRow[] = [
  {
    metric: 'Revenue',
    fy2021: { value: '£16.5M', trend: 'up' },
    fy2022: { value: '£18.2M', trend: 'up' },
    fy2023: { value: '£20.1M', trend: 'up' },
    fy2024: { value: '£22.8M', trend: 'up' },
    fy2025: { value: '£24.5M', trend: 'up' },
  },
  {
    metric: 'EBITDA',
    fy2021: { value: '£2.5M', trend: 'up' },
    fy2022: { value: '£2.9M', trend: 'up' },
    fy2023: { value: '£3.4M', trend: 'up' },
    fy2024: { value: '£4.1M', trend: 'up' },
    fy2025: { value: '£4.5M', trend: 'up' },
    isAlt: true,
  },
  {
    metric: 'EBITDA Margin',
    fy2021: { value: '15.2%', trend: 'up' },
    fy2022: { value: '15.9%', trend: 'up' },
    fy2023: { value: '16.9%', trend: 'up' },
    fy2024: { value: '18.0%', trend: 'up' },
    fy2025: { value: '18.2%', trend: 'up' },
  },
  {
    metric: 'Net Income',
    fy2021: { value: '£1.5M', trend: 'up' },
    fy2022: { value: '£1.8M', trend: 'up' },
    fy2023: { value: '£2.1M', trend: 'up' },
    fy2024: { value: '£2.6M', trend: 'up' },
    fy2025: { value: '£2.9M', trend: 'up' },
    isAlt: true,
  },
  {
    metric: 'Total Assets',
    fy2021: { value: '£13.8M', trend: 'up' },
    fy2022: { value: '£15.4M', trend: 'up' },
    fy2023: { value: '£17.2M', trend: 'up' },
    fy2024: { value: '£19.8M', trend: 'up' },
    fy2025: { value: '£22.1M', trend: 'up' },
  },
  {
    metric: 'Net Debt',
    fy2021: { value: '£4.8M', trend: 'down' },
    fy2022: { value: '£4.2M', trend: 'down' },
    fy2023: { value: '£3.8M', trend: 'down' },
    fy2024: { value: '£3.1M', trend: 'down' },
    fy2025: { value: '£2.5M', trend: 'down' },
    isAlt: true,
    invertTrend: true,
  },
  {
    metric: 'Leverage (Debt/EBITDA)',
    fy2021: { value: '1.9x', trend: 'down' },
    fy2022: { value: '1.4x', trend: 'down' },
    fy2023: { value: '1.1x', trend: 'down' },
    fy2024: { value: '0.8x', trend: 'down' },
    fy2025: { value: '0.6x', trend: 'down' },
    invertTrend: true,
  },
]

const DOCUMENTS: CompanyDocument[] = [
  {
    name: 'Meridian_Annual_Accounts_2025.pdf',
    type: 'Financial Statement',
    typeBadge: 'blue',
    pages: '42',
    uploaded: '15 Jan 2026',
    status: 'processed',
    icon: 'pdf',
  },
  {
    name: 'Meridian_Tax_Return_2024.pdf',
    type: 'Tax Document',
    typeBadge: 'amber',
    pages: '28',
    uploaded: '08 Jan 2026',
    status: 'processed',
    icon: 'pdf',
  },
  {
    name: 'Meridian_Board_Minutes_Q4.pdf',
    type: 'Corporate',
    typeBadge: 'gray',
    pages: '12',
    uploaded: '22 Dec 2025',
    status: 'processing',
    icon: 'pdf',
  },
  {
    name: 'Meridian_Due_Diligence_Report.docx',
    type: 'Due Diligence',
    typeBadge: 'green',
    pages: '68',
    uploaded: '10 Nov 2025',
    status: 'processed',
    icon: 'word',
  },
  {
    name: 'Meridian_Financial_Model_v3.xlsx',
    type: 'Financial Model',
    typeBadge: 'blue',
    pages: '—',
    uploaded: '05 Nov 2025',
    status: 'processed',
    icon: 'excel',
  },
]

const OFFICERS: Officer[] = [
  { name: 'Sarah Mitchell', role: 'Chief Executive Officer', appointed: '14 Mar 2018', resigned: null },
  { name: 'James Richardson', role: 'Chief Financial Officer', appointed: '01 Jun 2019', resigned: null, isAlt: true },
  { name: 'Emma Thompson', role: 'Non-Executive Director', appointed: '15 Sep 2020', resigned: null },
  { name: 'David Chen', role: 'Company Secretary', appointed: '14 Mar 2018', resigned: '10 May 2023', isAlt: true },
]

const CHARGES: Charge[] = [
  {
    description: 'Fixed charge over intellectual property',
    status: 'outstanding',
    created: '18 Apr 2022',
    delivered: '22 Apr 2022',
  },
  {
    description: 'Floating charge over undertaking and assets',
    status: 'outstanding',
    created: '18 Apr 2022',
    delivered: '22 Apr 2022',
    isAlt: true,
  },
  {
    description: 'Fixed and floating charges',
    status: 'satisfied',
    created: '05 Nov 2019',
    delivered: '08 Nov 2019',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendArrow({ trend, invert = false }: { trend: 'up' | 'down' | 'neutral'; invert?: boolean }) {
  if (trend === 'neutral') return null
  const isPositive = invert ? trend === 'down' : trend === 'up'
  return isPositive ? (
    <TrendingUp className="w-2.5 h-2.5 text-[#10B981] flex-shrink-0" />
  ) : (
    <TrendingDown className="w-2.5 h-2.5 text-[#EF4444] flex-shrink-0" />
  )
}

function DocIcon({ type }: { type: CompanyDocument['icon'] }) {
  if (type === 'pdf') return <FileIcon className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
  if (type === 'word') return <FileIcon className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
  return <FileSpreadsheet className="w-4 h-4 text-[#10B981] flex-shrink-0" />
}

function ChartPlaceholder({ label, height = 220 }: { label: string; height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#1E293B] bg-[#0A0A0F]/50"
      style={{ height }}
    >
      <BarChart2 className="w-7 h-7 text-[#475569]" />
      <p className="text-xs text-[#475569]">{label}</p>
    </div>
  )
}

function InfoField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-1 font-medium">{label}</div>
      <div className={`text-sm text-[#F8FAFC] ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

// ─── Tab content components ───────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="p-6 space-y-6">
      {/* Company info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic info card */}
        <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#3B82F6]" />
            Company Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Company Name" value="Meridian Technology Solutions Ltd" />
            <InfoField label="Company Number" value="08745632" mono />
            <InfoField label="Sector" value="SaaS / Software" />
            <InfoField label="Status" value="Active" />
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Badge variant="green">Active</Badge>
            <Badge variant="blue">Active Deal</Badge>
            <Badge variant="blue">SaaS</Badge>
          </div>
        </div>

        {/* Registration card */}
        <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#3B82F6]" />
            Registration Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Incorporation Date" value="14 Mar 2018" mono />
            <InfoField label="Last Accounts Filed" value="15 Jan 2026" mono />
            <InfoField label="Country of Incorporation" value="England & Wales" />
            <InfoField label="Legal Form" value="Private Limited Company" />
          </div>
        </div>
      </div>

      {/* Address + SIC codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#3B82F6]" />
            Registered Address
          </h3>
          <address className="not-italic text-sm text-[#F8FAFC] leading-relaxed">
            25 Old Broad Street<br />
            London<br />
            EC2N 1HN<br />
            <span className="text-[#94A3B8]">England, United Kingdom</span>
          </address>
        </div>

        <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#3B82F6]" />
            SIC Codes
          </h3>
          <div className="space-y-2">
            {[
              { code: '62012', desc: 'Business and domestic software development' },
              { code: '62020', desc: 'Information technology consultancy activities' },
              { code: '63110', desc: 'Data processing, hosting and related activities' },
            ].map((sic) => (
              <div key={sic.code} className="flex items-start gap-3">
                <span className="font-mono text-xs text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                  {sic.code}
                </span>
                <span className="text-sm text-[#94A3B8]">{sic.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Web + description */}
      <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#3B82F6]" />
          About
        </h3>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          Meridian Technology Solutions Ltd is a UK-based SaaS company specialising in enterprise workflow automation and AI-powered document management for mid-market financial services firms. Founded in 2018, the company has grown revenue at a 10.4% CAGR and serves over 240 enterprise clients across the UK, Ireland, and the Nordics.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-3.5 h-3.5 text-[#475569]" />
          <a
            href="https://meridiantech.co.uk"
            className="text-[#3B82F6] hover:underline font-mono"
            target="_blank"
            rel="noopener noreferrer"
          >
            meridiantech.co.uk
          </a>
        </div>
      </div>
    </div>
  )
}

function FinancialsTab() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Financial table */}
        <div className="xl:col-span-3 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-left">
                  Metric
                </th>
                {['FY2021', 'FY2022', 'FY2023', 'FY2024', 'FY2025'].map((yr) => (
                  <th
                    key={yr}
                    className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right"
                  >
                    {yr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {FINANCIALS.map((row) => (
                <tr
                  key={row.metric}
                  className={`border-b border-[#1E293B]/50 ${row.isAlt ? 'bg-[#1A1A24]' : ''}`}
                >
                  <td className="px-4 py-3 text-[#F8FAFC] font-medium whitespace-nowrap">
                    {row.metric}
                  </td>
                  {([row.fy2021, row.fy2022, row.fy2023, row.fy2024, row.fy2025] as Array<{
                    value: string
                    trend: 'up' | 'down' | 'neutral'
                  }>).map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono tabular-nums text-[#F8FAFC]">{cell.value}</span>
                        <TrendArrow trend={cell.trend} invert={row.invertTrend} />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-4">
            <h4 className="text-sm font-medium text-[#F8FAFC] mb-3">Revenue &amp; EBITDA</h4>
            <ChartPlaceholder label="Revenue Trend" height={200} />
          </div>
          <div className="bg-[#12121A] border border-[#1E293B] rounded-xl p-4">
            <h4 className="text-sm font-medium text-[#F8FAFC] mb-3">Margin Trend</h4>
            <ChartPlaceholder label="Margin Trend" height={200} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsTab() {
  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-[#1E293B]">
              {[
                { label: 'Document Name', align: 'left' },
                { label: 'Type', align: 'left' },
                { label: 'Pages', align: 'right' },
                { label: 'Upload Date', align: 'left' },
                { label: 'Status', align: 'center' },
                { label: '', align: 'right' },
              ].map(({ label, align }) => (
                <th
                  key={label || 'actions'}
                  className={`py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider ${
                    align === 'right'
                      ? 'text-right'
                      : align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {DOCUMENTS.map((doc, idx) => (
              <tr
                key={doc.name}
                className={`border-b border-[#1E293B]/50 hover:bg-[#12121A]/30 transition-colors ${
                  idx % 2 === 1 ? 'bg-[#1A1A24]' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <DocIcon type={doc.icon} />
                    <span className="text-[#F8FAFC] font-medium">{doc.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={doc.typeBadge}>{doc.type}</Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-[#94A3B8]">
                  {doc.pages}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{doc.uploaded}</td>
                <td className="px-4 py-3 text-center">
                  {doc.status === 'processed' ? (
                    <span className="inline-flex items-center gap-1.5 text-[#10B981] text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Processed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[#94A3B8] text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-[#475569] hover:text-[#F8FAFC] transition-colors text-lg leading-none px-1">
                    ···
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OfficersTab() {
  return (
    <div className="p-6 space-y-8">
      {/* Officers */}
      <div>
        <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Directors & Officers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1E293B]">
                {['Name', 'Role', 'Appointed', 'Resigned'].map((h) => (
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
              {OFFICERS.map((officer) => (
                <tr
                  key={officer.name}
                  className={`border-b border-[#1E293B]/50 hover:bg-[#12121A]/30 transition-colors ${
                    officer.isAlt ? 'bg-[#1A1A24]' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center text-[10px] font-medium text-[#94A3B8] flex-shrink-0">
                        {officer.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="font-medium text-[#F8FAFC]">{officer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#94A3B8]">{officer.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{officer.appointed}</td>
                  <td className="px-4 py-3">
                    {officer.resigned ? (
                      <span className="font-mono text-xs text-[#EF4444]">{officer.resigned}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charges */}
      <div>
        <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Charges</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1E293B]">
                {['Description', 'Status', 'Created', 'Delivered to CH'].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider ${
                      i === 1 ? 'text-center' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {CHARGES.map((charge) => (
                <tr
                  key={charge.description}
                  className={`border-b border-[#1E293B]/50 hover:bg-[#12121A]/30 transition-colors ${
                    charge.isAlt ? 'bg-[#1A1A24]' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-[#F8FAFC]">{charge.description}</td>
                  <td className="px-4 py-3 text-center">
                    {charge.status === 'outstanding' ? (
                      <Badge variant="green">Outstanding</Badge>
                    ) : (
                      <Badge variant="gray">Satisfied</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{charge.created}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#94A3B8]">{charge.delivered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'financials', label: 'Financials' },
    { key: 'documents', label: 'Documents', count: DOCUMENTS.length },
    { key: 'officers', label: 'Officers', count: OFFICERS.length },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#94A3B8]">
          <Link href="/companies" className="hover:text-[#F8FAFC] transition-colors">
            Companies
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[#F8FAFC] truncate">Meridian Technology Solutions</span>
        </nav>

        {/* Company header card */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left: info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h1 className="text-xl font-semibold tracking-tight text-[#F8FAFC] truncate">
                  Meridian Technology Solutions Ltd
                </h1>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <Badge variant="blue">SaaS</Badge>
                  <Badge variant="green">Active</Badge>
                  <Badge variant="blue">Active Deal</Badge>
                </div>
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Revenue (FY2025)', value: '£24.5M', sub: '+7.5% YoY', positive: true },
                  { label: 'EBITDA Margin', value: '18.2%', sub: '+0.2pp YoY', positive: true },
                  { label: 'Net Debt', value: '£2.5M', sub: '0.6x EBITDA', positive: true },
                  { label: 'Total Assets', value: '£22.1M', sub: '+11.6% YoY', positive: true },
                ].map(({ label, value, sub, positive }) => (
                  <div key={label} className="bg-[#12121A] border border-[#1E293B] rounded-lg p-3">
                    <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-1 font-medium">
                      {label}
                    </div>
                    <div className="text-base font-mono tabular-nums text-[#F8FAFC] font-semibold leading-tight">
                      {value}
                    </div>
                    <div className={`text-xs font-mono mt-1 ${positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-row lg:flex-col gap-2 flex-wrap lg:min-w-[172px]">
              <button className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] whitespace-nowrap">
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Data
              </button>
              <button className="h-9 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-3.5 h-3.5" />
                Add to Deal
              </button>
              <button className="h-9 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                Generate Profile
              </button>
              <button className="h-9 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5" />
                View Filings
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-[#1E293B] flex overflow-x-auto">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-none px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === key
                    ? 'text-[#F8FAFC] border-[#3B82F6] bg-[#12121A]/40'
                    : 'text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:border-[#1E293B]'
                }`}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === key
                        ? 'bg-[#3B82F6]/20 text-[#3B82F6]'
                        : 'bg-[#1E293B] text-[#475569]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'financials' && <FinancialsTab />}
          {activeTab === 'documents' && <DocumentsTab />}
          {activeTab === 'officers' && <OfficersTab />}
        </div>
      </div>
    </DashboardLayout>
  )
}
