# FinAI — UI Design Specification (UX Pilot Prompts)

## Design System (Use for ALL pages)

### Global UX Pilot Prompt (Paste this first, then each page prompt)

```
Design a premium enterprise SaaS dashboard for a financial advisory AI platform called "FinAI".

Design language: Ultra-premium, institutional finance aesthetic. Think Bloomberg Terminal meets Linear meets Notion — clean, data-dense, professional. NOT playful, NOT startup-y, NOT colorful.

Color palette:
- Background: #0A0A0F (near-black) with subtle #12121A panels
- Cards/Panels: #16161F with 1px border #1E1E2E
- Primary accent: #3B82F6 (blue — for CTAs, active states, links)
- Secondary accent: #10B981 (green — for positive metrics, success)
- Warning: #F59E0B (amber — for pending, review needed)
- Danger: #EF4444 (red — for errors, declined, risk flags)
- Text primary: #F8FAFC (white)
- Text secondary: #94A3B8 (muted gray)
- Text tertiary: #475569 (dark gray — labels, timestamps)
- Borders: #1E293B

Typography:
- Font: Inter (headings) + JetBrains Mono (numbers, financial data, code)
- Headings: 600 weight, tracking tight
- Body: 400 weight, 14px
- Financial numbers: JetBrains Mono, tabular-nums, right-aligned
- Small labels: 11px, uppercase, letter-spacing 0.05em, text-tertiary

Layout:
- Collapsible sidebar (240px expanded, 64px collapsed) with icon + label navigation
- Main content area with 24px padding
- Cards with 16px padding, rounded-xl, subtle shadow
- Data tables: alternating row backgrounds (#16161F / #1A1A24), compact rows (40px height)
- No decorative elements. Every pixel serves a purpose.

Components:
- Buttons: rounded-lg, 36px height, subtle hover glow
- Inputs: dark bg (#12121A), 1px border, focus:ring-blue
- Badges/Tags: rounded-full, small, 10px font, muted backgrounds
- Charts: clean lines, no gridlines visible, tooltips on hover
- Loading: skeleton shimmer, not spinners
- Modals: centered, dark overlay, max-width 640px

Sidebar navigation items:
1. Dashboard (grid icon)
2. Companies (building icon)
3. Documents (file-text icon)
4. Deals (briefcase icon)
5. AI Chat (message-square icon)
6. Generate (wand icon)
7. Comparables (bar-chart icon)
8. Audit Log (shield icon)
9. Settings (gear icon)

Header: Minimal. Logo "FinAI" on left (blue accent). Search bar center. User avatar + notifications right.

This is for a UK financial advisory firm. The data shown should look real — company names, financial figures in GBP (£), realistic deal names, realistic financial ratios.
```

---

## Page 1: Dashboard (Home)

```
Page: Dashboard — the home screen after login.

Layout:
Top row — 4 metric cards in a horizontal grid:
1. "Active Deals" — number (e.g., 7), small sparkline, +2 this month tag
2. "Documents Processed" — number (e.g., 143), this week count
3. "Materials Generated" — number (e.g., 28), pending review count in amber badge
4. "Companies Tracked" — number (e.g., 34), new this week

Second row — 2 columns:
Left (60%): "Deal Pipeline" — horizontal Kanban-style overview
- 5 columns: Origination (3) → NDA Signed (2) → Due Diligence (1) → Negotiation (1) → Closed (0)
- Each deal card shows: company name (anonymized like "Project Atlas"), deal type badge (M&A / Debt / Equity), last activity timestamp
- Cards are compact, dark bg, blue left border accent

Right (40%): "Recent Activity" — vertical feed
- Items like: "Credit memo generated for Project Atlas" (2h ago), "New filing detected: TechFlow Ltd" (5h ago), "Teaser approved by Sarah Chen" (yesterday)
- Each item has an icon, description, timestamp, and user avatar

Third row — 2 columns:
Left (50%): "Quick Actions" — 4 large action cards in 2x2 grid
- "Upload Document" (file-plus icon), "Lookup Company" (search icon), "Generate Material" (wand icon), "Chat with Docs" (message icon)
- Each card: icon, title, one-line description, hover:border-blue

Right (50%): "Watchlist Alerts" — companies with new filings or metric changes
- Table: Company | Alert Type | Date | Action button
- Example rows: "TechFlow Ltd | New Annual Accounts | 2 Mar 2026 | View", "Meridian Corp | Director Change | 28 Feb 2026 | View"

Make it feel like a Bloomberg terminal that's been redesigned by the Linear team — data-dense but clean, premium but functional.
```

