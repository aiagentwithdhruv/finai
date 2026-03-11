# FinAI — Product Requirements Document

## 1. Overview

**Product:** FinAI — Financial Document Intelligence System
**Type:** Internal operating system for financial advisory firms
**Users:** Financial analysts, senior analysts, directors, partners
**Problem:** Analysts spend 60-80% of time extracting info from documents, formatting into templates, and cross-referencing data. All three are automatable.
**Solution:** AI-powered system that ingests financial documents, structures data, generates advisory materials, and automates intelligence workflows.

---

## 2. User Personas

### Persona 1: Financial Analyst (Primary User)
- **Role:** Junior/mid analyst at a UK financial advisory firm
- **Daily tasks:** Read company filings, extract financial data, draft teasers and credit memos, build comparable company tables, prepare presentations
- **Pain:** 3-4 hours/day on document parsing and manual formatting
- **Needs:** Upload docs → get structured data + draft materials → review and approve

### Persona 2: Senior Analyst / Director
- **Role:** Reviews generated materials, approves outputs, manages deal pipeline
- **Pain:** Context-switching between 5-10 active deals, reviewing analyst work
- **Needs:** Deal overview dashboard, quick document search, approval workflow

### Persona 3: Admin / Tech Lead
- **Role:** Manages system config, API keys, user permissions, model settings
- **Needs:** Admin panel, usage analytics, audit logs

---

## 3. Core Features (MVP)

### F1: Document Ingestion
**Priority:** P0 (Must-have)
**User story:** As an analyst, I upload a PDF/Excel/DOCX and the system automatically classifies, parses, chunks, embeds, and makes it searchable.

**Acceptance criteria:**
- Upload via drag-and-drop or file picker
- Supports PDF, DOCX, XLSX, CSV
- Auto-classifies document type (financial statement, teaser, credit memo, legal, other)
- Extracts tables from PDFs as structured data
- Chunks with financial-context-aware boundaries
- Embeds and stores in pgvector within 30 seconds for a 50-page PDF
- Shows processing status (uploading → parsing → embedding → ready)
- Source metadata preserved (filename, page number, section, upload date)

### F2: Companies House Integration
**Priority:** P0
**User story:** As an analyst, I enter a UK company number and the system pulls all public data — registration, officers, filings, charges, financial history.

**Acceptance criteria:**
- Search by company name or number
- Pull: company details, officers, filing history, charges, PSC
- Parse latest filed accounts (if XBRL, extract financials automatically)
- Store in structured company profile
- Auto-refresh on schedule or on-demand
- Display in clean company profile card

### F3: RAG Chat Interface
**Priority:** P0
**User story:** As an analyst, I ask questions about ingested documents and get accurate answers with source citations.

**Acceptance criteria:**
- Chat interface with conversation memory
- Hybrid search (semantic + keyword)
- Source attribution on every answer (document name, page number)
- Confidence indicator (high/medium/low based on retrieval quality)
- Can scope queries to specific deal or company
- Handles "I don't have enough information" gracefully
- Streaming responses

### F4: Credit Memo Generation
**Priority:** P0
**User story:** As an analyst, I select a company and the system generates a draft credit memo with calculated ratios and narrative sections.

**Acceptance criteria:**
- Select company → auto-populate financial data
- Deterministic ratio calculations (DSCR, leverage, margins, coverage ratios)
- LLM-drafted narrative sections (borrower profile, risk assessment, recommendation)
- Every number traced to source data
- Output as styled PDF with brand formatting
- Review/edit interface before approval
- Version history

### F5: Deal Teaser Generation
**Priority:** P0
**User story:** As an analyst, I fill a brief intake form and the system generates a 1-5 page anonymous deal teaser.

**Acceptance criteria:**
- Intake form: company, deal type, key highlights, anonymization preferences
- Auto-pulls Companies House data + ingested docs
- Generates: business overview, headline financials, deal rationale, process timeline
- Anonymous by default (no company name, vague industry references)
- Output as styled PDF
- Review/edit → approve workflow

### F6: Financial Data Engine
**Priority:** P0
**User story:** As an analyst, I view normalized financial data for any ingested company — P&L, balance sheet, ratios, trends.

