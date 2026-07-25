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
]

registerExercises(SECUENCIAS_EXERCISES)
