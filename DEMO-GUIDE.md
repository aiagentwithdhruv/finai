# FinAI — Demo Walkthrough (Acube Interview)

## What This Is

FinAI is an AI-powered internal operating system for a UK financial advisory firm. It automates document intelligence — from PDF ingestion to RAG-powered Q&A to AI-generated credit memos — with full audit trails and human review gates.

**Built in 3 days.** Production architecture, not a toy.

---

## Demo Flow (5-7 minutes)

### 1. Dashboard (30 sec)
- Open the app → redirects to `/dashboard`
- Show live metrics: companies tracked, documents uploaded, materials generated
- Point out: "These are real counts from Supabase — not hardcoded"

### 2. Companies (30 sec)
- Navigate to **Companies**
- Show Rolls-Royce Holdings pulled from the database
- Click **"+ Add Company"** → add any UK company (e.g. "Tesco plc")
- "Companies are fetched from and stored in Supabase PostgreSQL"

### 3. Document Upload + Processing Pipeline (1 min)
- Navigate to **Documents**
- Upload a financial PDF (annual report, earnings release)
- Watch the status change: `classifying → parsing → chunking → embedding → completed`
- "The pipeline classifies the doc type, extracts text, chunks it with financial context awareness, then embeds with OpenAI text-embedding-3-small into pgvector"
- Point out: "6 chunks already embedded from the Rolls-Royce annual report"

### 4. RAG Chat — The Core Feature (2 min)
- Navigate to **Chat**
- Ask: **"What was the revenue for Rolls-Royce in 2023?"**
- Show the answer: GBP 16,484M with source citations
- Expand **Sources (5)** — show doc name, page numbers, relevance scores
- Click **Context Panel** — show retrieved chunks with relevance percentages
- Point out the **confidence badge** (Medium/High) and **model used** (grok-4.1-fast)
- Ask a follow-up: **"What are the key risks?"**
- "This is hybrid RAG — pgvector cosine similarity search, top-k retrieval, then LLM synthesis with mandatory source attribution"

### 5. Material Generation (1 min)
- Navigate to **Generate Material**
- Select Rolls-Royce → Click **Generate Credit Memo**
- Watch the 5-step progress animation (real API call happening)
- Click **View Document** — show the structured output:
  - Borrower Profile, Financial Overview, Risk Assessment, Recommendation
- "Ratios are calculated in code, not by the LLM. The LLM handles narrative only. Document starts as draft — requires human approval before distribution."

### 6. Audit Log (30 sec)
- Navigate to **Audit**
- Show logged actions: document uploads, chat queries, generations
- "Every action is immutable. Full compliance trail — who did what, when, from where."

### 7. Architecture Talking Points (1 min)
- "Clean 3-layer architecture: routes → services → repositories"
- "6-layer guardrail system: RBAC, input validation, financial validation, output validation, human review gate, audit logging"
- "Deterministic vs probabilistic separation — financial calculations in Python, narrative in LLM"
- "Single OpenRouter key powers everything — LLM inference + embeddings"
- "Supabase for PostgreSQL + pgvector — no separate vector DB needed"

---

## Key Numbers to Mention

| Metric | Value |
|--------|-------|
| Backend endpoints | 15+ REST APIs |
| Frontend pages | 8 (dashboard, companies, documents, chat, generate, deals, comparables, audit) |
| RAG pipeline stages | 5 (classify → parse → chunk → embed → retrieve) |
| Guardrail layers | 6 (RBAC, input, financial, output, human review, audit) |
| Embedding model | text-embedding-3-small (1536 dims) |
| LLM | grok-4.1-fast via OpenRouter |
| Vector search | pgvector with cosine distance |
| Generation cost | ~$0.02 per credit memo |

---

## If They Ask...

**"Why pgvector instead of Pinecone?"**
→ pgvector is co-located with our relational data in Supabase. No extra service, no extra latency. Scales to millions of vectors. For a financial firm with thousands of documents, this is the right choice.

**"Why OpenRouter?"**
→ Single API key, 100+ models, automatic fallback. We can swap from Grok to Claude to GPT-4o in one config change. No vendor lock-in.

**"How do you prevent hallucinated numbers?"**
→ Financial calculations (ratios, margins, leverage) are deterministic Python code, never LLM. The LLM only generates narrative. Every figure traces to a source document + page. Validation layer cross-checks before output.

**"What about security?"**
→ No hardcoded secrets, .env validated at startup, rate limiting on expensive endpoints (chat, generate), prompt injection resistance in the system prompt, PII detection planned for the ingestion pipeline.

**"Can this scale?"**
→ Async FastAPI handles concurrent requests. pgvector HNSW index for sub-50ms retrieval. Stateless backend → horizontal scaling on Render/Railway. Supabase handles connection pooling.

**"What would you add next?"**
→ 1) Streaming responses (SSE) for chat. 2) Multi-document comparison across companies. 3) Scheduled data ingestion from Companies House API. 4) Role-based access control with Supabase Auth. 5) LangSmith tracing for production observability.

---

## Tech Stack Quick Reference

```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS
Backend:   FastAPI + Python 3.12 + SQLAlchemy + Pydantic
Database:  Supabase (PostgreSQL + pgvector)
LLM:       OpenRouter → grok-4.1-fast (generation) + text-embedding-3-small (embeddings)
Deploy:    Vercel (frontend) + Render (backend) + Supabase (cloud DB)
```

---

## Before the Demo

1. Make sure backend is running: `curl http://localhost:8000/api/v1/health`
2. Make sure frontend is running: open `http://localhost:3001`
3. Have the Rolls-Royce annual report already uploaded (6 chunks)
4. Pre-test the chat with "What was the revenue?" to warm up the LLM
5. Have this guide open on a second screen
