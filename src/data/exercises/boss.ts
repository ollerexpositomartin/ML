/**
 * boss.ts — Los 5 ejercicios puerta del BOSS FINAL (capstone de /laboratorio).
 * Puertas secuenciales: Exploración → Preprocesado → Modelo → Umbral → Informe.
 * Dataset sintético "médico" determinista generado en-runtime (2.000 filas,
 * 8 features, 2 clases). Cada solution_code pasa su test_code al 100%
 * (verificado localmente con numpy 2.x + shim de check()).
 */

import { registerExercises, type Exercise } from '@/lib/exercises'

/** Generador del dataset compartido (se incluye en starter y solution). */
const DATASET_PY = `
def make_boss_dataset(seed=13):
    """Dataset sintético 'médico': 2.000 filas, 8 features, 2 clases (determinista)."""
    rng = np.random.default_rng(seed)
    n = 2000
    X = rng.normal(0, 1, (n, 8))
    score = (1.8*X[:,0] - 1.5*X[:,1] + 1.3*np.sin(2*X[:,2])
             + 1.2*(X[:,3]*X[:,4]) - 1.0*(X[:,5]**2 - 1) + 0.9*np.abs(X[:,6]))
    score = score + rng.normal(0, 0.45, n)
    y = (score > np.median(score)).astype(float)
    scale = np.array([12.0, 0.8, 45.0, 3.0, 120.0, 0.05, 9.0, 30.0])
    offset = np.array([60.0, 1.2, 95.0, 7.0, 140.0, 0.4, 25.0, 70.0])
    return X * scale + offset, y
`

const PREPROCESS_SOL = `
def preprocess(X, y, seed=42):
    rng = np.random.default_rng(seed)
    idx = rng.permutation(len(X))
    n_tr = int(0.8 * len(X))
    tr, te = idx[:n_tr], idx[n_tr:]
    mu = X[tr].mean(axis=0)
    sd = X[tr].std(axis=0)
    return (X[tr] - mu) / sd, (X[te] - mu) / sd, y[tr], y[te]
`

const MLP_SOL = `
def build_and_train(X_train, y_train, hidden=16, lr=0.2, epochs=800, seed=0):
    """MLP d→hidden→1 (tanh + sigmoide) entrenado con BCE y backprop a mano."""
    rng = np.random.default_rng(seed)
    d = X_train.shape[1]
    W1 = rng.normal(0, np.sqrt(2.0 / d), (d, hidden)); b1 = np.zeros(hidden)
    W2 = rng.normal(0, np.sqrt(2.0 / hidden), (hidden, 1)); b2 = np.zeros(1)
    n = len(X_train)
    losses = []
    for ep in range(epochs):
        a1 = np.tanh(X_train @ W1 + b1)
        p = 1.0 / (1.0 + np.exp(-(a1 @ W2 + b2).ravel()))
        losses.append(float(-np.mean(y_train * np.log(p + 1e-12) + (1 - y_train) * np.log(1 - p + 1e-12))))
        dz2 = (p - y_train).reshape(-1, 1) / n
        dz1 = (dz2 @ W2.T) * (1.0 - a1 ** 2)
        W2 -= lr * (a1.T @ dz2); b2 -= lr * dz2.sum(axis=0)
        W1 -= lr * (X_train.T @ dz1); b1 -= lr * dz1.sum(axis=0)

    def predict(X):
        a1 = np.tanh(np.asarray(X, dtype=float) @ W1 + b1)
        return (1.0 / (1.0 + np.exp(-(a1 @ W2 + b2).ravel())) > 0.5).astype(float)

    return {"W1": W1, "b1": b1, "W2": W2, "b2": b2, "losses": losses, "predict": predict}
`

