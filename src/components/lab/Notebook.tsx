/**
 * Notebook — S1 del Laboratorio: notebook libre estilo Colab.
 * CRUD de celdas de código (CodeCell / CodeMirror) y markdown (KaTeX),
 * ejecución secuencial ("Ejecutar todo"), captura de matplotlib vía CodeCell,
 * biblioteca de snippets, reinicio de kernel (remonta las celdas).
 * Las celdas se añaden/eliminan/reordenan con springs de Framer Motion.
 */

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Play,
  Plus,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  FileText,
  Code2,
  Pencil,
  Eye,
  LibraryBig,
  Clock3,
} from 'lucide-react'
import CodeCell, { type CodeCellHandle } from '@/components/CodeCell'
import { TeXParagraphs } from '@/lib/katex-content'
import { usePyodideStatus } from '@/lib/pyodide'
import { cn } from '@/lib/utils'

interface NotebookCell {
  id: string
  type: 'code' | 'markdown'
  content: string
}

let cellSeq = 0
const nextId = () => `cell-${++cellSeq}`

const DEFAULT_CELLS: NotebookCell[] = [
  {
    id: nextId(),
    type: 'markdown',
    content:
      '# Mi notebook SINAPSIS\n\nPython real en el navegador: **numpy**, **matplotlib** y todo lo que has aprendido. Escribe código, pulsa ▶ o `Shift+Enter`, y las gráficas se capturan solas.\n\nEmpieza con $\\hat{y} = wx + b$ y acaba entrenando lo que quieras.',
  },
  {
    id: nextId(),
    type: 'code',
    content: `import numpy as np
import matplotlib.pyplot as plt

# Tu primer experimento libre: señal + ruido
t = np.linspace(0, 4 * np.pi, 400)
senal = np.sin(t) + 0.3 * np.sin(3 * t)
ruido = np.random.default_rng(0).normal(0, 0.25, t.shape)

plt.figure(figsize=(7, 3))
plt.plot(t, senal + ruido, color='#8B5CF6', lw=1, label='observado')
plt.plot(t, senal, color='#22D3EE', lw=2, label='señal real')
plt.legend(); plt.title('Señal + ruido')
plt.show()
`,
  },
]

