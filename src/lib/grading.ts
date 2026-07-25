/**
 * grading.ts — Corrección automática de ejercicios ("Corregir").
 *
 * Flujo: ejecuta `user_code` en Pyodide y, en el mismo namespace, el harness
 * `test_code`. Antes del test_code se inyecta el helper:
 *
 *   check(nombre, fn=None, *, cond=None, msg='')
 *     - fn: callable que devuelve bool (o lanza excepción → test falla)
 *     - cond: alternativa directa booleana
 *     - msg: mensaje en español mostrado al usuario si el test falla
 *
 * Disponibles en el harness: `np` (numpy), `npt` (numpy.testing), `check`,
 * y todo lo definido por el código del usuario.
 *
 * API:
 *   gradeExercise(exercise, userCode) → Promise<GradingResult>
 */

import { runPython, getPyodide } from './pyodide'
import type { Exercise } from './exercises'

export interface TestResult {
  name: string
  passed: boolean
  /** Mensaje del autor del ejercicio (o excepción) si falló; '' si pasó */
  message: string
}

export interface GradingResult {
  results: TestResult[]
  passed: number
  total: number
  /** passed/total ∈ [0,1] */
  score: number
  allPassed: boolean
  /** XP otorgado (= exercise.xp si allPassed, si no 0) */
  xpAwarded: number
  /** stdout combinado de user_code + harness */
  stdout: string
  /** Error fatal (código del usuario roto, timeout, runtime caído) o null */
  fatalError: string | null
}

const HARNESS_PREAMBLE = `
import numpy as np
import numpy.testing as npt

_sinapsis_results = []

def check(nombre, fn=None, *, cond=None, msg=''):
    """Registra el resultado de un test. Uso: check('nombre', lambda: ..., msg='...')
    Si fn() devuelve None (p. ej. npt.assert_allclose sin excepción) cuenta como PASS."""
    try:
        if cond is not None:
            ok = bool(cond)
        else:
            _r = fn()
            ok = True if _r is None else bool(_r)
        _sinapsis_results.append((str(nombre), ok, '' if ok else str(msg)))
    except Exception as _e:
        _sinapsis_results.append((str(nombre), False, str(_e)))
`

const COLLECT = `
import json as _json
_json.dumps(_sinapsis_results)
`

/**
 * Ejecuta el código del usuario seguido del harness de tests y parsea
 * los resultados por test.
 */
export async function gradeExercise(exercise: Exercise, userCode: string): Promise<GradingResult> {
  const combined = [
    '# ---- código del usuario ----',
    userCode,
    '\n# ---- harness de corrección ----',
    HARNESS_PREAMBLE,
    exercise.test_code,
  ].join('\n')

  const run = await runPython(combined, { timeoutMs: 25_000 })

  if (run.error) {
    // Error fatal: el código del usuario rompió antes de que corrieran los tests
    return {
      results: [],
      passed: 0,
      total: 0,
      score: 0,
      allPassed: false,
      xpAwarded: 0,
      stdout: run.stdout,
      fatalError: run.error,
    }
  }

  let results: TestResult[] = []
  try {
    const py = await getPyodide()
    const raw = await py.runPythonAsync(COLLECT)
    const parsed = JSON.parse(raw) as Array<[string, boolean, string]>
    results = parsed.map(([name, passed, message]) => ({ name, passed, message }))
  } catch {
    return {
      results: [],
      passed: 0,
      total: 0,
      score: 0,
      allPassed: false,
      xpAwarded: 0,
      stdout: run.stdout,
      fatalError: 'No se pudieron recoger los resultados de los tests.',
    }
  }

  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const score = total > 0 ? passed / total : 0
  const allPassed = total > 0 && passed === total

  return {
    results,
    passed,
    total,
    score,
    allPassed,
    xpAwarded: allPassed ? exercise.xp : 0,
    stdout: run.stdout,
    fatalError: null,
  }
}
