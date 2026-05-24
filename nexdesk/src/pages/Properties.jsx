import { useCallback, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { MapPin, LayoutGrid, Table2, Map as MapIcon, Plus, StickyNote, ExternalLink, SlidersHorizontal, X as XIcon } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Drawer } from '../components/ui/Drawer'
import { Modal } from '../components/ui/Modal'
import { Avatar } from '../components/ui/Avatar'
import { Table, Th, Td } from '../components/ui/Table'
import { cn, formatPropertyPrice } from '../lib/utils'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import { useProperties, useCreateProperty, useUpdateProperty } from '../hooks/useProperties'
import { useUsers } from '../hooks/useUsers'
import { useLocalStorage } from '../lib/useLocalStorage'
import { clientDemo } from '../lib/clientDemo'

const STAGES = [
  'Prospecting',
  'Market Appraisal',
  'To Let Available',
  'For Sale Available',
  'To Let / For Sale Available',
  'Archived',
]

function DroppableColumn({ id, title, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[260px] shrink-0 flex-col rounded-xl bg-carbon/[0.03] pb-2 dark:bg-white/[0.04]',
        isOver && 'ring-2 ring-indigo/40',
      )}
    >
      <div className="flex items-center justify-between border-b border-carbon/[0.06] px-3 py-2 dark:border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/70">
          {title}
        </span>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium shadow-sm dark:bg-carbon-800">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[160px]">{children}</div>
    </div>
  )
}

function PropertyCard({ property, onOpen, agents }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: property.id })

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined

  const agentId = property.listing_agent_id ?? property.listingAgentId
  const agent = agents[agentId]
  const priceAed = property.asking_price_aed ?? property.askingPriceAed ?? 0
  const priceNote = property.extra_info ?? property.extraInfo
  const beds = property.beds ?? 0
  const baths = property.baths ?? 0
  const type = property.property_type ?? property.type
  const subCom = property.sub_community ?? property.subCommunity
  const community = property.community

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab rounded-xl border border-carbon/[0.08] bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-indigo/40 active:cursor-grabbing dark:border-white/10 dark:bg-carbon-800',
        isDragging && 'opacity-60 ring-2 ring-indigo/30',
      )}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(property)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(property)
        }
      }}
    >
      <p className="text-sm font-semibold text-carbon dark:text-surface leading-tight">
        Unit {property.unit}{property.building ? ` · ${property.building}` : ''}
      </p>
      <p className="mt-0.5 text-xs text-slate dark:text-surface/65 line-clamp-2">
        {[subCom, community].filter(Boolean).join(' · ')}
      </p>

      <p className="mt-2 text-sm font-bold text-indigo">
        {formatPropertyPrice(priceAed, priceNote)}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate dark:text-surface/65">
        {type && <span className="rounded-md bg-surface px-1.5 py-0.5 dark:bg-carbon-900/60">{type}</span>}
        {beds > 0 && <span>{beds} bed</span>}
        {baths > 0 && <><span>·</span><span>{baths} bath</span></>}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {agent && <Avatar name={agent.name} color={agent.color} size="sm" />}
        {(property.published_live ?? property.publishedLive) && (
          <span className="flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Live
          </span>
        )}
      </div>
    </div>
  )
}

