export type GoogleUser = {
  sub: string
  name: string
  email: string
  picture?: string
  exp: number
}

export const GOOGLE_SESSION_KEY = 'rentart-google-session'
export const GOOGLE_ACCOUNTS_SESSION_KEY = 'rentart-google-accounts'
export const GOOGLE_ACTIVE_ACCOUNT_KEY = 'rentart-google-active-account'

type StoredGoogleAccount = {
  credential: string
}

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

function readStoredEntries() {
  try {
    const raw = sessionStorage.getItem(GOOGLE_ACCOUNTS_SESSION_KEY)
    if (!raw) return [] as StoredGoogleAccount[]
    const value = JSON.parse(raw) as StoredGoogleAccount[]
    return Array.isArray(value) ? value : []
  } catch {
    return [] as StoredGoogleAccount[]
  }
}

function persistValidEntries(entries: StoredGoogleAccount[]) {
  const valid = entries.filter((entry) => Boolean(readGoogleCredential(entry.credential)))
  if (valid.length) sessionStorage.setItem(GOOGLE_ACCOUNTS_SESSION_KEY, JSON.stringify(valid))
  else sessionStorage.removeItem(GOOGLE_ACCOUNTS_SESSION_KEY)
  return valid
}

export function readStoredGoogleAccounts(): GoogleUser[] {
  let entries = readStoredEntries()

  const legacyCredential = sessionStorage.getItem(GOOGLE_SESSION_KEY)
  if (legacyCredential) {
    const legacyUser = readGoogleCredential(legacyCredential)
    if (legacyUser && !entries.some((entry) => readGoogleCredential(entry.credential)?.email.toLowerCase() === legacyUser.email.toLowerCase())) {
      entries.push({ credential: legacyCredential })
    }
    sessionStorage.removeItem(GOOGLE_SESSION_KEY)
  }

  entries = persistValidEntries(entries)
  const users = entries.map((entry) => readGoogleCredential(entry.credential)).filter((user): user is GoogleUser => Boolean(user))
  const activeEmail = sessionStorage.getItem(GOOGLE_ACTIVE_ACCOUNT_KEY)?.toLowerCase()
  if (!activeEmail || !users.some((user) => user.email.toLowerCase() === activeEmail)) {
    if (users[0]) sessionStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_KEY, users[0].email.toLowerCase())
    else sessionStorage.removeItem(GOOGLE_ACTIVE_ACCOUNT_KEY)
  }
  return users
}

export function readActiveGoogleAccount(accounts = readStoredGoogleAccounts()) {
  const activeEmail = sessionStorage.getItem(GOOGLE_ACTIVE_ACCOUNT_KEY)?.toLowerCase()
  return accounts.find((account) => account.email.toLowerCase() === activeEmail) ?? accounts[0] ?? null
}

export function storeGoogleAccount(credential: string) {
  const user = readGoogleCredential(credential)
  if (!user) return null

  const entries = persistValidEntries(readStoredEntries())
  const email = user.email.toLowerCase()
  const nextEntries = entries.filter((entry) => readGoogleCredential(entry.credential)?.email.toLowerCase() !== email)
  nextEntries.push({ credential })
  sessionStorage.setItem(GOOGLE_ACCOUNTS_SESSION_KEY, JSON.stringify(nextEntries))
  sessionStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_KEY, email)
  sessionStorage.removeItem(GOOGLE_SESSION_KEY)
  return user
}

export function setActiveGoogleAccount(email: string) {
  sessionStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_KEY, email.toLowerCase())
}

export function removeGoogleAccount(email: string) {
  const target = email.toLowerCase()
  const entries = persistValidEntries(readStoredEntries()).filter((entry) => readGoogleCredential(entry.credential)?.email.toLowerCase() !== target)
  if (entries.length) sessionStorage.setItem(GOOGLE_ACCOUNTS_SESSION_KEY, JSON.stringify(entries))
  else sessionStorage.removeItem(GOOGLE_ACCOUNTS_SESSION_KEY)

  const users = entries.map((entry) => readGoogleCredential(entry.credential)).filter((user): user is GoogleUser => Boolean(user))
  const next = users[0] ?? null
  if (next) sessionStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_KEY, next.email.toLowerCase())
  else sessionStorage.removeItem(GOOGLE_ACTIVE_ACCOUNT_KEY)
  return { accounts: users, active: next }
}
