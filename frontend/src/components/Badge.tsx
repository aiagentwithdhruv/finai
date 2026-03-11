import { type ReactNode } from 'react'

type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',
  green: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20',
  amber: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
  red: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
  gray: 'bg-[#94A3B8]/10 text-[#94A3B8] border border-[#94A3B8]/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
