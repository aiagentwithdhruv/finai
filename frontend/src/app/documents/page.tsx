'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import {
  Upload,
  CloudUpload,
  FileText,
  FileSpreadsheet,
  Search,
  ChevronDown,
  MoreHorizontal,
  List,
  LayoutGrid,
  X,
  Eye,
  Trash2,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'pending' | 'processing' | 'processed' | 'failed'
type DocType =
  | 'Annual Report'
  | 'Credit Memo'
  | 'Financial Statement'
  | 'Pitch Deck'
  | 'NDA'
  | 'Due Diligence'
  | 'Valuation Model'
  | 'Term Sheet'
type FileFormat = 'pdf' | 'xlsx' | 'docx'

interface Document {
  id: string
  filename: string
  type: DocType
  format: FileFormat
  status: DocStatus
  pages: number
  chunks: number
  uploadedBy: string
  company: string
  date: string
  size: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DOCUMENTS: Document[] = [
  {
    id: '1',
    filename: 'Meridian_Annual_Report_FY2025.pdf',
    type: 'Annual Report',
    format: 'pdf',
    status: 'processed',
    pages: 148,
    chunks: 312,
    uploadedBy: 'J. Wilson',
    company: 'Meridian Technology Solutions',
    date: '15 Jan 2026',
    size: '4.2 MB',
  },
  {
    id: '2',
    filename: 'Q3_Management_Accounts_Apex.xlsx',
    type: 'Financial Statement',
    format: 'xlsx',
    status: 'processing',
    pages: 28,
    chunks: 0,
    uploadedBy: 'S. Reynolds',
    company: 'Apex Financial Partners',
    date: '14 Jan 2026',
    size: '2.1 MB',
  },
  {
    id: '3',
    filename: 'CloudScale_Credit_Agreement_2025.pdf',
    type: 'Credit Memo',
    format: 'pdf',
    status: 'processed',
    pages: 56,
    chunks: 98,
    uploadedBy: 'P. Hughes',
    company: 'CloudScale Infrastructure',
    date: '13 Jan 2026',
    size: '4.7 MB',
  },
  {
    id: '4',
    filename: 'Nexo_Health_Pitch_Deck_Q4.pdf',
    type: 'Pitch Deck',
    format: 'pdf',
    status: 'failed',
    pages: 0,
    chunks: 0,
    uploadedBy: 'A. Morris',
    company: 'Nexo Health Technologies',
    date: '12 Jan 2026',
    size: '12.3 MB',
  },
  {
    id: '5',
    filename: 'Hartwell_NDA_Executed.pdf',
    type: 'NDA',
    format: 'pdf',
    status: 'processed',
    pages: 12,
    chunks: 22,
    uploadedBy: 'T. Kapoor',
    company: 'Hartwell Capital Group',
    date: '10 Jan 2026',
    size: '1.8 MB',
  },
  {
    id: '6',
    filename: 'Vantage_DD_Report_Draft.docx',
    type: 'Due Diligence',
    format: 'docx',
    status: 'processed',
    pages: 94,
    chunks: 187,
    uploadedBy: 'R. Blackwell',
    company: 'Vantage Analytics Corp',
    date: '09 Jan 2026',
    size: '3.2 MB',
  },
  {
    id: '7',
    filename: 'Sterling_Valuation_Model_v3.xlsx',
    type: 'Valuation Model',
    format: 'xlsx',
    status: 'processing',
    pages: 15,
    chunks: 0,
    uploadedBy: 'C. Lane',
    company: 'Sterling Logistics Holdings',
    date: '08 Jan 2026',
    size: '5.6 MB',
  },
  {
    id: '8',
    filename: 'Blackwood_Term_Sheet_Series_B.pdf',
    type: 'Term Sheet',
    format: 'pdf',
    status: 'pending',
    pages: 8,
    chunks: 0,
    uploadedBy: 'N. Marsh',
    company: 'Blackwood Renewables',
    date: '07 Jan 2026',
    size: '0.9 MB',
  },
]

const DOC_TYPE_OPTIONS: Array<DocType | 'All Types'> = [
  'All Types',
  'Annual Report',
  'Financial Statement',
  'Credit Memo',
  'Pitch Deck',
  'NDA',
  'Due Diligence',
  'Valuation Model',
  'Term Sheet',
]

const STATUS_OPTIONS: Array<DocStatus | 'All Statuses'> = [
  'All Statuses',
  'pending',
  'processing',
  'processed',
  'failed',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileIcon({ format }: { format: FileFormat }) {
  if (format === 'xlsx') {
    return (
      <div className="w-8 h-10 bg-[#10B981]/10 border border-[#10B981]/20 rounded flex items-center justify-center flex-shrink-0">
        <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
      </div>
    )
  }
  if (format === 'docx') {
    return (
      <div className="w-8 h-10 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-[#3B82F6]" />
      </div>
    )
  }
  return (
    <div className="w-8 h-10 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded flex items-center justify-center flex-shrink-0">
      <FileText className="w-4 h-4 text-[#EF4444]" />
    </div>
  )
}

function StatusCell({ status }: { status: DocStatus }) {
  if (status === 'processed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#10B981] text-xs">
        <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
        Processed
      </span>
    )
  }
  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#F59E0B] text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]" />
        </span>
        Processing
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#EF4444] text-xs">
        <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[#94A3B8] text-xs">
      <span className="w-1.5 h-1.5 bg-[#475569] rounded-full" />
      Pending
    </span>
  )
}

function docTypeBadgeVariant(type: DocType): 'blue' | 'green' | 'amber' | 'purple' | 'gray' | 'red' {
  switch (type) {
    case 'Annual Report':      return 'blue'
    case 'Financial Statement': return 'blue'
    case 'Credit Memo':        return 'amber'
    case 'Pitch Deck':         return 'purple'
    case 'NDA':                return 'green'
    case 'Due Diligence':      return 'amber'
    case 'Valuation Model':    return 'green'
    case 'Term Sheet':         return 'gray'
  }
}

function GridCard({ doc, onSelect }: { doc: Document; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#3B82F6]/30 transition-all cursor-pointer group"
    >
      <div className="aspect-[3/4] bg-[#12121A] rounded-lg mb-3 flex items-center justify-center">
        <FileText className="w-10 h-10 text-[#475569] group-hover:text-[#94A3B8] transition-colors" />
      </div>
      <div className="space-y-2">
        <h4 className="font-medium text-[#F8FAFC] text-xs truncate group-hover:text-[#3B82F6] transition-colors">
          {doc.filename}
        </h4>
        <div className="flex items-center justify-between">
          <Badge variant={docTypeBadgeVariant(doc.type)}>{doc.type}</Badge>
          <span className="text-[#475569] text-[10px] font-mono">{doc.pages > 0 ? `${doc.pages}p` : '—'}</span>
        </div>
        <div className="text-[#94A3B8] text-xs truncate">{doc.company}</div>
        <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
          <StatusCell status={doc.status} />
          <span className="text-[#475569] text-[10px] font-mono">{doc.size}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [typeFilter, setTypeFilter] = useState<DocType | 'All Types'>('All Types')
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'All Statuses'>('All Statuses')
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [chatMessage, setChatMessage] = useState('')

  const filtered = DOCUMENTS.filter((d) => {
    const matchesType = typeFilter === 'All Types' || d.type === typeFilter
    const matchesStatus = statusFilter === 'All Statuses' || d.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      d.filename.toLowerCase().includes(q) ||
      d.company.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    return matchesType && matchesStatus && matchesSearch
  })

  const processedCount = DOCUMENTS.filter((d) => d.status === 'processed').length

  return (
    <AppShell>
      <div className="flex gap-6 h-full" style={{ minHeight: 0 }}>
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Documents</h1>
              <p className="text-[#94A3B8] text-sm mt-0.5">
                {DOCUMENTS.length} documents — {processedCount} processed
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* View toggle */}
              <div className="flex items-center bg-[#12121A] border border-[#1E293B] rounded-lg p-1 gap-1">
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          </div>

          {/* Upload area — toggled */}
          {showUpload && (
            <div className="bg-[#16161F] border-2 border-dashed border-[#1E293B] hover:border-[#3B82F6]/50 rounded-xl p-8 text-center transition-colors">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  <CloudUpload className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-[#F8FAFC] font-medium mb-1">Drop files here or click to upload</p>
                  <p className="text-[#475569] text-xs">Supports: PDF, DOCX, XLSX, CSV — max 50 MB per file</p>
                </div>
                <button className="h-9 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors">
                  Browse Files
                </button>
              </div>
            </div>
          )}

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Doc type */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DocType | 'All Types')}
                className="appearance-none bg-[#12121A] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] pl-3 pr-8 py-2 focus:outline-none focus:border-[#3B82F6] cursor-pointer transition-colors"
              >
                {DOC_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocStatus | 'All Statuses')}
                className="appearance-none bg-[#12121A] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] pl-3 pr-8 py-2 focus:outline-none focus:border-[#3B82F6] cursor-pointer transition-colors capitalize"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-[#12121A] border border-[#1E293B] rounded-lg pl-8 pr-4 py-2 text-xs text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-colors w-52"
              />
            </div>
          </div>

          {/* Grid view */}
          {view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((doc) => (
                <GridCard key={doc.id} doc={doc} onSelect={() => setSelectedDoc(doc)} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center text-[#475569] text-sm">
                  No documents match your filters.
                </div>
              )}
            </div>
          ) : (
            /* List view */
            <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#1E293B]">
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider w-[28%]">Document</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Company</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Type</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Pages</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Chunks</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Uploaded By</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Date</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-center">Status</th>
                      <th className="py-3 px-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-[#475569]">
                          No documents match your filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((doc, idx) => (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/40 cursor-pointer transition-colors ${
                            idx % 2 === 1 ? 'bg-[#1A1A24]' : ''
                          } ${selectedDoc?.id === doc.id ? 'bg-[#3B82F6]/5' : ''}`}
                          style={{ height: '52px' }}
                        >
                          {/* Filename */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <FileIcon format={doc.format} />
                              <div className="min-w-0">
                                <div className="font-medium text-[#F8FAFC] truncate text-xs">{doc.filename}</div>
                                <div className="text-[#475569] text-[10px] mt-0.5">{doc.size}</div>
                              </div>
                            </div>
                          </td>
                          {/* Company */}
                          <td className="px-4 py-2.5 text-[#94A3B8] text-xs max-w-[140px]">
                            <div className="truncate">{doc.company}</div>
                          </td>
                          {/* Type */}
                          <td className="px-4 py-2.5">
                            <Badge variant={docTypeBadgeVariant(doc.type)}>{doc.type}</Badge>
                          </td>
                          {/* Pages */}
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#94A3B8] text-xs">
                            {doc.pages > 0 ? doc.pages : '—'}
                          </td>
                          {/* Chunks */}
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#94A3B8] text-xs">
                            {doc.chunks > 0 ? doc.chunks : '—'}
                          </td>
                          {/* Uploaded by */}
                          <td className="px-4 py-2.5 text-[#94A3B8] text-xs">{doc.uploadedBy}</td>
                          {/* Date */}
                          <td className="px-4 py-2.5 text-[#94A3B8] font-mono text-xs">{doc.date}</td>
                          {/* Status */}
                          <td className="px-4 py-2.5 text-center">
                            <StatusCell status={doc.status} />
                          </td>
                          {/* Actions */}
                          <td
                            className="px-4 py-2.5 text-center text-[#475569] hover:text-[#94A3B8] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4 mx-auto" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-[#1E293B]">
                <span className="text-xs text-[#475569]">
                  {filtered.length} of {DOCUMENTS.length} documents
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Detail side panel */}
        {selectedDoc && (
          <div className="w-80 flex-shrink-0 bg-[#16161F] border border-[#1E1E2E] rounded-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
              <span className="text-sm font-semibold text-[#F8FAFC]">Document Details</span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-[#475569] hover:text-[#F8FAFC] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#F8FAFC] break-words leading-snug">
                    {selectedDoc.filename}
                  </div>
                  <div className="text-xs text-[#475569] mt-0.5">{selectedDoc.company}</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Type', value: selectedDoc.type },
                  { label: 'Format', value: selectedDoc.format.toUpperCase() },
                  { label: 'Pages', value: selectedDoc.pages > 0 ? String(selectedDoc.pages) : '—' },
                  { label: 'Size', value: selectedDoc.size },
                  { label: 'Chunks', value: selectedDoc.chunks > 0 ? String(selectedDoc.chunks) : '—' },
                  { label: 'Uploaded by', value: selectedDoc.uploadedBy },
                  { label: 'Date', value: selectedDoc.date },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#475569] uppercase tracking-wider">{label}</span>
                    <span className="text-xs text-[#94A3B8] font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {/* Sample chunks */}
              {selectedDoc.status === 'processed' && (
                <div className="pt-2">
                  <div className="text-[11px] text-[#475569] uppercase tracking-wider mb-2">Sample Chunks</div>
                  {[
                    'Revenue increased 12.3% YoY to £382m, driven by recurring software performance...',
                    'EBITDA margin improved 120bps to 22.0%, reflecting operating leverage...',
                    'Net debt £124m, representing 1.5x LTM EBITDA, within stated target range...',
                  ].map((chunk, i) => (
                    <div
                      key={i}
                      className="bg-[#12121A] border border-[#1E293B] rounded p-3 mb-2 cursor-pointer hover:border-[#475569] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-[#475569] bg-[#1E293B] px-1.5 py-0.5 rounded">
                          Chunk {i + 1}
                        </span>
                        <ChevronRight className="w-3 h-3 text-[#475569]" />
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">{chunk}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 h-8 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button className="h-8 w-8 bg-[#12121A] border border-[#1E293B] hover:border-[#EF4444]/40 hover:bg-[#EF4444]/5 text-[#475569] hover:text-[#EF4444] text-xs rounded-lg transition-colors flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mini chat */}
            {selectedDoc.status === 'processed' && (
              <div className="border-t border-[#1E293B] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs font-medium text-[#F8FAFC]">Ask about this document</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="What is the EBITDA margin?"
                    className="flex-1 h-8 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 text-xs text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-colors"
                  />
                  <button className="h-8 px-3 bg-[#3B82F6] hover:bg-blue-500 text-white text-xs rounded-lg transition-colors">
                    Ask
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
