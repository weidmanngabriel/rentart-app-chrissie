import { useState } from 'react'
import agentsDocument from '../../agents.md?raw'
import architectureDocument from '../../architecture.md?raw'
import conceptDocument from '../../concept.md?raw'
import useCasesIndex from '../../docs/use-cases/README.md?raw'
import artworkManagement from '../../docs/use-cases/artwork-management.md?raw'
import reservationFlow from '../../docs/use-cases/reservation-flow.md?raw'
import systemOverview from '../../docs/use-cases/system-overview.md?raw'

type ProjectDocument = {
  id: string
  title: string
  path: string
  description: string
  content: string
}

const documents: ProjectDocument[] = [
  {
    id: 'concept',
    title: 'Konzept',
    path: 'concept.md',
    description: 'Produktidee, Rollen und fachliche Abläufe.',
    content: conceptDocument,
  },
  {
    id: 'architecture',
    title: 'Architektur',
    path: 'architecture.md',
    description: 'Technischer Aufbau, Google-Anbindung und Deployment.',
    content: architectureDocument,
  },
  {
    id: 'agents',
    title: 'Agent-Regeln',
    path: 'agents.md',
    description: 'Verbindliche Regeln für die Weiterentwicklung.',
    content: agentsDocument,
  },
  {
    id: 'use-cases',
    title: 'Use Cases – Übersicht',
    path: 'docs/use-cases/README.md',
    description: 'Übersicht der dokumentierten Abläufe.',
    content: useCasesIndex,
  },
  {
    id: 'system-overview',
    title: 'Systemübersicht',
    path: 'docs/use-cases/system-overview.md',
    description: 'Zusammenspiel der wichtigsten Teile von RentArt.',
    content: systemOverview,
  },
  {
    id: 'artwork-management',
    title: 'Werkverwaltung',
    path: 'docs/use-cases/artwork-management.md',
    description: 'Abläufe für das Anlegen und Verwalten von Werken.',
    content: artworkManagement,
  },
  {
    id: 'reservation-flow',
    title: 'Reservierungen',
    path: 'docs/use-cases/reservation-flow.md',
    description: 'Anfrage, Annahme, Ablehnung und Rückgabe.',
    content: reservationFlow,
  },
]

function DocsPage() {
  const [selectedId, setSelectedId] = useState(documents[0].id)
  const selected = documents.find((document) => document.id === selectedId) ?? documents[0]

  return (
    <section className="documentation-page" aria-labelledby="documentation-title">
      <div className="documentation-heading">
        <p className="eyebrow">Projektwissen</p>
        <h1 id="documentation-title">RentArt<br /><em>Dokumente.</em></h1>
        <p>Hier findest du die zentralen Projektdateien direkt in der App. Der Inhalt entspricht dem Stand, mit dem die App gebaut wurde.</p>
      </div>

      <div className="documentation-layout">
        <aside className="documentation-nav" aria-label="Dokument auswählen">
          {documents.map((document) => (
            <button
              key={document.id}
              className={document.id === selected.id ? 'is-active' : ''}
              onClick={() => setSelectedId(document.id)}
            >
              <strong>{document.title}</strong>
              <small>{document.description}</small>
            </button>
          ))}
        </aside>

        <article className="documentation-document">
          <header>
            <div>
              <p className="eyebrow">{selected.path}</p>
              <h2>{selected.title}</h2>
            </div>
            <span className="documentation-badge">Markdown</span>
          </header>
          <pre className="documentation-source">{selected.content}</pre>
        </article>
      </div>
    </section>
  )
}

export default DocsPage
