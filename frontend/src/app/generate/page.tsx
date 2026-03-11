'use client'

import { useState } from 'react'
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
} from 'lucide-react'

type ReviewStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'
type MaterialType = 'Credit Memo' | 'Deal Teaser'

interface Generation {
  id: string
  title: string
  type: MaterialType
  company: string
  status: ReviewStatus
  date: string
}

const RECENT_GENERATIONS: Generation[] = [
  { id: '1', title: 'Kainos Group Credit Analysis FY25', type: 'Credit Memo', company: 'Kainos Group plc', status: 'pending_review', date: '10 Mar 2026' },
  { id: '2', title: 'Project Atlas — Executive Teaser', type: 'Deal Teaser', company: 'Meridian Technology Solutions', status: 'approved', date: '09 Mar 2026' },
  { id: '3', title: 'AVEVA Group Credit Memo Q4', type: 'Credit Memo', company: 'AVEVA Group plc', status: 'draft', date: '08 Mar 2026' },
  { id: '4', title: 'Project Mercury — Deal Teaser v2', type: 'Deal Teaser', company: 'Confidential', status: 'approved', date: '07 Mar 2026' },
  { id: '5', title: 'Sage Group Credit Assessment', type: 'Credit Memo', company: 'Sage Group plc', status: 'rejected', date: '05 Mar 2026' },
]

const COMPANIES = [
  'Kainos Group plc',
  'Sage Group plc',
  'AVEVA Group plc',
  'Experian plc',
  'Meridian Technology Solutions',
  'Alfa Financial Software',
  'FDM Group Holdings',
  'Bytes Technology Group',
]

const DEAL_TYPES = ['M&A Buy-Side', 'M&A Sell-Side', 'Debt Financing', 'Equity Raise', 'Restructuring', 'IPO']

const statusConfig: Record<ReviewStatus, { variant: 'gray' | 'amber' | 'green' | 'red'; label: string }> = {
  draft: { variant: 'gray', label: 'Draft' },
  pending_review: { variant: 'amber', label: 'Pending Review' },
  approved: { variant: 'green', label: 'Approved' },
  rejected: { variant: 'red', label: 'Rejected' },
}

const typeConfig: Record<MaterialType, { variant: 'green' | 'blue' }> = {
  'Credit Memo': { variant: 'green' },
  'Deal Teaser': { variant: 'blue' },
}

const GENERATION_STEPS = ['Extracting source data', 'Running financial analysis', 'Generating content', 'Applying brand formatting', 'Quality review pass']

export default function GeneratePage() {
  const [activeModal, setActiveModal] = useState<'credit' | 'teaser' | null>(null)

  // Credit Memo form
  const [creditCompany, setCreditCompany] = useState('')

  // Deal Teaser form
  const [teaserDealType, setTeaserDealType] = useState('')
  const [teaserHighlights, setTeaserHighlights] = useState('')
  const [teaserAnonymize, setTeaserAnonymize] = useState(true)

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)

  function openModal(type: 'credit' | 'teaser') {
    setActiveModal(type)
    setGenerating(false)
    setDone(false)
    setCurrentStep(0)
    setCreditCompany('')
    setTeaserDealType('')
    setTeaserHighlights('')
    setTeaserAnonymize(true)
  }

  function closeModal() {
    setActiveModal(null)
    setGenerating(false)
    setDone(false)
  }

  function startGeneration() {
    setGenerating(true)
    setCurrentStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      setCurrentStep(step)
      if (step >= GENERATION_STEPS.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, 750)
  }

  const canGenerate = activeModal === 'credit'
    ? creditCompany !== ''
    : teaserDealType !== '' && teaserHighlights.trim().length > 0

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
                  value={creditCompany}
                  onChange={(e) => setCreditCompany(e.target.value)}
                  className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#10B981] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select a company...</option>
                  {COMPANIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
              </div>
            </div>
            <button
              onClick={() => openModal('credit')}
              disabled={!creditCompany}
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
              disabled={!canGenerate && activeModal !== 'credit'}
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
            <span className="text-xs text-[#475569]">{RECENT_GENERATIONS.length} materials</span>
          </div>
          <div className="overflow-x-auto">
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
                {RECENT_GENERATIONS.map((gen, i) => (
                  <tr
                    key={gen.id}
                    className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/30 transition-colors ${i % 2 === 1 ? 'bg-[#1A1A24]' : ''}`}
                  >
                    <td className="px-4 py-3 text-[#F8FAFC] font-medium max-w-[280px]">
                      <div className="truncate">{gen.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={typeConfig[gen.type].variant}>{gen.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] max-w-[200px]">
                      <div className="truncate">{gen.company}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[gen.status].variant}>
                        {statusConfig[gen.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">{gen.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded text-[#475569] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors" title="View">
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
              {!generating && !done && (
                <div className="space-y-4">
                  <p className="text-sm text-[#94A3B8]">
                    {activeModal === 'credit'
                      ? `Ready to generate a credit memo for ${creditCompany}. This will extract financials from all uploaded documents for this company.`
                      : `Ready to generate a deal teaser for a ${teaserDealType} transaction. The company name will ${teaserAnonymize ? 'be redacted' : 'remain visible'} in the output.`}
                  </p>
                  <div className="bg-[#12121A] border border-[#1E293B] rounded-lg p-3 space-y-1.5 text-xs text-[#94A3B8]">
                    <div className="flex items-center justify-between">
                      <span>Model</span>
                      <span className="font-mono text-[#F8FAFC]">claude-3-5-sonnet</span>
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
                    <button className="flex-1 h-10 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
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
    </AppShell>
  )
}
