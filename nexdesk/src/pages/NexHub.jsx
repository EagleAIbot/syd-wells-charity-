import { useState } from 'react'
import { ExternalLink, FileText, Users, Calculator, FolderOpen, ShieldCheck, Home, Banknote, Lock, LayoutTemplate } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'

const BROKER_SECTIONS = [
  {
    id: 'hr',
    label: 'HR',
    icon: Users,
    color: '#1ECFB3',
    portalUrl: '/portal/hr',
    items: [
      { label: 'Employee Handbook', type: 'PDF', updated: '2026-04-01' },
      { label: 'Leave Request Form', type: 'Form', updated: '2026-03-15' },
      { label: 'Onboarding Checklist', type: 'Doc', updated: '2026-01-10' },
      { label: 'Commission Structure 2026', type: 'PDF', updated: '2026-01-01' },
    ],
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: Calculator,
    color: '#4EECD8',
    portalUrl: '/portal/accounts',
    items: [
      { label: 'Invoice Template', type: 'XLSX', updated: '2026-04-20' },
      { label: 'Expense Report Q1', type: 'PDF', updated: '2026-04-05' },
      { label: 'Bank Details', type: 'Doc', updated: '2025-12-01' },
    ],
  },
  {
    id: 'conveyancing',
    label: 'Conveyancing',
    icon: Home,
    color: '#0ea5e9',
    portalUrl: '/portal/conveyancing',
    items: [
      { label: 'Title Transfer Guide', type: 'PDF', updated: '2026-04-10' },
      { label: 'DLD Fee Structure', type: 'PDF', updated: '2026-03-01' },
      { label: 'NOC Request Template', type: 'Doc', updated: '2026-02-20' },
      { label: 'Transfer Checklist', type: 'Doc', updated: '2026-01-15' },
    ],
  },
  {
    id: 'mortgages',
    label: 'Mortgages',
    icon: Banknote,
    color: '#8b5cf6',
    portalUrl: '/portal/mortgages',
    items: [
      { label: 'Mortgage Eligibility Guide', type: 'PDF', updated: '2026-04-08' },
      { label: 'Preferred Lenders List', type: 'Doc', updated: '2026-03-20' },
      { label: 'Mortgage Calculator (XLS)', type: 'XLSX', updated: '2026-02-28' },
      { label: 'Pre-Approval Process', type: 'PDF', updated: '2026-01-10' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & Compliance',
    icon: ShieldCheck,
    color: '#f59e0b',
    items: [
      { label: 'Agency Agreement Template', type: 'PDF', updated: '2026-03-01' },
      { label: 'Data Privacy Policy', type: 'PDF', updated: '2026-02-14' },
      { label: 'RERA Compliance Guide', type: 'PDF', updated: '2026-01-20' },
    ],
  },
  {
    id: 'shared',
    label: 'Company Shared Files',
    icon: FolderOpen,
    color: '#94a3b8',
    items: [
      { label: 'Brand Guidelines', type: 'PDF', updated: '2026-04-10' },
      { label: 'Presentation Template', type: 'PPTX', updated: '2026-03-22' },
      { label: 'Area Guide — Dubai Marina', type: 'PDF', updated: '2026-02-28' },
      { label: 'Area Guide — Downtown Dubai', type: 'PDF', updated: '2026-02-28' },
    ],
  },
  {
    id: 'training',
    label: 'Training & Knowledgebase',
    icon: FileText,
    color: '#22c55e',
    items: [
      { label: 'CRM User Guide', type: 'Doc', updated: '2026-05-01' },
      { label: 'Viewing Best Practices', type: 'PDF', updated: '2026-04-15' },
      { label: 'Dubai Market Overview Q2 2026', type: 'PDF', updated: '2026-04-01' },
    ],
  },
]

const MANAGEMENT_SECTIONS = [
  {
    id: 'hr-mgmt',
    label: 'HR Management',
    icon: Users,
    color: '#1ECFB3',
    restricted: true,
    items: [
      { label: 'Staff Contracts', type: 'PDF', updated: '2026-04-01' },
      { label: 'Payroll Summary Q1 2026', type: 'XLSX', updated: '2026-04-15' },
      { label: 'Performance Review Templates', type: 'Doc', updated: '2026-03-01' },
      { label: 'Disciplinary Procedures', type: 'PDF', updated: '2026-01-10' },
    ],
  },
  {
    id: 'accounts-mgmt',
    label: 'Accounts & Finance',
    icon: Calculator,
    color: '#4EECD8',
    restricted: true,
    items: [
      { label: 'P&L Statement Q1 2026', type: 'XLSX', updated: '2026-04-20' },
      { label: 'Commission Ledger', type: 'XLSX', updated: '2026-04-18' },
      { label: 'VAT Returns', type: 'PDF', updated: '2026-04-05' },
      { label: 'Bank Reconciliation', type: 'XLSX', updated: '2026-03-31' },
    ],
  },
  {
    id: 'legal-mgmt',
    label: 'Legal & Compliance',
    icon: ShieldCheck,
    color: '#f59e0b',
    restricted: true,
    items: [
      { label: 'RERA Brokerage Licence', type: 'PDF', updated: '2026-01-01' },
      { label: 'MOU Templates', type: 'Doc', updated: '2026-03-10' },
      { label: 'AML Procedures', type: 'PDF', updated: '2026-02-01' },
      { label: 'Data Protection Register', type: 'XLSX', updated: '2026-02-14' },
    ],
  },
]

const TYPE_COLORS = {
  PDF: 'indigo',
  Doc: 'mint',
  XLSX: 'outline',
  PPTX: 'outline',
  Form: 'mint',
}

function SectionGrid({ sections }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <Card key={section.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${section.color}18` }}>
                  <Icon className="h-4 w-4" style={{ color: section.color }} />
                </span>
                <span className="flex-1">{section.label}</span>
                {section.restricted && <Lock className="h-3 w-3 text-slate/50" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-2">
              {section.items.map((item) => (
                <div key={item.label}
                  className="flex items-center justify-between gap-2 rounded-xl border border-carbon/[0.06] px-3 py-2 hover:border-indigo/30 cursor-pointer transition dark:border-white/10">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-carbon dark:text-surface">{item.label}</p>
                    <p className="text-xs text-slate dark:text-surface/55">Updated {item.updated}</p>
                  </div>
                  <Badge variant={TYPE_COLORS[item.type] ?? 'outline'} className="shrink-0 text-[10px]">
                    {item.type}
                  </Badge>
                </div>
              ))}
              <button type="button" className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-carbon/15 py-2 text-xs text-slate hover:border-indigo/30 dark:border-white/15">
                + Upload file
              </button>
              {section.portalUrl && (
                <a
                  href={section.portalUrl}
                  className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo/20 bg-indigo/[0.04] py-2 text-xs font-semibold text-indigo hover:bg-indigo/10 transition dark:border-indigo/30 dark:bg-indigo/10"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Go to portal
                </a>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const TEMPLATE_ITEMS = [
  { id: 'offer-letter-rental', label: 'Rental Offer Letter', category: 'Offer Letters', updated: '2026-05-01' },
  { id: 'offer-letter-sale', label: 'Sale Offer Letter', category: 'Offer Letters', updated: '2026-05-01' },
  { id: 'tenancy-contract', label: 'Tenancy Contract (RERA)', category: 'Contracts', updated: '2026-04-15' },
  { id: 'form-a', label: 'Form A — Exclusive Listing', category: 'Listing Forms', updated: '2026-04-10' },
  { id: 'form-f', label: 'Form F — MOU', category: 'Contracts', updated: '2026-03-28' },
  { id: 'noc-request', label: 'NOC Request Letter', category: 'Legal', updated: '2026-03-15' },
  { id: 'power-of-attorney', label: 'Power of Attorney', category: 'Legal', updated: '2026-02-20' },
  { id: 'viewing-feedback', label: 'Viewing Feedback Form', category: 'Internal', updated: '2026-05-05' },
]

export default function NexHub() {
  const [scope, setScope] = useState('broker')
  const SECTIONS = scope === 'broker' ? BROKER_SECTIONS : MANAGEMENT_SECTIONS
  const [active, setActive] = useState('all')
  const visible = active === 'all' ? SECTIONS : SECTIONS.filter((s) => s.id === active)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="NexHub"
        subtitle="Central hub for HR, accounts, legal, conveyancing, mortgages, and company shared resources."
        actions={<Badge variant="indigo" className="text-xs">Company workspace</Badge>}
      />

      {/* Broker / Management toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate dark:text-surface/70">View:</span>
        <div className="flex rounded-xl border border-carbon/10 p-1 dark:border-white/10 bg-white dark:bg-carbon-800">
          {[{ id: 'broker', label: 'Broker' }, { id: 'management', label: 'Management' }].map((opt) => (
            <button key={opt.id} type="button" onClick={() => { setScope(opt.id); setActive('all') }}
              className={cn('flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition',
                scope === opt.id ? 'bg-indigo text-white shadow-sm' : 'text-slate hover:text-carbon dark:text-surface/70')}>
              {opt.id === 'management' && <Lock className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', label: 'All' }, ...SECTIONS.map((s) => ({ id: s.id, label: s.label }))].map((opt) => (
          <button key={opt.id} type="button" onClick={() => setActive(opt.id)}
            className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium transition',
              active === opt.id ? 'bg-indigo text-white border-indigo' : 'border-carbon/10 text-slate hover:border-indigo/30 dark:border-white/10 dark:text-surface/70')}>
            {opt.label}
          </button>
        ))}
      </div>

      <SectionGrid sections={visible} />

      {/* Templates section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-indigo" />
          <h3 className="text-sm font-semibold text-carbon dark:text-surface">Document Templates</h3>
        </div>
        <p className="text-sm text-slate dark:text-surface/70">Pre-built document templates. Select one to preview, customise, or generate from a record.</p>
        {['Offer Letters', 'Contracts', 'Listing Forms', 'Legal', 'Internal'].map((cat) => {
          const items = TEMPLATE_ITEMS.filter((t) => t.category === cat)
          if (!items.length) return null
          return (
            <div key={cat}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">{cat}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((tpl) => (
                  <div key={tpl.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-carbon/[0.06] px-3 py-3 cursor-pointer hover:border-indigo/30 transition dark:border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <LayoutTemplate className="h-4 w-4 shrink-0 text-indigo" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-carbon dark:text-surface truncate">{tpl.label}</p>
                        <p className="text-xs text-slate dark:text-surface/55">Updated {tpl.updated}</p>
                      </div>
                    </div>
                    <Badge variant="indigo" className="shrink-0 text-[10px]">Use</Badge>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