---

## Page 2: Companies — Company List

```
Page: Companies — list of all tracked companies.

Layout:
Top bar: Page title "Companies" on left. "Add Company" button (blue, + icon) on right. Search input in the middle.

Filter row: Pill-style toggles — "All" | "UK" | "US" | "Active Deals" | "Watchlist". Plus a sector dropdown and status dropdown.

Main content: Data table with these columns:
- Company Name (bold, clickable, with small country flag icon)
- Company Number (monospace, muted)
- Sector (badge — e.g., "Technology", "Healthcare", "Financial Services")
- Revenue (£, right-aligned, JetBrains Mono — e.g., "£24.5M")
- EBITDA Margin (% with color — green if >15%, amber if 5-15%, red if <5%)
- Last Filing (date, muted)
- Status (badge — "Active Deal" blue, "Watchlist" purple, "Archived" gray)
- Actions (three-dot menu)

Example data (make it realistic UK companies):
1. Meridian Technology Solutions | 12345678 | Technology | £24.5M | 18.2% | 15 Jan 2026 | Active Deal
2. Hartwell Engineering Group | 09876543 | Industrials | £89.3M | 12.1% | 03 Feb 2026 | Active Deal
3. CloudBridge Analytics Ltd | 14567890 | Technology | £8.7M | 22.4% | 28 Nov 2025 | Watchlist
4. Northern Capital Partners | 11223344 | Financial Services | £156.2M | 31.5% | 20 Dec 2025 | Watchlist
5. Apex Health Systems | 07654321 | Healthcare | £42.1M | 9.8% | 05 Jan 2026 | Archived

Table should have alternating row backgrounds, compact rows, and hover highlighting.
Pagination at bottom: "Showing 1-10 of 34 companies" with page controls.

The "Add Company" flow should feel like a modal: enter company number or name → search Companies House → select → auto-import.
```

---

## Page 3: Company Profile (Detail Page)

```
Page: Company Profile — detailed view of a single company (e.g., "Meridian Technology Solutions").

Layout:
Top section — Company header card:
- Company name large (20px), with sector badge and status badge
- Row of key stats: Company Number | Incorporation Date | Registered Address | Status (Active/Dissolved)
- Action buttons: "Refresh Data", "Add to Deal", "Generate Profile", "View Filings"

Second section — 3-tab interface:
Tab 1: "Financials" (default active)
Tab 2: "Documents"
Tab 3: "Officers & Charges"

TAB 1 — Financials:
Left (60%): Financial table — 5 years side by side:
Headers: Metric | FY2022 | FY2023 | FY2024 | FY2025 | FY2026
Rows (all in £, JetBrains Mono, right-aligned):
- Revenue: £18.2M | £20.1M | £22.8M | £24.5M | —
- EBITDA: £2.9M | £3.4M | £4.1M | £4.5M | —
- EBITDA Margin: 15.9% | 16.9% | 18.0% | 18.2% | —
- Net Income: £1.8M | £2.1M | £2.6M | £2.9M | —
- Total Assets: £15.4M | £17.2M | £19.8M | £22.1M | —
- Net Debt: £4.2M | £3.8M | £3.1M | £2.5M | —
- Leverage (Debt/EBITDA): 1.4x | 1.1x | 0.8x | 0.6x | —

Growth rates shown as small green/red arrows next to each number.

Right (40%): Two charts stacked:
1. Revenue & EBITDA bar chart (4 years, blue bars for revenue, green for EBITDA)
2. Margin trend line chart (clean line, single axis, subtle grid)

TAB 2 — Documents:
List of uploaded + auto-ingested documents for this company.
Columns: Document Name | Type (badge) | Pages | Upload Date | Status (Processed ✓ / Processing ◌)
Example: "Meridian_Annual_Accounts_2025.pdf | Financial Statement | 42 pages | 15 Jan 2026 | ✓ Processed"

TAB 3 — Officers & Charges:
Two sections: Officers table (Name | Role | Appointed | Resigned) and Charges table (Description | Status | Created | Delivered).

Premium, data-dense, institutional feel. Financial numbers are the star — large, monospace, clean alignment.
```