/* ------------------------------------------------------------------ */
/* Puerta 1 · Exploración                                              */
/* ------------------------------------------------------------------ */
const exploracion: Exercise = {
  id: 'boss-exploracion',
  title: 'Puerta 1 · Exploración del dataset',
  difficulty: 'BASICO',
  xp: 60,
  statement: [
    '**BOSS FINAL · Puerta 1 de 5.** Te entregamos un dataset médico sintético: 2.000 pacientes, 8 variables clínicas, diagnóstico binario. Antes de modelar, explora.',
    'Implementa `explorar(X, y)` que devuelva un `dict` con:',
    '- `"n_muestras"` (int): número de filas de $X$',
    '- `"n_features"` (int): número de columnas de $X$',
    '- `"balance"` (float): proporción de la clase positiva, $\\frac{1}{n}\\sum_i y_i$',
    '- `"n_nan"` (int): número total de valores NaN en $X$ e $y$',
  ].join('\n'),
  starter_code: `import numpy as np
${DATASET_PY}
def explorar(X, y):
    """
    Devuelve un dict con las estadísticas básicas del dataset:
    {"n_muestras": int, "n_features": int, "balance": float, "n_nan": int}
    """
    # TODO
    return {}

X, y = make_boss_dataset()
print(explorar(X, y))
`,
  solution_code: `import numpy as np
${DATASET_PY}
def explorar(X, y):
    return {
        "n_muestras": int(X.shape[0]),
        "n_features": int(X.shape[1]),
        "balance": float(np.mean(y)),
        "n_nan": int(np.isnan(X).sum() + np.isnan(y).sum()),
    }
`,
  test_code: `
X, y = make_boss_dataset()
rep = explorar(X, y)
check("Devuelve un dict con las 4 claves", lambda: isinstance(rep, dict) and {"n_muestras", "n_features", "balance", "n_nan"} <= set(rep.keys()),
      msg="El dict debe incluir: n_muestras, n_features, balance, n_nan")
check("n_muestras = 2000 y n_features = 8", lambda: rep["n_muestras"] == 2000 and rep["n_features"] == 8,
      msg=f"obtenido {rep.get('n_muestras')} filas y {rep.get('n_features')} features")
check("El balance de clases está cerca del 50%", lambda: 0.45 <= rep["balance"] <= 0.55,
      msg=f"balance={rep.get('balance')}: usa np.mean(y) (la proporción de la clase positiva)")
check("Cuenta NaN correctamente", lambda: rep["n_nan"] == 0 and explorar(np.array([[1.0, np.nan], [3.0, 4.0]]), np.array([0.0, 1.0]))["n_nan"] == 1,
      msg="Cuenta los NaN de X y de y con np.isnan(...).sum()")
check("Tipos nativos de Python (int/float)", lambda: isinstance(rep["n_muestras"], int) and isinstance(rep["balance"], float),
      msg="Convierte a int/float de Python con int() y float()")
`,
  hints: [
    '`X.shape` te da (filas, columnas); el balance es `np.mean(y)`.',
    'Para NaN: `np.isnan(X).sum()`. No olvides mirar también `y`.',
    'Los tests exigen `int` y `float` de Python: envuelve con `int(...)` y `float(...)`.',
  ],
}

