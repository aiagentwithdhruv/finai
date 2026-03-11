'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Plus,
  Paperclip,
  ArrowUp,
  ChevronRight,
  Database,
  PanelRight,
  X,
  AlignJustify,
  FileIcon,
  CheckCircle2,
  Search,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  filename: string
  pages: string
}

interface TableData {
  headers: string[]
  rows: Array<{ cells: string[]; highlight?: string }>
}

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  table?: TableData
  sources?: Source[]
  confidence?: 'high' | 'medium' | 'low'
}

interface Conversation {
  id: string
  title: string
  ago: string
  active?: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Meridian revenue analysis', ago: '2 hours ago', active: true },
  { id: '2', title: 'Project Atlas due diligence', ago: 'Yesterday' },
  { id: '3', title: 'Hartwell CIM key metrics', ago: '2 days ago' },
  { id: '4', title: 'Apex Financial comparables', ago: '3 days ago' },
  { id: '5', title: 'CloudScale valuation multiples', ago: '1 week ago' },
  { id: '6', title: 'Nexo Health market analysis', ago: '1 week ago' },
  { id: '7', title: 'Q4 portfolio performance', ago: '2 weeks ago' },
]

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'user',
    content: "What was Meridian's revenue growth rate over the last 3 years?",
  },
  {
    id: 'm2',
    role: 'ai',
    content:
      'Based on the filed annual accounts, Meridian Technology Solutions showed consistent revenue growth:\n\n- **FY2023:** £20.1M (+10.4% YoY)\n- **FY2024:** £22.8M (+13.4% YoY)\n- **FY2025:** £24.5M (+7.5% YoY)\n\nThe 3-year CAGR is approximately **10.4%**. Growth decelerated slightly in FY2025, though EBITDA margins expanded from 16.9% to 18.2% over the same period, suggesting improving operational efficiency.',
    sources: [
      { filename: 'Meridian_Annual_Accounts_2025.pdf', pages: 'Pages 8, 12' },
      { filename: 'Meridian_Annual_Accounts_2024.pdf', pages: 'Page 9' },
    ],
    confidence: 'high',
  },
  {
    id: 'm3',
    role: 'user',
    content: 'Compare their EBITDA margins to industry benchmarks',
  },
  {
    id: 'm4',
    role: 'ai',
    content:
      "Meridian's EBITDA margin progression compares favorably to UK SaaS sector benchmarks:\n\nMeridian consistently outperforms sector averages by **2.3–2.7 percentage points**, indicating superior cost discipline and operational leverage.",
    table: {
      headers: ['Period', 'Meridian', 'Industry Avg', 'Delta'],
      rows: [
        { cells: ['FY2023', '16.9%', '14.2%', '+2.7%'], highlight: 'success' },
        { cells: ['FY2024', '17.4%', '15.1%', '+2.3%'], highlight: 'success' },
        { cells: ['FY2025', '18.2%', '15.8%', '+2.4%'], highlight: 'success' },
      ],
    },
    sources: [
      { filename: 'Meridian_Annual_Accounts_2025.pdf', pages: 'Page 14' },
      { filename: 'UK_SaaS_Benchmark_Report_2025.pdf', pages: 'Pages 22-24' },
      { filename: 'Meridian_Management_Discussion_2025.pdf', pages: 'Page 6' },
    ],
    confidence: 'high',
  },
]

