const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TOKEN_KEY = 'skyshield_access_token'

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

export type Aircraft = {
  id?: number
  code: string
  name: string
  type: string
  fleet: string
  reports: number
  trend: string
  trendTone: 'good' | 'warn'
  status: string
  color: string
}

export type Incident = {
  id: string
  aircraft: string
  title: string
  location: string
  time: string
  severity: Severity
  status: string
  progress: number
  category: string
  reporter?: string
  date?: string
  flight?: string
  narrative?: string
  factors?: string
  primary_factor?: string
  primary_factor_desc?: string
  system_factor?: string
  system_factor_desc?: string
  action_title?: string
  action_desc?: string
  action_owner?: string
  action_due?: string
  action_progress?: number
}

export type ComplianceItem = {
  id?: number
  name: string
  code: string
  owner: string
  due: string
  progress: number
  status: string
}

export type DashboardStats = {
  safety_index: number
  open_incidents: number
  total_incidents: number
  closed_incidents: number
  total_aircraft: number
  reporting_rate: number
  investigation_confidence: number
}

function extractApiError(data: unknown, fallback: string): string {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    if (typeof record.error === 'string') return record.error
    if (typeof record.message === 'string') return record.message
    for (const key of Object.keys(record)) {
      const val = record[key]
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0]
      if (typeof val === 'string') return val
    }
  }
  return fallback
}

async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    return await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Unable to connect to SkyShield backend server. Please verify Django is running at ' + API_URL)
  }
}

export async function fetchAircraft(): Promise<Aircraft[]> {
  const res = await apiRequest('/api/aircraft/')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to fetch aircraft'))
  }
  return res.json()
}

export async function createAircraft(aircraft: Partial<Aircraft>): Promise<Aircraft> {
  const res = await apiRequest('/api/aircraft/', {
    method: 'POST',
    body: JSON.stringify(aircraft),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to create aircraft'))
  }
  return res.json()
}

export async function updateAircraft(code: string, data: Partial<Aircraft>): Promise<Aircraft> {
  const res = await apiRequest(`/api/aircraft/${encodeURIComponent(code)}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to update aircraft'))
  }
  return res.json()
}

export async function deleteAircraft(code: string): Promise<void> {
  const res = await apiRequest(`/api/aircraft/${encodeURIComponent(code)}/`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to delete aircraft'))
  }
}

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await apiRequest('/api/incidents/')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to fetch incidents'))
  }
  return res.json()
}

export async function fetchIncidentDetail(id: string): Promise<Incident> {
  const res = await apiRequest(`/api/incidents/${encodeURIComponent(id)}/`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to fetch incident details'))
  }
  return res.json()
}

export async function createIncident(incident: Partial<Incident>): Promise<Incident> {
  const res = await apiRequest('/api/incidents/', {
    method: 'POST',
    body: JSON.stringify(incident),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(extractApiError(errorData, 'Failed to create incident report'))
  }
  return res.json()
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
  const res = await apiRequest(`/api/incidents/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to update incident'))
  }
  return res.json()
}

export async function deleteIncident(id: string): Promise<void> {
  const res = await apiRequest(`/api/incidents/${encodeURIComponent(id)}/`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to delete incident'))
  }
}

export async function fetchCompliance(): Promise<ComplianceItem[]> {
  const res = await apiRequest('/api/compliance/')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to fetch compliance'))
  }
  return res.json()
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await apiRequest('/api/stats/')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(extractApiError(err, 'Failed to fetch stats'))
  }
  return res.json()
}
