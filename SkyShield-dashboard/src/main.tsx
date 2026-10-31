import React, { useEffect, useMemo, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { createRoot } from 'react-dom/client'
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, BookOpenCheck,
  Check, ChevronDown, ClipboardCheck, Clock3, FilePlus2, Filter, Gauge, LogIn,
  LogOut, Mail, LayoutDashboard, Plane, Radar, Search, ShieldCheck, Sparkles, Target,
  TrendingUp, UploadCloud, X, Zap
} from 'lucide-react'
import { getCurrentUser, signOut, type AuthUser } from './auth'
import {
  fetchAircraft,
  fetchIncidents,
  createIncident,
  fetchCompliance,
  fetchStats,
  type Aircraft,
  type Incident,
  type Severity,
  type ComplianceItem,
  type DashboardStats,
} from './api'
import AuthModal from './AuthModal'
import './styles.css'

type View = 'overview' | 'incidents' | 'analysis' | 'compliance'

const defaultAircraft: Aircraft[] = [
  { code: 'A320', name: 'Airbus A320-200', type: 'Narrow-body', fleet: '24 active', reports: 7, trend: '−18%', trendTone: 'good', status: 'Nominal', color: '#7dd3fc' },
  { code: 'B737', name: 'Boeing 737-800', type: 'Narrow-body', fleet: '18 active', reports: 11, trend: '+6%', trendTone: 'warn', status: 'Monitor', color: '#a5b4fc' },
  { code: 'E190', name: 'Embraer E190-E2', type: 'Regional jet', fleet: '12 active', reports: 3, trend: '−33%', trendTone: 'good', status: 'Nominal', color: '#5eead4' },
  { code: 'B787', name: 'Boeing 787-9', type: 'Long-haul', fleet: '8 active', reports: 2, trend: '−12%', trendTone: 'good', status: 'Nominal', color: '#f2b84b' },
]

const seedIncidents: Incident[] = [
  { id: 'INC-4821', aircraft: 'B737-800', title: 'Hydraulic pressure deviation', location: 'Flight 6E-284 · Jaipur FIR', time: '18 min ago', severity: 'High', status: 'Investigating', progress: 68, category: 'Systems' },
  { id: 'INC-4818', aircraft: 'A320-200', title: 'Unstable approach — go-around', location: 'Flight 6E-912 · Delhi RWY 29', time: 'Yesterday, 16:42', severity: 'Medium', status: 'Review complete', progress: 100, category: 'Flight ops' },
  { id: 'INC-4815', aircraft: 'E190-E2', title: 'Cabin odor report', location: 'Flight 6E-506 · Mumbai gate 4', time: 'Sep 28, 09:13', severity: 'Low', status: 'Closed', progress: 100, category: 'Cabin safety' },
  { id: 'INC-4809', aircraft: 'B787-9', title: 'Bird strike — radome contact', location: 'Flight 6E-044 · Singapore arrival', time: 'Sep 26, 22:08', severity: 'Critical', status: 'Corrective action', progress: 42, category: 'External' },
]

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><div className="brand-mark"><ShieldCheck size={compact ? 17 : 20} strokeWidth={2.5} /></div>{!compact && <div><span className="brand-name">SKY<span>SHIELD</span></span><small>AVIATION SAFETY INTELLIGENCE</small></div>}</div>
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`severity severity-${severity.toLowerCase()}`}><i />{severity}</span>
}

function Blueprint({ aircraft: plane }: { aircraft: Aircraft }) {
  const [tilt, setTilt] = useState({ x: -8, y: 18 })
  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    setTilt({ x: -y * 18, y: x * 28 })
  }
  return <div className="blueprint-art" style={{ '--plane': plane.color } as React.CSSProperties} onPointerMove={handleMove} onPointerLeave={() => setTilt({ x: -8, y: 18 })}>
    <div className="blueprint-grid" />
    <div className="model-stage" role="img" aria-label={`${plane.name} interactive 3D aircraft model`}>
      <div className={`model-3d model-${plane.code.toLowerCase()}`} style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
        <div className="model-fuselage"><span className="model-cockpit" /><span className="model-windows" /></div>
        <div className="model-wing model-wing-main" /><div className="model-wing model-wing-rear" />
        <div className="model-tail" /><div className="model-engine engine-left" /><div className="model-engine engine-right" />
      </div>
      <div className="model-shadow" />
    </div>
    <span className="model-hint">MOVE TO INSPECT <span>↗</span></span>
    <span className="blueprint-caption">SCHEMATIC / {plane.code}</span>
  </div>
}

