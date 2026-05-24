import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Info, Mail, StickyNote, Phone, MessageCircle, ChevronLeft, ChevronRight, X as XIcon, Plus, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Tabs } from '../components/ui/Tabs'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import { S3DocSlot } from '../components/ui/S3DocSlot'
import { useProperty, useUpdateProperty } from '../hooks/useProperties'
import { useUsers } from '../hooks/useUsers'
import NotFound from './NotFound'

const PROPERTY_STAGES = [
  'Prospecting',
  'Market Appraisal',
  'To Let Available',
  'For Sale Available',
  'To Let / For Sale Available',
  'Archived',
]

const TITLE_OPTIONS = ['Mr', 'Ms', 'Mrs', 'Dr', 'H.H.', 'H.E.', 'Eng']

// --- Sub-components ---

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">
        {label}
      </p>
      <p className="font-medium text-carbon dark:text-surface">{value || '—'}</p>
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <label className="text-xs font-medium uppercase tracking-wide text-slate dark:text-surface/55">
        {label}
      </label>
      <div>{children}</div>
    </div>
  )
}

function FieldSelect({ value, onChange, options, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function FieldInput({ value, onChange, type = 'text', placeholder, className }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface',
        className,
      )}
    />
  )
}

// --- Notes tab helpers ---
function NotesPanel({ notes: initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || [])
  const [draft, setDraft] = useState('')
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-carbon dark:text-surface flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-indigo" /> Notes
        </p>
        <span className="text-xs text-slate">Recent first</span>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              setNotes((n) => [
                { id: Date.now(), text: draft, at: 'just now' },
                ...n,
              ])
              setDraft('')
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => {
            if (!draft.trim()) return
            setNotes((n) => [
              { id: Date.now(), text: draft, at: 'just now' },
              ...n,
            ])
            setDraft('')
          }}
        >
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {notes.map((n) => (
          <div
            key={n.id}
            className="rounded-xl border border-carbon/[0.06] bg-surface/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-carbon-900/40"
          >
            <p className="text-carbon dark:text-surface">{n.text}</p>
            <p className="mt-1 text-xs text-slate dark:text-surface/55">{n.at}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-slate dark:text-surface/55">No notes yet.</p>
        )}
      </div>
    </div>
  )
}

function AttachmentsPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-carbon dark:text-surface flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-indigo" /> Attachments
        </p>
        <Button size="sm" variant="secondary">
          Attach
        </Button>
      </div>
      <div className="rounded-xl border border-dashed border-carbon/15 py-8 text-center text-sm text-slate dark:border-white/15">
        No attachments yet — drag and drop files here
      </div>
    </div>
  )
}

