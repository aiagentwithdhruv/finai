'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import {
  FileText,
  Wand2,
  Eye,
  Download,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'

// ─── Backend types ──────────────────────────────────────────────────────────

type MaterialType = 'teaser' | 'credit_memo' | 'company_profile' | 'investment_presentation' | 'pipeline_report'
type MaterialStatus = 'generating' | 'draft' | 'in_review' | 'approved' | 'rejected'

interface ApiMaterial {
  id: string
  company_id: string
  deal_id: string | null
  material_type: MaterialType
  status: MaterialStatus
  title: string | null
  content: Record<string, unknown> | null
  source_document_ids: string[] | null
  model_used: string | null
  generation_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  version: number
  created_at: string
  updated_at: string
}

interface ApiCompany {
  id: string
  name: string
  company_number: string | null
  sector: string | null
}

// ─── Display config ─────────────────────────────────────────────────────────

const statusConfig: Record<MaterialStatus, { variant: 'gray' | 'amber' | 'green' | 'red' | 'blue'; label: string }> = {
  generating: { variant: 'blue', label: 'Generating' },
  draft: { variant: 'gray', label: 'Draft' },
  in_review: { variant: 'amber', label: 'Pending Review' },
  approved: { variant: 'green', label: 'Approved' },
  rejected: { variant: 'red', label: 'Rejected' },
}

const typeLabels: Record<MaterialType, string> = {
  credit_memo: 'Credit Memo',
  teaser: 'Deal Teaser',
  company_profile: 'Company Profile',
  investment_presentation: 'Presentation',
  pipeline_report: 'Pipeline Report',
}

const typeVariant: Record<MaterialType, 'green' | 'blue' | 'purple' | 'amber' | 'gray'> = {
  credit_memo: 'green',
  teaser: 'blue',
  company_profile: 'purple',
  investment_presentation: 'amber',
  pipeline_report: 'gray',
}

