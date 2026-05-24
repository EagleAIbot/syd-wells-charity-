import { format, formatDistanceToNow, isSameDay, parseISO, isBefore, startOfDay } from 'date-fns'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { useApp } from '../contexts/AppContext'
import { cn, fmtDate } from '../lib/utils'
import { clientDemo } from '../lib/clientDemo'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useProperties } from '../hooks/useProperties'
import { useApplicants } from '../hooks/useApplicants'
import { useLeads, useUpdateLead } from '../hooks/useLeads'
import { useEvents } from '../hooks/useEvents'
import { useUsers } from '../hooks/useUsers'
import { useActivity } from '../hooks/useActivity'
import { ClientDemoBanner } from '../components/features/ClientDemoBanner'

const STAT_BOXES = [
  {
    id: 'prospecting',
    label: 'Prospecting',
    stage: 'Prospecting',
    description: 'Properties at prospecting stage with call-back due today or earlier',
  },
  {
    id: 'market-appraisal',
    label: 'Market Appraisal',
    stage: 'Market Appraisal',
    description: 'Properties at market appraisal stage with call-back due today or earlier',
  },
  {
    id: 'to-let',
    label: 'To Let Available',
    stage: 'To Let Available',
    description: 'Properties available to let with call-back due today or earlier',
  },
  {
    id: 'for-sale',
    label: 'For Sale Available',
    stage: 'For Sale Available',
    description: 'Properties available for sale with call-back due today or earlier',
  },
  {
    id: 'both',
    label: 'To Let / For Sale Available',
    stage: 'To Let / For Sale Available',
    description: 'Properties available for let or sale with call-back due today or earlier',
  },
  {
    id: 'buyers-tenants',
    label: 'Buyers / Tenants',
    stage: null,
    description: 'Active buyers and tenants with call-back due today or earlier',
  },
]

