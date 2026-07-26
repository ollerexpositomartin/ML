/**
 * Ejercicios del módulo Secuencias (N5a).
 * Cada solution_code pasa su propio test_code al 100% (verificado localmente).
 */
import type { Exercise } from '@/lib/exercises'
import { registerExercises } from '@/lib/exercises'

export const SECUENCIAS_EXERCISES: Exercise[] = [
  {
    id: 'secuencias-similitud-coseno',
    title: 'E1 · Similitud coseno y vecinos',
    difficulty: 'BASICO',
    xp: 20,
    statement: [
      'Los embeddings densos convierten palabras en vectores, y la forma estándar de medir lo parecidas que son es la **similitud coseno**:',
      '$$\\cos(a, b) = \\frac{a \\cdot b}{\\lVert a \\rVert \\, \\lVert b \\rVert}$$',
      '',
      'Implementa `cosine_sim(a, b)` que devuelva la similitud coseno entre dos vectores 1D (un número entre $-1$ y $1$).',
      '',
      'Después implementa `top_k(E, word_vec, k)`: dada una matriz de embeddings $E \\in \\mathbb{R}^{V \\times d}$ (cada fila es una palabra) y un vector `word_vec`, devuelve una lista con los **índices de las $k$ filas más similares**, ordenadas de mayor a menor similitud. Si una fila es exactamente igual a `word_vec` (la propia palabra), exclúyela del ranking.',
    ].join('\n'),
    starter_code: `import numpy as np

def cosine_sim(a, b):
    """Similitud coseno entre dos vectores 1D. Devuelve un float en [-1, 1]."""
    # TODO: producto punto / producto de normas
    return 0.0

def top_k(E, word_vec, k):
    """
    Índices de las k filas de E más similares a word_vec (orden descendente).
    Excluye la fila idéntica a word_vec (la propia palabra).
    E: (V, d); word_vec: (d,). Devuelve una lista de k enteros.
    """
    # TODO: calcula la similitud con cada fila, descarta la idéntica y ordena
    return list(range(k))

# Prueba rápida
E = np.array([
    [1.0, 0.0],   # 0: rey
    [0.9, 0.1],   # 1: reina
    [0.0, 1.0],   # 2: perro
    [-1.0, 0.0],  # 3: odio
])
print(cosine_sim(E[0], E[1]))          # cerca de 1
print(top_k(E, E[0], 2))               # esperado: [1, 2]
`,
    solution_code: `import numpy as np

def cosine_sim(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

def top_k(E, word_vec, k):
    E = np.asarray(E, dtype=float)
    w = np.asarray(word_vec, dtype=float)
    sims = np.array([cosine_sim(E[i], w) for i in range(E.shape[0])])
    identicas = np.all(E == w, axis=1)
    sims[identicas] = -np.inf
    orden = np.argsort(-sims, kind="stable")
    return [int(i) for i in orden[:k]]
`,
    test_code: `
_a = np.array([1.0, 0.0])
_b = np.array([0.0, 1.0])
check("Vectores ortogonales dan similitud 0", lambda: np.isclose(cosine_sim(_a, _b), 0.0),
      msg="cos((1,0),(0,1)) debe ser 0: son perpendiculares")
check("Un vector consigo mismo da similitud 1", lambda: np.isclose(cosine_sim(_a, _a), 1.0),
      msg="cos(a, a) debe ser exactamente 1")
check("Vectores opuestos dan similitud -1",
      lambda: np.isclose(cosine_sim(_a, -_a), -1.0),
      msg="cos(a, -a) debe ser -1: apuntan en direcciones opuestas")
check("La escala no importa: cos(2a, 5b) = cos(a, b)",
      lambda: np.isclose(cosine_sim(2 * _a, 5 * np.array([1.0, 1.0])),
                         cosine_sim(_a, np.array([1.0, 1.0]))),
      msg="La similitud coseno es invariante a la norma de los vectores")

_E = np.array([
    [1.0, 0.0],   # 0: rey
    [0.9, 0.1],   # 1: reina
    [0.0, 1.0],   # 2: perro
    [-1.0, 0.0],  # 3: odio
])
_res = top_k(_E, _E[0], 2)
check("top_k devuelve una lista de k índices",
      lambda: isinstance(_res, list) and len(_res) == 2,
      msg="top_k(E, v, 2) debe devolver una lista con 2 índices")
check("El vecino más cercano de 'rey' es 'reina' y se excluye la propia palabra",
      lambda: _res[0] == 1,
      msg="El índice 0 (la propia palabra) debe excluirse; el más similar es el 1")
check("El ranking completo es correcto", lambda: _res == [1, 2],
      msg=f"Se esperaba [1, 2] pero top_k devolvió {_res}")

_rng = np.random.default_rng(3)
_E2 = _rng.normal(size=(50, 8))
_v2 = _rng.normal(size=8)
_r2 = top_k(_E2, _v2, 5)
_sims2 = np.array([cosine_sim(_E2[i], _v2) for i in range(50)])
_ref2 = list(np.argsort(-_sims2, kind="stable")[:5])
check("top_k coincide con el ranking de referencia en datos aleatorios",
      lambda: _r2 == [int(i) for i in _ref2],
      msg="El orden de los vecinos no coincide con la similitud coseno de referencia")
`,
    hints: [
      'El producto punto es `np.dot(a, b)` y la norma `np.linalg.norm(a)`. La similitud coseno es su cociente.',
      'Para `top_k`, calcula un array con la similitud a cada fila y usa `np.argsort` sobre el negativo para ordenar de mayor a menor.',
      'Para excluir la propia palabra, detecta las filas idénticas con `np.all(E == word_vec, axis=1)` y asígnales similitud $-\\infty$ antes de ordenar.',
    ],
  },
  {
    id: 'secuencias-softmax-estable',
    title: 'E2 · Softmax numéricamente estable',
    difficulty: 'BASICO',
    xp: 30,
    statement: [
      'La atención (y casi todo el lenguaje) termina en una softmax que convierte puntuaciones en probabilidades:',
      '$$\\mathrm{softmax}(z)_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$$',
      '',
      'El problema: con puntuaciones como $z_i = 1000$, $e^{1000}$ desborda a `inf` en coma flotante. El truco es restar el máximo antes de exponenciar (la softmax es invariante a desplazamientos constantes):',
      '$$\\mathrm{softmax}(z)_i = \\frac{e^{z_i - m}}{\\sum_j e^{z_j - m}}, \\qquad m = \\max_j z_j$$',
      '',
      'Implementa `softmax(z, axis=-1)` estable numéricamente, que funcione con arrays 1D y 2D (normalizando a lo largo de `axis`).',
    ].join('\n'),
    starter_code: `import numpy as np

def softmax(z, axis=-1):
    """
    Softmax estable: devuelve las probabilidades a lo largo de 'axis'.
    z: array 1D o 2D. Cada fila (o el eje indicado) debe sumar 1.
    """
    # TODO: resta el máximo a lo largo de axis (con keepdims=True),
    # exponencia y normaliza
    z = np.asarray(z, dtype=float)
    return np.ones_like(z) / z.shape[axis]

# Prueba rápida
print(softmax(np.array([1.0, 2.0, 3.0])))          # debe sumar 1
print(softmax(np.array([1000.0, 1001.0, 1002.0]))) # sin overflow
`,
    solution_code: `import numpy as np

def softmax(z, axis=-1):
    z = np.asarray(z, dtype=float)
    z_shift = z - np.max(z, axis=axis, keepdims=True)
    exp_z = np.exp(z_shift)
    return exp_z / np.sum(exp_z, axis=axis, keepdims=True)
`,
    test_code: `
check("Las probabilidades suman 1 (1D)",
      lambda: np.isclose(np.sum(softmax(np.array([1.0, 2.0, 3.0]))), 1.0),
      msg="La softmax de un vector debe sumar exactamente 1")
_ref = np.exp(np.array([1.0, 2.0, 3.0]))
_ref = _ref / _ref.sum()
check("Coincide con la referencia en un vector pequeño",
      lambda: np.allclose(softmax(np.array([1.0, 2.0, 3.0])), _ref, atol=1e-10),
      msg="Los valores no coinciden con softmax([1,2,3]) de referencia")
_r = softmax(np.array([1000.0, 1001.0, 999.0]))
check("No desborda con puntuaciones de +1000",
      lambda: np.all(np.isfinite(_r)) and np.isclose(_r.sum(), 1.0),
      msg="Con z ~ 1000 aparecen inf/nan: resta el máximo antes de np.exp")
_rn = softmax(np.array([-1000.0, -1001.0, -999.0]))
check("Tampoco con valores muy negativos (sin ceros que rompan la suma)",
      lambda: np.all(np.isfinite(_rn)) and np.isclose(_rn.sum(), 1.0),
      msg="Con z ~ -1000 todo se hace 0 y la suma no es 1: resta el máximo")
_M = np.array([[1.0, 2.0, 3.0], [0.5, -1.0, 2.0]])
check("En 2D cada fila suma 1 (axis=-1)",
      lambda: np.allclose(softmax(_M, axis=-1).sum(axis=-1), np.ones(2)),
      msg="Normaliza a lo largo de 'axis', no sobre todo el array")
check("Respeta el argumento axis=0",
      lambda: np.allclose(softmax(_M, axis=0).sum(axis=0), np.ones(3)),
      msg="Con axis=0 debe normalizar por columnas")
check("Entradas iguales dan distribución uniforme",
      lambda: np.allclose(softmax(np.array([5.0, 5.0, 5.0])), np.full(3, 1 / 3)),
      msg="Si todas las puntuaciones son iguales, la softmax es uniforme")
`,
    hints: [
      'Primero calcula `m = np.max(z, axis=axis, keepdims=True)` y trabaja con `z - m`. El `keepdims=True` es esencial para que el broadcasting funcione.',
      'Después: `e = np.exp(z - m)` y devuelve `e / np.sum(e, axis=axis, keepdims=True)`.',
      'Comprueba la invarianza: `softmax(z)` y `softmax(z + 100)` deben dar el mismo resultado si tu implementación es estable.',
    ],
  },
  {
    id: 'secuencias-rnn-forward',
    title: 'E3 · Forward de una RNN',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: [
      'Una RNN procesa la secuencia paso a paso, cargando un estado oculto que actúa como memoria:',
      '$$h_t = \\tanh(W_x x_t + W_h h_{t-1} + b)$$',
      '',
      'Implementa `rnn_forward(X, Wx, Wh, b, h0)`:',
      '',
      '- `X`: matriz $(T, d_x)$ — cada fila es la entrada $x_t$ de un paso.\n- `Wx`: $(d_x, d_h)$, `Wh`: $(d_h, d_h)$, `b`: $(d_h,)$ — los **mismos pesos en todos los pasos** (weight sharing).\n- `h0`: vector $(d_h,)$ con el estado inicial.',
      '',
      'Devuelve `H` de forma $(T, d_h)$, donde la fila $t$ es $h_t$ (el estado tras procesar `X[t]`). Que los pesos se reutilicen en cada paso es la esencia de la recurrencia.',
    ].join('\n'),
    starter_code: `import numpy as np

def rnn_forward(X, Wx, Wh, b, h0):
    """
    Pase forward de una RNN: h_t = tanh(X[t] @ Wx + h_prev @ Wh + b)
    X: (T, dx); Wx: (dx, dh); Wh: (dh, dh); b: (dh,); h0: (dh,)
    Devuelve H de forma (T, dh) con todos los estados h_1..h_T.
    """
    H = []
    h_prev = h0
    # TODO: recorre la secuencia actualizando h_prev y acumulando en H
    return np.array(H)

# Prueba rápida
rng = np.random.default_rng(0)
X = rng.normal(size=(5, 3))
Wx = rng.normal(size=(3, 4)) * 0.5
Wh = rng.normal(size=(4, 4)) * 0.5
b = np.zeros(4)
h0 = np.zeros(4)
H = rnn_forward(X, Wx, Wh, b, h0)
print(H.shape)  # esperado: (5, 4)
`,
    solution_code: `import numpy as np

def rnn_forward(X, Wx, Wh, b, h0):
    H = []
    h_prev = np.asarray(h0, dtype=float)
    for t in range(X.shape[0]):
        h_prev = np.tanh(X[t] @ Wx + h_prev @ Wh + b)
        H.append(h_prev)
    return np.array(H)
`,
    test_code: `
_rng = np.random.default_rng(11)
_T, _dx, _dh = 7, 3, 5
_X = _rng.normal(size=(_T, _dx))
_Wx = _rng.normal(size=(_dx, _dh)) * 0.5
_Wh = _rng.normal(size=(_dh, _dh)) * 0.5
_b = _rng.normal(size=_dh) * 0.1
_h0 = _rng.normal(size=_dh) * 0.1

_H = rnn_forward(_X, _Wx, _Wh, _b, _h0)
check("La salida tiene forma (T, d_h)", lambda: _H.shape == (_T, _dh),
      msg=f"Se esperaba ({_T}, {_dh}) pero rnn_forward devolvió {_H.shape}")

_ref = []
_hp = _h0.copy()
for _t in range(_T):
    _hp = np.tanh(_X[_t] @ _Wx + _hp @ _Wh + _b)
    _ref.append(_hp)
_ref = np.array(_ref)
check("Los estados coinciden con la recurrencia de referencia",
      lambda: np.allclose(_H, _ref, atol=1e-10),
      msg="Algún h_t no coincide: revisa h_t = tanh(x_t @ Wx + h_prev @ Wh + b)")

check("Los estados están acotados por tanh en [-1, 1]",
      lambda: np.all(np.abs(_H) <= 1.0 + 1e-9),
      msg="Falta la activación tanh: los estados se salen de [-1, 1]")

_H0 = rnn_forward(_X, _Wx, _Wh, _b, np.zeros(_dh))
check("El estado inicial h0 influye en toda la secuencia",
      lambda: not np.allclose(_H, _H0),
      msg="Cambiar h0 no cambia la salida: ¿estás usando h0 como estado inicial?")

_X1 = _rng.normal(size=(1, _dx))
check("Funciona con secuencias de longitud 1",
      lambda: rnn_forward(_X1, _Wx, _Wh, _b, _h0).shape == (1, _dh),
      msg="Con T=1 debe devolver forma (1, d_h)")

check("El orden importa: invertir la secuencia cambia el resultado",
      lambda: not np.allclose(
          rnn_forward(_X, _Wx, _Wh, _b, _h0)[-1],
          rnn_forward(_X[::-1], _Wx, _Wh, _b, _h0)[-1]),
      msg="Una RNN es sensible al orden: procesa los pasos secuencialmente")
`,
    hints: [
      'Inicializa `h_prev = h0` y haz un bucle `for t in range(X.shape[0])`. En cada paso actualiza `h_prev` y añádelo a una lista.',
      'La actualización es `h_prev = np.tanh(X[t] @ Wx + h_prev @ Wh + b)`. Ojo: es `@` (producto matricial), no `*`.',
      'Devuelve `np.array(H)` al final: tendrá forma $(T, d_h)$ automáticamente.',
    ],
  },
  {
    id: 'secuencias-atencion-escalada',
    title: 'E4 · Atención escalada (la puerta a Transformers)',
    difficulty: 'INTERMEDIO',
    xp: 70,
    statement: [
      'Antes de saltar al siguiente nivel, implementa el mecanismo que lo cambiará todo — la **atención de producto escalar escalada**:',
      '$$\\mathrm{Attention}(Q, K, V) = \\mathrm{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}}\\right) V$$',
      '',
      'Implementa `attention(Q, K, V)` que devuelva la tupla `(output, weights)`:',
      '',
      '- `Q`: $(n, d_k)$ — consultas; `K`: $(m, d_k)$ — claves; `V`: $(m, d_v)$ — valores.\n- `weights`: matriz $(n, m)$ con la softmax por filas de $QK^{\\top}/\\sqrt{d_k}$.\n- `output`: $(n, d_v)$, igual a `weights @ V`.',
      '',
      'Usa una softmax **estable** (resta el máximo por fila). Este mismo código es el corazón del módulo de Transformers: al superarlo desbloqueas la insignia del siguiente nivel.',
    ].join('\n'),
    starter_code: `import numpy as np

def attention(Q, K, V):
    """
    Atención escalada: softmax(Q @ K.T / sqrt(d_k)) @ V
    Q: (n, dk); K: (m, dk); V: (m, dv)
    Devuelve (output, weights): (n, dv) y (n, m).
    """
    # TODO: puntuaciones, escalado, softmax estable por filas, mezcla con V
    output = np.zeros((Q.shape[0], V.shape[1]))
    weights = np.zeros((Q.shape[0], K.shape[0]))
    return output, weights

# Prueba rápida
rng = np.random.default_rng(0)
Q = rng.normal(size=(3, 4))
K = rng.normal(size=(5, 4))
V = rng.normal(size=(5, 2))
out, w = attention(Q, K, V)
print(out.shape, w.shape, w.sum(axis=1))  # (3,2) (3,5) [1 1 1]
`,
    solution_code: `import numpy as np

def attention(Q, K, V):
    Q = np.asarray(Q, dtype=float)
    K = np.asarray(K, dtype=float)
    V = np.asarray(V, dtype=float)
    d_k = Q.shape[1]
    scores = Q @ K.T / np.sqrt(d_k)
    scores = scores - scores.max(axis=1, keepdims=True)
    exp_s = np.exp(scores)
    weights = exp_s / exp_s.sum(axis=1, keepdims=True)
    output = weights @ V
    return output, weights
`,
    test_code: `
_rng = np.random.default_rng(21)
_Q = _rng.normal(size=(4, 6))
_K = _rng.normal(size=(5, 6))
_V = _rng.normal(size=(5, 3))
_out, _w = attention(_Q, _K, _V)

check("Formas correctas: output (n, d_v) y weights (n, m)",
      lambda: _out.shape == (4, 3) and _w.shape == (4, 5),
      msg=f"Se esperaba (4,3) y (4,5), llegó {_out.shape} y {_w.shape}")
check("Cada fila de weights suma 1 (es una softmax)",
      lambda: np.allclose(_w.sum(axis=1), np.ones(4)),
      msg="Los pesos de atención de cada consulta deben sumar 1")

_scores = _Q @ _K.T / np.sqrt(6)
_es = np.exp(_scores - _scores.max(axis=1, keepdims=True))
_wref = _es / _es.sum(axis=1, keepdims=True)
_oref = _wref @ _V
check("Los pesos coinciden con softmax(QKᵀ/√d_k)",
      lambda: np.allclose(_w, _wref, atol=1e-8),
      msg="Revisa el escalado por √d_k y que la softmax sea por filas (axis=1)")
check("La salida es la mezcla ponderada weights @ V",
      lambda: np.allclose(_out, _oref, atol=1e-8),
      msg="output debe ser weights @ V, nada más")

_Vid = np.eye(5)
_out_id, _w_id = attention(_Q, _K, _Vid)
check("Con V = identidad, la salida recupera exactamente los pesos",
      lambda: np.allclose(_out_id, _w_id, atol=1e-8),
      msg="Si V=I, output debe ser igual a weights: ¿mezclas con la V correcta?")

_Qbig = _Q * 100
_ob, _wb = attention(_Qbig, _K * 100, _V)
check("Es numéricamente estable con puntuaciones grandes",
      lambda: np.all(np.isfinite(_wb)) and np.allclose(_wb.sum(axis=1), 1.0),
      msg="Con entradas grandes aparece nan: usa softmax estable (resta el máximo)")
`,
    hints: [
      'Las puntuaciones son `Q @ K.T / np.sqrt(Q.shape[1])`. La división por $\\sqrt{d_k}$ evita que la softmax se sature.',
      'Softmax estable por filas: resta `scores.max(axis=1, keepdims=True)` antes de `np.exp` y normaliza con `sum(axis=1, keepdims=True)`.',
      'La salida es simplemente `weights @ V`. Devuelve la tupla `(output, weights)` en ese orden.',
    ],
  },
  {
    id: 'secuencias-celda-lstm',
    title: 'E5 · Celda LSTM desde cero',
    difficulty: 'AVANZADO',
    xp: 140,
    statement: [
      'La LSTM sustituye la recurrencia simple por un **estado de celda** $C_t$ (la cinta transportadora de memoria) controlado por tres puertas:',
      '$$f_t = \\sigma(W_f [h_{t-1}, x_t] + b_f) \\qquad i_t = \\sigma(W_i [h_{t-1}, x_t] + b_i)$$',
      '$$\\tilde{C}_t = \\tanh(W_c [h_{t-1}, x_t] + b_c) \\qquad o_t = \\sigma(W_o [h_{t-1}, x_t] + b_o)$$',
      '$$C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t \\qquad h_t = o_t \\odot \\tanh(C_t)$$',
      '',
      'donde $[h_{t-1}, x_t]$ es la **concatenación** de los dos vectores y $\\sigma$ la sigmoide. Implementa `lstm_cell(x_t, h_prev, C_prev, params)` que devuelva un diccionario con todas las cantidades intermedias:',
      '',
      "`{'f': f_t, 'i': i_t, 'C_tilde': C̃_t, 'o': o_t, 'C': C_t, 'h': h_t}`",
      '',
      '`params` es un diccionario con las claves `Wf, bf, Wi, bi, Wc, bc, Wo, bo`. Cada matriz `W` tiene forma $(d_h, d_h + d_x)$ y cada sesgo forma $(d_h,)$.',
    ].join('\n'),
    starter_code: `import numpy as np

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))

def lstm_cell(x_t, h_prev, C_prev, params):
    """
    Un paso de una celda LSTM.
    x_t: (dx,); h_prev, C_prev: (dh,)
    params: dict con Wf,bf,Wi,bi,Wc,bc,Wo,bo — W de forma (dh, dh+dx)
    Devuelve {'f','i','C_tilde','o','C','h'} (todos vectores (dh,)).
    """
    # TODO: concatena [h_prev, x_t], calcula las 3 puertas + candidato,
    # actualiza el estado de celda y el estado oculto
    return {
        'f': np.zeros_like(h_prev),
        'i': np.zeros_like(h_prev),
        'C_tilde': np.zeros_like(h_prev),
        'o': np.zeros_like(h_prev),
        'C': np.zeros_like(C_prev),
        'h': np.zeros_like(h_prev),
    }

# Prueba rápida
rng = np.random.default_rng(0)
dh, dx = 4, 3
params = {k: rng.normal(size=(dh, dh + dx)) * 0.3 for k in ['Wf', 'Wi', 'Wc', 'Wo']}
params.update({k: np.zeros(dh) for k in ['bf', 'bi', 'bc', 'bo']})
r = lstm_cell(rng.normal(size=dx), np.zeros(dh), np.zeros(dh), params)
print({k: v.shape for k, v in r.items()})
`,
    solution_code: `import numpy as np

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))

def lstm_cell(x_t, h_prev, C_prev, params):
    x_t = np.asarray(x_t, dtype=float)
    h_prev = np.asarray(h_prev, dtype=float)
    C_prev = np.asarray(C_prev, dtype=float)
    hx = np.concatenate([h_prev, x_t])
    f = sigmoid(params['Wf'] @ hx + params['bf'])
    i = sigmoid(params['Wi'] @ hx + params['bi'])
    C_tilde = np.tanh(params['Wc'] @ hx + params['bc'])
    o = sigmoid(params['Wo'] @ hx + params['bo'])
    C = f * C_prev + i * C_tilde
    h = o * np.tanh(C)
    return {'f': f, 'i': i, 'C_tilde': C_tilde, 'o': o, 'C': C, 'h': h}
`,
    test_code: `
_rng = np.random.default_rng(5)
_dh, _dx = 4, 3
_P = {k: _rng.normal(size=(_dh, _dh + _dx)) * 0.3 for k in ['Wf', 'Wi', 'Wc', 'Wo']}
_P.update({k: _rng.normal(size=_dh) * 0.1 for k in ['bf', 'bi', 'bc', 'bo']})
_x = _rng.normal(size=_dx)
_hp = _rng.normal(size=_dh) * 0.5
_Cp = _rng.normal(size=_dh) * 0.5

_hx = np.concatenate([_hp, _x])
_sig = lambda z: 1.0 / (1.0 + np.exp(-z))
_f_ref = _sig(_P['Wf'] @ _hx + _P['bf'])
_i_ref = _sig(_P['Wi'] @ _hx + _P['bi'])
_g_ref = np.tanh(_P['Wc'] @ _hx + _P['bc'])
_o_ref = _sig(_P['Wo'] @ _hx + _P['bo'])
_C_ref = _f_ref * _Cp + _i_ref * _g_ref
_h_ref = _o_ref * np.tanh(_C_ref)

_r = lstm_cell(_x, _hp, _Cp, _P)
check("Devuelve un diccionario con las 6 claves",
      lambda: isinstance(_r, dict) and all(k in _r for k in ['f', 'i', 'C_tilde', 'o', 'C', 'h']),
      msg="Debe devolver {'f','i','C_tilde','o','C','h'}")
check("Puerta de olvido f_t correcta",
      lambda: np.allclose(_r['f'], _f_ref, atol=1e-8),
      msg="La puerta de olvido f_t no coincide: revisa f = σ(Wf @ [h_prev, x_t] + bf)")
check("Puerta de entrada i_t correcta",
      lambda: np.allclose(_r['i'], _i_ref, atol=1e-8),
      msg="La puerta de entrada i_t no coincide: revisa i = σ(Wi @ [h_prev, x_t] + bi)")
check("Candidato C̃_t correcto",
      lambda: np.allclose(_r['C_tilde'], _g_ref, atol=1e-8),
      msg="El candidato no coincide: revisa C̃ = tanh(Wc @ [h_prev, x_t] + bc)")
check("Puerta de salida o_t correcta",
      lambda: np.allclose(_r['o'], _o_ref, atol=1e-8),
      msg="La puerta de salida o_t no coincide: revisa o = σ(Wo @ [h_prev, x_t] + bo)")
check("Estado de celda C_t = f⊙C_prev + i⊙C̃",
      lambda: np.allclose(_r['C'], _C_ref, atol=1e-8),
      msg="El estado de celda no coincide: C_t = f_t * C_prev + i_t * C_tilde (producto elemento a elemento)")
check("Estado oculto h_t = o⊙tanh(C_t)",
      lambda: np.allclose(_r['h'], _h_ref, atol=1e-8),
      msg="El estado oculto no coincide: h_t = o_t * tanh(C_t)")

check("Las puertas viven en (0, 1) y el candidato en (-1, 1)",
      lambda: (np.all((_r['f'] > 0) & (_r['f'] < 1))
               and np.all((_r['i'] > 0) & (_r['i'] < 1))
               and np.all((_r['o'] > 0) & (_r['o'] < 1))
               and np.all(np.abs(_r['C_tilde']) < 1)),
      msg="Las puertas usan sigmoide σ (rango 0-1); solo el candidato usa tanh")

_Pf1 = dict(_P); _Pf1['bf'] = np.full(_dh, 50.0)
_Pi0 = dict(_Pf1); _Pi0['bi'] = np.full(_dh, -50.0)
_r2 = lstm_cell(_x, _hp, _Cp, _Pi0)
check("Con f≈1 e i≈0 la memoria se conserva: C_t ≈ C_prev",
      lambda: np.allclose(_r2['C'], _Cp, atol=1e-4),
      msg="Si la puerta de olvido está abierta (f≈1) y la de entrada cerrada (i≈0), C_t debe conservar C_prev")
`,
    hints: [
      'Concatena primero: `hx = np.concatenate([h_prev, x_t])`. Cada puerta es `sigmoid(W @ hx + b)` con su propia W.',
      'Las puertas `f, i, o` usan **sigmoide**; el candidato `C_tilde` usa **tanh**. No los confundas.',
      'El estado de celda es `C = f * C_prev + i * C_tilde` (producto **elemento a elemento**, `*`, no `@`) y `h = o * np.tanh(C)`.',
    ],
  },
  {
    id: 'secuencias-sales-windows',
    title: 'P1 · Ventanas, split temporal y normalización',
    difficulty: 'BASICO',
    xp: 50,
    statement: [
      'Trabajas como data scientist en una cadena de tiendas y te encargan predecir **las ventas de mañana** para planificar stock y personal. La función `make_sales()` (dada) genera dos años de ventas diarias realistas: tendencia creciente suave, estacionalidad semanal (el fin de semana se vende más), campaña de Navidad y ruido.',
      '',
      'El primer paso de cualquier pipeline de forecasting es convertir la serie en un **dataset supervisado**. Implementa tres piezas:',
      '',
      '- `make_windows(series, window)` — ventanas deslizantes: `X[i] = series[i:i+window]` (los 14 días previos) e `y[i] = series[i+window]` (el día siguiente).\n- `temporal_split(X, y, train_frac=0.8)` — los primeros ejemplos para train y los últimos para test, **sin barajar**. En series temporales un split aleatorio es trampa: el modelo vería el futuro para predecir el pasado.\n- `normalize_by_train(X_train, y_train, X_test, y_test)` — divide todo entre **la media de train** y devuelve `(X_train_n, y_train_n, X_test_n, y_test_n, scale)`. Si usaras la media de toda la serie cometerías *data leakage*: colarías información del futuro dentro del preprocesado.',
      '',
      'Estas dos reglas — split temporal y estadísticas calculadas solo con train — son las que separan un modelo de laboratorio de uno que sobrevive en producción.',
    ].join('\n'),
    starter_code: `import numpy as np

def make_sales(seed=7):
    """Ventas diarias de una tienda durante 2 años (730 días)."""
    rng = np.random.default_rng(seed)
    n = 730
    t = np.arange(n)
    base = 120.0
    trend = 0.045 * t                      # sube ~33 unidades en 2 años
    semana = np.array([0.0, -5.0, -8.0, -3.0, 5.0, 24.0, 14.0])
    weekly = semana[t % 7]                 # el fin de semana vende más
    christmas = np.zeros(n)
    for year_start in (0, 365):
        dec = np.arange(334, 365)          # diciembre
        g = np.exp(-0.5 * ((np.arange(len(dec)) - 20.0) / 8.0) ** 2)
        christmas[year_start + dec] = 45.0 * g
    noise = rng.normal(0.0, 4.0, n)
    return np.maximum(base + trend + weekly + christmas + noise, 5.0)

def make_windows(series, window):
    """
    Dataset supervisado con ventanas deslizantes.
    series: (n,) -> X: (n - window, window) con X[i] = series[i:i+window]
                    y: (n - window,)    con y[i] = series[i+window]
    """
    # TODO: apila las ventanas con np.stack y construye y
    return np.zeros((0, window)), np.zeros(0)

def temporal_split(X, y, train_frac=0.8):
    """
    Split TEMPORAL (sin barajar): los primeros int(n * train_frac) ejemplos
    son train, el resto test. Devuelve (X_train, y_train, X_test, y_test).
    """
    # TODO: un único corte en n_train
    return X, y, X, y

def normalize_by_train(X_train, y_train, X_test, y_test):
    """
    Divide TODOS los arrays entre la media de X_train.
    Devuelve (X_train_n, y_train_n, X_test_n, y_test_n, scale).
    Ojo con el data leakage: la media se calcula SOLO con train.
    """
    # TODO
    return X_train, y_train, X_test, y_test, 1.0

# Prueba rápida
sales = make_sales()
X, y = make_windows(sales, 14)
Xtr, ytr, Xte, yte = temporal_split(X, y)
Xtr_n, ytr_n, Xte_n, yte_n, scale = normalize_by_train(Xtr, ytr, Xte, yte)
print(X.shape, Xtr.shape, Xte.shape, round(scale, 2))
`,
    solution_code: `import numpy as np

def make_sales(seed=7):
    """Ventas diarias de una tienda durante 2 años (730 días)."""
    rng = np.random.default_rng(seed)
    n = 730
    t = np.arange(n)
    base = 120.0
    trend = 0.045 * t
    semana = np.array([0.0, -5.0, -8.0, -3.0, 5.0, 24.0, 14.0])
    weekly = semana[t % 7]
    christmas = np.zeros(n)
    for year_start in (0, 365):
        dec = np.arange(334, 365)
        g = np.exp(-0.5 * ((np.arange(len(dec)) - 20.0) / 8.0) ** 2)
        christmas[year_start + dec] = 45.0 * g
    noise = rng.normal(0.0, 4.0, n)
    return np.maximum(base + trend + weekly + christmas + noise, 5.0)

def make_windows(series, window):
    series = np.asarray(series, dtype=float)
    n = series.shape[0]
    X = np.stack([series[i:i + window] for i in range(n - window)])
    y = series[window:]
    return X, y

def temporal_split(X, y, train_frac=0.8):
    n_train = int(X.shape[0] * train_frac)
    return X[:n_train], y[:n_train], X[n_train:], y[n_train:]

def normalize_by_train(X_train, y_train, X_test, y_test):
    scale = float(np.mean(X_train))
    return X_train / scale, y_train / scale, X_test / scale, y_test / scale, scale

# Prueba rápida
sales = make_sales()
X, y = make_windows(sales, 14)
Xtr, ytr, Xte, yte = temporal_split(X, y)
Xtr_n, ytr_n, Xte_n, yte_n, scale = normalize_by_train(Xtr, ytr, Xte, yte)
print(X.shape, Xtr.shape, Xte.shape, round(scale, 2))
`,
    test_code: `
_sales = make_sales(7)
_X, _y = make_windows(_sales, 14)
check("Formas del dataset: X (n - window, window) e y (n - window,)",
      lambda: _X.shape == (716, 14) and _y.shape == (716,),
      msg=f"Se esperaba (716, 14) y (716,), llegaron {_X.shape} y {_y.shape}")
check("X[i] son los 14 días previos e y[i] es el día siguiente",
      lambda: np.allclose(_X[0], _sales[:14]) and np.isclose(_y[0], _sales[14])
              and np.allclose(_X[100], _sales[100:114]) and np.isclose(_y[-1], _sales[-1]),
      msg="X[i] debe ser series[i:i+window] e y[i] = series[i+window]")
check("Las ventanas se desplazan de un día en un día",
      lambda: np.allclose(_X[1, :-1], _X[0, 1:]),
      msg="Ventanas deslizantes: X[i+1] es X[i] movida un día hacia el futuro")

_Xtr, _ytr, _Xte, _yte = temporal_split(_X, _y)
_ntr = int(716 * 0.8)
check("El split respeta la proporción 80/20",
      lambda: _Xtr.shape == (_ntr, 14) and _Xte.shape == (716 - _ntr, 14),
      msg=f"Train debe tener {_ntr} ejemplos y test {716 - _ntr}")
check("Es un split TEMPORAL: train son los primeros ejemplos y test los últimos",
      lambda: np.allclose(_Xtr[-1], _X[_ntr - 1]) and np.allclose(_Xte[0], _X[_ntr]),
      msg="En series temporales NO se baraja: el futuro no puede filtrarse al pasado")
check("Ningún ejemplo de test es anterior a uno de train",
      lambda: np.allclose(_ytr, _y[:_ntr]) and np.allclose(_yte, _y[_ntr:]),
      msg="Train = prefijo temporal, test = sufijo temporal, sin mezclar")

_Xtrn, _ytrn, _Xten, _yten, _scale = normalize_by_train(_Xtr, _ytr, _Xte, _yte)
check("La escala es la media de train (y solo de train)",
      lambda: np.isclose(_scale, _Xtr.mean()),
      msg="La normalización debe usar únicamente la media del conjunto de train")
check("Sin data leakage: la escala NO es la media de toda la serie",
      lambda: abs(_scale - _X.mean()) > 3.0,
      msg="Si usas la media global estás colando información del futuro en train")
check("Tras normalizar, train tiene media ~1",
      lambda: np.isclose(_Xtrn.mean(), 1.0, atol=1e-8),
      msg="Al dividir entre la media de train, X_train normalizado debe tener media 1")
check("El test se normaliza con la MISMA escala calculada en train",
      lambda: np.allclose(_Xten, _Xte / _Xtr.mean()) and np.allclose(_yten, _yte / _Xtr.mean()),
      msg="Test se divide entre la media de train, nunca entre su propia media")
`,
    hints: [
      'Para `make_windows`, apila `[series[i:i+window] for i in range(n - window)]` con `np.stack`; los objetivos son simplemente `y = series[window:]`.',
      'El split temporal es un único corte: `n_train = int(len(X) * train_frac)`; train es `[:n_train]` y test `[n_train:]`. Nada de barajar.',
      'La escala es `float(X_train.mean())`; divide los cuatro arrays entre ella. Si el test se normalizara con su propia media, habría leakage.',
    ],
  },
  {
    id: 'secuencias-sales-rnn',
    title: 'P2 · Entrena una RNN para forecasting',
    difficulty: 'AVANZADO',
    xp: 130,
    statement: [
      'El plato fuerte del proyecto: entrenar una **RNN mínima** que prediga las ventas de mañana a partir de los últimos 14 días. Los datos ya vienen preparados con el pipeline del ejercicio anterior (ventanas, split temporal, normalización por train):',
      '',
      '$$h_t = \\tanh(W_x x_t + W_h h_{t-1} + b), \\qquad \\hat{y} = W_y h_T + b_y$$',
      '',
      'Implementa `train_rnn(X_train, y_train, hidden=12, epochs=3000, lr=0.05, seed=0)` — descenso de gradiente con batch completo, pérdida MSE y **BPTT** a través de los 14 pasos — y `rnn_predict(model, X)` que devuelva un array `(N,)`. Notas de oficio:',
      '',
      '- Guarda **todos** los estados `hs` en el forward: los necesitas en el backward.\n- La derivada de $\\tanh$ es $1 - h^2$; el gradiente llega a $h_T$ desde la pérdida y viaja hacia atrás paso a paso acumulando en `dWx`, `dWh` y `db`.\n- **Gradient clipping** (recorta a $[-2, 2]$) evita que una época desastrosa arruine los pesos.',
      '',
      '**Objetivo profesional**: batir al *baseline naive* (predecir lo de ayer) en al menos un 20% de RMSE y lograr un MAPE ≤ 15% en test. Un modelo que no supera al baseline trivial no se despliega.',
    ].join('\n'),
    starter_code: `import numpy as np

def make_sales(seed=7):
    """Ventas diarias de una tienda durante 2 años (730 días)."""
    rng = np.random.default_rng(seed)
    n = 730
    t = np.arange(n)
    base = 120.0
    trend = 0.045 * t
    semana = np.array([0.0, -5.0, -8.0, -3.0, 5.0, 24.0, 14.0])
    weekly = semana[t % 7]
    christmas = np.zeros(n)
    for year_start in (0, 365):
        dec = np.arange(334, 365)
        g = np.exp(-0.5 * ((np.arange(len(dec)) - 20.0) / 8.0) ** 2)
        christmas[year_start + dec] = 45.0 * g
    noise = rng.normal(0.0, 4.0, n)
    return np.maximum(base + trend + weekly + christmas + noise, 5.0)

# --- Datos: ventanas de 14 días, split temporal 80/20, normalización por train ---
WINDOW = 14
sales = make_sales()
n = len(sales) - WINDOW
X = np.stack([sales[i:i + WINDOW] for i in range(n)])
y = sales[WINDOW:]
n_train = int(n * 0.8)
scale = X[:n_train].mean()                      # solo train: nada de leakage
X_train = (X[:n_train] / scale)[:, :, None]     # (N, 14, 1)
y_train = (y[:n_train] / scale)[:, None]        # (N, 1)
X_test = (X[n_train:] / scale)[:, :, None]
y_test = y[n_train:]                            # en unidades reales

HIDDEN = 12

def train_rnn(X_train, y_train, hidden=HIDDEN, epochs=3000, lr=0.05, seed=0):
    """
    RNN mínima: h_t = tanh(x_t @ Wx + h_{t-1} @ Wh + b);  y_hat = h_T @ Wy + by
    Devuelve la tupla (Wx, Wh, b, Wy, by) tras entrenar con MSE + BPTT.
    """
    rng = np.random.default_rng(seed)
    Wx = rng.normal(0, 0.5, size=(1, hidden))
    Wh = rng.normal(0, 0.5, size=(hidden, hidden))
    b = np.zeros(hidden)
    Wy = rng.normal(0, 0.5, size=(hidden, 1))
    by = np.zeros(1)
    N, T, _ = X_train.shape
    for ep in range(epochs):
        # TODO forward: recorre los T pasos guardando hs de forma (T+1, N, hidden)
        # TODO pérdida MSE entre y_hat = hs[T] @ Wy + by e y_train
        # TODO backward: BPTT desde h_T hacia h_1 acumulando dWx, dWh, db, dWy, dby
        # TODO gradient clipping a [-2, 2] y actualización SGD de los 5 parámetros
        pass
    return Wx, Wh, b, Wy, by

def rnn_predict(model, X):
    """Predicción (N,) en las mismas unidades (normalizadas) que X."""
    Wx, Wh, b, Wy, by = model
    # TODO: forward completo y devuelve (h_T @ Wy + by).ravel()
    return np.zeros(X.shape[0])

# Entrenamiento (puede tardar medio minuto en el navegador)
model = train_rnn(X_train, y_train)
pred_test = rnn_predict(model, X_test) * scale
naive = X[n_train:, -1]                          # baseline: predecir lo de ayer
rmse = lambda a, b: float(np.sqrt(np.mean((a - b) ** 2)))
print("RMSE modelo:", round(rmse(y_test, pred_test), 2))
print("RMSE naive :", round(rmse(y_test, naive), 2))
`,
    solution_code: `import numpy as np

def make_sales(seed=7):
    """Ventas diarias de una tienda durante 2 años (730 días)."""
    rng = np.random.default_rng(seed)
    n = 730
    t = np.arange(n)
    base = 120.0
    trend = 0.045 * t
    semana = np.array([0.0, -5.0, -8.0, -3.0, 5.0, 24.0, 14.0])
    weekly = semana[t % 7]
    christmas = np.zeros(n)
    for year_start in (0, 365):
        dec = np.arange(334, 365)
        g = np.exp(-0.5 * ((np.arange(len(dec)) - 20.0) / 8.0) ** 2)
        christmas[year_start + dec] = 45.0 * g
    noise = rng.normal(0.0, 4.0, n)
    return np.maximum(base + trend + weekly + christmas + noise, 5.0)

# --- Datos: ventanas de 14 días, split temporal 80/20, normalización por train ---
WINDOW = 14
sales = make_sales()
n = len(sales) - WINDOW
X = np.stack([sales[i:i + WINDOW] for i in range(n)])
y = sales[WINDOW:]
n_train = int(n * 0.8)
scale = X[:n_train].mean()                      # solo train: nada de leakage
X_train = (X[:n_train] / scale)[:, :, None]     # (N, 14, 1)
y_train = (y[:n_train] / scale)[:, None]        # (N, 1)
X_test = (X[n_train:] / scale)[:, :, None]
y_test = y[n_train:]                            # en unidades reales

HIDDEN = 12

def train_rnn(X_train, y_train, hidden=HIDDEN, epochs=3000, lr=0.05, seed=0):
    rng = np.random.default_rng(seed)
    Wx = rng.normal(0, 0.5, size=(1, hidden))
    Wh = rng.normal(0, 0.5, size=(hidden, hidden))
    b = np.zeros(hidden)
    Wy = rng.normal(0, 0.5, size=(hidden, 1))
    by = np.zeros(1)
    N, T, _ = X_train.shape
    for ep in range(epochs):
        # forward: guarda todos los estados
        hs = np.zeros((T + 1, N, hidden))
        for t in range(T):
            hs[t + 1] = np.tanh(X_train[:, t, :] @ Wx + hs[t] @ Wh + b)
        y_hat = hs[T] @ Wy + by
        err = y_hat - y_train
        loss = float(np.mean(err ** 2))
        # backward: BPTT desde h_T hacia h_1
        dWx = np.zeros_like(Wx)
        dWh = np.zeros_like(Wh)
        db = np.zeros_like(b)
        dWy = hs[T].T @ (2.0 * err / N)
        dby = (2.0 * err / N).sum(axis=0)
        dh = (2.0 * err / N) @ Wy.T
        for t in range(T - 1, -1, -1):
            dz = dh * (1.0 - hs[t + 1] ** 2)      # derivada de tanh
            dWx += X_train[:, t, :].T @ dz
            dWh += hs[t].T @ dz
            db += dz.sum(axis=0)
            dh = dz @ Wh.T
        for g in (dWx, dWh, db, dWy, dby):
            np.clip(g, -2.0, 2.0, out=g)          # gradient clipping
        Wx -= lr * dWx
        Wh -= lr * dWh
        b -= lr * db
        Wy -= lr * dWy
        by -= lr * dby
    return Wx, Wh, b, Wy, by

def rnn_predict(model, X):
    Wx, Wh, b, Wy, by = model
    N, T, _ = X.shape
    h = np.zeros((N, Wx.shape[1]))
    for t in range(T):
        h = np.tanh(X[:, t, :] @ Wx + h @ Wh + b)
    return (h @ Wy + by).ravel()

# Entrenamiento (tarda unos segundos)
model = train_rnn(X_train, y_train)
pred_test = rnn_predict(model, X_test) * scale
naive = X[n_train:, -1]                          # baseline: predecir lo de ayer
rmse = lambda a, b: float(np.sqrt(np.mean((a - b) ** 2)))
print("RMSE modelo:", round(rmse(y_test, pred_test), 2))
print("RMSE naive :", round(rmse(y_test, naive), 2))
`,
    test_code: `
_pred = np.asarray(rnn_predict(model, X_test), dtype=float) * scale
check("rnn_predict devuelve una predicción por ejemplo de test, finita",
      lambda: _pred.shape == (y_test.shape[0],) and np.all(np.isfinite(_pred)),
      msg="Debe devolver un array (N,) con una predicción por ventana de test")

_naive = X[n_train:, -1]
_rmse = lambda a, b: float(np.sqrt(np.mean((a - b) ** 2)))
_rmse_model = _rmse(y_test, _pred)
_rmse_naive = _rmse(y_test, _naive)
_mape = float(np.mean(np.abs((y_test - _pred) / y_test)) * 100.0)

check("El modelo bate al baseline naive (predecir lo de ayer) en al menos un 20% de RMSE",
      lambda: _rmse_model <= 0.80 * _rmse_naive,
      msg=f"RMSE modelo {_rmse_model:.2f} vs naive {_rmse_naive:.2f}: falta aprender la estacionalidad semanal (revisa BPTT, épocas y lr)")
check("MAPE en test ≤ 15% (error porcentual medio)",
      lambda: _mape <= 15.0,
      msg=f"MAPE {_mape:.2f}%: el error relativo es demasiado alto")
check("El modelo aprende de verdad: supera a predecir siempre la media de train",
      lambda: _rmse_model < _rmse(y_test, np.full_like(y_test, y[:n_train].mean())),
      msg="Peor que predecir la media: el entrenamiento no está convergiendo")
check("Las predicciones son positivas y de magnitud realista (50-250 unidades)",
      lambda: np.all(_pred > 50.0) and np.all(_pred < 250.0),
      msg="Predicciones fuera de rango: ¿desnormalizaste multiplicando por scale?")
`,
    hints: [
      'Forward: `hs = np.zeros((T+1, N, hidden))` y en el bucle `hs[t+1] = np.tanh(X_train[:, t, :] @ Wx + hs[t] @ Wh + b)`. La predicción es `hs[T] @ Wy + by`.',
      'Backward: con `err = y_hat - y_train`, el gradiente que llega a $h_T$ es `(2*err/N) @ Wy.T`; en cada paso `dz = dh * (1 - hs[t+1]**2)`, acumula `dWx += X_train[:,t,:].T @ dz`, `dWh += hs[t].T @ dz`, `db += dz.sum(axis=0)` y propaga `dh = dz @ Wh.T`.',
      'Recorta todos los gradientes con `np.clip(g, -2, 2, out=g)` antes de restar `lr * g`. Con 3000 épocas y lr 0.05 deberías bajar de RMSE 8 frente a ~11.6 del naive.',
    ],
  },
  {
    id: 'secuencias-sales-horizon',
    title: 'P3 · Horizonte múltiple recursivo',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: [
      'Predecir un día es útil; predecir **una semana entera** es lo que necesita el departamento de compras. La estrategia estándar es la **predicción recursiva**: la predicción de mañana se usa como entrada para predecir pasado mañana, y así sucesivamente. El precio: los errores se acumulan y el error crece con el horizonte.',
      '',
      'Te damos un modelo ya ajustado — `predict_next`, una regresión lineal sobre la ventana por mínimos cuadrados. Implementa:',
      '',
      '- `recursive_forecast(history_n, horizon, predict_fn)` — devuelve un array `(horizon,)` donde cada predicción se **realimenta** al historial antes de predecir el siguiente día.\n- `seasonal_forecast(history_n, horizon)` — el *baseline estacional semanal*: para cada día futuro, el valor de hace 7 días (`history[-7:][:horizon]`).',
      '',
      'El test evalúa ambos sobre el conjunto de test y comprueba la lección profesional: el modelo gana al baseline estacional **en horizonte corto** (días 1–3), pero su error **se degrada con el horizonte** (el día 7 es peor que el día 1). Medir el error *por horizonte* — no solo global — es la práctica estándar en forecasting real.',
    ].join('\n'),
    starter_code: `import numpy as np

def make_sales(seed=7):
    """Ventas diarias de una tienda durante 2 años (730 días)."""
    rng = np.random.default_rng(seed)
    n = 730
    t = np.arange(n)
    base = 120.0
    trend = 0.045 * t
    semana = np.array([0.0, -5.0, -8.0, -3.0, 5.0, 24.0, 14.0])
    weekly = semana[t % 7]
    christmas = np.zeros(n)
    for year_start in (0, 365):
        dec = np.arange(334, 365)
        g = np.exp(-0.5 * ((np.arange(len(dec)) - 20.0) / 8.0) ** 2)
        christmas[year_start + dec] = 45.0 * g
    noise = rng.normal(0.0, 4.0, n)
    return np.maximum(base + trend + weekly + christmas + noise, 5.0)

# --- Datos: ventanas de 14 días, split temporal, normalización por train ---
WINDOW = 14
sales = make_sales()
n = len(sales) - WINDOW
X = np.stack([sales[i:i + WINDOW] for i in range(n)])
y = sales[WINDOW:]
n_train = int(n * 0.8)
scale = X[:n_train].mean()
X_train_n = X[:n_train] / scale
y_train_n = y[:n_train] / scale
X_test = X[n_train:]
y_test = y[n_train:]

# --- Modelo dado: regresión lineal sobre la ventana (mínimos cuadrados) ---
_phi = np.concatenate([X_train_n, np.ones((X_train_n.shape[0], 1))], axis=1)
_coef = np.linalg.lstsq(_phi, y_train_n, rcond=None)[0]

def predict_next(window_n):
    """Predice el día siguiente (normalizado) dada una ventana de 14 días."""
    return float(np.asarray(window_n, dtype=float) @ _coef[:-1] + _coef[-1])

def recursive_forecast(history_n, horizon, predict_fn):
    """
    Predice los próximos "horizon" días de forma RECURSIVA: cada predicción
    se añade al historial y se usa como entrada de la siguiente.
    history_n: ventana inicial (14,) normalizada.
    Devuelve un array (horizon,) en unidades normalizadas.
    """
    # TODO: bucle que predice, añade al historial y repite
    return np.zeros(horizon)

def seasonal_forecast(history_n, horizon):
    """
    Baseline estacional semanal: para el día futuro i, el valor de hace
    7 días. Con horizon <= 7 basta una rebanada del historial.
    """
    # TODO
    return np.zeros(horizon)

# Prueba rápida
h0 = X_test[0] / scale
print("modelo    :", np.round(recursive_forecast(h0, 7, predict_next), 3))
print("estacional:", np.round(seasonal_forecast(h0, 7), 3))
`,
    solution_code: `import numpy as np

def make_sales(seed=7):
    """Ventas diarias de una tienda durante 2 años (730 días)."""
    rng = np.random.default_rng(seed)
    n = 730
    t = np.arange(n)
    base = 120.0
    trend = 0.045 * t
    semana = np.array([0.0, -5.0, -8.0, -3.0, 5.0, 24.0, 14.0])
    weekly = semana[t % 7]
    christmas = np.zeros(n)
    for year_start in (0, 365):
        dec = np.arange(334, 365)
        g = np.exp(-0.5 * ((np.arange(len(dec)) - 20.0) / 8.0) ** 2)
        christmas[year_start + dec] = 45.0 * g
    noise = rng.normal(0.0, 4.0, n)
    return np.maximum(base + trend + weekly + christmas + noise, 5.0)

# --- Datos: ventanas de 14 días, split temporal, normalización por train ---
WINDOW = 14
sales = make_sales()
n = len(sales) - WINDOW
X = np.stack([sales[i:i + WINDOW] for i in range(n)])
y = sales[WINDOW:]
n_train = int(n * 0.8)
scale = X[:n_train].mean()
X_train_n = X[:n_train] / scale
y_train_n = y[:n_train] / scale
X_test = X[n_train:]
y_test = y[n_train:]

# --- Modelo dado: regresión lineal sobre la ventana (mínimos cuadrados) ---
_phi = np.concatenate([X_train_n, np.ones((X_train_n.shape[0], 1))], axis=1)
_coef = np.linalg.lstsq(_phi, y_train_n, rcond=None)[0]

def predict_next(window_n):
    """Predice el día siguiente (normalizado) dada una ventana de 14 días."""
    return float(np.asarray(window_n, dtype=float) @ _coef[:-1] + _coef[-1])

def recursive_forecast(history_n, horizon, predict_fn):
    history = list(np.asarray(history_n, dtype=float))
    out = []
    for _ in range(horizon):
        p = predict_fn(np.array(history[-WINDOW:]))
        out.append(p)
        history.append(p)
    return np.array(out)

def seasonal_forecast(history_n, horizon):
    history = np.asarray(history_n, dtype=float)
    return history[-7:][:horizon].copy()

# Prueba rápida
h0 = X_test[0] / scale
print("modelo    :", np.round(recursive_forecast(h0, 7, predict_next), 3))
print("estacional:", np.round(seasonal_forecast(h0, 7), 3))
`,
    test_code: `
# corrección del bucle recursivo con un predictor ficticio y determinista
_fake = lambda w: 0.5 * w[-1] + 1.0
_hist = np.arange(1.0, 15.0)
_ref = []
_h = list(_hist)
for _ in range(7):
    _p = _fake(np.array(_h[-14:]))
    _ref.append(_p)
    _h.append(_p)
_fc = recursive_forecast(_hist, 7, _fake)
check("recursive_forecast devuelve un array (horizon,)",
      lambda: np.asarray(_fc).shape == (7,),
      msg=f"Se esperaba forma (7,), llegó {np.asarray(_fc).shape}")
check("Cada predicción se realimenta al historial (coincide con la referencia)",
      lambda: np.allclose(_fc, np.array(_ref), atol=1e-10),
      msg="Tras predecir, añade la predicción al historial antes del siguiente paso")
check("También funciona con horizonte 1",
      lambda: np.allclose(recursive_forecast(_hist, 1, _fake), np.array([_ref[0]]), atol=1e-10),
      msg="Con horizon=1 debe devolver un array con una única predicción")

_seas = seasonal_forecast(np.arange(1.0, 15.0), 7)
check("El baseline estacional repite exactamente la última semana",
      lambda: np.allclose(_seas, np.arange(8.0, 15.0)),
      msg="Para un horizonte de 7 días, el baseline son los últimos 7 valores del historial")
check("Funciona con horizontes menores que 7 (mismo día de la semana pasada)",
      lambda: np.allclose(seasonal_forecast(np.arange(1.0, 15.0), 3), np.arange(8.0, 11.0)),
      msg="El día futuro i corresponde al valor de hace 7 días: history[-7:][:horizon]")

# evaluación real por horizonte sobre el conjunto de test
_H = 7
_e_model = [[] for _ in range(_H)]
_e_seas = [[] for _ in range(_H)]
for _i in range(len(y_test) - _H):
    _hist_i = X_test[_i] / scale
    _fut = y_test[_i:_i + _H]
    _fm = recursive_forecast(_hist_i, _H, predict_next) * scale
    _fs = seasonal_forecast(_hist_i, _H) * scale
    for _hh in range(_H):
        _e_model[_hh].append((_fm[_hh] - _fut[_hh]) ** 2)
        _e_seas[_hh].append((_fs[_hh] - _fut[_hh]) ** 2)
_rm = [float(np.sqrt(np.mean(e))) for e in _e_model]
_rs = [float(np.sqrt(np.mean(e))) for e in _e_seas]

check("A un día vista, el modelo bate al baseline estacional semanal",
      lambda: _rm[0] < 0.95 * _rs[0],
      msg=f"RMSE día 1: modelo {_rm[0]:.2f} vs estacional {_rs[0]:.2f}")
check("El error se degrada con el horizonte: el día 7 es peor que el día 1",
      lambda: _rm[6] > _rm[0],
      msg=f"RMSE día 1 {_rm[0]:.2f} vs día 7 {_rm[6]:.2f}: al realimentar predicciones, los errores se acumulan")
check("En horizonte corto (días 1-3) el modelo gana al estacional de media",
      lambda: float(np.mean(_rm[:3])) < float(np.mean(_rs[:3])),
      msg=f"Media días 1-3: modelo {np.mean(_rm[:3]):.2f} vs estacional {np.mean(_rs[:3]):.2f}")
`,
    hints: [
      'En `recursive_forecast`, convierte el historial a lista, predice con `predict_fn(np.array(history[-14:]))`, añade la predicción a la lista y repite.',
      'El baseline estacional es una rebanada: `history[-7:][:horizon]` — para el día futuro $i$ usas el valor de hace 7 días.',
      'Para evaluar por horizonte, acumula el error cuadrático de cada día (1..7) por separado sobre todas las ventanas de test y saca el RMSE de cada columna.',
    ],
  },
]

registerExercises(SECUENCIAS_EXERCISES)
