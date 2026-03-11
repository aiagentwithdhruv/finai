import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'

type AlertSeverity = 'new-filing' | 'director-change' | 'charge' | 'overdue'

interface WatchlistAlert {
  id: number
  company: string
  companySlug: string
  alertType: string
  severity: AlertSeverity
  date: string
}

const SEVERITY_STYLES: Record<AlertSeverity, { badge: string; icon: string }> = {
  'new-filing':      { badge: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',  icon: 'text-[#3B82F6]' },
  'director-change': { badge: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',  icon: 'text-[#F59E0B]' },
  'charge':          { badge: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',  icon: 'text-[#EF4444]' },
  'overdue':         { badge: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',  icon: 'text-[#EF4444]' },
}

const ALERTS: WatchlistAlert[] = [
  {
    id: 1,
    company: 'TechFlow Ltd',
    companySlug: 'techflow-ltd',
    alertType: 'New Filing',
    severity: 'new-filing',
    date: '2 Mar 2026',
  },
  {
    id: 2,
    company: 'Meridian Corp',
    companySlug: 'meridian-corp',
    alertType: 'Director Change',
    severity: 'director-change',
    date: '28 Feb 2026',
  },
  {
    id: 3,
    company: 'Apex Financial',
    companySlug: 'apex-financial',
    alertType: 'Charge Registered',
    severity: 'charge',
    date: '25 Feb 2026',
  },
  {
    id: 4,
    company: 'CloudScale Data',
    companySlug: 'cloudscale-data',
    alertType: 'Overdue Accounts',
    severity: 'overdue',
    date: '23 Feb 2026',
  },
]

export default function WatchlistAlerts() {
  return (
    <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-[#F8FAFC] tracking-tight">Watchlist Alerts</h3>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[10px] font-mono font-semibold border border-[#EF4444]/20">
            {ALERTS.length}
          </span>
        </div>
        <Link
          href="/companies"
          className="text-[11px] text-[#475569] hover:text-[#94A3B8] transition-colors font-medium tracking-wide"
        >
          View all
        </Link>
      </div>

      <div className="space-y-2">
        {ALERTS.map((alert) => {
          const { badge, icon } = SEVERITY_STYLES[alert.severity]
          return (
            <Link
              key={alert.id}
              href={`/companies/${alert.companySlug}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0F] border border-[#1E293B] hover:border-[#1E293B]/60 hover:bg-[#12121A] transition-all group"
            >
              <div className="flex-shrink-0">
                <AlertTriangle className={['w-4 h-4', icon].join(' ')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#F8FAFC] truncate">
                    {alert.company}
                  </span>
                  <span
                    className={[
                      'flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                      badge,
                    ].join(' ')}
                  >
                    {alert.alertType}
                  </span>
                </div>
                <div className="text-[10px] text-[#475569] font-mono">{alert.date}</div>
              </div>

              <ArrowRight className="w-3 h-3 text-[#475569] group-hover:text-[#94A3B8] flex-shrink-0 transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
