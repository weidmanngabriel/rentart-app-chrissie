import type { ReactNode } from 'react'

const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function renderInline(text: string): ReactNode[] {
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
        result.push(<a key={key++} href={href}>{label}</a>)
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
}

function MarkdownDocument({ source }: MarkdownDocumentProps) {
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
      blocks.push(
        <div className="markdown-code" key={key++}>
          {language && <span>{language === 'mermaid' ? 'Diagramm · Mermaid' : language}</span>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>,
      )
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const content = renderInline(heading[2])
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
      blocks.push(<ul key={key++}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>)
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''))
        index += 1
      }
      blocks.push(<ol key={key++}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ol>)
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
    blocks.push(<p key={key++}>{renderInline(paragraph.join(' '))}</p>)
  }

  return <div className="markdown-document">{blocks}</div>
}

export default MarkdownDocument
