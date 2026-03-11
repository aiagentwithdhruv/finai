'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Layers,
  LayoutDashboard,
  Building2,
  FileText,
  Briefcase,
  MessageSquare,
  Wand2,
  BarChart3,
  Shield,
  Settings,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Companies', href: '/companies', icon: Building2 },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Deals', href: '/deals', icon: Briefcase },
  { label: 'AI Chat', href: '/chat', icon: MessageSquare },
  { label: 'Generate', href: '/generate', icon: Wand2 },
  { label: 'Comparables', href: '/comparables', icon: BarChart3 },
  { label: 'Audit Log', href: '/audit', icon: Shield },
] as const

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'bg-[#12121A] border-r border-[#1E293B]',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#1E293B] flex-shrink-0">
          <div className="flex items-center gap-2 text-[#3B82F6] font-semibold text-lg tracking-tight">
            <Layers className="w-5 h-5" />
            <span>FinAI</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
                  active
                    ? 'bg-[#16161F] text-[#F8FAFC]'
                    : 'text-[#94A3B8] hover:bg-[#16161F] hover:text-[#F8FAFC]',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    active
                      ? 'text-[#3B82F6]'
                      : 'text-current group-hover:text-[#3B82F6]',
                  ].join(' ')}
                />
                <span className={active ? 'font-medium' : ''}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-[#1E293B] flex-shrink-0">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#16161F] hover:text-[#F8FAFC] transition-colors group"
          >
            <Settings className="w-5 h-5 flex-shrink-0 group-hover:text-[#3B82F6] transition-colors" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
