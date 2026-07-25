/**
 * CodeCell — el "Colab" de SINAPSIS.
 * Editor CodeMirror (Python, tema oscuro), botón ▶ Ejecutar (lime), Shift+Enter,
 * panel stdout/stderr, captura de figuras matplotlib, chip de estado del runtime,
 * Reset y "Ver solución" (bloqueada hasta 1 intento fallido o confirmación).
 *
 * API:
 *   <CodeCell
 *     initialCode="…"
 *     solutionCode="…"            // opcional
 *     onRun={(result, code) => {}}// opcional (se llama tras cada ejecución)
 *     onFailedAttempt={() => {}}  // opcional (error en ejecución)
 *   />
 *   const ref = useRef<CodeCellHandle>(null)
 *   ref.current?.run()            // ejecuta programáticamente
 *   ref.current?.getCode()        // código actual
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { Play, RotateCcw, Eye, EyeOff, Loader2, CircleAlert } from 'lucide-react'
import { runPython, usePyodideStatus, preloadPyodide, type RunResult } from '@/lib/pyodide'
import { cn } from '@/lib/utils'

export interface CodeCellHandle {
  run: () => Promise<RunResult | null>
  getCode: () => string
  reset: () => void
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  idle: { text: 'Pyodide · en espera', color: 'text-faint' },
  cargando: { text: 'Pyodide · cargando…', color: 'text-amber' },
  listo: { text: 'Pyodide · listo', color: 'text-lime' },
  error: { text: 'Pyodide · error', color: 'text-rose' },
}

const CodeCell = forwardRef<
  CodeCellHandle,
  {
    initialCode: string
    solutionCode?: string
    onRun?: (result: RunResult, code: string) => void
    onFailedAttempt?: () => void
    /** Altura máxima del editor (px). Defecto 420. */
    maxHeight?: number
    className?: string
  }
>(function CodeCell(
  { initialCode, solutionCode, onRun, onFailedAttempt, maxHeight = 420, className },
  ref,
) {
  const [code, setCode] = useState(initialCode)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const status = usePyodideStatus((s) => s.status)
  const onRunRef = useRef(onRun)
  const onFailedRef = useRef(onFailedAttempt)
  onRunRef.current = onRun
  onFailedRef.current = onFailedAttempt

  useEffect(() => {
    setCode(initialCode)
    setResult(null)
    setShowSolution(false)
  }, [initialCode])

  const run = useCallback(async (): Promise<RunResult | null> => {
    if (running) return null
    setRunning(true)
    setResult(null)
    const res = await runPython(code)
    setRunning(false)
    setResult(res)
    if (res.error) {
      setFailedAttempts((n) => n + 1)
      onFailedRef.current?.()
    }
    onRunRef.current?.(res, code)
    return res
  }, [code, running])

  const reset = useCallback(() => {
    setCode(initialCode)
    setResult(null)
    setShowSolution(false)
  }, [initialCode])

  useImperativeHandle(ref, () => ({ run, getCode: () => code, reset }), [run, code, reset])

  const runKeymap = Prec.highest(
    keymap.of([
      {
        key: 'Shift-Enter',
        run: () => {
          void run()
          return true
        },
      },
    ]),
  )

  const solutionUnlocked = failedAttempts >= 1
  const st = STATUS_LABEL[status]

  return (
    <div className={cn('overflow-hidden rounded-xl border border-line bg-bg-1', className)}>
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-2">
        <button
          onClick={() => void run()}
          disabled={running || status === 'error'}
          onMouseEnter={preloadPyodide}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-bold transition-all',
            'bg-lime/15 text-lime hover:bg-lime/25 disabled:opacity-40',
          )}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden />
          )}
          {running ? 'Ejecutando…' : 'Ejecutar'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
          title="Restaurar código inicial"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset
        </button>
        {solutionCode && (
          <button
            onClick={() => {
              if (showSolution) {
                setShowSolution(false)
              } else if (solutionUnlocked || window.confirm('¿Seguro que quieres ver la solución? Inténtalo primero por tu cuenta.')) {
                setShowSolution(true)
              }
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors',
              solutionUnlocked ? 'text-violet hover:text-ink' : 'text-faint hover:text-muted',
            )}
            title={solutionUnlocked ? 'Ver la solución de referencia' : 'Se desbloquea tras 1 intento fallido'}
          >
            {showSolution ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            {showSolution ? 'Ocultar solución' : 'Ver solución'}
          </button>
        )}
        <span className={cn('ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider', st.color)}>
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              status === 'listo' && 'bg-lime',
              status === 'cargando' && 'animate-pulse bg-amber',
              status === 'error' && 'bg-rose',
              status === 'idle' && 'bg-faint',
            )}
            aria-hidden
          />
          {running ? 'Python · ejecutando' : st.text}
        </span>
      </div>

      {/* Editor */}
      <CodeMirror
        value={showSolution && solutionCode ? solutionCode : code}
        onChange={(v) => setCode(v)}
        readOnly={showSolution}
        theme={oneDark}
        extensions={[python(), runKeymap]}
        maxHeight={`${maxHeight}px`}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
        aria-label="Editor de código Python"
      />

      {showSolution && (
        <div className="border-t border-violet/40 bg-violet/10 px-4 py-2 font-mono text-xs text-violet">
          Solución de referencia — estúdiala, luego pulsa Reset e impleméntala tú.
        </div>
      )}

      {/* Salida */}
      {result && (
        <div className="border-t border-line bg-bg-0 px-4 py-3 font-mono text-xs leading-relaxed">
          {result.stdout && (
            <pre className="whitespace-pre-wrap text-ink">{result.stdout}</pre>
          )}
          {result.stderr && (
            <pre className="whitespace-pre-wrap text-amber">{result.stderr}</pre>
          )}
          {result.error && (
            <div className="mt-1 flex items-start gap-2 text-rose">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <pre className="whitespace-pre-wrap">{result.error.replace('__TIMEOUT__:', '⏱')}</pre>
            </div>
          )}
          {!result.stdout && !result.stderr && !result.error && result.figures.length === 0 && (
            <div className="text-faint">✓ Ejecutado sin salida ({Math.round(result.durationMs)} ms)</div>
          )}
          {result.figures.length > 0 && (
            <div className="mt-2 space-y-3">
              {result.figures.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Figura ${i + 1} generada por matplotlib`}
                  className="max-w-full rounded-lg border border-line"
                />
              ))}
            </div>
          )}
        </div>
      )}
      {!result && (
        <div className="border-t border-line bg-bg-0 px-4 py-2.5 font-mono text-[11px] text-faint">
          Shift+Enter para ejecutar · Python real (numpy + matplotlib) en tu navegador
        </div>
      )}
    </div>
  )
})

export default CodeCell
