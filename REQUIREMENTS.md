# FinAI — Financial Document Intelligence System

> AI-powered internal operating system for financial advisory firms.
> Ingest documents, extract intelligence, generate materials, automate workflows.

**Purpose:** Demo project for Acube/Grow Your Staff interview — covers every JD requirement with real public financial data.

**Target:** UK-based financial advisory firm (M&A, debt advisory, wealth management)

---

## Tech Stack (Maps 1:1 to JD)

| JD Requirement | Tech Choice |
|---|---|
| Python | FastAPI backend |
| LLM APIs | Claude/GPT-4o with structured prompts |
| Prompt engineering | Template-based generation with validation |
| RAG architectures | LangChain/LangGraph + pgvector |
| Vector databases | pgvector (PostgreSQL extension) |
| Postgres / Supabase | Supabase (auth + DB + realtime) |
| Automation frameworks | n8n-style automation via FastAPI scheduled tasks |
| Data models & schemas | Typed schemas, migrations, foreign keys |
| Logging & validation | LangSmith + structured audit logs + guardrails |
| Document ingestion | PDF parsing + XBRL + structured extraction |
| Material generation | Teasers, credit memos, presentations |

---

## Feature List

### 1. Document Ingestion Pipeline

Ingest, parse, and structure financial documents from multiple sources.

**Supported Inputs:**
- PDF upload (financial statements, management accounts, CIMs, legal docs)
- XBRL/iXBRL parsing (Companies House UK machine-readable filings)
- CSV/Excel upload (financial models, data exports)
- URL ingestion (Companies House API, SEC EDGAR)

**Processing Pipeline:**
- Document type classification (LLM classifies: teaser, credit memo, financial statement, legal, etc.)
- Table extraction from PDFs (financial tables → structured data)
- Text extraction with section detection (headers, paragraphs, footnotes)
- Auto-chunking with financial-context-aware boundaries (respects section headers, tables)
- Metadata extraction (date, company name, document type, period, key figures)
- Embedding generation (text-embedding-3-small → pgvector)
- Source tracking (every chunk linked to source doc + page number)

**Data Sources (Public, Free):**
- Companies House API (UK company data, filings, officers, charges)
- SEC EDGAR (US public company filings, XBRL financials)
- yfinance (market data, financial statements, analyst ratings)
- FRED (macroeconomic data — GDP, inflation, interest rates)

---

### 2. RAG Pipeline for Financial Intelligence

AI-powered Q&A over ingested financial documents and structured data.

**Features:**
- Hybrid search: semantic (pgvector cosine similarity) + keyword matching
- Re-ranking with relevance scoring
- Cross-document retrieval (query across multiple deal documents)
- Structured data RAG (query normalized financial tables, not just text chunks)
- Source attribution (every answer cites source document + page)
- Financial-aware context window (prioritizes recent filings, relevant periods)
- Follow-up question understanding with conversation memory
- Cross-deal institutional memory ("What EV/EBITDA did we use in last 3 SaaS deals?")

**Example Queries:**
- "What was TechCorp's EBITDA margin for the last 3 years?"
- "Compare revenue growth of Company A vs Company B"
- "Summarize the key risks from the due diligence documents"
- "What are the comparable transaction multiples for UK B2B SaaS?"

---

### 3. Material Generation Engine

Auto-generate financial advisory documents using RAG + LLM + templates.

**Document Types:**

**3a. Deal Teaser (1-5 pages)**
- Input: company name + brief intake form
- Auto-pulls: Companies House data, financials, industry context
- Output: anonymous executive summary (business overview, headline financials, deal rationale)
- Brand-consistent formatting, PDF/DOCX output
- Validation: all financial figures traced to source data

**3b. Credit Memo / Credit Analysis**
- Input: borrower company + financial data
- Auto-calculates: financial ratios (DSCR, leverage, interest coverage, current ratio)
- LLM drafts narrative sections (borrower profile, risk assessment, recommendation)
- Deterministic: ratio calculations are code, not LLM
- Validation: cross-checks LLM-generated numbers against calculated values

