/**
 * Ejercicios del módulo MLOps (N10) — del notebook a producción.
 * Prefijo de ids: `mlops-`. Cada solution_code está verificado contra su
 * test_code con python3 + numpy (shim de check()).
 */

import type { Exercise } from '@/lib/exercises'

export const MLOPS_EXERCISES: Exercise[] = [
  {
    id: 'mlops-quantize-int8',
    title: 'E1 · Cuantización affine a int8',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: String.raw`Implementa la cuantización **affine** (asimétrica) de un tensor float32 a int8:

$$x_q = \mathrm{clip}\!\left(\mathrm{round}\!\left(\frac{x}{s}\right) + z,\; -128,\; 127\right), \qquad s = \frac{x_{\max} - x_{\min}}{127 - (-128)}, \qquad z = \mathrm{round}\!\left(-128 - \frac{x_{\min}}{s}\right)$$

y su inversa aproximada $\hat{x} = s\,(x_q - z)$.

Escribe tres funciones:

- \`parametros_cuantizacion(x, qmin=-128, qmax=127)\` → \`(scale: float, zero_point: int)\`. El \`zero_point\` es el entero que representa al **0.0 real** (quédate dentro de [qmin, qmax]).
- \`cuantizar(x, scale, zero_point, qmin=-128, qmax=127)\` → array **int8**.
- \`descuantizar(x_q, scale, zero_point)\` → array float.

Los tests verifican que el mínimo real cae en −128, el máximo en 127, que el cero es representable y que el error máximo es medio nivel ($s/2$) — la firma de una cuantización bien calibrada.`,
    starter_code: `import numpy as np

def parametros_cuantizacion(x, qmin=-128, qmax=127):
    """Devuelve (scale, zero_point) para cuantizar x en [qmin, qmax]."""
    # TODO: scale = (xmax - xmin) / (qmax - qmin)
    # TODO: zero_point = round(qmin - xmin / scale), recortado a [qmin, qmax]
    scale = 1.0
    zero_point = 0
    return scale, zero_point

def cuantizar(x, scale, zero_point, qmin=-128, qmax=127):
    """x_q = clip(round(x / scale) + zero_point, qmin, qmax), como int8."""
    # TODO
    return np.zeros_like(x, dtype=np.int8)

def descuantizar(x_q, scale, zero_point):
    """x_hat = scale * (x_q - zero_point), en float."""
    # TODO
    return np.zeros_like(x_q, dtype=float)

# Prueba rápida
x = np.linspace(-3, 5, 9)
s, z = parametros_cuantizacion(x)
xq = cuantizar(x, s, z)
print("scale:", s, " zero_point:", z)
print("x_q:", xq)
print("error máx:", np.max(np.abs(descuantizar(xq, s, z) - x)))
`,
    solution_code: `import numpy as np

def parametros_cuantizacion(x, qmin=-128, qmax=127):
    """Devuelve (scale, zero_point) para cuantizar x en [qmin, qmax]."""
    xmin = float(np.min(x))
    xmax = float(np.max(x))
    scale = (xmax - xmin) / (qmax - qmin)
    if scale == 0:
        scale = 1.0
    zero_point = int(round(qmin - xmin / scale))
    zero_point = max(qmin, min(qmax, zero_point))
    return scale, zero_point

def cuantizar(x, scale, zero_point, qmin=-128, qmax=127):
    """x_q = clip(round(x / scale) + zero_point, qmin, qmax), como int8."""
    xq = np.round(x / scale) + zero_point
    xq = np.clip(xq, qmin, qmax)
    return xq.astype(np.int8)

def descuantizar(x_q, scale, zero_point):
    """x_hat = scale * (x_q - zero_point), en float."""
    return scale * (x_q.astype(float) - zero_point)
`,
    test_code: `
rng = np.random.default_rng(42)
x_t = rng.uniform(-3, 5, 200)

s_t, z_t = parametros_cuantizacion(x_t)
check("parametros_cuantizacion devuelve (scale, zero_point)",
      lambda: isinstance(s_t, float) and isinstance(z_t, int),
      msg="Debe devolver una tupla (scale: float, zero_point: int)")

check("scale cubre todo el rango en 255 niveles",
      lambda: np.isclose(s_t, (x_t.max() - x_t.min()) / 255, rtol=1e-6),
      msg="scale = (xmax - xmin) / (127 - (-128))")

check("zero_point representa el 0.0 real",
      lambda: abs(descuantizar(np.int8(z_t), s_t, z_t)) <= s_t + 1e-9,
      msg="Al descuantizar zero_point debes obtener (casi) 0.0: el cero real debe ser representable")

xq_t = cuantizar(x_t, s_t, z_t)
check("x_q es int8 dentro de [-128, 127]",
      lambda: xq_t.dtype == np.int8 and xq_t.min() >= -128 and xq_t.max() <= 127,
      msg="Convierte con .astype(np.int8) y recorta con np.clip al rango [-128, 127]")

check("El mínimo real cae en qmin y el máximo en qmax",
      lambda: xq_t.min() == -128 and xq_t.max() == 127,
      msg="Con esta scale, min(x) → -128 y max(x) → 127 exactamente")

x_hat = descuantizar(xq_t, s_t, z_t)
check("Error de cuantización ≤ scale/2",
      lambda: np.max(np.abs(x_hat - x_t)) <= s_t / 2 + 1e-9,
      msg="El redondeo introduce como mucho medio nivel de error: |x_hat - x| ≤ s/2")

check("descuantizar es la inversa aproximada (MSE pequeño)",
      lambda: np.mean((x_hat - x_t) ** 2) <= (s_t ** 2) / 12 * 1.5,
      msg="Para señal uniforme el MSE de cuantización es ≈ s²/12")
`,
    hints: [
      'La scale es el tamaño de cada escalón: divide el rango real entre los 255 huecos de int8.',
      '`zero_point = round(qmin - xmin / scale)` es el entero donde aterriza el 0.0 real; no olvides `np.clip`.',
      'Cuantizar: `np.round(x / s) + z`, clip y `.astype(np.int8)`. Descuantizar es deshacer: `s * (x_q - z)`.',
    ],
  },
  {
    id: 'mlops-quant-matmul',
    title: 'E2 · Matmul en int8 (como un acelerador real)',
    difficulty: 'AVANZADO',
    xp: 120,
    statement: String.raw`Los NPU/TPU y las CPUs modernas multiplican enteros mucho más rápido que flotantes. El truco de producción es la **cuantización simétrica por tensor** (zero_point = 0):

$$s_A = \frac{\max|A|}{127}, \qquad A_q = \mathrm{round}\!\left(\frac{A}{s_A}\right) \in \mathrm{int8}, \qquad C = \underbrace{(A_q \cdot B_q)}_{\text{acumular en int32}} \cdot s_A \, s_B$$

La clave: los productos int8×int8 se **acumulan en int32** (si acumularas en int8 desbordaría al instante) y solo al final se descuantiza multiplicando por el producto de scales.

Implementa \`matmul_int8(A, B)\` → \`(C, A_q, B_q, scale_A, scale_B)\` donde \`C\` es el resultado en float. Los tests exigen error relativo < 2% frente al matmul en float32 — el precio típico de ir 4× más rápido con 4× menos memoria.`,
    starter_code: `import numpy as np

def matmul_int8(A, B):
    """
    Multiplicación de matrices cuantizada a int8 (simétrica, por tensor).
    1. scale_A = max|A| / 127  (igual para B)
    2. A_q = round(A / scale_A) en int8; B_q igual
    3. C_q = A_q @ B_q  ¡acumulando en int32!
    4. C = C_q * scale_A * scale_B
    Devuelve (C, A_q, B_q, scale_A, scale_B).
    """
    # TODO
    C = A @ B
    return C, np.zeros_like(A, np.int8), np.zeros_like(B, np.int8), 1.0, 1.0

# Prueba rápida
rng = np.random.default_rng(0)
A = rng.normal(size=(8, 16))
B = rng.normal(size=(16, 6))
C, A_q, B_q, sa, sb = matmul_int8(A, B)
err = np.linalg.norm(C - A @ B) / np.linalg.norm(A @ B)
print(f"error relativo int8: {err:.4%}")   # esperado: < 1%
print("rango A_q:", A_q.min(), "…", A_q.max())
`,
    solution_code: `import numpy as np

def matmul_int8(A, B):
    """
    Matmul con cuantización simétrica por tensor (zero_point = 0):
    int8 × int8 → acumulación int32 → descuantizar con scale_A * scale_B.
    """
    scale_A = float(np.max(np.abs(A))) / 127.0
    scale_B = float(np.max(np.abs(B))) / 127.0
    A_q = np.round(A / scale_A).astype(np.int8)
    B_q = np.round(B / scale_B).astype(np.int8)
    C_q = A_q.astype(np.int32) @ B_q.astype(np.int32)
    C = C_q * (scale_A * scale_B)
    return C, A_q, B_q, scale_A, scale_B
`,
    test_code: `
rng = np.random.default_rng(7)
A_t = rng.normal(size=(8, 16))
B_t = rng.normal(size=(16, 6))
C_ref = A_t @ B_t

_res = matmul_int8(A_t, B_t)
check("Devuelve una tupla de 5 elementos",
      lambda: isinstance(_res, tuple) and len(_res) == 5,
      msg="Devuelve (C, A_q, B_q, scale_A, scale_B)")
C_u, Aq_u, Bq_u, sa_u, sb_u = _res

check("Shape del resultado correcta",
      lambda: C_u.shape == (8, 6),
      msg="C debe ser (8, 6)")

check("Los pesos/activaciones cuantizados son int8",
      lambda: Aq_u.dtype == np.int8 and Bq_u.dtype == np.int8,
      msg="A_q y B_q deben ser arrays int8 (usa .astype(np.int8))")

check("Cuantización simétrica: sin saturación en int8",
      lambda: np.max(np.abs(Aq_u)) <= 127 and np.max(np.abs(Bq_u)) <= 127,
      msg="Con scale = max|X|/127 ningún valor debe superar 127 en magnitud")

check("El resultado cuantizado aproxima el float32 (error relativo < 2%)",
      lambda: np.linalg.norm(C_u - C_ref) / np.linalg.norm(C_ref) < 0.02,
      msg="C = (A_q @ B_q en int32) * scale_A * scale_B; el error relativo debe ser < 2%")

check("Equivale a descuantizar con el producto de scales",
      lambda: np.allclose(
          C_u,
          (np.round(A_t / sa_u).astype(np.int32) @ np.round(B_t / sb_u).astype(np.int32)) * sa_u * sb_u,
          atol=1e-9),
      msg="La receta exacta: acumular en int32 y multiplicar al final por scale_A·scale_B")

A2 = rng.normal(size=(32, 64))
B2 = rng.normal(size=(64, 32))
C2_ref = A2 @ B2
C2_u = matmul_int8(A2, B2)[0]
check("Generaliza a otras formas (error relativo < 1.5%)",
      lambda: np.linalg.norm(C2_u - C2_ref) / np.linalg.norm(C2_ref) < 0.015,
      msg="En matrices grandes el error relativo típico de int8 es ~0.1–1%")
`,
    hints: [
      'Simétrica = sin zero_point: `scale = max|X| / 127`, `X_q = round(X / scale).astype(np.int8)`.',
      'Antes del `@`, sube a int32: `A_q.astype(np.int32) @ B_q.astype(np.int32)`. En int8 desbordarías.',
      'El resultado entero está en unidades de "scale_A × scale_B": multiplica por ambas al final.',
    ],
  },
  {
    id: 'mlops-magnitude-pruning',
    title: 'E3 · Magnitude pruning + fine-tune',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: String.raw`La mayoría de los pesos de una red entrenada son casi cero y apenas aportan. El **magnitude pruning** los pone exactamente a cero: pesos con $|w|$ por debajo del percentil que marca la fracción a podar.

Implementa:

- \`magnitude_prune(w, frac)\` → **nuevo** array con la fracción \`frac\` de pesos de menor $|w|$ puesta a 0 (pista: \`np.quantile\`).
- \`sparsity(w)\` → fracción de pesos exactamente cero.
- \`finetune_pruned(X, y, w_pruned, epochs, lr)\` → gradiente descendente sobre la regresión $\hat{y} = Xw$ **respetando la máscara**: tras cada paso, los pesos podados vuelven a 0 (en producción esto es un sparse fine-tune).

El test final entrena una regresión donde solo 10 de 50 pesos importan: poda al 80%, haz fine-tune y comprueba que apenas pierdes MSE. Esa es la tesis entera del pruning.`,
    starter_code: `import numpy as np

def magnitude_prune(w, frac):
    """Pone a cero la fracción 'frac' de pesos con menor |w|. No modifica w."""
    w_p = w.copy()
    # TODO: umbral = percentil (frac) de |w|; a cero todo lo que esté por debajo
    return w_p

def sparsity(w):
    """Fracción de pesos exactamente cero (entre 0 y 1)."""
    # TODO
    return 0.0

def finetune_pruned(X, y, w_pruned, epochs=200, lr=0.05):
    """Gradiente descendente manteniendo los pesos podados en cero."""
    w = w_pruned.copy()
    mascara = (w != 0)
    n = X.shape[0]
    for _ in range(epochs):
        grad = (2.0 / n) * X.T @ (X @ w - y)
        w = w - lr * grad
        # TODO: re-aplicar la máscara (los podados no resucitan)
    return w

# Prueba rápida
w = np.array([0.01, -2.5, 0.03, 1.7, -0.02])
print(magnitude_prune(w, 0.6))   # esperado: [0, -2.5, 0, 1.7, 0]
print("sparsity:", sparsity(magnitude_prune(w, 0.6)))
`,
    solution_code: `import numpy as np

def magnitude_prune(w, frac):
    """Pone a cero la fracción (frac) de pesos con menor |w|."""
    w_p = w.copy()
    if frac <= 0:
        return w_p
    umbral = np.quantile(np.abs(w), frac)
    mascara = np.abs(w) <= umbral
    w_p[mascara] = 0.0
    return w_p

def sparsity(w):
    """Fracción de pesos exactamente cero (entre 0 y 1)."""
    return float(np.mean(w == 0))

def finetune_pruned(X, y, w_pruned, epochs=200, lr=0.05):
    """Gradiente descendente manteniendo los pesos podados en cero."""
    w = w_pruned.copy()
    mascara = (w != 0)
    n = X.shape[0]
    for _ in range(epochs):
        grad = (2.0 / n) * X.T @ (X @ w - y)
        w = w - lr * grad
        w[~mascara] = 0.0   # los pesos podados no resucitan
    return w
`,
    test_code: `
rng = np.random.default_rng(11)
w_t = rng.normal(size=1000)

w_p50 = magnitude_prune(w_t, 0.5)
check("La poda no modifica el array original",
      lambda: np.count_nonzero(w_t) == 1000,
      msg="Devuelve una copia: w.copy(); el original no debe tocarse")

check("sparsity mide la fracción de ceros",
      lambda: abs(sparsity(w_p50) - 0.5) < 0.02 and sparsity(np.ones(4)) == 0.0,
      msg="sparsity = media de (w == 0)")

check("Se podan los pesos de MENOR magnitud",
      lambda: np.all(np.abs(w_p50[w_p50 != 0]) >= np.quantile(np.abs(w_t), 0.5) - 1e-12),
      msg="El umbral es np.quantile(np.abs(w), frac): por debajo, a cero")

check("frac=0.9 deja ~90% de ceros y frac=0 no toca nada",
      lambda: abs(sparsity(magnitude_prune(w_t, 0.9)) - 0.9) < 0.02
              and np.array_equal(magnitude_prune(w_t, 0.0), w_t),
      msg="La fracción de ceros debe seguir a frac")

# Regresión de juguete: solo 10 de 50 pesos importan de verdad
n_t, d_t = 400, 50
X_t = rng.normal(size=(n_t, d_t))
w_true = np.zeros(d_t)
w_true[rng.choice(d_t, 10, replace=False)] = rng.normal(size=10) * 3.0
y_t = X_t @ w_true + rng.normal(0, 0.05, n_t)
w_full = np.linalg.lstsq(X_t, y_t, rcond=None)[0]
w_pr = magnitude_prune(w_full, 0.8)
w_ft = finetune_pruned(X_t, y_t, w_pr, epochs=300, lr=0.05)

mse = lambda a, b: float(np.mean((a - b) ** 2))
check("La poda encuentra justo los 10 pesos importantes",
      lambda: np.count_nonzero(w_pr) == 10
              and np.array_equal(np.sort(np.nonzero(w_pr)[0]), np.sort(np.nonzero(w_true)[0])),
      msg="Si el 80% de los pesos verdaderos es ~0, la poda al 80% debe quedarse con los 10 grandes")

check("Tras podar el 80%, el fine-tune respeta la máscara",
      lambda: np.all(w_ft[w_pr == 0] == 0),
      msg="Los pesos podados deben permanecer en cero durante el fine-tune")

check("El modelo podado + fine-tune casi no pierde precisión",
      lambda: mse(X_t @ w_ft, y_t) <= mse(X_t @ w_full, y_t) * 1.5,
      msg="Cuando los pesos podados eran ruido, el MSE apenas se mueve (y el fine-tune lo pule)")
`,
    hints: [
      'El umbral de poda es `np.quantile(np.abs(w), frac)`; pon a cero lo que quede por debajo (o igual).',
      '`sparsity(w)` es `np.mean(w == 0)` — la media de un booleano es su proporción.',
      'En el fine-tune guarda `mascara = w != 0` al inicio y, tras cada paso de gradiente, `w[~mascara] = 0`.',
    ],
  },
  {
    id: 'mlops-distillation',
    title: 'E4 · Destilación con temperatura',
    difficulty: 'INTERMEDIO',
    xp: 90,
    statement: String.raw`Un modelo gigante (maestro) puede comprimirse en uno pequeño (alumno) entrenándolo no contra las etiquetas duras, sino contra los **soft targets** del maestro: su distribución completa, suavizada con temperatura $T$:

$$p_i(T) = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}, \qquad \mathcal{L}_{\text{dest}} = T^2 \cdot \mathrm{KL}\!\left(p_{\text{maestro}}(T) \;\|\; p_{\text{alumno}}(T)\right)$$

Con $T$ alta, el "esto es un 7 pero se parece un poco a un 1" del maestro se hace visible: esa sombra entre clases es el **conocimiento oscuro** que una etiqueta dura no tiene. El factor $T^2$ compensa que los gradientes se achican al suavizar.

Implementa \`softmax_T(z, T)\` (¡resta el máximo antes de \`exp\`!) y \`perdida_destilacion(z_maestro, z_alumno, T)\` que devuelva $T^2 \cdot \mathrm{KL}(p\|q)$ como float.`,
    starter_code: `import numpy as np

def softmax_T(z, T=1.0):
    """Softmax con temperatura: p_i = exp(z_i / T) / sum_j exp(z_j / T)."""
    # TODO: divide por T, resta el máximo (estabilidad), exp y normaliza
    return np.ones_like(z) / len(z)

def perdida_destilacion(z_maestro, z_alumno, T=4.0):
    """KL(softmax(z_maestro/T) || softmax(z_alumno/T)) * T^2."""
    # TODO: KL(p||q) = sum p * (log p - log q)
    return 0.0

# Prueba rápida
z_m = np.array([3.0, 1.0, 0.2, -1.0])   # logits del maestro
z_a = np.array([2.5, 1.4, 0.0, -0.9])   # logits del alumno
print("p maestro T=1:", np.round(softmax_T(z_m, 1.0), 3))
print("p maestro T=8:", np.round(softmax_T(z_m, 8.0), 3))   # más suave
print("pérdida:", perdida_destilacion(z_m, z_a, 4.0))
`,
    solution_code: `import numpy as np

def softmax_T(z, T=1.0):
    """Softmax con temperatura: p_i = exp(z_i / T) / sum_j exp(z_j / T)."""
    zt = np.asarray(z, dtype=float) / T
    zt = zt - np.max(zt, axis=-1, keepdims=True)   # estabilidad numérica
    e = np.exp(zt)
    return e / np.sum(e, axis=-1, keepdims=True)

def perdida_destilacion(z_maestro, z_alumno, T=4.0):
    """KL(p_maestro || p_alumno) * T^2 con ambas distribuciones a temperatura T."""
    p = softmax_T(z_maestro, T)
    q = softmax_T(z_alumno, T)
    kl = np.sum(p * (np.log(p) - np.log(q)), axis=-1)
    return float(kl * T ** 2)
`,
    test_code: `
z_m = np.array([3.0, 1.0, 0.2, -1.0])
z_a = np.array([2.5, 1.4, 0.0, -0.9])

p1 = softmax_T(z_m, 1.0)
check("softmax_T con T=1 es el softmax clásico",
      lambda: np.allclose(p1, np.exp(z_m - z_m.max()) / np.exp(z_m - z_m.max()).sum()),
      msg="Con T=1 debe coincidir con el softmax de toda la vida")

check("La salida es una distribución válida",
      lambda: np.allclose(softmax_T(z_m, 4.0).sum(), 1.0) and np.all(softmax_T(z_m, 4.0) > 0),
      msg="Debe sumar 1 y ser estrictamente positiva")

ent = lambda p: float(-np.sum(p * np.log(p)))
check("Temperatura alta SUAVIZA la distribución (más entropía)",
      lambda: ent(softmax_T(z_m, 10.0)) > ent(softmax_T(z_m, 2.0)) > ent(softmax_T(z_m, 1.0)),
      msg="Dividir los logits por T>1 acerca las probabilidades al uniforme")

check("T muy alta tiende a la distribución uniforme",
      lambda: np.allclose(softmax_T(z_m, 1e6), np.full(4, 0.25), atol=1e-4),
      msg="Con T enorme todos los exp(z_i/T) ≈ 1: cada clase ≈ 1/K")

check("KL(p||p) = 0 y KL ≥ 0 siempre",
      lambda: abs(perdida_destilacion(z_m, z_m, 4.0)) < 1e-12
              and perdida_destilacion(z_m, z_a, 4.0) > 0,
      msg="La divergencia KL solo es cero cuando las distribuciones coinciden")

check("El factor T² escala la pérdida",
      lambda: np.isclose(perdida_destilacion(z_m, z_a, 2.0) / 4.0,
                         np.sum(softmax_T(z_m, 2.0) * (np.log(softmax_T(z_m, 2.0)) - np.log(softmax_T(z_a, 2.0)))),
                         rtol=1e-9),
      msg="pérdida = T² · KL(p_maestro || p_alumno)")

z2 = np.array([1000.0, 999.0, 0.0])
check("Es numéricamente estable con logits grandes",
      lambda: np.all(np.isfinite(softmax_T(z2, 1.0))) and np.isfinite(perdida_destilacion(z2, z_m[:3] * 100, 3.0)),
      msg="Resta el máximo antes de exp() para evitar overflow")
`,
    hints: [
      'Divide los logits por T ANTES del softmax: `zt = z / T`, y resta `zt.max()` antes de `np.exp`.',
      '`KL(p||q) = np.sum(p * (np.log(p) - np.log(q)))` con p del maestro y q del alumno, ambas a temperatura T.',
      'No olvides multiplicar la KL por `T ** 2` al final: es lo que mantiene la escala del gradiente.',
    ],
  },
  {
    id: 'mlops-psi-drift',
    title: 'E5 · PSI: detector de data drift',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: String.raw`El **Population Stability Index** compara el histograma de una variable en producción contra el de referencia (entrenamiento), bin a bin:

$$\mathrm{PSI} = \sum_i (a_i - e_i)\,\ln\!\frac{a_i}{e_i}$$

donde $e_i$ es la proporción esperada (referencia) y $a_i$ la actual en el bin $i$. Regla de pulgar de la industria: $\mathrm{PSI} < 0.1$ estable, $0.1$–$0.2$ vigilar, $\geq 0.2$ **drift** → página al equipo de turno y probable re-entrenamiento.

Implementa:

- \`psi(e_ref, a_new, eps=1e-6)\` → float (usa \`np.clip\` con \`eps\` para sobrevivir a bins vacíos).
- \`detectar_drift(e_ref, a_new, umbral=0.2)\` → \`(valor_psi, hay_drift: bool)\`.

Fíjate en que la fórmula es simétrica ($\mathrm{PSI}(e,a) = \mathrm{PSI}(a,e)$): cada bin contribuye $(a_i - e_i)\ln(a_i/e_i)$, que es positivo tanto si el bin crece como si se encoge.`,
    starter_code: `import numpy as np

def psi(e_ref, a_new, eps=1e-6):
    """
    Population Stability Index entre dos histogramas (proporciones).
    e_ref, a_new: arrays 1D que suman ~1. eps evita log(0) y división por 0.
    """
    # TODO: clip con eps y suma (a - e) * log(a / e)
    return 0.0

def detectar_drift(e_ref, a_new, umbral=0.2):
    """Devuelve (psi_valor, hay_drift): alerta si PSI >= umbral."""
    # TODO
    return 0.0, False

# Prueba rápida
e_ref   = np.array([0.05, 0.15, 0.30, 0.30, 0.15, 0.05])
a_ok    = np.array([0.06, 0.14, 0.31, 0.29, 0.14, 0.06])
a_drift = np.array([0.01, 0.05, 0.14, 0.30, 0.30, 0.20])
print("PSI estable:", round(psi(e_ref, a_ok), 4))
print("PSI drift:  ", round(psi(e_ref, a_drift), 4))
print(detectar_drift(e_ref, a_drift))   # esperado: (~0.55, True)
`,
    solution_code: `import numpy as np

def psi(e_ref, a_new, eps=1e-6):
    """Population Stability Index: sum_i (a_i - e_i) * ln(a_i / e_i)."""
    e = np.clip(np.asarray(e_ref, dtype=float), eps, None)
    a = np.clip(np.asarray(a_new, dtype=float), eps, None)
    return float(np.sum((a - e) * np.log(a / e)))

def detectar_drift(e_ref, a_new, umbral=0.2):
    """Devuelve (psi_valor, hay_drift): alerta si PSI >= umbral."""
    valor = psi(e_ref, a_new)
    return valor, bool(valor >= umbral)
`,
    test_code: `
e_ref = np.array([0.05, 0.15, 0.30, 0.30, 0.15, 0.05])
a_ok  = np.array([0.06, 0.14, 0.31, 0.29, 0.14, 0.06])
a_drift = np.array([0.01, 0.05, 0.14, 0.30, 0.30, 0.20])

check("PSI = 0 con distribuciones idénticas",
      lambda: abs(psi(e_ref, e_ref)) < 1e-12,
      msg="Si a_i = e_i en todos los bins, cada término es 0")

check("PSI es simétrico: psi(e,a) == psi(a,e)",
      lambda: np.isclose(psi(e_ref, a_drift), psi(a_drift, e_ref), rtol=1e-9),
      msg="(a-e)·ln(a/e) sumado es simétrico: cambia el signo dos veces")

check("Más desplazamiento → más PSI",
      lambda: 0 < psi(e_ref, a_ok) < psi(e_ref, a_drift),
      msg="PSI crece con la distancia entre distribuciones")

check("Bins vacíos no rompen nada (eps evita log(0)/div0)",
      lambda: np.isfinite(psi(np.array([0.0, 0.5, 0.5]), np.array([0.5, 0.5, 0.0]))),
      msg="Recorta las proporciones con np.clip(p, eps, None) antes del log")

v_ok, d_ok = detectar_drift(e_ref, a_ok)
v_bad, d_bad = detectar_drift(e_ref, a_drift)
check("detectar_drift devuelve (valor, bool) y dispara la alarma al 0.2",
      lambda: (not d_ok) and d_bad and v_bad >= 0.2 > v_ok,
      msg="Umbral clásico: PSI < 0.1 estable, 0.1–0.2 vigilar, ≥ 0.2 drift → re-entrenar")

check("La distribución con drift tiene PSI ≈ 0.55 (rango esperado)",
      lambda: 0.4 < psi(e_ref, a_drift) < 0.8,
      msg="Con esos histogramas concretos el PSI debe caer en torno a 0.5–0.6")
`,
    hints: [
      'Primero `e = np.clip(np.asarray(e_ref, float), eps, None)` y lo mismo con `a`.',
      'La fórmula literal: `np.sum((a - e) * np.log(a / e))`. Devuélvelo con `float(...)`.',
      '`detectar_drift` solo llama a `psi` y compara con el umbral: `valor >= umbral`.',
    ],
  },
]
