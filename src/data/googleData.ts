export type UserRole = 'artist' | 'customer'
export type ReservationStatus = 'requested' | 'active' | 'cancelled' | 'returned'

export type BackendUser = {
  rowNumber: number
  email: string
  role: UserRole | null
  active: boolean
  displayName: string
}

export type Artwork = {
  rowNumber: number
  id: string
  title: string
  description: string
  artistEmail: string
  priceMonthly: string
  category: string
  imageFileId: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type Reservation = {
  rowNumber: number
  id: string
  artworkId: string
  customerEmail: string
  status: ReservationStatus
  requestedAt: string
  acceptedAt: string
  endedAt: string
  updatedAt: string
}

export type DatabaseSnapshot = {
  users: BackendUser[]
  artworks: Artwork[]
  reservations: Reservation[]
}

export type ArtworkInput = {
  title: string
  description: string
  priceMonthly: string
  category: string
}

const SPREADSHEET_ID = '12F0kf0pVO-DcOIwoVbR49SgdJGr-DSZl0CdU-jVVwpI'
const IMAGES_FOLDER_ID = '1D2MBmtvGUYpc4i8Hg9ul0ki34ObBezmv'
const ARTWORKS_SHEET_ID = 1001
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`

export const DATABASE_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`

export class GoogleApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GoogleApiError'
    this.status = status
  }
}

function headers(accessToken: string, contentType = 'application/json') {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': contentType,
  }
}

async function apiFetch(accessToken: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers(accessToken),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let detail = ''
    try {
      const payload = await response.json() as { error?: { message?: string } }
      detail = payload.error?.message ?? ''
    } catch {
      // Google sometimes returns an empty body, especially for DELETE.
    }
    throw new GoogleApiError(detail || `Google API Fehler (${response.status})`, response.status)
  }

  return response
}

function text(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function bool(value: unknown) {
  if (typeof value === 'boolean') return value
  return text(value).toLowerCase() === 'true'
}

function role(value: unknown): UserRole | null {
  const normalized = text(value).toLowerCase()
  return normalized === 'artist' || normalized === 'customer' ? normalized : null
}

function reservationStatus(value: unknown): ReservationStatus {
  const normalized = text(value).toLowerCase()
  if (normalized === 'active' || normalized === 'cancelled' || normalized === 'returned') return normalized
  return 'requested'
}

function rowsFromRange(valueRanges: Array<{ range?: string; values?: unknown[][] }> | undefined, sheet: string) {
  const entry = valueRanges?.find((range) => range.range?.startsWith(`${sheet}!`))
  return entry?.values ?? []
}

export async function loadDatabase(accessToken: string): Promise<DatabaseSnapshot> {
  const params = new URLSearchParams()
  params.append('ranges', 'Users!A2:D1000')
  params.append('ranges', 'Artworks!A2:J1000')
  params.append('ranges', 'Reservations!A2:H1000')
  params.set('valueRenderOption', 'UNFORMATTED_VALUE')

  const response = await apiFetch(accessToken, `${SHEETS_BASE}/values:batchGet?${params.toString()}`)
  const payload = await response.json() as { valueRanges?: Array<{ range?: string; values?: unknown[][] }> }

  const users = rowsFromRange(payload.valueRanges, 'Users')
    .map((row, index): BackendUser => ({
      rowNumber: index + 2,
      email: text(row[0]).toLowerCase(),
      role: role(row[1]),
      active: bool(row[2]),
      displayName: text(row[3]),
    }))
    .filter((user) => user.email)

  const artworks = rowsFromRange(payload.valueRanges, 'Artworks')
    .map((row, index): Artwork => ({
      rowNumber: index + 2,
      id: text(row[0]),
      title: text(row[1]),
      description: text(row[2]),
      artistEmail: text(row[3]).toLowerCase(),
      priceMonthly: text(row[4]),
      category: text(row[5]),
      imageFileId: text(row[6]),
      active: bool(row[7]),
      createdAt: text(row[8]),
      updatedAt: text(row[9]),
    }))
    .filter((artwork) => artwork.id)

  const reservations = rowsFromRange(payload.valueRanges, 'Reservations')
    .map((row, index): Reservation => ({
      rowNumber: index + 2,
      id: text(row[0]),
      artworkId: text(row[1]),
      customerEmail: text(row[2]).toLowerCase(),
      status: reservationStatus(row[3]),
      requestedAt: text(row[4]),
      acceptedAt: text(row[5]),
      endedAt: text(row[6]),
      updatedAt: text(row[7]),
    }))
    .filter((reservation) => reservation.id)

  return { users, artworks, reservations }
}

async function appendValues(accessToken: string, range: string, values: unknown[]) {
  const encodedRange = encodeURIComponent(range)
  await apiFetch(
    accessToken,
    `${SHEETS_BASE}/values/${encodedRange}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [values] }),
    },
  )
}

async function updateValues(accessToken: string, range: string, values: unknown[]) {
  const encodedRange = encodeURIComponent(range)
  await apiFetch(
    accessToken,
    `${SHEETS_BASE}/values/${encodedRange}?valueInputOption=RAW`,
    {
      method: 'PUT',
      body: JSON.stringify({ range, majorDimension: 'ROWS', values: [values] }),
    },
  )
}

export async function createArtwork(
  accessToken: string,
  artistEmail: string,
  input: ArtworkInput,
  imageFileId: string,
) {
  const now = new Date().toISOString()
  await appendValues(accessToken, 'Artworks!A:J', [
    `art-${crypto.randomUUID()}`,
    input.title,
    input.description,
    artistEmail.toLowerCase(),
    input.priceMonthly,
    input.category,
    imageFileId,
    true,
    now,
    now,
  ])
}

export async function updateArtwork(
  accessToken: string,
  artwork: Artwork,
  input: ArtworkInput,
  imageFileId: string,
) {
  await updateValues(accessToken, `Artworks!A${artwork.rowNumber}:J${artwork.rowNumber}`, [
    artwork.id,
    input.title,
    input.description,
    artwork.artistEmail,
    input.priceMonthly,
    input.category,
    imageFileId,
    true,
    artwork.createdAt,
    new Date().toISOString(),
  ])
}

export async function deleteArtworkRow(accessToken: string, artwork: Artwork) {
  await apiFetch(accessToken, `${SHEETS_BASE}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: ARTWORKS_SHEET_ID,
              dimension: 'ROWS',
              startIndex: artwork.rowNumber - 1,
              endIndex: artwork.rowNumber,
            },
          },
        },
      ],
    }),
  })
}

