import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createArtwork,
  createReservation,
  deleteArtworkRow,
  deleteDriveFile,
  loadDriveImageUrl,
  setReservationStatus,
  updateArtwork,
  uploadArtworkImage,
  type Artwork,
  type ArtworkInput,
  type BackendUser,
  type DatabaseSnapshot,
  type Reservation,
} from '../data/googleData'

type GalleryProps = {
  accessToken: string
  currentUser: BackendUser
  database: DatabaseSnapshot
  onRefresh: () => Promise<void>
  onAccessExpired: () => void
}

type Draft = ArtworkInput & { image: File | null }

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  priceMonthly: '',
  category: 'Abstrakt',
  image: null,
}

function isOpenReservation(reservation: Reservation) {
  return reservation.status === 'requested' || reservation.status === 'active'
}

function DriveImage({ accessToken, artwork }: { accessToken: string; artwork: Artwork }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let currentUrl: string | null = null
    setImageUrl(null)

    if (!artwork.imageFileId) return

    loadDriveImageUrl(accessToken, artwork.imageFileId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        currentUrl = url
        setImageUrl(url)
      })
      .catch(() => setImageUrl(null))

    return () => {
      cancelled = true
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [accessToken, artwork.imageFileId])

  return imageUrl ? (
    <img className="backend-artwork-image" src={imageUrl} alt={artwork.title} />
  ) : (
    <div className="backend-artwork-placeholder" aria-label={`Kein Bild für ${artwork.title}`}>
      <span>RENTART</span>
    </div>
  )
}

function formatPrice(value: string) {
  const number = Number(value.replace(',', '.'))
  if (Number.isFinite(number) && value.trim()) return `${number.toLocaleString('de-DE')} €`
  return value ? `${value} €` : 'Preis offen'
}

function roleLabel(role: BackendUser['role']) {
  return role === 'artist' ? 'Künstler' : 'Mieter'
}

