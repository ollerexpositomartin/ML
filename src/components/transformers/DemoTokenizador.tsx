/**
 * DemoTokenizador — pseudo-BPE en vivo sobre texto del usuario.
 * Tabla de merges precomputada para español común; cada token es un chip con
 * color por nivel + ID ficticio; fila de stats (caracteres / tokens / ratio);
 * clic en un chip → historial de merges como árbol expandible.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import DemoFrame from '@/components/DemoFrame'
import { cn } from '@/lib/utils'

/**
 * Vocabulario pseudo-BPE: tokens completos con su ID y su historial de merges
 * (árbol: [token, hijoIzq, hijoDer] recursivo; hojas = caracteres/piezas base).
 */
type MergeTree = [string, MergeTree | string, MergeTree | string]

interface VocabEntry { token: string; id: number; tree: MergeTree | string }

const V = (token: string, id: number, tree: MergeTree | string): VocabEntry => ({ token, id, tree })

const VOCAB: VocabEntry[] = [
  V('transformación', 4213, ['transformación', ['transform', 'trans', 'form'], ['ación', 'ac', 'ión']]),
  V('transform', 3110, ['transform', 'trans', 'form']),
  V('ación', 882, ['ación', 'ac', 'ión']),
  V('atención', 2954, ['atención', ['aten', 'at', 'en'], 'ción']),
  V('ción', 741, ['ción', 'ci', 'ón']),
  V('aprendizaje', 5102, ['aprendizaje', ['aprend', 'a', 'prend'], ['izaje', 'iz', 'aje']]),
  V('aprend', 2877, ['aprend', 'a', 'prend']),
  V('izaje', 1930, ['izaje', 'iz', 'aje']),
  V('neuronal', 3665, ['neuronal', ['neur', 'ne', 'ur'], ['onal', 'on', 'al']]),
  V('inteligencia', 6021, ['inteligencia', ['intel', 'in', 'tel'], ['igencia', 'ig', 'encia']]),
  V('artificial', 5873, ['artificial', ['arti', 'ar', 'ti'], ['ficial', 'fic', 'ial']]),
  V('modelo', 1423, ['modelo', 'mod', 'elo']),
  V('datos', 1180, ['datos', 'dat', 'os']),
  V('token', 951, ['token', 'to', 'ken']),
  V('tokens', 1337, ['tokens', 'token', 's']),
  V('red', 503, ['red', 'r', 'ed']),
  V('redes', 891, ['redes', 'red', 'es']),
  V('hola', 640, ['hola', 'ho', 'la']),
  V('mundo', 1088, ['mundo', 'mun', 'do']),
  V('mente', 445, ['mente', 'men', 'te']),
  V('ción', 741, ['ción', 'ci', 'ón']),
  V('ando', 388, ['ando', 'an', 'do']),
  V('iendo', 402, ['iendo', 'ien', 'do']),
  V('ión', 215, ['ión', 'i', 'ón']),
  V('ciones', 990, ['ciones', 'ción', 'es']),
  V('ador', 620, ['ador', 'ad', 'or']),
  V('idad', 555, ['idad', 'id', 'ad']),
  V('idades', 771, ['idades', 'idad', 'es']),
  V('mente', 445, ['mente', 'men', 'te']),
  V('para', 301, ['para', 'pa', 'ra']),
  V('como', 298, ['como', 'co', 'mo']),
  V('perro', 1204, ['perro', 'pe', 'rro']),
  V('gato', 1198, ['gato', 'ga', 'to']),
  V('casa', 1010, ['casa', 'ca', 'sa']),
  V('la', 101, ['la', 'l', 'a']),
  V('el', 100, ['el', 'e', 'l']),
  V('los', 132, ['los', 'l', 'os']),
  V('las', 141, ['las', 'l', 'as']),
  V('un', 150, ['un', 'u', 'n']),
  V('una', 158, ['una', 'un', 'a']),
  V('de', 90, ['de', 'd', 'e']),
  V('del', 160, ['del', 'd', 'el']),
  V('en', 95, ['en', 'e', 'n']),
  V('que', 88, ['que', 'q', 'ue']),
  V('es', 85, ['es', 'e', 's']),
  V('y', 60, ['y', 'y', '']),
  V('a', 55, ['a', 'a', '']),
  V('o', 58, ['o', 'o', '']),
  V('s', 210, ['s', 's', '']),
  V('es', 85, ['es', 'e', 's']),
  V('prend', 2650, ['prend', 'pr', 'end']),
  V('trans', 2401, ['trans', 'tr', 'ans']),
  V('form', 2380, 'form'),
  V('aten', 2300, ['aten', 'at', 'en']),
  V('neur', 2210, ['neur', 'ne', 'ur']),
  V('onal', 1800, ['onal', 'on', 'al']),
  V('intel', 2780, ['intel', 'in', 'tel']),
  V('igencia', 2790, ['igencia', 'ig', 'encia']),
  V('encia', 1660, ['encia', 'en', 'cia']),
  V('arti', 2560, ['arti', 'ar', 'ti']),
  V('ficial', 2570, ['ficial', 'fic', 'ial']),
  V('mod', 1500, 'mod'),
  V('elo', 1490, 'elo'),
  V('dat', 1300, 'dat'),
  V('mun', 1050, 'mun'),
  V('ho', 700, 'ho'),
  V('ga', 690, 'ga'),
  V('ca', 680, 'ca'),
  V('pe', 660, 'pe'),
  V('rro', 1150, 'rro'),
]

