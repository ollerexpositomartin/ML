/**
 * fundamentos.ts — Ejercicios autocorregidos del módulo Fundamentos (N0–N1).
 * 5 ejercicios (BÁSICO → AVANZADO) + quiz conceptual en la página (QuizCard).
 * Todas las solution_code pasan su propio test_code al 100 % (verificado con
 * python3 + numpy 2.x replicando el harness check()).
 */

import type { Exercise } from '@/lib/exercises'

export const FUNDAMENTOS_EXERCISES: Exercise[] = [
  {
    id: 'fund-mse',
    title: 'E1 · Tu primera pérdida',
    difficulty: 'BASICO',
    xp: 20,
    statement: [
      'Toda la optimización en ML empieza midiendo qué tan mal lo hace el modelo. Implementa `mse(y, y_hat)`, el **error cuadrático medio**:',
      '$$L = \\frac{1}{N}\\sum_{i=1}^{N} \\left(y_i - \\hat{y}_i\\right)^2$$',
      'Debe aceptar listas o arrays de numpy de cualquier forma (aplánalos) y devolver un `float` de Python.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def mse(y, y_hat):
    """
    Error cuadrático medio entre y (valores reales) e y_hat (predicciones).
    Acepta listas o arrays de numpy; devuelve un float.
    """
    # TODO: diferencia, cuadrado, media
    return 0.0

# Prueba rápida
print(mse([1.0, 2.0], [1.0, 4.0]))  # esperado: 2.0
`,
    solution_code: `import numpy as np

def mse(y, y_hat):
    y = np.asarray(y, dtype=float).ravel()
    y_hat = np.asarray(y_hat, dtype=float).ravel()
    return float(np.mean((y - y_hat) ** 2))
`,
    test_code: `
check("Caso básico: mse([1,2],[1,4]) = 2", lambda: np.allclose(mse([1.0, 2.0], [1.0, 4.0]), 2.0),
      msg="media de (0², 2²) = 2")
check("Devuelve un float de Python", lambda: isinstance(mse(np.array([1., 2.]), np.array([1., 2.])), float),
      msg="convierte el resultado con float(...)")
check("Predicción perfecta → pérdida 0", lambda: mse(np.arange(10.), np.arange(10.)) == 0.0,
      msg="si y == y_hat el MSE debe ser exactamente 0")
check("Acepta matrices 2D", lambda: np.allclose(mse(np.ones((3, 4)), np.zeros((3, 4))), 1.0),
      msg="aplana los arrays con ravel() antes de operar")
_rng = np.random.default_rng(3)
_y = _rng.normal(0, 3, 200)
_e = _rng.normal(0, 1, 200)
check("Coincide con la referencia en datos aleatorios",
      lambda: np.allclose(mse(_y, _y + _e), float(np.mean(_e ** 2)), rtol=1e-8),
      msg="revisa la fórmula: media de los errores al cuadrado")
`,
    hints: [
      'Tres pasos: diferencia elemento a elemento, elevar al cuadrado, `np.mean`.',
      '`np.asarray(x, dtype=float).ravel()` convierte listas y matrices a un vector 1D.',
      'Envuelve el resultado con `float(...)` para devolver un escalar de Python.',
    ],
  },
  {
    id: 'fund-grad-step',
    title: 'E2 · Un paso de descenso del gradiente',
    difficulty: 'BASICO',
    xp: 30,
    statement: [
      'Para el modelo $\\hat{y} = wx + b$ con pérdida MSE, los gradientes exactos son:',
      '$$\\frac{\\partial L}{\\partial w} = \\frac{2}{N}\\sum_i x_i\\,(\\hat{y}_i - y_i), \\qquad \\frac{\\partial L}{\\partial b} = \\frac{2}{N}\\sum_i (\\hat{y}_i - y_i)$$',
      'Implementa `grad_step(w, b, X, y, lr)` que realice **un** paso de descenso $w \\leftarrow w - \\eta\\,\\partial L/\\partial w$, $b \\leftarrow b - \\eta\\,\\partial L/\\partial b$ y devuelva la tupla `(w_nuevo, b_nuevo)` como floats.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def grad_step(w, b, X, y, lr):
    """
    Un paso de descenso del gradiente sobre MSE para y_hat = w*X + b.
    X, y: arrays 1D con N muestras. lr: tasa de aprendizaje (eta).
    Devuelve (w_nuevo, b_nuevo).
    """
    # TODO: predicción, error, gradientes, actualización
    return w, b

X = np.array([0.0, 1.0, 2.0, 3.0])
y = np.array([1.0, 3.0, 5.0, 7.0])
print(grad_step(0.0, 0.0, X, y, 0.1))  # da el primer paso hacia w=2, b=1
`,
    solution_code: `import numpy as np

def grad_step(w, b, X, y, lr):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    err = (w * X + b) - y
    N = X.shape[0]
    dw = (2.0 / N) * np.dot(X, err)
    db = (2.0 / N) * np.sum(err)
    return float(w - lr * dw), float(b - lr * db)
`,
    test_code: `
_rng = np.random.default_rng(11)
_X = _rng.uniform(-3, 4, 80)
_y = 1.7 * _X - 0.6 + _rng.normal(0, 0.3, 80)
_w0, _b0, _lr = 0.4, -1.2, 0.05

# Gradiente de referencia calculado a mano
_err = (_w0 * _X + _b0) - _y
_dw_ref = (2.0 / _X.size) * np.dot(_X, _err)
_db_ref = (2.0 / _X.size) * np.sum(_err)
_wn, _bn = grad_step(_w0, _b0, _X, _y, _lr)

check("Devuelve una tupla de dos elementos",
      lambda: isinstance(grad_step(_w0, _b0, _X, _y, _lr), tuple) and len(grad_step(_w0, _b0, _X, _y, _lr)) == 2,
      msg="grad_step debe devolver (w_nuevo, b_nuevo)")
check("El gradiente de w es el exacto", lambda: np.allclose(_wn, _w0 - _lr * _dw_ref, rtol=1e-6),
      msg="dL/dw = (2/N) · Xᵀ·(y_hat − y)")
check("El gradiente de b es el exacto", lambda: np.allclose(_bn, _b0 - _lr * _db_ref, rtol=1e-6),
      msg="dL/db = (2/N) · Σ(y_hat − y)")

def _mse(w, b):
    e = (w * _X + b) - _y
    return float(np.mean(e ** 2))

check("La pérdida disminuye tras el paso", lambda: _mse(_wn, _bn) < _mse(_w0, _b0),
      msg="con lr pequeña, un paso de descenso siempre reduce el MSE: revisa el signo")

def _train():
    w, b = 0.0, 0.0
    for _ in range(400):
        w, b = grad_step(w, b, _X, _y, 0.1)
    return w, b

check("Converge tras muchos pasos", lambda: (lambda r: abs(r[0] - 1.7) < 0.1 and abs(r[1] + 0.6) < 0.3)(_train()),
      msg="400 pasos con lr=0.1 deberían acercarte a w≈1.7, b≈−0.6")
`,
    hints: [
      'Primero calcula el error de cada muestra: `err = w * X + b - y`.',
      '$\\partial L/\\partial w$ es la media de `2 * X * err`; usa `np.dot(X, err) / N` para vectorizar.',
      'El paso RESTA el gradiente multiplicado por lr: `w - lr * dw`. Cuidado con el signo.',
    ],
  },
  {
    id: 'fund-fit-gd',
    title: 'E3 · Regresión completa con descenso del gradiente',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: [
      'Ahora el bucle completo. Implementa `fit_gd(X, y, lr, epochs)` que entrene $\\hat{y} = wx + b$ minimizando el MSE con descenso del gradiente **batch**, partiendo de $w = 0,\\; b = 0$.',
      'Debe devolver `(w, b, losses)`: los parámetros finales (floats) y una lista `losses` con el MSE **antes de cada actualización** (longitud `epochs`).',
      '$$\\theta \\leftarrow \\theta - \\eta\\,\\nabla L(\\theta) \\quad \\text{repetido } \\texttt{epochs} \\text{ veces}$$',
    ].join('\n\n'),
    starter_code: `import numpy as np

def fit_gd(X, y, lr, epochs):
    """
    Entrena y_hat = w*x + b con descenso del gradiente sobre MSE.
    Devuelve (w, b, losses) con len(losses) == epochs.
    """
    w, b = 0.0, 0.0
    losses = []
    # TODO: bucle de entrenamiento
    return w, b, losses

X = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
y = np.array([1.0, 3.0, 5.0, 7.0, 9.0])
w, b, losses = fit_gd(X, y, 0.1, 200)
print(f"w={w:.3f}, b={b:.3f}, loss final={losses[-1]:.6f}")  # esperado ≈ w=2, b=1
`,
    solution_code: `import numpy as np

def fit_gd(X, y, lr, epochs):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    N = X.shape[0]
    w, b = 0.0, 0.0
    losses = []
    for _ in range(epochs):
        err = (w * X + b) - y
        losses.append(float(np.mean(err ** 2)))
        dw = (2.0 / N) * np.dot(X, err)
        db = (2.0 / N) * np.sum(err)
        w -= lr * dw
        b -= lr * db
    return float(w), float(b), losses
`,
    test_code: `
_rng = np.random.default_rng(5)
_X = _rng.uniform(-2, 5, 120)
_y = 2.4 * _X + 0.8 + _rng.normal(0, 0.5, 120)
_w_ref, _b_ref = np.polyfit(_X, _y, 1)
_w, _b, _losses = fit_gd(_X, _y, 0.05, 800)

check("losses es una lista de longitud epochs",
      lambda: isinstance(_losses, list) and len(_losses) == 800,
      msg="registra el MSE en cada época (antes de actualizar)")
check("La pérdida casi no aumenta (descenso monótono ±1 %)",
      lambda: all(_losses[i + 1] <= _losses[i] * 1.01 + 1e-9 for i in range(len(_losses) - 1)),
      msg="con lr=0.05 el MSE debe decrecer época a época")
check("La pérdida final es mucho menor que la inicial",
      lambda: _losses[-1] < 0.02 * _losses[0],
      msg="800 épocas con lr=0.05 deberían reducir el MSE al menos 50×")
check("w coincide con la solución exacta OLS (±0.05)", lambda: np.allclose(_w, _w_ref, atol=0.05),
      msg="w debe acercarse a la solución de mínimos cuadrados")
check("b coincide con la solución exacta OLS (±0.15)", lambda: np.allclose(_b, _b_ref, atol=0.15),
      msg="b debe acercarse a la solución de mínimos cuadrados")
check("Devuelve floats", lambda: isinstance(_w, float) and isinstance(_b, float),
      msg="convierte w y b con float(...) al devolverlos")
`,
    hints: [
      'En cada época: predice, calcula `err`, guarda `np.mean(err**2)` en `losses` y DESPUÉS actualiza.',
      'Los gradientes son los del ejercicio anterior: `(2/N)·np.dot(X, err)` y `(2/N)·err.sum()`.',
      'Si la pérdida explota, revisa el signo de la actualización: es `w -= lr * dw`.',
    ],
  },
  {
    id: 'fund-predict',
    title: 'E4 · Predicción vectorizada',
    difficulty: 'BASICO',
    xp: 20,
    statement: [
      'Implementa `predict(X, w, b)` que devuelva las predicciones $\\hat{y} = X \\cdot w + b$ **vectorizadas** (sin bucles `for` de Python).',
      '`X` es un array 1D de numpy y `w`, `b` escalares. La función debe devolver un `np.ndarray` de la misma forma que `X`.',
      'La vectorización no es un detalle estético: una predicción sobre un millón de puntos con `for` tarda ~1000× más que con numpy.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def predict(X, w, b):
    """
    Predicción vectorizada del modelo lineal.
    X: array 1D. w, b: escalares. Devuelve np.ndarray con la forma de X.
    """
    # TODO: una sola línea, sin bucles
    return None

print(predict(np.array([0.0, 1.0, 2.0]), 2.0, 1.0))  # esperado: [1. 3. 5.]
`,
    solution_code: `import numpy as np

def predict(X, w, b):
    return np.asarray(X, dtype=float) * w + b
`,
    test_code: `
check("Valores correctos", lambda: np.allclose(predict(np.array([0., 1., 2.]), 2.0, 1.0), [1., 3., 5.]),
      msg="y_hat = w·x + b elemento a elemento")
check("Devuelve un np.ndarray", lambda: isinstance(predict(np.array([1., 2.]), 1.0, 0.0), np.ndarray),
      msg="no devuelvas una lista: opera directamente con el array")
check("Conserva la forma de X", lambda: predict(np.zeros((7,)), 3.0, -1.0).shape == (7,),
      msg="la salida debe tener la misma forma que la entrada")
check("Funciona con b negativo y w fraccionario",
      lambda: np.allclose(predict(np.array([-2., 0.5]), 0.25, -0.5), [-1.0, -0.375]),
      msg="y_hat = 0.25·x − 0.5")
_rng = np.random.default_rng(2)
_Xbig = _rng.uniform(-10, 10, 1_000_000)
check("Escala a 1M de puntos (vectorizada)",
      lambda: np.allclose(predict(_Xbig, 1.5, 2.0), _Xbig * 1.5 + 2.0),
      msg="con numpy esto es instantáneo; con un bucle for, no")
`,
    hints: [
      'En numpy, `X * w + b` ya aplica la operación a todos los elementos.',
      'Asegúrate de trabajar sobre un array: `np.asarray(X, dtype=float)`.',
    ],
  },
  {
    id: 'fund-poly-ridge',
    title: 'E5 · AVANZADO: regresión polinómica con regularización ridge',
    difficulty: 'AVANZADO',
    xp: 120,
    statement: [
      'Ejercicio multi-paso. Vas a ajustar un polinomio de grado arbitrario con **solución en forma cerrada** y regularización $L_2$.',
      '**Paso 1 — features polinómicas**: para grado $d$, construye la matriz de Vandermonde $V$ con columnas $[1, x, x^2, \\dots, x^d]$ (`np.vander(X, d+1, increasing=True)`).',
      '**Paso 2 — ridge en forma cerrada**: minimizar $\\|y - Vw\\|^2 + \\lambda\\|w\\|^2$ tiene solución exacta:',
      '$$w = \\left(V^{\\top}V + \\lambda I\\right)^{-1} V^{\\top} y$$',
      'Implementa `fit_poly(X, y, degree, lam)` que devuelva el vector de coeficientes `w` (array de longitud `degree + 1`, del término constante a $x^{degree}$). **No regularices el intercepto**: el elemento $(0,0)$ de $\\lambda I$ debe ser 0. Usa `np.linalg.solve` en lugar de invertir la matriz (más estable y más rápido).',
      '**Paso 3 — verificación**: tu solución se probará recuperando un polinomio cúbico sin ruido, comprobando que $\\lambda$ encoge $\\|w\\|_2$ y midiendo la generalización en datos held-out.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def fit_poly(X, y, degree, lam):
    """
    Regresión polinómica ridge en forma cerrada.
    X, y: arrays 1D con N muestras.
    degree: grado del polinomio (entero >= 0).
    lam: fuerza de la regularización L2 (>= 0); no penaliza el intercepto.
    Devuelve w: np.ndarray de forma (degree + 1,), coeficientes de 1, x, ..., x^degree.
    """
    # Paso 1: matriz de Vandermonde
    # Paso 2: resuelve (VᵀV + λI) w = Vᵀ y  con I[0,0] = 0
    return np.zeros(degree + 1)

# Prueba rápida: recupera y = 1 + 2x - x² + 0.5x³
X = np.linspace(-2, 2, 30)
y = 1 + 2 * X - X ** 2 + 0.5 * X ** 3
print(fit_poly(X, y, 3, 0.0))  # esperado ≈ [1. 2. -1. 0.5]
`,
    solution_code: `import numpy as np

def fit_poly(X, y, degree, lam):
    X = np.asarray(X, dtype=float).ravel()
    y = np.asarray(y, dtype=float).ravel()
    V = np.vander(X, N=degree + 1, increasing=True)
    I = np.eye(degree + 1)
    I[0, 0] = 0.0  # el intercepto no se regulariza
    w = np.linalg.solve(V.T @ V + lam * I, V.T @ y)
    return w
`,
    test_code: `
# --- Paso 1+2: recuperación exacta sin ruido ---
_Xs = np.linspace(-2, 2, 40)
_ys = 1 + 2 * _Xs - _Xs ** 2 + 0.5 * _Xs ** 3
_w = fit_poly(_Xs, _ys, 3, 0.0)

check("Devuelve un array de longitud degree+1", lambda: isinstance(_w, np.ndarray) and _w.shape == (4,),
      msg="w debe ser un np.ndarray con un coeficiente por potencia de x")
check("Recupera el cúbico exacto (sin ruido, λ=0)",
      lambda: bool(np.allclose(_w, [1.0, 2.0, -1.0, 0.5], atol=1e-4)),
      msg="con λ=0 y datos perfectos, w debe ser [1, 2, −1, 0.5]")
check("Los coeficientes van de grado 0 a degree",
      lambda: np.allclose(fit_poly(np.array([0., 1., 2.]), np.array([3., 5., 7.]), 1, 0.0), [3.0, 2.0], atol=1e-6),
      msg="y = 3 + 2x → w = [3, 2] (constante primero)")

# --- Paso 3a: ridge encoge la norma ---
_rng = np.random.default_rng(9)
_Xt = _rng.uniform(-1.5, 1.5, 60)
_yt = np.sin(2 * _Xt) + _rng.normal(0, 0.15, 60)
_w0 = fit_poly(_Xt, _yt, 10, 0.0)
_wl = fit_poly(_Xt, _yt, 10, 5.0)
check("λ grande encoge ‖w‖₂ (ridge)",
      lambda: float(np.linalg.norm(_wl)) < 0.7 * float(np.linalg.norm(_w0)),
      msg="con λ=5 la norma de w debe ser claramente menor que con λ=0")
check("El intercepto apenas se penaliza",
      lambda: (abs(_wl[0]) > 0.3 * abs(_w0[0])) if abs(_w0[0]) > 1e-6 else True,
      msg="recuerda: I[0,0] = 0 para no regularizar el término constante")

# --- Paso 3b: generalización held-out (sobreajuste severo: grado 12 con 16 puntos) ---
def _obj(x):
    return 1 + 2 * x - x ** 2 + 0.5 * x ** 3
_rng3 = np.random.default_rng(9)
_Xt2 = _rng3.uniform(-1.5, 1.5, 16)
_yt2 = _obj(_Xt2) + _rng3.normal(0, 0.2, 16)
_Xv2 = _rng3.uniform(-1.5, 1.5, 400)
_yv2 = _obj(_Xv2) + _rng3.normal(0, 0.2, 400)
def _val_mse(w):
    V = np.vander(_Xv2, N=w.shape[0], increasing=True)
    return float(np.mean((_yv2 - V @ w) ** 2))
check("Ridge generaliza mejor en validación",
      lambda: _val_mse(fit_poly(_Xt2, _yt2, 12, 1.0)) < 0.5 * _val_mse(fit_poly(_Xt2, _yt2, 12, 0.0)),
      msg="con grado 12 y 16 puntos, λ=1 debe reducir claramente el MSE de validación")
check("Con λ=0 coincide con mínimos cuadrados (lstsq)",
      lambda: bool(np.allclose(fit_poly(_Xt, _yt, 3, 0.0),
                               np.linalg.lstsq(np.vander(_Xt, 4, increasing=True), _yt, rcond=None)[0], atol=1e-6)),
      msg="λ=0 debe reproducir exactamente la solución de mínimos cuadrados")
`,
    hints: [
      '`np.vander(X, N=degree + 1, increasing=True)` te da las columnas $1, x, x^2, \\dots$ en el orden pedido.',
      'Construye `I = np.eye(degree + 1)` y pon `I[0, 0] = 0.0` antes de multiplicar por λ.',
      'Resuelve el sistema con `np.linalg.solve(V.T @ V + lam * I, V.T @ y)` — no uses `np.linalg.inv`.',
    ],
  },
]
