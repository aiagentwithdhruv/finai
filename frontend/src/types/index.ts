// ─── Company ─────────────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  companies_house_number?: string
  sector?: string
  description?: string
  website?: string
  status: 'active' | 'dissolved' | 'liquidation'
  incorporated_date?: string
  sic_codes?: string[]
  address?: CompanyAddress
  flags?: string[]
  created_at: string
  updated_at: string
}

export interface CompanyAddress {
  line1?: string
  line2?: string
  city?: string
  postcode?: string
  country?: string
}

// ─── Financial Statement ──────────────────────────────────────────────────────

export interface FinancialStatement {
  id: string
  company_id: string
  period_end: string
  period_type: 'annual' | 'interim' | 'quarterly'
  revenue?: number
  ebitda?: number
  ebit?: number
  net_income?: number
  total_assets?: number
  total_liabilities?: number
  total_equity?: number
  cash?: number
  debt?: number
  capex?: number
  currency: string
  source_document_id?: string
  created_at: string
  updated_at: string
}

// ─── Document ─────────────────────────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'processing' | 'processed' | 'failed'
export type DocumentType =
  | 'annual_report'
  | 'interim_report'
  | 'filing'
  | 'pitch_deck'
  | 'model'
  | 'nda'
  | 'other'

export interface Document {
  id: string
  company_id?: string
  deal_id?: string
  filename: string
  file_type: string
  file_size_bytes: number
  status: DocumentStatus
  doc_type: DocumentType
  page_count?: number
  chunk_count?: number
  uploaded_by: string
  storage_path: string
  created_at: string
  updated_at: string
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

export type DealStage =
  | 'origination'
  | 'nda_signed'
  | 'due_diligence'
  | 'negotiation'
  | 'closed'
  | 'dead'

export type DealType = 'ma' | 'equity' | 'debt' | 'restructuring' | 'ipo'

export interface Deal {
  id: string
  name: string
  company_id?: string
  stage: DealStage
  deal_type: DealType
  estimated_value?: number
  currency: string
  lead_banker?: string
  team_members?: string[]
  description?: string
  created_at: string
  updated_at: string
}

// ─── Material ─────────────────────────────────────────────────────────────────

export type MaterialType =
  | 'credit_memo'
  | 'teaser'
  | 'cim'
  | 'management_presentation'
  | 'loi'
  | 'other'

export type ReviewStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface Material {
  id: string
  deal_id?: string
  company_id?: string
  material_type: MaterialType
  title: string
  content?: string
  review_status: ReviewStatus
  generated_by: string
  reviewed_by?: string
  reviewed_at?: string
  source_document_ids?: string[]
  created_at: string
  updated_at: string
}

// ─── Comparable ───────────────────────────────────────────────────────────────

export interface Comparable {
  id: string
  company_id?: string
  deal_id?: string
  comp_company_name: string
  transaction_date?: string
  ev_ebitda?: number
  ev_revenue?: number
  pe_ratio?: number
  sector?: string
  notes?: string
  source?: string
  created_at: string
  updated_at: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'document_upload'
  | 'document_processed'
  | 'material_generated'
  | 'material_approved'
  | 'material_rejected'
  | 'chat_query'
  | 'company_added'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'comparable_added'
  | 'user_login'
  | 'user_logout'
  | 'settings_changed'

export interface AuditLog {
  id: string
  action: AuditAction
  actor: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  session_id: string
  role: ChatRole
  content: string
  sources?: SourceCitation[]
  tokens_used?: number
  model?: string
  created_at: string
}

export interface SourceCitation {
  document_id: string
  document_name: string
  page?: number
  section?: string
  excerpt: string
  confidence: number
}

// ─── API Wrappers ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface ApiError {
  detail: string
  code?: string
  field?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  active_deals: number
  active_deals_delta: number
  documents_processed: number
  documents_this_week: number
  materials_generated: number
  materials_pending_review: number
  companies_tracked: number
  companies_with_alerts: number
}

export interface ActivityItem {
  id: string
  icon_type: 'document' | 'alert' | 'check' | 'upload' | 'company'
  message: string
  timestamp: string
  actor?: string
  actor_avatar?: string
}

export interface WatchlistAlert {
  id: string
  company_name: string
  alert_type: string
  date: string
  company_id: string
}