---

## Page 4: Documents Library

```
Page: Documents — central document library across all companies and deals.

Layout:
Top bar: "Documents" title. "Upload" button (blue). Search bar. View toggle (grid/list).

Filter row: Doc type pills — "All" | "Financial Statements" | "Credit Memos" | "Teasers" | "Legal" | "Other". Company dropdown. Deal dropdown. Date range.

Main content — List view (default):
Columns: Document | Company | Type | Pages | Size | Uploaded | Status | Actions
- Status column: "Ready" (green dot), "Processing" (amber spinning), "Failed" (red dot)
- Clicking a document opens a side panel (slide-in from right)

Side panel (when document selected):
- Document name, metadata (type, pages, size, upload date, chunks count, embeddings count)
- "Preview" section: first page thumbnail or text preview
- "Chunks" section: scrollable list of text chunks with page numbers
- "Ask about this document" — mini chat input at bottom
- Action buttons: "Download", "Re-process", "Delete"

Upload area:
- Drag-and-drop zone at top (dashed border, icon, "Drop files here or click to upload")
- Supports: PDF, DOCX, XLSX, CSV
- Shows upload progress bar, then processing steps (Parsing → Chunking → Embedding → Ready)

Grid view alternative: Document cards with thumbnail, title, type badge, page count, company name.

Clean, functional. The document library should feel like a professional data room.
```

---

## Page 5: AI Chat (RAG Interface)

```
Page: AI Chat — conversational interface to query across all ingested documents.

Layout:
Left sidebar (280px): Conversation history
- List of past conversations with titles, timestamps
- "New Chat" button at top
- Search conversations input

Main area: Chat interface
- Clean message bubbles on dark background
- User messages: right-aligned, blue-tinted bg (#1E3A5F)
- AI messages: left-aligned, dark card bg (#16161F), with:
  - Response text (formatted markdown — bold, lists, tables)
  - "Sources" section at bottom of each AI message:
    - Collapsible "Sources (3)" tag
    - When expanded: list of source documents with page numbers, clickable
    - Example: "📄 Meridian_Annual_Accounts_2025.pdf — Page 12" | "📄 Hartwell_CIM_2025.pdf — Page 34"
  - Confidence indicator: small badge "High confidence" (green) / "Medium" (amber) / "Low — verify sources" (red)

Top of chat area: Scope selector
- Dropdown: "All Documents" | "Company: Meridian Tech" | "Deal: Project Atlas" | "Document: specific_file.pdf"
- This filters which documents the RAG searches

Input area at bottom:
- Large text input with placeholder "Ask anything about your documents..."
- Send button (blue arrow icon)
- Attachment icon (to reference a specific document in the query)
- "Thinking..." skeleton animation while generating

Right panel (collapsible, 300px): "Context Panel"
- Shows retrieved document chunks that the AI used for the current answer
- Each chunk: source doc name, page, relevance score (%), highlighted text
- Clicking a chunk could expand to show full context

Example conversation:
User: "What was Meridian's revenue growth rate over the last 3 years?"
AI: "Based on the filed annual accounts, Meridian Technology Solutions showed consistent revenue growth:
- FY2023: £20.1M (+10.4% YoY)
- FY2024: £22.8M (+13.4% YoY)
- FY2025: £24.5M (+7.5% YoY)

The 3-year CAGR is approximately 10.4%. Growth decelerated slightly in FY2025, though EBITDA margins expanded from 16.9% to 18.2% over the same period, suggesting improving operational efficiency.

Sources (2): 📄 Meridian_Annual_Accounts_2025.pdf — Pages 8, 12 | 📄 Meridian_Annual_Accounts_2024.pdf — Page 9"

Make this feel like a premium AI chat — clean, fast, trustworthy. The source citations are critical for financial credibility.
```