function Landing({ onEnter, onLogin, onLogout, user }: { onEnter: () => void; onLogin: () => void; onLogout: () => void; user: AuthUser | null }) {
  return <main className="landing" onClick={user ? onEnter : onLogin}>
    <video className="hero-video" autoPlay muted loop playsInline poster="/skyshield-mark.svg"><source src="/earth-rotation.mp4" type="video/mp4" /></video>
    <div className="hero-scrim" />
    <div className="hero-grid" />
    <header className="landing-top"><Logo /><div className="landing-status"><span className="status-dot" /> SYSTEM OPERATIONAL <span className="separator">/</span> UTC 04:12:38</div><button className="landing-login" onClick={event => { event.stopPropagation(); user ? onLogout() : onLogin() }}>{user ? <><LogOut size={14} /> Sign out</> : <><LogIn size={14} /> Login / sign up</>}</button></header>
    <div className="landing-main">
      <div className="hero-copy">
        <div className="eyebrow"><Radar size={14} /> SAFETY INTELLIGENCE PLATFORM <span className="eyebrow-line" /></div>
        <h1>See the signal.<br /><em>Close the loop.</em></h1>
        <p>One clear view of every safety event, root cause, and action across your operation.</p>
        <button className="primary-cta" onClick={user ? onEnter : onLogin}><span>{user ? "Enter workspace" : "Login to workspace"}</span><ArrowRight size={17} /></button>
        <div className="hero-trust"><ShieldCheck size={14} /> Built for safer decisions, every flight</div>
        <div className="auth-features" onClick={event => event.stopPropagation()}>
          <div className="auth-features-heading"><span className="section-kicker">ACCOUNT ACCESS</span><span className="auth-secure"><ShieldCheck size={12} /> SECURE</span></div>
          <div className="auth-feature-list"><div><span className="google-mark">G</span><span><strong>Google or email sign-in</strong><small>Use an existing account or create one</small></span></div><div><Mail size={15} /><span><strong>Workspace continuity</strong><small>Return to your safety operations securely</small></span></div></div>
          <button className="landing-auth-cta" onClick={user ? onEnter : onLogin}>{user ? <>Continue as {user.name} <ArrowRight size={14} /></> : <>Login or sign up <ArrowRight size={14} /></>}</button>
        </div>
      </div>
      <div className="hero-readout"><div className="readout-head"><span>GLOBAL SAFETY PULSE</span><span className="live-pill"><i /> LIVE</span></div><div className="readout-value">98.7<span>%</span></div><div className="readout-label">OPERATIONS WITHIN CONTROL LIMITS</div><div className="pulse-bars">{[38, 51, 45, 62, 58, 73, 68, 81, 74, 88, 84, 96].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div><div className="readout-footer"><span>LAST 30 DAYS</span><strong>+4.2% <TrendingUp size={12} /></strong></div></div>
    </div>
    <footer className="landing-footer"><span>INCIDENTS / ANALYSIS / COMPLIANCE</span><span>SCROLL TO EXPLORE <ChevronDown size={14} /></span><span>© 2026 SKYSHIELD SYSTEMS</span></footer>
  </main>
}

function Sidebar({ view, setView, onNew, user, onLogout }: { view: View; setView: (v: View) => void; onNew: () => void; user: AuthUser | null; onLogout: () => void }) {
  const links: { id: View; label: string; icon: React.ReactNode; count?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> }, { id: 'incidents', label: 'Incidents', icon: <AlertTriangle size={17} />, count: '12' }, { id: 'analysis', label: 'Root-cause analysis', icon: <Target size={17} /> }, { id: 'compliance', label: 'Compliance', icon: <ClipboardCheck size={17} /> }
  ]
  return <aside className="sidebar"><Logo /><div className="sidebar-rule" /><div className="workspace-switch"><div className="workspace-avatar">AO</div><div><small>WORKSPACE</small><strong>AirOps India</strong></div><ChevronDown size={14} /></div><nav>{links.map(link => <button key={link.id} className={view === link.id ? 'active' : ''} onClick={() => setView(link.id)}>{link.icon}<span>{link.label}</span>{link.count && <b>{link.count}</b>}</button>)}</nav><div className="sidebar-bottom"><div className="coverage-card"><div className="coverage-top"><span>SAFETY COVERAGE</span><span>92%</span></div><div className="coverage-bar"><i /></div><p>Across 62 active aircraft</p></div><button className="new-incident" onClick={onNew}><FilePlus2 size={17} /> Log incident <span>⌘ N</span></button><button className="user-row" type="button" onClick={onLogout} title="Sign out"><div className="user-avatar">{user?.name.slice(0, 2).toUpperCase() ?? 'RP'}</div><div><strong>{user?.name ?? 'Guest operator'}</strong><small>{user?.email ?? 'Sign in to your workspace'}</small></div><LogOut size={16} /></button></div></aside>
}