/* ------------------------------------------------------------------ */
/* Puerta 2 · Preprocesado                                             */
/* ------------------------------------------------------------------ */
const preprocesado: Exercise = {
  id: 'boss-preprocesado',
  title: 'Puerta 2 · Preprocesado sin fuga de datos',
  difficulty: 'INTERMEDIO',
  xp: 100,
  statement: [
    '**BOSS FINAL · Puerta 2 de 5.** Las 8 variables clínicas viven en escalas dispares (de 0.05 a 140). Estandariza y divide el dataset.',
    'Implementa `preprocess(X, y, seed=42)` que devuelva `(X_train, X_test, y_train, y_test)`:',
    '1. **Split 80/20** aleatorio pero reproducible (`np.random.default_rng(seed).permutation`).',
    '2. **Estandarización** $x\' = \\frac{x - \\mu}{\\sigma}$ feature a feature… ajustando $\\mu$ y $\\sigma$ **solo con el split de train**.',
    '$$\\mu = \\frac{1}{n_{train}}\\sum_{i \\in train} x_i, \\qquad \\sigma = \\mathrm{std}(X_{train})$$',
    '**La trampa clásica**: si ajustas el scaler con todo el dataset hay *fuga de datos* (leakage): el test contamina el entrenamiento y tu métrica miente. El test lo detecta.',
  ].join('\n'),
  starter_code: `import numpy as np
${DATASET_PY}
def preprocess(X, y, seed=42):
    """
    Split 80/20 reproducible + estandarización ajustada SOLO con train.
    Devuelve (X_train, X_test, y_train, y_test). No mutar X ni y.
    """
    # TODO: permutation con default_rng(seed), split 80/20
    # TODO: media/std del TRAIN, transformar ambos splits
    return X, X, y, y

X, y = make_boss_dataset()
Xtr, Xte, ytr, yte = preprocess(X, y)
print("train:", Xtr.shape, "media:", Xtr.mean(axis=0).round(3))
print("test :", Xte.shape)
`,
  solution_code: `import numpy as np
${DATASET_PY}
${PREPROCESS_SOL}
`,
  test_code: `
X, y = make_boss_dataset()
Xtr, Xte, ytr, yte = preprocess(X, y, seed=42)
check("Devuelve 4 arrays con las formas 80/20", lambda: Xtr.shape == (1600, 8) and Xte.shape == (400, 8) and len(ytr) == 1600 and len(yte) == 400,
      msg=f"formas obtenidas: {Xtr.shape}, {Xte.shape}")
check("Train estandarizado: media≈0 y std≈1 por feature", lambda: np.allclose(Xtr.mean(axis=0), 0, atol=1e-8) and np.allclose(Xtr.std(axis=0), 1, atol=1e-8),
      msg="Estandariza con (X − media_train) / std_train, feature a feature")
rng = np.random.default_rng(42); idx = rng.permutation(len(X)); n_tr = int(0.8*len(X))
tr, te = idx[:n_tr], idx[n_tr:]
mu_ref, sd_ref = X[tr].mean(axis=0), X[tr].std(axis=0)
check("Sin fuga de datos: el scaler se ajusta solo con train", lambda: np.allclose(Xte, (X[te]-mu_ref)/sd_ref, atol=1e-6),
      msg="Detectada fuga: parece que ajustaste media/std con TODO el dataset. Ajusta el scaler solo con el split de train")
check("Split determinista con la misma seed", lambda: all(np.allclose(a, b) for a, b in zip(preprocess(X, y, 42), preprocess(X, y, 42))),
      msg="Usa np.random.default_rng(seed).permutation para que el split sea reproducible")
_X_snap = X.copy(); _y_snap = y.copy()
preprocess(X, y, 7)
check("No modifica los arrays de entrada", lambda: np.array_equal(X, _X_snap) and np.array_equal(y, _y_snap),
      msg="preprocess debe devolver copias transformadas, no mutar X ni y")
`,
  hints: [
    '`rng = np.random.default_rng(seed)` y luego `idx = rng.permutation(len(X))`: las primeras 1600 posiciones son train.',
    'Calcula `mu = X[tr].mean(axis=0)` y `sd = X[tr].std(axis=0)` ANTES de transformar, y aplica `(X[te]-mu)/sd` al test.',
    'Si tu `X_test` tiene media exactamente 0 y std exactamente 1… es que ajustaste el scaler con todo el dataset: eso es fuga de datos.',
  ],
}