---

## Page 6: Generate — Material Generation Studio

```
Page: Generate — the material generation hub. Where analysts create teasers, credit memos, and reports.

Layout:
Top: Page title "Generate" with subtitle "AI-powered financial document generation".

Main content — 3 large cards in a row (select material type):
1. "Deal Teaser" card
   - Icon: file-text
   - Description: "Generate an anonymous 1-5 page executive summary for deal marketing"
   - "Create Teaser →" button

2. "Credit Memo" card
   - Icon: calculator
   - Description: "Generate a credit analysis with financial ratios and risk assessment"
   - "Create Memo →" button

3. "Company Profile" card
   - Icon: building
   - Description: "Generate a comprehensive company research report from public data"
   - "Create Profile →" button

Below cards: "Recent Generations" table
Columns: Title | Type (badge) | Company | Status (Draft/Review/Approved) | Generated | Actions
- Draft = gray badge, Review = amber badge, Approved = green badge
- Actions: View, Edit, Download PDF, Delete

When a card is clicked, open a generation wizard:

GENERATION WIZARD (example: Credit Memo):
Step 1: "Select Company" — search and select from tracked companies
Step 2: "Configure" — checkboxes for sections to include:
  ☑ Borrower Profile ☑ Financial Analysis ☑ Key Ratios ☑ Risk Assessment ☑ Recommendation
  - Select financial periods to include
  - Select comparable companies for benchmarking
Step 3: "Review Sources" — shows which documents and data will be used
  - List of source documents with relevance indicators
  - "Add more sources" option
Step 4: "Generate" — progress indicator:
  "Extracting financial data..." → "Calculating ratios..." → "Drafting narrative..." → "Validating sources..." → "Complete"

After generation: Full preview with:
- Left: rendered document (styled like a real credit memo)
- Right: edit panel (modify sections, regenerate specific sections)
- Bottom: "Approve", "Request Changes", "Download PDF" buttons
- Validation panel: list of source attributions, flagged items if any number couldn't be traced

Premium wizard flow. Each step should feel deliberate and trustworthy — this is generating financial documents, not blog posts.
```

---

## Page 7: Deals — Deal Pipeline

```
Page: Deals — Kanban-style deal pipeline management.

Layout:
Top: "Deals" title. "New Deal" button. View toggle: "Board" | "List". Filter by deal type, team member.

BOARD VIEW (default):
5 columns representing deal stages:
1. "Origination" (blue header accent)
2. "NDA Signed" (blue)
3. "Due Diligence" (amber)
4. "Negotiation" (amber)
5. "Closed" (green)

Each column has deal cards (draggable):
Deal card contents:
- Deal codename (e.g., "Project Atlas") — bold, 14px
- Target company (smaller, muted — e.g., "Meridian Technology Solutions")
- Deal type badge: "M&A" (blue) | "Debt" (purple) | "Equity" (green)
- Progress bar: documents uploaded / required
- Small avatars of assigned team members (2-3 faces)
- Last activity: "2h ago" (muted, bottom right)
- Click to open deal detail

LIST VIEW (alternative):
Table with columns: Deal Name | Target | Type | Stage | Team | Documents | Last Activity | Value

Clicking a deal opens the DEAL ROOM:

DEAL ROOM (full page):
Top: Deal name, target company, stage badge, deal type badge
Tab navigation: "Overview" | "Documents" | "Generated Materials" | "Chat" | "Timeline"

Overview tab:
- Left: Deal details card (type, value range, key dates, team members)
- Right: Document checklist (Financial Statements ✓, Management Accounts ✓, Legal Docs ✗, Market Analysis ◌)
- Bottom: Quick actions (Upload Doc, Generate Teaser, Generate Memo, Chat about Deal)

Documents tab: filtered document library for this deal only
Generated Materials tab: all teasers, memos, reports for this deal with status badges
Chat tab: RAG chat scoped to this deal's documents
Timeline tab: activity feed (uploads, generations, approvals, status changes)

The board should feel like Linear or Notion — premium, minimal, functional. Cards have subtle shadows and smooth hover effects.
```

