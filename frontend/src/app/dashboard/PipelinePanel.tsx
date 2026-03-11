import { Ellipsis } from 'lucide-react'

type DealType = 'M&A' | 'Equity' | 'Debt'

interface PipelineDeal {
  name: string
  type: DealType
  updated: string
  accentColor: string
}

interface PipelineColumn {
  stage: string
  deals: PipelineDeal[]
}

const TYPE_STYLES: Record<DealType, string> = {
  'M&A': 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',
  Equity: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20',
  Debt: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
}

const COLUMNS: PipelineColumn[] = [
  {
    stage: 'Origination',
    deals: [
      { name: 'Project Atlas', type: 'M&A', updated: '3h ago', accentColor: '#3B82F6' },
      { name: 'Project Horizon', type: 'Equity', updated: '5h ago', accentColor: '#3B82F6' },
      { name: 'Project Cascade', type: 'Debt', updated: '1d ago', accentColor: '#3B82F6' },
    ],
  },
  {
    stage: 'NDA Signed',
    deals: [
      { name: 'Project Phoenix', type: 'M&A', updated: '2h ago', accentColor: '#3B82F6' },
      { name: 'Project Nova', type: 'Equity', updated: '4h ago', accentColor: '#3B82F6' },
    ],
  },
  {
    stage: 'Due Diligence',
    deals: [
      { name: 'Project Zenith', type: 'M&A', updated: '1h ago', accentColor: '#F59E0B' },
    ],
  },
  {
    stage: 'Negotiation',
    deals: [
      { name: 'Project Meridian', type: 'Debt', updated: '30m ago', accentColor: '#10B981' },
    ],
  },
  {
    stage: 'Closed',
    deals: [],
  },
]

export default function PipelinePanel() {
  return (
    <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-5 shadow-sm h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">Deal Pipeline</h3>
        <button className="text-[#475569] hover:text-[#F8FAFC] transition-colors">
          <Ellipsis className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <div key={col.stage} className="flex-shrink-0 w-48">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                {col.stage}
              </span>
              <span className="text-xs font-mono text-[#475569] bg-[#12121A] px-1.5 py-0.5 rounded">
                {col.deals.length}
              </span>
            </div>

            <div className="space-y-2">
              {col.deals.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[#475569] text-xs">
                  No closed deals
                </div>
              ) : (
                col.deals.map((deal) => (
                  <div
                    key={deal.name}
                    className="bg-[#0A0A0F] p-3 rounded-lg cursor-pointer hover:bg-[#12121A] transition-colors"
                    style={{ borderLeft: `2px solid ${deal.accentColor}` }}
                  >
                    <div className="text-xs font-medium text-[#F8FAFC] mb-1">{deal.name}</div>
                    <span
                      className={[
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mb-2',
                        TYPE_STYLES[deal.type],
                      ].join(' ')}
                    >
                      {deal.type}
                    </span>
                    <div className="text-[10px] text-[#475569] font-mono">
                      Updated {deal.updated}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