const CONTEXT_ITEMS = [
  {
    filename: 'Meridian_Annual_Accounts_2025.pdf',
    page: 'Page 8',
    score: '94%',
    scoreVariant: 'success' as const,
    excerpt:
      '"Revenue for the financial year ended 31 December 2025 was £24.5M, representing a year-on-year increase of 7.5%..."',
  },
  {
    filename: 'Meridian_Annual_Accounts_2025.pdf',
    page: 'Page 12',
    score: '91%',
    scoreVariant: 'success' as const,
    excerpt:
      '"EBITDA margin improved to 18.2% (FY2024: 17.4%), driven by operational efficiencies and economies of scale..."',
  },
  {
    filename: 'Meridian_Annual_Accounts_2024.pdf',
    page: 'Page 9',
    score: '87%',
    scoreVariant: 'warning' as const,
    excerpt:
      '"FY2024 revenue reached £22.8M, up 13.4% from the prior year\'s £20.1M, with strong performance across all product lines..."',
  },
  {
    filename: 'UK_SaaS_Benchmark_Report_2025.pdf',
    page: 'Page 22',
    score: '89%',
    scoreVariant: 'success' as const,
    excerpt:
      '"The median EBITDA margin for UK SaaS companies with £20-50M ARR stood at 15.8% in 2025, up from 15.1% in 2024..."',
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20',
    medium: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
    low: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
  }
  const labels = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[level]}`}>
      <CheckCircle2 className="w-2.5 h-2.5" />
      {labels[level]}
    </span>
  )
}

function SourcesToggle({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="pt-2 border-t border-[#1E293B]/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors group"
      >
        <ChevronRight
          className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''} group-hover:text-[#3B82F6]`}
        />
        <span className="font-medium">Sources ({sources.length})</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-4">
          {sources.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-[#94A3B8] hover:text-[#3B82F6] cursor-pointer transition-colors group"
            >
              <FileIcon className="w-3 h-3 text-[#EF4444] mt-0.5 flex-shrink-0" />
              <span className="group-hover:underline">
                {s.filename} — {s.pages}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InlineTable({ table }: { table: TableData }) {
  return (
    <div className="overflow-x-auto -mx-1 my-2">
      <table className="w-full text-xs border-collapse min-w-[400px]">
        <thead>
          <tr className="border-b border-[#1E293B]/50">
            {table.headers.map((h, i) => (
              <th
                key={i}
                className={`py-2 px-2 text-[#475569] font-medium ${i > 0 ? 'text-right' : 'text-left'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {table.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[#1E293B]/30">
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`py-2 px-2 ${ci === 0 ? 'text-[#94A3B8]' : 'text-right'} ${
                    ci === table.headers.length - 1 && row.highlight === 'success'
                      ? 'text-[#10B981]'
                      : ''
                  } ${
                    ci === 1 && ri === table.rows.length - 1 ? 'text-[#10B981] font-medium' : ''
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%] bg-[#1E3A5F] rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm text-[#F8FAFC]">{message.content}</p>
        </div>
      </div>
    )
  }

  const paragraphs = message.content.split('\n\n').filter(Boolean)

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] md:max-w-[75%] bg-[#16161F] border border-[#1E1E2E] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm space-y-3">
        <div className="text-sm text-[#F8FAFC] leading-relaxed space-y-2">
          {paragraphs.map((para, i) => {
            if (para.startsWith('- ')) {
              const items = para.split('\n').filter((l) => l.startsWith('- '))
              return (
                <ul key={i} className="list-disc list-inside space-y-1 ml-2">
                  {items.map((item, j) => (
                    <li key={j} dangerouslySetInnerHTML={{ __html: boldify(item.slice(2)) }} />
                  ))}
                </ul>
              )
            }
            return <p key={i} dangerouslySetInnerHTML={{ __html: boldify(para) }} />
          })}
          {message.table && <InlineTable table={message.table} />}
        </div>
        {message.sources && <SourcesToggle sources={message.sources} />}
        {message.confidence && (
          <div className="flex items-center gap-2 pt-1">
            <ConfidenceBadge level={message.confidence} />
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-2xl rounded-tl-sm px-5 py-4">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-[#475569] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [showChatSidebar, setShowChatSidebar] = useState(true)
  const [scope, setScope] = useState('All Documents')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  function send() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { id: `m${Date.now()}`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const aiMsg: Message = {
        id: `m${Date.now() + 1}`,
        role: 'ai',
        content:
          'Based on the available documents, I can provide analysis on this query. The data suggests continued positive trends across the key financial metrics for this period.',
        sources: [{ filename: 'Meridian_Annual_Accounts_2025.pdf', pages: 'Pages 3-5' }],
        confidence: 'medium',
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 1800)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }

  return (
    <DashboardLayout>
      {/* This inner div fills the remaining height inside DashboardLayout's overflow-y-auto */}
      <div className="flex h-full overflow-hidden">
        {/* Chat history sidebar */}
        {showChatSidebar && (
          <aside className="w-[260px] bg-[#12121A] border-r border-[#1E293B] flex flex-col flex-shrink-0 h-full">
            <div className="p-4 border-b border-[#1E293B]">
              <button className="w-full h-9 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
            <div className="p-3 border-b border-[#1E293B]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full bg-[#0A0A0F] border border-[#1E293B] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {CONVERSATIONS.map((conv) => (
                <button
                  key={conv.id}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    conv.active
                      ? 'bg-[#16161F] border border-[#1E1E2E]'
                      : 'hover:bg-[#16161F]'
                  }`}
                >
                  <div className={`text-sm truncate ${conv.active ? 'text-[#F8FAFC] font-medium' : 'text-[#94A3B8]'}`}>
                    {conv.title}
                  </div>
                  <div className="text-xs text-[#475569] mt-0.5 font-mono">{conv.ago}</div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Chat main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scope bar */}
          <div className="px-4 py-3 border-b border-[#1E293B] bg-[#0A0A0F] flex items-center gap-3 justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChatSidebar(!showChatSidebar)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                aria-label="Toggle conversation list"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="bg-[#12121A] border border-[#1E293B] rounded-lg text-xs text-[#F8FAFC] pl-8 pr-7 py-2 focus:outline-none focus:border-[#3B82F6] appearance-none cursor-pointer"
                >
                  <option>All Documents</option>
                  <option>Company: Meridian Tech</option>
                  <option>Deal: Project Atlas</option>
                  <option>Document: Meridian_Annual_Accounts_2025.pdf</option>
                </select>
                <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none rotate-90" />
              </div>
            </div>
            <button
              onClick={() => setShowContext(!showContext)}
              className="h-8 px-3 bg-[#12121A] border border-[#1E293B] hover:bg-[#16161F] text-[#F8FAFC] text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <PanelRight className="w-3.5 h-3.5 text-[#475569]" />
              <span className="hidden sm:inline">Context Panel</span>
            </button>
          </div>

          {/* Messages + optional context panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Messages */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {loading && <TypingIndicator />}
              </div>

              {/* Input area */}
              <div className="border-t border-[#1E293B] bg-[#0A0A0F] p-4 flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-end gap-2">
                    <button className="h-10 w-10 flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#12121A] rounded-lg transition-colors flex-shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={onInput}
                        onKeyDown={onKeyDown}
                        placeholder="Ask anything about your documents..."
                        className="w-full bg-[#12121A] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-all resize-none max-h-32"
                      />
                    </div>
                    <button
                      onClick={send}
                      disabled={!input.trim() || loading}
                      className="h-10 w-10 flex items-center justify-center bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)] flex-shrink-0"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#475569] mt-2 text-center">
                    AI responses are generated from your document corpus. Always verify critical information.
                  </p>
                </div>
              </div>
            </div>

            {/* Context panel */}
            {showContext && (
              <aside className="w-[300px] bg-[#12121A] border-l border-[#1E293B] flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#F8FAFC]">Context Panel</h3>
                  <button
                    onClick={() => setShowContext(false)}
                    className="text-[#475569] hover:text-[#F8FAFC] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {CONTEXT_ITEMS.map((item, i) => (
                    <div key={i} className="bg-[#16161F] border border-[#1E1E2E] rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <FileIcon className="w-3 h-3 text-[#EF4444] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-[#F8FAFC] font-medium truncate">{item.filename}</div>
                            <div className="text-[10px] text-[#475569] font-mono mt-0.5">{item.page}</div>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                            item.scoreVariant === 'success'
                              ? 'text-[#10B981] bg-[#10B981]/10'
                              : 'text-[#F59E0B] bg-[#F59E0B]/10'
                          }`}
                        >
                          {item.score}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{item.excerpt}</p>
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
