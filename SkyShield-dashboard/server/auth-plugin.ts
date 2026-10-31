import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const SESSION_COOKIE = 'webdev_app_session'
const STATE_COOKIE = '__Host-oauth_state'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
const OAUTH_API_PATH = '/webdev.v1.WebDevAuthPublicService'

type UserInfo = {
  openId?: string
  name?: string
  email?: string
  platform?: string
  loginMethod?: string
  platforms?: string[]
}

type SessionPayload = {
  openId: string
  appId: string
  name: string
  email?: string
  loginMethod?: string
  exp: number
}

function env(name: string): string {
  return process.env[name] ?? ''
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function parseCookies(header = ''): Record<string, string> {
  return Object.fromEntries(header.split(';').map(part => {
    const index = part.indexOf('=')
    if (index < 0) return ['', '']
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]
  }).filter(([key]) => key))
}

function signSession(payload: Omit<SessionPayload, 'exp'>): string {
  const body: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS }
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const encodedBody = base64Url(JSON.stringify(body))
  const signature = base64Url(createHmac('sha256', env('MANUS_JWT_SECRET')).update(`${header}.${encodedBody}`).digest())
  return `${header}.${encodedBody}.${signature}`
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token || !env('MANUS_JWT_SECRET')) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts
  try {
    const expected = createHmac('sha256', env('MANUS_JWT_SECRET')).update(`${header}.${body}`).digest()
    const received = Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - signature.length % 4) % 4), 'base64')
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
    const parsedHeader = JSON.parse(Buffer.from(header.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - header.length % 4) % 4), 'base64').toString()) as { alg?: string }
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - body.length % 4) % 4), 'base64').toString()) as SessionPayload
    if (parsedHeader.alg !== 'HS256' || payload.appId !== env('MANUS_PROJECT_ID') || !payload.openId || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function requestOrigin(req: IncomingMessage): string {
  const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim()
  const protocol = forwardedProto || ((req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http')
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '')
  return `${protocol}://${host}`
}

function setHeaders(res: ServerResponse, status: number, headers: Record<string, string>, body?: string) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
  res.end(body ?? '')
}

function json(res: ServerResponse, status: number, value: unknown, headers: Record<string, string> = {}) {
  setHeaders(res, status, headers, JSON.stringify(value))
}

function redirect(res: ServerResponse, location: string, cookies: string[] = []) {
  res.writeHead(302, { Location: location, ...(cookies.length ? { 'Set-Cookie': cookies } : {}) })
  res.end()
}

function clearStateCookie(): string {
  return `${STATE_COOKIE}=; Path=/; Max-Age=0; SameSite=None; Secure`
}

function encodeState(value: { redirectUri: string; nonce: string }): string {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

function decodeState(value: string): { redirectUri?: string; nonce?: string } {
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString()) as { redirectUri?: string; nonce?: string }
  } catch {
    return {}
  }
}

function providerFromPlatforms(info: UserInfo): string | undefined {
  if (info.loginMethod) return info.loginMethod
  if (info.platform) return info.platform
  if (info.platforms?.includes('REGISTERED_PLATFORM_GOOGLE')) return 'google'
  if (info.platforms?.includes('REGISTERED_PLATFORM_EMAIL')) return 'email'
  return undefined
}

async function exchangeCode(code: string, redirectUri: string) {
  const response = await fetch(`${env('MANUS_OAUTH_API_URL')}${OAUTH_API_PATH}/ExchangeToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: env('MANUS_PROJECT_ID'), grantType: 'authorization_code', code, redirectUri })
  })
  if (!response.ok) throw new Error(`OAuth exchange failed with ${response.status}`)
  return response.json() as Promise<{ accessToken?: string }>
}

async function userInfoByAccessToken(accessToken: string): Promise<UserInfo> {
  const response = await fetch(`${env('MANUS_OAUTH_API_URL')}${OAUTH_API_PATH}/GetUserInfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  })
  if (!response.ok) throw new Error(`Identity lookup failed with ${response.status}`)
  return response.json() as Promise<UserInfo>
}