function Topbar({ title, kicker, onNew }: { title: string; kicker: string; onNew: () => void }) {
  return <header className="topbar"><div><div className="top-kicker">{kicker}</div><h2>{title}</h2></div><div className="top-actions"><label className="search"><Search size={16} /><input placeholder="Search anything" /><kbd>⌘ K</kbd></label><button className="icon-button"><Bell size={17} /><i /></button><button className="top-new" onClick={onNew}><FilePlus2 size={15} /> New incident</button></div></header>
}

function Overview({ records, aircraftList, selectAircraft, onIncident, setView, stats }: { records: Incident[]; aircraftList: Aircraft[]; selectAircraft: (a: Aircraft) => void; onIncident: (id: string) => void; setView: (v: View) => void; stats?: DashboardStats | null }) {
  const safetyIndex = stats?.safety_index ?? 98.7
  const openCount = stats?.open_incidents ?? records.filter(item => item.status !== 'Closed').length
  const reportingRate = stats?.reporting_rate ?? 76
  return <><div className="kpi-grid"><div className="kpi-card accent"><div className="kpi-label">SAFETY INDEX <span className="trend good"><TrendingUp size={12} /> 4.2%</span></div><div className="kpi-number">{safetyIndex}<span>/100</span></div><div className="kpi-note"><span className="signal-line"><i /><i /><i /><i /><i /><i /><i /></span> Healthy operating range</div></div><div className="kpi-card"><div className="kpi-label">OPEN INCIDENTS <span className="trend warn">+2 this week</span></div><div className="kpi-number">{openCount}</div><div className="kpi-note"><span className="mini-bars">{[40, 55, 35, 66, 48, 74, 60].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</span> {records.filter(item => item.status === 'Awaiting review').length} awaiting review</div></div><div className="kpi-card"><div className="kpi-label">CORRECTIVE ACTIONS <span className="trend good">−8.6%</span></div><div className="kpi-number">24</div><div className="kpi-note"><span className="action-ring"><i /></span> 83% on track</div></div><div className="kpi-card"><div className="kpi-label">REPORTING RATE <span className="trend good">+11.4%</span></div><div className="kpi-number">{reportingRate}<span>%</span></div><div className="kpi-note"><div className="progress-line"><i style={{ width: `${reportingRate}%` }} /></div> Target 80% by Q4</div></div></div><div className="section-heading"><div><span className="section-kicker">FLEET HEALTH</span><h3>Aircraft overview</h3></div><button className="text-button" onClick={() => setView('incidents')}>View all incidents <ArrowRight size={14} /></button></div><div className="aircraft-grid">{aircraftList.map(plane => <button className="aircraft-card" key={plane.code} onClick={() => selectAircraft(plane)}><div className="aircraft-card-top"><span className="aircraft-code">{plane.code}</span><span className={`aircraft-status ${plane.status === 'Monitor' ? 'monitor' : ''}`}><i /> {plane.status}</span></div><Blueprint aircraft={plane} /><div className="aircraft-details"><div><strong>{plane.name}</strong><small>{plane.type} <span>·</span> {plane.fleet}</small></div><div className="aircraft-reports"><strong>{plane.reports}</strong><small>reports <span className={plane.trendTone}>{plane.trend}</span></small></div></div></button>)}</div><div className="insight-grid"><IncidentTable records={records} onSelect={onIncident} /><SafetyPulse /></div></>
}

function IncidentTable({ records, onSelect }: { records: Incident[]; onSelect: (id: string) => void }) {
  return <section className="panel incident-panel"><div className="panel-heading"><div><span className="section-kicker">LIVE QUEUE</span><h3>Recent incidents</h3></div><button className="icon-button small" type="button"><Filter size={14} /></button></div><div className="incident-list">{records.slice(0, 3).map(item => <button className="incident-row" key={item.id} onClick={() => onSelect(item.id)}><div className="incident-severity"><span className={`severity-dot ${item.severity.toLowerCase()}`} /></div><div className="incident-main"><div><strong>{item.title}</strong><span className="incident-id">{item.id}</span></div><p>{item.aircraft} <span>·</span> {item.location}</p></div><div className="incident-meta"><SeverityBadge severity={item.severity} /><small>{item.time}</small></div><ArrowRight size={15} className="row-arrow" /></button>)}</div><button className="panel-footer" onClick={() => onSelect(records[0]?.id ?? '')}>Open incident queue <ArrowRight size={14} /></button></section>
}

function SafetyPulse() {
  return <section className="panel pulse-panel"><div className="panel-heading"><div><span className="section-kicker">FLEET SIGNAL</span><h3>Safety pulse</h3></div><span className="time-select">Last 30 days <ChevronDown size={13} /></span></div><div className="chart-wrap"><div className="chart-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><svg className="line-chart" viewBox="0 0 470 150" preserveAspectRatio="none"><path className="chart-area" d="M0 124 C30 120 36 112 62 117 S104 88 132 98 S164 76 194 86 S218 94 248 72 S276 65 306 80 S342 59 367 63 S405 33 470 43 L470 150 L0 150Z" /><path className="chart-line" d="M0 124 C30 120 36 112 62 117 S104 88 132 98 S164 76 194 86 S218 94 248 72 S276 65 306 80 S342 59 367 63 S405 33 470 43" /><circle cx="367" cy="63" r="4" className="chart-point" /></svg><div className="chart-labels"><span>SEP 01</span><span>SEP 08</span><span>SEP 15</span><span>SEP 22</span><span>SEP 29</span></div></div><div className="pulse-summary"><div><strong>+4.2%</strong><span>vs previous period</span></div><div className="pulse-legend"><span><i className="legend-blue" />Safety index</span><span><i className="legend-amber" />Target</span></div></div></section>
}

function IncidentsView({ records, aircraftList, selectedAircraft, onAircraft, onIncident }: { records: Incident[]; aircraftList: Aircraft[]; selectedAircraft: Aircraft | null; onAircraft: (a: Aircraft) => void; onIncident: (id: string) => void }) {
  return <div className="view-stack"><div className="view-banner"><div><span className="section-kicker">INCIDENT MANAGEMENT</span><h3>See every signal, in context.</h3><p>Review, triage, and close the loop across your active fleet.</p></div><button className="secondary-button" type="button"><UploadCloud size={15} /> Import report</button></div><div className="filter-row"><div className="filter-tabs"><button className="active" type="button">All incidents <b>{records.length}</b></button><button type="button">Needs review <b>{records.filter(r => r.status === 'Awaiting review').length}</b></button><button type="button">In progress <b>{records.filter(r => r.status === 'Investigating' || r.status === 'In progress').length}</b></button><button type="button">Closed <b>{records.filter(r => r.status === 'Closed' || r.status === 'Review complete').length}</b></button></div><div className="select-control">All aircraft <ChevronDown size={14} /></div></div><div className="incident-table panel"><div className="table-head"><span>INCIDENT</span><span>AIRCRAFT / LOCATION</span><span>SEVERITY</span><span>STATUS</span><span>PROGRESS</span><span /></div>{records.map(item => <button className="table-row" key={item.id} onClick={() => onIncident(item.id)}><div><strong>{item.title}</strong><small>{item.id} · {item.category}</small></div><div><strong>{item.aircraft}</strong><small>{item.location}</small></div><div><SeverityBadge severity={item.severity} /></div><div><span className="status-text"><i /> {item.status}</span><small>{item.time}</small></div><div><div className="row-progress"><i style={{ width: `${item.progress}%` }} /></div><small>{item.progress}% complete</small></div><ArrowRight size={15} /></button>)}</div><div className="section-heading compact"><div><span className="section-kicker">AIRCRAFT FILTER</span><h3>Open by aircraft</h3></div></div><div className="mini-aircraft-grid">{aircraftList.map(a => <button key={a.code} className={`mini-aircraft ${selectedAircraft?.code === a.code ? 'selected' : ''}`} onClick={() => onAircraft(a)}><span>{a.code}</span><small>{a.reports} active reports</small><ArrowRight size={14} /></button>)}</div></div>
}

function AnalysisView({ records, aircraftList, selectedId, onSelect }: { records: Incident[]; aircraftList: Aircraft[]; selectedId: string; onSelect: (id: string) => void }) {
  const selected = records.find(item => item.id === selectedId) ?? records[0] ?? {
    id: 'INC-4821',
    aircraft: 'B737-800',
    title: 'Hydraulic pressure deviation',
    location: 'Flight 6E-284 · Jaipur FIR',
    time: '18 min ago',
    severity: 'High' as Severity,
    status: 'Investigating',
    progress: 68,
    category: 'Systems',
  }
  const severityCounts = (['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(level => ({ level, count: records.filter(item => item.severity === level).length }))
  return <div className="view-stack"><div className="view-banner analysis-banner"><div><span className="section-kicker">INVESTIGATION CENTER</span><h3>From event to insight.</h3><p>Map causal factors, assign ownership, and verify corrective action closure.</p></div><span className="analysis-score"><strong>82</strong><small>investigation confidence</small></span></div><div className="analysis-layout"><div className="analysis-list panel"><div className="panel-heading"><div><span className="section-kicker">ACTIVE INVESTIGATIONS</span><h3>{records.length} incident files</h3></div><Search size={15} /></div>{records.map(item => <button key={item.id} className={`analysis-item ${selected.id === item.id ? 'selected' : ''}`} onClick={() => onSelect(item.id)}><span className={`severity-dot ${item.severity.toLowerCase()}`} /><div><strong>{item.title}</strong><small>{item.id} · {item.aircraft}</small></div><span className="analysis-item-status">{item.progress}%</span></button>)}</div><div className="analysis-detail"><div className="detail-head"><div><span className="section-kicker">{selected.id} / {selected.category.toUpperCase()}</span><h3>{selected.title}</h3><p><Plane size={14} /> {selected.aircraft} <span>·</span> {selected.location}</p></div><SeverityBadge severity={selected.severity} /></div><div className="cause-map panel"><div className="panel-heading"><div><span className="section-kicker">ROOT-CAUSE MAP</span><h3>Contributing factors</h3></div><span className="confidence-tag"><Sparkles size={13} /> AI-assisted</span></div><div className="cause-flow"><div className="cause-node root"><small>EVENT</small><strong>{selected.title}</strong></div><div className="cause-connector" /><div className="cause-node"><small>PRIMARY FACTOR</small><strong>{selected.primary_factor || 'Maintenance handover gap'}</strong><span>{selected.primary_factor_desc || 'Last service note lacked a pressure trend annotation.'}</span></div><div className="cause-connector" /><div className="cause-node"><small>SYSTEM FACTOR</small><strong>{selected.system_factor || 'Procedure variance'}</strong><span>{selected.system_factor_desc || 'Checklist step 4B was interpreted differently across shifts.'}</span></div></div><div className="cause-tags"><span><Check size={13} /> Evidence linked</span><span><Check size={13} /> Owner assigned</span><span className="pending"><Clock3 size={13} /> Follow-up due 04 Oct</span></div></div><div className="action-panel panel"><div className="panel-heading"><div><span className="section-kicker">CORRECTIVE ACTION</span><h3>Close the loop</h3></div><span className="action-status"><i /> In progress</span></div><div className="action-row"><div className="action-icon"><Zap size={17} /></div><div><strong>{selected.action_title || 'Standardize pressure handover note'}</strong><p>{selected.action_desc || 'Update maintenance shift brief template and brief all line supervisors.'}</p></div><div className="action-owner"><small>OWNER</small><strong>{selected.action_owner || 'Vikram S.'}</strong></div><div className="action-due"><small>DUE</small><strong>{selected.action_due || '04 Oct'}</strong></div></div><div className="action-progress"><span>{selected.action_progress ?? 42}% complete</span><div><i style={{ width: `${selected.action_progress ?? 42}%` }} /></div></div></div></div></div><div className="analysis-insights"><section className="panel breakdown-panel"><div className="panel-heading"><div><span className="section-kicker">SEVERITY MIX</span><h3>Where attention is needed</h3></div><BarChart3 size={15} /></div>{severityCounts.map(item => <button className="breakdown-row" key={item.level} onClick={() => onSelect(records.find(record => record.severity === item.level)?.id ?? selected.id)}><span className={`severity-dot ${item.level.toLowerCase()}`} /><strong>{item.level}</strong><div><i style={{ width: `${Math.max(item.count / Math.max(records.length, 1) * 100, item.count ? 12 : 0)}%` }} /></div><small>{item.count}</small></button>)}</section><section className="panel breakdown-panel"><div className="panel-heading"><div><span className="section-kicker">AIRCRAFT COMPARISON</span><h3>Reports by fleet</h3></div><Gauge size={15} /></div>{aircraftList.map(item => <button className="breakdown-row" key={item.code} onClick={() => onSelect(records.find(record => record.aircraft.startsWith(item.code))?.id ?? selected.id)}><strong className="aircraft-compare-code">{item.code}</strong><div><i style={{ width: `${Math.min(item.reports * 7, 100)}%` }} /></div><small>{item.reports}</small></button>)}</section></div></div>
}

function ComplianceView() {
  const defaultItems: ComplianceItem[] = [
    { name: 'DG handling refresher', code: 'ICAO ANNEX 18', owner: 'Operations', due: '02 Oct 2026', progress: 86, status: 'On track' },
    { name: 'SMS effectiveness review', code: 'ICAO ANNEX 19', owner: 'Safety office', due: '08 Oct 2026', progress: 62, status: 'On track' },
    { name: 'Flight data monitoring sample', code: 'DGCA CAR 5', owner: 'Flight ops', due: '14 Oct 2026', progress: 38, status: 'Needs attention' },
    { name: 'Ramp safety observation cycle', code: 'IATA ISAGO', owner: 'Ground ops', due: '21 Oct 2026', progress: 19, status: 'On track' },
  ]
  const [items, setItems] = useState<ComplianceItem[]>(defaultItems)
  const [filter, setFilter] = useState<'all' | 'attention'>('all')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  useEffect(() => {
    void fetchCompliance().then(data => {
      if (data && data.length) setItems(data)
    }).catch(() => {})
  }, [])

  const visibleItems = items.filter(item => filter === 'all' || item.status === 'Needs attention')
  return <div className="view-stack"><div className="view-banner compliance-banner"><div><span className="section-kicker">COMPLIANCE CONTROL ROOM</span><h3>Ready when audit day arrives.</h3><p>A single source of truth for reporting readiness and open actions.</p></div><div className="readiness-score"><div className="score-ring"><strong>91</strong><span>%</span></div><div><small>REPORTING READINESS</small><strong>Above target</strong></div></div></div><div className="compliance-kpis"><div className="compliance-kpi"><span className="kpi-icon cyan"><BookOpenCheck size={17} /></span><div><small>CONTROL LIBRARY</small><strong>48 / 52</strong><span>controls reviewed</span></div></div><div className="compliance-kpi"><span className="kpi-icon amber"><Clock3 size={17} /></span><div><small>DUE THIS MONTH</small><strong>7</strong><span>2 due this week</span></div></div><div className="compliance-kpi"><span className="kpi-icon green"><Check size={17} /></span><div><small>ON TIME RATE</small><strong>94%</strong><span>last 90 days</span></div></div></div><section className="panel compliance-panel"><div className="panel-heading"><div><span className="section-kicker">CONTROL ACTIONS</span><h3>Open compliance actions</h3></div><div className="panel-filters"><button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} type="button" onClick={() => setFilter('all')}>All <b>{items.length}</b></button><button className={`filter-chip ${filter === 'attention' ? 'active' : ''}`} type="button" onClick={() => setFilter('attention')}>At risk <b>{items.filter(i => i.status === 'Needs attention').length}</b></button></div></div><div className="compliance-list">{visibleItems.map(item => <button type="button" className={`compliance-row ${selectedAction === item.name ? 'selected' : ''}`} key={item.name} onClick={() => setSelectedAction(item.name)}><div className="compliance-check"><Check size={14} /></div><div className="compliance-name"><strong>{item.name}</strong><small>{item.code}</small></div><div className="compliance-owner"><small>OWNER</small><strong>{item.owner}</strong></div><div className="compliance-due"><small>DUE DATE</small><strong>{item.due}</strong></div><div className="compliance-progress"><div><i style={{ width: `${item.progress}%` }} /></div><small>{item.progress}%</small></div><span className={`compliance-status ${item.status === 'Needs attention' ? 'attention' : ''}`}><i /> {item.status}</span></button>)}</div>{selectedAction && <div className="compliance-detail"><Check size={14} /> {selectedAction} selected for control-owner review.</div>}</section></div>
}

function IncidentForm({ aircraft: plane, onClose, onSubmitDraft }: { aircraft: Aircraft | null; onClose: () => void; onSubmitDraft: (draft: Partial<Incident>) => void }) {
  const [submitted, setSubmitted] = useState(false)
  const [severity, setSeverity] = useState<Severity>('Medium')
  return <div className="modal-backdrop"><div className="incident-modal"><div className="modal-head"><div><span className="section-kicker">NEW SAFETY REPORT</span><h3>{plane?.name ?? 'Aircraft incident'}</h3></div><button className="close-button" onClick={onClose}><X size={18} /></button></div>{submitted ? <div className="submitted-state"><div className="submitted-icon"><Check size={28} /></div><h3>Draft report received</h3><p>Your incident record is staged for safety lead review. The investigation workspace is ready for the next step.</p><div className="submitted-meta"><span><strong>SS-{Math.floor(Math.random() * 9000 + 1000)}</strong> reference ID</span><span><Clock3 size={13} /> Just now</span></div><button className="primary-cta" onClick={onClose}>Back to workspace <ArrowRight size={16} /></button></div> : <form onSubmit={e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    onSubmitDraft({
      id: `INC-${Math.floor(Math.random() * 900 + 4100)}`,
      aircraft: plane?.code ?? 'UNASSIGNED',
      title: String(data.get('title') || 'Untitled safety report'),
      reporter: String(data.get('reporter') || ''),
      date: String(data.get('date') || ''),
      flight: String(data.get('flight') || ''),
      location: String(data.get('location') || 'Unspecified location'),
      time: 'Just now',
      severity,
      status: 'Awaiting review',
      progress: 8,
      category: 'New report',
      narrative: String(data.get('narrative') || ''),
      factors: String(data.get('factors') || ''),
    })
    setSubmitted(true)
  }}><div className="form-progress"><span className="active">1. EVENT DETAILS</span><span>2. CONTEXT</span><span>3. CONTRIBUTING FACTORS</span></div><div className="form-grid"><label>Incident title<input name="title" required placeholder="e.g. Hydraulic pressure deviation" /></label><label>Reported by<input name="reporter" required placeholder="Name or employee ID" /></label><label>Occurrence date<input name="date" type="date" defaultValue="2026-09-30" /></label><label>Flight / sector<input name="flight" placeholder="e.g. 6E-284 · BOM-JAI" /></label><label>Location<input name="location" placeholder="Airport, runway, or FIR" /></label><label>Severity<select name="severity" value={severity} onChange={e => setSeverity(e.target.value as Severity)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label className="full">What happened?<textarea name="narrative" required placeholder="Describe the event in clear operational language..." rows={4} /></label><label className="full">Initial contributing factors<textarea name="factors" placeholder="Weather, equipment, human factors, process, or other context..." rows={3} /></label></div><div className="modal-foot"><span><ShieldCheck size={14} /> Report data is visible to authorized safety leads</span><button className="primary-cta" type="submit">Submit draft <ArrowRight size={15} /></button></div></form>}</div></div>
}

function App() {
  const [entered, setEntered] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [view, setView] = useState<View>('overview')
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [aircraftList, setAircraftList] = useState<Aircraft[]>(defaultAircraft)
  const [records, setRecords] = useState<Incident[]>(seedIncidents)
  const [selectedIncidentId, setSelectedIncidentId] = useState(seedIncidents[0].id)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    void getCurrentUser().then(u => {
      setUser(u)
      if (u) {
        setEntered(true)
      }
    }).catch(() => setUser(null))

    // Fetch initial fleet, incident, and dashboard stats from Django backend
    void fetchAircraft().then(data => {
      if (data && data.length) setAircraftList(data)
    }).catch(err => console.info('Using local fleet data:', err))

    void fetchIncidents().then(data => {
      if (data && data.length) {
        setRecords(data)
        setSelectedIncidentId(data[0].id)
      }
    }).catch(err => console.info('Using local incident data:', err))

    void fetchStats().then(data => {
      if (data) setStats(data)
    }).catch(err => console.info('Using local stats data:', err))
  }, [])

  const pageTitle = useMemo(() => ({
    overview: ['FLEET OVERVIEW', 'Safety workspace'],
    incidents: ['INCIDENT MANAGEMENT', 'Incident queue'],
    analysis: ['INVESTIGATION CENTER', 'Root-cause analysis'],
    compliance: ['COMPLIANCE CONTROL ROOM', 'Compliance']
  }[view]), [view])

  const openAircraft = (plane: Aircraft) => { setSelectedAircraft(plane); setFormOpen(true) }
  const openIncident = (id: string) => { if (id) { setSelectedIncidentId(id); setView('analysis') } }

  const addDraft = async (draft: Partial<Incident>) => {
    const tempIncident = draft as Incident
    setRecords(current => [tempIncident, ...current])
    setSelectedIncidentId(tempIncident.id)

    try {
      const saved = await createIncident(draft)
      setRecords(current => current.map(item => item.id === tempIncident.id ? saved : item))
      const [updatedPlanes, updatedStats] = await Promise.all([
        fetchAircraft().catch(() => null),
        fetchStats().catch(() => null),
      ])
      if (updatedPlanes && updatedPlanes.length) setAircraftList(updatedPlanes)
      if (updatedStats) setStats(updatedStats)
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err)
    }
  }

  const handleAuthenticated = (u: AuthUser) => {
    setUser(u)
    setEntered(true)
    setAuthOpen(false)
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    setEntered(false)
  }

  if (!entered) return <><Landing onEnter={() => setEntered(true)} onLogin={() => setAuthOpen(true)} onLogout={() => { void handleLogout() }} user={user} />{authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={handleAuthenticated} />}</>
  return <div className="app-shell"><Sidebar view={view} setView={setView} onNew={() => { setSelectedAircraft(null); setFormOpen(true) }} user={user} onLogout={() => { void handleLogout() }} /><main className="app-main"><Topbar kicker={pageTitle[0]} title={pageTitle[1]} onNew={() => { setSelectedAircraft(null); setFormOpen(true) }} />{view === 'overview' && <Overview records={records} aircraftList={aircraftList} selectAircraft={openAircraft} onIncident={openIncident} setView={setView} stats={stats} />}{view === 'incidents' && <IncidentsView records={records} aircraftList={aircraftList} selectedAircraft={selectedAircraft} onAircraft={openAircraft} onIncident={openIncident} />}{view === 'analysis' && <AnalysisView records={records} aircraftList={aircraftList} selectedId={selectedIncidentId} onSelect={setSelectedIncidentId} />}{view === 'compliance' && <ComplianceView />}</main>{formOpen && <IncidentForm aircraft={selectedAircraft} onClose={() => setFormOpen(false)} onSubmitDraft={addDraft} />}</div>
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

if (!googleClientId) {
  throw new Error('Google Client ID is missing. Check your frontend .env file.')
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
)
