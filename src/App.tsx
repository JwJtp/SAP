import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Copy,
  FileText,
  Gauge,
  Info,
  Layers3,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Recycle,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  UserCircle2,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { demoCustomers, demoMaterials, initialForm, initialItems, orgData } from './data/demoData'
import { calculateTotals, formatCurrency, lineAmount, validateOrder } from './lib/calculations'
import { sapAdapter, type SapOrderDraft } from './services/sapAdapter'
import type { Customer, MaterialCatalogItem, NavId, OrderForm, OrderItem, OrderStatus, TabId, ToastMessage, ValidationErrors } from './types'

const navItems: Array<{ id: NavId; label: string; icon: LucideIcon; badge?: string }> = [
  { id: 'home', label: 'Home', icon: Gauge },
  { id: 'sales-orders', label: 'Sales Orders', icon: FileText, badge: '12' },
  { id: 'create', label: 'Create Scrap Sales', icon: Recycle },
  { id: 'manage-orders', label: 'Manage Orders', icon: ClipboardCheck },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'materials', label: 'Materials', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const tabs: Array<{ id: TabId; label: string; shortLabel: string }> = [
  { id: 'sales', label: 'Sales', shortLabel: 'Sales' },
  { id: 'items', label: 'Item Overview', shortLabel: 'Items' },
  { id: 'detail', label: 'Item Detail', shortLabel: 'Detail' },
  { id: 'ordering', label: 'Ordering Party', shortLabel: 'Ordering' },
  { id: 'procurement', label: 'Procurement', shortLabel: 'Procurement' },
]

const statusSteps: Array<{ id: OrderStatus; label: string; note: string }> = [
  { id: 'draft', label: 'Draft', note: 'In progress' },
  { id: 'validated', label: 'Validated', note: 'Checks passed' },
  { id: 'created', label: 'Created', note: 'Demo reference' },
  { id: 'completed', label: 'Completed', note: 'SAP confirmation' },
]

const statusOrder: OrderStatus[] = ['draft', 'validated', 'created', 'completed']

type CustomerField = 'soldTo' | 'shipTo'
type BusyAction = 'save' | 'validate' | 'create' | null

type DialogKind = 'cancel' | 'create' | null

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<NavId>('create')
  const [activeTab, setActiveTab] = useState<TabId>('sales')
  const [form, setForm] = useState<OrderForm>(initialForm)
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [status, setStatus] = useState<OrderStatus>('draft')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [globalSearch, setGlobalSearch] = useState('')
  const [customerField, setCustomerField] = useState<CustomerField | null>(null)
  const [customerResults, setCustomerResults] = useState<Customer[]>(demoCustomers)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [materialSearch, setMaterialSearch] = useState('')
  const [notes, setNotes] = useState(() => {
    try {
      return window.localStorage.getItem('scrapflow-demo-notes') ?? ''
    } catch {
      return ''
    }
  })
  const [notesSaved, setNotesSaved] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)

  const totals = useMemo(() => calculateTotals(items), [items])
  const selectedCount = items.filter((item) => item.selected).length
  const customerQuery = customerField ? form[customerField] : ''
  const selectedItem = items.find((item) => item.selected) ?? items[0]

  useEffect(() => {
    let active = true
    if (!customerField) return undefined
    setCustomerLoading(true)
    sapAdapter.searchCustomers(customerQuery).then((results) => {
      if (active) {
        setCustomerResults(results)
        setCustomerLoading(false)
      }
    }).catch(() => {
      if (active) {
        setCustomerResults([])
        setCustomerLoading(false)
        notify('error', 'Customer search unavailable', 'The customer master adapter did not respond. Try again or connect SAP.')
      }
    })
    return () => {
      active = false
    }
  }, [customerField, customerQuery])

  const notify = (tone: ToastMessage['tone'], title: string, message: string) => {
    const toast = { id: Date.now() + Math.random(), tone, title, message }
    setToasts((current) => [...current, toast])
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 4200)
  }

  const updateForm = <K extends keyof OrderForm>(key: K, value: OrderForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setStatus('draft')
  }

  const updateItem = (id: string, patch: Partial<OrderItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setErrors((current) => ({ ...current, [`item-${id}`]: undefined, items: undefined }))
    setStatus('draft')
  }

  const addMaterial = (catalogItem?: MaterialCatalogItem) => {
    const material = catalogItem ?? demoMaterials[0]
    const nextNumber = items.length ? Math.max(...items.map((item) => item.itemNumber)) + 10 : 10
    setStatus('draft')
    setItems((current) => [
      ...current,
      {
        id: `item-${Date.now()}`,
        itemNumber: nextNumber,
        materialNumber: material.id,
        description: material.description,
        quantity: 1,
        unit: material.defaultUnit,
        unitPrice: material.defaultPrice,
        selected: false,
      },
    ])
    notify('success', 'Material added', `${material.id} is ready for quantity and pricing review.`)
  }

  const removeItem = (id: string) => {
    const removed = items.find((item) => item.id === id)
    setStatus('draft')
    setItems((current) => current.filter((item) => item.id !== id))
    notify('info', 'Material removed', `${removed?.materialNumber ?? 'The line item'} was removed from this draft.`)
  }

  const selectCustomer = (field: CustomerField, customer: Customer) => {
    updateForm(field, customer.id)
    if (field === 'soldTo' && !form.shipTo) updateForm('shipTo', customer.id)
    setCustomerField(null)
    notify('info', `${field === 'soldTo' ? 'Sold-to' : 'Ship-to'} selected`, `${customer.id} · ${customer.name}`)
  }

  const draftPayload: SapOrderDraft = { form, items }

  const runSaveDraft = async () => {
    setBusyAction('save')
    try {
      const result = await sapAdapter.saveDraft(draftPayload)
      notify(result.ok ? 'success' : 'error', result.ok ? 'Draft saved' : 'Save failed', result.message)
    } catch {
      notify('error', 'Save failed', 'The SAP adapter did not respond. Your local draft is still open.')
    } finally {
      setBusyAction(null)
    }
  }

  const runValidate = async () => {
    const nextErrors = validateOrder(form, items)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setActiveTab('sales')
      notify('error', 'Review required fields', 'Complete the highlighted fields before validation.')
      return
    }
    setBusyAction('validate')
    try {
      const result = await sapAdapter.validate(draftPayload)
      if (result.ok) {
        setStatus('validated')
        notify('success', 'Demo validation passed', result.message)
      } else {
        notify('error', 'Validation failed', result.message)
      }
    } catch {
      notify('error', 'Validation unavailable', 'The SAP adapter did not respond. No validated status was recorded.')
    } finally {
      setBusyAction(null)
    }
  }

  const runCreateOrder = async () => {
    const nextErrors = validateOrder(form, items)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setDialog(null)
      setActiveTab('sales')
      notify('error', 'Cannot create order yet', 'Complete the highlighted fields before creating the order.')
      return
    }
    setDialog(null)
    setBusyAction('create')
    try {
      const result = await sapAdapter.createOrder(draftPayload)
      if (result.ok) {
        setStatus('created')
        notify('success', 'Demo order created', `${result.reference} · No SAP system was called.`)
      } else {
        notify('error', 'Create order failed', result.message)
      }
    } catch {
      notify('error', 'Create order unavailable', 'The SAP adapter did not respond. No order was created.')
    } finally {
      setBusyAction(null)
    }
  }

  const confirmCancel = () => {
    setDialog(null)
    setForm(initialForm)
    setItems(initialItems)
    setStatus('draft')
    setErrors({})
    setNotes('')
    try {
      window.localStorage.removeItem('scrapflow-demo-notes')
    } catch {
      // Storage is optional in demonstration mode.
    }
    notify('info', 'Draft reset', 'The local demonstration draft has been reset.')
  }

  const saveNotes = () => {
    try {
      window.localStorage.setItem('scrapflow-demo-notes', notes)
      setNotesSaved(true)
      window.setTimeout(() => setNotesSaved(false), 2500)
      notify('success', 'Notes saved', 'Notes are stored only in this browser for the prototype.')
    } catch {
      notify('error', 'Notes not saved', 'Browser storage is unavailable in this session.')
    }
  }

  const handleNav = (id: NavId) => {
    setActiveNav(id)
    setMobileNavOpen(false)
    if (id !== 'create') notify('info', 'Demonstration view', `${navItems.find((item) => item.id === id)?.label} is not connected in this prototype.`)
  }

  const copyOrder = () => {
    updateForm('purchaseOrderNumber', `COPY-${Math.floor(10000 + Math.random() * 89999)}`)
    setStatus('draft')
    notify('success', 'Order copied', 'A new local draft reference was generated from the current order.')
  }

  const checkPricing = () => notify('warning', 'Pricing service unavailable', 'Demo mode cannot call SAP pricing. The displayed amounts are quantity × unit price.')
  const viewBackend = (label: string) => notify('info', `${label} unavailable`, 'Connect the corresponding SAP master-data service to enable this action.')

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileNavOpen ? 'mobile-nav-open' : ''}`}>
      <div className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      <Sidebar activeNav={activeNav} collapsed={sidebarCollapsed} onNav={handleNav} onToggle={() => setSidebarCollapsed((current) => !current)} />
      <div className="app-column">
        <Topbar globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} onMenu={() => setMobileNavOpen(true)} onNotify={() => notify('info', 'No new alerts', 'The demo workspace is up to date.')} />
        <main className="main-content">
          <div className="demo-banner">
            <div className="demo-banner-icon"><Sparkles size={15} /></div>
            <div><strong>Demonstration mode</strong><span>Sample master data and mock SAP operations are active. No customer or sales-order records are sent to SAP.</span></div>
            <button className="text-button" onClick={() => notify('info', 'Integration boundary', 'Before go-live, confirm the SAP system, OData APIs, auth, pricing/tax, authorization and order-creation operations.')}>Integration notes <ArrowRight size={14} /></button>
          </div>

          <PageHeader status={status} busyAction={busyAction} onSave={runSaveDraft} onValidate={runValidate} onCreate={() => setDialog('create')} />

          <div className="workspace-grid">
            <section className="workspace-main">
              <CustomerOrderCard form={form} netValue={formatCurrency(totals.total, form.currency)} errors={errors} customerField={customerField} setCustomerField={setCustomerField} customerResults={customerResults} customerLoading={customerLoading} onChange={updateForm} onSelectCustomer={selectCustomer} />
              <SalesOrganizationCard />
              <section className="card work-card">
                <div className="tab-bar" role="tablist" aria-label="Sales order sections">
                  {tabs.map((tab) => (
                    <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id}>
                      <span className="tab-full-label">{tab.label}</span><span className="tab-short-label">{tab.shortLabel}</span>
                    </button>
                  ))}
                </div>
                <div className="tab-content">
                  {activeTab === 'sales' && <SalesTab form={form} currency={form.currency} errors={errors} onChange={updateForm} items={items} materialSearch={materialSearch} setMaterialSearch={setMaterialSearch} onAdd={addMaterial} onUpdateItem={updateItem} onRemove={removeItem} onSelectAll={(checked) => setItems((current) => current.map((item) => ({ ...item, selected: checked })))} />}
                  {activeTab === 'items' && <ItemOverviewTab items={items} totals={totals} currency={form.currency} />}
                  {activeTab === 'detail' && <ItemDetailTab item={selectedItem} currency={form.currency} onUpdate={selectedItem ? (patch) => updateItem(selectedItem.id, patch) : undefined} />}
                  {activeTab === 'ordering' && <OrderingPartyTab form={form} customerResults={demoCustomers} onViewCustomer={() => viewBackend('Customer details')} />}
                  {activeTab === 'procurement' && <ProcurementTab />}
                </div>
              </section>
              <NotesCard notes={notes} setNotes={setNotes} notesSaved={notesSaved} onSave={saveNotes} />
            </section>
            <aside className="summary-rail">
              <OrderSummary totals={totals} currency={form.currency} />
              <StatusTracker status={status} />
              <QuickActions onCustomer={() => viewBackend('Customer details')} onMaterial={() => viewBackend('Material master')} onPricing={checkPricing} onCopy={copyOrder} />
            </aside>
          </div>
        </main>
        <FooterActions busyAction={busyAction} onCancel={() => setDialog('cancel')} onSave={runSaveDraft} onValidate={runValidate} onCreate={() => setDialog('create')} />
      </div>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      {dialog === 'create' && <ConfirmDialog title="Create demonstration order?" description="This will run the mock create-order operation. It will not create a real SAP sales order or advance the workflow to Completed." confirmLabel="Create demo order" tone="primary" onCancel={() => setDialog(null)} onConfirm={runCreateOrder} />}
      {dialog === 'cancel' && <ConfirmDialog title="Reset this draft?" description="Unsaved local changes will be cleared from this prototype. This action does not affect SAP or any customer record." confirmLabel="Reset draft" tone="danger" onCancel={() => setDialog(null)} onConfirm={confirmCancel} />}
    </div>
  )
}

function Sidebar({ activeNav, collapsed, onNav, onToggle }: { activeNav: NavId; collapsed: boolean; onNav: (id: NavId) => void; onToggle: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><Recycle size={22} strokeWidth={2.5} /></div>
        {!collapsed && <div className="brand-copy"><strong>SCRAPFLOW</strong><span>SAP SALES</span></div>}
      </div>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} className={`nav-item ${activeNav === id ? 'active' : ''}`} onClick={() => onNav(id)} title={collapsed ? label : undefined}>
            <Icon size={18} strokeWidth={activeNav === id ? 2.4 : 1.9} />
            {!collapsed && <><span>{label}</span>{badge && <span className="nav-badge">{badge}</span>}</>}
          </button>
        ))}
      </nav>
      {!collapsed && <div className="sidebar-footnote"><div className="footnote-icon"><ShieldCheck size={16} /></div><div><strong>Secure by design</strong><span>API-ready boundaries keep business rules in SAP.</span></div></div>}
      <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronLeft size={17} className="rotate-180" /> : <ChevronLeft size={17} />}</button>
      <div className="sidebar-version">{collapsed ? 'v1' : 'Demo build · v1.0'}</div>
    </aside>
  )
}

function Topbar({ globalSearch, setGlobalSearch, onMenu, onNotify }: { globalSearch: string; setGlobalSearch: (value: string) => void; onMenu: () => void; onNotify: () => void }) {
  return (
    <header className="topbar">
      <div className="topbar-left"><button className="icon-button mobile-menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Sales</span><ArrowRight size={13} /><strong>Create Scrap Sales</strong></div></div>
      <div className="topbar-actions">
        <label className="global-search"><Search size={16} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search anything…" aria-label="Global search" />{globalSearch && <button onClick={() => setGlobalSearch('')} aria-label="Clear search"><X size={14} /></button>}<kbd>⌘ K</kbd></label>
        <div className="topbar-divider" />
        <button className="icon-button has-dot" onClick={onNotify} aria-label="Notifications"><Bell size={18} /></button>
        <button className="icon-button hide-small" onClick={() => undefined} aria-label="Help"><CircleHelp size={18} /></button>
        <button className="icon-button hide-small" onClick={() => undefined} aria-label="Settings"><Settings size={18} /></button>
        <div className="profile-chip"><div className="avatar">AM</div><div className="profile-copy hide-small"><strong>Ananya Mehta</strong><span>Order specialist</span></div><ChevronDown size={15} className="hide-small" /></div>
      </div>
    </header>
  )
}

function PageHeader({ status, busyAction, onSave, onValidate, onCreate }: { status: OrderStatus; busyAction: BusyAction; onSave: () => void; onValidate: () => void; onCreate: () => void }) {
  return (
    <section className="page-header">
      <div className="title-row"><div className="title-icon"><Recycle size={23} /></div><div><div className="eyebrow">Sales order workspace <span className="live-pill"><span className="live-dot" /> Live draft</span></div><h1>Create Scrap Sales</h1><p>Create and manage scrap material sales orders.</p></div></div>
      <div className="header-actions"><StatusBadge status={status} /><div className="header-action-group"><button className="button secondary" onClick={onSave} disabled={Boolean(busyAction)}><SaveIcon busy={busyAction === 'save'} /> Save draft</button><button className="button secondary" onClick={onValidate} disabled={Boolean(busyAction)}><ClipboardCheck size={16} /> Validate</button><button className="button primary" onClick={onCreate} disabled={Boolean(busyAction)}><Send size={16} /> Create order</button></div></div>
    </section>
  )
}

function CustomerOrderCard({ form, netValue, errors, customerField, setCustomerField, customerResults, customerLoading, onChange, onSelectCustomer }: { form: OrderForm; netValue: string; errors: ValidationErrors; customerField: CustomerField | null; setCustomerField: (field: CustomerField | null) => void; customerResults: Customer[]; customerLoading: boolean; onChange: <K extends keyof OrderForm>(key: K, value: OrderForm[K]) => void; onSelectCustomer: (field: CustomerField, customer: Customer) => void }) {
  return (
    <section className="card info-card">
      <CardHeader icon={<Users size={17} />} iconTone="purple" title="Customer & order information" subtitle="Commercial context for this sales document" action={<span className="required-note"><span>*</span> Required field</span>} />
      <div className="field-grid customer-grid">
        <CustomerFieldInput label="Sold-To Party" value={form.soldTo} field="soldTo" error={errors.soldTo} active={customerField === 'soldTo'} results={customerResults} loading={customerLoading} onFocus={() => setCustomerField('soldTo')} onChange={(value) => onChange('soldTo', value)} onSelect={onSelectCustomer} />
        <CustomerFieldInput label="Ship-To Party" value={form.shipTo} field="shipTo" error={errors.shipTo} active={customerField === 'shipTo'} results={customerResults} loading={customerLoading} onFocus={() => setCustomerField('shipTo')} onChange={(value) => onChange('shipTo', value)} onSelect={onSelectCustomer} />
        <Field label="Purchase Order Number" required error={errors.purchaseOrderNumber}><div className="input-with-icon"><FileText size={16} /><input value={form.purchaseOrderNumber} onChange={(event) => onChange('purchaseOrderNumber', event.target.value)} placeholder="e.g. PO-24780" /></div></Field>
        <Field label="Purchase Order Date" required error={errors.purchaseOrderDate}><div className="input-with-icon"><CalendarDays size={16} /><input type="date" value={form.purchaseOrderDate} onChange={(event) => onChange('purchaseOrderDate', event.target.value)} /></div></Field>
        <Field label="Document Date" required error={errors.documentDate}><div className="input-with-icon"><CalendarDays size={16} /><input type="date" value={form.documentDate} onChange={(event) => onChange('documentDate', event.target.value)} /></div></Field>
        <Field label="Net Value" helper="Calculated from current items"><div className="read-only-value"><strong>{netValue}</strong></div></Field>
        <Field label="Currency" helper="Document currency"><div className="select-wrap"><select value={form.currency} onChange={(event) => onChange('currency', event.target.value)}><option value="INR">INR · Indian Rupee</option><option value="USD">USD · US Dollar</option><option value="EUR">EUR · Euro</option></select><ChevronDown size={15} /></div></Field>
      </div>
    </section>
  )
}

function CustomerFieldInput({ label, value, field, error, active, results, loading, onFocus, onChange, onSelect }: { label: string; value: string; field: CustomerField; error?: string; active: boolean; results: Customer[]; loading: boolean; onFocus: () => void; onChange: (value: string) => void; onSelect: (field: CustomerField, customer: Customer) => void }) {
  return (
    <Field label={label} required error={error}>
      <div className="customer-input-wrap"><div className="input-with-icon"><Users size={16} /><input value={value} onFocus={onFocus} onChange={(event) => onChange(event.target.value)} placeholder="Search customer ID or name" aria-label={label} /><Search size={15} className="input-end-icon" /></div>{active && <div className="suggestions" onMouseLeave={() => undefined}>{loading ? <div className="suggestion-loading"><LoaderCircle size={15} className="spin" /> Searching customer master…</div> : results.length ? results.map((customer) => <button type="button" className="suggestion" key={customer.id} onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(field, customer)}><span className="suggestion-avatar">{customer.name.slice(0, 1)}</span><span><strong>{customer.id} · {customer.name}</strong><small>{customer.location} · {customer.segment}</small></span><ArrowRight size={14} /></button>) : <div className="suggestion-empty">No demo customers match this search.</div>}</div>}</div>
    </Field>
  )
}

function SalesOrganizationCard() {
  return (
    <section className="card org-card">
      <CardHeader icon={<Layers3 size={17} />} iconTone="cyan" title="Sales organization" subtitle="Defaulted from your assigned business role" action={<span className="permission-chip"><ShieldCheck size={13} /> Permission-controlled</span>} />
      <div className="org-grid">{orgData.map((item) => <div className="org-field" key={item.label}><span>{item.label}</span><strong>{item.code}</strong><small>{item.description}</small></div>)}</div>
    </section>
  )
}

function SalesTab({ form, currency, errors, onChange, items, materialSearch, setMaterialSearch, onAdd, onUpdateItem, onRemove, onSelectAll }: { form: OrderForm; currency: string; errors: ValidationErrors; onChange: <K extends keyof OrderForm>(key: K, value: OrderForm[K]) => void; items: OrderItem[]; materialSearch: string; setMaterialSearch: (value: string) => void; onAdd: (item?: MaterialCatalogItem) => void; onUpdateItem: (id: string, patch: Partial<OrderItem>) => void; onRemove: (id: string) => void; onSelectAll: (checked: boolean) => void }) {
  return <>
    <section className="subsection header-data-section"><CardHeader icon={<SlidersHorizontal size={17} />} iconTone="green" title="General header data" subtitle="Pricing and delivery controls passed to SAP at order creation" /><div className="compact-field-grid"><Field label="Incoterms"><div className="select-wrap"><select value={form.incoterms} onChange={(event) => onChange('incoterms', event.target.value)}><option>EXW</option><option>FCA</option><option>CIF</option><option>DDP</option></select><ChevronDown size={15} /></div></Field><Field label="Sales Area"><input value={form.salesArea} onChange={(event) => onChange('salesArea', event.target.value)} /></Field><Field label="Pricing Procedure" helper="Illustrative SAP code"><div className="input-with-icon"><Gauge size={16} /><input value={form.pricingProcedure} onChange={(event) => onChange('pricingProcedure', event.target.value)} /></div></Field></div></section>
    <MaterialsTable items={items} currency={currency} materialSearch={materialSearch} setMaterialSearch={setMaterialSearch} onAdd={onAdd} onUpdateItem={onUpdateItem} onRemove={onRemove} onSelectAll={onSelectAll} error={errors.items} />
  </>
}

function MaterialsTable({ items, currency, materialSearch, setMaterialSearch, onAdd, onUpdateItem, onRemove, onSelectAll, error }: { items: OrderItem[]; currency: string; materialSearch: string; setMaterialSearch: (value: string) => void; onAdd: (item?: MaterialCatalogItem) => void; onUpdateItem: (id: string, patch: Partial<OrderItem>) => void; onRemove: (id: string) => void; onSelectAll: (checked: boolean) => void; error?: string }) {
  const filteredMaterials = demoMaterials.filter((material) => `${material.id} ${material.description}`.toLowerCase().includes(materialSearch.toLowerCase()))
  const allSelected = items.length > 0 && items.every((item) => item.selected)
  return (
    <section className="materials-section">
      <div className="section-heading-row"><div><div className="section-kicker"><span className="kicker-dot green" /> Line items</div><h2>Scrap materials <span className="count-pill">{items.length} items</span></h2><p>Demonstration values · Amounts recalculate as quantity and price change.</p></div><div className="material-actions"><div className="material-search"><Search size={15} /><input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Search material master" aria-label="Search material master" /></div><div className="add-material-wrap"><button className="button primary small" onClick={() => onAdd()}><Plus size={15} /> Add material</button>{materialSearch && filteredMaterials.length > 0 && <div className="material-picker">{filteredMaterials.map((material) => <button key={material.id} onClick={() => { onAdd(material); setMaterialSearch('') }}><span className={`material-swatch ${material.color}`} /> <span><strong>{material.id}</strong><small>{material.description}</small></span><Plus size={14} /></button>)}</div>}</div></div></div>
      {error && <div className="inline-error"><AlertCircle size={15} />{error}</div>}
      <div className="table-shell"><table className="materials-table"><thead><tr><th className="check-cell"><input type="checkbox" checked={allSelected} onChange={(event) => onSelectAll(event.target.checked)} aria-label="Select all materials" /></th><th>Item</th><th>Material number</th><th>Description</th><th>Order quantity</th><th>Unit</th><th>Unit price</th><th className="amount-heading">Amount</th><th aria-label="Actions" /></tr></thead><tbody>{items.length ? items.map((item) => <MaterialRow key={item.id} item={item} currency={currency} onUpdate={onUpdateItem} onRemove={onRemove} />) : <tr><td colSpan={9}><div className="empty-state"><Package size={22} /><strong>No scrap materials yet</strong><span>Add a material to start the order.</span></div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span><Info size={14} /> Price source: <strong>Demo catalog</strong></span><span>Before tax · <strong>{formatCurrency(items.reduce((sum, item) => sum + lineAmount(item), 0), currency)}</strong></span></div>
    </section>
  )
}

function MaterialRow({ item, currency, onUpdate, onRemove }: { item: OrderItem; currency: string; onUpdate: (id: string, patch: Partial<OrderItem>) => void; onRemove: (id: string) => void }) {
  return <tr className={item.selected ? 'row-selected' : ''}><td className="check-cell" data-label="Select"><input type="checkbox" checked={item.selected} onChange={(event) => onUpdate(item.id, { selected: event.target.checked })} aria-label={`Select item ${item.itemNumber}`} /></td><td data-label="Item"><span className="item-number">{String(item.itemNumber).padStart(2, '0')}</span></td><td data-label="Material number"><div className="material-id"><span className="material-swatch blue" />{item.materialNumber}</div></td><td data-label="Description"><input className="table-input description-input" value={item.description} onChange={(event) => onUpdate(item.id, { description: event.target.value })} /></td><td data-label="Order quantity"><input className="table-input quantity-input" type="number" min="0" value={item.quantity} onChange={(event) => onUpdate(item.id, { quantity: Number(event.target.value) })} /></td><td data-label="Unit"><select className="table-select" value={item.unit} onChange={(event) => onUpdate(item.id, { unit: event.target.value })}><option>KG</option><option>MT</option><option>LB</option><option>PC</option></select></td><td data-label="Unit price"><div className="price-input"><span>{currency === 'INR' ? '₹' : currency}</span><input className="table-input" type="number" min="0" value={item.unitPrice} onChange={(event) => onUpdate(item.id, { unitPrice: Number(event.target.value) })} /></div></td><td data-label="Amount" className="amount-cell">{formatCurrency(lineAmount(item), currency)}</td><td className="action-cell"><button className="icon-button danger-hover" onClick={() => onRemove(item.id)} aria-label={`Remove item ${item.itemNumber}`}><Trash2 size={16} /></button></td></tr>
}

function ItemOverviewTab({ items, totals, currency }: { items: OrderItem[]; totals: ReturnType<typeof calculateTotals>; currency: string }) {
  return <div className="tab-panel-stack"><div className="overview-stat-grid"><MetricCard label="Total items" value={String(totals.itemCount).padStart(2, '0')} note="Material positions" tone="blue" icon={<Package size={17} />} /><MetricCard label="Total quantity" value={items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-IN')} note="Across all units" tone="green" icon={<Layers3 size={17} />} /><MetricCard label="Before tax" value={formatCurrency(totals.subtotal, currency)} note="Illustrative total" tone="purple" icon={<BarChart3 size={17} />} /></div><div className="tab-copy-card"><div className="section-kicker"><span className="kicker-dot blue" /> Item overview</div><h2>Position-level review</h2><p>All editable line items are maintained on the Sales tab. Select a row there to update the material, quantity, unit or unit price. The summary rail always reflects the current draft.</p><div className="overview-list">{items.map((item) => <div className="overview-row" key={item.id}><span className="item-number">{String(item.itemNumber).padStart(2, '0')}</span><div><strong>{item.materialNumber} · {item.description}</strong><small>{item.quantity.toLocaleString('en-IN')} {item.unit} at {formatCurrency(item.unitPrice, currency)} / {item.unit}</small></div><strong>{formatCurrency(lineAmount(item), currency)}</strong></div>)}</div></div></div>
}

function ItemDetailTab({ item, currency, onUpdate }: { item?: OrderItem; currency: string; onUpdate?: (patch: Partial<OrderItem>) => void }) {
  if (!item) return <EmptyTab title="No item selected" description="Select a material line from the Sales tab to inspect its details." icon={<Package size={22} />} />
  return <div className="tab-panel-stack"><div className="detail-intro"><div className="material-detail-icon"><Package size={22} /></div><div><div className="section-kicker"><span className="kicker-dot cyan" /> Selected position · {String(item.itemNumber).padStart(2, '0')}</div><h2>{item.materialNumber}</h2><p>{item.description} · Demo material master record</p></div><button className="button tertiary"><Pencil size={14} /> Edit on Sales tab</button></div><div className="detail-field-grid"><Field label="Material number"><input value={item.materialNumber} readOnly /></Field><Field label="Description"><input value={item.description} onChange={(event) => onUpdate?.({ description: event.target.value })} /></Field><Field label="Order quantity"><input type="number" min="0" value={item.quantity} onChange={(event) => onUpdate?.({ quantity: Number(event.target.value) })} /></Field><Field label="Unit"><div className="select-wrap"><select value={item.unit} onChange={(event) => onUpdate?.({ unit: event.target.value })}><option>KG</option><option>MT</option><option>LB</option><option>PC</option></select><ChevronDown size={15} /></div></Field><Field label="Unit price"><div className="input-with-icon"><span className="currency-prefix">{currency === 'INR' ? '₹' : currency}</span><input type="number" min="0" value={item.unitPrice} onChange={(event) => onUpdate?.({ unitPrice: Number(event.target.value) })} /></div></Field><Field label="Calculated amount" helper="Quantity × unit price"><div className="detail-amount">{formatCurrency(lineAmount(item), currency)}</div></Field></div><div className="demo-callout"><Info size={16} /><span>Real material descriptions, pricing conditions, batch rules and availability checks must be retrieved from the SAP material master and pricing services.</span></div></div>
}

function OrderingPartyTab({ form, customerResults, onViewCustomer }: { form: OrderForm; customerResults: Customer[]; onViewCustomer: () => void }) {
  const soldTo = customerResults.find((customer) => customer.id === form.soldTo)
  const shipTo = customerResults.find((customer) => customer.id === form.shipTo)
  return <div className="tab-panel-stack"><div className="partner-grid"><PartnerCard label="Ordering party / Sold-to" code={form.soldTo} customer={soldTo} icon={<Users size={18} />} onView={onViewCustomer} /><PartnerCard label="Delivery party / Ship-to" code={form.shipTo} customer={shipTo} icon={<Truck size={18} />} onView={onViewCustomer} /></div><div className="demo-callout"><Info size={16} /><span>Partner determination and address data are intentionally read from the local demo catalog. Production behavior should follow SAP partner functions and authorization.</span></div></div>
}

function PartnerCard({ label, code, customer, icon, onView }: { label: string; code: string; customer?: Customer; icon: ReactNode; onView: () => void }) {
  return <div className="partner-card"><div className="partner-icon">{icon}</div><div><span>{label}</span><strong>{code || 'Not selected'}</strong><small>{customer?.name ?? 'Select a customer on the Sales tab'}</small><small>{customer?.location ?? 'Customer address pending'}</small></div><button className="icon-button" onClick={onView} aria-label={`View ${label}`}><ArrowRight size={16} /></button></div>
}

function ProcurementTab() {
  return <div className="tab-panel-stack"><div className="procurement-hero"><div className="procurement-icon"><RefreshCw size={21} /></div><div><div className="section-kicker"><span className="kicker-dot orange" /> Upstream controls</div><h2>Procurement context</h2><p>Review source and availability signals before sending the sales order to SAP.</p></div><span className="status-chip warning"><Clock3 size={13} /> Service not connected</span></div><div className="procurement-grid"><div className="procurement-item"><span>Source plant</span><strong>1000 · Pune</strong><small>Demo default</small></div><div className="procurement-item"><span>Stock / availability</span><strong>Not evaluated</strong><small>Requires SAP ATP/stock service</small></div><div className="procurement-item"><span>Batch / lot rules</span><strong>Not evaluated</strong><small>Requires material master</small></div><div className="procurement-item"><span>Authorization</span><strong>Not evaluated</strong><small>Requires authenticated session</small></div></div><div className="demo-callout"><ShieldCheck size={16} /><span>Do not bypass SAP validations or duplicate business logic here. The frontend is prepared to hand this context to an authenticated SAP business service.</span></div></div>
}

function NotesCard({ notes, setNotes, notesSaved, onSave }: { notes: string; setNotes: (value: string) => void; notesSaved: boolean; onSave: () => void }) {
  return <section className="card notes-card"><CardHeader icon={<FileText size={17} />} iconTone="orange" title="Internal notes" subtitle="Visible only in this local demonstration session" action={notesSaved ? <span className="saved-label"><CheckCircle2 size={14} /> Saved</span> : undefined} /><textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Add handling notes, pickup details or internal context…" rows={3} /><div className="notes-footer"><span>{notes.length}/500 characters</span><button className="button secondary small" onClick={onSave}><Check size={14} /> Save notes</button></div></section>
}

function OrderSummary({ totals, currency }: { totals: ReturnType<typeof calculateTotals>; currency: string }) {
  return <section className="card summary-card"><div className="summary-header"><div><div className="section-kicker"><span className="kicker-dot purple" /> Financial view</div><h2>Order summary</h2></div><span className="summary-live"><span className="live-dot" /> Auto</span></div><div className="summary-lines"><SummaryLine label="Subtotal" value={formatCurrency(totals.subtotal, currency)} /><SummaryLine label="Discount" value={totals.discount ? `−${formatCurrency(totals.discount, currency)}` : formatCurrency(0, currency)} muted /><SummaryLine label="Tax" value={formatCurrency(totals.tax, currency)} muted note="Illustrative 18%" /></div><div className="summary-total"><span>Total net value</span><strong>{formatCurrency(totals.total, currency)}</strong><small>Demo total · SAP pricing will replace this at integration</small></div><div className="summary-meta"><span><Package size={14} /> {totals.itemCount} material items</span><span><Info size={14} /> {currency} display</span></div></section>
}

function SummaryLine({ label, value, muted, note }: { label: string; value: string; muted?: boolean; note?: string }) {
  return <div className={`summary-line ${muted ? 'muted' : ''}`}><span>{label}{note && <small>{note}</small>}</span><strong>{value}</strong></div>
}

function StatusTracker({ status }: { status: OrderStatus }) {
  const currentIndex = statusOrder.indexOf(status)
  return <section className="card status-card"><div className="summary-header"><div><div className="section-kicker"><span className="kicker-dot green" /> Workflow</div><h2>Order status</h2></div><MoreHorizontal size={17} className="muted-icon" /></div><div className="status-list">{statusSteps.map((step, index) => { const complete = index <= currentIndex; const current = step.id === status; return <div className={`status-step ${complete ? 'complete' : ''} ${current ? 'current' : ''}`} key={step.id}><div className="status-node">{complete && !current ? <Check size={13} /> : current ? <span className="status-node-dot" /> : <span>{index + 1}</span>}</div><div><strong>{step.label}</strong><small>{step.note}</small></div>{index < statusSteps.length - 1 && <div className={`status-connector ${index < currentIndex ? 'complete' : ''}`} />}</div> })}</div><div className="status-footnote"><Info size={14} /> Completed is reserved for a real SAP confirmation.</div></section>
}

function QuickActions({ onCustomer, onMaterial, onPricing, onCopy }: { onCustomer: () => void; onMaterial: () => void; onPricing: () => void; onCopy: () => void }) {
  const actions = [{ label: 'View customer details', icon: Users, onClick: onCustomer, tone: 'purple' }, { label: 'View material master', icon: Package, onClick: onMaterial, tone: 'cyan' }, { label: 'Check pricing', icon: BarChart3, onClick: onPricing, tone: 'orange' }, { label: 'Copy order', icon: Copy, onClick: onCopy, tone: 'green' }]
  return <section className="card quick-card"><div className="summary-header"><div><div className="section-kicker"><span className="kicker-dot cyan" /> Shortcuts</div><h2>Quick actions</h2></div><Sparkles size={17} className="muted-icon" /></div><div className="quick-list">{actions.map(({ label, icon: Icon, onClick, tone }) => <button className="quick-action" key={label} onClick={onClick}><span className={`quick-icon ${tone}`}><Icon size={16} /></span><span>{label}</span><ArrowRight size={14} /></button>)}</div></section>
}

function FooterActions({ busyAction, onCancel, onSave, onValidate, onCreate }: { busyAction: BusyAction; onCancel: () => void; onSave: () => void; onValidate: () => void; onCreate: () => void }) {
  return <footer className="footer-actions"><button className="button tertiary" onClick={onCancel} disabled={Boolean(busyAction)}><X size={16} /> Cancel</button><div className="footer-primary-actions"><button className="button secondary" onClick={onSave} disabled={Boolean(busyAction)}><SaveIcon busy={busyAction === 'save'} /> Save draft</button><button className="button secondary" onClick={onValidate} disabled={Boolean(busyAction)}><ClipboardCheck size={16} /> Validate</button><button className="button primary" onClick={onCreate} disabled={Boolean(busyAction)}><Send size={16} /> Create order <ArrowRight size={15} /></button></div></footer>
}

function CardHeader({ icon, iconTone, title, subtitle, action }: { icon: ReactNode; iconTone: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="card-header"><div className={`card-header-icon ${iconTone}`}>{icon}</div><div><h2>{title}</h2><p>{subtitle}</p></div>{action && <div className="card-header-action">{action}</div>}</div>
}

function Field({ label, required, helper, error, children }: { label: string; required?: boolean; helper?: string; error?: string; children: ReactNode }) {
  return <label className={`field ${error ? 'has-error' : ''}`}><span className="field-label">{label}{required && <em>*</em>}</span>{children}{error ? <span className="field-error"><AlertCircle size={13} /> {error}</span> : helper ? <span className="field-helper">{helper}</span> : null}</label>
}

function MetricCard({ label, value, note, tone, icon }: { label: string; value: string; note: string; tone: string; icon: ReactNode }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

function EmptyTab({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return <div className="empty-tab"><div className="empty-tab-icon">{icon}</div><h2>{title}</h2><p>{description}</p></div>
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const labels: Record<OrderStatus, string> = { draft: 'Draft', validated: 'Validated', created: 'Created', completed: 'Completed' }
  return <span className={`status-badge ${status}`}><span className="status-badge-dot" /> {labels[status]}</span>
}

function SaveIcon({ busy }: { busy: boolean }) { return busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} /> }

function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
  return <div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div className={`toast ${toast.tone}`} key={toast.id}><div className="toast-icon">{toast.tone === 'success' ? <CheckCircle2 size={16} /> : toast.tone === 'error' ? <AlertCircle size={16} /> : toast.tone === 'warning' ? <Clock3 size={16} /> : <Info size={16} />}</div><div><strong>{toast.title}</strong><span>{toast.message}</span></div><button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"><X size={15} /></button></div>)}</div>
}

function ConfirmDialog({ title, description, confirmLabel, tone, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; tone: 'primary' | 'danger'; onCancel: () => void; onConfirm: () => void }) {
  return <div className="dialog-backdrop" role="presentation"><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className={`dialog-icon ${tone}`}><AlertCircle size={21} /></div><h2 id="dialog-title">{title}</h2><p>{description}</p><div className="dialog-actions"><button className="button tertiary" onClick={onCancel}>Go back</button><button className={`button ${tone === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button></div></div></div>
}

export default App
