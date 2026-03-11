'use client'

import { Menu, Search, Bell, Layers } from 'lucide-react'
import Image from 'next/image'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-[#1E293B] bg-[#0A0A0F] flex-shrink-0">
      {/* Left — mobile menu + logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-[#3B82F6] font-semibold text-lg tracking-tight lg:hidden">
          <Layers className="w-5 h-5" />
          <span>FinAI</span>
        </div>
      </div>

      {/* Center — search */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
        <input
          type="text"
          placeholder="Search companies, deals, or documents..."
          className="w-full h-9 bg-[#12121A] border border-[#1E293B] rounded-lg pl-9 pr-16 py-1.5 text-sm text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#3B82F6] transition-colors"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="text-[10px] text-[#475569] border border-[#1E293B] rounded px-1.5 py-0.5 bg-[#0A0A0F] font-mono">
            ⌘
          </kbd>
          <kbd className="text-[10px] text-[#475569] border border-[#1E293B] rounded px-1.5 py-0.5 bg-[#0A0A0F] font-mono">
            K
          </kbd>
        </div>
      </div>

      {/* Right — notifications + avatar */}
      <div className="flex items-center gap-4">
        <button
          className="relative text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#3B82F6] rounded-full border border-[#0A0A0F]" />
        </button>

        <button
          className="w-8 h-8 rounded-full overflow-hidden border border-[#1E293B] flex-shrink-0"
          aria-label="User menu"
        >
          <Image
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
            alt="User"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  )
}