export default function Gallery({ accessToken, currentUser, database, onRefresh, onAccessExpired }: GalleryProps) {
  const [category, setCategory] = useState('Alle Werke')
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [formOpen, setFormOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeArtworks = useMemo(() => database.artworks.filter((artwork) => artwork.active), [database.artworks])
  const categories = useMemo(() => {
    const values = Array.from(new Set(activeArtworks.map((artwork) => artwork.category).filter(Boolean)))
    return ['Alle Werke', ...values]
  }, [activeArtworks])
  const visibleArtworks = category === 'Alle Werke'
    ? activeArtworks
    : activeArtworks.filter((artwork) => artwork.category === category)

  const openReservationByArtwork = useMemo(() => {
    const map = new Map<string, Reservation>()
    for (const reservation of database.reservations.filter(isOpenReservation)) {
      const existing = map.get(reservation.artworkId)
      if (!existing || reservation.status === 'active') map.set(reservation.artworkId, reservation)
    }
    return map
  }, [database.reservations])

  const artistNameByEmail = useMemo(() => {
    return new Map(database.users.map((user) => [user.email, user.displayName || user.email]))
  }, [database.users])

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusy(key)
    setError(null)
    try {
      await action()
      await onRefresh()
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Aktion fehlgeschlagen.'
      setError(message)
      if (message.includes('(401)') || message.toLowerCase().includes('unauthorized')) onAccessExpired()
    } finally {
      setBusy(null)
    }
  }

  const openCreate = () => {
    setEditingArtwork(null)
    setDraft(EMPTY_DRAFT)
    setFormOpen(true)
  }

  const openEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork)
    setDraft({
      title: artwork.title,
      description: artwork.description,
      priceMonthly: artwork.priceMonthly,
      category: artwork.category || 'Abstrakt',
      image: null,
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    if (busy) return
    setFormOpen(false)
    setEditingArtwork(null)
    setDraft(EMPTY_DRAFT)
  }

  const saveArtwork = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim() || !draft.priceMonthly.trim()) {
      setError('Titel und Monatspreis sind erforderlich.')
      return
    }
    if (!editingArtwork && !draft.image) {
      setError('Bitte wähle ein Bild aus.')
      return
    }

    await runAction('save-artwork', async () => {
      let uploadedImageId: string | null = null
      try {
        if (draft.image) uploadedImageId = await uploadArtworkImage(accessToken, draft.image)
        const input: ArtworkInput = {
          title: draft.title.trim(),
          description: draft.description.trim(),
          priceMonthly: draft.priceMonthly.trim().replace(',', '.'),
          category: draft.category.trim(),
        }

        if (editingArtwork) {
          const imageFileId = uploadedImageId || editingArtwork.imageFileId
          await updateArtwork(accessToken, editingArtwork, input, imageFileId)
          if (uploadedImageId && editingArtwork.imageFileId) {
            deleteDriveFile(accessToken, editingArtwork.imageFileId).catch(() => undefined)
          }
        } else {
          await createArtwork(accessToken, currentUser.email, input, uploadedImageId || '')
        }
        setFormOpen(false)
        setEditingArtwork(null)
        setDraft(EMPTY_DRAFT)
      } catch (saveError) {
        if (uploadedImageId) deleteDriveFile(accessToken, uploadedImageId).catch(() => undefined)
        throw saveError
      }
    })
  }

  const deleteArtwork = async (artwork: Artwork) => {
    if (!window.confirm(`„${artwork.title}“ wirklich löschen?`)) return
    await runAction(`delete-${artwork.id}`, async () => {
      const openReservations = database.reservations.filter(
        (reservation) => reservation.artworkId === artwork.id && isOpenReservation(reservation),
      )
      for (const reservation of openReservations) {
        await setReservationStatus(accessToken, reservation, 'cancelled')
      }
      await deleteArtworkRow(accessToken, artwork)
      if (artwork.imageFileId) deleteDriveFile(accessToken, artwork.imageFileId).catch(() => undefined)
    })
  }

  const requestArtwork = (artwork: Artwork) => runAction(`request-${artwork.id}`, () =>
    createReservation(accessToken, artwork.id, currentUser.email),
  )

  const changeReservation = (reservation: Reservation, status: 'active' | 'cancelled' | 'returned') =>
    runAction(`${status}-${reservation.id}`, () => setReservationStatus(accessToken, reservation, status))

  const isArtist = currentUser.role === 'artist'

  return (
    <>
      <div className="section-heading backend-gallery-heading">
        <div>
          <p className="eyebrow">Deine nächste Wand</p>
          <h2>{isArtist ? <>Galerie<br /><em>verwalten.</em></> : <>Etwas Schönes<br /><em>wartet auf dich.</em></>}</h2>
        </div>
        <div className="role-summary">
          <span className={`role-badge ${isArtist ? 'artist' : 'customer'}`}>{roleLabel(currentUser.role)}</span>
          <strong>{currentUser.displayName || currentUser.email}</strong>
          <small>{currentUser.email}</small>
          {isArtist && <button className="button button-primary compact" onClick={openCreate}>+ Werk hinzufügen</button>}
        </div>
      </div>

      {error && <div className="data-message error" role="alert">{error}</div>}

      {formOpen && isArtist && (
        <form className="artwork-form" onSubmit={saveArtwork}>
          <div className="artwork-form-heading">
            <div><p className="eyebrow">Künstlerbereich</p><h3>{editingArtwork ? 'Werk bearbeiten' : 'Neues Werk'}</h3></div>
            <button type="button" className="text-link" onClick={closeForm}>Schließen ×</button>
          </div>
          <label>Titel<input value={draft.title} onChange={(event: { target: HTMLInputElement }) => setDraft({ ...draft, title: event.target.value })} required /></label>
          <label>Beschreibung<textarea value={draft.description} onChange={(event: { target: HTMLTextAreaElement }) => setDraft({ ...draft, description: event.target.value })} rows={3} /></label>
          <div className="artwork-form-grid">
            <label>Preis / Monat<input type="number" min="0" step="0.01" value={draft.priceMonthly} onChange={(event: { target: HTMLInputElement }) => setDraft({ ...draft, priceMonthly: event.target.value })} required /></label>
            <label>Kategorie<select value={draft.category} onChange={(event: { target: HTMLSelectElement }) => setDraft({ ...draft, category: event.target.value })}><option>Abstrakt</option><option>Fotografie</option><option>Grafik</option><option>Malerei</option></select></label>
          </div>
          <label>Bild {editingArtwork && <small>(leer lassen, um das bestehende Bild zu behalten)</small>}<input type="file" accept="image/*" onChange={(event: { target: HTMLInputElement }) => setDraft({ ...draft, image: event.target.files?.[0] ?? null })} /></label>
          <button className="button button-dark" disabled={busy === 'save-artwork'}>{busy === 'save-artwork' ? 'Speichert …' : 'Werk speichern'}</button>
        </form>
      )}

      {categories.length > 1 && (
        <div className="filter-row" role="group" aria-label="Kollektion filtern">
          {categories.map((item) => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      )}

      {visibleArtworks.length === 0 ? (
        <div className="backend-empty">
          <p className="eyebrow">Galerie</p>
          <h3>Noch keine Werke vorhanden.</h3>
          <p>{isArtist ? 'Lege das erste Werk an. Bild und Daten werden direkt in Google Drive und Google Sheets gespeichert.' : 'Sobald ein Künstler Werke einstellt, erscheinen sie hier.'}</p>
          {isArtist && <button className="button button-primary" onClick={openCreate}>Erstes Werk hinzufügen</button>}
        </div>
      ) : (
        <div className="art-grid backend-art-grid">
          {visibleArtworks.map((artwork) => {
            const reservation = openReservationByArtwork.get(artwork.id)
            const ownReservation = reservation?.customerEmail === currentUser.email
            return (
              <article className="work-card backend-work-card" key={artwork.id}>
                <div className="backend-work-image"><DriveImage accessToken={accessToken} artwork={artwork} /></div>
                <div className="work-meta backend-work-meta">
                  <div>
                    <span className="artwork-status">{reservation?.status === 'requested' ? 'Angefragt' : reservation?.status === 'active' ? 'Reserviert' : 'Verfügbar'}</span>
                    <h3>{artwork.title}</h3>
                    <p>{artistNameByEmail.get(artwork.artistEmail) || artwork.artistEmail} · {artwork.category}</p>
                    {artwork.description && <p className="artwork-description">{artwork.description}</p>}
                  </div>
                  <strong>{formatPrice(artwork.priceMonthly)}<small>/ Monat</small></strong>
                </div>

                {isArtist ? (
                  <div className="artwork-actions artist-actions">
                    {reservation?.status === 'requested' && (
                      <div className="reservation-note"><strong>Anfrage</strong><span>{reservation.customerEmail}</span></div>
                    )}
                    {reservation?.status === 'active' && (
                      <div className="reservation-note"><strong>Reserviert für</strong><span>{reservation.customerEmail}</span></div>
                    )}
                    <div className="action-row">
                      {reservation?.status === 'requested' && <><button onClick={() => changeReservation(reservation, 'active')} disabled={!!busy}>Annehmen</button><button onClick={() => changeReservation(reservation, 'cancelled')} disabled={!!busy}>Ablehnen</button></>}
                      {reservation?.status === 'active' && <button onClick={() => changeReservation(reservation, 'returned')} disabled={!!busy}>Rückgabe bestätigen</button>}
                      <button onClick={() => openEdit(artwork)} disabled={!!busy}>Bearbeiten</button>
                      <button className="danger" onClick={() => deleteArtwork(artwork)} disabled={!!busy}>Löschen</button>
                    </div>
                  </div>
                ) : (
                  <div className="artwork-actions customer-actions">
                    {!reservation && <button className="button button-dark" onClick={() => requestArtwork(artwork)} disabled={!!busy}>Reservierung anfragen</button>}
                    {reservation?.status === 'requested' && ownReservation && <><span>Deine Anfrage ist offen.</span><button onClick={() => changeReservation(reservation, 'cancelled')} disabled={!!busy}>Anfrage zurückziehen</button></>}
                    {reservation?.status === 'requested' && !ownReservation && <span>Aktuell angefragt.</span>}
                    {reservation?.status === 'active' && ownReservation && <span>Für dich reserviert.</span>}
                    {reservation?.status === 'active' && !ownReservation && <span>Aktuell reserviert.</span>}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
