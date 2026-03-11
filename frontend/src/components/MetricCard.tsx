import { TrendingUp, TrendingDown } from 'lucide-react'
import Badge from './Badge'

type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple'
type TrendDirection = 'up' | 'down'

export interface MetricCardProps {
  label: string
  value: string
  trend?: {
    direction: TrendDirection
    label: string
  }
  badge?: {
    variant: BadgeVariant
    text: string
  }
  className?: string
}

export default function MetricCard({
  label,
  value,
  trend,
  badge,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`bg-[#16161F] border border-[#1E1E2E] rounded-xl p-4 flex flex-col gap-2 ${className}`}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-[#475569]">
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-2xl font-mono font-medium tabular-nums text-[#F8FAFC] leading-none">
          {value}
        </div>
        {badge && (
          <Badge variant={badge.variant}>{badge.text}</Badge>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
          )}
          <span
            className={
              trend.direction === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'
            }
          >
            {trend.label}
          </span>
        </div>
      )}
    </div>
  )
}
