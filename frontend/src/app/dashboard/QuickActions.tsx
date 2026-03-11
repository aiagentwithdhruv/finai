import Link from 'next/link'
import {
  FilePlus2,
  Wand2,
  Search,
  MessageSquare,
  BarChart2,
  ClipboardList,
} from 'lucide-react'

interface Action {
  label: string
  description: string
  href: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
}

const ACTIONS: Action[] = [
  {
    label: 'Upload Document',
    description: 'Add files for AI analysis',
    href: '/documents/upload',
    Icon: FilePlus2,
    iconBg: 'bg-[#3B82F6]/10 group-hover:bg-[#3B82F6]/20',
    iconColor: 'text-[#3B82F6]',
  },
  {
    label: 'Generate Material',
    description: 'Create memos, teasers, CIMs',
    href: '/generate',
    Icon: Wand2,
    iconBg: 'bg-[#10B981]/10 group-hover:bg-[#10B981]/20',
    iconColor: 'text-[#10B981]',
  },
  {
    label: 'Lookup Company',
    description: 'Search UK company data',
    href: '/companies',
    Icon: Search,
    iconBg: 'bg-[#F59E0B]/10 group-hover:bg-[#F59E0B]/20',
    iconColor: 'text-[#F59E0B]',
  },
  {
    label: 'AI Chat',
    description: 'Ask AI about documents',
    href: '/chat',
    Icon: MessageSquare,
    iconBg: 'bg-[#3B82F6]/10 group-hover:bg-[#3B82F6]/20',
    iconColor: 'text-[#3B82F6]',
  },
  {
    label: 'View Comparables',
    description: 'Sector benchmarks & comps',
    href: '/comparables',
    Icon: BarChart2,
    iconBg: 'bg-[#10B981]/10 group-hover:bg-[#10B981]/20',
    iconColor: 'text-[#10B981]',
  },
  {
    label: 'Audit Log',
    description: 'View all system events',
    href: '/audit',
    Icon: ClipboardList,
    iconBg: 'bg-[#475569]/10 group-hover:bg-[#475569]/20',
    iconColor: 'text-[#475569]',
  },
]

export default function QuickActions() {
  return (
    <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map(({ label, description, href, Icon, iconBg, iconColor }) => (
          <Link
            key={label}
            href={href}
            className="bg-[#0A0A0F] border border-[#1E293B] rounded-lg p-4 text-left hover:border-[#1E293B]/60 hover:bg-[#12121A] transition-all group"
          >
            <div
              className={[
                'w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors',
                iconBg,
              ].join(' ')}
            >
              <Icon className={['w-4 h-4', iconColor].join(' ')} />
            </div>
            <div className="text-xs font-medium text-[#F8FAFC] mb-1 leading-snug">{label}</div>
            <div className="text-[11px] text-[#475569] leading-snug">{description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