/* índice por token (longest-match greedy) */
const TOKEN_INDEX = new Map<string, VocabEntry>()
for (const e of VOCAB) if (!TOKEN_INDEX.has(e.token)) TOKEN_INDEX.set(e.token, e)
const VOCAB_TOKENS = [...TOKEN_INDEX.keys()].sort((a, b) => b.length - a.length)

interface Piece { text: string; entry: VocabEntry | null; start: number }

function tokenize(input: string): Piece[] {
  const pieces: Piece[] = []
  let i = 0
  const lower = input.toLowerCase()
  while (i < input.length) {
    const ch = input[i]
    if (ch === ' ') {
      pieces.push({ text: '␣', entry: { token: '␣', id: 32, tree: '␣' }, start: i })
      i++
      continue
    }
    let matched: string | null = null
    for (const t of VOCAB_TOKENS) {
      if (t.length > 1 && lower.startsWith(t, i)) {
        // no cortar palabras por la mitad salvo que el token cubra todo lo alfabético posible
        matched = t
        break
      }
    }
    if (matched) {
      pieces.push({ text: input.slice(i, i + matched.length), entry: TOKEN_INDEX.get(matched)!, start: i })
      i += matched.length
    } else {
      pieces.push({ text: ch, entry: { token: ch, id: ch.charCodeAt(0), tree: ch }, start: i })
      i++
    }
  }
  return pieces
}

const CHIP_COLORS = ['#22D3EE', '#8B5CF6', '#A3E635', '#FB7185', '#FBBF24', '#EDF1FA']

function MergeNode({ node, depth = 0 }: { node: MergeTree | string; depth?: number }) {
  if (typeof node === 'string') {
    return <span className="font-mono text-xs text-muted">«{node}»</span>
  }
  const [label, left, right] = node
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.08 }}
      className={cn(depth > 0 && 'ml-4 border-l border-line pl-3')}
    >
      <div className="flex items-center gap-2 py-0.5">
        <Scissors className="h-3 w-3 text-violet" aria-hidden />
        <span className="font-mono text-xs font-bold text-ink">«{label}»</span>
        <span className="font-mono text-[10px] text-faint">=</span>
      </div>
      <div className="ml-2 flex flex-col gap-0.5">
        <MergeNode node={left} depth={depth + 1} />
        <MergeNode node={right} depth={depth + 1} />
      </div>
    </motion.div>
  )
}

export default function DemoTokenizador() {
  const [text, setText] = useState('la transformación de la atención')
  const [selected, setSelected] = useState<number | null>(null)
  const pieces = useMemo(() => tokenize(text), [text])
  const nChars = text.length
  const nTokens = pieces.length
  const ratio = nTokens > 0 ? nChars / nTokens : 0

  return (
    <DemoFrame
      title="tokenizador_bpe.py"
      controls={
        <>
          <Scissors className="h-4 w-4 text-cyan" aria-hidden />
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, 60))
              setSelected(null)
            }}
            placeholder="escribe algo en español…"
            className="min-w-0 flex-1 rounded-md border border-line bg-bg-1 px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-cyan/60"
            aria-label="Texto a tokenizar"
          />
        </>
      }
    >
      <div className="space-y-5 p-6">
        {/* chips */}
        <div className="flex min-h-16 flex-wrap items-center gap-1.5">
          <AnimatePresence mode="popLayout">
            {pieces.map((p, i) => {
              const color = CHIP_COLORS[(p.entry?.id ?? 0) % CHIP_COLORS.length]
              return (
                <motion.button
                  key={`${p.start}-${p.text}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className={cn(
                    'rounded-md border px-2 py-1.5 text-center font-mono',
                    selected === i ? 'ring-2 ring-lime' : '',
                  )}
                  style={{ borderColor: `${color}66`, background: `${color}14` }}
                >
                  <span className="block text-sm" style={{ color }}>
                    {p.text}
                  </span>
                  <span className="block text-[9px] text-faint">id {p.entry?.id}</span>
                </motion.button>
              )
            })}
          </AnimatePresence>
          {pieces.length === 0 && (
            <span className="font-mono text-xs text-faint">escribe para ver los tokens…</span>
          )}
        </div>

        {/* stats */}
        <div className="flex flex-wrap gap-2.5">
          {[
            [`${nChars} caracteres`, 'text-cyan'],
            [`${nTokens} tokens`, 'text-violet'],
            [`ratio ${ratio.toFixed(2)} car/token`, 'text-lime'],
          ].map(([label, cls]) => (
            <span key={label} className={cn('rounded-full border border-line bg-panel px-3 py-1 font-mono text-xs', cls)}>
              {label}
            </span>
          ))}
          <span className="rounded-full border border-line bg-panel px-3 py-1 font-mono text-xs text-faint">
            vocabulario ~32k–128k en tokenizadores reales
          </span>
        </div>

        {/* historial de merges */}
        <AnimatePresence>
          {selected !== null && pieces[selected] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-line bg-panel p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  // historial de merges BPE de «{pieces[selected].text}»
                </div>
                {pieces[selected].entry && typeof pieces[selected].entry.tree !== 'string' ? (
                  <MergeNode node={pieces[selected].entry!.tree} />
                ) : (
                  <p className="font-mono text-xs text-muted">
                    «{pieces[selected].text}» es un token base: no necesitó ningún merge.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs leading-relaxed text-muted">
          BPE parte de los caracteres y <span className="text-ink">fusiona el par más frecuente</span>{' '}
          una y otra vez hasta llenar el vocabulario. Por eso <span className="font-mono text-cyan">transformación</span>{' '}
          se trocea en <span className="font-mono text-violet">transform + ación</span>: un token no es
          una palabra, es una pieza estadística del corpus. Pulsa un chip para ver sus merges.
        </p>
      </div>
    </DemoFrame>
  )
}