/* ------------------------------------------------------------------ */
/* Puerta 3 · El modelo                                                */
/* ------------------------------------------------------------------ */
const modelo: Exercise = {
  id: 'boss-modelo',
  title: 'Puerta 3 · MLP con backprop a mano',
  difficulty: 'AVANZADO',
  xp: 160,
  statement: [
    '**BOSS FINAL · Puerta 3 de 5.** La frontera entre sanos y enfermos no es lineal. Te toca construir el modelo: un MLP $d \\to h \\to 1$ con tanh y sigmoide, entrenado con BCE y backpropagation implementada por ti.',
    '$$a_1 = \\tanh(X W_1 + b_1), \\qquad \\hat{y} = \\sigma\\!\\left(a_1 W_2 + b_2\\right), \\qquad L = -\\frac{1}{n}\\sum \\left[ y\\log\\hat{y} + (1-y)\\log(1-\\hat{y}) \\right]$$',
    'Con BCE + sigmoide el gradiente de salida es limpio: $\\delta_2 = \\frac{\\hat{y} - y}{n}$. Propaga hacia atrás: $\\delta_1 = (\\delta_2 W_2^\\top) \\odot (1 - a_1^2)$.',
    'Implementa `build_and_train(X_train, y_train, hidden=16, lr=0.2, epochs=800, seed=0)` que devuelva un dict con `W1, b1, W2, b2`, `losses` (lista con la BCE de cada época) y `predict` (función que devuelve etiquetas 0/1 para cualquier matriz).',
  ].join('\n'),
  starter_code: `import numpy as np
${DATASET_PY}
${PREPROCESS_SOL}
def build_and_train(X_train, y_train, hidden=16, lr=0.2, epochs=800, seed=0):
    """
    MLP d→hidden→1 (tanh + sigmoide) con BCE y backprop a mano.
    Devuelve {"W1","b1","W2","b2","losses","predict"}.
    """
    rng = np.random.default_rng(seed)
    d = X_train.shape[1]
    W1 = rng.normal(0, np.sqrt(2.0 / d), (d, hidden)); b1 = np.zeros(hidden)
    W2 = rng.normal(0, np.sqrt(2.0 / hidden), (hidden, 1)); b2 = np.zeros(1)
    losses = []

    for ep in range(epochs):
        # TODO: forward (tanh → sigmoide), loss BCE
        # TODO: backward: dz2 = (p - y)/n ; dz1 = (dz2 @ W2.T) * (1 - a1**2)
        # TODO: descenso de gradiente sobre los 4 parámetros
        pass

    def predict(X):
        # TODO: forward + umbral 0.5 → etiquetas 0/1
        return np.zeros(len(X))

    return {"W1": W1, "b1": b1, "W2": W2, "b2": b2, "losses": losses, "predict": predict}

X, y = make_boss_dataset()
# preprocess ya viene resuelto de la Puerta 2 (arriba)
Xtr, Xte, ytr, yte = preprocess(X, y, seed=42)
model = build_and_train(Xtr, ytr)
print("losses:", model["losses"][:3], "…")
`,
  solution_code: `import numpy as np
${DATASET_PY}
${PREPROCESS_SOL}
${MLP_SOL}
`,
  test_code: `
X, y = make_boss_dataset()
Xtr, Xte, ytr, yte = preprocess(X, y, seed=42)
model = build_and_train(Xtr, ytr)
check("Devuelve un dict con pesos, losses y predict", lambda: isinstance(model, dict) and {"W1", "b1", "W2", "b2", "losses", "predict"} <= set(model.keys()) and callable(model["predict"]),
      msg="El dict debe incluir W1, b1, W2, b2, losses (lista) y predict (función)")
check("La pérdida BCE disminuye durante el entrenamiento", lambda: len(model["losses"]) >= 2 and model["losses"][-1] < model["losses"][0],
      msg="La lista losses debe registrar la BCE de cada época y terminar más baja que al inicio: revisa los signos de los gradientes")
check("La pérdida final es baja (< 0.35)", lambda: len(model["losses"]) >= 2 and model["losses"][-1] < 0.35,
      msg="La BCE final debe quedar por debajo de 0.35: revisa el forward/backward y entrena suficientes épocas")
check("Accuracy en train ≥ 0.85", lambda: float(np.mean(model["predict"](Xtr) == ytr)) >= 0.85,
      msg="El modelo debe aprender la frontera no lineal: revisa la backprop y los hiperparámetros")
check("predict generaliza a datos nuevos (forma y valores 0/1)", lambda: model["predict"](Xte[:10]).shape == (10,) and set(np.unique(model["predict"](Xte[:10]))) <= {0.0, 1.0},
      msg="predict(X) debe devolver un array 1D con una etiqueta 0/1 por fila")
`,
  hints: [
    'Forward: `a1 = np.tanh(X @ W1 + b1)` y `p = 1/(1+np.exp(-(a1 @ W2 + b2).ravel()))`. La BCE es `-np.mean(y*np.log(p+1e-12) + (1-y)*np.log(1-p+1e-12))`.',
    'Backward: `dz2 = (p - y).reshape(-1,1)/n`, `dz1 = (dz2 @ W2.T) * (1 - a1**2)`. Gradientes: `a1.T @ dz2` y `X.T @ dz1`.',
    'Si la pérdida sube o se estanca en 0.69 (=$\\log 2$), casi seguro tienes un signo mal en el gradiente o te falta dividir entre $n$.',
  ],
}

