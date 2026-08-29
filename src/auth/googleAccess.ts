export const GOOGLE_API_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
].join(' ')

export const GOOGLE_ACCESS_SESSION_KEY = 'rentart-google-access'

export type GoogleAccessIdentity = {
  email: string
}

type GoogleAccessToken = {
  accessToken: string
  expiresInSeconds: number
}

type StoredGoogleAccess = {
  accessToken: string
  email: string
  expiresAt: number
}

type StoredGoogleAccessMap = Record<string, StoredGoogleAccess>

export function requestGoogleAccessToken(clientId: string) {
  return new Promise<GoogleAccessToken>((resolve, reject) => {
    const oauth2 = window.google?.accounts.oauth2
    if (!oauth2) {
      reject(new Error('Google-Autorisierung ist noch nicht geladen.'))
      return
    }

    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_API_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Google-Zugriff wurde nicht freigegeben.'))
          return
        }
        resolve({
          accessToken: response.access_token,
          expiresInSeconds: response.expires_in ?? 3600,
        })
      },
      error_callback: () => reject(new Error('Das Google-Fenster wurde geschlossen oder konnte nicht geöffnet werden.')),
    })

    client.requestAccessToken({ prompt: '' })
  })
}

function readAccessMap(): StoredGoogleAccessMap {
  try {
    const raw = sessionStorage.getItem(GOOGLE_ACCESS_SESSION_KEY)
    if (!raw) return {}
    const value = JSON.parse(raw) as StoredGoogleAccessMap | StoredGoogleAccess
    if ('accessToken' in value && 'email' in value) {
      const legacy = value as StoredGoogleAccess
      return { [legacy.email.toLowerCase()]: legacy }
    }
    return value && typeof value === 'object' ? value as StoredGoogleAccessMap : {}
  } catch {
    return {}
  }
}

function writeAccessMap(value: StoredGoogleAccessMap) {
  if (Object.keys(value).length) sessionStorage.setItem(GOOGLE_ACCESS_SESSION_KEY, JSON.stringify(value))
  else sessionStorage.removeItem(GOOGLE_ACCESS_SESSION_KEY)
}

export function storeGoogleAccessSession(accessToken: string, email: string, expiresInSeconds: number) {
  const normalizedEmail = email.toLowerCase()
  const map = readAccessMap()
  map[normalizedEmail] = {
    accessToken,
    email: normalizedEmail,
    expiresAt: Date.now() + Math.max(0, expiresInSeconds - 30) * 1000,
  }
  writeAccessMap(map)
}

export function readGoogleAccessSession(email: string) {
  const normalizedEmail = email.toLowerCase()
  const map = readAccessMap()
  const value = map[normalizedEmail]
  if (!value?.accessToken || value.email !== normalizedEmail || value.expiresAt <= Date.now()) {
    delete map[normalizedEmail]
    writeAccessMap(map)
    return null
  }
  return value.accessToken
}

export function clearGoogleAccessSession(email?: string) {
  if (!email) {
    sessionStorage.removeItem(GOOGLE_ACCESS_SESSION_KEY)
    return
  }
  const map = readAccessMap()
  delete map[email.toLowerCase()]
  writeAccessMap(map)
}

export async function readGoogleAccessIdentity(accessToken: string): Promise<GoogleAccessIdentity> {
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Google-Konto für den Datenzugriff konnte nicht geprüft werden.')
  const payload = await response.json() as { email?: string }
  if (!payload.email) throw new Error('Google hat keine E-Mail-Adresse für den Datenzugriff geliefert.')
  return { email: payload.email.toLowerCase() }
}
