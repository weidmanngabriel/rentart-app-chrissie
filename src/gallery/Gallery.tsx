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
type Area = 'gallery' | 'favorites' | 'mine' | 'profile'

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

function favoriteStorageKey(email: string) {
  return `rentart:favorites:${email.toLowerCase()}`
}

export default function Gallery({ accessToken, currentUser, database, onRefresh, onAccessExpired }: GalleryProps) {
  const [area, setArea] = useState<Area>('gallery')
  const [category, setCategory] = useState('Alle Werke')
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [formOpen, setFormOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const isArtist = currentUser.role === 'artist'
  const activeArtworks = useMemo(() => database.artworks.filter((artwork) => artwork.active), [database.artworks])
  const categories = useMemo(() => {
    const values = Array.from(new Set(activeArtworks.map((artwork) => artwork.category).filter(Boolean)))
    return ['Alle Werke', ...values]
  }, [activeArtworks])
  const visibleArtworks = category === 'Alle Werke'
    ? activeArtworks
    : activeArtworks.filter((artwork) => artwork.category === category)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(favoriteStorageKey(currentUser.email)) || '[]')
      setFavoriteIds(Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [])
    } catch {
      setFavoriteIds([])
    }
  }, [currentUser.email])

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

  const favoriteArtworks = useMemo(
    () => activeArtworks.filter((artwork) => favoriteIds.includes(artwork.id)),
    [activeArtworks, favoriteIds],
  )

  const ownArtworks = useMemo(
    () => activeArtworks.filter((artwork) => artwork.artistEmail === currentUser.email),
    [activeArtworks, currentUser.email],
  )

  const ownReservations = useMemo(
    () => database.reservations.filter((reservation) => reservation.customerEmail === currentUser.email && isOpenReservation(reservation)),
    [database.reservations, currentUser.email],
  )

  const ownReservedArtworks = useMemo(() => {
    const ids = new Set(ownReservations.map((reservation) => reservation.artworkId))
    return activeArtworks.filter((artwork) => ids.has(artwork.id))
  }, [activeArtworks, ownReservations])

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

  const toggleFavorite = (artworkId: string) => {
    setFavoriteIds((current) => {
      const next = current.includes(artworkId) ? current.filter((id) => id !== artworkId) : [...current, artworkId]
      localStorage.setItem(favoriteStorageKey(currentUser.email), JSON.stringify(next))
      return next
    })
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

  const renderArtworkCard = (artwork: Artwork) => {
    const reservation = openReservationByArtwork.get(artwork.id)
    const ownReservation = reservation?.customerEmail === currentUser.email
    const favorite = favoriteIds.includes(artwork.id)

    return (
      <article className="work-card backend-work-card" key={artwork.id}>
        <div className="backend-work-image">
          <DriveImage accessToken={accessToken} artwork={artwork} />
          <button
            className={`favorite-button ${favorite ? 'is-favorite' : ''}`}
            onClick={() => toggleFavorite(artwork.id)}
            aria-label={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            title={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            {favorite ? '♥' : '♡'}
          </button>
        </div>
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
              {artwork.artistEmail === currentUser.email && <button onClick={() => openEdit(artwork)} disabled={!!busy}>Bearbeiten</button>}
              {artwork.artistEmail === currentUser.email && <button className="danger" onClick={() => deleteArtwork(artwork)} disabled={!!busy}>Löschen</button>}
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
  }

  const areaItems: Array<{ id: Area; label: string; hint: string }> = [
    { id: 'gallery', label: 'Kunstwerke', hint: 'Alle verfügbaren Werke entdecken' },
    { id: 'favorites', label: 'Favoriten', hint: `${favoriteIds.length} gespeicherte Werke` },
    { id: 'mine', label: isArtist ? 'Meine Kunstwerke' : 'Meine Anfragen', hint: isArtist ? 'Eigene Werke verwalten' : 'Offene Reservierungen ansehen' },
    { id: 'profile', label: 'Mein Profil', hint: 'Konto und Rolle ansehen' },
  ]

  const sectionTitle = area === 'favorites'
    ? <>Deine <em>Favoriten.</em></>
    : area === 'mine'
      ? isArtist ? <>Meine <em>Kunstwerke.</em></> : <>Meine <em>Anfragen.</em></>
      : area === 'profile'
        ? <>Mein <em>Profil.</em></>
        : isArtist ? <>Galerie <em>verwalten.</em></> : <>Kunst <em>entdecken.</em></>

  return (
    <>
      <div className="app-area-nav" aria-label="RentArt Bereiche">
        {areaItems.map((item) => (
          <button key={item.id} className={`app-area-button ${area === item.id ? 'is-active' : ''}`} onClick={() => setArea(item.id)}>
            <strong>{item.label}</strong>
            <small>{item.hint}</small>
          </button>
        ))}
      </div>

      <div className="section-heading backend-gallery-heading">
        <div>
          <p className="eyebrow">Dein RentArt Bereich</p>
          <h2>{sectionTitle}</h2>
        </div>
        {area === 'mine' && isArtist && <button className="button button-primary compact" onClick={openCreate}>+ Werk hinzufügen</button>}
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

      {area === 'profile' && (
        <div className="profile-panel">
          <div className="profile-avatar" aria-hidden="true">{(currentUser.displayName || currentUser.email).charAt(0).toUpperCase()}</div>
          <div>
            <span className={`role-badge ${isArtist ? 'artist' : 'customer'}`}>{roleLabel(currentUser.role)}</span>
            <h3>{currentUser.displayName || currentUser.email}</h3>
            <p>{currentUser.email}</p>
            <small>Profilinformationen kommen aktuell aus deinem Google-Konto und dem RentArt-Users-Sheet.</small>
          </div>
        </div>
      )}

      {area === 'gallery' && (
        <>
          {categories.length > 1 && (
            <div className="filter-row" role="group" aria-label="Kollektion filtern">
              {categories.map((item) => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          )}
          {visibleArtworks.length === 0 ? (
            <div className="backend-empty"><p className="eyebrow">Galerie</p><h3>Noch keine Werke vorhanden.</h3><p>Sobald Werke eingestellt sind, erscheinen sie hier.</p></div>
          ) : <div className="art-grid backend-art-grid">{visibleArtworks.map(renderArtworkCard)}</div>}
        </>
      )}

      {area === 'favorites' && (
        favoriteArtworks.length === 0 ? (
          <div className="backend-empty"><p className="eyebrow">Favoriten</p><h3>Noch keine Favoriten.</h3><p>Tippe bei einem Kunstwerk auf das Herz. Deine Auswahl wird auf diesem Gerät gespeichert.</p><button className="button button-primary" onClick={() => setArea('gallery')}>Kunstwerke entdecken</button></div>
        ) : <div className="art-grid backend-art-grid">{favoriteArtworks.map(renderArtworkCard)}</div>
      )}

      {area === 'mine' && (
        isArtist ? (
          ownArtworks.length === 0 ? (
            <div className="backend-empty"><p className="eyebrow">Meine Kunstwerke</p><h3>Noch keine eigenen Werke.</h3><p>Lege dein erstes Werk an. Bild und Daten werden direkt in Google Drive und Google Sheets gespeichert.</p><button className="button button-primary" onClick={openCreate}>Erstes Werk hinzufügen</button></div>
          ) : <div className="art-grid backend-art-grid">{ownArtworks.map(renderArtworkCard)}</div>
        ) : ownReservedArtworks.length === 0 ? (
          <div className="backend-empty"><p className="eyebrow">Meine Anfragen</p><h3>Keine offenen Anfragen.</h3><p>Deine offenen oder angenommenen Reservierungen erscheinen hier.</p><button className="button button-primary" onClick={() => setArea('gallery')}>Kunstwerke entdecken</button></div>
        ) : <div className="art-grid backend-art-grid">{ownReservedArtworks.map(renderArtworkCard)}</div>
      )}
    </>
  )
}