async function userInfoByJwt(jwtToken: string): Promise<UserInfo | null> {
  if (!env('MANUS_OAUTH_API_URL')) return null
  const response = await fetch(`${env('MANUS_OAUTH_API_URL')}${OAUTH_API_PATH}/GetUserInfoWithJwt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jwtToken, projectId: env('MANUS_PROJECT_ID') })
  })
  if (!response.ok) return null
  return response.json() as Promise<UserInfo>
}

async function handleAuth(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', requestOrigin(req))
  if (!url.pathname.startsWith('/api/auth/') && url.pathname !== '/api/oauth/callback') return false

  if (url.pathname === '/api/auth/login' && req.method === 'GET') {
    if (!env('MANUS_PROJECT_ID') || !env('MANUS_OAUTH_PORTAL_URL')) {
      json(res, 503, { error: 'Managed login is not configured in this environment.' })
      return true
    }
    const redirectUri = `${requestOrigin(req)}/api/oauth/callback`
    const nonce = randomUUID()
    const state = encodeState({ redirectUri, nonce })
    const loginUrl = new URL(`${env('MANUS_OAUTH_PORTAL_URL')}/app-auth`)
    loginUrl.searchParams.set('appId', env('MANUS_PROJECT_ID'))
    loginUrl.searchParams.set('redirectUri', redirectUri)
    loginUrl.searchParams.set('state', state)
    loginUrl.searchParams.set('responseType', 'code')
    redirect(res, loginUrl.toString(), [`${STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`])
    return true
  }

  if (url.pathname === '/api/oauth/callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const stateValue = url.searchParams.get('state')
    const state = stateValue ? decodeState(stateValue) : {}
    const cookies = parseCookies(req.headers.cookie)
    const callbackOrigin = requestOrigin(req)
    if (!code || !stateValue || !state.nonce || state.nonce !== cookies[STATE_COOKIE] || state.redirectUri !== `${callbackOrigin}/api/oauth/callback`) {
      json(res, 403, { error: 'Invalid or expired login state.' }, { 'Set-Cookie': clearStateCookie() })
      return true
    }
    try {
      const token = await exchangeCode(code, state.redirectUri)
      if (!token.accessToken) throw new Error('OAuth response did not include an access token')
      const info = await userInfoByAccessToken(token.accessToken)
      if (!info.openId) throw new Error('OAuth identity did not include an openId')
      const session = signSession({ openId: info.openId, appId: env('MANUS_PROJECT_ID'), name: info.name || info.email || 'SkyShield user', email: info.email, loginMethod: providerFromPlatforms(info) })
      redirect(res, '/', [clearStateCookie(), `${SESSION_COOKIE}=${session}; HttpOnly; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=None; Secure`])
    } catch (error) {
      console.error('[SkyShield auth] callback failed', error)
      json(res, 502, { error: 'Login could not be completed. Please try again.' }, { 'Set-Cookie': clearStateCookie() })
    }
    return true
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE]
    const session = verifySession(token)
    if (!session) {
      json(res, 200, { user: null })
      return true
    }
    const info = session.email ? null : await userInfoByJwt(token)
    json(res, 200, { user: { openId: session.openId, name: info?.name || session.name, email: info?.email || session.email || null, loginMethod: info ? providerFromPlatforms(info) : session.loginMethod || null } })
    return true
  }

  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    json(res, 200, { ok: true }, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure` })
    return true
  }

  json(res, 404, { error: 'Auth route not found.' })
  return true
}

function middleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  void handleAuth(req, res).then(handled => { if (!handled) next() }).catch(error => {
    console.error('[SkyShield auth] request failed', error)
    if (!res.headersSent) json(res, 500, { error: 'Authentication service unavailable.' })
  })
}

export function authPlugin(): Plugin {
  return {
    name: 'skyshield-managed-auth',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    }
  }
}
