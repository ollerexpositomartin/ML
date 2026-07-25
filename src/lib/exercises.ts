/**
 * exercises.ts — TIPOS y REGISTRO de ejercicios autocorregidos.
 *
 * Los agentes de contenido añaden ejercicios con registerExercises({...})
 * (o importando y extendiendo EXERCISES) desde el módulo de su página.
 *
 * Convención de test_code (ver grading.ts): el harness inyecta
 *   check(nombre: str, fn: Callable[[], bool] | None = None, *, cond: bool | None = None, msg: str = '')
 * Disponible: numpy como np, numpy.testing como npt, y todo lo definido por
 * el código del usuario (que se ejecuta antes en el mismo namespace).
 */

export type ExerciseDifficulty = 'BASICO' | 'INTERMEDIO' | 'AVANZADO'

export interface Exercise {
  /** id único, p.ej. 'fundamentos-reg-lineal' */
  id: string
  title: string
  difficulty: ExerciseDifficulty
  /** XP otorgado al superar todos los tests */
  xp: number
  /** Enunciado: markdown básico con segmentos KaTeX ($...$ / $$...$$) */
  statement: string
  /** Código inicial que ve el usuario en el editor */
  starter_code: string
  /** Solución de referencia (oculta; debe pasar test_code) */
  solution_code: string
  /** Harness de tests (ver grading.ts). Se ejecuta tras el código del usuario. */
  test_code: string
  /** Pistas progresivas (máx. 3, cada una cuesta XP al revelarla) */
  hints: string[]
}

/** Registro global de ejercicios. */
export const EXERCISES: Record<string, Exercise> = {}

/** Registra un lote de ejercicios (idempotente por id). */
export function registerExercises(batch: Record<string, Exercise> | Exercise[]): void {
  if (Array.isArray(batch)) {
    for (const ex of batch) EXERCISES[ex.id] = ex
  } else {
    Object.assign(EXERCISES, batch)
  }
}

/** Devuelve un ejercicio por id o undefined. */
export function getExercise(id: string): Exercise | undefined {
  return EXERCISES[id]
}

/** Lista todos los ejercicios registrados. */
export function allExercises(): Exercise[] {
  return Object.values(EXERCISES)
}

/* ------------------------------------------------------------------ */
/* Ejercicios de ejemplo (funcionales, la solución pasa los tests)     */
/* ------------------------------------------------------------------ */

