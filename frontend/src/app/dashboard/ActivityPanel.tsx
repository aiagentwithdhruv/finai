import {
  Ellipsis,
  FileText,
  AlertTriangle,
  CheckCircle,
  Upload,
  Building2,
} from 'lucide-react'

type IconType = 'document' | 'alert' | 'check' | 'upload' | 'company'

interface Activity {
  id: number
  iconType: IconType
  message: string
  time: string
  actor: string
}

const ICON_CONFIG: Record<IconType, { bg: string; color: string; Icon: React.ElementType }> = {
  document: { bg: 'bg-[#3B82F6]/10', color: 'text-[#3B82F6]', Icon: FileText },
  alert:    { bg: 'bg-[#F59E0B]/10', color: 'text-[#F59E0B]', Icon: AlertTriangle },
  check:    { bg: 'bg-[#10B981]/10', color: 'text-[#10B981]', Icon: CheckCircle },
  upload:   { bg: 'bg-[#3B82F6]/10', color: 'text-[#3B82F6]', Icon: Upload },
  company:  { bg: 'bg-[#475569]/10', color: 'text-[#475569]', Icon: Building2 },
}

const ACTIVITIES: Activity[] = [
  {
    id: 1,
    iconType: 'check',
    message: 'Credit memo approved for Project Atlas',
    time: '2h ago',
    actor: 'James Mitchell',
  },
  {
    id: 2,
    iconType: 'upload',
    message: 'Documents uploaded: Q4_Financials.pdf',
    time: '4h ago',
    actor: 'David Park',
  },
  {
    id: 3,
    iconType: 'alert',
    message: 'New filing detected: TechFlow Ltd',
    time: '6h ago',
    actor: 'System',
  },
  {
    id: 4,
    iconType: 'document',
    message: 'Teaser generated for Project Horizon',
    time: 'Yesterday',
    actor: 'Sarah Chen',
  },
  {
    id: 5,
    iconType: 'company',
    message: 'Company data refreshed: Meridian Corp',
    time: 'Yesterday',
    actor: 'System',
  },
  {
    id: 6,
    iconType: 'check',
    message: 'DD documents reviewed for Project Zenith',
    time: '2 days ago',
    actor: 'Alex Turner',
  },
]

export default function ActivityPanel() {
  return (
    <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-5 shadow-sm h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">Recent Activity</h3>
        <button className="text-[#475569] hover:text-[#F8FAFC] transition-colors">
          <Ellipsis className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {ACTIVITIES.map((item, idx) => {
          const { bg, color, Icon } = ICON_CONFIG[item.iconType]
          const isLast = idx === ACTIVITIES.length - 1
          return (
            <div
              key={item.id}
              className={[
                'flex gap-3 px-2 py-3 rounded-lg hover:bg-[#0A0A0F] transition-colors cursor-default',
                !isLast ? 'border-b border-[#1E293B]/40' : '',
              ].join(' ')}
            >
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  bg,
                ].join(' ')}
              >
                <Icon className={['w-3.5 h-3.5', color].join(' ')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#F8FAFC] mb-1 leading-snug">{item.message}</div>
                <div className="flex items-center gap-2 text-[10px] text-[#475569] font-mono">
                  <span>{item.time}</span>
                  <span>•</span>
                  <span>{item.actor}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