export default function Properties() {
  const { currentUserId } = useApp()
  const { toast } = useToast()

  const [scope, setScope] = useState('my')
  const [view, setView] = useState('kanban')
  const [kanbanValidation, setKanbanValidation] = useState(null)

  // Always fetch all properties so both My / Company counts are always available
  const { data: allProperties = [], isLoading } = useProperties()
  const { data: usersData = [] } = useUsers()
  const updateProperty = useUpdateProperty()
  const createProperty = useCreateProperty()

  const agents = useMemo(() => {
    const map = {}
    usersData.forEach((u) => { map[u.id] = u })
    return map
  }, [usersData])

  const properties = useMemo(
    () => scope === 'my'
      ? allProperties.filter((p) => (p.listing_agent_id ?? p.listingAgentId) === currentUserId)
      : allProperties,
    [allProperties, scope, currentUserId],
  )

  const filtered = properties

  const effectiveStage = useCallback(
    (p) => p.kanban_stage ?? p.kanbanStage,
    [],
  )

  const columns = useMemo(() => {
    const map = {}
    STAGES.forEach((s) => { map[s] = [] })
    filtered.forEach((p) => {
      const st = effectiveStage(p)
      const col = STAGES.includes(st) ? st : STAGES[0]
      map[col].push(p)
    })
    return map
  }, [filtered, effectiveStage])

  // loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="h-10 w-48 rounded-xl bg-carbon/5 dark:bg-white/5 animate-pulse" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <div key={s} className="w-[260px] shrink-0 rounded-xl bg-carbon/[0.03] dark:bg-white/[0.04] h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const [inspect, setInspect] = useState(null)
  const [inspectorNote, setInspectorNote] = useState('')
  const [allNotes, setAllNotes] = useLocalStorage('nd_prop_notes', {})
  const [createOpen, setCreateOpen] = useState(false)

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterBeds, setFilterBeds] = useState('')
  const [filterCommunity, setFilterCommunity] = useState('')
  const [filterAgent, setFilterAgent] = useState('')

  const activeFilterCount = [filterType, filterBeds, filterCommunity, filterAgent].filter(Boolean).length
  const clearFilters = () => { setFilterType(''); setFilterBeds(''); setFilterCommunity(''); setFilterAgent('') }

  const filteredWithFilters = useMemo(() => {
    return filtered.filter((p) => {
      const type = p.property_type ?? p.type
      const agentId = p.listing_agent_id ?? p.listingAgentId
      if (filterType && type !== filterType) return false
      if (filterBeds && String(p.beds) !== filterBeds) return false
      if (filterCommunity && !p.community?.toLowerCase().includes(filterCommunity.toLowerCase())) return false
      if (filterAgent && agentId !== filterAgent) return false
      return true
    })
  }, [filtered, filterType, filterBeds, filterCommunity, filterAgent])

  const columnsFiltered = useMemo(() => {
    const map = {}
    STAGES.forEach((s) => { map[s] = [] })
    filteredWithFilters.forEach((p) => {
      const st = effectiveStage(p)
      const col = STAGES.includes(st) ? st : STAGES[0]
      map[col].push(p)
    })
    return map
  }, [filteredWithFilters, effectiveStage])
  const [newRecord, setNewRecord] = useState({
    // Record info
    recordOwner: '', status: 'Prospecting', nextCallBack: '',
    // Owner details
    ownerTitle: 'None', ownerFullName: '', ownerContact: '', ownerWhatsApp: '', ownerEmail: '',
    // Address
    unit: '', building: '', subCommunity: '', community: '', city: 'Dubai',
    bayutLocationId: '', pfLocationId: '',
    // Property particulars
    projectStatus: 'Ready Secondary', residentialOrCommercial: 'Residential',
    type: 'Apartment', beds: 'None', baths: 'None', furnishing: 'None',
    parking: 'None', occupancy: 'None', buaSize: '', plotSize: '', extras: 'None', extraInfo: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const [activeDrag, setActiveDrag] = useState(null)

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      <PageHeader
        title="Properties"
        subtitle="Master records · My vs Company scope · Kanban, table, or map."
        actions={<Button variant="secondary" onClick={() => { setNewRecord((r) => ({ ...r, recordOwner: currentUserId })); setCreateOpen(true) }}><Plus className="mr-1 h-4 w-4" /> Create record</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        {/* My / Company toggle with count */}
        <div className="flex rounded-xl border border-carbon/10 bg-white p-1 dark:border-white/10 dark:bg-carbon-800">
          {[
            {
              id: 'my',
              label: 'My Records',
              count: isLoading ? '…' : allProperties.filter((p) => (p.listing_agent_id ?? p.listingAgentId) === currentUserId).length,
            },
            {
              id: 'company',
              label: 'Company Records',
              count: isLoading ? '…' : allProperties.length,
            },
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
              {opt.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  scope === opt.id
                    ? 'bg-white/25 text-white'
                    : 'bg-carbon/8 text-carbon dark:bg-white/10 dark:text-surface/70',
                )}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
              activeFilterCount > 0
                ? 'border-indigo bg-indigo/10 text-indigo'
                : 'border-carbon/10 text-slate hover:border-indigo/30 dark:border-white/10 dark:text-surface/70',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-carbon/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-carbon-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">Filter Properties</p>
                <button type="button" onClick={() => setFilterOpen(false)}><XIcon className="h-4 w-4 text-slate" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 text-xs text-slate dark:text-surface/55">Property Type</p>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-900 dark:border-white/10 dark:text-surface">
                    <option value="">All types</option>
                    {['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Duplex', 'Office', 'Retail', 'Plot', 'Warehouse'].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate dark:text-surface/55">Bedrooms</p>
                  <select value={filterBeds} onChange={(e) => setFilterBeds(e.target.value)}
                    className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-900 dark:border-white/10 dark:text-surface">
                    <option value="">Any</option>
                    {['0', '1', '2', '3', '4', '5', '6'].map((b) => <option key={b} value={b}>{b === '0' ? 'Studio' : `${b} bed`}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate dark:text-surface/55">Community</p>
                  <input value={filterCommunity} onChange={(e) => setFilterCommunity(e.target.value)}
                    placeholder="e.g. Marina, Downtown…"
                    className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-900 dark:border-white/10 dark:text-surface" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate dark:text-surface/55">Record Owner</p>
                  <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
                    className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-900 dark:border-white/10 dark:text-surface">
                    <option value="">All agents</option>
                    {Object.values(agents).filter(Boolean).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={clearFilters}
                    className="w-full rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20">
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex rounded-xl border border-carbon/10 p-1 dark:border-white/10">
          {[
            { id: 'kanban', icon: LayoutGrid, label: 'Kanban' },
            { id: 'table', icon: Table2, label: 'Table' },
            { id: 'map', icon: MapIcon, label: 'Map' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
                view === id
                  ? 'bg-white text-indigo shadow-sm dark:bg-carbon-800'
                  : 'text-slate hover:text-carbon dark:text-surface/70',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate dark:text-surface/60">
          <span>Showing filtered results —</span>
          <button type="button" onClick={clearFilters} className="text-indigo underline">Clear filters</button>
        </div>
      )}

      {view === 'map' && (
        <div className="relative overflow-hidden rounded-2xl border border-carbon/10 bg-surface dark:border-white/10">
          <img
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80"
            alt="Dubai map preview"
            className="h-[420px] w-full object-cover opacity-90 dark:opacity-80"
          />
          <div className="absolute inset-0 flex flex-wrap items-start gap-4 p-6">
            {filtered.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setInspect(p)}
                className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold shadow-card dark:bg-carbon-800/95"
              >
                <MapPin className="h-4 w-4 text-indigo" />
                {p.community}
                <span className="text-slate">·</span>
                {formatPropertyPrice(p.asking_price_aed ?? p.askingPriceAed, p.extra_info ?? p.extraInfo)}
              </button>
            ))}
          </div>
          <p className="absolute bottom-4 left-4 rounded-lg bg-carbon/70 px-3 py-2 text-xs text-white backdrop-blur-sm">
            Map view · Geo linking in Phase 2
          </p>
        </div>
      )}

      {view === 'table' && (
        <Table>
          <thead>
            <tr>
              <Th>Address</Th>
              <Th>{clientDemo?.labels?.priceColumn ?? 'Price (AED)'}</Th>
              <Th>Type</Th>
              <Th>Beds / Baths</Th>
              <Th>Stage</Th>
              <Th>Owner</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <Td>
                  <button
                    type="button"
                    className="text-left font-medium text-indigo hover:underline"
                    onClick={() => setInspect(p)}
                  >
                    Unit {p.unit}{p.building ? ` · ${p.building}` : ''}
                  </button>
                  <p className="text-xs text-slate">{p.community}</p>
                </Td>
                <Td>{formatPropertyPrice(p.asking_price_aed ?? p.askingPriceAed, p.extra_info ?? p.extraInfo)}</Td>
                <Td>{p.property_type ?? p.type}</Td>
                <Td>{(p.beds ?? 0) > 0 ? `${p.beds} / ${p.baths}` : '—'}</Td>
                <Td>{effectiveStage(p)}</Td>
                <Td>{agents[p.listing_agent_id ?? p.listingAgentId]?.name ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => {
            const p = filtered.find((x) => x.id === e.active.id)
            setActiveDrag(p ?? null)
          }}
          onDragEnd={(e) => {
            setActiveDrag(null)
            const { active, over } = e
            if (!over || !STAGES.includes(String(over.id))) return
            const targetStage = String(over.id)
            const AVAILABLE_STATUSES = ['To Let Available', 'For Sale Available', 'To Let / For Sale Available']
            if (AVAILABLE_STATUSES.includes(targetStage)) {
              const prop = allProperties.find((x) => x.id === active.id)
              if (prop) {
                const missing = []
                if (!(prop.owner_full_name ?? prop.ownerFullName ?? '').trim()) missing.push('Owner Full Name')
                if (!(prop.owner_contact_number ?? prop.ownerContactNumber ?? '').trim()) missing.push('Contact Number')
                if (!(prop.owner_whatsapp ?? prop.ownerWhatsApp ?? '').trim()) missing.push('WhatsApp Number')
                if (!(prop.unit ?? '').toString().trim()) missing.push('Unit Number')
                if (!(prop.building ?? '').trim()) missing.push('Building')
                if (!(prop.sub_community ?? prop.subCommunity ?? '').trim()) missing.push('Sub Community')
                if (!(prop.community ?? '').trim()) missing.push('Community')
                if (missing.length > 0) {
                  setKanbanValidation({ missing, stage: targetStage })
                  return
                }
              }
            }
            updateProperty.mutate({ id: active.id, kanbanStage: targetStage })
            toast('Stage updated')
          }}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-touch">
            {STAGES.map((col) => (
              <DroppableColumn
                key={col}
                id={col}
                title={col}
                count={columnsFiltered[col]?.length ?? 0}
              >
                {columnsFiltered[col]?.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    agents={agents}
                    onOpen={setInspect}
                  />
                ))}
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeDrag ? (
              <div className="w-[250px] rounded-xl border border-indigo/40 bg-white p-3 opacity-95 shadow-2xl dark:bg-carbon-800">
                <p className="text-sm font-semibold">Unit {activeDrag.unit}{activeDrag.building ? ` · ${activeDrag.building}` : ''}</p>
                <p className="text-xs text-slate">{activeDrag.community}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Drawer open={!!inspect} onClose={() => setInspect(null)} title="Record Preview">
        {inspect && (
          <div className="space-y-4 text-sm">
            {/* Open full record — top */}
            <Link to={`/app/properties/${inspect.id}`} onClick={() => setInspect(null)}>
              <Button className="w-full"><ExternalLink className="mr-1.5 h-4 w-4" /> Open Full Record</Button>
            </Link>

            {/* Address */}
            <div>
              <p className="font-semibold text-carbon dark:text-surface">
                Unit {inspect.unit}{inspect.building ? ` · ${inspect.building}` : ''}
              </p>
              <p className="text-xs text-slate dark:text-surface/70">
                {[(inspect.sub_community ?? inspect.subCommunity), inspect.community].filter(Boolean).join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="indigo">{effectiveStage(inspect)}</Badge>
              <Badge variant="outline">{inspect.property_type ?? inspect.type}</Badge>
              {(inspect.beds ?? 0) > 0 && <Badge>{inspect.beds} bed · {inspect.baths} bath</Badge>}
            </div>
            <p className="font-bold text-indigo">
              {formatPropertyPrice(inspect.asking_price_aed ?? inspect.askingPriceAed, inspect.extra_info ?? inspect.extraInfo)}
            </p>

            {/* Owner details shortcut */}
            <div className="rounded-xl border border-carbon/[0.06] p-3 space-y-1.5 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55">Owner Details</p>
              <p className="text-carbon dark:text-surface">{inspect.owner_full_name ?? inspect.ownerFullName ?? inspect.ownerName}</p>
              {(inspect.owner_contact_number ?? inspect.ownerContactNumber) && (
                <p className="text-slate dark:text-surface/70">{inspect.owner_contact_number ?? inspect.ownerContactNumber}</p>
              )}
                {(inspect.owner_email ?? inspect.ownerEmail) && (
                  <p className="text-slate dark:text-surface/70">{inspect.owner_email ?? inspect.ownerEmail}</p>
                )}
            </div>

            {/* Notes shortcut */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate dark:text-surface/55 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Notes
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-carbon/10 bg-white px-3 py-1.5 text-xs dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                  placeholder="Add a note…"
                  value={inspectorNote}
                  onChange={(e) => setInspectorNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inspectorNote.trim()) {
                      const note = { id: Date.now(), text: inspectorNote, at: new Date().toLocaleString() }
                      setAllNotes((n) => ({ ...n, [inspect.id]: [note, ...(n[inspect.id] ?? [])] }))
                      setInspectorNote('')
                    }
                  }}
                />
                <Button size="sm" onClick={() => {
                  if (!inspectorNote.trim()) return
                  const note = { id: Date.now(), text: inspectorNote, at: new Date().toLocaleString() }
                  setAllNotes((n) => ({ ...n, [inspect.id]: [note, ...(n[inspect.id] ?? [])] }))
                  setInspectorNote('')
                }}>Add</Button>
              </div>
              {(allNotes[inspect?.id] ?? []).length === 0 && inspect.notes && (
                <p className="rounded-xl border border-carbon/[0.06] px-3 py-2 text-xs text-carbon dark:border-white/10 dark:text-surface">{inspect.notes}</p>
              )}
              {(allNotes[inspect?.id] ?? []).map((n) => (
                <div key={n.id} className="rounded-xl border border-carbon/[0.06] px-3 py-2 text-xs dark:border-white/10">
                  <p className="text-carbon dark:text-surface">{n.text}</p>
                  <p className="mt-0.5 text-slate dark:text-surface/50">{n.at}</p>
                </div>
              ))}
            </div>

          </div>
        )}
      </Drawer>

      {/* Kanban mandatory-field validation modal */}
      <Modal
        open={!!kanbanValidation}
        onClose={() => setKanbanValidation(null)}
        title="Mandatory fields required"
        className="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate dark:text-surface/70">
            The following fields must be completed before moving this property to <strong>{kanbanValidation?.stage}</strong>:
          </p>
          <ul className="space-y-1.5">
            {kanbanValidation?.missing.map((field) => (
              <li key={field} className="flex items-center gap-2 text-carbon dark:text-surface">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {field}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate dark:text-surface/55">
            Open the property record and complete the Property Record Details tab first.
          </p>
          <div className="flex justify-end pt-1">
            <Button onClick={() => setKanbanValidation(null)}>Got it</Button>
          </div>
        </div>
      </Modal>

      {/* Create Record modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Property Record" className="max-w-2xl">
        <div className="max-h-[70vh] overflow-y-auto scroll-touch space-y-5 pr-1 text-sm">
          {/* --- Record Info --- */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo">Record Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Record Owner</p>
                <select value={newRecord.recordOwner} onChange={(e) => setNewRecord((r) => ({ ...r, recordOwner: e.target.value }))}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
                  <option value="">Unassigned</option>
                  {agents && Object.values(agents).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Status</p>
                <select value={newRecord.status} onChange={(e) => setNewRecord((r) => ({ ...r, status: e.target.value }))}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
                  {['Prospecting','Market Appraisal','To Let Available','For Sale Available','To Let / For Sale Available','Archived'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Next Call Back Date</p>
                <input type="date" value={newRecord.nextCallBack} onChange={(e) => setNewRecord((r) => ({ ...r, nextCallBack: e.target.value }))}
                  className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface" />
              </div>
            </div>
          </div>

          {/* --- Owner Details --- */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo">Owner Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Title', key: 'ownerTitle', sel: ['None','Mr','Mrs','Ms','Dr','H.H.','H.E.','Eng'] },
              ].map(({ label, key, sel }) => (
                <div key={key}>
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">{label}</p>
                  <select value={newRecord[key]} onChange={(e) => setNewRecord((r) => ({ ...r, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
                    {sel.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[
                { label: 'Full Name', key: 'ownerFullName', placeholder: 'Owner full name' },
                { label: 'Contact Number', key: 'ownerContact', placeholder: '+971 50 000 0000' },
                { label: 'WhatsApp Number', key: 'ownerWhatsApp', placeholder: '+971 50 000 0000' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">{label}</p>
                  <input className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                    placeholder={placeholder} value={newRecord[key]} onChange={(e) => setNewRecord((r) => ({ ...r, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="col-span-2">
                <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Email</p>
                <input type="email" className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                  placeholder="owner@email.com" value={newRecord.ownerEmail} onChange={(e) => setNewRecord((r) => ({ ...r, ownerEmail: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* --- Address Info --- */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo">Address Info</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Unit Number', key: 'unit', placeholder: '1802' },
                { label: 'Building', key: 'building', placeholder: 'Al Reef 1' },
                { label: 'Sub-Community', key: 'subCommunity', placeholder: 'Downtown Dubai Phase 1' },
                { label: 'Community', key: 'community', placeholder: 'Downtown Dubai' },
                { label: 'City', key: 'city', placeholder: 'Dubai' },
                { label: 'Bayut Location ID', key: 'bayutLocationId', placeholder: '123' },
                { label: 'PF Location ID', key: 'pfLocationId', placeholder: '456' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">{label}</p>
                  <input className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                    placeholder={placeholder} value={newRecord[key]} onChange={(e) => setNewRecord((r) => ({ ...r, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          {/* --- Property Particulars --- */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo">Property Particulars</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Project Status', key: 'projectStatus', sel: ['Ready Secondary','Ready Primary','Off-Plan Primary','Off-Plan Secondary'] },
                { label: 'Residential / Commercial', key: 'residentialOrCommercial', sel: ['Residential','Commercial'] },
                { label: 'Property Type', key: 'type', sel: ['Apartment','Villa','Townhouse','Penthouse','Office','Retail','Plot'] },
                { label: 'Bedrooms', key: 'beds', sel: ['None','Studio','1','2','3','4','5','6','7+'] },
                { label: 'Bathrooms', key: 'baths', sel: ['None','1','2','3','4','5','6+'] },
                { label: 'Furnishing', key: 'furnishing', sel: ['None','Furnished','Unfurnished','Part Furnished'] },
                { label: 'Parking', key: 'parking', sel: ['None','1','2','3','Covered','Open'] },
                { label: 'Occupancy', key: 'occupancy', sel: ['None','Vacant','Occupied','Investor'] },
              ].map(({ label, key, sel }) => (
                <div key={key}>
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">{label}</p>
                  <select value={newRecord[key]} onChange={(e) => setNewRecord((r) => ({ ...r, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface">
                    {sel.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              {[
                { label: 'BUA Size (sqft)', key: 'buaSize', placeholder: 'e.g. 1200' },
                { label: 'Plot Size (sqft)', key: 'plotSize', placeholder: 'e.g. 2400' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">{label}</p>
                  <input type="number" className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                    placeholder={placeholder} value={newRecord[key]} onChange={(e) => setNewRecord((r) => ({ ...r, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="col-span-2">
                <p className="mb-1 text-xs uppercase tracking-wide text-slate dark:text-surface/55">Any Extra Information</p>
                <textarea rows={2} className="w-full rounded-xl border border-carbon/10 bg-white px-3 py-2 text-sm dark:bg-carbon-800 dark:border-white/10 dark:text-surface"
                  placeholder="Additional details…" value={newRecord.extraInfo} onChange={(e) => setNewRecord((r) => ({ ...r, extraInfo: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-carbon/[0.06] pt-4 dark:border-white/10">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!newRecord.unit && !newRecord.community) { toast('Add at least a unit or community'); return }
              try {
                await createProperty.mutateAsync({
                  listingAgentId: newRecord.recordOwner || currentUserId,
                  kanbanStage: newRecord.status, status: newRecord.status,
                  nextCallBack: newRecord.nextCallBack || null,
                  ownerTitle: newRecord.ownerTitle, ownerFullName: newRecord.ownerFullName,
                  ownerContactNumber: newRecord.ownerContact, ownerWhatsApp: newRecord.ownerWhatsApp,
                  ownerEmail: newRecord.ownerEmail,
                  unit: newRecord.unit, building: newRecord.building,
                  subCommunity: newRecord.subCommunity, community: newRecord.community, city: newRecord.city,
                  type: newRecord.type,
                  beds: parseInt(newRecord.beds) || 0, baths: parseInt(newRecord.baths) || 0,
                  furnishing: newRecord.furnishing, parking: newRecord.parking, occupancy: newRecord.occupancy,
                  buaSize: newRecord.buaSize || null, plotSize: newRecord.plotSize || null,
                  extraInfo: newRecord.extraInfo,
                  projectStatus: newRecord.projectStatus,
                  residentialOrCommercial: newRecord.residentialOrCommercial,
                })
                toast('Record created')
                setCreateOpen(false)
              } catch (err) {
                toast('Failed to create: ' + err.message)
              }
            }}>Create Record</Button>
        </div>
      </Modal>
    </div>
  )
}