---

## Page 8: Comparable Companies

```
Page: Comparables — peer company tracking with live market multiples.

Layout:
Top: "Comparable Companies" title. "Add Company" button. "Refresh All" button with last-refreshed timestamp.

Filter row: Sector pills — "All" | "Technology" | "Healthcare" | "Industrials" | "Financial Services"

Main content — Large data table (financial data is the hero):
Columns (all financial data in JetBrains Mono, right-aligned):
- Company Name (left-aligned, bold)
- Ticker (monospace, muted — e.g., "LON:SAGE")
- Sector (small badge)
- Market Cap (£ — e.g., "£12.4B")
- Enterprise Value (£)
- Revenue (£)
- EBITDA (£)
- EV/EBITDA (multiple — e.g., "14.2x", colored: green <10x, neutral 10-20x, red >20x)
- EV/Revenue (multiple)
- P/E Ratio
- EBITDA Margin (%)
- Revenue Growth (% with green/red arrow)

Example data (real UK/US tech companies):
1. Sage Group | LON:SGE | Technology | £12.4B | £13.1B | £2.3B | £580M | 22.6x | 5.7x | 28.4 | 25.2% | +8.1%
2. AVEVA Group | LON:AVV | Technology | £9.8B | £10.2B | £1.5B | £420M | 24.3x | 6.8x | 31.2 | 28.0% | +12.3%
3. Kainos Group | LON:KNOS | Technology | £1.2B | £1.1B | £380M | £72M | 15.3x | 2.9x | 18.7 | 18.9% | +5.2%

Bottom section: Summary stats card
- "Sector Median Multiples" table: EV/EBITDA Median, EV/Revenue Median, P/E Median, Margin Median
- "Selected for Comps" — checkbox column in main table, selected companies' medians calculated live

Right panel (collapsible): Chart view
- Scatter plot: EV/EBITDA vs EBITDA Margin (each company is a dot, labeled)
- Bar chart: Revenue comparison across selected peers

Export button: "Export to Excel" (downloads formatted comps table)

This page should feel like a Bloomberg terminal screen — data-dense, monospace numbers, clean alignment. Every number precisely formatted.
```

---

## Page 9: Audit Log

```
Page: Audit Log — full transparency on all AI actions and user activities.

Layout:
Top: "Audit Log" title with shield icon. Date range picker. Export button.

Filter row: Event type pills — "All" | "Generations" | "Approvals" | "Uploads" | "Logins" | "System". User dropdown. Entity dropdown.

Main content — Event log table:
Columns: Timestamp | User | Action | Entity | Details | Status

Example rows:
1. 11 Mar 2026, 14:32 | Sarah Chen | Generated | Credit Memo | "Project Atlas — Credit Analysis v2" | Draft
2. 11 Mar 2026, 14:28 | AI System | Processed | Document | "Meridian_Annual_Accounts_2025.pdf — 42 pages, 156 chunks" | Complete
3. 11 Mar 2026, 13:45 | James Wright | Approved | Teaser | "Project Atlas — Deal Teaser v1" | Approved (green)
4. 11 Mar 2026, 12:10 | Sarah Chen | Uploaded | Document | "Hartwell_Management_Accounts_Q4.xlsx — 2.1MB" | Processed
5. 11 Mar 2026, 09:30 | AI System | Alert | Company | "New filing detected: TechFlow Ltd — Annual Accounts" | Info

Clicking a row expands to show full details:
- For generations: prompt used, model (Claude Sonnet 4), source documents (list), token count, cost, generation time
- For approvals: before/after status, reviewer comments
- For uploads: file metadata, processing pipeline steps with timing

Color coding:
- Generation events: blue left border
- Approval events: green left border
- Upload events: gray left border
- Alert events: amber left border
- Error events: red left border

Institutional compliance feel. Think: "if an FCA auditor opened this, they'd be satisfied."
```

