# FinAI — Financial Document Intelligence System

## Project Context

AI-powered internal operating system for a UK-based financial advisory firm.
Built as a demo for Acube/Grow Your Staff interview (AI Automation & Systems Architect, 30-60 LPA).

**Purpose:** Demonstrate production AI skills — document ingestion, RAG, material generation, automation, guardrails.

**Tech Stack:**
- Backend: FastAPI + Python 3.12
- Frontend: Next.js 15 + TypeScript + Tailwind CSS
- Database: Supabase (PostgreSQL + pgvector)
- LLM: Claude/GPT-4o via LangChain/LangGraph
- Data: Companies House API, yfinance, FRED, SEC EDGAR
- Deployment: Docker + Vercel (frontend) + Render/Railway (backend)

**Architecture:** Clean 3-layer (routes → services → repositories) + RAG pipeline + generation engine + guardrails

**Requirements:** See REQUIREMENTS.md

---

## Engineering Rules

> Composed from aiagentwithdhruv/ai-coding-rules (rules 00, 10, 20, 30, 35, 45, 50, 60, 70, 80, 85, 90, 99)

### Core Principles
- Think architect first, implement as senior engineer
- Separate probabilistic AI (LLM reasoning) from deterministic code (calculations, validation)
- Every financial figure in AI output must trace to a source document
- Clean architecture: routes (thin) → services (logic) → repositories (DB)

### Financial-Specific Rules
- **Ratio calculations are CODE, not LLM** — never let the LLM calculate EBITDA margins or leverage ratios
- **Source attribution mandatory** — every AI-generated claim cites source doc + page
- **Human review gate** — no generated document marked "approved" without human sign-off
- **Audit everything** — every generation logged: prompt, model, sources, output, reviewer
- **No hallucinated numbers** — validation layer cross-checks LLM output against extracted data

### Backend (FastAPI)
- Routes: HTTP concerns only
- Services: business logic, pipeline orchestration
- Repositories: all DB access via parameterized queries
- Pydantic schemas for all request/response validation
- Async I/O, pagination, consistent error responses
- Centralized config validated at startup

### Frontend (Next.js 15)
- TypeScript everywhere
- Small, focused components
- Centralized API client in lib/
- Handle loading, error, empty states
- Professional financial industry aesthetic

### Database (Supabase/PostgreSQL)
- Migrations for all schema changes
- Every entity: id, created_at, updated_at
- Foreign keys, indexes on common filters
- pgvector for embeddings (HNSW index)
- No raw SQL in routes

### RAG Pipeline
- Separate: ingestion → parsing → chunking → embedding → retrieval → reranking → generation
- Financial-context-aware chunking (respect section headers, tables)
- Hybrid search: semantic (pgvector) + keyword
- Chunk metadata: source, page, section, date, company
- Handle no-context and low-confidence gracefully

### Guardrails (6 layers)
1. Access control (RBAC)
2. Input validation (doc type, PII, injection)
3. Financial validation (cross-check numbers)
4. Output validation (completeness, brand, sources)
5. Human review gate
6. Audit logging (LangSmith + JSONL)

### Security
- No hardcoded secrets
- .env.example with all vars documented
- Rate limiting on expensive endpoints
- Prompt injection resistance
- PII detection in financial docs

### Testing
- Tests for services, pipelines, validation
- Mock external APIs (Companies House, yfinance)
- Deterministic tests for financial calculations
- Integration tests for RAG retrieval quality

### Deployment
- Docker Compose for local dev
- Vercel for frontend
- Render/Railway for backend
- Supabase hosted for DB
- Health check endpoints
- Structured JSON logging