**Acceptance criteria:**
- Normalized financial tables (revenue, EBITDA, net income, assets, liabilities)
- Auto-calculated metrics (margins, growth rates, ratios)
- Year-over-year comparison (3-5 years)
- Comparable company table (peer multiples from yfinance)
- Exportable to CSV/Excel
- Visual charts (revenue trend, margin trend, peer comparison)

### F7: Deal Pipeline Dashboard
**Priority:** P1
**User story:** As a director, I see all active deals, their status, documents, and timeline at a glance.

**Acceptance criteria:**
- Kanban-style pipeline (Origination → NDA → Due Diligence → Negotiation → Close)
- Deal cards with: target company, deal type, assigned team, doc count, last activity
- Click into deal → full deal room (documents, generated materials, chat, timeline)
- Activity feed (new uploads, generations, approvals)
- Filter by deal type, status, team member

### F8: Comparable Company Tracker
**Priority:** P1
**User story:** As an analyst, I track peer companies and their trading multiples, auto-refreshed daily.

**Acceptance criteria:**
- Add companies by ticker or name
- Auto-pull: market cap, EV, revenue, EBITDA, multiples (EV/EBITDA, EV/Revenue, P/E)
- Daily auto-refresh via yfinance
- Sector grouping
- Export to Excel for comps table in presentations

### F9: Automation Engine
**Priority:** P1
**User story:** As an admin, I configure automated workflows (data refresh, monitoring, alerts).

**Acceptance criteria:**
- Scheduled tasks: daily comps refresh, Companies House monitoring, report generation
- Event triggers: new upload → auto-process, deal status change → notify team
- Alert rules: new filing on watched company, financial metric deviation
- Task history and error logs

### F10: Guardrails & Audit
**Priority:** P0
**User story:** As a director, every AI-generated document has a full audit trail and human approval.

**Acceptance criteria:**
- Every generation logged: prompt, model, sources used, output, timestamp
- Human approval workflow (analyst generates → director reviews → approved/rejected)
- Confidence scoring on generated sections
- PII detection on uploaded documents
- Role-based access (Analyst, Senior, Director, Admin)
- Audit log viewer with filters

---

## 4. Non-Functional Requirements

| Requirement | Target |
|---|---|
| PDF ingestion time (50 pages) | < 30 seconds |
| RAG query response time | < 3 seconds |
| Material generation time | < 60 seconds |
| Concurrent users | 10-20 |
| Document storage | Supabase Storage + pgvector |
| Uptime | 99.5% |
| Data retention | All documents retained, versions tracked |
| Security | RBAC, PII detection, audit logging |

---

## 5. Data Model (Key Entities)

### companies
```
id, company_number, name, sector, country, status,
registered_address, incorporation_date,
created_at, updated_at
```

### financial_statements
```
id, company_id, period_start, period_end, currency,
revenue, cost_of_sales, gross_profit, ebitda,
operating_profit, net_income, total_assets,
total_liabilities, net_debt, equity,
cash_from_operations, capex, free_cash_flow,
source_document_id, created_at
```

### documents
```
id, deal_id, company_id, filename, doc_type,
file_url, file_size, page_count,
processing_status, chunk_count, embedding_count,
uploaded_by, created_at, updated_at
```

### document_chunks
```
id, document_id, chunk_index, content, metadata,
embedding (vector), page_number, section_header,
created_at
```

### deals
```
id, title, target_company_id, deal_type,
status, assigned_team[], description,
created_at, updated_at
```

### generated_materials
```
id, deal_id, company_id, material_type,
title, content, source_document_ids[],
generation_prompt, model_used, version,
status (draft/review/approved/rejected),
generated_by, approved_by, approved_at,
created_at, updated_at
```

### comparable_companies
```
id, ticker, exchange, name, sector,
market_cap, enterprise_value, revenue, ebitda,
ev_ebitda, ev_revenue, pe_ratio,
last_refreshed, created_at
```

### audit_logs
```
id, user_id, action, entity_type, entity_id,
details, ip_address, created_at
```

### users
```
id, email, name, role (analyst/senior/director/admin),
created_at, last_login
```

---