/* ------------------------------------------------------------------ */
/* Puerta 4 · Umbral                                                   */
/* ------------------------------------------------------------------ */
const umbral: Exercise = {
  id: 'boss-umbral',
  title: 'Puerta 4 · Supera el umbral: accuracy ≥ 0.85',
  difficulty: 'AVANZADO',
  xp: 220,
  statement: [
    '**BOSS FINAL · Puerta 4 de 5.** Todo el pipeline junto, y una exigencia dura: **accuracy ≥ 0.85 en el split de test**. Aquí es donde caen la mayoría.',
    'Te damos `make_boss_dataset`, `preprocess` y `build_and_train` ya resueltos. Implementa `entrenar_y_evaluar()` que ejecute el pipeline completo y devuelva `(accuracy, model)`: la accuracy **de test** como `float` y el modelo entrenado.',
    'Los hiperparámetros por defecto NO bastan (lo comprobarás: ~0.65 de accuracy). Tendrás que ajustar tú: más épocas, otro learning rate, más neuronas…',
  ].join('\n'),
  starter_code: `import numpy as np
${DATASET_PY}
${PREPROCESS_SOL}
${MLP_SOL.replace('hidden=16, lr=0.2, epochs=800', 'hidden=8, lr=0.01, epochs=100')}
def entrenar_y_evaluar():
    """
    Pipeline completo: dataset → preprocess → entrenar → accuracy de TEST.
    Devuelve (acc_float, model). OBJETIVO: acc >= 0.85.
    Los hiperparámetros por defecto de build_and_train NO llegan: ajústalos.
    """
    X, y = make_boss_dataset()
    X_train, X_test, y_train, y_test = preprocess(X, y, seed=42)
    model = build_and_train(X_train, y_train)  # ¿estos defaults llegan al 0.85?
    acc = float(np.mean(model["predict"](X_test) == y_test))
    print(f"Accuracy en test: {acc:.3f}")
    return acc, model

acc, model = entrenar_y_evaluar()
`,
  solution_code: `import numpy as np
${DATASET_PY}
${PREPROCESS_SOL}
${MLP_SOL}
def entrenar_y_evaluar():
    X, y = make_boss_dataset()
    X_train, X_test, y_train, y_test = preprocess(X, y, seed=42)
    model = build_and_train(X_train, y_train, hidden=16, lr=0.2, epochs=1500, seed=0)
    acc = float(np.mean(model["predict"](X_test) == y_test))
    print(f"Accuracy en test: {acc:.3f}")
    return acc, model
`,
  test_code: `
acc, model = entrenar_y_evaluar()
check("Devuelve (accuracy, modelo)", lambda: isinstance(acc, float) and isinstance(model, dict),
      msg="entrenar_y_evaluar debe devolver la tupla (accuracy_float, model_dict)")
check("La accuracy está en [0, 1]", lambda: 0.0 <= acc <= 1.0,
      msg=f"acc={acc}: calcula la media de aciertos sobre el split de test")
X, y = make_boss_dataset()
Xtr, Xte, ytr, yte = preprocess(X, y, seed=42)
check("La accuracy reportada coincide con el modelo devuelto", lambda: np.isclose(acc, float(np.mean(model["predict"](Xte) == yte)), atol=1e-6),
      msg="La accuracy devuelta debe calcularse con predict() sobre el split de test de preprocess(seed=42)")
check("UMBRAL SUPERADO: accuracy de test ≥ 0.85", lambda: acc >= 0.85,
      msg=f"acc={acc:.3f} < 0.85. Prueba: subir épocas (≥1000), lr≈0.1–0.3, o más neuronas ocultas")
`,
  hints: [
    'Mide primero: ejecuta y mira la accuracy con los defaults (~0.65). El modelo no está roto: está **infraentrenado**.',
    'El learning rate por defecto (0.01) es demasiado tímido para este problema: prueba $0.1$–$0.3$ y al menos 1000 épocas.',
    'Con `hidden=16, lr=0.2, epochs=1500` el test ronda 0.93. El split es determinista: si llegas a 0.85+ una vez, es estable.',
  ],
}

