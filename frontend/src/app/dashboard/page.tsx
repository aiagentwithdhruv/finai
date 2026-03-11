import DashboardLayout from '@/components/DashboardLayout'
import MetricsRow from './MetricsRow'
import PipelinePanel from './PipelinePanel'
import ActivityPanel from './ActivityPanel'
import QuickActions from './QuickActions'
import WatchlistAlerts from './WatchlistAlerts'
import { Plus } from 'lucide-react'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">
              Dashboard
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Active deals, recent activity, and quick actions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#475569] font-mono">
              Last updated: 2 min ago
            </span>
            <button className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <Plus className="w-3 h-3" />
              New Deal
            </button>
          </div>
        </div>

        {/* Metrics */}
        <MetricsRow />

        {/* Pipeline + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <PipelinePanel />
          </div>
          <div className="lg:col-span-2">
            <ActivityPanel />
          </div>
        </div>

        {/* Quick Actions + Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <WatchlistAlerts />
        </div>

      </div>
    </DashboardLayout>
  )
}
