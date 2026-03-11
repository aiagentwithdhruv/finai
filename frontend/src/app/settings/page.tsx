'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import {
  Settings,
  Key,
  Users,
  Bell,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Check,
  ChevronDown,
} from 'lucide-react'

type Tab = 'general' | 'api-keys' | 'team' | 'notifications'

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const TEAM_MEMBERS = [
  { id: '1', name: 'James Whitfield', email: 'j.whitfield@meridianfin.co.uk', role: 'Admin', initials: 'JW', color: '#3B82F6', lastLogin: '2h ago' },
  { id: '2', name: 'Sarah Reeves', email: 's.reeves@meridianfin.co.uk', role: 'Director', initials: 'SR', color: '#10B981', lastLogin: '5h ago' },
  { id: '3', name: 'Amanda Mills', email: 'a.mills@meridianfin.co.uk', role: 'Analyst', initials: 'AM', color: '#8B5CF6', lastLogin: '1d ago' },
  { id: '4', name: 'Peter Hamilton', email: 'p.hamilton@meridianfin.co.uk', role: 'Analyst', initials: 'PH', color: '#F59E0B', lastLogin: '3h ago' },
  { id: '5', name: 'Tom Kirby', email: 't.kirby@meridianfin.co.uk', role: 'Director', initials: 'TK', color: '#06B6D4', lastLogin: '4d ago' },
]