const regLineal: Exercise = {
  id: 'fundamentos-reg-lineal',
  title: 'Tu primera regresión lineal',
  difficulty: 'BASICO',
  xp: 50,
  statement: [
    'Implementa `ajustar_recta(X, y)` que devuelva `(w, b)` de la recta de mínimos cuadrados $\\hat{y} = wx + b$.',
    '',
    'Recuerda la solución en forma cerrada:',
    '$$w = \\frac{\\sum_i (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum_i (x_i - \\bar{x})^2}, \\qquad b = \\bar{y} - w\\bar{x}$$',
    '',
    'Puedes usar la fórmula explícita o `np.linalg.lstsq`. No vale usar `np.polyfit` (queremos que entiendas la matemática).',
  ].join('\n'),
  starter_code: `import numpy as np

def ajustar_recta(X, y):
    """
    Devuelve (w, b) de la recta de mínimos cuadrados y = w*x + b.
    X, y: arrays 1D de numpy con la misma longitud.
    """
    # TODO: calcula w y b con la solución en forma cerrada
    w = 0.0
    b = 0.0
    return w, b

# Prueba rápida (puedes modificarla)
X = np.array([0.0, 1.0, 2.0, 3.0])
y = np.array([1.0, 3.0, 5.0, 7.0])
w, b = ajustar_recta(X, y)
print(f"w = {w:.3f}, b = {b:.3f}")  # esperado: w=2.000, b=1.000
`,
  solution_code: `import numpy as np

def ajustar_recta(X, y):
    x_mean = X.mean()
    y_mean = y.mean()
    w = ((X - x_mean) * (y - y_mean)).sum() / ((X - x_mean) ** 2).sum()
    b = y_mean - w * x_mean
    return float(w), float(b)
`,
  test_code: `
rng = np.random.default_rng(7)
X_t = rng.uniform(-5, 5, 60)
y_t = 2.7 * X_t - 1.3 + rng.normal(0, 0.4, 60)

_w_ref, _b_ref = np.polyfit(X_t, y_t, 1)
_res = ajustar_recta(X_t, y_t)
check("La función devuelve una tupla (w, b)", lambda: isinstance(_res, tuple) and len(_res) == 2,
      msg="ajustar_recta debe devolver (w, b)")
_w, _b = _res
check("La pendiente w es correcta (±0.05)", lambda: np.allclose(_w, _w_ref, atol=0.05),
      msg=f"w={_w:.4f} pero debería ser aproximadamente {_w_ref:.4f}")
check("El intercepto b es correcto (±0.3)", lambda: np.allclose(_b, _b_ref, atol=0.3),
      msg=f"b={_b:.4f} pero debería ser aproximadamente {_b_ref:.4f}")
check("Generaliza a otros datos", lambda: np.allclose(
        ajustar_recta(np.array([0., 1., 2., 3.]), np.array([1., 3., 5., 7.]))[0], 2.0, atol=1e-6),
      msg="Con datos perfectos y=2x+1 la pendiente debe ser exactamente 2")
`,
  hints: [
    'Centra los datos: resta la media a X y a y antes de calcular la pendiente.',
    '$w$ es la covarianza de (X, y) dividida entre la varianza de X: `(X·y centrados).sum() / ((X-x̄)**2).sum()`.',
    'Una vez tengas $w$, el intercepto es $b = \\bar{y} - w\\bar{x}$.',
  ],
}

const mseExercise: Exercise = {
  id: 'fundamentos-mse',
  title: 'La función de coste MSE',
  difficulty: 'BASICO',
  xp: 40,
  statement: [
    'Implementa `mse(y_true, y_pred)` que calcule el **error cuadrático medio**:',
    '$$\\mathrm{MSE} = \\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$$',
    '',
    'Debe aceptar arrays de numpy de cualquier forma (aplánalos) y devolver un `float`.',
  ].join('\n'),
  starter_code: `import numpy as np

def mse(y_true, y_pred):
    """Error cuadrático medio entre y_true e y_pred."""
    # TODO
    return 0.0

print(mse(np.array([1.0, 2.0]), np.array([1.0, 4.0])))  # esperado: 2.0
`,
  solution_code: `import numpy as np

def mse(y_true, y_pred):
    diff = np.asarray(y_true, dtype=float).ravel() - np.asarray(y_pred, dtype=float).ravel()
    return float(np.mean(diff ** 2))
`,
  test_code: `
check("Caso básico correcto", lambda: np.allclose(mse(np.array([1., 2.]), np.array([1., 4.])), 2.0),
      msg="mse([1,2],[1,4]) debería ser 2.0")
check("Devuelve un float", lambda: isinstance(mse(np.array([1., 2.]), np.array([1., 2.])), float),
      msg="mse debe devolver un float de Python, no un array")
check("Error cero con predicción perfecta", lambda: mse(np.arange(10.), np.arange(10.)) == 0.0,
      msg="Con predicción perfecta el MSE debe ser 0")
check("Acepta matrices 2D", lambda: np.allclose(mse(np.ones((3, 4)), np.zeros((3, 4))), 1.0),
      msg="mse debe aplanar arrays 2D: mse(unos, ceros) = 1")
`,
  hints: [
    'Eleva al cuadrado la diferencia elemento a elemento y luego toma la media.',
    '`np.asarray(x).ravel()` aplana cualquier array a 1D.',
  ],
}

registerExercises([regLineal, mseExercise])