**3c. Company Profile / Research Report**
- Input: company number or ticker
- Auto-pulls: Companies House + market data + news
- Output: structured company overview with financials, officers, filings, market context
- Comparable company analysis with peer multiples

**3d. Investment Presentation (Slide-Ready Content)**
- Input: deal data + generated materials
- Output: structured JSON (title, bullets, data points per slide)
- Feeds into presentation layer (Gamma / ReportLab PDF)

**Generation Rules:**
- Every financial figure must be sourced (no hallucinated numbers)
- Deterministic calculations (ratios, multiples) done in code, not LLM
- LLM handles narrative, context, and synthesis only
- Human review gate before any document is marked "approved"
- Version control on all generated documents

---

### 4. Financial Data Engine

Structured database of normalized financial data.

**Data Models:**

**Companies:**
- company_id, company_number (Companies House), name, sector, country
- registered_address, incorporation_date, company_status
- officers[], charges[], filing_history[]

**Financial Statements (Normalized):**
- company_id, period_start, period_end, currency
- revenue, cost_of_sales, gross_profit, EBITDA, operating_profit
- net_income, total_assets, total_liabilities, net_debt, equity
- cash_from_operations, capex, free_cash_flow

**Calculated Metrics:**
- EBITDA margin, net margin, revenue growth, leverage ratio
- DSCR, interest coverage, current ratio, quick ratio
- EV/EBITDA, EV/Revenue, P/E (for public companies)

**Comparable Companies:**
- ticker, exchange, sector, market_cap
- trailing_multiples (EV/EBITDA, EV/Revenue, P/E)
- auto-refreshed daily via yfinance

**Deals:**
- deal_id, target_company, deal_type (M&A / debt / equity)
- status, assigned_team, documents[], timeline[]
- generated_materials[] (teasers, memos, presentations)

---

### 5. NLP Intelligence Layer

AI analysis of financial text content.

**Features:**
- Sentiment analysis on financial narratives (positive/negative/neutral outlook)
- Risk factor extraction from documents
- Key figure extraction (revenue, EBITDA, margins — auto-detected in text)
- Entity recognition (company names, people, financial instruments)
- Document similarity scoring (find similar deals, comparable companies)
- Topic clustering across deal documents

---

### 6. Automation Workflows

Scheduled and event-driven automation pipelines.

**Scheduled Tasks:**
- Daily: refresh comparable company multiples from yfinance
- Daily: check Companies House for new filings on watched companies
- Weekly: generate deal pipeline summary report
- On-demand: trigger full document ingestion pipeline

**Event-Driven:**
- New document upload → classify → parse → chunk → embed → notify team
- New company added → pull Companies House data → pull market data → create profile
- Deal status change → update pipeline dashboard → alert assigned team
- Generated document approved → version control → archive → log audit trail

**Alerting:**
- New filing detected for watched company
- Financial metric deviation (revenue drop, margin change)
- SLA breach on document generation timeline
- Missing documents in due diligence checklist

---

### 7. Guardrails & Validation Pipeline

6-layer safety for financial AI outputs.

**Layer 1: Access Control**
- Role-based: Analyst, Senior Analyst, Director, Admin
- Deal-level permissions (only assigned team sees deal docs)

**Layer 2: Input Validation**
- Document type verification before processing
- PII detection and masking (personal data in financial docs)
- Prompt injection detection

**Layer 3: Financial Validation**
- Every LLM-generated number cross-checked against source data
- Ratio calculations done deterministically (code, not LLM)
- Confidence scoring on retrieved context (flag low-confidence sections)

**Layer 4: Output Validation**
- Brand consistency checks on generated materials
- Required section completeness (all template fields populated)
- Source attribution verification (no unsourced claims)

**Layer 5: Human Review Gate**
- No generated document reaches "approved" without human sign-off
- Tracked approval chain (who approved, when, what version)

**Layer 6: Audit & Monitoring**
- Every generation logged: prompt, model version, source docs, output, reviewer
- LangSmith tracing for all LLM calls
- Cost tracking per generation
- FCA compliance audit trail