const DEAL_TYPES = ['M&A Buy-Side', 'M&A Sell-Side', 'Debt Financing', 'Equity Raise', 'Restructuring', 'IPO']
const GENERATION_STEPS = ['Extracting source data', 'Running financial analysis', 'Generating content', 'Applying brand formatting', 'Quality review pass']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GeneratePage() {
  const [activeModal, setActiveModal] = useState<'credit' | 'teaser' | null>(null)

  // Companies from API
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({})

  // Recent materials from API
  const [materials, setMaterials] = useState<ApiMaterial[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(true)

  // Credit Memo form — stores company ID
  const [creditCompanyId, setCreditCompanyId] = useState('')

  // Deal Teaser form
  const [teaserCompanyId, setTeaserCompanyId] = useState('')
  const [teaserDealType, setTeaserDealType] = useState('')
  const [teaserHighlights, setTeaserHighlights] = useState('')
  const [teaserAnonymize, setTeaserAnonymize] = useState(true)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)
  const [genError, setGenError] = useState('')
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null)

  // Document viewer
  const [viewingMaterial, setViewingMaterial] = useState<ApiMaterial | null>(null)

  // Load companies + materials on mount
  useEffect(() => {
    api.list<ApiCompany>('/api/v1/companies', { per_page: 50 })
      .then((res) => {
        setCompanies(res.items)
        const map: Record<string, string> = {}
        res.items.forEach((c) => { map[c.id] = c.name })
        setCompanyMap(map)
      })
      .catch(() => {})
  }, [])

  function loadMaterials() {
    setMaterialsLoading(true)
    api.list<ApiMaterial>('/api/v1/generate/materials', { per_page: 10 })
      .then((res) => setMaterials(res.items))
      .catch(() => {})
      .finally(() => setMaterialsLoading(false))
  }

  useEffect(() => { loadMaterials() }, [])

  function openModal(type: 'credit' | 'teaser') {
    setActiveModal(type)
    setGenerating(false)
    setDone(false)
    setGenError('')
    setCurrentStep(0)
  }

  function closeModal() {
    setActiveModal(null)
    setGenerating(false)
    setDone(false)
    setGenError('')
  }

  async function startGeneration() {
    setGenerating(true)
    setCurrentStep(0)
    setGenError('')

    // Animate steps while the real API call runs
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < GENERATION_STEPS.length) setCurrentStep(step)
    }, 800)

    try {
      const companyId = activeModal === 'credit' ? creditCompanyId : teaserCompanyId
      const body: Record<string, unknown> = {
        company_id: companyId,
        material_type: activeModal === 'credit' ? 'credit_memo' : 'teaser',
      }
      if (activeModal === 'teaser' && teaserHighlights.trim()) {
        body.generation_notes = `Deal type: ${teaserDealType}. ${teaserAnonymize ? 'Anonymize company name.' : ''} Key highlights: ${teaserHighlights}`
      }

      const result = await api.post<ApiMaterial>('/api/v1/generate', body)
      setLastGeneratedId(result.id)

      clearInterval(interval)
      setCurrentStep(GENERATION_STEPS.length)
      setDone(true)
      loadMaterials()
    } catch (err) {
      clearInterval(interval)
      setGenerating(false)
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    }
  }

  const canGenerateCredit = creditCompanyId !== ''
  const canGenerateTeaser = teaserCompanyId !== '' && teaserDealType !== '' && teaserHighlights.trim().length > 0

  const selectedCompanyName = activeModal === 'credit'
    ? companyMap[creditCompanyId] || ''
    : companyMap[teaserCompanyId] || ''

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Generate Material</h1>
          <p className="text-[#94A3B8] text-sm mt-1">AI-powered financial document generation with source attribution</p>
        </div>

        {/* Two generation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credit Memo */}
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6 shadow-sm hover:border-[#10B981]/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-[#10B981]/10 flex items-center justify-center mb-4 group-hover:bg-[#10B981]/20 transition-colors">
              <FileText className="w-6 h-6 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Credit Memo</h3>
            <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">
              Generate a structured credit analysis with financial ratios, leverage metrics, covenant terms, and risk assessment sourced directly from uploaded documents.
            </p>
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                Select Company
              </label>
              <div className="relative">
                <select
                  value={creditCompanyId}
                  onChange={(e) => setCreditCompanyId(e.target.value)}
                  className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#10B981] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select a company...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
              </div>
            </div>
            <button
              onClick={() => openModal('credit')}
              disabled={!canGenerateCredit}
              className="w-full h-10 px-4 bg-[#10B981] hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Credit Memo
            </button>
          </div>

          {/* Deal Teaser */}
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6 shadow-sm hover:border-[#3B82F6]/30 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center mb-4 group-hover:bg-[#3B82F6]/20 transition-colors">
              <Wand2 className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Deal Teaser</h3>
            <p className="text-sm text-[#94A3B8] mb-5 leading-relaxed">
              Generate a 1–5 page anonymous executive summary for deal marketing. Highlight key investment themes and financial profile.
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                  Select Company
                </label>
                <div className="relative">
                  <select
                    value={teaserCompanyId}
                    onChange={(e) => setTeaserCompanyId(e.target.value)}
                    className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Select a company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                  Deal Type
                </label>
                <div className="relative">
                  <select
                    value={teaserDealType}
                    onChange={(e) => setTeaserDealType(e.target.value)}
                    className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Select deal type...</option>
                    {DEAL_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                  Key Highlights
                </label>
                <textarea
                  value={teaserHighlights}
                  onChange={(e) => setTeaserHighlights(e.target.value)}
                  rows={3}
                  placeholder="e.g. Market leader in SMB SaaS, 30%+ ARR growth, high recurring revenues..."
                  className="w-full bg-[#12121A] border border-[#1E293B] rounded-lg px-3 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-colors resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#F8FAFC]">Anonymize Company</div>
                  <div className="text-[11px] text-[#475569] mt-0.5">Redact company name in output</div>
                </div>
                <button
                  onClick={() => setTeaserAnonymize((v) => !v)}
                  className="text-[#3B82F6] hover:text-blue-400 transition-colors"
                >
                  {teaserAnonymize
                    ? <ToggleRight className="w-8 h-8" />
                    : <ToggleLeft className="w-8 h-8 text-[#475569]" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => openModal('teaser')}
              disabled={!canGenerateTeaser}
              className="w-full h-10 px-4 bg-[#3B82F6] hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate Teaser
            </button>
          </div>
        </div>

        {/* Recent generations table */}
        <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
            <h2 className="text-sm font-semibold text-[#F8FAFC]">Recent Generations</h2>
            <span className="text-xs text-[#475569]">
              {materialsLoading ? '...' : `${materials.length} materials`}
            </span>
          </div>
          <div className="overflow-x-auto">
            {materialsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
                <span className="ml-3 text-sm text-[#94A3B8]">Loading materials...</span>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12 text-[#475569] text-sm">
                No generated materials yet. Select a company above and generate your first document.
              </div>
            ) : (
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#1E293B]">
                    {['Title', 'Type', 'Company', 'Status', 'Generated', 'Actions'].map((h) => (
                      <th key={h} className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {materials.map((mat, i) => (
                    <tr
                      key={mat.id}
                      className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 transition-colors ${i % 2 === 1 ? 'bg-[#1A1A24]' : ''}`}
                    >
                      <td className="px-4 py-3 text-[#F8FAFC] font-medium max-w-[280px]">
                        <div className="truncate">{mat.title || `${typeLabels[mat.material_type]} — ${mat.id.slice(0, 8)}`}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={typeVariant[mat.material_type]}>{typeLabels[mat.material_type]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] max-w-[200px]">
                        <div className="truncate">{companyMap[mat.company_id] || mat.company_id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[mat.status]?.variant || 'gray'}>
                          {statusConfig[mat.status]?.label || mat.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">{formatDate(mat.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const full = await api.get<ApiMaterial>(`/api/v1/generate/materials/${mat.id}`)
                                setViewingMaterial(full)
                              } catch { /* ignore */ }
                            }}
                            className="p-1.5 rounded text-[#475569] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 rounded text-[#475569] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Generation modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h3 className="text-base font-semibold text-[#F8FAFC]">
                {activeModal === 'credit' ? 'Generating Credit Memo' : 'Generating Deal Teaser'}
              </h3>
              {!generating && (
                <button onClick={closeModal} className="text-[#475569] hover:text-[#F8FAFC] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6">
              {genError && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              {!generating && !done && (
                <div className="space-y-4">
                  <p className="text-sm text-[#94A3B8]">
                    {activeModal === 'credit'
                      ? `Ready to generate a credit memo for ${selectedCompanyName}. This will extract financials from all uploaded documents for this company.`
                      : `Ready to generate a deal teaser for ${selectedCompanyName} — ${teaserDealType} transaction. The company name will ${teaserAnonymize ? 'be redacted' : 'remain visible'} in the output.`}
                  </p>
                  <div className="bg-[#12121A] border border-[#1E293B] rounded-lg p-3 space-y-1.5 text-xs text-[#94A3B8]">
                    <div className="flex items-center justify-between">
                      <span>Model</span>
                      <span className="font-mono text-[#F8FAFC]">grok-4.1-fast via OpenRouter</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Source documents</span>
                      <span className="font-mono text-[#F8FAFC]">Auto-detected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Review gate</span>
                      <span className="text-[#F59E0B]">Mandatory</span>
                    </div>
                  </div>
                </div>
              )}

              {generating && !done && (
                <div className="space-y-3 py-2">
                  <p className="text-sm text-[#94A3B8] mb-4">Generating your document...</p>
                  {GENERATION_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      {i < currentStep ? (
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      ) : i === currentStep ? (
                        <Loader2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#1E293B] flex-shrink-0" />
                      )}
                      <span className={`text-sm ${i < currentStep ? 'text-[#10B981]' : i === currentStep ? 'text-[#F8FAFC]' : 'text-[#475569]'}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {done && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-[#F8FAFC] mb-1">Document Generated</h4>
                  <p className="text-sm text-[#94A3B8]">
                    Saved as draft. A reviewer has been notified for sign-off before distribution.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="flex-1 h-10 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={async () => {
                        if (!lastGeneratedId) return
                        try {
                          const mat = await api.get<ApiMaterial>(`/api/v1/generate/materials/${lastGeneratedId}`)
                          setViewingMaterial(mat)
                          closeModal()
                        } catch { /* ignore */ }
                      }}
                      className="flex-1 h-10 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Document
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!generating && !done && (
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 h-10 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startGeneration}
                  className="flex-1 h-10 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Confirm & Generate
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Document viewer modal */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-base font-semibold text-[#F8FAFC] truncate">
                  {viewingMaterial.title || typeLabels[viewingMaterial.material_type]}
                </h3>
                <Badge variant={statusConfig[viewingMaterial.status]?.variant || 'gray'}>
                  {statusConfig[viewingMaterial.status]?.label || viewingMaterial.status}
                </Badge>
              </div>
              <button onClick={() => setViewingMaterial(null)} className="text-[#475569] hover:text-[#F8FAFC] transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Type', typeLabels[viewingMaterial.material_type]],
                  ['Company', companyMap[viewingMaterial.company_id] || viewingMaterial.company_id.slice(0, 8)],
                  ['Model', viewingMaterial.model_used || '—'],
                  ['Generated', formatDate(viewingMaterial.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#12121A] border border-[#1E293B] rounded-lg p-3">
                    <div className="text-[10px] text-[#475569] uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-xs text-[#F8FAFC] font-medium truncate">{value}</div>
                  </div>
                ))}
              </div>

              {/* Sections content */}
              {viewingMaterial.content && typeof viewingMaterial.content === 'object' && (
                <div className="space-y-4">
                  {(() => {
                    const content = viewingMaterial.content as Record<string, unknown>
                    const sections = (content.sections ?? content) as Record<string, unknown>
                    return Object.entries(sections).map(([key, value]) => {
                      if (typeof value !== 'string') return null
                      const title = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                      return (
                        <div key={key} className="bg-[#12121A] border border-[#1E293B] rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wider mb-2">{title}</h4>
                          <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{value}</p>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}

              {/* Cost info if available */}
              {viewingMaterial.content && (viewingMaterial.content as Record<string, unknown>).generation_cost_usd && (
                <div className="text-xs text-[#475569] font-mono text-right">
                  Generation cost: ${((viewingMaterial.content as Record<string, unknown>).generation_cost_usd as number).toFixed(4)}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#1E293B] flex-shrink-0">
              <button
                onClick={() => setViewingMaterial(null)}
                className="w-full h-10 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-sm font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