const roleVariant: Record<string, 'blue' | 'green' | 'gray'> = {
  Admin: 'blue',
  Director: 'green',
  Analyst: 'gray',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectField({
  label,
  options,
  defaultValue,
}: {
  label: string
  options: string[]
  defaultValue: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          defaultValue={defaultValue}
          className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-8 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors appearance-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
      </div>
    </div>
  )
}

function ApiKeyField({ label, maskedValue }: { label: string; maskedValue: string }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [tested, setTested] = useState(false)

  function handleCopy() {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleTest() {
    setTesting(true)
    setTimeout(() => { setTesting(false); setTested(true) }, 1200)
  }

  return (
    <div>
      <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            defaultValue={maskedValue}
            className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 pr-10 text-sm text-[#F8FAFC] font-mono focus:outline-none focus:border-[#3B82F6] transition-colors"
            readOnly
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="h-10 px-3 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#94A3B8] rounded-lg transition-colors flex items-center gap-1.5 text-xs"
          title="Copy key"
        >
          {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="h-10 px-4 bg-[#12121A] border border-[#1E293B] hover:bg-[#1E293B] text-[#F8FAFC] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {testing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : tested ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[#10B981]">OK</span>
            </>
          ) : (
            'Test'
          )}
        </button>
      </div>
    </div>
  )
}

function Toggle({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1E293B] last:border-0">
      <div>
        <div className="text-sm font-medium text-[#F8FAFC]">{label}</div>
        <div className="text-xs text-[#475569] mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-[#3B82F6]' : 'bg-[#1E293B]'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#F8FAFC]">Settings</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Configure application preferences, credentials, and team access</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-[#1E293B] overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === id
                  ? 'text-[#3B82F6] border-[#3B82F6]'
                  : 'text-[#94A3B8] border-transparent hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-w-3xl space-y-6">

          {/* ── General ── */}
          {activeTab === 'general' && (
            <>
              <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Firm Details</h3>
                <div>
                  <label className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Meridian Financial Advisory"
                    className="w-full h-10 bg-[#12121A] border border-[#1E293B] rounded-lg px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Default Currency"
                    options={['GBP (£)', 'USD ($)', 'EUR (€)', 'CHF (Fr)']}
                    defaultValue="GBP (£)"
                  />
                  <SelectField
                    label="Timezone"
                    options={['Europe/London (GMT)', 'Europe/Paris (CET)', 'America/New_York (EST)', 'Asia/Singapore (SGT)']}
                    defaultValue="Europe/London (GMT)"
                  />
                </div>
                <SelectField
                  label="Date Format"
                  options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']}
                  defaultValue="DD/MM/YYYY"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="h-9 px-6 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
                </button>
              </div>
            </>
          )}

          {/* ── API Keys ── */}
          {activeTab === 'api-keys' && (
            <>
              <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">LLM Providers</h3>
                  <span className="text-xs text-[#475569] bg-[#12121A] border border-[#1E293B] rounded px-2 py-1 font-mono">
                    Encrypted at rest
                  </span>
                </div>
                <ApiKeyField label="OpenAI API Key" maskedValue="sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
                <ApiKeyField label="Anthropic API Key" maskedValue="sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
              </div>

              <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-[#F8FAFC]">Data Providers</h3>
                <ApiKeyField label="Companies House API Key" maskedValue="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" />
                <ApiKeyField label="Bloomberg Terminal Key" maskedValue="bb-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="h-9 px-6 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Keys'}
                </button>
              </div>
            </>
          )}

          {/* ── Team ── */}
          {activeTab === 'team' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#94A3B8]">{TEAM_MEMBERS.length} members</p>
                <button className="h-9 px-4 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Invite Member
                </button>
              </div>

              <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1E293B]">
                      {['Member', 'Email', 'Role', 'Last Login', 'Access'].map((h) => (
                        <th key={h} className="py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {TEAM_MEMBERS.map((member, i) => (
                      <tr
                        key={member.id}
                        className={`border-b border-[#1E293B]/50 hover:bg-[#1E293B]/20 transition-colors ${i % 2 === 1 ? 'bg-[#1A1A24]' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </div>
                            <span className="text-[#F8FAFC] font-medium whitespace-nowrap">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs font-mono">{member.email}</td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <select
                              defaultValue={member.role}
                              className="bg-[#12121A] border border-[#1E293B] rounded-lg pl-2.5 pr-7 py-1 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] appearance-none cursor-pointer"
                            >
                              {['Analyst', 'Director', 'Admin', 'Read Only'].map((r) => (
                                <option key={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569] pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#475569] text-xs font-mono">{member.lastLogin}</td>
                        <td className="px-4 py-3">
                          <Badge variant={roleVariant[member.role] ?? 'gray'}>
                            {member.role}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <>
              <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">Email Alerts</h3>
                <p className="text-xs text-[#475569] mb-4">Control which events trigger email notifications</p>
                <div>
                  <Toggle
                    label="Email Alerts"
                    description="Receive email notifications for important platform events"
                    defaultChecked
                  />
                  <Toggle
                    label="New Filing Notifications"
                    description="Alert when a tracked company files new documents at Companies House"
                    defaultChecked
                  />
                  <Toggle
                    label="Review Reminders"
                    description="Daily digest of materials pending your review approval"
                    defaultChecked
                  />
                  <Toggle
                    label="Deal Stage Changes"
                    description="Notify when a deal advances or regresses in the pipeline"
                  />
                  <Toggle
                    label="Document Processing Failures"
                    description="Alert when a document ingestion or embedding fails"
                    defaultChecked
                  />
                  <Toggle
                    label="Weekly Activity Summary"
                    description="Monday morning digest of platform activity across all deals"
                  />
                </div>
              </div>

              <div className="bg-[#16161F] border border-[#1E1E2E] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">In-App Notifications</h3>
                <p className="text-xs text-[#475569] mb-4">Control the notification badge and in-app alerts</p>
                <div>
                  <Toggle
                    label="Mention Alerts"
                    description="Notify when another team member tags you in a comment"
                    defaultChecked
                  />
                  <Toggle
                    label="Material Ready for Review"
                    description="Prompt when a generated document is ready for your approval"
                    defaultChecked
                  />
                  <Toggle
                    label="System Alerts"
                    description="Critical security and system health notifications"
                    defaultChecked
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="h-9 px-6 bg-[#3B82F6] hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Preferences'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