function EmailsPanel() {
  const [emailTab, setEmailTab] = useState('mails')
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-carbon dark:text-surface flex items-center gap-2">
          <Mail className="h-4 w-4 text-indigo" /> Emails
        </p>
        <Button size="sm" variant="secondary">
          Compose email
        </Button>
      </div>
      <div className="flex gap-4 border-b border-carbon/10 dark:border-white/10">
        {['mails', 'drafts', 'scheduled'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setEmailTab(t)}
            className={cn(
              'pb-2 text-xs font-semibold capitalize transition',
              emailTab === t
                ? 'border-b-2 border-indigo text-indigo'
                : 'text-slate dark:text-surface/55',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="py-4 text-center text-sm text-slate dark:text-surface/55">
        No records found
      </p>
    </div>
  )
}

// --- Additional Owners Section ---
const ADDITIONAL_OWNER_REASONS = ['Spouse', 'POA', 'Children', 'Business Partner', 'Trustee', 'Other']

function AdditionalOwnersSection() {
  const [owners, setOwners] = useState([])
  const add = () => setOwners((prev) => [...prev, { id: Date.now(), title: 'Mr', name: '', phone: '', whatsapp: '', email: '', reason: '' }])
  const remove = (id) => setOwners((prev) => prev.filter((o) => o.id !== id))
  const upd = (id, k, v) => setOwners((prev) => prev.map((o) => o.id === id ? { ...o, [k]: v } : o))
  const sc = 'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface'
  return (
    <div className="space-y-3 pt-2 border-t border-carbon/[0.06] dark:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">Additional Owners / Points of Contact</p>
        <button type="button" onClick={add} className="flex items-center gap-1 rounded-lg border border-indigo/20 bg-indigo/5 px-2.5 py-1 text-xs font-semibold text-indigo hover:bg-indigo/10 transition">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
      {owners.map((o) => (
        <div key={o.id} className="rounded-xl border border-carbon/[0.06] p-3 space-y-2 dark:border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate dark:text-surface/55">Additional Contact</p>
            <button type="button" onClick={() => remove(o.id)} className="text-slate hover:text-red-500 transition"><XIcon className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Title</p>
              <select value={o.title} onChange={(e) => upd(o.id, 'title', e.target.value)} className={sc}>
                {['Mr', 'Ms', 'Mrs', 'Dr'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Full Name</p>
              <input value={o.name} onChange={(e) => upd(o.id, 'name', e.target.value)} placeholder="Full name" className={sc} />
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Contact Number</p>
              <input type="tel" value={o.phone} onChange={(e) => upd(o.id, 'phone', e.target.value)} placeholder="+971 50 000 0000" className={sc} />
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">WhatsApp Number</p>
              <input type="tel" value={o.whatsapp} onChange={(e) => upd(o.id, 'whatsapp', e.target.value)} placeholder="+971 50 000 0000" className={sc} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Email</p>
              <input type="email" value={o.email} onChange={(e) => upd(o.id, 'email', e.target.value)} placeholder="email@example.com" className={sc} />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Reason for Adding</p>
              <select value={o.reason} onChange={(e) => upd(o.id, 'reason', e.target.value)} className={sc}>
                <option value="">Select…</option>
                {ADDITIONAL_OWNER_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Property Particulars Tab ---
const BEDROOMS_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
const BATHROOMS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']

const AVAILABLE_STATUSES = ['To Let Available', 'For Sale Available', 'To Let / For Sale Available']

function PropertyParticularsTab({ property, recStatus }) {
  const allMandatory = AVAILABLE_STATUSES.includes(recStatus)
  const [vals, setVals] = useState({
    projectStatus: property?.project_status ?? property?.projectStatus ?? '',
    residentialOrCommercial: property?.residential_commercial ?? property?.residentialOrCommercial ?? '',
    propertyType: property?.property_type ?? property?.type ?? '',
    bedrooms: (property?.beds ?? '')?.toString() ?? '',
    bathrooms: (property?.baths ?? '')?.toString() ?? '',
    furnishing: property?.furnishing ?? '',
    parking: property?.parking ?? 'None',
    occupancy: property?.occupancy ?? '',
    buaSize: property?.bua_sqft ?? property?.buaSqft ?? '',
    plotSize: property?.plot_sqft ?? property?.plotSqft ?? '',
    extras: property?.extras ?? 'None',
    extraInfo: property?.extra_info ?? property?.extraInfo ?? '',
    propertyCondition: property?.property_condition ?? property?.propertyCondition ?? '',
    propertyPosition: property?.property_position ?? property?.propertyPosition ?? '',
  })
  const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target.value }))

  const selectClass = 'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface'
  const inputClass = 'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface'
  const label = (txt, baseRequired = false) => {
    const req = baseRequired || allMandatory
    return (
      <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">
        {txt}{req && <span className="ml-0.5 text-red-500">*</span>}
      </p>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>Property Particulars</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          {label('Project Status', true)}
          <select value={vals.projectStatus} onChange={set('projectStatus')} className={selectClass}>
            <option value="">Select…</option>
            {['Ready Secondary', 'Off Plan Secondary', 'Ready Primary', 'Off Plan Primary'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Residential / Commercial', true)}
          <select value={vals.residentialOrCommercial} onChange={set('residentialOrCommercial')} className={selectClass}>
            <option value="">Select…</option>
            {['Residential', 'Commercial'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Property Type', true)}
          <select value={vals.propertyType} onChange={set('propertyType')} className={selectClass}>
            <option value="">Select…</option>
            {['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Duplex', 'Office', 'Retail', 'Plot', 'Warehouse'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Bedrooms', true)}
          <select value={vals.bedrooms} onChange={set('bedrooms')} className={selectClass}>
            <option value="">Select…</option>
            {BEDROOMS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Bathrooms')}
          <select value={vals.bathrooms} onChange={set('bathrooms')} className={selectClass}>
            <option value="">Select…</option>
            {BATHROOMS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Occupancy')}
          <select value={vals.occupancy} onChange={set('occupancy')} className={selectClass}>
            <option value="">Select…</option>
            {['Vacant', 'Vacant on Transfer', 'Tenanted'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Furnishing')}
          <select value={vals.furnishing} onChange={set('furnishing')} className={selectClass}>
            <option value="">Select…</option>
            {['Unfurnished', 'Semi Furnished', 'Fully Furnished'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Property Condition')}
          <select value={vals.propertyCondition} onChange={set('propertyCondition')} className={selectClass}>
            <option value="">Select…</option>
            {['Standard', 'Partially Upgraded', 'Fully Upgraded'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Property Position')}
          <select value={vals.propertyPosition} onChange={set('propertyPosition')} className={selectClass}>
            <option value="">Select…</option>
            {['Road Backing', 'Back to Back', 'Greenbelt', 'Single Row', 'Park Backing'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('BUA Size (sqft)')}
          <input type="number" value={vals.buaSize} onChange={set('buaSize')} placeholder="e.g. 1200" className={inputClass} />
        </div>
        <div>
          {label('Plot Size (sqft)')}
          <input type="number" value={vals.plotSize} onChange={set('plotSize')} placeholder="e.g. 2400" className={inputClass} />
        </div>
        <div>
          {label('Parking')}
          <select value={vals.parking} onChange={set('parking')} className={selectClass}>
            {['None', '1', '2', '3', 'Covered', 'Open'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          {label('Extras')}
          <select value={vals.extras} onChange={set('extras')} className={selectClass}>
            {['None', 'Private Pool', 'Private Garden', "Maid's Room", 'Study', 'Storage', 'Smart Home'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          {label('Any Extra Information')}
          <textarea value={vals.extraInfo} onChange={set('extraInfo')} rows={3}
            placeholder="Additional details…"
            className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface" />
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-slate dark:text-surface/50"><span className="text-red-500">*</span> Mandatory fields</p>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Photo Gallery with drag-to-reorder + lightbox ---
function PhotoGallery() {
  const [photos, setPhotos] = useState([])
  const [lightbox, setLightbox] = useState(null) // index of open photo
  const dragIdx = useRef(null)

  const handleFiles = (files) => {
    const urls = Array.from(files).map((f) => URL.createObjectURL(f))
    setPhotos((p) => [...p, ...urls].slice(0, 25))
  }

  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver = (e, i) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === i) return
    setPhotos((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx.current, 1)
      next.splice(i, 0, moved)
      dragIdx.current = i
      return next
    })
  }
  const onDragEnd = () => { dragIdx.current = null }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
        }}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-carbon/15 py-8 text-center dark:border-white/15"
      >
        <p className="text-sm font-medium text-carbon dark:text-surface">
          Drag &amp; drop photos here, or{' '}
          <label className="cursor-pointer text-indigo underline">
            browse
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        </p>
        <p className="mt-1 text-xs text-slate dark:text-surface/55">
          Up to 25 photos · 100 MB total · JPG, PNG, WEBP · Drag to reorder
        </p>
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {photos.map((src, i) => (
            <div
              key={src}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
              className="group relative aspect-square cursor-grab overflow-hidden rounded-xl bg-surface active:cursor-grabbing dark:bg-carbon-900"
            >
              <img src={src} alt="" className="h-full w-full object-cover" onClick={(e) => { e.stopPropagation(); setLightbox(i) }} />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPhotos((p) => p.filter((_, j) => j !== i)) }}
                className="absolute right-1 top-1 hidden rounded-full bg-carbon/70 p-0.5 text-white group-hover:flex items-center justify-center"
              >
                <span className="text-[10px] leading-none px-1">✕</span>
              </button>
              <div className="absolute bottom-1 left-1 hidden rounded bg-carbon/60 px-1 py-0.5 text-[9px] text-white group-hover:block">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85" onClick={() => setLightbox(null)}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox((i) => Math.max(0, (i ?? 0) - 1)) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img src={photos[lightbox]} alt="" className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox((i) => Math.min(photos.length - 1, (i ?? 0) + 1)) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
            <ChevronRight className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition">
            <XIcon className="h-5 w-5" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{(lightbox ?? 0) + 1} / {photos.length}</p>
        </div>
      )}
    </div>
  )
}

// --- Listing Tab (shared by Rental + Sales) ---
const MAX_HEADLINE = 50
const MIN_DESC = 750

function formatCommaPrice(v) {
  const digits = v.replace(/[^0-9]/g, '')
  return digits ? Number(digits).toLocaleString() : ''
}

function ListingTab({ kind, propertyId, usersData = [] }) {
  const lbl = kind // "Leasing" or "Sales"
  const prefix = kind === 'Leasing' ? 'RL' : 'SL'
  const autoRef = `ND-${prefix}-${String(propertyId ?? Math.floor(Math.random() * 9000 + 1000)).padStart(5, '0')}-${new Date().getFullYear()}`
  const [vals, setVals] = useState({
    headline: '', description: '', price: '',
    reraPortal: '', published: false, listingUser: '',
    listedOn: '', contractExpiry: '', approvalStatus: 'draft',
  })
  const set = (k) => (e) => setVals((v) => ({ ...v, [k]: e.target ? e.target.value : e }))
  const tog = (k) => () => setVals((v) => ({ ...v, [k]: !v[k] }))

  const headlineOver = vals.headline.length > MAX_HEADLINE
  const descShort = vals.description.length < MIN_DESC && vals.description.length > 0

  return (
    <div className="space-y-6">
      {/* Listing Section — Agents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Listing Section · Agents</CardTitle>
            {/* Send for Approval status */}
            <div className="flex items-center gap-2">
              {vals.approvalStatus === 'pending' ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending Approval</span>
              ) : vals.approvalStatus === 'approved' ? (
                <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-xs font-semibold text-mint">Approved</span>
              ) : null}
              {vals.approvalStatus !== 'approved' && (
                <button type="button"
                  onClick={() => setVals((v) => ({ ...v, approvalStatus: v.approvalStatus === 'pending' ? 'draft' : 'pending' }))}
                  className={cn('rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                    vals.approvalStatus === 'pending'
                      ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400'
                      : 'border-indigo/20 bg-indigo/5 text-indigo hover:bg-indigo/10')}>
                  {vals.approvalStatus === 'pending' ? 'Cancel Request' : 'Send for Approval'}
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Headline {lbl}</p>
              <span className={cn('text-[10px] font-medium', headlineOver ? 'text-red-500' : 'text-slate dark:text-surface/55')}>
                {vals.headline.length}/{MAX_HEADLINE}
              </span>
            </div>
            <FieldInput value={vals.headline} onChange={(v) => setVals((x) => ({ ...x, headline: v }))}
              placeholder={`Enter headline for ${lbl.toLowerCase()} listing`}
              className={headlineOver ? 'border-red-400' : ''} />
            {headlineOver && <p className="mt-1 text-xs text-red-500">Maximum {MAX_HEADLINE} characters</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Description {lbl}</p>
              <span className={cn('text-[10px] font-medium', descShort ? 'text-amber-500' : vals.description.length >= MIN_DESC ? 'text-mint' : 'text-slate dark:text-surface/55')}>
                {vals.description.length} chars{vals.description.length > 0 && vals.description.length < MIN_DESC ? ` (min ${MIN_DESC})` : ''}
              </span>
            </div>
            <textarea
              value={vals.description}
              onChange={set('description')}
              rows={5}
              placeholder={`Full description for ${lbl.toLowerCase()} listing… (minimum ${MIN_DESC} characters)`}
              className={cn('w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface', descShort && 'border-amber-300')}
            />
            {descShort && <p className="mt-1 text-xs text-amber-500">{MIN_DESC - vals.description.length} more characters needed</p>}
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Price {lbl} (AED)</p>
            <input
              value={vals.price}
              onChange={(e) => setVals((v) => ({ ...v, price: formatCommaPrice(e.target.value) }))}
              placeholder="e.g. 95,000"
              className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
            />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Photo Gallery</p>
            <PhotoGallery />
          </div>
        </CardContent>
      </Card>

      {/* Listing Section — Admin */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Listing Section · Admin</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">RERA Permit Number</p>
            <FieldInput value={vals.reraPortal} onChange={set('reraPortal')} placeholder="RERA permit number" />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Permit Type</p>
            <select value={vals.permitType ?? ''} onChange={(e) => setVals((v) => ({ ...v, permitType: e.target.value }))}
              className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
              <option value="">Select…</option>
              <option value="RERA">RERA</option>
              <option value="DIFC">DIFC</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Listing Reference Number <span className="ml-1 text-slate/50 normal-case">(auto)</span></p>
            <input readOnly value={autoRef} className="w-full cursor-not-allowed rounded-xl border border-carbon/10 bg-surface/60 px-3 py-2 text-sm font-mono text-carbon dark:bg-carbon-900/40 dark:border-white/10 dark:text-surface/70" />
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Listing User</p>
            <select value={vals.listingUser} onChange={(e) => setVals((x) => ({ ...x, listingUser: e.target.value }))}
              className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
              <option value="">Select user…</option>
              {usersData.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Listed On</p>
            <input type="date" value={vals.listedOn} onChange={(e) => setVals((v) => ({ ...v, listedOn: e.target.value }))}
              className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface" />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Listing Contract Expiry</p>
            <input type="date" value={vals.contractExpiry} onChange={(e) => setVals((v) => ({ ...v, contractExpiry: e.target.value }))}
              className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface" />
          </div>
          {/* Publish/Unpublish — proper toggle */}
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-carbon/[0.06] px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-medium text-carbon dark:text-surface">Published {lbl}</p>
              <p className="text-xs text-slate dark:text-surface/55">{vals.published ? 'Live on portals' : 'Not published'}</p>
            </div>
            <button type="button" role="switch" aria-checked={vals.published} onClick={tog('published')}
              className={cn('relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none',
                vals.published ? 'bg-indigo' : 'bg-carbon/20 dark:bg-white/20')}>
              <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out',
                vals.published ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Offer Letter Tab ---
const fmtCurrencyInput = (raw) => {
  const digits = String(raw).replace(/[^0-9]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString()
}

function OfferLetterTab() {
  const [offerType, setOfferType] = useState('Rental')
  const [rental, setRental] = useState({ offerDate: '', amount: '', cheques: '', contractStart: '', notes: '' })
  const [sale, setSale] = useState({ offerDate: '', amount: '', paymentMethod: '', resaleNoc: false, salesProgression: false, agencyFee: false, mortgageDischarge: false, notes: '' })
  // These receive plain string values from FieldInput / input onChange
  const setR = (k) => (v) => setRental((prev) => ({ ...prev, [k]: k === 'amount' ? fmtCurrencyInput(v) : v }))
  const setREvent = (k) => (e) => setRental((prev) => ({ ...prev, [k]: e.target.value }))
  const setS = (k) => (v) => setSale((prev) => ({ ...prev, [k]: k === 'amount' ? fmtCurrencyInput(v) : v }))
  const setSEvent = (k) => (e) => setSale((prev) => ({ ...prev, [k]: e.target.value }))
  const toggleS = (k) => () => setSale((v) => ({ ...v, [k]: !v[k] }))

  const fieldClass = 'w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface'
  const labelClass = 'mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55'

  return (
    <Card>
      <CardHeader><CardTitle>Offer Letter</CardTitle></CardHeader>
      <CardContent className="space-y-5 text-sm">
        {/* Type selector */}
        <div>
          <p className={cn(labelClass, 'mb-2')}>Offer Letter Type</p>
          <div className="flex gap-2">
            {['Rental', 'Sale'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOfferType(t)}
                className={cn(
                  'rounded-xl border px-5 py-2 text-sm font-medium transition',
                  offerType === t
                    ? 'border-indigo bg-indigo text-white'
                    : 'border-carbon/10 text-slate hover:border-indigo/30 dark:border-white/10 dark:text-surface/70',
                )}
              >
                {t} Offer Letter
              </button>
            ))}
          </div>
        </div>

        {offerType === 'Rental' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={labelClass}>Offer Letter Date</p>
              <input type="date" value={rental.offerDate} onChange={setREvent('offerDate')} className={fieldClass} />
            </div>
            <div>
              <p className={labelClass}>Offer Amount (AED)</p>
              <FieldInput value={rental.amount} onChange={setR('amount')} placeholder="e.g. 120,000" />
            </div>
            <div>
              <p className={labelClass}>Number of Cheques</p>
              <FieldInput value={rental.cheques} onChange={setR('cheques')} placeholder="e.g. 4" />
            </div>
            <div>
              <p className={labelClass}>Contract Start Date</p>
              <input type="date" value={rental.contractStart} onChange={setREvent('contractStart')} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Notes</p>
              <textarea rows={3} value={rental.notes} onChange={(e) => setR('notes')(e.target.value)} placeholder="Offer notes…" className={fieldClass} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className={labelClass}>Offer Letter Date</p>
                <input type="date" value={sale.offerDate} onChange={setSEvent('offerDate')} className={fieldClass} />
              </div>
              <div>
                <p className={labelClass}>Offer Amount (AED)</p>
                <FieldInput value={sale.amount} onChange={setS('amount')} placeholder="e.g. 2,500,000" />
              </div>
              <div className="sm:col-span-2">
                <p className={labelClass}>Payment Method</p>
                <FieldSelect value={sale.paymentMethod} onChange={(v) => setSale((x) => ({ ...x, paymentMethod: v }))} options={['Cash', 'Mortgage', 'Mixed', 'Installment Plan']} />
              </div>
            </div>
            <div>
              <p className={cn(labelClass, 'mb-2')}>Seller's Obligations</p>
              <div className="space-y-2 rounded-xl border border-carbon/10 p-3 dark:border-white/10">
                {[
                  { key: 'resaleNoc', label: 'Resale NOC' },
                  { key: 'salesProgression', label: 'Sales Progression' },
                  { key: 'agencyFee', label: 'Agency Fee' },
                  { key: 'mortgageDischarge', label: 'Mortgage Discharge Fee' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sale[key]}
                      onChange={toggleS(key)}
                      className="h-4 w-4 rounded border-carbon/20 accent-indigo"
                    />
                    <span className="text-sm text-carbon dark:text-surface">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className={labelClass}>Notes</p>
              <textarea rows={3} value={sale.notes} onChange={(e) => setS('notes')(e.target.value)} placeholder="Offer notes…" className={fieldClass} />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-indigo/20 bg-indigo/[0.04] px-4 py-3 dark:bg-indigo/10">
          <p className="text-xs text-indigo">
            Offer letter templates are managed in <strong>NexHub → Templates</strong>. Once the details above are saved, use the Templates section to generate the document.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Documents Tab ---
const DOC_SLOTS = [
  { key: 'titleDeed', label: 'Title Deed / Oqood' },
  { key: 'emiratesId', label: 'Emirates ID' },
  { key: 'visa', label: 'VISA' },
  { key: 'passport', label: 'Passport', sensitive: true },
  { key: 'poa', label: 'POA' },
  { key: 'leasingForm', label: 'Leasing Listing Form' },
  { key: 'contractA', label: 'Contract A' },
  { key: 'contractF', label: 'Contract F' },
  { key: 'floorPlan', label: 'Floor Plan' },
  { key: 'additional1', label: 'Additional Document 1' },
  { key: 'additional2', label: 'Additional Document 2' },
  { key: 'additional3', label: 'Additional Document 3' },
]


function DocumentsTab({ propertyId }) {
  return (
    <Card>
      <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {DOC_SLOTS.map((s) => (
          <S3DocSlot key={s.key} label={s.label} sensitive={s.sensitive} entityType="property" entityId={propertyId} />
        ))}
      </CardContent>
    </Card>
  )
}

// --- Main component ---

export default function PropertyDetail() {
  const { id } = useParams()
  const { data: property, isLoading: propLoading } = useProperty(id)
  const { data: usersData = [] } = useUsers()
  const updateProperty = useUpdateProperty()
  const [tab, setTab] = useState('property-record-details')
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const agentsMap = useMemo(() => {
    const m = {}
    usersData.forEach((u) => { m[u.id] = u })
    return m
  }, [usersData])

  // Editable "Record Information" state — initialised from API data
  const [recOwner, setRecOwner] = useState('')
  const [recStatus, setRecStatus] = useState('Prospecting')
  const [recCallBack, setRecCallBack] = useState('')

  // Owner Details editable state
  const [ownerTitle, setOwnerTitleRaw] = useState('Mr')
  const [ownerFullName, setOwnerFullNameRaw] = useState('')
  const [ownerContact, setOwnerContactRaw] = useState('')
  const [ownerWhatsApp, setOwnerWhatsAppRaw] = useState('')
  const [ownerEmail, setOwnerEmailRaw] = useState('')

  // Address editable state
  const [addrUnit, setAddrUnitRaw] = useState('')
  const [addrBuilding, setAddrBuildingRaw] = useState('')
  const [addrSubComm, setAddrSubCommRaw] = useState('')
  const [addrCommunity, setAddrCommunityRaw] = useState('')
  const addrCity = 'Dubai'

  const [isDirty, setIsDirty] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveErrors, setSaveErrors] = useState([])
  const [statusValidationError, setStatusValidationError] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  const markDirty = useCallback((setter) => (v) => { setter(v); setIsDirty(true) }, [])
  const setOwnerTitle = markDirty(setOwnerTitleRaw)
  const setOwnerFullName = markDirty(setOwnerFullNameRaw)
  const setOwnerContact = markDirty(setOwnerContactRaw)
  const setOwnerWhatsApp = markDirty(setOwnerWhatsAppRaw)
  const setOwnerEmail = markDirty(setOwnerEmailRaw)
  const setAddrUnit = markDirty(setAddrUnitRaw)
  const setAddrBuilding = markDirty(setAddrBuildingRaw)
  const setAddrSubComm = markDirty(setAddrSubCommRaw)
  const setAddrCommunity = markDirty(setAddrCommunityRaw)

  // Hydrate form state from API data on first load
  useEffect(() => {
    if (!property || hydrated) return
    setRecOwner(property.listing_agent_id ?? property.listingAgentId ?? '')
    setRecStatus(property.kanban_stage ?? property.kanbanStage ?? 'Prospecting')
    setRecCallBack(property.next_call_back ?? property.nextCallBackDate ?? '')
    setOwnerTitleRaw(property.owner_title ?? property.ownerTitle ?? 'Mr')
    setOwnerFullNameRaw(property.owner_full_name ?? property.ownerFullName ?? '')
    setOwnerContactRaw(property.owner_contact_number ?? property.ownerContactNumber ?? '')
    setOwnerWhatsAppRaw(property.owner_whatsapp ?? property.ownerWhatsApp ?? '')
    setOwnerEmailRaw(property.owner_email ?? property.ownerEmail ?? '')
    setAddrUnitRaw(property.unit ?? '')
    setAddrBuildingRaw(property.building ?? '')
    setAddrSubCommRaw(property.sub_community ?? property.subCommunity ?? '')
    setAddrCommunityRaw(property.community ?? '')
    setHydrated(true)
    setIsDirty(false)
  }, [property, hydrated])

  // Warn on page close when dirty
  useEffect(() => {
    const handler = (e) => { if (isDirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleSave = async () => {
    const errors = []
    if (!ownerFullName.trim()) errors.push('Owner Full Name')
    if (!ownerContact.trim()) errors.push('Contact Number')
    if (!ownerWhatsApp.trim()) errors.push('WhatsApp Number')
    if (AVAILABLE_STATUSES.includes(recStatus)) {
      if (!addrUnit.trim()) errors.push('Unit Number')
      if (!addrBuilding.trim()) errors.push('Building')
      if (!addrSubComm.trim()) errors.push('Sub Community')
      if (!addrCommunity.trim()) errors.push('Community')
    }
    if (errors.length) { setSaveErrors(errors); return }
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        listingAgentId: recOwner || undefined,
        kanbanStage: recStatus,
        nextCallBack: recCallBack || null,
        ownerTitle, ownerFullName, ownerContactNumber: ownerContact,
        ownerWhatsApp, ownerEmail,
        unit: addrUnit, building: addrBuilding, subCommunity: addrSubComm, community: addrCommunity,
      })
      setIsDirty(false)
      setSaveErrors([])
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setSaveErrors([err.message ?? 'Save failed'])
    }
  }

  const handleStatusChange = (newStatus) => {
    if (AVAILABLE_STATUSES.includes(newStatus)) {
      const missing = []
      if (!ownerFullName.trim()) missing.push('Owner Full Name')
      if (!ownerContact.trim()) missing.push('Contact Number')
      if (!ownerWhatsApp.trim()) missing.push('WhatsApp Number')
      if (!addrUnit.trim()) missing.push('Unit Number')
      if (!addrBuilding.trim()) missing.push('Building')
      if (!addrSubComm.trim()) missing.push('Sub Community')
      if (!addrCommunity.trim()) missing.push('Community')
      if (missing.length > 0) { setStatusValidationError(missing); return }
    }
    markDirty(setRecStatus)(newStatus)
  }

  const linkedApplicants = []
  const linkedLeads = []

  if (propLoading) return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-10 w-64 rounded-xl bg-carbon/5 dark:bg-white/5 animate-pulse" />
      <div className="h-64 rounded-2xl bg-carbon/5 dark:bg-white/5 animate-pulse" />
    </div>
  )

  if (!property) return <NotFound />

  const agentId = property.listing_agent_id ?? property.listingAgentId
  const agent = agentsMap[agentId] ?? { name: 'Unassigned', color: '#94a3b8' }
  const addrPropertyName = [addrBuilding, addrUnit ? `Unit ${addrUnit}` : ''].filter(Boolean).join(' - ') || ''
  const addrBayutId = property.bayut_location_id ?? property.bayutLocationId ?? ''
  const addrPfId = property.pf_location_id ?? property.pfLocationId ?? ''

  const tabs = [
    { id: 'property-record-details', label: 'Property Record Details' },
    { id: 'documents', label: 'Documents' },
    { id: 'rental-listing', label: 'Rental Listing' },
    { id: 'sales-listing', label: 'Sales Listing' },
    { id: 'match-applicants', label: 'Match to Applicants' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={[addrBuilding, addrUnit ? `Unit ${addrUnit}` : ''].filter(Boolean).join(' · ') || 'Property Record'}
        subtitle={`${property.community ?? ''} · ${property.property_type ?? property.type ?? ''} · Unit ${property.unit ?? ''}`}
        actions={
          <>
            <Link to="/app/properties">
              <Button variant="secondary">Back</Button>
            </Link>
            <Button variant="mint" onClick={() => setFeedbackOpen(true)}>
              Suggest an improvement
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left column — tabs */}
        <div className="space-y-4">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />

          {/* --- Property Record Details (merged Owner + Address + Particulars) --- */}
          {tab === 'property-record-details' && (
            <div className="space-y-6">
              {/* Owner Details */}
              <Card>
                <CardHeader><CardTitle>Owner Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Title <span className="text-red-500">*</span></p>
                      <FieldSelect value={ownerTitle} onChange={setOwnerTitle} options={TITLE_OPTIONS} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Full Name <span className="text-red-500">*</span></p>
                      <FieldInput value={ownerFullName} onChange={setOwnerFullName} placeholder="Owner full name" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Contact Number <span className="text-red-500">*</span></p>
                      <div className="flex items-center gap-2">
                        <FieldInput value={ownerContact} onChange={setOwnerContact} type="tel" placeholder="+971 50 000 0000" className="flex-1" />
                        <a href={`tel:${ownerContact}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-carbon/10 text-slate hover:border-indigo/40 hover:text-indigo dark:border-white/10" title="Call">
                          <Phone className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">WhatsApp Number <span className="text-red-500">*</span></p>
                      <div className="flex items-center gap-2">
                        <FieldInput value={ownerWhatsApp} onChange={setOwnerWhatsApp} type="tel" placeholder="+971 50 000 0000" className="flex-1" />
                        <a href={`https://wa.me/${ownerWhatsApp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-carbon/10 text-slate hover:border-green-500/40 hover:text-green-600 dark:border-white/10" title="WhatsApp">
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">Email</p>
                      <FieldInput value={ownerEmail} onChange={setOwnerEmail} type="email" placeholder="owner@email.com" />
                    </div>
                  </div>
                  <p className="text-xs text-slate dark:text-surface/50"><span className="text-red-500">*</span> Mandatory fields</p>
                  <AdditionalOwnersSection />
                </CardContent>
              </Card>

              {/* Address Info — editable, all mandatory */}
              <Card>
                <CardHeader><CardTitle>Address Information</CardTitle></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Unit Number <span className="text-red-500">*</span></p>
                    <FieldInput value={addrUnit} onChange={(v) => setAddrUnit(v)} placeholder="e.g. 1800" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Building <span className="text-red-500">*</span></p>
                    <FieldInput value={addrBuilding} onChange={(v) => setAddrBuilding(v)} placeholder="e.g. Al Reef 1" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Sub Community <span className="text-red-500">*</span></p>
                    <FieldInput value={addrSubComm} onChange={(v) => setAddrSubComm(v)} placeholder="e.g. Downtown Dubai Phase 1" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Community <span className="text-red-500">*</span></p>
                    <FieldInput value={addrCommunity} onChange={(v) => setAddrCommunity(v)} placeholder="e.g. Downtown Dubai" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">City</p>
                    <input readOnly value={addrCity} className="w-full cursor-not-allowed rounded-xl border border-carbon/10 bg-surface/60 px-3 py-2 text-sm text-carbon dark:bg-carbon-900/40 dark:border-white/10 dark:text-surface/70" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Property Info Name <span className="text-slate/50 normal-case">(auto)</span></p>
                    <input readOnly value={addrPropertyName} className="w-full cursor-not-allowed rounded-xl border border-carbon/10 bg-surface/60 px-3 py-2 text-sm text-carbon dark:bg-carbon-900/40 dark:border-white/10 dark:text-surface/70" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Bayut Location ID <span className="text-slate/50 normal-case">(auto)</span></p>
                    <input readOnly value={addrBayutId} className="w-full cursor-not-allowed rounded-xl border border-carbon/10 bg-surface/60 px-3 py-2 text-sm text-carbon dark:bg-carbon-900/40 dark:border-white/10 dark:text-surface/70" placeholder="Linked via API" />
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">PF Location ID <span className="text-slate/50 normal-case">(auto)</span></p>
                    <input readOnly value={addrPfId} className="w-full cursor-not-allowed rounded-xl border border-carbon/10 bg-surface/60 px-3 py-2 text-sm text-carbon dark:bg-carbon-900/40 dark:border-white/10 dark:text-surface/70" placeholder="Linked via API" />
                  </div>
                </CardContent>
              </Card>

              {/* Property Particulars */}
              <PropertyParticularsTab property={property} recStatus={recStatus} />
            </div>
          )}

          {/* --- Match to Applicants --- */}
          {tab === 'match-applicants' && (
            <Card>
              <CardHeader>
                <CardTitle>Match to Applicants</CardTitle>
                <p className="text-sm text-slate dark:text-surface/60">Matching criteria and shortlisted applicants will be designed in the next phase.</p>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-dashed border-carbon/15 py-12 text-center dark:border-white/15">
                  <p className="text-sm font-medium text-carbon dark:text-surface">Coming in next phase</p>
                  <p className="mt-1 text-xs text-slate dark:text-surface/55">This tab will surface matched applicants based on property attributes and requirements.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* --- Rental Listing --- */}
          {tab === 'rental-listing' && (
            <ListingTab kind="Leasing" propertyId={property.id} usersData={usersData} />
          )}

          {/* --- Sales Listing --- */}
          {tab === 'sales-listing' && (
            <ListingTab kind="Sales" propertyId={property.id} usersData={usersData} />
          )}

          {/* --- Documents --- */}
          {tab === 'documents' && (
            <DocumentsTab propertyId={property.id} />
          )}

          {/* --- Activity (Timeline + Notes + Attachments + Emails) --- */}
          {tab === 'activity' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {property.timeline?.map((t) => (
                    <div key={t.id} className="border-l-2 border-indigo/40 pl-4">
                      <p className="text-xs text-slate dark:text-surface/60">
                        {t.at.replace('T', ' · ')}
                      </p>
                      <p className="font-medium text-carbon dark:text-surface">
                        {t.label}
                      </p>
                      <p className="text-sm text-slate dark:text-surface/75">
                        {t.detail}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-6 pt-5">
                  <NotesPanel notes={[
                    { id: 1, text: 'Premium finish — agency exclusive agreement signed.', at: '2026-05-01 · 10:00' },
                  ]} />
                  <div className="border-t border-carbon/[0.06] dark:border-white/10" />
                  <EmailsPanel />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Record Owner */}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">
                  Record Owner
                </p>
                <select
                  value={recOwner}
                  onChange={(e) => setRecOwner(e.target.value)}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                >
                  {usersData.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Record creation date */}
              <div className="flex items-center justify-between">
                <span className="text-slate dark:text-surface/65">Created</span>
                <span className="font-semibold text-carbon dark:text-surface">
                  {property.created_at ? new Date(property.created_at).toLocaleDateString() : '—'}
                </span>
              </div>

              {/* Property Status */}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">
                  Property Status
                </p>
                <select
                  value={recStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                >
                  {PROPERTY_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Next call back date */}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate dark:text-surface/55">
                  Next Call Back Date
                </p>
                <input
                  type="date"
                  value={recCallBack}
                  onChange={(e) => setRecCallBack(e.target.value)}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm text-carbon dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                />
              </div>

              {/* Save button */}
              <div className="pt-1">
                {saveSuccess ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-mint/10 px-4 py-2.5 text-sm font-semibold text-mint">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleSave}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {isDirty ? 'Save Changes' : 'No Changes'}
                  </Button>
                )}
                {isDirty && !saveSuccess && (
                  <p className="mt-1.5 text-center text-[10px] text-amber-500">Unsaved changes</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Records */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Linked Records</CardTitle>
              <button
                type="button"
                title="Linked records are matched by the applicants and leads associated with this property record. In Phase 3 these will also match on owner contact number and email across all modules."
                className="text-slate hover:text-indigo dark:text-surface/55"
              >
                <Info className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="rounded-lg bg-indigo/[0.06] px-3 py-2 text-xs text-slate dark:text-surface/60">
                <strong className="text-carbon dark:text-surface">Current rule:</strong>{' '}
                Applicants and leads whose records have been manually linked to
                this property. In a future phase, all records sharing the owner&apos;s
                phone number or email will surface here automatically.
              </p>

              {linkedApplicants.length > 0 && (
                <div>
                  <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">
                    Applicants
                  </p>
                  {linkedApplicants.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-carbon/10 px-3 py-2 text-sm dark:border-white/10"
                    >
                      <p className="font-medium text-carbon dark:text-surface">{a.name}</p>
                      <p className="text-xs text-slate">{a.type} · {a.requirements}</p>
                    </div>
                  ))}
                </div>
              )}

              {linkedLeads.length > 0 && (
                <div>
                  <p className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">
                    Leads
                  </p>
                  {linkedLeads.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-xl border border-carbon/10 px-3 py-2 text-sm dark:border-white/10"
                    >
                      <p className="font-medium text-carbon dark:text-surface">{l.fullName}</p>
                      <p className="text-xs text-slate">{l.source}</p>
                    </div>
                  ))}
                </div>
              )}

              {linkedApplicants.length === 0 && linkedLeads.length === 0 && (
                <p className="text-sm text-slate dark:text-surface/55">
                  No linked records yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save errors modal */}
      <Modal open={saveErrors.length > 0} onClose={() => setSaveErrors([])} title="Cannot save record" className="max-w-sm">
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/40 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <p className="text-red-700 dark:text-red-400">The following mandatory fields must be completed before saving:</p>
          </div>
          <ul className="space-y-1.5">
            {saveErrors.map((f) => (
              <li key={f} className="flex items-center gap-2 text-carbon dark:text-surface">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />{f}
              </li>
            ))}
          </ul>
          <div className="flex justify-end pt-1">
            <Button onClick={() => setSaveErrors([])}>Got it</Button>
          </div>
        </div>
      </Modal>

      {/* Status validation modal */}
      <Modal
        open={!!statusValidationError}
        onClose={() => setStatusValidationError(null)}
        title="Mandatory fields required"
        className="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate dark:text-surface/70">
            The following fields must be completed before changing the status to an available listing:
          </p>
          <ul className="space-y-1.5">
            {statusValidationError?.map((field) => (
              <li key={field} className="flex items-center gap-2 text-carbon dark:text-surface">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {field}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate dark:text-surface/55">
            Please fill in the Property Record Details tab before setting the status to To Let Available, For Sale Available, or To Let / For Sale Available.
          </p>
          <div className="flex justify-end pt-1">
            <Button onClick={() => setStatusValidationError(null)}>Got it</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Suggest an improvement"
      >
        <p className="text-sm text-slate dark:text-surface/70">
          Tell the team what to refine on the Properties module
          locally only (Phase 3: CRM tickets).
        </p>
        <textarea
          className="mt-3 w-full rounded-xl border border-carbon/10 p-3 text-sm dark:bg-carbon-900 dark:border-white/10 dark:text-surface"
          rows={4}
          placeholder="Ideas, fields, automations…"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setFeedbackOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setFeedbackOpen(false)}>Send</Button>
        </div>
      </Modal>
    </div>
  )
}
