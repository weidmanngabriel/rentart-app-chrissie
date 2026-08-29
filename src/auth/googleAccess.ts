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

export function storeGoogleAccessSession(accessToken: string, email: string, expiresInSeconds: number) {
  const value: StoredGoogleAccess = {
    accessToken,
    email: email.toLowerCase(),
    expiresAt: Date.now() + Math.max(0, expiresInSeconds - 30) * 1000,
  }
  sessionStorage.setItem(GOOGLE_ACCESS_SESSION_KEY, JSON.stringify(value))
}

export function readGoogleAccessSession(email: string) {
  try {
    const raw = sessionStorage.getItem(GOOGLE_ACCESS_SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as StoredGoogleAccess
    if (!value.accessToken || value.email !== email.toLowerCase() || value.expiresAt <= Date.now()) {
      sessionStorage.removeItem(GOOGLE_ACCESS_SESSION_KEY)
      return null
    }
    return value.accessToken
  } catch {
    sessionStorage.removeItem(GOOGLE_ACCESS_SESSION_KEY)
    return null
  }
}

export function clearGoogleAccessSession() {
  sessionStorage.removeItem(GOOGLE_ACCESS_SESSION_KEY)
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
