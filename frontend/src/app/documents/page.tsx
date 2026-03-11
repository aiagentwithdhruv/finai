'use client'

import { useState, useEffect, useRef } from 'react'
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
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'pending' | 'classifying' | 'parsing' | 'chunking' | 'embedding' | 'completed' | 'failed'

interface ApiDocument {
  id: string
  company_id: string | null
  deal_id: string | null
  filename: string
  file_path: string | null
  mime_type: string | null
  file_size_bytes: number | null
  document_type: string | null
  status: DocStatus
  page_count: number | null
  chunk_count: number | null
  source_url: string | null
  period_start: string | null
  period_end: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  filename: string
  type: string
  format: string
  status: DocStatus
  pages: number
  chunks: number
  date: string
  size: string
  companyId: string | null
  errorMessage: string | null
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getFormat(filename: string, mime: string | null): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf' || mime?.includes('pdf')) return 'pdf'
  if (ext === 'xlsx' || ext === 'xls' || mime?.includes('spreadsheet')) return 'xlsx'
  if (ext === 'docx' || ext === 'doc' || mime?.includes('word')) return 'docx'
  if (ext === 'csv') return 'csv'
  return ext || 'other'
}

function mapDocument(d: ApiDocument): Document {
  return {
    id: d.id,
    filename: d.filename,
    type: d.document_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Other',
    format: getFormat(d.filename, d.mime_type),
    status: d.status,
    pages: d.page_count || 0,
    chunks: d.chunk_count || 0,
    date: formatDate(d.created_at),
    size: formatBytes(d.file_size_bytes),
    companyId: d.company_id,
    errorMessage: d.error_message,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileIcon_({ format }: { format: string }) {
  if (format === 'xlsx' || format === 'csv') {
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
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#10B981] text-xs">
        <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
        Completed
      </span>
    )
  }
  if (['classifying', 'parsing', 'chunking', 'embedding'].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[#F59E0B] text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]" />
        </span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

function typeBadgeVariant(type: string): 'blue' | 'green' | 'amber' | 'purple' | 'gray' {
  const t = type.toLowerCase()
  if (t.includes('financial') || t.includes('annual') || t.includes('xbrl')) return 'blue'
  if (t.includes('credit') || t.includes('due')) return 'amber'
  if (t.includes('teaser') || t.includes('cim')) return 'purple'
  if (t.includes('legal') || t.includes('nda')) return 'green'
  return 'gray'
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
          <Badge variant={typeBadgeVariant(doc.type)}>{doc.type}</Badge>
          <span className="text-[#475569] text-[10px] font-mono">{doc.pages > 0 ? `${doc.pages}p` : '—'}</span>
        </div>
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
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'All Statuses'>('All Statuses')
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchDocuments() {
    setLoading(true)
    setError('')
    try {
      const res = await api.list<ApiDocument>('/api/v1/documents', { per_page: 100 })
      setDocuments(res.items.map(mapDocument))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocuments() }, [])

  async function handleFileUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        await api.upload('/api/v1/documents', formData)
      }
      setShowUpload(false)
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const filtered = documents.filter((d) => {
    const matchesStatus = statusFilter === 'All Statuses' || d.status === statusFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      d.filename.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const completedCount = documents.filter((d) => d.status === 'completed').length

  return (
    <AppShell>
      <div className="flex gap-6 h-full" style={{ minHeight: 0 }}>
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Documents</h1>
              <p className="text-[#94A3B8] text-sm mt-0.5">
                {loading ? 'Loading...' : `${documents.length} documents — ${completedCount} completed`}
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
            <div
              className="bg-[#16161F] border-2 border-dashed border-[#1E293B] hover:border-[#3B82F6]/50 rounded-xl p-8 text-center transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files) }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.csv"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
                  ) : (
                    <CloudUpload className="w-6 h-6 text-[#3B82F6]" />
                  )}
                </div>
                <div>
                  <p className="text-[#F8FAFC] font-medium mb-1">
                    {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
                  </p>
                  <p className="text-[#475569] text-xs">Supports: PDF, DOCX, XLSX, CSV — max 50 MB per file</p>
                </div>
                {!uploading && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
                  >
                    Browse Files
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocStatus | 'All Statuses')}
                className="appearance-none bg-[#12121A] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] pl-3 pr-8 py-2 focus:outline-none focus:border-[#3B82F6] cursor-pointer transition-colors capitalize"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="classifying">Classifying</option>
                <option value="parsing">Parsing</option>
                <option value="chunking">Chunking</option>
                <option value="embedding">Embedding</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
            </div>

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

          {/* Loading / Error */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
              <span className="ml-3 text-sm text-[#94A3B8]">Loading documents...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
              <button onClick={fetchDocuments} className="text-sm text-[#3B82F6] underline ml-2">Retry</button>
            </div>
          ) : view === 'grid' ? (
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
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#1E293B]">
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider w-[28%]">Document</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Type</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Pages</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-right">Chunks</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">Date</th>
                      <th className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider text-center">Status</th>
                      <th className="py-3 px-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-[#475569]">
                          No documents found. Upload a file to get started.
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
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <FileIcon_ format={doc.format} />
                              <div className="min-w-0">
                                <div className="font-medium text-[#F8FAFC] truncate text-xs">{doc.filename}</div>
                                <div className="text-[#475569] text-[10px] mt-0.5">{doc.size}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant={typeBadgeVariant(doc.type)}>{doc.type}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#94A3B8] text-xs">
                            {doc.pages > 0 ? doc.pages : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[#94A3B8] text-xs">
                            {doc.chunks > 0 ? doc.chunks : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-[#94A3B8] font-mono text-xs">{doc.date}</td>
                          <td className="px-4 py-2.5 text-center">
                            <StatusCell status={doc.status} />
                          </td>
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

              <div className="px-4 py-3 border-t border-[#1E293B]">
                <span className="text-xs text-[#475569]">
                  {filtered.length} of {documents.length} documents
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
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Type', value: selectedDoc.type },
                  { label: 'Format', value: selectedDoc.format.toUpperCase() },
                  { label: 'Pages', value: selectedDoc.pages > 0 ? String(selectedDoc.pages) : '—' },
                  { label: 'Size', value: selectedDoc.size },
                  { label: 'Chunks', value: selectedDoc.chunks > 0 ? String(selectedDoc.chunks) : '—' },
                  { label: 'Status', value: selectedDoc.status },
                  { label: 'Date', value: selectedDoc.date },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[#475569] uppercase tracking-wider">{label}</span>
                    <span className="text-xs text-[#94A3B8] font-mono">{value}</span>
                  </div>
                ))}
              </div>

              {selectedDoc.errorMessage && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3">
                  <p className="text-xs text-[#EF4444]">{selectedDoc.errorMessage}</p>
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
            {selectedDoc.status === 'completed' && (
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