export default function Dashboard() {
  const { currentUserId, currentUser } = useApp()
  const navigate = useNavigate()
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')

  const [scope, setScope] = useState('broker')

  const { data: properties = [] } = useProperties(scope === 'broker' ? 'my' : undefined)
  const { data: applicants = [] } = useApplicants(scope === 'broker' ? 'my' : undefined)
  const { data: leads = [] } = useLeads()
  const { data: events = [] } = useEvents()
  const { data: usersData = [] } = useUsers()

  const qualify = useMemo(() => leads.filter((l) => l.status === 'New').slice(0, 8), [leads])

  const [qualifyLead, setQualifyLead] = useState(null)
  const [qualifyAssignee, setQualifyAssignee] = useState('')

  const todayCal = useMemo(() => {
    const todayEvs = events.filter((e) => (e.date ?? '').startsWith(todayStr))
    const sorted = todayEvs.sort((a, b) => (a.start_time ?? a.start ?? '').localeCompare(b.start_time ?? b.start ?? ''))
    return sorted.length ? sorted : [...events].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')).slice(0, 6)
  }, [events, todayStr])

  const pastEvents = useMemo(() => {
    return events.filter((e) => e.date < todayStr).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  }, [events, todayStr])

  const [dismissedFollowUps, setDismissedFollowUps] = useLocalStorage('nd-dismissed-followups', [])

  const followUpTasks = useMemo(
    () => pastEvents.filter((e) => !dismissedFollowUps.includes(e.id)),
    [pastEvents, dismissedFollowUps],
  )

  const dismissFollowUp = (id) => setDismissedFollowUps((prev) => [...prev, id])

  const statCounts = useMemo(() => {
    const masterProps = properties.filter((p) => {
      const callBack = (p.next_call_back ?? p.nextCallBackDate ?? p.nextCallBack ?? '').slice(0, 10)
      return callBack && callBack <= todayStr
    })
    const myApplicants = applicants.filter((a) => {
      const callBack = (a.next_call_back_date ?? a.nextCallBackDate ?? '').slice(0, 10)
      return callBack && callBack <= todayStr
    })
    const counts = {
      'prospecting': masterProps.filter((p) => (p.kanban_stage ?? p.kanbanStage) === 'Prospecting').length,
      'market-appraisal': masterProps.filter((p) => (p.kanban_stage ?? p.kanbanStage) === 'Market Appraisal').length,
      'to-let': masterProps.filter((p) => (p.kanban_stage ?? p.kanbanStage) === 'To Let Available').length,
      'for-sale': masterProps.filter((p) => (p.kanban_stage ?? p.kanbanStage) === 'For Sale Available').length,
      'both': masterProps.filter((p) => (p.kanban_stage ?? p.kanbanStage) === 'To Let / For Sale Available').length,
      'buyers-tenants': myApplicants.length,
    }
    return counts
  }, [properties, applicants, todayStr])

  // Modal state
  const [modalBox, setModalBox] = useState(null)
  const [expandedRecord, setExpandedRecord] = useState(null)

  // Follow Up Task completion modal
  const [followUpModal, setFollowUpModal] = useState(null)
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Qualify lead modal
  const [leadQualifyModal, setLeadQualifyModal] = useState(null)

  // Management breakdown modal
  const [mgmtBreakdown, setMgmtBreakdown] = useState(null)
  // When clicking an agent in management breakdown, drill down to their records
  const [agentDrillId, setAgentDrillId] = useState(null)

  // Table records for modal drill-down
  // agentDrillId overrides currentUserId filter (used when drilling from management view)
  const modalRecords = useMemo(() => {
    if (!modalBox) return []
    const agentFilter = agentDrillId ?? (scope === 'management' ? null : currentUserId)
    if (modalBox.id === 'buyers-tenants') {
      return applicants
        .filter((a) => {
          const callBack = a.next_call_back ?? a.nextCallBack
          return (agentFilter === null || (a.assigned_agent_id ?? a.assignedAgentId) === agentFilter) &&
            callBack && callBack <= todayStr
        })
        .map((a) => ({
          id: a.id,
          ownerTitle: a.title ?? '—',
          fullName: a.name,
          address: a.preferred_locations ?? a.requirements ?? '—',
          nextCallBackDate: a.next_call_back ?? a.nextCallBack,
          agentId: a.assigned_agent_id ?? a.assignedAgentId,
          type: 'applicant',
        }))
    }
    return properties
      .filter((p) => {
        const callBack = p.next_call_back ?? p.nextCallBack
        const stage = p.kanban_stage ?? p.kanbanStage
        const agentId = p.listing_agent_id ?? p.listingAgentId
        return stage === modalBox.stage &&
          (agentFilter === null || agentId === agentFilter) &&
          callBack && callBack <= todayStr
      })
      .map((p) => ({
        id: p.id,
        ownerTitle: p.owner_title ?? p.ownerTitle ?? '—',
        fullName: p.owner_full_name ?? p.ownerFullName ?? '—',
        address: `Unit ${p.unit ?? ''}${p.building ? ` · ${p.building}` : ''}${p.community ? `, ${p.community}` : ''}`,
        nextCallBackDate: p.next_call_back ?? p.nextCallBack,
        agentId: p.listing_agent_id ?? p.listingAgentId,
        type: 'property',
      }))
  }, [modalBox, agentDrillId, scope, currentUserId, todayStr, properties, applicants])

  // Management view: agent breakdown for stat boxes
  const agentBreakdown = useMemo(() => {
    if (!mgmtBreakdown) return []
    const box = mgmtBreakdown
    let records = []
    if (box.id === 'buyers-tenants') {
      records = applicants.filter((a) => {
        const cb = a.next_call_back ?? a.nextCallBack
        return cb && cb <= todayStr
      }).map((a) => ({ agentId: a.assigned_agent_id ?? a.assignedAgentId }))
    } else {
      records = properties.filter((p) => {
        const cb = p.next_call_back ?? p.nextCallBack
        const stage = p.kanban_stage ?? p.kanbanStage
        return stage === box.stage && cb && cb <= todayStr
      }).map((p) => ({ agentId: p.listing_agent_id ?? p.listingAgentId }))
    }
    const map = {}
    records.forEach(({ agentId }) => {
      const key = agentId ?? 'unassigned'
      map[key] = (map[key] ?? 0) + 1
    })
    return Object.entries(map)
      .map(([agentId, count]) => {
        const member = usersData.find((u) => u.id === agentId)
        return { agentId, name: member?.name ?? 'Unassigned', count }
      })
      .sort((a, b) => b.count - a.count)
  }, [mgmtBreakdown, todayStr, properties, applicants, usersData])

  const updateLead = useUpdateLead()
  const { data: activityData = [] } = useActivity({ limit: 8 })

  const feed = useMemo(() =>
    activityData.map((a) => ({
      id: a.id,
      text: a.action,
      who: (a.user_name ?? 'Someone').split(' ')[0],
      ago: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
    })),
  [activityData])

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <PageHeader
        title={`${greet}, ${(currentUser?.name ?? 'there').split(' ')[0]}`}
        subtitle={
          clientDemo?.dashboard?.subtitle
            ?? "Your operational cockpit — tasks, leads to qualify, and today's calendar."
        }
      />

      <ClientDemoBanner />

      {/* Broker / Management toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate dark:text-surface/70">View:</span>
        <div className="flex rounded-xl border border-carbon/10 p-1 dark:border-white/10 bg-white dark:bg-carbon-800">
          {[
            { id: 'broker', label: 'Broker' },
            { id: 'management', label: 'Management', locked: true },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setScope(opt.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition',
                scope === opt.id
                  ? 'bg-indigo text-white shadow-sm'
                  : 'text-slate hover:text-carbon dark:text-surface/70',
              )}
            >
              {opt.locked && <Lock className="h-3 w-3 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 stat boxes */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {STAT_BOXES.map((box) => {
          const count = statCounts[box.id] ?? 0
          return (
            <Card
              key={box.id}
              className="group cursor-pointer transition active:scale-[0.97] hover:-translate-y-0.5 hover:border-indigo/40 hover:shadow-lg"
              onClick={() => {
                if (scope === 'management') setMgmtBreakdown(box)
                else setModalBox(box)
              }}
            >
              <CardContent className="pt-4 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate dark:text-surface/60 leading-tight">
                  {box.label}
                </p>
                <button
                  type="button"
                  className="mt-1.5 font-display text-3xl font-bold text-indigo group-hover:underline decoration-indigo/40 underline-offset-4"
                  aria-label={`View ${box.label} records`}
                >
                  {count}
                </button>
                <p className="mt-0.5 text-[10px] text-slate dark:text-surface/55">
                  call-back due
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3-column operational grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* Follow Up Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Follow Up Tasks
              {followUpTasks.length > 0 && (
                <span className="rounded-full bg-indigo/10 px-2 py-0.5 text-xs font-bold text-indigo">{followUpTasks.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {followUpTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-slate dark:text-surface/55">
                All caught up — no pending follow-ups.
              </p>
            )}
            {followUpTasks.map((ev) => (
              <div
                key={ev.id}
                className="cursor-pointer rounded-xl border border-carbon/[0.06] p-3 transition hover:border-indigo/30 hover:bg-indigo/[0.02] dark:border-white/10 dark:hover:border-indigo/30"
                onClick={() => { setFollowUpModal(ev); setFollowUpNotes('') }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-carbon dark:text-surface">
                    {ev.title}
                  </p>
                  <p className="text-xs text-slate dark:text-surface/65">
                    {fmtDate(ev.date)} · {ev.type}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leads to Qualify */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Leads to Qualify
              {qualify.length > 0 && (
                <span className="rounded-full bg-indigo/10 px-2 py-0.5 text-xs font-bold text-indigo">{qualify.length}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {qualify.map((l) => (
              <div
                key={l.id}
                className="cursor-pointer rounded-xl border border-carbon/[0.06] p-3 transition hover:border-indigo/30 hover:bg-indigo/[0.02] dark:border-white/10 dark:hover:border-indigo/30"
                onClick={() => {
                  setLeadQualifyModal(l)
                  setQualifyLead(l)
                  setQualifyAssignee(l.assigned_to ?? '')
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-carbon dark:text-surface">
                    {l.name}
                  </p>
                  <Badge variant="indigo">{l.source}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate dark:text-surface/65">
                  {l.interest ?? l.notes ?? '—'}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's Calendar + Activity stacked */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayCal.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 rounded-xl border border-carbon/[0.06] px-3 py-2 dark:border-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-carbon dark:text-surface">
                      {ev.title}
                    </p>
                    <p className="text-xs text-slate dark:text-surface/60">
                      {!isSameDay(parseISO(`${ev.date}T12:00:00`), new Date())
                        ? `${fmtDate(ev.date)} · `
                        : ''}
                      {ev.start_time ?? ev.start ?? ''} · {ev.type}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
              <p className="text-xs text-slate dark:text-surface/55">Recent actions across the company — new listings, viewings booked, deals moved, leads qualified.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {feed.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate dark:text-surface/55">
                  No activity yet — actions will appear here as you use the platform.
                </p>
              ) : (
                feed.map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="text-carbon dark:text-surface">{item.text}</p>
                    <p className="text-xs text-slate dark:text-surface/55">
                      {item.who} · {item.ago}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stat box drill-down modal */}
      <Modal
        open={!!modalBox && !expandedRecord}
        onClose={() => { setModalBox(null); setAgentDrillId(null) }}
        title={agentDrillId ? `${modalBox?.label ?? ''} — ${agentBreakdown.find(a => a.agentId === agentDrillId)?.name ?? ''}` : (modalBox?.label ?? '')}
        className="max-w-3xl"
      >
        <p className="text-sm text-slate dark:text-surface/70 mb-4">
          {modalBox?.description} — showing{' '}
          <strong>{scope === 'broker' ? 'your' : 'company'}</strong> records.
        </p>
        <div className="overflow-x-auto rounded-xl border border-carbon/[0.06] dark:border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon/[0.06] dark:border-white/10">
                {['Title', 'Full Name', 'Property Address', 'Next Call Back Date'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate dark:text-surface/55">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modalRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate dark:text-surface/55">
                    No records due for call-back today or earlier.
                  </td>
                </tr>
              )}
              {modalRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className="cursor-pointer border-b border-carbon/[0.04] transition hover:bg-indigo/5 dark:border-white/[0.06] dark:hover:bg-white/5"
                  onClick={() => {
                    if (rec.type === 'property') {
                      window.open(`/app/properties/${rec.id}`, '_blank')
                    } else {
                      setExpandedRecord(rec)
                    }
                  }}
                >
                  <td className="px-4 py-3 font-medium text-carbon dark:text-surface">
                    {rec.ownerTitle}
                  </td>
                  <td className="px-4 py-3 text-carbon dark:text-surface">{rec.fullName}</td>
                  <td className="px-4 py-3 text-slate dark:text-surface/70">{rec.address}</td>
                  <td className="px-4 py-3">
                    <Badge variant={(rec.nextCallBackDate ?? '').slice(0, 10) <= todayStr ? 'indigo' : 'outline'}>
                      {rec.nextCallBackDate ? fmtDate(rec.nextCallBackDate) : '—'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => { setModalBox(null); setAgentDrillId(null) }} size="sm" variant="secondary">
            Close
          </Button>
        </div>
      </Modal>

      {/* Qualify lead modal */}
      <Modal
        open={!!qualifyLead}
        onClose={() => setQualifyLead(null)}
        title="Qualify Lead"
        className="max-w-lg"
      >
        {qualifyLead && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Full Name</p>
                <p className="font-semibold text-carbon dark:text-surface">{qualifyLead.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Source</p>
                <Badge variant="indigo">{qualifyLead.source}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Phone</p>
                <p className="text-carbon dark:text-surface">{qualifyLead.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Email</p>
                <p className="text-carbon dark:text-surface">{qualifyLead.email ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Interest</p>
                <p className="text-carbon dark:text-surface">{qualifyLead.interest ?? qualifyLead.notes ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55 mb-1">Assign to</p>
                <select
                  value={qualifyAssignee}
                  onChange={(e) => setQualifyAssignee(e.target.value)}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                >
                  <option value="">Unassigned</option>
                  {usersData.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55 mb-1">Notes</p>
                <textarea
                  rows={3}
                  placeholder="Add qualification notes…"
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setQualifyLead(null)}>Cancel</Button>
              <Button onClick={async () => {
                try {
                  await updateLead.mutateAsync({ id: qualifyLead.id, status: 'Qualified', assignedTo: qualifyAssignee || currentUserId })
                  setQualifyLead(null)
                } catch {}
              }}>Mark as Qualified</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Follow Up completion modal */}
      <Modal open={!!followUpModal} onClose={() => setFollowUpModal(null)} title="Complete Follow Up" className="max-w-md">
        {followUpModal && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-carbon/[0.06] p-3 dark:border-white/10">
              <p className="font-semibold text-carbon dark:text-surface">{followUpModal.title}</p>
              <p className="mt-0.5 text-xs text-slate dark:text-surface/65">{fmtDate(followUpModal.date)} · {followUpModal.type}</p>
            </div>
            {/* Linked records — notes will be saved to these */}
            {followUpModal.linkedIds?.length > 0 && (
              <div className="rounded-xl border border-indigo/20 bg-indigo/[0.04] px-3 py-2.5 dark:bg-indigo/10">
                <p className="text-xs font-semibold text-indigo mb-1.5">Notes will be added to linked records:</p>
                <div className="flex flex-wrap gap-1.5">
                  {followUpModal.linkedIds.map((lid) => {
                    const prop = properties.find((p) => p.id === lid)
                    const app = !prop && applicants.find((a) => a.id === lid)
                    const label = prop
                      ? `Unit ${prop.unit ?? ''}${prop.building ? ' · ' + prop.building : ''}${prop.community ? ', ' + prop.community : ''}`
                      : app ? app.name : lid
                    const type = prop ? 'Property' : app ? 'Applicant' : 'Record'
                    return (
                      <span key={lid} className="rounded-full bg-indigo/10 px-2 py-0.5 text-xs font-medium text-indigo dark:bg-indigo/20">
                        {type}: {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Notes</p>
              <textarea rows={4} value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Add notes about this follow up — will be saved to linked record(s)…"
                className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setFollowUpModal(null)}>Cancel</Button>
              <Button onClick={() => { dismissFollowUp(followUpModal.id); setFollowUpModal(null) }}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as Completed
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Management breakdown modal */}
      <Modal open={!!mgmtBreakdown} onClose={() => setMgmtBreakdown(null)} title={`${mgmtBreakdown?.label ?? ''} — Agent Breakdown`} className="max-w-lg">
        {mgmtBreakdown && (
          <div className="space-y-3">
            <p className="text-sm text-slate dark:text-surface/70">Records due for call-back, grouped by record owner.</p>
            <div className="overflow-hidden rounded-xl border border-carbon/[0.06] dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-carbon/[0.06] dark:border-white/10">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate dark:text-surface/55">Agent</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate dark:text-surface/55">Records Due</th>
                  </tr>
                </thead>
                <tbody>
                  {agentBreakdown.length === 0 && (
                    <tr><td colSpan={2} className="px-4 py-6 text-center text-slate dark:text-surface/55">No records due.</td></tr>
                  )}
                  {agentBreakdown.map(({ agentId, name, count }) => (
                    <tr key={agentId}
                      className="cursor-pointer border-b border-carbon/[0.04] transition hover:bg-indigo/5 last:border-0 dark:border-white/[0.06] dark:hover:bg-white/5"
                      onClick={() => {
                        setAgentDrillId(agentId)
                        setModalBox(mgmtBreakdown)
                        setMgmtBreakdown(null)
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-indigo hover:underline">{name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-indigo/10 px-2 text-xs font-bold text-indigo">{count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setMgmtBreakdown(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