---

### 8. Dashboard & Analytics

Web interface for the advisory team.

**Views:**
- Deal pipeline overview (status, documents, timeline)
- Company research dashboard (financials, filings, market data)
- Document library (all ingested + generated docs, searchable)
- RAG chat interface (ask questions across all deal documents)
- Generation studio (select template → fill inputs → generate → review → approve)
- Comparable company tracker (peer multiples, auto-refreshed)
- Audit log viewer

**Tech:**
- Next.js 15 frontend
- Real-time updates via Supabase Realtime
- Clean, professional UI (financial industry aesthetic)

---

### 9. Observability & Monitoring

**Features:**
- Structured logging (JSON, request tracing)
- LangSmith integration for LLM trace monitoring
- API latency monitoring
- Error tracking with alerting
- Cost per generation tracking (JSONL audit)
- Health check endpoints
- Usage analytics (generations/day, queries/day, active users)

---

### 10. Developer APIs

**Endpoints:**
- Document API (upload, classify, parse, retrieve)
- RAG API (query, chat, search)
- Generation API (create teaser, credit memo, presentation)
- Company API (lookup, financials, comparable companies)
- Deal API (CRUD, pipeline, documents)
- Webhook support for automation triggers

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Next.js Frontend                 │
│   Dashboard, RAG Chat, Generation Studio, Docs  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│               FastAPI Backend                    │
│   Routes → Services → Repositories              │
│   (Clean 3-layer architecture)                   │
├──────────────┬───────────────┬──────────────────┤
│  Document    │  RAG          │  Generation      │
│  Ingestion   │  Pipeline     │  Engine          │
│  Pipeline    │  (LangChain)  │  (LLM+Templates) │
├──────────────┴───────────────┴──────────────────┤
│              Guardrails Pipeline                 │
│  (Access → Input → Financial → Output → Audit)  │
├─────────────────────────────────────────────────┤
│          Supabase (PostgreSQL + pgvector)        │
│  companies, financials, documents, deals,       │
│  embeddings, audit_logs, generated_materials    │
├─────────────────────────────────────────────────┤
│              External Data Sources               │
│  Companies House API │ yfinance │ FRED │ EDGAR  │
└─────────────────────────────────────────────────┘
```

---

## Scope for Demo

**Build (Core — shows ALL JD skills):**
1. Document ingestion (PDF upload → parse → chunk → embed → pgvector)
2. Companies House API integration (real UK company data)
3. RAG pipeline (query across ingested docs + structured data)
4. Credit memo auto-generation (deterministic ratios + LLM narrative)
5. Deal teaser auto-generation (from intake form + pulled data)
6. Financial data engine (normalized tables, calculated metrics)
7. Comparable company tracker (yfinance → daily refresh)
8. Dashboard (deal pipeline, RAG chat, generation studio)
9. Guardrails (validation, audit logging, source attribution)
10. Automation (scheduled data refresh, event-driven pipelines)

**Defer (nice-to-have, not for demo):**
- Voice AI for financial queries
- Video support
- Email ticket ingestion
- CRM integrations
- Multi-language support

---

## File Naming

```
finai/
├── REQUIREMENTS.md          ← this file
├── CLAUDE.md                ← engineering rules (composed from ai-coding-rules)
├── backend/                 ← FastAPI
│   ├── app/
│   │   ├── api/routes/      ← thin route handlers
│   │   ├── services/        ← business logic
│   │   ├── repositories/    ← database access
│   │   ├── models/          ← Pydantic schemas
│   │   ├── core/            ← config, auth, guardrails
│   │   └── pipelines/       ← ingestion, RAG, generation
│   ├── migrations/          ← Alembic
│   └── tests/
├── frontend/                ← Next.js 15
│   ├── src/
│   │   ├── app/             ← pages
│   │   ├── components/      ← UI components
│   │   └── lib/             ← API client, utilities
│   └── public/
├── data/                    ← sample financial data for demo
├── scripts/                 ← automation scripts
└── docker-compose.yml
```
