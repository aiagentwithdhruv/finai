import { FileText } from 'lucide-react'

const BAR_HEIGHTS = [40, 55, 45, 70, 60, 85, 100]

export default function MetricsRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Active Deals */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Active Deals
          </span>
          <span className="text-[#10B981] text-xs font-medium bg-[#10B981]/10 px-1.5 py-0.5 rounded">
            +2 this month
          </span>
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">7</div>
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor: `rgba(59,130,246,${0.2 + i * 0.12})`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Documents Processed */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Documents Processed
          </span>
          <FileText className="w-4 h-4 text-[#475569]" />
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">143</div>
        <div className="text-xs text-[#94A3B8] mt-2 font-mono">28 this week</div>
      </div>

      {/* Materials Generated */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Materials Generated
          </span>
          <span className="text-[#F59E0B] text-xs font-medium bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
            5 pending review
          </span>
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">28</div>
        <div className="text-xs text-[#94A3B8] mt-2 font-mono">Last: Credit Memo</div>
      </div>

      {/* Companies Tracked */}
      <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[11px] leading-4 tracking-widest uppercase font-medium text-[#475569]">
            Companies Tracked
          </span>
          <span className="text-[#3B82F6] text-xs font-medium bg-[#3B82F6]/10 px-1.5 py-0.5 rounded">
            3 new this week
          </span>
        </div>
        <div className="text-3xl font-mono font-semibold text-[#F8FAFC] tabular-nums">34</div>
        <div className="text-xs text-[#94A3B8] mt-2 font-mono">12 with alerts</div>
      </div>

    </div>
  )
}
