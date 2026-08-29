export const GOOGLE_API_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
].join(' ')

export type GoogleAccessIdentity = {
  email: string
}

export function requestGoogleAccessToken(clientId: string) {
  return new Promise<string>((resolve, reject) => {
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
        resolve(response.access_token)
      },
      error_callback: () => reject(new Error('Das Google-Fenster wurde geschlossen oder konnte nicht geöffnet werden.')),
    })

    client.requestAccessToken()
  })
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