export async function createReservation(accessToken: string, artworkId: string, customerEmail: string) {
  const now = new Date().toISOString()
  await appendValues(accessToken, 'Reservations!A:H', [
    `res-${crypto.randomUUID()}`,
    artworkId,
    customerEmail.toLowerCase(),
    'requested',
    now,
    '',
    '',
    now,
  ])
}

export async function setReservationStatus(
  accessToken: string,
  reservation: Reservation,
  status: ReservationStatus,
) {
  const now = new Date().toISOString()
  const acceptedAt = status === 'active' ? now : reservation.acceptedAt
  const endedAt = status === 'cancelled' || status === 'returned' ? now : reservation.endedAt

  await updateValues(accessToken, `Reservations!A${reservation.rowNumber}:H${reservation.rowNumber}`, [
    reservation.id,
    reservation.artworkId,
    reservation.customerEmail,
    status,
    reservation.requestedAt,
    acceptedAt,
    endedAt,
    now,
  ])
}

export async function uploadArtworkImage(accessToken: string, file: File) {
  const boundary = `rentart_${crypto.randomUUID().split('-').join('')}`
  const metadata = {
    name: `${Date.now()}-${file.name}`,
    mimeType: file.type || 'application/octet-stream',
    parents: [IMAGES_FOLDER_ID],
  }
  const body = new Blob([
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${metadata.mimeType}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ])

  const response = await apiFetch(
    accessToken,
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  const payload = await response.json() as { id?: string }
  if (!payload.id) throw new Error('Google Drive hat keine Datei-ID zurückgegeben.')
  return payload.id
}

export async function deleteDriveFile(accessToken: string, fileId: string) {
  if (!fileId) return
  await apiFetch(accessToken, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  })
}

export async function loadDriveImageUrl(accessToken: string, fileId: string) {
  const response = await apiFetch(
    accessToken,
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
  )
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}
