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

const GOOGLE_ACCOUNTS_STORAGE_KEY = 'rentart-google-accounts-persistent'
const GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY = 'rentart-google-active-account-persistent'

type StoredGoogleAccount = {
  user: GoogleUser
}

type LegacyStoredGoogleAccount = {
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

function isStoredGoogleUser(value: unknown): value is GoogleUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<GoogleUser>
  return Boolean(user.sub && user.name && user.email && user.exp)
}

function readPersistentEntries() {
  try {
    const raw = localStorage.getItem(GOOGLE_ACCOUNTS_STORAGE_KEY)
    if (!raw) return [] as StoredGoogleAccount[]
    const value = JSON.parse(raw) as StoredGoogleAccount[]
    if (!Array.isArray(value)) return []
    return value.filter((entry) => isStoredGoogleUser(entry?.user))
  } catch {
    return [] as StoredGoogleAccount[]
  }
}

function writePersistentEntries(entries: StoredGoogleAccount[]) {
  if (entries.length) localStorage.setItem(GOOGLE_ACCOUNTS_STORAGE_KEY, JSON.stringify(entries))
  else localStorage.removeItem(GOOGLE_ACCOUNTS_STORAGE_KEY)
}

function readLegacySessionEntries() {
  try {
    const raw = sessionStorage.getItem(GOOGLE_ACCOUNTS_SESSION_KEY)
    if (!raw) return [] as LegacyStoredGoogleAccount[]
    const value = JSON.parse(raw) as LegacyStoredGoogleAccount[]
    return Array.isArray(value) ? value : []
  } catch {
    return [] as LegacyStoredGoogleAccount[]
  }
}

function migrateLegacySessionStorage(entries: StoredGoogleAccount[]) {
  const migrated = [...entries]
  const credentials = readLegacySessionEntries().map((entry) => entry.credential)
  const legacyCredential = sessionStorage.getItem(GOOGLE_SESSION_KEY)
  if (legacyCredential) credentials.push(legacyCredential)

  for (const credential of credentials) {
    const user = readGoogleCredential(credential)
    if (!user) continue
    const email = user.email.toLowerCase()
    if (!migrated.some((entry) => entry.user.email.toLowerCase() === email)) migrated.push({ user })
  }

  const legacyActiveEmail = sessionStorage.getItem(GOOGLE_ACTIVE_ACCOUNT_KEY)
  if (!localStorage.getItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY) && legacyActiveEmail) {
    localStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY, legacyActiveEmail.toLowerCase())
  }

  sessionStorage.removeItem(GOOGLE_SESSION_KEY)
  sessionStorage.removeItem(GOOGLE_ACCOUNTS_SESSION_KEY)
  sessionStorage.removeItem(GOOGLE_ACTIVE_ACCOUNT_KEY)
  writePersistentEntries(migrated)
  return migrated
}

export function readStoredGoogleAccounts(): GoogleUser[] {
  const entries = migrateLegacySessionStorage(readPersistentEntries())
  const users = entries.map((entry) => entry.user)
  const activeEmail = localStorage.getItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY)?.toLowerCase()
  if (!activeEmail || !users.some((user) => user.email.toLowerCase() === activeEmail)) {
    if (users[0]) localStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY, users[0].email.toLowerCase())
    else localStorage.removeItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY)
  }
  return users
}

export function readActiveGoogleAccount(accounts = readStoredGoogleAccounts()) {
  const activeEmail = localStorage.getItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY)?.toLowerCase()
  return accounts.find((account) => account.email.toLowerCase() === activeEmail) ?? accounts[0] ?? null
}

export function storeGoogleAccount(credential: string) {
  const user = readGoogleCredential(credential)
  if (!user) return null

  const entries = readPersistentEntries()
  const email = user.email.toLowerCase()
  const nextEntries = entries.filter((entry) => entry.user.email.toLowerCase() !== email)
  nextEntries.push({ user })
  writePersistentEntries(nextEntries)
  localStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY, email)
  return user
}

export function setActiveGoogleAccount(email: string) {
  localStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY, email.toLowerCase())
}

export function removeGoogleAccount(email: string) {
  const target = email.toLowerCase()
  const entries = readPersistentEntries().filter((entry) => entry.user.email.toLowerCase() !== target)
  writePersistentEntries(entries)

  const users = entries.map((entry) => entry.user)
  const next = users[0] ?? null
  if (next) localStorage.setItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY, next.email.toLowerCase())
  else localStorage.removeItem(GOOGLE_ACTIVE_ACCOUNT_STORAGE_KEY)
  return { accounts: users, active: next }
}
