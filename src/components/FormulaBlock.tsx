/**
 * FormulaBlock — Fórmula KaTeX display sobre card panel, con toggle "Desglose"
 * que expande un panel (Framer Motion) anotando cada símbolo.
 *
 * Uso:
 *   <FormulaBlock
 *     formula="\\hat{y} = wx + b"
 *     caption="Regresión lineal simple"
 *     breakdown={[
 *       { symbol: '\\hat{y}', color: '#22D3EE', explanation: 'predicción del modelo' },
 *       …
 *     ]}
 *   />
 */

import { useState } from 'react'
import { BlockMath } from 'react-katex'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { InlineMath } from 'react-katex'
import { cn } from '@/lib/utils'

export interface FormulaSymbol {
  /** Símbolo en notación KaTeX, p.ej. '\\hat{y}' */
  symbol: string
  /** Color del chip (por rol: weights violet, data cyan, loss rose…) */
  color: string
  /** Explicación en español llano */
  explanation: string
}

export default function FormulaBlock({
  formula,
  caption,
  breakdown,
  className,
}: {
  formula: string
  caption?: string
  breakdown?: FormulaSymbol[]
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-panel', className)}>
      <div className="overflow-x-auto px-6 py-6">
        <BlockMath math={formula} />
      </div>

      {(caption || (breakdown && breakdown.length > 0)) && (
        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-3">
          <span className="text-xs text-faint">{caption}</span>
          {breakdown && breakdown.length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 font-mono text-xs text-cyan transition-colors hover:text-ink"
              aria-expanded={open}
            >
              Desglose símbolo a símbolo
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
            </button>
          )}
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && breakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-line bg-bg-1"
          >
            <ul className="space-y-3 px-6 py-5">
              {breakdown.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="inline-flex min-w-[3rem] justify-center rounded-md border px-2 py-1 font-mono text-sm"
                    style={{ color: b.color, borderColor: `${b.color}55`, background: `${b.color}14` }}
                  >
                    <InlineMath math={b.symbol} />
                  </span>
                  <span className="text-sm leading-relaxed text-muted">{b.explanation}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
