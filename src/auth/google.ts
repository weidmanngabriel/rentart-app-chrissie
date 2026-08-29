export type GoogleUser = {
  sub: string
  name: string
  email: string
  picture?: string
  exp: number
}

export const GOOGLE_SESSION_KEY = 'rentart-google-session'

export function readGoogleCredential(credential: string): GoogleUser | null {
  try {
    const payload = credential.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    const user = JSON.parse(decoded) as GoogleUser
    if (!user.sub || !user.email || !user.name || !user.exp || user.exp * 1000 <= Date.now()) return null
    return user
  } catch {
    return null
  }
}
