import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'

const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js'

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void
  render: (id: string, source: string) => Promise<{ svg: string }>
}

declare global {
  interface Window {
    mermaid?: MermaidApi
  }
}

let mermaidLoader: Promise<MermaidApi> | null = null

function loadMermaid(): Promise<MermaidApi> {
  if (window.mermaid) return Promise.resolve(window.mermaid)
  if (mermaidLoader) return mermaidLoader

  mermaidLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MERMAID_CDN}"]`)
    const script = existing ?? document.createElement('script')

    const finish = () => {
      if (!window.mermaid) {
        reject(new Error('Mermaid konnte nicht geladen werden.'))
        return
      }
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
      })
      resolve(window.mermaid)
    }

    if (existing) {
      if (window.mermaid) finish()
      else {
        existing.addEventListener('load', finish, { once: true })
        existing.addEventListener('error', () => reject(new Error('Mermaid konnte nicht geladen werden.')), { once: true })
      }
      return
    }

    script.src = MERMAID_CDN
    script.async = true
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', () => reject(new Error('Mermaid konnte nicht geladen werden.')), { once: true })
    document.head.appendChild(script)
  })

  return mermaidLoader
}

function MermaidDiagram({ source }: { source: string }) {
  const reactId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const renderDiagram = async () => {
      try {
        setError(null)
        const mermaid = await loadMermaid()
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`
        const { svg } = await mermaid.render(id, source)
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg
      } catch (renderError) {
        if (!cancelled) setError(renderError instanceof Error ? renderError.message : 'Diagramm konnte nicht gerendert werden.')
      }
    }

    void renderDiagram()
    return () => {
      cancelled = true
    }
  }, [reactId, source])

  if (error) {
    return (
      <div className="markdown-code markdown-mermaid-error">
        <span>Diagramm konnte nicht angezeigt werden</span>
        <pre><code>{source}</code></pre>
      </div>
    )
  }

  return <div className="markdown-mermaid" ref={containerRef} aria-label="Mermaid-Diagramm" />
}

type LinkHandler = (href: string) => void

function renderInline(text: string, onDocumentLink?: LinkHandler): ReactNode[] {
  const result: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let key = 0

  inlinePattern.lastIndex = 0
  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > cursor) result.push(text.slice(cursor, match.index))
    const token = match[0]

    if (token.startsWith('**')) {
      result.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      result.push(<code key={key++}>{token.slice(1, -1)}</code>)
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        const [, label, href] = link
        const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (!onDocumentLink || !href.endsWith('.md')) return
          event.preventDefault()
          onDocumentLink(href)
        }
        result.push(<a key={key++} href={href} onClick={handleClick}>{label}</a>)
      } else {
        result.push(token)
      }
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length) result.push(text.slice(cursor))
  return result
}

type MarkdownDocumentProps = {
  source: string
  onDocumentLink?: LinkHandler
}

function MarkdownDocument({ source, onDocumentLink }: MarkdownDocumentProps) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let index = 0
  let key = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      const code = codeLines.join('\n')
      if (language.toLowerCase() === 'mermaid') {
        blocks.push(<MermaidDiagram key={key++} source={code} />)
      } else {
        blocks.push(
          <div className="markdown-code" key={key++}>
            {language && <span>{language}</span>}
            <pre><code>{code}</code></pre>
          </div>,
        )
      }
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const content = renderInline(heading[2], onDocumentLink)
      if (level === 1) blocks.push(<h1 key={key++}>{content}</h1>)
      if (level === 2) blocks.push(<h2 key={key++}>{content}</h2>)
      if (level === 3) blocks.push(<h3 key={key++}>{content}</h3>)
      if (level === 4) blocks.push(<h4 key={key++}>{content}</h4>)
      index += 1
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''))
        index += 1
      }
      blocks.push(<ul key={key++}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, onDocumentLink)}</li>)}</ul>)
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''))
        index += 1
      }
      blocks.push(<ol key={key++}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, onDocumentLink)}</li>)}</ol>)
      continue
    }

    const paragraph: string[] = [line.trim()]
    index += 1
    while (
      index < lines.length
      && lines[index].trim()
      && !lines[index].startsWith('```')
      && !/^(#{1,4})\s+/.test(lines[index])
      && !/^\s*[-*]\s+/.test(lines[index])
      && !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={key++}>{renderInline(paragraph.join(' '), onDocumentLink)}</p>)
  }

  return <div className="markdown-document">{blocks}</div>
}

export default MarkdownDocument
