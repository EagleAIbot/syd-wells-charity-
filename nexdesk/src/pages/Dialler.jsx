import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Phone,
  PhoneOff,
  Delete,
  Search,
  User,
  Building2,
  Users,
  Clock,
  MicOff,
  Mic,
  Volume2,
  VolumeX,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { cn, fmtDate } from '../lib/utils'
import { useLocalStorage } from '../lib/useLocalStorage'
import { useProperties } from '../hooks/useProperties'
import { useApplicants } from '../hooks/useApplicants'

const SEED_HISTORY = []

const DIAL_KEYS = [
  { key: '1', sub: '' }, { key: '2', sub: 'ABC' }, { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' }, { key: '5', sub: 'JKL' }, { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' }, { key: '8', sub: 'TUV' }, { key: '9', sub: 'WXYZ' },
  { key: '*', sub: '' }, { key: '0', sub: '+' }, { key: '#', sub: '' },
]

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function HistoryIcon({ type }) {
  if (type === 'Incoming') return <PhoneIncoming className="h-3.5 w-3.5 text-mint" />
  if (type === 'Outgoing') return <PhoneOutgoing className="h-3.5 w-3.5 text-indigo" />
  return <PhoneMissed className="h-3.5 w-3.5 text-red-400" />
}

export default function Dialler() {
  const [search, setSearch] = useState('')
  const [number, setNumber] = useState('')
  const [callState, setCallState] = useState('idle')
  const [callContact, setCallContact] = useState(null)
  const [callSeconds, setCallSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speakerOff, setSpeakerOff] = useState(false)
  const [callHistory, setCallHistory] = useLocalStorage('nd_call_history_v2', [])
  const [manualNoteOpen, setManualNoteOpen] = useState(false)
  const [callNote, setCallNote] = useState('')
  const [logOutcome, setLogOutcome] = useState('')

  const { data: propertiesData = [] } = useProperties()
  const { data: applicantsData = [] } = useApplicants()

  const CONTACTS = useMemo(() => [
    ...propertiesData
      .filter((p) => (p.owner_full_name ?? p.ownerFullName) && (p.owner_contact_number ?? p.ownerContactNumber))
      .map((p) => ({
        id: `prop-${p.id}`,
        name: p.owner_full_name ?? p.ownerFullName,
        phone: p.owner_contact_number ?? p.ownerContactNumber,
        type: 'Owner',
        subtitle: `Unit ${p.unit ?? ''}${p.building ? ' · ' + p.building : ''}${p.community ? ' · ' + p.community : ''}`,
        icon: Building2,
        color: '#1ECFB3',
      })),
    ...applicantsData
      .filter((a) => a.phone)
      .map((a) => ({
        id: `app-${a.id}`,
        name: a.name,
        phone: a.phone,
        type: 'Applicant',
        subtitle: a.requirements ?? a.type ?? '',
        icon: Users,
        color: '#8b5cf6',
      })),
  ], [propertiesData, applicantsData])

  const timerRef = useRef(null)

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return CONTACTS.slice(0, 12)
    return CONTACTS.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.subtitle?.toLowerCase().includes(q),
    ).slice(0, 12)
  }, [search, CONTACTS])

  // Start call
  const startCall = (contact) => {
    const num = contact?.phone ?? number
    if (!num.trim()) return
    setCallContact(contact ?? { name: num, phone: num, type: 'Manual', icon: User, color: '#6B7280' })
    setNumber(contact?.phone ?? number)
    setCallState('dialling')
    setCallSeconds(0)
    setMuted(false)
    setSpeakerOff(false)

    // Simulate answer after 2s
    setTimeout(() => {
      setCallState('connected')
      timerRef.current = window.setInterval(() => setCallSeconds((s) => s + 1), 1000)
    }, 2000)
  }

  const endCall = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    const duration = callSeconds
    const contact = callContact
    setCallState('ended')

    // Log the call
    if (contact) {
      const m = Math.floor(duration / 60)
      const s = duration % 60
      setCallHistory((prev) => [
        {
          id: `call-${Date.now()}`,
          name: contact.name,
          phone: contact.phone,
          type: 'Outgoing',
          duration: `${m}m ${String(s).padStart(2, '0')}s`,
          date: new Date().toISOString().split('T')[0],
          contactType: contact.type,
          notes: callNote || undefined,
          outcome: logOutcome || undefined,
        },
        ...prev,
      ])
    }

    setTimeout(() => {
      setCallState('idle')
      setCallContact(null)
      setCallNote('')
      setLogOutcome('')
      setManualNoteOpen(false)
    }, 2000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  const todayDateStr = new Date().toISOString().split('T')[0]

  const todayTalkSeconds = useMemo(() => {
    return callHistory
      .filter((h) => h.date === todayDateStr && h.duration)
      .reduce((acc, h) => {
        const match = h.duration.match(/(\d+)m\s*(\d+)s/)
        if (!match) return acc
        return acc + parseInt(match[1]) * 60 + parseInt(match[2])
      }, 0)
  }, [callHistory, todayDateStr])

  const appendDigit = (d) => {
    if (callState === 'connected') return // in-call tones
    setNumber((n) => n + d)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Dialler"
        subtitle="Click-to-call contacts directly from the CRM — calls are logged automatically."
        actions={
          <Badge variant="mint" className="text-xs">Live</Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── Left: contacts + history ── */}
        <div className="space-y-5">
          {/* Contact Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="h-4 w-4 text-indigo" /> Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone or property…"
                  className="w-full rounded-xl border border-carbon/10 bg-white pl-9 pr-4 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface focus:border-indigo/40 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
                {filteredContacts.length === 0 && (
                  <p className="py-6 text-center text-sm text-slate dark:text-surface/55">No contacts found.</p>
                )}
                {filteredContacts.map((c) => {
                  const Icon = c.icon
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-carbon/[0.06] px-3 py-2.5 transition hover:border-indigo/30 hover:bg-indigo/[0.02] dark:border-white/10 dark:hover:border-indigo/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${c.color}18` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: c.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-carbon dark:text-surface">{c.name}</p>
                          <p className="truncate text-xs text-slate dark:text-surface/60">{c.phone}</p>
                          <p className="truncate text-[10px] text-slate/70 dark:text-surface/45">{c.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full border border-carbon/10 px-2 py-0.5 text-[10px] font-medium text-slate dark:border-white/10 dark:text-surface/60">
                          {c.type}
                        </span>
                        <button
                          type="button"
                          disabled={callState !== 'idle'}
                          onClick={() => startCall(c)}
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full transition',
                            callState === 'idle'
                              ? 'bg-mint/15 text-mint hover:bg-mint/30'
                              : 'bg-carbon/10 text-slate/40 cursor-not-allowed dark:bg-white/5',
                          )}
                          title={`Call ${c.name}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Call History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-indigo" /> Recent Calls
                <span className="ml-auto text-xs font-normal text-slate dark:text-surface/55">{callHistory.length} total</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {callHistory.slice(0, 10).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-carbon/[0.06] px-3 py-2.5 dark:border-white/10"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      h.type === 'Missed' ? 'bg-red-50 dark:bg-red-900/20' :
                      h.type === 'Incoming' ? 'bg-mint/10' : 'bg-indigo/10'
                    )}>
                      <HistoryIcon type={h.type} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-carbon dark:text-surface">{h.name}</p>
                      <p className="text-xs text-slate dark:text-surface/60">{h.phone}</p>
                      {h.notes && <p className="text-[10px] text-slate/70 dark:text-surface/45 truncate mt-0.5">{h.notes}</p>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn('text-xs font-semibold',
                      h.type === 'Missed' ? 'text-red-400' :
                      h.type === 'Incoming' ? 'text-mint' : 'text-indigo'
                    )}>{h.type}</p>
                    <p className="text-[10px] text-slate dark:text-surface/55">{h.duration}</p>
                    <p className="text-[10px] text-slate/60 dark:text-surface/40">{fmtDate(h.date)}</p>
                  </div>
                </div>
              ))}
              {callHistory.length === 0 && (
                <p className="py-6 text-center text-sm text-slate dark:text-surface/55">No call history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Dialpad + Call State ── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              {/* Active call overlay */}
              {callState !== 'idle' && (
                <div className={cn(
                  'rounded-2xl p-5 text-center space-y-3 transition',
                  callState === 'connected' ? 'bg-mint/10 border border-mint/30 dark:bg-mint/5' :
                  callState === 'ended' ? 'bg-carbon/5 border border-carbon/10 dark:bg-white/5 dark:border-white/10' :
                  'bg-indigo/5 border border-indigo/20',
                )}>
                  {/* Avatar */}
                  <div className={cn(
                    'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
                    callState === 'connected' ? 'bg-mint/20' :
                    callState === 'ended' ? 'bg-carbon/10 dark:bg-white/10' : 'bg-indigo/15',
                  )}>
                    {callContact?.icon
                      ? (() => { const Icon = callContact.icon; return <Icon className="h-7 w-7" style={{ color: callContact.color }} /> })()
                      : <User className="h-7 w-7 text-slate" />
                    }
                  </div>

                  <div>
                    <p className="font-bold text-lg text-carbon dark:text-surface">{callContact?.name}</p>
                    <p className="text-xs text-slate dark:text-surface/60">{callContact?.phone}</p>
                  </div>

                  {callState === 'dialling' && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-2 w-2 rounded-full bg-indigo animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                      <span className="text-sm font-medium text-indigo">Dialling…</span>
                    </div>
                  )}

                  {callState === 'connected' && (
                    <div className="space-y-3">
                      <p className="font-mono text-2xl font-bold text-mint">{formatDuration(callSeconds)}</p>
                      {/* In-call controls */}
                      <div className="flex items-center justify-center gap-4">
                        <button type="button" onClick={() => setMuted((v) => !v)}
                          className={cn('flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs transition',
                            muted ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-carbon/5 text-slate hover:bg-carbon/10 dark:bg-white/5 dark:text-surface/70')}>
                          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          {muted ? 'Unmute' : 'Mute'}
                        </button>
                        <button type="button" onClick={() => setSpeakerOff((v) => !v)}
                          className={cn('flex flex-col items-center gap-1 rounded-xl p-2.5 text-xs transition',
                            speakerOff ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-carbon/5 text-slate hover:bg-carbon/10 dark:bg-white/5 dark:text-surface/70')}>
                          {speakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                          Speaker
                        </button>
                      </div>
                      {/* Call notes */}
                      {!manualNoteOpen ? (
                        <button type="button" onClick={() => setManualNoteOpen(true)}
                          className="text-xs text-indigo underline underline-offset-2">+ Add call note</button>
                      ) : (
                        <div className="space-y-2 text-left">
                          <textarea rows={2} value={callNote} onChange={(e) => setCallNote(e.target.value)}
                            placeholder="Note during call…"
                            className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-xs dark:bg-carbon-800 dark:border-white/10 dark:text-surface resize-none" />
                          <select value={logOutcome} onChange={(e) => setLogOutcome(e.target.value)}
                            className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-1.5 text-xs dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
                            <option value="">Select outcome…</option>
                            {['Interested — follow up booked', 'Not interested', 'No answer', 'Callback requested', 'Deal progressed', 'Viewing booked'].map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {callState === 'ended' && (
                    <p className="text-sm font-medium text-slate dark:text-surface/60">Call ended · {formatDuration(callSeconds)}</p>
                  )}

                  {/* End call */}
                  {callState !== 'ended' && (
                    <button type="button" onClick={endCall}
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition active:scale-95">
                      <PhoneOff className="h-6 w-6" />
                    </button>
                  )}
                </div>
              )}

              {/* Number display */}
              <div className="relative">
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Enter number or select contact…"
                  className="w-full rounded-xl border border-carbon/10 bg-white px-4 py-3 text-center font-mono text-lg tracking-widest text-carbon focus:border-indigo/40 focus:outline-none dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                  readOnly={callState !== 'idle'}
                />
                {number && callState === 'idle' && (
                  <button type="button" onClick={() => setNumber((n) => n.slice(0, -1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-carbon dark:text-surface/60 dark:hover:text-surface">
                    <Delete className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Dialpad */}
              <div className="grid grid-cols-3 gap-2">
                {DIAL_KEYS.map(({ key, sub }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => appendDigit(key)}
                    disabled={callState !== 'idle'}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl py-3 text-base font-bold transition select-none',
                      callState === 'idle'
                        ? 'bg-surface hover:bg-indigo/5 text-carbon active:scale-95 active:bg-indigo/10 dark:bg-white/5 dark:text-surface dark:hover:bg-white/10'
                        : 'bg-carbon/5 text-slate/30 cursor-not-allowed dark:bg-white/5 dark:text-surface/20',
                    )}
                  >
                    {key}
                    {sub && <span className="mt-0.5 text-[8px] font-normal tracking-widest text-slate/60 dark:text-surface/40">{sub}</span>}
                  </button>
                ))}
              </div>

              {/* Call button */}
              <button
                type="button"
                disabled={callState !== 'idle' || !number.trim()}
                onClick={() => startCall(null)}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition',
                  callState === 'idle' && number.trim()
                    ? 'bg-mint text-carbon hover:bg-mint/90 active:scale-[0.98] shadow-md'
                    : 'bg-carbon/10 text-slate/40 cursor-not-allowed dark:bg-white/10 dark:text-surface/30',
                )}
              >
                <Phone className="h-5 w-5" />
                Call
              </button>

              {/* Direct tel link (mobile) */}
              {number.trim() && callState === 'idle' && (
                <a
                  href={`tel:${number.replace(/\s/g, '')}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-carbon/10 py-2 text-xs font-medium text-slate hover:border-indigo/30 hover:text-indigo transition dark:border-white/10 dark:text-surface/60"
                >
                  <Phone className="h-3.5 w-3.5" /> Use native dialler (mobile)
                </a>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardContent className="pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">Today's Activity</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  {
                    label: 'Outgoing',
                    count: callHistory.filter((h) => h.type === 'Outgoing' && h.date === todayDateStr).length,
                    color: 'text-indigo',
                    bg: 'bg-indigo/8 dark:bg-indigo/15',
                  },
                  {
                    label: 'Incoming',
                    count: callHistory.filter((h) => h.type === 'Incoming' && h.date === todayDateStr).length,
                    color: 'text-mint',
                    bg: 'bg-mint/10',
                  },
                  {
                    label: 'Missed',
                    count: callHistory.filter((h) => h.type === 'Missed' && h.date === todayDateStr).length,
                    color: 'text-red-400',
                    bg: 'bg-red-50 dark:bg-red-900/10',
                  },
                ].map((s) => (
                  <div key={s.label} className={cn('rounded-xl py-3 px-2', s.bg)}>
                    <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate dark:text-surface/55">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Talk time */}
              <div className="mt-3 rounded-xl bg-carbon/[0.04] dark:bg-white/5 py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate dark:text-surface/55" />
                  <span className="text-xs font-medium text-slate dark:text-surface/70">Total Talk Time</span>
                </div>
                <span className="font-mono text-sm font-bold text-carbon dark:text-surface">
                  {formatDuration(todayTalkSeconds)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
