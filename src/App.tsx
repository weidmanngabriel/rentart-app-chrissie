import { useState } from 'react'

type Category = 'Alle Werke' | 'Abstrakt' | 'Fotografie' | 'Grafik'

type Artwork = {
  number: string
  title: string
  artist: string
  city: string
  price: string
  category: Exclude<Category, 'Alle Werke'>
  visualClass: string
}

const artworks: Artwork[] = [
  { number: '01', title: 'Soft Geometry', artist: 'Mara Klein', city: 'Berlin', price: '29 €', category: 'Abstrakt', visualClass: 'work-one' },
  { number: '02', title: 'Sunday Light', artist: 'Jonas Weber', city: 'Köln', price: '35 €', category: 'Fotografie', visualClass: 'work-two' },
  { number: '03', title: 'In Between', artist: 'Lena Park', city: 'Hamburg', price: '25 €', category: 'Grafik', visualClass: 'work-three' },
]

function Brand() {
  return <a className="brand" href="#top" aria-label="RentArt Startseite"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>rent<span>art</span></span></a>
}

function App() {
  const [category, setCategory] = useState<Category>('Alle Werke')
  const [menuOpen, setMenuOpen] = useState(false)
  const filteredArtworks = category === 'Alle Werke' ? artworks : artworks.filter((artwork) => artwork.category === category)

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div id="top">
      <header className="site-header">
        <Brand />
        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Hauptnavigation">
          <button onClick={() => scrollTo('#entdecken')}>Entdecken</button>
          <button onClick={() => scrollTo('#so-funktionierts')}>So funktioniert's</button>
          <button onClick={() => scrollTo('#story')}>Unsere Idee</button>
        </nav>
        <button className="button button-small button-outline desktop-cta" onClick={() => scrollTo('#entdecken')}>Kunst finden <span>↗</span></button>
        <button className="menu-toggle" aria-label="Menü öffnen" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> Kunst neu gedacht</p>
            <h1>Räume, die<br /><em>etwas erzählen.</em></h1>
            <p className="hero-text">Entdecke Kunst, die zu dir passt. Miete besondere Werke von lokalen Künstlern — flexibel, fair und ohne Risiko.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => scrollTo('#entdecken')}>Kollektion entdecken <span>↗</span></button>
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

        <section className="discover section-wrap" id="entdecken">
          <div className="section-heading"><div><p className="eyebrow">Deine nächste Wand</p><h2>Etwas Schönes<br /><em>wartet auf dich.</em></h2></div><p className="section-intro">Eine kuratierte Auswahl von Künstlern aus deiner Nähe. Wechsel, was dich bewegt.</p></div>
          <div className="filter-row" role="group" aria-label="Kollektion filtern">{(['Alle Werke', 'Abstrakt', 'Fotografie', 'Grafik'] as Category[]).map((item) => <button key={item} className={`filter ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="art-grid">{filteredArtworks.map((artwork) => <article className="work-card" key={artwork.title}><div className={`work-image ${artwork.visualClass}`}><span>{artwork.number}</span></div><div className="work-meta"><div><h3>{artwork.title}</h3><p>{artwork.artist} · {artwork.city}</p></div><strong>ab {artwork.price}<small>/ Monat</small></strong></div></article>)}</div>
          <button className="button button-dark centered" onClick={() => scrollTo('#story')}>Mehr Werke entdecken <span>↗</span></button>
        </section>

        <section className="how section-wrap" id="so-funktionierts">
          <div className="how-visual"><div className="how-number">01</div><div className="how-poster"><span>MAKE<br /><em>SPACE</em><br />FOR ART</span><small>RENTART / 001</small></div><div className="scribble">easy does it <span>↗</span></div></div>
          <div className="how-copy"><p className="eyebrow">So einfach geht's</p><h2>Kunst darf sich<br /><em>leicht anfühlen.</em></h2><div className="steps"><div className="step"><b>01</b><div><h3>Finde dein Werk</h3><p>Stöbere durch unsere Auswahl und lass dich inspirieren.</p></div></div><div className="step"><b>02</b><div><h3>Miete deine Kunst</h3><p>Flexibel ab einem Monat. Lieferung und Aufhängung inklusive.</p></div></div><div className="step"><b>03</b><div><h3>Wechsel, wenn du willst</h3><p>Dein Geschmack verändert sich? Deine Kunst darf das auch.</p></div></div></div></div>
        </section>

        <section className="story section-wrap" id="story"><p className="eyebrow">Warum RentArt?</p><h2>Mehr als ein Bild.<br /><em>Ein Gefühl für Räume.</em></h2><p className="story-text">Wir glauben, dass Kunst nicht hinter Glas warten sollte. Sie soll bei dir sein — im Alltag, im Wandel, genau dort, wo Leben passiert.</p><a className="text-link" href="mailto:hallo@rentart.de">Lern uns kennen <span>→</span></a></section>
      </main>
      <footer className="site-footer"><Brand /><p>© 2024 RentArt. Kunst für dein Jetzt.</p><div><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><a href="mailto:hallo@rentart.de">Kontakt</a></div></footer>
    </div>
  )
}

export default App
