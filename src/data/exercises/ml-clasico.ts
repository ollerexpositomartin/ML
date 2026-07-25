/**
 * ml-clasico.ts — Ejercicios autocorregidos del módulo ML Clásico (N1–N2).
 * 6 ejercicios (BÁSICO → AVANZADO) + quiz conceptual en la página (QuizCard).
 * Todas las solution_code pasan su propio test_code al 100 % (verificado con
 * python3 + numpy 2.x replicando el harness check()).
 */

import type { Exercise } from '@/lib/exercises'

export const ML_CLASICO_EXERCISES: Exercise[] = [
  {
    id: 'mlc-sigmoid',
    title: 'E1 · Sigmoide',
    difficulty: 'BASICO',
    xp: 20,
    statement: [
      'La puerta de entrada a la clasificación: la función **sigmoide** comprime cualquier número real al intervalo $(0, 1)$:',
      '$$\\sigma(z) = \\frac{1}{1 + e^{-z}}$$',
      'Implementa `sigmoid(z)` de forma **numéricamente estable**: debe funcionar con valores extremos como $z = \\pm 500$ sin desbordar (`overflow`). Pista: si $z \\geq 0$ calcula $1/(1+e^{-z})$; si $z < 0$, calcula $e^{z}/(1+e^{z})$ — así la exponencial nunca es de un número positivo grande.',
      'Debe aceptar escalares y arrays de numpy, y devolver valores de la misma forma.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def sigmoid(z):
    """
    Sigmoide numéricamente estable.
    Acepta escalar o array; devuelve valores en (0, 1).
    """
    # TODO: rama z >= 0 y rama z < 0 para evitar overflow
    return 0.0

print(sigmoid(0.0))                      # esperado: 0.5
print(sigmoid(np.array([-2.0, 0.0, 2.0])))
print(sigmoid(500.0), sigmoid(-500.0))   # no debe dar overflow
`,
    solution_code: `import numpy as np

def sigmoid(z):
    z = np.asarray(z, dtype=float)
    out = np.empty_like(z)
    pos = z >= 0
    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))
    ez = np.exp(z[~pos])
    out[~pos] = ez / (1.0 + ez)
    return out
`,
    test_code: `
check("σ(0) = 0.5", lambda: np.allclose(float(sigmoid(0.0)), 0.5),
      msg="1/(1+e^0) = 1/2")
check("Simetría: σ(z) = 1 − σ(−z)",
      lambda: np.allclose(sigmoid(np.array([0.7, 3.2])), 1.0 - sigmoid(np.array([-0.7, -3.2]))),
      msg="la sigmoide es simétrica respecto a 0.5")
check("Valores conocidos", lambda: np.allclose(float(sigmoid(2.0)), 1.0 / (1.0 + np.exp(-2.0))),
      msg="revisa la fórmula 1/(1+e^(−z))")
check("Estable en +500 y −500 (sin nan ni inf)",
      lambda: bool(np.isfinite(float(sigmoid(500.0)))) and bool(np.isfinite(float(sigmoid(-500.0)))),
      msg="np.exp(500) desborda: ramifica el cálculo según el signo de z")
check("Extremos correctos: σ(500)≈1, σ(−500)≈0",
      lambda: np.allclose(float(sigmoid(500.0)), 1.0) and np.allclose(float(sigmoid(-500.0)), 0.0),
      msg="en los extremos la sigmoide satura a 1 y 0")
check("Vectorizada: conserva la forma",
      lambda: sigmoid(np.zeros((3, 4))).shape == (3, 4) and np.allclose(sigmoid(np.zeros(5)), 0.5),
      msg="debe funcionar elemento a elemento sobre arrays de cualquier forma")
`,
    hints: [
      '`np.exp(500)` es infinito en float64; `np.exp(-500)` es 0 sin problemas. Elige la rama según el signo de $z$.',
      'Crea `out = np.empty_like(z)` y rellena por separado las posiciones `z >= 0` y `z < 0` con máscaras booleanas.',
      'Para $z < 0$: $\\sigma(z) = e^{z}/(1+e^{z})$ (multiplica numerador y denominador por $e^{z}$).',
    ],
  },
  {
    id: 'mlc-log-loss',
    title: 'E2 · Entropía cruzada (log-loss)',
    difficulty: 'BASICO',
    xp: 30,
    statement: [
      'La pérdida de la regresión logística es la **entropía cruzada binaria** (la log-verosimilitud negativa de un modelo Bernoulli):',
      '$$L = -\\frac{1}{N}\\sum_{i=1}^{N} \\Big[ y_i \\log p_i + (1 - y_i)\\log(1 - p_i) \\Big]$$',
      'Implementa `log_loss(y, p)` donde `y` son etiquetas 0/1 y `p` las probabilidades predichas. **Recorta** `p` al intervalo $[10^{-12},\\; 1 - 10^{-12}]$ con `np.clip` para que $\\log(0)$ nunca explote. Devuelve un `float`.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def log_loss(y, p):
    """
    Entropía cruzada binaria media entre etiquetas y (0/1) y probabilidades p.
    Debe ser robusta a p = 0 o p = 1 (clipping). Devuelve un float.
    """
    # TODO: clip, luego la fórmula de entropía cruzada
    return 0.0

print(log_loss(np.array([1, 0]), np.array([0.9, 0.1])))  # esperado ≈ 0.1054
`,
    solution_code: `import numpy as np

def log_loss(y, p):
    y = np.asarray(y, dtype=float).ravel()
    p = np.clip(np.asarray(p, dtype=float).ravel(), 1e-12, 1.0 - 1e-12)
    return float(-np.mean(y * np.log(p) + (1.0 - y) * np.log(1.0 - p)))
`,
    test_code: `
check("Caso conocido ≈ 0.1054", lambda: np.allclose(log_loss(np.array([1, 0]), np.array([0.9, 0.1])), 0.1053605, atol=1e-5),
      msg="−mean(log 0.9, log 0.9) = −log(0.9)")
check("Predicción perfecta → pérdida ≈ 0",
      lambda: log_loss(np.array([1., 0., 1.]), np.array([1.0 - 1e-9, 1e-9, 1.0 - 1e-9])) < 1e-6,
      msg="con p casi perfecta la pérdida debe ser casi 0")
check("Robusta a p = 0 y p = 1 exactos (sin nan/inf)",
      lambda: bool(np.isfinite(log_loss(np.array([1., 0.]), np.array([0.0, 1.0])))),
      msg="recorta p con np.clip antes de aplicar log")
check("Confianza equivocada se penaliza fuerte",
      lambda: log_loss(np.array([1.]), np.array([0.01])) > 4.0,
      msg="−log(0.01) ≈ 4.6: equivocarse con confianza cuesta caro")
check("Devuelve un float de Python",
      lambda: isinstance(log_loss(np.array([1., 0.]), np.array([0.8, 0.3])), float),
      msg="convierte el resultado con float(...)")
_rng = np.random.default_rng(4)
_y = (_rng.uniform(size=150) > 0.5).astype(float)
_p = _rng.uniform(0.01, 0.99, 150)
_ref = float(-np.mean(_y * np.log(_p) + (1 - _y) * np.log(1 - _p)))
check("Coincide con la referencia en datos aleatorios",
      lambda: np.allclose(log_loss(_y, _p), _ref, rtol=1e-8),
      msg="revisa la fórmula: media de −[y·log p + (1−y)·log(1−p)]")
`,
    hints: [
      '`np.clip(p, 1e-12, 1 - 1e-12)` evita el $\\log(0)$.',
      'La fórmula vectorizada es `y * np.log(p) + (1 - y) * np.log(1 - p)`; toma la media y cambia el signo.',
      'Comprueba con un solo ejemplo: si $y=1$ y $p=0.9$, la pérdida es $-\\log(0.9) \\approx 0.105$.',
    ],
  },
  {
    id: 'mlc-fit-logistic',
    title: 'E3 · Frontera logística por gradiente',
    difficulty: 'INTERMEDIO',
    xp: 70,
    statement: [
      'Entrena una regresión logística $\\hat{p} = \\sigma(Xw + b)$ con descenso del gradiente sobre la entropía cruzada. El gradiente tiene una forma sorprendentemente limpia (idéntica a la de la regresión lineal, cambiando la predicción):',
      '$$\\nabla_w L = \\frac{1}{N} X^{\\top}(p - y), \\qquad \\frac{\\partial L}{\\partial b} = \\frac{1}{N}\\sum_i (p_i - y_i)$$',
      'Implementa `fit_logistic(X, y, lr, epochs)`: `X` es $(N, d)$, `y` un vector 0/1; parte de $w = \\mathbf{0}$, $b = 0$ y devuelve `(w, b)` (array 1D y float).',
    ].join('\n\n'),
    starter_code: `import numpy as np

def fit_logistic(X, y, lr, epochs):
    """
    Regresión logística por descenso del gradiente (batch) sobre log-loss.
    X: (N, d). y: (N,) con valores 0/1.
    Devuelve (w, b): w es np.ndarray de forma (d,), b un float.
    """
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    # TODO: bucle: p = sigmoide(X @ w + b); gradientes; actualización
    return w, b
`,
    solution_code: `import numpy as np

def fit_logistic(X, y, lr, epochs):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float).ravel()
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    for _ in range(epochs):
        z = X @ w + b
        p = 1.0 / (1.0 + np.exp(-z))
        err = p - y
        dw = (X.T @ err) / n
        db = float(np.mean(err))
        w -= lr * dw
        b -= lr * db
    return w, float(b)
`,
    test_code: `
_rng = np.random.default_rng(21)
_X0 = _rng.normal([0.0, 0.0], 0.9, (70, 2))
_X1 = _rng.normal([2.6, 2.2], 0.9, (70, 2))
_X = np.vstack([_X0, _X1])
_y = np.concatenate([np.zeros(70), np.ones(70)])

_w, _b = fit_logistic(_X, _y, 0.5, 600)

check("w tiene la forma correcta", lambda: isinstance(_w, np.ndarray) and _w.shape == (2,),
      msg="w debe ser un array 1D con un peso por feature")

def _loss(w, b):
    z = _X @ w + b
    p = 1.0 / (1.0 + np.exp(-z))
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return float(-np.mean(_y * np.log(p) + (1 - _y) * np.log(1 - p)))

check("La pérdida final es mucho menor que la inicial",
      lambda: _loss(_w, _b) < 0.15 * _loss(np.zeros(2), 0.0),
      msg="600 épocas con lr=0.5 deben reducir la log-loss al menos 6×")
check("Accuracy ≥ 0.9 en datos separables",
      lambda: float(np.mean((1.0 / (1.0 + np.exp(-(_X @ _w + _b))) >= 0.5) == _y)) >= 0.9,
      msg="los dos blobs son casi separables: la frontera debería clasificar ≥90 %")

# Gradiente exacto tras UN paso desde w=0, b=0
_wt, _bt = fit_logistic(_X, _y, 0.3, 1)
_err0 = 0.5 - _y  # p = 0.5 cuando w=0, b=0
_dw_ref = (_X.T @ _err0) / _X.shape[0]
_db_ref = float(np.mean(_err0))
check("Un paso reproduce el gradiente analítico",
      lambda: np.allclose(_wt, -0.3 * _dw_ref, rtol=1e-6) and np.allclose(_bt, -0.3 * _db_ref, rtol=1e-6),
      msg="∇w = Xᵀ·(p−y)/N y ∇b = mean(p−y); el paso los RESTA multiplicados por lr")
check("b es un float de Python", lambda: isinstance(_b, float),
      msg="convierte b con float(...) al devolverlo")
`,
    hints: [
      'Con $w = 0$: $z = Xw + b$, $p = 1/(1+e^{-z})$, y el error es `p - y`.',
      'Vectoriza: `dw = (X.T @ err) / n` y `db = err.mean()`.',
      'Actualiza restando: `w -= lr * dw`. Si la pérdida sube, el signo está al revés.',
    ],
  },
  {
    id: 'mlc-metrics',
    title: 'E4 · Métricas a mano: precision, recall y F1',
    difficulty: 'INTERMEDIO',
    xp: 40,
    statement: [
      'A partir de la matriz de confusión (TP, FP, FN), implementa `precision_recall_f1(y, y_hat)` que devuelva la tupla `(precision, recall, f1)`:',
      '$$P = \\frac{TP}{TP + FP}, \\qquad R = \\frac{TP}{TP + FN}, \\qquad F_1 = \\frac{2\\,P\\,R}{P + R}$$',
      '**Convención de borde**: si un denominador es 0 (p. ej. el modelo no predijo ningún positivo), esa métrica vale `0.0`. Si $P = R = 0$, entonces $F_1 = 0.0$. Nada de `NaN`.',
      '`y` e `y_hat` son arrays 1D con etiquetas 0/1.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def precision_recall_f1(y, y_hat):
    """
    Devuelve (precision, recall, f1) a partir de etiquetas reales y predichas (0/1).
    Convención: denominador 0 → métrica 0.0.
    """
    # TODO: cuenta TP, FP, FN y combina
    return 0.0, 0.0, 0.0

y =     np.array([1, 1, 0, 1, 0, 0, 1])
y_hat = np.array([1, 0, 0, 1, 1, 0, 1])
print(precision_recall_f1(y, y_hat))  # TP=3, FP=1, FN=1 → P=0.75, R=0.75, F1=0.75
`,
    solution_code: `import numpy as np

def precision_recall_f1(y, y_hat):
    y = np.asarray(y).ravel().astype(int)
    y_hat = np.asarray(y_hat).ravel().astype(int)
    tp = int(np.sum((y == 1) & (y_hat == 1)))
    fp = int(np.sum((y == 0) & (y_hat == 1)))
    fn = int(np.sum((y == 1) & (y_hat == 0)))
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2.0 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    return float(precision), float(recall), float(f1)
`,
    test_code: `
_y = np.array([1, 1, 0, 1, 0, 0, 1])
_h = np.array([1, 0, 0, 1, 1, 0, 1])

check("Caso conocido: (0.75, 0.75, 0.75)",
      lambda: np.allclose(precision_recall_f1(_y, _h), [0.75, 0.75, 0.75]),
      msg="TP=3, FP=1, FN=1")
check("Predicción perfecta → (1, 1, 1)",
      lambda: np.allclose(precision_recall_f1(np.array([1, 0, 1, 0]), np.array([1, 0, 1, 0])), [1.0, 1.0, 1.0]),
      msg="sin errores, todas las métricas son 1")
check("Sin positivos predichos → precision 0 (no NaN)",
      lambda: precision_recall_f1(np.array([1, 1, 0]), np.array([0, 0, 0]))[0] == 0.0,
      msg="TP+FP = 0: aplica la convención de borde")
check("Sin positivos reales → recall 0 (no NaN)",
      lambda: precision_recall_f1(np.array([0, 0, 0]), np.array([1, 0, 0]))[1] == 0.0,
      msg="TP+FN = 0: aplica la convención de borde")
check("F1 = 0 cuando P = R = 0",
      lambda: precision_recall_f1(np.array([0, 0]), np.array([0, 0]))[2] == 0.0,
      msg="evita la división 0/0")
check("Solo FP: (0, 1, 0)",
      lambda: np.allclose(precision_recall_f1(np.array([1, 0]), np.array([1, 1])), [0.5, 1.0, 2/3]),
      msg="TP=1, FP=1, FN=0 → P=0.5, R=1, F1=2/3")
_rng = np.random.default_rng(8)
_yr = (_rng.uniform(size=300) > 0.4).astype(int)
_hr = (_rng.uniform(size=300) > 0.5).astype(int)
_tp = int(np.sum((_yr == 1) & (_hr == 1))); _fp = int(np.sum((_yr == 0) & (_hr == 1))); _fn = int(np.sum((_yr == 1) & (_hr == 0)))
check("Coincide con la referencia en datos aleatorios",
      lambda: np.allclose(precision_recall_f1(_yr, _hr),
                          [_tp / (_tp + _fp), _tp / (_tp + _fn),
                           2 * _tp / (2 * _tp + _fp + _fn)]),
      msg="recuenta TP, FP y FN con máscaras booleanas")
`,
    hints: [
      'Cuenta con máscaras: `tp = np.sum((y == 1) & (y_hat == 1))`.',
      'Guarda cada división con un `if denominador > 0 else 0.0`.',
      '$F_1$ es la media armónica: $2PR/(P+R)$; protégela también del $0/0$.',
    ],
  },
  {
    id: 'mlc-knn',
    title: 'E5 · KNN vectorizado',
    difficulty: 'INTERMEDIO',
    xp: 50,
    statement: [
      'K vecinos más cercanos: para predecir la clase de un punto, mira los $k$ puntos de entrenamiento más próximos y vota.',
      'Implementa `knn_predict(X_train, y_train, X_test, k)` **vectorizado con broadcasting** (sin bucles sobre los puntos de test). Las etiquetas son enteros $0, 1, \\dots, C-1$. Devuelve un `np.ndarray` de enteros, uno por fila de `X_test`.',
      'Truco: la distancia al cuadrado entre todos los pares es $\\|a-b\\|^2 = \\|a\\|^2 + \\|b\\|^2 - 2a\\cdot b$ — tres operaciones de matriz. Usa `np.argsort` para quedarte con los $k$ más cercanos y `np.bincount` para votar.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def knn_predict(X_train, y_train, X_test, k):
    """
    Clasificador KNN con distancia euclídea, vectorizado.
    X_train: (M, d). y_train: (M,) enteros 0..C-1. X_test: (N, d). k: nº de vecinos.
    Devuelve np.ndarray (N,) de enteros con la clase votada.
    """
    # TODO: distancias por broadcasting, k más cercanos, voto
    return np.zeros(X_test.shape[0], dtype=int)

Xtr = np.array([[0.0, 0.0], [0.2, 0.1], [3.0, 3.0], [3.2, 2.9]])
ytr = np.array([0, 0, 1, 1])
print(knn_predict(Xtr, ytr, np.array([[0.1, 0.0], [3.1, 3.1]]), 3))  # esperado: [0 1]
`,
    solution_code: `import numpy as np

def knn_predict(X_train, y_train, X_test, k):
    X_train = np.asarray(X_train, dtype=float)
    y_train = np.asarray(y_train).ravel().astype(int)
    X_test = np.asarray(X_test, dtype=float)
    d2 = (np.sum(X_test ** 2, axis=1, keepdims=True)
          + np.sum(X_train ** 2, axis=1)[None, :]
          - 2.0 * (X_test @ X_train.T))
    idx = np.argsort(d2, axis=1)[:, :k]
    vecinos = y_train[idx]
    n_clases = int(y_train.max()) + 1
    votos = np.apply_along_axis(lambda fila: np.bincount(fila, minlength=n_clases), 1, vecinos)
    return np.argmax(votos, axis=1)
`,
    test_code: `
_Xtr = np.array([[0.0, 0.0], [0.2, 0.1], [3.0, 3.0], [3.2, 2.9]])
_ytr = np.array([0, 0, 1, 1])

check("Clasifica el ejemplo del enunciado",
      lambda: list(knn_predict(_Xtr, _ytr, np.array([[0.1, 0.0], [3.1, 3.1]]), 3)) == [0, 1],
      msg="los 3 vecinos más cercanos de (0.1, 0) son de clase 0")
check("Devuelve un array de enteros con la forma correcta",
      lambda: isinstance(knn_predict(_Xtr, _ytr, _Xtr, 1), np.ndarray)
              and knn_predict(_Xtr, _ytr, _Xtr, 1).shape == (4,)
              and np.issubdtype(knn_predict(_Xtr, _ytr, _Xtr, 1).dtype, np.integer),
      msg="un entero por fila de X_test")
check("k=1 memoriza el conjunto de entrenamiento",
      lambda: np.array_equal(knn_predict(_Xtr, _ytr, _Xtr, 1), _ytr),
      msg="el vecino más cercano de un punto de train es él mismo")

_rng = np.random.default_rng(13)
_A = _rng.normal([0, 0], 0.7, (90, 2)); _B = _rng.normal([3, 3], 0.7, (90, 2)); _C = _rng.normal([0, 3.5], 0.7, (90, 2))
_Xt = np.vstack([_A, _B, _C]); _yt = np.concatenate([np.zeros(90, int), np.ones(90, int), np.full(90, 2)])
_Q = _rng.normal([3, 3], 0.3, (40, 2))
check("Tres clases: accuracy ≥ 0.9 en blobs limpios",
      lambda: float(np.mean(knn_predict(_Xt, _yt, _Q, 5) == 1)) >= 0.9,
      msg="puntos junto al blob de clase 1 deben votar clase 1")
check("Funciona en alta dimensión",
      lambda: np.array_equal(
          knn_predict(np.eye(6), np.arange(6), np.eye(6) + 0.01, 1), np.arange(6)),
      msg="con d=6 y k=1 debe recuperar la clase de cada base canónica")
`,
    hints: [
      '`d2 = (X_test**2).sum(1, keepdims=True) + (X_train**2).sum(1) − 2·X_test@X_train.T` te da todas las distancias al cuadrado.',
      '`np.argsort(d2, axis=1)[:, :k]` son los índices de los k más cercanos; indexa `y_train` con ellos.',
      'Para votar: `np.bincount(vecinos, minlength=n_clases).argmax()` por fila.',
    ],
  },
  {
    id: 'mlc-avanzado',
    title: 'E6 · AVANZADO: logística ridge + K-means desde cero',
    difficulty: 'AVANZADO',
    xp: 140,
    statement: [
      'Doble ejercicio final del nivel: dos algoritmos completos.',
      '**Parte A — `fit_logistic_ridge(X, y, lr, epochs, lam)`**: regresión logística con penalización $L_2$. La pérdida es $L_{CE} + \\frac{\\lambda}{2N}\\|w\\|^2$, así que el gradiente de $w$ gana un término:',
      '$$\\nabla_w = \\frac{1}{N} X^{\\top}(p - y) + \\frac{\\lambda}{N}\\, w \\qquad (b \\text{ no se regulariza})$$',
      'Devuelve `(w, b)`. **Parte B — `kmeans(X, k, iters, seed=0)`**: algoritmo de Lloyd. Inicializa los centroides eligiendo `k` puntos distintos al azar con `np.random.default_rng(seed)` (`rng.choice(n, size=k, replace=False)`), y repite `iters` veces: (1) asigna cada punto a su centroide más cercano, (2) mueve cada centroide a la media de sus puntos (si un cluster queda vacío, conserva el centroide). Tras el bucle, reasigna etiquetas con los centroides finales y calcula la **inercia** $\\sum_i \\|x_i - \\mu_{c(i)}\\|^2$.',
      'Devuelve `(centroids, labels, inertia)`: array $(k, d)$, array $(N,)$ de enteros y float.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def fit_logistic_ridge(X, y, lr, epochs, lam):
    """
    Regresión logística con regularización L2 (ridge).
    Gradiente de w: Xᵀ(p−y)/N + (λ/N)·w. b no se regulariza.
    Devuelve (w, b).
    """
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    # TODO
    return w, b

def kmeans(X, k, iters, seed=0):
    """
    K-means (algoritmo de Lloyd).
    X: (N, d). k: nº de clusters. iters: iteraciones de asignar/actualizar.
    seed: semilla para np.random.default_rng(seed) en la inicialización.
    Devuelve (centroids (k,d), labels (N,), inertia float).
    """
    # TODO
    return np.zeros((k, X.shape[1])), np.zeros(X.shape[0], dtype=int), 0.0
`,
    solution_code: `import numpy as np

def fit_logistic_ridge(X, y, lr, epochs, lam):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=float).ravel()
    n, d = X.shape
    w = np.zeros(d)
    b = 0.0
    for _ in range(epochs):
        p = 1.0 / (1.0 + np.exp(-(X @ w + b)))
        err = p - y
        dw = (X.T @ err) / n + (lam / n) * w
        db = float(np.mean(err))
        w -= lr * dw
        b -= lr * db
    return w, float(b)

def kmeans(X, k, iters, seed=0):
    X = np.asarray(X, dtype=float)
    n = X.shape[0]
    rng = np.random.default_rng(seed)
    centroids = X[rng.choice(n, size=k, replace=False)].copy()
    labels = np.zeros(n, dtype=int)
    for _ in range(iters):
        d2 = np.sum((X[:, None, :] - centroids[None, :, :]) ** 2, axis=2)
        labels = np.argmin(d2, axis=1)
        for c in range(k):
            pts = X[labels == c]
            if pts.shape[0] > 0:
                centroids[c] = pts.mean(axis=0)
    d2 = np.sum((X[:, None, :] - centroids[None, :, :]) ** 2, axis=2)
    labels = np.argmin(d2, axis=1)
    inertia = float(np.sum((X - centroids[labels]) ** 2))
    return centroids, labels, inertia
`,
    test_code: `
# ---------- Parte A: logística ridge ----------
_rng = np.random.default_rng(31)
_X0 = _rng.normal([0.0, 0.0], 0.8, (80, 2))
_X1 = _rng.normal([2.2, 2.0], 0.8, (80, 2))
_X = np.vstack([_X0, _X1]); _y = np.concatenate([np.zeros(80), np.ones(80)])

_w0, _b0 = fit_logistic_ridge(_X, _y, 0.5, 500, 0.0)
_wl, _bl = fit_logistic_ridge(_X, _y, 0.5, 500, 50.0)

check("Ridge encoge ‖w‖₂ frente a λ=0",
      lambda: float(np.linalg.norm(_wl)) < 0.75 * float(np.linalg.norm(_w0)),
      msg="con λ=50 la norma de w debe ser claramente menor")

def _acc(w, b):
    return float(np.mean((1.0 / (1.0 + np.exp(-(_X @ w + b))) >= 0.5) == _y))

check("Ridge mantiene accuracy ≥ 0.9", lambda: _acc(_wl, _bl) >= 0.9,
      msg="regularizar no debería arruinar un problema separable")
check("Con λ=0 reproduce la logística estándar (un paso exacto)",
      lambda: np.allclose(fit_logistic_ridge(_X, _y, 0.4, 1, 0.0)[0],
                          -0.4 * (_X.T @ (0.5 - _y)) / _X.shape[0], rtol=1e-6),
      msg="∇w = Xᵀ·(p−y)/N con p=0.5 en el primer paso")
check("El término ridge aparece en el gradiente (2º paso con λ grande)",
      lambda: float(np.linalg.norm(fit_logistic_ridge(_X, _y, 0.5, 400, 200.0)[0]))
              < float(np.linalg.norm(fit_logistic_ridge(_X, _y, 0.5, 400, 2.0)[0])),
      msg="más λ → pesos más pequeños")

# ---------- Parte B: K-means ----------
_rng2 = np.random.default_rng(7)
_G1 = _rng2.normal([0.0, 0.0], 0.35, (60, 2))
_G2 = _rng2.normal([4.0, 0.5], 0.35, (60, 2))
_G3 = _rng2.normal([2.0, 3.5], 0.35, (60, 2))
_Xk = np.vstack([_G1, _G2, _G3])
_c, _l, _in = kmeans(_Xk, 3, 30, seed=42)

check("Formas de salida correctas",
      lambda: _c.shape == (3, 2) and _l.shape == (180,) and np.issubdtype(_l.dtype, np.integer) and isinstance(_in, float),
      msg="centroids (k,d), labels (N,), inertia float")
check("Recupera los centros reales de los blobs",
      lambda: np.min([np.linalg.norm(_c - np.array([[0.0, 0.0]]), axis=1).min(),
                      np.linalg.norm(_c - np.array([[4.0, 0.5]]), axis=1).min(),
                      np.linalg.norm(_c - np.array([[2.0, 3.5]]), axis=1).min()]) < 0.25
              and np.all([np.min(np.linalg.norm(_c - t, axis=1)) < 0.25
                          for t in np.array([[0.0, 0.0], [4.0, 0.5], [2.0, 3.5]])]),
      msg="con blobs limpios los centroides deben caer sobre las medias reales")
check("Inercia ≤ inercia de los centros reales × 1.05",
      lambda: _in <= 1.05 * float(np.sum((_Xk - np.array([[0.0, 0.0], [4.0, 0.5], [2.0, 3.5]])[
              np.argmin(np.sum((_Xk[:, None, :] - np.array([[0.0, 0.0], [4.0, 0.5], [2.0, 3.5]])[None, :, :]) ** 2, axis=2), axis=1)]) ** 2)),
      msg="Lloyd debe converger a una inercia comparable a la de los centros verdaderos")
check("La inercia coincide con Σ‖x − μ_c‖²",
      lambda: np.allclose(_in, float(np.sum((_Xk - _c[_l]) ** 2)), rtol=1e-6),
      msg="inertia = suma de distancias al cuadrado al centroide asignado")
check("Determinista con la misma semilla",
      lambda: np.allclose(kmeans(_Xk, 3, 30, seed=42)[2], _in),
      msg="misma seed → mismos centroides iniciales → mismo resultado")
check("Clusters equilibrados en blobs limpios",
      lambda: min(int(np.sum(_l == c)) for c in range(3)) >= 45,
      msg="ningún cluster debería quedarse vacío ni diminuto en este dataset")
`,
    hints: [
      'Parte A: es `fit_logistic` con `dw = (X.T @ err)/n + (lam/n)*w`. No toques `db`.',
      'Parte B: las distancias punto-centroide salen con broadcasting: `((X[:,None,:] − C[None,:,:])**2).sum(2)`, y la asignación es `np.argmin(d2, axis=1)`.',
      'Actualiza cada centroide a la media de sus puntos (`X[labels == c].mean(axis=0)`), pero solo si el cluster no está vacío.',
    ],
  },
]