const SNIPPETS: Record<string, { label: string; code: string }> = {
  'gradiente-descendente': {
    label: 'Gradiente descendente',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Regresión lineal por gradiente descendente
rng = np.random.default_rng(7)
X = rng.uniform(-3, 3, 80)
y = 2.5 * X - 1 + rng.normal(0, 0.6, 80)

w, b, lr = 0.0, 0.0, 0.05
historia = []
for epoca in range(300):
    y_hat = w * X + b
    err = y_hat - y
    historia.append(np.mean(err ** 2))
    w -= lr * 2 * np.mean(err * X)
    b -= lr * 2 * np.mean(err)

print(f"w = {w:.3f}, b = {b:.3f}")
plt.figure(figsize=(10, 3.2))
plt.subplot(1, 2, 1); plt.plot(historia, color='#FB7185'); plt.title('MSE por época')
plt.subplot(1, 2, 2); plt.scatter(X, y, s=12, c='#22D3EE')
plt.plot(X, w * X + b, color='#A3E635', lw=2); plt.title('Ajuste final')
plt.tight_layout(); plt.show()
`,
  },
  'perceptron': {
    label: 'Perceptrón',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Perceptrón desde cero sobre datos separables
rng = np.random.default_rng(3)
X = np.vstack([rng.normal([-1.2, -1.2], 0.6, (40, 2)), rng.normal([1.2, 1.2], 0.6, (40, 2))])
y = np.array([0] * 40 + [1] * 40)

w = np.zeros(2); b = 0.0
for epoca in range(50):
    for xi, yi in zip(X, y):
        pred = 1 if xi @ w + b > 0 else 0
        w += (yi - pred) * xi
        b += (yi - pred)

acc = np.mean((X @ w + b > 0) == y)
print(f"accuracy: {acc:.2%}")
xx = np.linspace(-3, 3, 100)
plt.figure(figsize=(5, 4))
plt.scatter(*X[y == 0].T, c='#22D3EE', s=16, label='clase 0')
plt.scatter(*X[y == 1].T, c='#8B5CF6', s=16, label='clase 1')
plt.plot(xx, -(w[0] * xx + b) / w[1], color='#A3E635', lw=2)
plt.legend(); plt.title('Frontera del perceptrón'); plt.show()
`,
  },
  'kmeans': {
    label: 'K-means',
    code: `import numpy as np
import matplotlib.pyplot as plt

# K-means desde cero (k=3)
rng = np.random.default_rng(11)
centros_reales = np.array([[-2, -2], [2, -1.5], [0, 2.5]])
X = np.vstack([rng.normal(c, 0.55, (60, 2)) for c in centros_reales])

k = 3
centros = X[rng.choice(len(X), k, replace=False)]
for it in range(20):
    asign = np.argmin(((X[:, None, :] - centros) ** 2).sum(axis=2), axis=1)
    nuevos = np.array([X[asign == j].mean(axis=0) if (asign == j).any() else centros[j] for j in range(k)])
    if np.allclose(nuevos, centros):
        break
    centros = nuevos
print(f"convergió en {it + 1} iteraciones")

colores = ['#22D3EE', '#8B5CF6', '#A3E635']
plt.figure(figsize=(5, 4))
for j in range(k):
    plt.scatter(*X[asign == j].T, s=12, c=colores[j], alpha=0.7)
plt.scatter(*centros.T, c='#FB7185', marker='X', s=140)
plt.title('K-means: clusters finales'); plt.show()
`,
  },
  'atencion': {
    label: 'Atención (self-attention)',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Self-attention en 20 líneas: softmax(QK^T / sqrt(d)) V
rng = np.random.default_rng(2)
tokens = ["el", "gato", "persiguió", "al", "ratón", "gris"]
d = 16
E = rng.normal(0, 1, (len(tokens), d))      # embeddings
Wq, Wk, Wv = [rng.normal(0, 0.3, (d, d)) for _ in range(3)]

Q, K, V = E @ Wq, E @ Wk, E @ Wv
scores = Q @ K.T / np.sqrt(d)
A = np.exp(scores - scores.max(axis=1, keepdims=True))
A /= A.sum(axis=1, keepdims=True)
salida = A @ V
print("salida:", salida.shape)

plt.figure(figsize=(4.6, 4))
plt.imshow(A, cmap='viridis')
plt.xticks(range(len(tokens)), tokens, rotation=45, ha='right')
plt.yticks(range(len(tokens)), tokens)
plt.colorbar(label='peso de atención'); plt.title('Mapa de atención')
plt.tight_layout(); plt.show()
`,
  },
}

export default function Notebook() {
  const [cells, setCells] = useState<NotebookCell[]>(DEFAULT_CELLS)
  const [kernelEpoch, setKernelEpoch] = useState(0)
  const [runningAll, setRunningAll] = useState(false)
  const [lastRunMs, setLastRunMs] = useState<number | null>(null)
  const [editingMd, setEditingMd] = useState<string | null>(null)
  const [snippetsOpen, setSnippetsOpen] = useState(false)
  const status = usePyodideStatus((s) => s.status)
  const runRefs = useRef(new Map<string, CodeCellHandle>())

  const addCell = (type: 'code' | 'markdown') => {
    const content =
      type === 'code'
        ? 'import numpy as np\n\n# Escribe aquí tu experimento\n'
        : 'Nuevo apartado\n\nEscribe texto con fórmulas: $e^{i\\pi} + 1 = 0$.'
    setCells((cs) => [...cs, { id: nextId(), type, content }])
  }

  const removeCell = (id: string) => {
    runRefs.current.delete(id)
    setCells((cs) => cs.filter((c) => c.id !== id))
  }

  const moveCell = (id: string, dir: -1 | 1) => {
    setCells((cs) => {
      const i = cs.findIndex((c) => c.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= cs.length) return cs
      const copy = [...cs]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  const updateMd = (id: string, content: string) => {
    setCells((cs) => cs.map((c) => (c.id === id ? { ...c, content } : c)))
  }

  const loadSnippet = (key: string) => {
    const s = SNIPPETS[key]
    if (!s) return
    setCells((cs) => [...cs, { id: nextId(), type: 'code', content: s.code }])
    setSnippetsOpen(false)
  }

  const runAll = async () => {
    if (runningAll) return
    setRunningAll(true)
    const started = performance.now()
    for (const c of cells) {
      if (c.type !== 'code') continue
      const ref = runRefs.current.get(c.id)
      if (ref) await ref.run()
    }
    setLastRunMs(performance.now() - started)
    setRunningAll(false)
  }

  const restartKernel = () => {
    runRefs.current.clear()
    setKernelEpoch((n) => n + 1)
    setLastRunMs(null)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel-2 px-4 py-3">
        <button
          onClick={() => addCell('code')}
          className="flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Código
        </button>
        <button
          onClick={() => addCell('markdown')}
          className="flex items-center gap-1.5 rounded-md border border-violet/40 bg-violet/10 px-3 py-1.5 font-mono text-xs text-violet transition-colors hover:bg-violet/20"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Markdown
        </button>
        <button
          onClick={() => void runAll()}
          disabled={runningAll || status === 'error'}
          className="flex items-center gap-1.5 rounded-md bg-lime/15 px-3.5 py-1.5 font-mono text-xs font-bold text-lime transition-colors hover:bg-lime/25 disabled:opacity-40"
        >
          <Play className={cn('h-3.5 w-3.5', runningAll && 'animate-pulse')} aria-hidden />
          {runningAll ? 'Ejecutando…' : '▶ Ejecutar todo'}
        </button>

        {/* Biblioteca de snippets */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSnippetsOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
            aria-expanded={snippetsOpen}
          >
            <LibraryBig className="h-3.5 w-3.5" aria-hidden />
            Cargar ejemplo ▸
          </button>
          <AnimatePresence>
            {snippetsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-panel-2 shadow-xl"
              >
                {Object.entries(SNIPPETS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => loadSnippet(key)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-mono text-xs text-muted transition-colors hover:bg-panel hover:text-ink"
                  >
                    <Code2 className="h-3.5 w-3.5 text-cyan" aria-hidden />
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lista de celdas */}
      <div className="space-y-3 bg-bg-0 p-4" key={kernelEpoch}>
        <AnimatePresence initial={false}>
          {cells.map((cell, idx) => (
            <motion.div
              key={cell.id}
              layout="position"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="group flex gap-2"
            >
              {/* Chrome lateral */}
              <div className="flex w-7 shrink-0 flex-col items-center gap-1 pt-2 text-faint">
                <GripVertical className="h-4 w-4 opacity-40" aria-hidden />
                <span className="font-mono text-[10px]">[{idx + 1}]</span>
                <button
                  onClick={() => moveCell(cell.id, -1)}
                  className="rounded p-0.5 opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                  title="Subir celda"
                >
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  onClick={() => moveCell(cell.id, 1)}
                  className="rounded p-0.5 opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                  title="Bajar celda"
                >
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  onClick={() => removeCell(cell.id)}
                  className="rounded p-0.5 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                  title="Eliminar celda"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              {/* Cuerpo */}
              <div className="min-w-0 flex-1">
                {cell.type === 'code' ? (
                  <CodeCell
                    ref={(h) => {
                      if (h) runRefs.current.set(cell.id, h)
                      else runRefs.current.delete(cell.id)
                    }}
                    initialCode={cell.content}
                    onRun={(r) => setLastRunMs(r.durationMs)}
                  />
                ) : (
                  <div className="overflow-hidden rounded-xl border border-line bg-panel">
                    <div className="flex items-center justify-between border-b border-line bg-panel-2 px-3 py-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                        markdown
                      </span>
                      <button
                        onClick={() => setEditingMd(editingMd === cell.id ? null : cell.id)}
                        className="flex items-center gap-1 font-mono text-xs text-violet transition-colors hover:text-ink"
                      >
                        {editingMd === cell.id ? (
                          <>
                            <Eye className="h-3.5 w-3.5" aria-hidden /> Vista previa
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                          </>
                        )}
                      </button>
                    </div>
                    {editingMd === cell.id ? (
                      <textarea
                        value={cell.content}
                        onChange={(e) => updateMd(cell.id, e.target.value)}
                        rows={Math.max(4, cell.content.split('\n').length + 1)}
                        className="w-full resize-y bg-bg-1 p-4 font-mono text-sm text-ink focus:outline-none"
                        aria-label="Contenido markdown de la celda"
                      />
                    ) : (
                      <div className="prose-sm px-5 py-4">
                        <TeXParagraphs content={cell.content} className="text-sm leading-relaxed text-muted [&_p]:mb-2" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {cells.length === 0 && (
          <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center font-mono text-sm text-faint">
            Notebook vacío — añade una celda de código o markdown para empezar.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-4 border-t border-line bg-panel px-4 py-2.5 font-mono text-[11px] text-faint">
        <button
          onClick={restartKernel}
          className="flex items-center gap-1.5 transition-colors hover:text-ink"
          title="Reinicia el estado del notebook (limpa outputs y estado de las celdas)"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reiniciar kernel
        </button>
        {lastRunMs !== null && (
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3 w-3" aria-hidden />
            última ejecución: {(lastRunMs / 1000).toFixed(1)} s
          </span>
        )}
        <span className="ml-auto">
          {cells.filter((c) => c.type === 'code').length} celdas de código ·{' '}
          {cells.filter((c) => c.type === 'markdown').length} markdown
        </span>
      </div>
    </div>
  )
}
