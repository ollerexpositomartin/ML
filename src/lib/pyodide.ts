/**
 * pyodide.ts — Motor de ejecución Python en el navegador ("el Colab de SINAPSIS").
 *
 * Carga lazy de Pyodide desde CDN (singleton), pre-carga numpy + matplotlib,
 * captura stdout/stderr y captura figuras matplotlib como data-URL PNG
 * (backend 'agg' + plt.show() interceptado).
 *
 * API:
 *   usePyodideStatus()  → hook zustand con { status, error }
 *   preloadPyodide()    → dispara la carga en segundo plano (warm-up)
 *   runPython(code, opts?) → Promise<RunResult>
 */

import { create } from 'zustand'

export type PyodideStatus = 'idle' | 'cargando' | 'listo' | 'error'

interface PyodideStatusState {
  status: PyodideStatus
  error: string | null
  setStatus: (status: PyodideStatus, error?: string | null) => void
}

export const usePyodideStatus = create<PyodideStatusState>((set) => ({
  status: 'idle',
  error: null,
  setStatus: (status, error = null) => set({ status, error }),
}))

export interface RunResult {
  /** Texto capturado de stdout (print, etc.) */
  stdout: string
  /** Texto capturado de stderr */
  stderr: string
  /** Figuras matplotlib como data URLs (image/png;base64) */
  figures: string[]
  /** Mensaje de error de Python (traceback resumido) o null si ok */
  error: string | null
  /** Duración real de la ejecución */
  durationMs: number
  /** true si se superó el timeout (la ejecución puede seguir en segundo plano) */
  timedOut: boolean
}

export interface RunOptions {
  /** Timeout en ms (defecto 20_000). Si expira, error='__TIMEOUT__'. */
  timeoutMs?: number
  /** Valores a inyectar en el namespace global antes de ejecutar. */
  globals?: Record<string, unknown>
}

const PYODIDE_VERSION = 'v0.26.4'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

/* eslint-disable @typescript-eslint/no-explicit-any */
let pyodideInstance: any = null
let pyodidePromise: Promise<any> | null = null

/** Código Python de inicialización: backend agg + captura de figuras. */
const SETUP_CODE = `
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
import io as _io, base64 as _b64

_sinapsis_figures = []

def _sinapsis_show(*args, **kwargs):
    for _num in plt.get_fignums():
        _fig = plt.figure(_num)
        _buf = _io.BytesIO()
        _fig.savefig(_buf, format='png', dpi=110, bbox_inches='tight',
                     facecolor='#0A0E1A', edgecolor='none')
        _sinapsis_figures.append('data:image/png;base64,' + _b64.b64encode(_buf.getvalue()).decode('ascii'))
    plt.close('all')

plt.show = _sinapsis_show

def _sinapsis_take_figures():
    global _sinapsis_figures
    out = list(_sinapsis_figures)
    _sinapsis_figures = []
    plt.close('all')
    return out
`

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    document.head.appendChild(s)
  })
}

async function loadPyodideInternal(): Promise<any> {
  await injectScript(`${PYODIDE_CDN}pyodide.js`)
  const w = window as any
  if (!w.loadPyodide) throw new Error('loadPyodide no está disponible tras cargar el script')
  const py = await w.loadPyodide({ indexURL: PYODIDE_CDN })
  await py.loadPackage(['numpy', 'matplotlib'])
  await py.runPythonAsync(SETUP_CODE)
  return py
}

/**
 * Devuelve la instancia singleton de Pyodide, cargándola si es necesario.
 * Actualiza usePyodideStatus: 'cargando' → 'listo' | 'error'.
 */
export function getPyodide(): Promise<any> {
  if (pyodideInstance) return Promise.resolve(pyodideInstance)
  if (!pyodidePromise) {
    const { setStatus } = usePyodideStatus.getState()
    setStatus('cargando')
    pyodidePromise = loadPyodideInternal()
      .then((py) => {
        pyodideInstance = py
        usePyodideStatus.getState().setStatus('listo')
        return py
      })
      .catch((err) => {
        pyodidePromise = null
        usePyodideStatus.getState().setStatus('error', String(err?.message ?? err))
        throw err
      })
  }
  return pyodidePromise
}

/** Warm-up: empieza a descargar Pyodide en segundo plano (llamar al hover/mount). */
export function preloadPyodide(): void {
  void getPyodide().catch(() => undefined)
}

/**
 * Ejecuta código Python del usuario.
 * Captura stdout/stderr por lotes y recoge las figuras pendientes de plt.show().
 * NOTA: Pyodide corre en el hilo principal; el timeout reporta el exceso pero no
 * puede interrumpir un bucle infinito nativo.
 */
export async function runPython(code: string, opts: RunOptions = {}): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? 20_000
  const started = performance.now()
  let py: any
  try {
    py = await getPyodide()
  } catch (err: any) {
    return {
      stdout: '',
      stderr: '',
      figures: [],
      error: `No se pudo iniciar el runtime de Python: ${err?.message ?? err}`,
      durationMs: performance.now() - started,
      timedOut: false,
    }
  }

  const outLines: string[] = []
  const errLines: string[] = []
  py.setStdout({ batched: (s: string) => outLines.push(s) })
  py.setStderr({ batched: (s: string) => errLines.push(s) })

  const exec = (async (): Promise<RunResult> => {
    let error: string | null = null
    if (opts.globals) {
      for (const [k, v] of Object.entries(opts.globals)) {
        py.globals.set(k, v)
      }
    }
    try {
      await py.runPythonAsync(code)
    } catch (err: any) {
      // El mensaje de Pyodide incluye el traceback completo; nos quedamos con lo útil.
      const msg = String(err?.message ?? err)
      const lines = msg.split('\n').filter((l) => l.trim().length > 0)
      error = lines.slice(-6).join('\n')
    }
    let figures: string[] = []
    try {
      const proxy = await py.runPythonAsync('_sinapsis_take_figures()')
      figures = proxy.toJs()
      proxy.destroy?.()
    } catch {
      figures = []
    }
    return {
      stdout: outLines.join('\n'),
      stderr: errLines.join('\n'),
      figures,
      error,
      durationMs: performance.now() - started,
      timedOut: false,
    }
  })()

  const timeout = new Promise<RunResult>((resolve) => {
    setTimeout(() => {
      resolve({
        stdout: outLines.join('\n'),
        stderr: errLines.join('\n'),
        figures: [],
        error: `__TIMEOUT__: la ejecución superó ${Math.round(timeoutMs / 1000)}s. Revisa bucles infinitos o cálculos demasiado pesados.`,
        durationMs: performance.now() - started,
        timedOut: true,
      })
    }, timeoutMs)
  })

  return Promise.race([exec, timeout])
}
