import { useEffect, useMemo, useRef, useState } from 'react'
import {
  readActiveGoogleAccount,
  readStoredGoogleAccounts,
  removeGoogleAccount,
  setActiveGoogleAccount,
  storeGoogleAccount,
  type GoogleUser,
} from './auth/google'
import {
  clearGoogleAccessSession,
  readGoogleAccessIdentity,
  readGoogleAccessSession,
  requestGoogleAccessToken,
  storeGoogleAccessSession,
} from './auth/googleAccess'
import Gallery from './gallery/Gallery'
import { GoogleApiError, loadDatabase, type DatabaseSnapshot } from './data/googleData'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function Brand() {
  return <a className="brand" href="#top" aria-label="RentArt Startseite"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>rent<span>art</span></span></a>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accounts, setAccounts] = useState<GoogleUser[]>([])
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [googleReady, setGoogleReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [database, setDatabase] = useState<DatabaseSnapshot | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [authorizing, setAuthorizing] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const addGoogleButtonRef = useRef<HTMLDivElement>(null)

  const authorizeGoogleDataAccess = async (targetUser: GoogleUser) => {
    if (!GOOGLE_CLIENT_ID) return
    setAuthorizing(true)
    setDataError(null)
    try {
      const { accessToken: token, expiresInSeconds } = await requestGoogleAccessToken(GOOGLE_CLIENT_ID, targetUser.email)
      const identity = await readGoogleAccessIdentity(token)
      if (identity.email !== targetUser.email.toLowerCase()) {
        throw new Error(`Bitte wähle für den Datenzugriff dasselbe Google-Konto (${targetUser.email}).`)
      }
      storeGoogleAccessSession(token, identity.email, expiresInSeconds)
      setAccessToken(token)
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Google-Datenzugriff konnte nicht aktiviert werden.')
    } finally {
      setAuthorizing(false)
    }
  }

  useEffect(() => {
    const storedAccounts = readStoredGoogleAccounts()
    setAccounts(storedAccounts)
    setUser(readActiveGoogleAccount(storedAccounts))
  }, [])

  useEffect(() => {
    if (!user || accessToken) return
    const storedAccessToken = readGoogleAccessSession(user.email)
    if (storedAccessToken) setAccessToken(storedAccessToken)
  }, [user, accessToken])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const initializeGoogle = () => {
      if (!window.google?.accounts.id) return false
      const target = user ? addGoogleButtonRef.current : googleButtonRef.current
      if (!target) return false

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: ({ credential }) => {
          const nextUser = storeGoogleAccount(credential)
          if (!nextUser) return
          const nextAccounts = readStoredGoogleAccounts()
          setAccounts(nextAccounts)
          setUser(nextUser)
          setAccessToken(null)
          setDatabase(null)
          setDataError(null)
          void authorizeGoogleDataAccess(nextUser)
        },
      })

      target.replaceChildren()
      window.google.accounts.id.renderButton(target, {
        type: 'standard',
        theme: 'outline',
        size: 'medium',
        shape: 'pill',
        text: user ? 'continue_with' : 'signin_with',
        locale: 'de',
        width: 205,
      })
      setGoogleReady(true)
      return true
    }

    setGoogleReady(false)
    if (initializeGoogle()) return
    const timer = window.setInterval(() => {
      if (initializeGoogle()) window.clearInterval(timer)
    }, 150)
    return () => window.clearInterval(timer)
  }, [user?.email])

  const refreshDatabase = async () => {
    if (!accessToken) return
    setDataLoading(true)
    setDataError(null)
    try {
      const snapshot = await loadDatabase(accessToken)
      setDatabase(snapshot)
    } catch (error) {
      if (error instanceof GoogleApiError && error.status === 401) {
        if (user) clearGoogleAccessSession(user.email)
        setAccessToken(null)
        setDatabase(null)
        setDataError('Der Google-Datenzugriff ist abgelaufen. Bitte aktiviere ihn erneut.')
      } else {
        setDataError(error instanceof Error ? error.message : 'Die Google-Daten konnten nicht geladen werden.')
      }
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (!accessToken) return
    void refreshDatabase()
  }, [accessToken])

  const backendUser = useMemo(() => {
    if (!user || !database) return null
    const match = database.users.find((entry) => entry.email === user.email.toLowerCase())
    if (!match) return null
    return { ...match, displayName: match.displayName || user.name }
  }, [database, user])

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const activateDataAccess = () => {
    if (!user) return
    void authorizeGoogleDataAccess(user)
  }

  const switchAccount = (nextUser: GoogleUser) => {
    if (nextUser.email.toLowerCase() === user?.email.toLowerCase()) return
    setActiveGoogleAccount(nextUser.email)
    setUser(nextUser)
    setAccessToken(null)
    setDatabase(null)
    setDataError(null)
  }

  const logout = () => {
    if (!user) return
    clearGoogleAccessSession(user.email)
    const { accounts: nextAccounts, active } = removeGoogleAccount(user.email)
    setAccounts(nextAccounts)
    setAccessToken(null)
    setDatabase(null)
    setDataError(null)
    setUser(active)
    if (!active) {
      window.google?.accounts.id.disableAutoSelect()
      setGoogleReady(false)
    }
  }

  const renderGallery = () => {
    if (!user) {
      return (
        <div className="login-gate">
          <div className="login-gate-art" aria-hidden="true"><span>PRIVATE<br /><em>COLLECTION</em></span><small>RENTART / ACCESS</small></div>
          <div className="login-gate-copy">
            <p className="eyebrow">Galerie</p>
            <h2>Deine Auswahl.<br /><em>Nur einen Login entfernt.</em></h2>
            <p>Die Galerie ist nur für angemeldete Nutzer sichtbar. Melde dich oben im Header mit deinem Google-Konto an.</p>
            <small className="privacy-note">Die Anmeldung läuft direkt über Google. RentArt speichert kein Passwort.</small>
          </div>
        </div>
      )
    }

    if (!accessToken) {
      return (
        <div className="data-access-gate">
          <p className="eyebrow">Google Backend</p>
          <h3>Datenzugriff aktivieren</h3>
          <p>Direkt nach dem Google-Login fordert RentArt automatisch die nötige Freigabe für Google Sheets und Drive an. Falls das Google-Fenster geschlossen oder vom Browser verhindert wurde, kannst du die Freigabe hier erneut starten.</p>
          {dataError && <div className="data-message error" role="alert">{dataError}</div>}
          <button className="button button-primary" onClick={activateDataAccess} disabled={authorizing}>{authorizing ? 'Google wird geöffnet …' : 'Google-Daten freigeben'}</button>
        </div>
      )
    }

    if (dataLoading && !database) return <div className="data-message info">Galerie wird aus Google Sheets geladen …</div>
    if (dataError && !database) return <div className="data-message error" role="alert">{dataError}</div>
    if (!database) return null

    if (!backendUser || !backendUser.active || !backendUser.role) {
      return (
        <div className="role-missing">
          <p className="eyebrow">Zugriff nicht eingerichtet</p>
          <h3>Dieser Google-Account hat noch keine aktive RentArt-Rolle.</h3>
          <p>Trage im Google Sheet im Tab <strong>Users</strong> eine Zeile für <code>{user.email}</code> ein. Setze <strong>role</strong> auf <code>artist</code> oder <code>customer</code> und <strong>active</strong> auf TRUE.</p>
          <button className="button button-dark" onClick={refreshDatabase}>Rolle neu laden</button>
        </div>
      )
    }

    return (
      <Gallery
        accessToken={accessToken}
        currentUser={backendUser}
        database={database}
        onRefresh={refreshDatabase}
        onAccessExpired={() => {
          clearGoogleAccessSession(user.email)
          setAccessToken(null)
          setDatabase(null)
        }}
      />
    )
  }

  return (
    <div id="top">
      <header className="site-header">
        <Brand />
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Hauptnavigation">
          <button onClick={() => scrollTo('#entdecken')}>Galerie</button>
          <button onClick={() => scrollTo('#so-funktionierts')}>So funktioniert's</button>
          <button onClick={() => scrollTo('#story')}>Unsere Idee</button>
        </nav>
        <div className="header-auth">
          {user ? (
            <details className="account-menu">
              <summary className="account-trigger" aria-label="Google-Konto öffnen">
                {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span className="account-initial">{user.name.charAt(0)}</span>}
                <span className="account-trigger-copy">{user.name}</span>
                <span className="account-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="account-popover">
                <div className="account-popover-user">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                  {backendUser?.active && backendUser.role && <small>{backendUser.role === 'artist' ? 'Künstler' : 'Mieter'}</small>}
                </div>
                {accounts.length > 1 && (
                  <div className="account-switcher" aria-label="Gespeicherte Google-Konten">
                    <small className="account-section-label">Konto wechseln</small>
                    {accounts.map((account) => {
                      const active = account.email.toLowerCase() === user.email.toLowerCase()
                      return (
                        <button className={`account-option ${active ? 'is-active' : ''}`} key={account.sub} onClick={() => switchAccount(account)} disabled={active}>
                          {account.picture ? <img src={account.picture} alt="" referrerPolicy="no-referrer" /> : <span className="account-option-initial">{account.name.charAt(0)}</span>}
                          <span><strong>{account.name}</strong><small>{account.email}</small></span>
                          {active && <b aria-label="Aktiv">✓</b>}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="account-add">
                  <small className="account-section-label">Weiteres Konto hinzufügen</small>
                  <div className="google-button account-add-google" ref={addGoogleButtonRef} aria-label="Weiteres Google-Konto hinzufügen" />
                  {!googleReady && <span className="account-add-loading">Google wird geladen …</span>}
                </div>
                <button className="logout-button" onClick={logout}>Dieses Konto abmelden</button>
              </div>
            </details>
          ) : GOOGLE_CLIENT_ID ? (
            <div className="google-login-wrap">
              <div className="google-button" ref={googleButtonRef} aria-label="Mit Google anmelden" />
              {!googleReady && <span className="google-loading" aria-hidden="true" />}
            </div>
          ) : (
            <span className="login-unavailable">Login nicht konfiguriert</span>
          )}
        </div>
        <button className="menu-toggle" aria-label="Menü öffnen" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> Kunst neu gedacht</p>
            <h1>Räume, die<br /><em>etwas erzählen.</em></h1>
            <p className="hero-text">Entdecke Kunst, die zu dir passt. Miete besondere Werke von lokalen Künstlern — flexibel, fair und ohne Risiko.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => scrollTo('#entdecken')}>{user ? 'Galerie öffnen' : 'Zur Galerie'} <span>↗</span></button>
              <button className="text-link" onClick={() => scrollTo('#so-funktionierts')}>Wie funktioniert's? <span>→</span></button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true"><span>J</span><span>M</span><span>L</span><span>+</span></div>
              <p><strong>240+</strong> Menschen haben<br />ihre Wände neu entdeckt.</p>
            </div>
          </div>
          <div className="hero-art" aria-label="Abstrakte Kunstcollage">
            <div className="art-shadow" />
            <div className="art-card art-card-main"><div className="art-shape art-circle" /><div className="art-shape art-arch" /><div className="art-shape art-line" /><span className="art-signature">No. 014 / 2024</span></div>
            <div className="art-card art-card-side"><div className="side-sun" /><div className="side-horizon" /><div className="side-mountain" /></div>
            <div className="art-label">curated<br /><strong>locally</strong></div>
            <span className="floating-note">Kunst für<br /><em>dein Jetzt</em> ↗</span>
          </div>
        </section>

        <section className="marquee" aria-label="RentArt Werte"><div className="marquee-track"><span>BEDEUTUNGSVOLL</span><b>✳</b><span>LOKAL</span><b>✳</b><span>FLEXIBEL</span><b>✳</b><span>BEDEUTUNGSVOLL</span><b>✳</b><span>LOKAL</span><b>✳</b><span>FLEXIBEL</span></div></section>

        <section className="discover section-wrap" id="entdecken">{renderGallery()}</section>

        <section className="how section-wrap" id="so-funktionierts">
          <div className="how-visual"><div className="how-number">01</div><div className="how-poster"><span>MAKE<br /><em>SPACE</em><br />FOR ART</span><small>RENTART / 001</small></div><div className="scribble">easy does it <span>↗</span></div></div>
          <div className="how-copy"><p className="eyebrow">So einfach geht's</p><h2>Kunst darf sich<br /><em>leicht anfühlen.</em></h2><div className="steps"><div className="step"><b>01</b><div><h3>Finde dein Werk</h3><p>Melde dich an und stöbere durch unsere Auswahl.</p></div></div><div className="step"><b>02</b><div><h3>Frage es an</h3><p>Schicke dem Künstler eine Reservierungsanfrage direkt aus der Galerie.</p></div></div><div className="step"><b>03</b><div><h3>Wechsel, wenn du willst</h3><p>Nach der Rückgabe wird das Werk wieder für andere verfügbar.</p></div></div></div></div>
        </section>

        <section className="story section-wrap" id="story"><p className="eyebrow">Warum RentArt?</p><h2>Mehr als ein Bild.<br /><em>Ein Gefühl für Räume.</em></h2><p className="story-text">Wir glauben, dass Kunst nicht hinter Glas warten sollte. Sie soll bei dir sein — im Alltag, im Wandel, genau dort, wo Leben passiert.</p><a className="text-link" href="mailto:hallo@rentart.de">Lern uns kennen <span>→</span></a></section>
      </main>
      <footer className="site-footer"><Brand /><p>© 2026 RentArt. Kunst für dein Jetzt.</p><div><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="mailto:hallo@rentart.de">Kontakt</a></div></footer>
    </div>
  )
}

export default App