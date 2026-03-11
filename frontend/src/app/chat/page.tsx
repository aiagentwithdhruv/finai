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
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  filename: string
  pages: string
  chunk_index?: number
  similarity_score?: number
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
  model?: string
}

interface Conversation {
  id: string
  title: string
  ago: string
  active?: boolean
}

// ─── API response ────────────────────────────────────────────────────────────

interface ChatApiResponse {
  conversation_id: string
  message_id: string
  answer: string
  sources: Array<{
    document_id: string
    doc_name: string
    chunk_id: string
    page: number | null
    section_header: string | null
    excerpt: string
    relevance_score: number
  }>
  confidence: 'high' | 'medium' | 'low'
  low_confidence_warning: string | null
  model_used: string
  created_at: string
}

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
                {s.similarity_score != null && (
                  <span className="ml-1 text-[10px] text-[#475569]">({(s.similarity_score * 100).toFixed(0)}% match)</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
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
          {message.table && (
            <div className="overflow-x-auto -mx-1 my-2">
              <table className="w-full text-xs border-collapse min-w-[400px]">
                <thead>
                  <tr className="border-b border-[#1E293B]/50">
                    {message.table.headers.map((h, i) => (
                      <th key={i} className={`py-2 px-2 text-[#475569] font-medium ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {message.table.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-[#1E293B]/30">
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className={`py-2 px-2 ${ci === 0 ? 'text-[#94A3B8]' : 'text-right text-[#F8FAFC]'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {message.sources && message.sources.length > 0 && <SourcesToggle sources={message.sources} />}
        {message.confidence && (
          <div className="flex items-center gap-2 pt-1">
            <ConfidenceBadge level={message.confidence} />
            {message.model && <span className="text-[10px] text-[#475569] font-mono">{message.model}</span>}
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
          <span className="text-xs text-[#475569] ml-2">Searching documents & generating answer...</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [showChatSidebar, setShowChatSidebar] = useState(true)
  const [scope, setScope] = useState('All Documents')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [lastSources, setLastSources] = useState<ChatApiResponse['sources']>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load companies for scope dropdown
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  useEffect(() => {
    api.list<{ id: string; name: string }>('/api/v1/companies', { per_page: 50 })
      .then((res) => setCompanies(res.items))
      .catch(() => {})
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { id: `m${Date.now()}`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      // Build request body
      const body: Record<string, unknown> = {
        message: text,
        top_k: 5,
        rerank: true,
      }
      if (conversationId) body.conversation_id = conversationId

      // Parse scope
      if (scope.startsWith('company:')) {
        body.scope_type = 'company'
        body.scope_id = scope.replace('company:', '')
      }

      const res = await api.post<ChatApiResponse>('/api/v1/chat', body)

      setConversationId(res.conversation_id)
      setLastSources(res.sources)

      const aiMsg: Message = {
        id: res.message_id || `m${Date.now() + 1}`,
        role: 'ai',
        content: res.answer,
        sources: res.sources.map((s) => ({
          filename: s.doc_name,
          pages: s.page ? `Page ${s.page}` : `Chunk ${s.chunk_id?.slice(0, 8) ?? ''}`,
          similarity_score: s.relevance_score,
        })),
        confidence: res.confidence,
        model: res.model_used,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg: Message = {
        id: `m${Date.now() + 1}`,
        role: 'ai',
        content: `**Error:** ${err instanceof Error ? err.message : 'Failed to get response'}. Make sure the backend is running and documents are uploaded.`,
        confidence: 'low',
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
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

  function newChat() {
    setMessages([])
    setConversationId(null)
    setLastSources([])
  }

  return (
    <DashboardLayout>
      <div className="flex h-full overflow-hidden">
        {/* Chat history sidebar */}
        {showChatSidebar && (
          <aside className="w-[260px] bg-[#12121A] border-r border-[#1E293B] flex flex-col flex-shrink-0 h-full">
            <div className="p-4 border-b border-[#1E293B]">
              <button
                onClick={newChat}
                className="w-full h-9 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-xs text-[#475569] mb-3">
                Chat with your uploaded documents using RAG (Retrieval-Augmented Generation).
              </div>
              <div className="space-y-2 text-xs text-[#94A3B8]">
                <p className="font-medium text-[#F8FAFC]">Try asking:</p>
                {[
                  'What was the revenue last year?',
                  'Summarise the key risks',
                  'What is the EBITDA margin?',
                  'Compare year-over-year performance',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q) }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#16161F] border border-[#1E1E2E] hover:border-[#3B82F6]/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
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
                  <option value="All Documents">All Documents</option>
                  {companies.map((c) => (
                    <option key={c.id} value={`company:${c.id}`}>Company: {c.name}</option>
                  ))}
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
                {messages.length === 0 && !loading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Database className="w-12 h-12 text-[#475569] mx-auto" />
                      <h3 className="text-lg font-medium text-[#F8FAFC]">Ask anything about your documents</h3>
                      <p className="text-sm text-[#94A3B8] max-w-md">
                        Your queries are answered using RAG — retrieving relevant chunks from uploaded documents via pgvector, then generating answers with source citations.
                      </p>
                    </div>
                  </div>
                )}
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
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#475569] mt-2 text-center">
                    Powered by RAG — pgvector semantic search + Grok 4.1 Fast via OpenRouter. Always verify critical information.
                  </p>
                </div>
              </div>
            </div>

            {/* Context panel */}
            {showContext && (
              <aside className="w-[300px] bg-[#12121A] border-l border-[#1E293B] flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#F8FAFC]">Retrieved Chunks</h3>
                  <button
                    onClick={() => setShowContext(false)}
                    className="text-[#475569] hover:text-[#F8FAFC] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {lastSources.length === 0 ? (
                    <div className="text-xs text-[#475569] text-center py-8">
                      Send a message to see retrieved source chunks here.
                    </div>
                  ) : (
                    lastSources.map((item, i) => (
                      <div key={i} className="bg-[#16161F] border border-[#1E1E2E] rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <FileIcon className="w-3 h-3 text-[#EF4444] mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-[#F8FAFC] font-medium truncate">{item.doc_name}</div>
                              <div className="text-[10px] text-[#475569] font-mono mt-0.5">
                                {item.page ? `Page ${item.page}` : `Chunk ${item.chunk_id?.slice(0, 8) ?? ''}`}
                                {item.section_header && ` — ${item.section_header}`}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                              item.relevance_score >= 0.40
                                ? 'text-[#10B981] bg-[#10B981]/10'
                                : item.relevance_score >= 0.30
                                  ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                                  : 'text-[#EF4444] bg-[#EF4444]/10'
                            }`}
                          >
                            {(item.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-4">{item.excerpt}</p>
                      </div>
                    ))
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
