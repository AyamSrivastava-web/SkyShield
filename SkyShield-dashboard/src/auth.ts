export type AuthUser = {
  id: number
  name: string
  email: string
  loginMethod: 'email' | 'google'
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TOKEN_KEY = 'skyshield_access_token'

type AuthResponse = {
  access: string
  user: AuthUser
}

function extractErrorMessage(data: unknown, fallback: string): string {
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

async function request(path: string, options: RequestInit = {}): Promise<Response> {
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

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, 'Invalid email or password.'))
  }
  localStorage.setItem(TOKEN_KEY, (data as AuthResponse).access)
  return (data as AuthResponse).user
}

export async function signup(name: string, email: string, password: string): Promise<AuthUser> {
  const response = await request('/api/auth/signup/', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, 'Could not create your account.'))
  }
  localStorage.setItem(TOKEN_KEY, (data as AuthResponse).access)
  return (data as AuthResponse).user
}

export async function loginWithGoogle(credential: string): Promise<AuthUser> {
  const response = await request('/api/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, 'Google authentication failed.'))
  }
  localStorage.setItem(TOKEN_KEY, (data as AuthResponse).access)
  return (data as AuthResponse).user
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  try {
    const response = await request('/api/auth/me/')
    if (!response.ok) {
      localStorage.removeItem(TOKEN_KEY)
      return null
    }
    const data = await response.json().catch(() => ({}))
    return (data as { user?: AuthUser }).user ?? null
  } catch {
    return null
  }
}

export async function signOut(): Promise<void> {
  try {
    await request('/api/auth/logout/', { method: 'POST' })
  } catch {
    // Ignore network error on logout
  } finally {
    localStorage.removeItem(TOKEN_KEY)
  }
}