---

## Page 10: Settings / Admin

```
Page: Settings — system configuration and admin controls.

Layout: Left sub-navigation, right content area.

Sub-nav items:
1. General
2. AI Models
3. API Keys
4. Team
5. Integrations

GENERAL:
- Application name, timezone, default currency (GBP), date format
- Document processing settings: max file size, supported formats, chunk size, overlap

AI MODELS:
- Active model selector: dropdown (Claude Sonnet 4, GPT-4o, Claude Haiku)
- Embedding model: text-embedding-3-small
- Temperature slider (0.0 - 1.0, default 0.2 for financial precision)
- Max tokens per generation
- Cost tracking: this month's spend in a card (total API calls, total tokens, estimated cost)

API KEYS:
- Companies House API Key: masked input (•••••••abc) with test button
- Alpha Vantage API Key: masked input with test button
- LLM API Keys: Anthropic, OpenAI (masked inputs)
- LangSmith: project name + API key

TEAM:
- User table: Name | Email | Role (dropdown: Analyst/Senior/Director/Admin) | Last Login | Actions
- "Invite User" button
- Role permissions matrix showing what each role can do (view/generate/approve/admin)

INTEGRATIONS:
- Connected services with status indicators (green dot = connected, gray = not configured)
- Companies House API ✓ | yfinance ✓ | FRED ✓ | SEC EDGAR ✓ | LangSmith ✓

Clean admin interface. Not flashy — functional and trustworthy.
```

---

## Page 11: Login / Auth

```
Page: Login — clean, premium authentication screen.

Layout: Full-screen, centered card on dark background.

Card (max-width 400px, centered):
- "FinAI" logo/wordmark at top (blue accent on the "AI" part)
- Tagline: "Financial Document Intelligence" in muted text
- Email input field
- Password input field
- "Sign In" button (full-width, blue, rounded-lg)
- "Forgot password?" link below (muted)
- Divider: "or"
- "Sign in with Google" button (outlined, Google icon)

Background: Subtle gradient from #0A0A0F to #0F0F1A. Optional: very faint grid pattern or subtle geometric lines (financial/institutional feel).

Bottom: "© 2026 FinAI" in small muted text.

Premium, minimal, institutional. Like logging into a Bloomberg or Refinitiv product.
```

---

## Component Library Reference

### For all pages, use these consistent components:

**Metric Card:** Dark card, large number (24px, JetBrains Mono), label below (11px, uppercase, muted), optional sparkline or trend arrow, optional badge.

**Data Table:** Dark header row, alternating body rows (#16161F / #1A1A24), sortable columns (click header), compact 40px rows, hover highlight, checkbox column for selection.

**Badge:** Rounded-full, small (10px text), muted background matching the color. Types: blue (active), green (approved/success), amber (pending/review), red (error/risk), gray (archived/inactive), purple (special).

**Action Button:** Rounded-lg, 36px height. Primary (blue bg), Secondary (transparent, border), Destructive (red outline). Subtle hover glow.

**Side Panel:** Slides in from right, 400px width, dark overlay on rest of page. Close button top-right. Used for document preview, detail views, quick actions.

**Empty State:** Centered icon (48px, muted), title, description, CTA button. Example: "No documents yet — Upload your first document to get started."

**Loading:** Skeleton shimmer (pulse animation on placeholder blocks), not spinners. For chat: typing dots animation.

**Toast Notifications:** Bottom-right, dark card, auto-dismiss after 4s. Types: success (green left border), error (red), info (blue), warning (amber).