/* ------------------------------------------------------------------ */
/* Puerta 5 · Informe                                                  */
/* ------------------------------------------------------------------ */
const informe: Exercise = {
  id: 'boss-informe',
  title: 'Puerta 5 · Informe final',
  difficulty: 'INTERMEDIO',
  xp: 100,
  statement: [
    '**BOSS FINAL · Puerta 5 de 5.** Un modelo sin informe es un número sin historia. Cierra el proyecto documentando tu trabajo y dibujando la curva de pérdida.',
    'Implementa `informe(acc, losses)` que:',
    '1. Dibuje la **curva de pérdida** con matplotlib (`plt.plot(losses)` + título/etiquetas + `plt.show()`).',
    '2. Devuelva un `dict` con las claves `"resumen"` (qué hiciste), `"fallo"` (qué falló y cómo lo detectaste) y `"mejora"` (qué mejorarías), cada uno un párrafo real (≥ 40 caracteres), más `"accuracy"` con tu accuracy real de la Puerta 4.',
  ].join('\n'),
  starter_code: `import numpy as np
import matplotlib.pyplot as plt

def informe(acc, losses):
    """
    Dibuja la curva de pérdida y devuelve el dict del informe:
    {"resumen": str, "fallo": str, "mejora": str, "accuracy": float}
    Cada párrafo: mínimo 40 caracteres, escrito por ti.
    """
    # TODO: plt.plot(losses), título, etiquetas, plt.show()
    return {
        "resumen": "",   # qué hiciste: modelo, preprocesado, resultado
        "fallo": "",     # qué falló y cómo lo detectaste
        "mejora": "",    # qué mejorarías
        "accuracy": 0.0,
    }

# Pega aquí tu accuracy real de la Puerta 4 y una curva de ejemplo:
rep = informe(0.93, [0.69, 0.55, 0.42, 0.33, 0.28])
print(rep["accuracy"])
`,
  solution_code: `import numpy as np
import matplotlib.pyplot as plt

def informe(acc, losses):
    """Devuelve el dict del informe final y dibuja la curva de pérdida."""
    fig, ax = plt.subplots(figsize=(6, 3.5))
    ax.plot(losses, color="#22D3EE", lw=2)
    ax.set_title("Curva de pérdida — Boss Final")
    ax.set_xlabel("época"); ax.set_ylabel("BCE")
    plt.show()
    return {
        "resumen": (
            "Entrené un MLP 8→16→1 con tanh y sigmoide implementando el forward y la "
            "backpropagation a mano con NumPy, sobre datos estandarizados solo con las "
            f"estadísticas del split de train. Accuracy final en test: {acc:.1%}."
        ),
        "fallo": (
            "Con lr=0.01 y 100 épocas la red apenas superaba el 65% de accuracy: el "
            "descenso era demasiado lento y se estancaba. También descubrí que ajustar "
            "el scaler con todo el dataset es una fuga de datos que infla la métrica."
        ),
        "mejora": (
            "Probaría mini-batches con Adam en lugar de descenso a batch completo, "
            "inicialización He, regularización L2 y validación cruzada para elegir "
            "hiperparámetros sin sobreajustar el split de test."
        ),
        "accuracy": float(acc),
    }

rep = informe(0.93, [0.69, 0.55, 0.42, 0.33, 0.28])
print(rep["accuracy"])
`,
  test_code: `
acc_fake, losses_fake = 0.93, [0.69, 0.55, 0.42, 0.33, 0.28]
rep = informe(acc_fake, losses_fake)
check("Devuelve un dict con resumen, fallo, mejora y accuracy", lambda: isinstance(rep, dict) and {"resumen", "fallo", "mejora", "accuracy"} <= set(rep.keys()),
      msg="El dict debe incluir las claves: resumen, fallo, mejora, accuracy")
check("El resumen explica qué hiciste (≥ 40 caracteres)", lambda: isinstance(rep["resumen"], str) and len(rep["resumen"]) >= 40,
      msg="Escribe un párrafo real: modelo, preprocesado y resultado (mínimo 40 caracteres)")
check("El apartado 'fallo' explica qué falló (≥ 40 caracteres)", lambda: isinstance(rep["fallo"], str) and len(rep["fallo"]) >= 40,
      msg="Cuenta al menos un error real que cometiste y cómo lo detectaste (mínimo 40 caracteres)")
check("El apartado 'mejora' propone próximos pasos (≥ 40 caracteres)", lambda: isinstance(rep["mejora"], str) and len(rep["mejora"]) >= 40,
      msg="Propón mejoras concretas: optimizador, regularización, arquitectura… (mínimo 40 caracteres)")
check("La accuracy del informe coincide con la obtenida", lambda: np.isclose(rep["accuracy"], acc_fake),
      msg="Incluye la accuracy real que obtuviste en la puerta 4")
`,
  hints: [
    'La gráfica: `plt.plot(losses)`, `plt.title(...)`, `plt.xlabel("época")` y no olvides `plt.show()` para que se capture.',
    'Sé específico en "fallo": el lr demasiado bajo, la fuga de datos del scaler… los párrafos vacíos o de una línea no pasan el corte.',
    'Pasa tu accuracy real como argumento y guárdala con `float(acc)` en la clave `"accuracy"`.',
  ],
}

export const BOSS_EXERCISES: Exercise[] = [exploracion, preprocesado, modelo, umbral, informe]

registerExercises(BOSS_EXERCISES)