## 6. API Endpoints (Key)

### Documents
```
POST   /api/v1/documents/upload          — Upload and process document
GET    /api/v1/documents                 — List documents (with filters)
GET    /api/v1/documents/:id             — Get document details + chunks
DELETE /api/v1/documents/:id             — Delete document
```

### Companies
```
POST   /api/v1/companies/lookup          — Lookup via Companies House
GET    /api/v1/companies                 — List companies
GET    /api/v1/companies/:id             — Company profile + financials
GET    /api/v1/companies/:id/financials  — Financial statements
POST   /api/v1/companies/:id/refresh     — Refresh from external sources
```

### RAG
```
POST   /api/v1/chat                      — Chat with documents (streaming)
POST   /api/v1/search                    — Semantic search across docs
```

### Generation
```
POST   /api/v1/generate/teaser           — Generate deal teaser
POST   /api/v1/generate/credit-memo      — Generate credit memo
POST   /api/v1/generate/company-profile  — Generate company profile
GET    /api/v1/materials                  — List generated materials
GET    /api/v1/materials/:id             — Get material + versions
PATCH  /api/v1/materials/:id/approve     — Approve material
```

### Deals
```
POST   /api/v1/deals                     — Create deal
GET    /api/v1/deals                     — List deals (pipeline)
GET    /api/v1/deals/:id                 — Deal room (docs + materials + chat)
PATCH  /api/v1/deals/:id                 — Update deal status
```

### Comparable Companies
```
POST   /api/v1/comps                     — Add comparable company
GET    /api/v1/comps                     — List comps with multiples
POST   /api/v1/comps/refresh             — Refresh all multiples
DELETE /api/v1/comps/:id                 — Remove comp
```

### Admin
```
GET    /api/v1/admin/audit-logs          — Audit log viewer
GET    /api/v1/admin/usage               — Usage analytics
GET    /api/v1/health                    — Health check
```

---

## 7. Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Backend | FastAPI | Async, typed, fast, production-proven |
| Frontend | Next.js 15 + TypeScript | SSR, app router, TypeScript-first |
| Database | Supabase (PostgreSQL + pgvector) | Hosted, auth built-in, realtime, vector search |
| LLM | Claude Sonnet / GPT-4o | Best for structured financial text generation |
| Embeddings | text-embedding-3-small | Good quality/cost ratio for financial text |
| RAG | LangChain + pgvector | Hybrid search, metadata filtering, re-ranking |
| PDF Parsing | pypdf + unstructured | Table extraction, section detection |
| Market Data | yfinance | Free, no auth, Python-native |
| UK Company Data | Companies House API | Official, free, real-time |
| Monitoring | LangSmith | LLM trace monitoring, cost tracking |
| Deployment | Docker + Vercel + Render | Free/cheap, production-ready |
| Styling | Tailwind CSS + shadcn/ui | Professional, customizable, fast |

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Document ingestion success rate | > 95% |
| RAG answer accuracy (with source) | > 85% |
| Credit memo generation time | < 60 seconds |
| Financial ratio calculation accuracy | 100% (deterministic) |
| User satisfaction (analyst feedback) | > 4/5 |
| System uptime | > 99.5% |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM hallucinating financial numbers | Deterministic calculation layer + source cross-check |
| Poor PDF table extraction | Use unstructured + fallback to manual entry |
| Companies House API rate limiting | Cache responses, 600 req/5 min is sufficient |
| Financial domain knowledge gap | Public data + configurable templates |
| FCA compliance concerns | Human review gate on all outputs, full audit trail |

---

## 10. Phases

### Phase 1: Core (Demo-Ready) — Build This
- Document upload + ingestion pipeline
- Companies House integration
- RAG chat interface
- Credit memo generation
- Financial data engine (normalized tables + ratios)
- Basic dashboard (company profiles, document library)
- Guardrails + audit logging

### Phase 2: Deal Intelligence
- Deal pipeline (Kanban board)
- Teaser generation
- Comparable company tracker
- Automation engine (scheduled tasks)

### Phase 3: Scale
- Multi-user auth + RBAC
- Presentation generation
- Advanced analytics dashboard
- CRM integration
- Email document ingestion
