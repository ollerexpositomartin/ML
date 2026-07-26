/**
 * fundamentos.ts — Ejercicios autocorregidos del módulo Fundamentos (N0–N1).
 * Rampa completa: 5 ejercicios «desde cero absoluto» (E0.x, BÁSICO, bucles a
 * mano) + 5 ejercicios originales (BÁSICO → AVANZADO) + 3 del proyecto
 * práctico «precio de vivienda» (P1.x) + quiz en la página.
 * Todas las solution_code pasan su propio test_code al 100 % (verificado con
 * python3 + numpy 2.x replicando el harness check()).
 */

import type { Exercise } from '@/lib/exercises'

export const FUNDAMENTOS_EXERCISES: Exercise[] = [
  {
    id: 'fund-cero-recta',
    title: 'E0.1 · La recta: predecir con y = mx + b',
    difficulty: 'BASICO',
    xp: 10,
    statement: [
      'Tu primer «modelo» es una recta. Dados la pendiente $m$ y el intercepto $b$, el valor predicho es:',
      '$$y = m\\,x + b$$',
      'Implementa `recta(x, m, b)` que devuelva ese valor. Debe funcionar con números sueltos **y** con arrays de numpy (si no usas bucles, numpy se encarga solo).',
    ].join('\n\n'),
    starter_code: `import numpy as np

def recta(x, m, b):
    """
    Evalúa la recta y = m*x + b.
    x puede ser un número o un array de numpy.
    """
    # TODO: una sola línea
    return 0.0

print(recta(3, 2, 1))                      # esperado: 7
print(recta(np.array([0.0, 1.0]), 2, 1))   # esperado: [1. 3.]
`,
    solution_code: `import numpy as np

def recta(x, m, b):
    return m * x + b
`,
    test_code: `
check("Punto básico: recta(3, 2, 1) = 7", lambda: np.allclose(recta(3, 2, 1), 7),
      msg="sustituye: y = m·x + b = 2·3 + 1 = 7")
check("Cuando x = 0 queda solo b", lambda: np.allclose(recta(0, 5, -2), -2),
      msg="y = m·0 + b = b: por eso b se llama intercepto")
check("Pendiente negativa: la recta baja", lambda: np.allclose(recta(4, -0.5, 10), 8),
      msg="y = −0.5·4 + 10 = 8")
check("Funciona con arrays de numpy", lambda: np.allclose(recta(np.array([0., 1., 2.]), 2.0, 1.0), [1., 3., 5.]),
      msg="sin bucles: m * x + b ya opera elemento a elemento sobre el array")
`,
    hints: [
      'Es literalmente traducir la fórmula: `m * x + b`.',
      'No pongas bucles: numpy multiplica el array entero por el escalar.',
    ],
  },
  {
    id: 'fund-cero-sumatoria',
    title: 'E0.2 · La sumatoria Σ es un bucle',
    difficulty: 'BASICO',
    xp: 15,
    statement: [
      'La letra $\\Sigma$ (sigma mayúscula) solo significa «suma todo esto»:',
      '$$\\sum_{i=1}^{N} x_i = x_1 + x_2 + \\dots + x_N$$',
      'Implementa `sumatoria(valores)` que sume todos los números de la lista **con un bucle `for` escrito a mano** — sin `sum()` ni `np.sum()`: queremos que veas con tus ojos el bucle que esconde la Σ. Debe devolver un `float`.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def sumatoria(valores):
    """
    Suma todos los valores: eso es exactamente Σ.
    Receta: total = 0.0; para cada v en valores: total += v.
    """
    # TODO: el bucle
    return 0.0

print(sumatoria([1, 2, 3]))  # esperado: 6.0
`,
    solution_code: `import numpy as np

def sumatoria(valores):
    total = 0.0
    for v in valores:
        total += v
    return float(total)
`,
    test_code: `
check("Σ [1, 2, 3] = 6", lambda: np.allclose(sumatoria([1, 2, 3]), 6.0),
      msg="1 + 2 + 3 = 6: acumula cada valor en un total")
check("Devuelve un float", lambda: isinstance(sumatoria([1, 2]), float),
      msg="empieza el acumulador en 0.0 o envuelve el resultado con float(...)")
check("La lista vacía suma 0", lambda: sumatoria([]) == 0.0,
      msg="la suma de nada es 0 (el bucle simplemente no entra)")
check("Acepta arrays de numpy y negativos", lambda: np.allclose(sumatoria(np.array([0.5, 1.5, -2.0])), 0.0),
      msg="0.5 + 1.5 − 2.0 = 0")
_rng = np.random.default_rng(1)
_datos = _rng.normal(0, 5, 100)
check("Coincide con np.sum en 100 datos aleatorios",
      lambda: np.allclose(sumatoria(_datos), float(np.sum(_datos)), rtol=1e-8),
      msg="tu bucle debe acumular exactamente lo mismo que np.sum")
`,
    hints: [
      'Crea `total = 0.0` ANTES del bucle y súmale cada elemento dentro.',
      '`for v in valores:` recorre la lista elemento a elemento.',
      'Devuelve `float(total)` para asegurar el tipo.',
    ],
  },
  {
    id: 'fund-cero-media-varianza',
    title: 'E0.3 · Media y varianza: centro y dispersión',
    difficulty: 'BASICO',
    xp: 15,
    statement: [
      'Los dos resúmenes más usados de unos datos. La **media** es «suma ÷ cuenta»; la **varianza** mide qué tan dispersos están: la media de las distancias **al cuadrado** a la media:',
      '$$\\bar{x} = \\frac{1}{N}\\sum_{i=1}^{N} x_i, \\qquad \\mathrm{Var}(x) = \\frac{1}{N}\\sum_{i=1}^{N} (x_i - \\bar{x})^2$$',
      'Implementa `media(datos)` y `varianza(datos)` con bucles a mano (sin `np.mean`/`np.var`: traduce la Σ tú mismo). Nota: dividimos entre $N$, no entre $N-1$.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def media(datos):
    """La media: suma de los datos dividida entre cuántos hay."""
    # TODO
    return 0.0

def varianza(datos):
    """La varianza: media de (cada dato - la media)². Usa tu media()."""
    # TODO: dos pasos — primero la media, luego otro bucle con las distancias
    return 0.0

print(media([2, 4, 6]))      # esperado: 4.0
print(varianza([1, 2, 3]))   # esperado: 0.6666...
`,
    solution_code: `import numpy as np

def media(datos):
    total = 0.0
    n = 0
    for v in datos:
        total += v
        n += 1
    return total / n

def varianza(datos):
    m = media(datos)
    total = 0.0
    n = 0
    for v in datos:
        total += (v - m) ** 2
        n += 1
    return total / n
`,
    test_code: `
check("media([2, 4, 6]) = 4", lambda: np.allclose(media([2, 4, 6]), 4.0),
      msg="(2 + 4 + 6) / 3 = 4: suma ÷ cuenta")
check("varianza([1, 2, 3]) = 2/3", lambda: np.allclose(varianza([1, 2, 3]), 2.0 / 3.0),
      msg="media 2 → desviaciones (−1, 0, 1) → cuadrados (1, 0, 1) → media 2/3")
check("Datos constantes → varianza 0", lambda: varianza([7.0, 7.0, 7.0]) == 0.0,
      msg="si todos los datos son iguales no hay dispersión")
_rng = np.random.default_rng(4)
_datos = _rng.normal(10, 3, 200)
check("Tu media coincide con np.mean",
      lambda: np.allclose(media(_datos), float(np.mean(_datos)), rtol=1e-8),
      msg="la media es suma ÷ cuenta, nada más")
check("Tu varianza coincide con np.var",
      lambda: np.allclose(varianza(_datos), float(np.var(_datos)), rtol=1e-6),
      msg="media de (v − media)² — ojo: dividimos entre N, no entre N−1")
`,
    hints: [
      'En `media`: un bucle que acumula `total` y cuenta `n`; devuelve `total / n`.',
      'En `varianza`: llama a tu propia `media(datos)` y haz un segundo bucle acumulando `(v - m) ** 2`.',
      'La varianza también es una media: divide entre `n` al final.',
    ],
  },
  {
    id: 'fund-cero-producto-escalar',
    title: 'E0.4 · El producto escalar, pareja a pareja',
    difficulty: 'BASICO',
    xp: 20,
    statement: [
      'La operación estrella del ML: multiplicar dos listas **pareja a pareja** y sumar los resultados:',
      '$$a \\cdot b = \\sum_{i=1}^{n} a_i\\, b_i \\qquad [1,2,3] \\cdot [4,5,6] = 1{\\cdot}4 + 2{\\cdot}5 + 3{\\cdot}6 = 32$$',
      'Implementa `producto_escalar(a, b)` con un bucle a mano (sin `np.dot`: luego compararás tu resultado con el de numpy). Acepta listas o arrays y devuelve un `float`.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def producto_escalar(a, b):
    """
    Producto escalar: a[0]*b[0] + a[1]*b[1] + ...
    Bucle a mano: recorre los índices y acumula cada producto.
    """
    # TODO
    return 0.0

a = [1, 2, 3]
b = [4, 5, 6]
print(producto_escalar(a, b))  # esperado: 32.0
print(np.dot(a, b))            # numpy dice lo mismo: 32
`,
    solution_code: `import numpy as np

def producto_escalar(a, b):
    total = 0.0
    for i in range(len(a)):
        total += a[i] * b[i]
    return float(total)
`,
    test_code: `
check("[1,2,3] · [4,5,6] = 32", lambda: np.allclose(producto_escalar([1, 2, 3], [4, 5, 6]), 32.0),
      msg="1·4 + 2·5 + 3·6 = 4 + 10 + 18 = 32")
check("Vectores perpendiculares → 0", lambda: np.allclose(producto_escalar([1, 0], [0, 1]), 0.0),
      msg="[1,0] y [0,1] no comparten dirección: su producto escalar es 0")
check("Devuelve un float", lambda: isinstance(producto_escalar([1.0], [2.0]), float),
      msg="acumula desde 0.0 o envuelve el resultado con float(...)")
check("Funciona con arrays y negativos",
      lambda: np.allclose(producto_escalar(np.array([2., -1., 3.]), np.array([1., 4., 0.])), -2.0),
      msg="2·1 + (−1)·4 + 3·0 = −2")
_rng = np.random.default_rng(8)
_a = _rng.normal(0, 1, 50)
_b = _rng.normal(0, 1, 50)
check("Coincide con np.dot en datos aleatorios",
      lambda: np.allclose(producto_escalar(_a, _b), float(np.dot(_a, _b)), rtol=1e-8),
      msg="tu bucle hace exactamente lo mismo que np.dot (numpy solo es más rápido)")
`,
    hints: [
      'Recorre los índices: `for i in range(len(a)):` y acumula `a[i] * b[i]`.',
      'Empieza el acumulador en `0.0` para que el resultado sea float.',
      'Comprueba a mano el ejemplo: 1·4 + 2·5 + 3·6 = 32.',
    ],
  },
  {
    id: 'fund-cero-derivada-numerica',
    title: 'E0.5 · La derivada, medida con números',
    difficulty: 'BASICO',
    xp: 20,
    statement: [
      'La derivada es la pendiente de una curva en un punto. Se aproxima con dos puntos muy cercanos (la «secante»):',
      '$$f\\\'(x) \\approx \\frac{f(x + h) - f(x)}{h} \\quad \\text{con } h \\text{ pequeña}$$',
      'Implementa `pendiente(f, x, h=0.001)` que devuelva esa aproximación. Después comprobaremos la regla de la potencia: para $f(x) = x^2$, la pendiente en $x$ es $2x$.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def pendiente(f, x, h=0.001):
    """
    Aproximación numérica de la derivada de f en x:
    (f(x + h) - f(x)) / h
    """
    # TODO: una sola línea
    return 0.0

def cuadrado(x):
    return x ** 2

print(pendiente(cuadrado, 2))   # esperado ≈ 4.0 (la pendiente de x² en x=2 es 2·2)
print(pendiente(cuadrado, -3))  # esperado ≈ -6.0
`,
    solution_code: `import numpy as np

def pendiente(f, x, h=0.001):
    return (f(x + h) - f(x)) / h
`,
    test_code: `
def _cuadrado(x):
    return x ** 2

check("La pendiente de x² en x=2 es ≈ 4", lambda: abs(pendiente(_cuadrado, 2) - 4.0) < 0.01,
      msg="(f(x+h) − f(x)) / h con h pequeña; la derivada de x² es 2x = 4 en x=2")
check("En x=−3 la pendiente es ≈ −6 (la curva baja)", lambda: abs(pendiente(_cuadrado, -3) - (-6.0)) < 0.01,
      msg="a la izquierda del vértice la parábola decrece: pendiente negativa")
check("Una recta tiene la misma pendiente en todas partes",
      lambda: abs(pendiente(lambda x: 3 * x + 1, 7.5) - 3.0) < 0.01,
      msg="la pendiente de 3x + 1 es 3 en cualquier punto")
check("h más pequeña mejora la aproximación",
      lambda: abs(pendiente(_cuadrado, 2, 0.0001) - 4.0) < abs(pendiente(_cuadrado, 2, 0.1) - 4.0),
      msg="cuanto menor es h, más se acerca la secante a la tangente")
check("En el mínimo de x² la pendiente es ≈ 0", lambda: abs(pendiente(_cuadrado, 0.0)) < 0.01,
      msg="en el fondo del cuenco la tangente es horizontal: por eso el gradiente es 0 en el óptimo")
`,
    hints: [
      'Es una traducción directa: `(f(x + h) - f(x)) / h`.',
      '`f` es una función que recibes como parámetro: llámala como `f(x + h)`.',
      'Con h = 0.001 la aproximación ya tiene 3 decimales buenos.',
    ],
  },
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
  /* ---------------------------------------------------------------- */
  /* Proyecto práctico: predice el precio de una vivienda              */
  /* ---------------------------------------------------------------- */
  {
    id: 'fundamentos-housing-data',
    title: 'P1.1 · Viviendas: explorar, dividir y normalizar',
    difficulty: 'BASICO',
    xp: 40,
    statement: [
      'Proyecto real de inmobiliaria: estimar el precio de una vivienda a partir de sus características. Te damos el generador `make_housing(n, seed)`, que simula $n$ anuncios con 4 features — superficie (m², 40–180), habitaciones (1–5), distancia al centro (km, 0.5–20) y antigüedad (años, 0–50) — y un precio en **miles de euros** casi lineal en las features, con ruido.',
      'Antes de entrenar nada, un profesional hace tres cosas: **explora** los datos, **divide** en train/test y **normaliza** usando solo estadísticas del train. Implementa las tres piezas:',
      '- `train_test_split(X, y, test_ratio=0.2, seed=0)`: baraja los índices con `np.random.default_rng(seed)` y devuelve `(X_train, X_test, y_train, y_test)`.\n- `normalizar(X_train, X_test)`: estandariza cada columna a media 0 y std 1 **con la media y std del TRAIN** y devuelve `(X_train_norm, X_test_norm)`. Usar las estadísticas del train también en el test evita la *fuga de datos* (data leakage).\n- `correlaciones(X, y)`: un array con la correlación de Pearson de cada feature con el precio (`np.corrcoef`).',
      '$$z = \\frac{x - \\mu_{train}}{\\sigma_{train}}$$',
    ].join('\n\n'),
    starter_code: `import numpy as np

def make_housing(n=600, seed=42):
    """Dataset sintético de viviendas. Precio en miles de euros."""
    rng = np.random.default_rng(seed)
    m2 = rng.uniform(40, 180, n)               # superficie en m2
    hab = rng.integers(1, 6, n).astype(float)  # habitaciones 1-5
    dist = rng.uniform(0.5, 20, n)             # km al centro
    antig = rng.uniform(0, 50, n)              # antigüedad en años
    X = np.column_stack([m2, hab, dist, antig])
    precio = (2.0 * m2 + 15.0 * hab - 7.0 * dist - 0.8 * antig
              + 0.0035 * m2 ** 2 + 100.0 + rng.normal(0, 10, n))
    return X, np.maximum(precio, 40.0)  # nada baja de 40 kEUR

def train_test_split(X, y, test_ratio=0.2, seed=0):
    """Devuelve (X_train, X_test, y_train, y_test) barajando con la seed."""
    # TODO: permuta los índices y corta
    return X, X, y, y

def normalizar(X_train, X_test):
    """Estandariza columnas con media y std del TRAIN. Devuelve (train_n, test_n)."""
    # TODO
    return X_train, X_test

def correlaciones(X, y):
    """Correlación de Pearson de cada columna de X con y (array de 4 valores)."""
    # TODO
    return np.zeros(X.shape[1])

X, y = make_housing(600, seed=42)
print(correlaciones(X, y))  # la primera (m2) debería rondar 0.9
`,
    solution_code: `import numpy as np

def make_housing(n=600, seed=42):
    """Dataset sintético de viviendas. Precio en miles de euros."""
    rng = np.random.default_rng(seed)
    m2 = rng.uniform(40, 180, n)
    hab = rng.integers(1, 6, n).astype(float)
    dist = rng.uniform(0.5, 20, n)
    antig = rng.uniform(0, 50, n)
    X = np.column_stack([m2, hab, dist, antig])
    precio = (2.0 * m2 + 15.0 * hab - 7.0 * dist - 0.8 * antig
              + 0.0035 * m2 ** 2 + 100.0 + rng.normal(0, 10, n))
    return X, np.maximum(precio, 40.0)

def train_test_split(X, y, test_ratio=0.2, seed=0):
    rng = np.random.default_rng(seed)
    idx = rng.permutation(X.shape[0])
    n_test = int(round(test_ratio * X.shape[0]))
    te, tr = idx[:n_test], idx[n_test:]
    return X[tr], X[te], y[tr], y[te]

def normalizar(X_train, X_test):
    mu = X_train.mean(axis=0)
    sigma = X_train.std(axis=0)
    return (X_train - mu) / sigma, (X_test - mu) / sigma

def correlaciones(X, y):
    return np.array([np.corrcoef(X[:, j], y)[0, 1] for j in range(X.shape[1])])
`,
    test_code: `
_X, _y = make_housing(600, seed=42)
check("make_housing devuelve X (600, 4) e y (600,)",
      lambda: _X.shape == (600, 4) and _y.shape == (600,),
      msg="X debe ser (n, 4) e y un vector de n precios")
check("Rangos realistas de las features",
      lambda: _X[:, 0].min() >= 40 and _X[:, 0].max() <= 180
              and _X[:, 1].min() >= 1 and _X[:, 1].max() <= 5
              and _X[:, 2].min() >= 0.5 and _X[:, 2].max() <= 20
              and _X[:, 3].min() >= 0 and _X[:, 3].max() <= 50,
      msg="m2 en [40,180], habitaciones en [1,5], distancia en [0.5,20], antigüedad en [0,50]")
check("Precios en miles de euros plausibles (40-700 kEUR)",
      lambda: _y.min() >= 40 and _y.max() < 700,
      msg="revisa la escala: ~2 kEUR por m2 ya da 80-360 kEUR solo de superficie")

_Xtr, _Xte, _ytr, _yte = train_test_split(_X, _y, test_ratio=0.2, seed=1)
check("Split 80/20: 480 train + 120 test",
      lambda: _Xtr.shape == (480, 4) and _Xte.shape == (120, 4) and _ytr.shape == (480,) and _yte.shape == (120,),
      msg="con n=600 y test_ratio=0.2 deben quedar 120 muestras de test")
check("El split es una permutación (sin perder ni repetir datos)",
      lambda: np.allclose(np.sort(np.concatenate([_ytr, _yte])), np.sort(_y)),
      msg="baraja los índices con rng.permutation antes de cortar")
check("Semilla reproducible",
      lambda: np.allclose(train_test_split(_X, _y, 0.2, seed=1)[1], _Xte),
      msg="misma seed -> mismo split; usa np.random.default_rng(seed)")

_Xtrn, _Xten = normalizar(_Xtr, _Xte)
check("Train normalizado: media ~0 y std ~1 por columna",
      lambda: np.allclose(_Xtrn.mean(axis=0), 0, atol=1e-8) and np.allclose(_Xtrn.std(axis=0), 1, atol=1e-8),
      msg="resta la media y divide entre la std del TRAIN, columna a columna")
_mu, _sg = _Xtr.mean(axis=0), _Xtr.std(axis=0)
check("Test se normaliza con las estadísticas del TRAIN (sin fuga de datos)",
      lambda: np.allclose(_Xten, (_Xte - _mu) / _sg),
      msg="usa mu y sigma calculados SOLO con X_train, también para el test")

_c = correlaciones(_X, _y)
check("correlaciones devuelve un valor por feature",
      lambda: np.asarray(_c).shape == (4,),
      msg="un np.corrcoef por columna contra el precio: 4 valores")
check("Los m2 son la feature más correlacionada (positiva)",
      lambda: _c[0] > 0.8 and _c[0] == max(_c),
      msg="el precio crece casi linealmente con la superficie: corr ~0.9")
check("Distancia y antigüedad correlacionan negativo",
      lambda: _c[2] < -0.3 and _c[3] < 0,
      msg="más lejos del centro y más vieja -> más barata")
`,
    hints: [
      'Para el split: `idx = rng.permutation(len(X))`, corta `idx[:n_test]` para test y `idx[n_test:]` para train, e indexa con corchetes: `X[tr]`.',
      'En `normalizar` calcula `mu` y `sigma` con `axis=0` SOLO sobre `X_train`; luego aplica `(X - mu) / sigma` a ambos conjuntos.',
      '`np.corrcoef(a, b)` devuelve una matriz 2×2; el valor que quieres es la posición `[0, 1]`.',
    ],
  },
  {
    id: 'fundamentos-housing-gd',
    title: 'P1.2 · Viviendas: entrenar la regresión con gradiente',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: [
      'Segunda parte del proyecto inmobiliario: el modelo. Implementa `fit_lineal_gd(X, y, lr=0.1, epochs=3000)` que ajuste $\\hat{y} = Xw + b$ con $w \\in \\mathbb{R}^4$ minimizando el MSE por descenso del gradiente **batch** partiendo de ceros, y `predecir(X, w, b)` vectorizada.',
      '$$\\nabla_w L = \\frac{2}{N} X^{\\top}(Xw + b - y), \\qquad \\frac{\\partial L}{\\partial b} = \\frac{2}{N}\\sum_i (\\hat{y}_i - y_i)$$',
      'El test monta el pipeline completo por ti: genera 600 viviendas, divide 80/20 y normaliza con las estadísticas del train. Exige un $R^2 \\geq 0.90$ en test (un modelo correcto ronda 0.99):',
      '$$R^2 = 1 - \\frac{\\sum_i (y_i - \\hat{y}_i)^2}{\\sum_i (y_i - \\bar{y})^2}$$',
      'Y la prueba de fuego de cualquier tasador: predecir una vivienda concreta de **100 m², 3 habitaciones, 5 km al centro y 10 años de antigüedad**. Su precio justo ronda los 337 k€; el test admite el rango 325–360 k€. Ojo: hay que normalizar esa vivienda con la media y std del **train** antes de predecir.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def make_housing(n=600, seed=42):
    """Dataset sintético de viviendas. Precio en miles de euros."""
    rng = np.random.default_rng(seed)
    m2 = rng.uniform(40, 180, n)
    hab = rng.integers(1, 6, n).astype(float)
    dist = rng.uniform(0.5, 20, n)
    antig = rng.uniform(0, 50, n)
    X = np.column_stack([m2, hab, dist, antig])
    precio = (2.0 * m2 + 15.0 * hab - 7.0 * dist - 0.8 * antig
              + 0.0035 * m2 ** 2 + 100.0 + rng.normal(0, 10, n))
    return X, np.maximum(precio, 40.0)

def fit_lineal_gd(X, y, lr=0.1, epochs=3000):
    """Regresión lineal multivariante y_hat = X @ w + b con GD batch sobre MSE.
    Devuelve (w, b) partiendo de ceros."""
    # TODO: bucle de entrenamiento
    return np.zeros(X.shape[1]), 0.0

def predecir(X, w, b):
    """Predicción vectorizada del modelo lineal."""
    # TODO: una línea
    return None

# Pipeline completo (como en el ejercicio anterior)
X, y = make_housing(600, seed=42)
rng = np.random.default_rng(0)
idx = rng.permutation(len(y))
te, tr = idx[:120], idx[120:]
mu, sg = X[tr].mean(axis=0), X[tr].std(axis=0)
Xtr, Xte = (X[tr] - mu) / sg, (X[te] - mu) / sg
ytr, yte = y[tr], y[te]

w, b = fit_lineal_gd(Xtr, ytr, lr=0.1, epochs=3000)
pred = predecir(Xte, w, b)
r2 = 1 - np.sum((yte - pred) ** 2) / np.sum((yte - yte.mean()) ** 2)
print("R2 test:", r2)
casa = np.array([100.0, 3.0, 5.0, 10.0])  # 100 m2, 3 hab, 5 km, 10 años
print("Precio estimado (kEUR):", predecir((casa - mu) / sg, w, b))
`,
    solution_code: `import numpy as np

def make_housing(n=600, seed=42):
    rng = np.random.default_rng(seed)
    m2 = rng.uniform(40, 180, n)
    hab = rng.integers(1, 6, n).astype(float)
    dist = rng.uniform(0.5, 20, n)
    antig = rng.uniform(0, 50, n)
    X = np.column_stack([m2, hab, dist, antig])
    precio = (2.0 * m2 + 15.0 * hab - 7.0 * dist - 0.8 * antig
              + 0.0035 * m2 ** 2 + 100.0 + rng.normal(0, 10, n))
    return X, np.maximum(precio, 40.0)

def fit_lineal_gd(X, y, lr=0.1, epochs=3000):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    for _ in range(epochs):
        err = X @ w + b - y
        w -= lr * (2.0 / n) * (X.T @ err)
        b -= lr * (2.0 / n) * float(np.sum(err))
    return w, b

def predecir(X, w, b):
    return np.asarray(X, dtype=float) @ w + b
`,
    test_code: `
_X, _y = make_housing(600, seed=42)
_rng = np.random.default_rng(0)
_idx = _rng.permutation(_X.shape[0])
_te, _tr = _idx[:120], _idx[120:]
_Xtr, _Xte, _ytr, _yte = _X[_tr], _X[_te], _y[_tr], _y[_te]
_mu, _sg = _Xtr.mean(axis=0), _Xtr.std(axis=0)
_Xtrn, _Xten = (_Xtr - _mu) / _sg, (_Xte - _mu) / _sg

_w, _b = fit_lineal_gd(_Xtrn, _ytr, lr=0.1, epochs=3000)
check("w es un vector de 4 pesos y b un escalar",
      lambda: np.asarray(_w).shape == (4,) and np.ndim(_b) == 0,
      msg="un peso por feature (m2, habitaciones, distancia, antigüedad)")

_pred_tr = predecir(_Xtrn, _w, _b)
_pred_te = predecir(_Xten, _w, _b)
check("predecir devuelve una predicción por muestra",
      lambda: np.asarray(_pred_te).shape == (120,),
      msg="y_hat = X @ w + b, vectorizado")

def _r2(y, p):
    return 1.0 - float(np.sum((y - p) ** 2)) / float(np.sum((y - y.mean()) ** 2))

check("R² en train >= 0.95", lambda: _r2(_ytr, _pred_tr) >= 0.95,
      msg="3000 épocas con lr=0.1 sobre datos normalizados deberían bastar; revisa los gradientes")
check("R² en test >= 0.90 (objetivo del proyecto)",
      lambda: _r2(_yte, _pred_te) >= 0.90,
      msg="un modelo lineal bien entrenado supera R²=0.98 en este dataset")

_casa = np.array([100.0, 3.0, 5.0, 10.0])  # 100 m2, 3 hab, 5 km, 10 años
_pred_casa = float(np.asarray(predecir((_casa - _mu) / _sg, _w, _b)).ravel()[0])
check("Predicción para la vivienda de ejemplo en rango razonable (325-360 kEUR)",
      lambda: 325.0 <= _pred_casa <= 360.0,
      msg="normaliza la vivienda nueva con la media y std del TRAIN antes de predecir; el precio justo ronda los 337 kEUR")

_w2, _b2 = fit_lineal_gd(_Xtrn, _ytr, lr=0.05, epochs=200)
_l0 = float(np.mean((_Xtrn @ np.zeros(4) - _ytr) ** 2))
_l1 = float(np.mean((predecir(_Xtrn, _w2, _b2) - _ytr) ** 2))
check("El descenso reduce la pérdida (200 épocas bastan para bajar mucho)",
      lambda: _l1 < 0.2 * _l0,
      msg="si la pérdida no baja, revisa el signo de la actualización: w -= lr * gradiente")
`,
    hints: [
      'El error es `err = X @ w + b - y`; los gradientes son `(2/n) * (X.T @ err)` y `(2/n) * err.sum()`. Resta `lr * gradiente` en cada época.',
      'Todo vectorizado: no hace falta ningún bucle sobre muestras, solo el de las épocas.',
      'Para la vivienda concreta: transfórmala igual que el test — `(casa - mu) / sg` — antes de llamar a `predecir`.',
    ],
  },
  {
    id: 'fundamentos-housing-outliers',
    title: 'P1.3 · Viviendas: datos sucios y pérdidas robustas',
    difficulty: 'INTERMEDIO',
    xp: 70,
    statement: [
      'Los datos reales están sucios: un portal mezcla mansiones mal etiquetadas y precios con un cero de más. `make_housing_outliers` toma el dataset limpio e **infla el precio de un 8 % de los anuncios (×3 a ×5)**. Verás que esto rompe el MSE.',
      'Implementa `fit_perdida(X, y, perdida="mse", lr=0.1, epochs=3000, delta=25.0)` con dos pérdidas. En el MSE el gradiente por muestra es proporcional al error $e_i$ — y un error 10× mayor pesa 10× más. En la **pérdida de Huber** el gradiente se recorta a $\\mathrm{clip}(e_i, -\\delta, \\delta)$: pasado $\\delta$, un outlier deja de empujar más.',
      '$$L_\\delta(e) = \\begin{cases} \\frac{1}{2}e^2 & |e| \\leq \\delta \\\\ \\delta\\,(|e| - \\frac{\\delta}{2}) & |e| > \\delta \\end{cases} \\qquad \\frac{\\partial L_\\delta}{\\partial e} = \\mathrm{clip}(e, -\\delta, \\delta)$$',
      'El test entrena ambos modelos con tu función sobre el train sucio y los evalúa en un test **limpio**: el MSE debe hundirse ($R^2 < 0.8$) mientras Huber se mantiene por encima de $0.90$. Esa diferencia es exactamente el argumento que darías en una reunión para justificar una pérdida robusta.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def make_housing(n=600, seed=42):
    rng = np.random.default_rng(seed)
    m2 = rng.uniform(40, 180, n)
    hab = rng.integers(1, 6, n).astype(float)
    dist = rng.uniform(0.5, 20, n)
    antig = rng.uniform(0, 50, n)
    X = np.column_stack([m2, hab, dist, antig])
    precio = (2.0 * m2 + 15.0 * hab - 7.0 * dist - 0.8 * antig
              + 0.0035 * m2 ** 2 + 100.0 + rng.normal(0, 10, n))
    return X, np.maximum(precio, 40.0)

def make_housing_outliers(n=600, seed=42, frac=0.08):
    """Como make_housing, pero un 8 % de anuncios con precio x3-x5."""
    X, y = make_housing(n, seed)
    rng = np.random.default_rng(seed + 1)
    k = int(round(frac * n))
    idx = rng.choice(n, size=k, replace=False)
    y[idx] = y[idx] * rng.uniform(3.0, 5.0, size=k)
    return X, y, idx

def fit_perdida(X, y, perdida="mse", lr=0.1, epochs=3000, delta=25.0):
    """Regresión lineal por GD. Devuelve (w, b).
    perdida="mse":   gradiente por muestra ~ err
    perdida="huber": gradiente por muestra ~ clip(err, -delta, delta)
    """
    # TODO: un solo bucle que cambia solo en cómo se transforma err
    return np.zeros(X.shape[1]), 0.0

Xtr, ytr, idx_out = make_housing_outliers(600, seed=42)
Xte, yte = make_housing(400, seed=123)  # test limpio
mu, sg = Xtr.mean(axis=0), Xtr.std(axis=0)
Xtrn, Xten = (Xtr - mu) / sg, (Xte - mu) / sg

for perdida in ["mse", "huber"]:
    w, b = fit_perdida(Xtrn, ytr, perdida, lr=0.1, epochs=3000)
    pred = Xten @ w + b
    r2 = 1 - np.sum((yte - pred) ** 2) / np.sum((yte - yte.mean()) ** 2)
    print(perdida, "-> R2 test limpio:", r2)
`,
    solution_code: `import numpy as np

def make_housing(n=600, seed=42):
    rng = np.random.default_rng(seed)
    m2 = rng.uniform(40, 180, n)
    hab = rng.integers(1, 6, n).astype(float)
    dist = rng.uniform(0.5, 20, n)
    antig = rng.uniform(0, 50, n)
    X = np.column_stack([m2, hab, dist, antig])
    precio = (2.0 * m2 + 15.0 * hab - 7.0 * dist - 0.8 * antig
              + 0.0035 * m2 ** 2 + 100.0 + rng.normal(0, 10, n))
    return X, np.maximum(precio, 40.0)

def make_housing_outliers(n=600, seed=42, frac=0.08):
    X, y = make_housing(n, seed)
    rng = np.random.default_rng(seed + 1)
    k = int(round(frac * n))
    idx = rng.choice(n, size=k, replace=False)
    y[idx] = y[idx] * rng.uniform(3.0, 5.0, size=k)
    return X, y, idx

def fit_perdida(X, y, perdida="mse", lr=0.1, epochs=3000, delta=25.0):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float)
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    for _ in range(epochs):
        err = X @ w + b - y
        if perdida == "mse":
            g = err
        else:  # huber
            g = np.clip(err, -delta, delta)
        w -= lr * (X.T @ g) / n
        b -= lr * float(np.sum(g)) / n
    return w, b
`,
    test_code: `
_Xtr, _ytr, _idx_out = make_housing_outliers(600, seed=42)
_Xte, _yte = make_housing(400, seed=123)  # test limpio, sin outliers
_mu, _sg = _Xtr.mean(axis=0), _Xtr.std(axis=0)
_Xtrn, _Xten = (_Xtr - _mu) / _sg, (_Xte - _mu) / _sg

check("El generador inyecta el 8 % de outliers",
      lambda: len(_idx_out) == 48 and _ytr[_idx_out].min() > 300,
      msg="frac=0.08 sobre n=600 -> 48 anuncios con precio inflado")

def _r2(y, p):
    return 1.0 - float(np.sum((y - p) ** 2)) / float(np.sum((y - y.mean()) ** 2))

_wm, _bm = fit_perdida(_Xtrn, _ytr, "mse", lr=0.1, epochs=3000)
_wh, _bh = fit_perdida(_Xtrn, _ytr, "huber", lr=0.1, epochs=3000, delta=25.0)
_r2_mse = _r2(_yte, _Xten @ _wm + _bm)
_r2_hub = _r2(_yte, _Xten @ _wh + _bh)

check("Con outliers, el MSE se deja arrastrar (R² test < 0.8)",
      lambda: _r2_mse < 0.8,
      msg="con un 8 % de precios 3-5x, minimizar el error cuadrático desvía mucho el plano")
check("Huber se mantiene: R² test >= 0.90",
      lambda: _r2_hub >= 0.90,
      msg="el gradiente de Huber es clip(err, -delta, delta): los outliers no dominan")
check("La pérdida robusta mejora al MSE por al menos 0.2 de R²",
      lambda: _r2_hub > _r2_mse + 0.2,
      msg="esa es la mejora que reportarías en un proyecto real con datos sucios")

# El gradiente de Huber debe coincidir con el del MSE si todos los errores son pequeños
_rng = np.random.default_rng(3)
_Xs = _rng.normal(0, 1, (50, 4))
_ws = _rng.normal(0, 1, 4)
_ys = _Xs @ _ws + _rng.normal(0, 0.01, 50)
_w1, _b1 = fit_perdida(_Xs, _ys, "mse", lr=0.5, epochs=800)
_w2, _b2 = fit_perdida(_Xs, _ys, "huber", lr=0.5, epochs=800, delta=25.0)
check("Sin outliers, Huber y MSE coinciden (errores pequeños)",
      lambda: np.allclose(_w1, _w2, atol=1e-2) and np.allclose(_b1, _b2, atol=1e-2),
      msg="si |err| < delta, clip no recorta: ambas pérdidas son equivalentes")
`,
    hints: [
      'Un solo bucle sirve para ambas: calcula `err = X @ w + b - y` y transforma `err` en `g` según la pérdida (`g = err` o `g = np.clip(err, -delta, delta)`).',
      'Las actualizaciones son `w -= lr * (X.T @ g) / n` y `b -= lr * g.sum() / n` — el gradiente de Huber solo cambia en el recorte.',
      'Si Huber no supera 0.9, revisa que el `delta` se aplica sobre el error en k€ (25 k€), no sobre datos normalizados.',
    ],
  },
]
