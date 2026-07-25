/**
 * katex-content.tsx — Renderiza strings con segmentos KaTeX mezclados con texto.
 *
 * Soporta `$$...$$` (bloque) y `$...$` (inline) dentro de texto plano.
 * Uso: <TeX content="La recta es $y = wx + b$ y el coste $$J = \\frac{1}{n}\\sum...$$" />
 */

import { Fragment, type ReactNode } from 'react'
import { InlineMath, BlockMath } from 'react-katex'

interface Segment {
  kind: 'text' | 'inline' | 'block'
  value: string
}

/** Tokeniza un string en segmentos texto / $inline$ / $$block$$. */
export function parseTeX(input: string): Segment[] {
  const segments: Segment[] = []
  // Orden importante: $$ antes que $
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(input)) !== null) {
    if (m.index > last) segments.push({ kind: 'text', value: input.slice(last, m.index) })
    const tok = m[0]
    if (tok.startsWith('$$')) {
      segments.push({ kind: 'block', value: tok.slice(2, -2) })
    } else {
      segments.push({ kind: 'inline', value: tok.slice(1, -1) })
    }
    last = m.index + tok.length
  }
  if (last < input.length) segments.push({ kind: 'text', value: input.slice(last) })
  return segments
}

export function TeX({ content, className }: { content: string; className?: string }) {
  const parts: ReactNode[] = parseTeX(content).map((seg, i) => {
    if (seg.kind === 'inline') return <InlineMath key={i} math={seg.value} />
    if (seg.kind === 'block') return <BlockMath key={i} math={seg.value} />
    // Texto plano: respeta saltos de línea sencillos
    return (
      <Fragment key={i}>
        {seg.value.split('\n').map((line, j, arr) => (
          <Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>
    )
  })
  return <span className={className}>{parts}</span>
}

/** Variante para enunciados largos: párrafos separados por líneas en blanco. */
export function TeXParagraphs({ content, className }: { content: string; className?: string }) {
  const paragraphs = content.split(/\n\s*\n/)
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-3 last:mb-0">
          <TeX content={p} />
        </p>
      ))}
    </div>
  )
}
