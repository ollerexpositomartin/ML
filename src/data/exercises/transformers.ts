/**
 * Ejercicios del módulo Transformers (N5b).
 * Cada solution_code pasa su propio test_code al 100% (verificado localmente).
 */
import type { Exercise } from '@/lib/exercises'
import { registerExercises } from '@/lib/exercises'

export const TRANSFORMERS_EXERCISES: Exercise[] = [
  {
    id: 'transformers-atencion-escalada',
    title: 'E1 · Atención escalada completa (con máscara)',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: [
      'El corazón del Transformer, ahora en su versión completa — con **máscara aditiva opcional**:',
      '$$\\mathrm{Attention}(Q, K, V, M) = \\mathrm{softmax}\\!\\left(\\frac{Q K^{\\top}}{\\sqrt{d_k}} + M\\right) V$$',
      '',
      'Implementa `scaled_attention(Q, K, V, mask=None)` que devuelva `(output, weights)`:',
      '',
      '- `Q`: $(n, d_k)$, `K`: $(m, d_k)$, `V`: $(m, d_v)$.\n- `mask`: `None` o una matriz $(n, m)$ que se **suma** a las puntuaciones antes de la softmax (típicamente $0$ donde se permite mirar y $-\\infty$ donde no).\n- `weights`: $(n, m)$, softmax estable por filas; `output`: $(n, d_v)$.',
      '',
      'La máscara es el mecanismo que convierte la misma fórmula en atención bidireccional (BERT, `mask=None`) o causal (GPT, máscara triangular).',
    ].join('\n'),
    starter_code: `import numpy as np

def scaled_attention(Q, K, V, mask=None):
    """
    Atención escalada con máscara aditiva opcional.
    Q: (n, dk); K: (m, dk); V: (m, dv); mask: None o (n, m) con 0 / -inf.
    Devuelve (output, weights): (n, dv) y (n, m).
    """
    # TODO: puntuaciones escaladas (+ máscara si existe), softmax estable,
    # mezcla con V
    output = np.zeros((Q.shape[0], V.shape[1]))
    weights = np.zeros((Q.shape[0], K.shape[0]))
    return output, weights

# Prueba rápida
rng = np.random.default_rng(0)
Q = rng.normal(size=(3, 4)); K = rng.normal(size=(3, 4)); V = rng.normal(size=(3, 2))
M = np.triu(np.full((3, 3), -np.inf), k=1)  # máscara causal
out, w = scaled_attention(Q, K, V, mask=M)
print(w.round(3))  # triangular inferior: ceros sobre la diagonal
`,
    solution_code: `import numpy as np

def scaled_attention(Q, K, V, mask=None):
    Q = np.asarray(Q, dtype=float)
    K = np.asarray(K, dtype=float)
    V = np.asarray(V, dtype=float)
    d_k = Q.shape[1]
    scores = Q @ K.T / np.sqrt(d_k)
    if mask is not None:
        scores = scores + mask
    scores = scores - scores.max(axis=1, keepdims=True)
    exp_s = np.exp(scores)
    weights = exp_s / exp_s.sum(axis=1, keepdims=True)
    output = weights @ V
    return output, weights
`,
    test_code: `
_rng = np.random.default_rng(31)
_Q = _rng.normal(size=(4, 6))
_K = _rng.normal(size=(5, 6))
_V = _rng.normal(size=(5, 3))

_out, _w = scaled_attention(_Q, _K, _V)
_s = _Q @ _K.T / np.sqrt(6)
_e = np.exp(_s - _s.max(axis=1, keepdims=True))
_wref = _e / _e.sum(axis=1, keepdims=True)
check("Sin máscara coincide con la referencia",
      lambda: np.allclose(_w, _wref, atol=1e-8) and np.allclose(_out, _wref @ _V, atol=1e-8),
      msg="Revisa softmax(QKᵀ/√d_k) por filas y output = weights @ V")
check("Las filas de weights suman 1",
      lambda: np.allclose(_w.sum(axis=1), np.ones(4)),
      msg="Cada fila de pesos debe sumar 1")

_n = 6
_M = np.triu(np.full((_n, _n), -np.inf), k=1)
_Qc = _rng.normal(size=(_n, 8)); _Kc = _rng.normal(size=(_n, 8)); _Vc = _rng.normal(size=(_n, 4))
_oc, _wc = scaled_attention(_Qc, _Kc, _Vc, mask=_M)
check("Las posiciones enmascaradas reciben peso ~0",
      lambda: np.allclose(np.triu(_wc, k=1), 0.0, atol=1e-9),
      msg="Con máscara -inf sobre la diagonal, esos pesos deben ser prácticamente 0")
check("La fila i solo atiende a posiciones j <= i (atención causal)",
      lambda: np.allclose(_wc.sum(axis=1), 1.0) and _wc[0, 0] > 0.999,
      msg="La primera posición solo puede mirarse a sí misma: su peso propio debe ser ~1")

_M0 = np.zeros((4, 5))
_o0, _w0 = scaled_attention(_Q, _K, _V, mask=_M0)
check("Una máscara de ceros equivale a no poner máscara",
      lambda: np.allclose(_w0, _w, atol=1e-10),
      msg="Sumar una máscara de ceros no debe cambiar nada")

_Qb = _Q * 100
_ob, _wb = scaled_attention(_Qb, _K * 100, _V, mask=None)
check("Estable con puntuaciones grandes (softmax estable)",
      lambda: np.all(np.isfinite(_wb)) and np.allclose(_wb.sum(axis=1), 1.0),
      msg="Con entradas grandes aparece nan: resta el máximo por fila antes de np.exp")
`,
    hints: [
      'Empieza como la atención básica: `scores = Q @ K.T / np.sqrt(Q.shape[1])`.',
      'Si `mask is not None`, haz `scores = scores + mask` **antes** de la softmax. El $-\\infty$ de la máscara se convierte en peso 0.',
      'Softmax estable por filas: resta `scores.max(axis=1, keepdims=True)`, exponencia y divide por la suma por filas.',
    ],
  },
  {
    id: 'transformers-codificacion-posicional',
    title: 'E2 · Codificación posicional sinusoidal',
    difficulty: 'BASICO',
    xp: 40,
    statement: [
      'La atención es **ciega al orden**: sin más información, «el perro muerde al hombre» y «el hombre muerde al perro» son idénticas. La solución del paper original es sumar a cada embedding un patrón sinusoidal único por posición:',
      '$$PE_{(pos, 2i)} = \\sin\\!\\left(\\frac{pos}{10000^{2i/d}}\\right) \\qquad PE_{(pos, 2i+1)} = \\cos\\!\\left(\\frac{pos}{10000^{2i/d}}\\right)$$',
      '',
      'Implementa `positional_encoding(max_pos, d)` que devuelva la matriz $PE \\in \\mathbb{R}^{max\\_pos \\times d}$: la fila `pos` es la codificación de esa posición; las columnas pares usan `sin` y las impares `cos`, con $i = \\texttt{columna} // 2$.',
    ].join('\n'),
    starter_code: `import numpy as np

def positional_encoding(max_pos, d):
    """
    Matriz PE de forma (max_pos, d):
      PE[pos, 2i]   = sin(pos / 10000^(2i/d))
      PE[pos, 2i+1] = cos(pos / 10000^(2i/d))
    con i = columna // 2.
    """
    PE = np.zeros((max_pos, d))
    # TODO: rellena columnas pares con sin e impares con cos
    return PE

# Prueba rápida
PE = positional_encoding(4, 8)
print(PE.shape)          # (4, 8)
print(PE[0])             # posición 0: sin(0)=0 en pares, cos(0)=1 en impares
`,
    solution_code: `import numpy as np

def positional_encoding(max_pos, d):
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]          # (max_pos, 1)
    i = np.arange(d)[None, :]                  # (1, d)
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE
`,
    test_code: `
_PE = positional_encoding(50, 16)
check("La forma es (max_pos, d)", lambda: _PE.shape == (50, 16),
      msg=f"Se esperaba (50, 16), llegó {_PE.shape}")
check("Posición 0: sin(0)=0 en pares, cos(0)=1 en impares",
      lambda: np.allclose(_PE[0, 0::2], 0.0, atol=1e-12) and np.allclose(_PE[0, 1::2], 1.0, atol=1e-12),
      msg="En pos=0 las columnas pares deben ser 0 y las impares 1")

def _pe_ref(max_pos, d):
    out = np.zeros((max_pos, d))
    for p in range(max_pos):
        for c in range(d):
            i = c // 2
            ang = p / 10000.0 ** (2 * i / d)
            out[p, c] = np.sin(ang) if c % 2 == 0 else np.cos(ang)
    return out
check("Coincide con la fórmula exacta (1e-8)",
      lambda: np.allclose(_PE, _pe_ref(50, 16), atol=1e-8),
      msg="Revisa el exponente 2i/d con i = columna//2 y sin en pares / cos en impares")

check("Cada par de canales tiene norma 1: sin² + cos² = 1",
      lambda: np.allclose(_PE[:, 0] ** 2 + _PE[:, 1] ** 2, 1.0, atol=1e-10),
      msg="Para los dos primeros canales debe cumplirse sin²(θ)+cos²(θ)=1 en toda posición")
check("Posiciones distintas tienen codificaciones distintas",
      lambda: not np.allclose(_PE[3], _PE[7]),
      msg="Dos posiciones distintas no pueden compartir codificación")
_PE2 = positional_encoding(10, 7)
check("Funciona con d impar", lambda: _PE2.shape == (10, 7) and np.allclose(_PE2, _pe_ref(10, 7), atol=1e-8),
      msg="Con d impar la última columna (par) también usa sin")
`,
    hints: [
      'Construye `pos = np.arange(max_pos)[:, None]` y los ángulos `pos / 10000**(2*(columna//2)/d)` con broadcasting.',
      'Rellena las columnas pares con `PE[:, 0::2] = np.sin(...)` y las impares con `PE[:, 1::2] = np.cos(...)`.',
      'Ojo con el índice: para la columna `c`, $i = c // 2$ — las columnas 0 y 1 comparten la misma frecuencia.',
    ],
  },
  {
    id: 'transformers-mascara-causal',
    title: 'E3 · Máscara causal (GPT)',
    difficulty: 'BASICO',
    xp: 30,
    statement: [
      'GPT genera texto de izquierda a derecha: al predecir el token $t$ **no puede mirar el futuro**. Eso se logra sumando una máscara triangular a las puntuaciones antes de la softmax:',
      '$$M_{ij} = \\begin{cases} 0 & j \\le i \\\\ -\\infty & j > i \\end{cases}$$',
      '',
      'Implementa `causal_mask(n)` que devuelva una matriz $(n, n)$ con `0.0` en la diagonal y por debajo, y `-np.inf` estrictamente por encima de la diagonal. Sumada a las puntuaciones, convierte cualquier atención en atención causal.',
    ].join('\n'),
    starter_code: `import numpy as np

def causal_mask(n):
    """
    Máscara causal (n, n): 0.0 en j <= i, -inf en j > i.
    Se suma a las puntuaciones QKᵀ/√d antes de la softmax.
    """
    # TODO: matriz de -inf con ceros en el triángulo inferior (pista: np.triu / np.tril)
    return np.zeros((n, n))

# Prueba rápida
print(causal_mask(4))
`,
    solution_code: `import numpy as np

def causal_mask(n):
    mask = np.full((n, n), -np.inf)
    mask = np.triu(mask, k=1)
    return mask
`,
    test_code: `
_M = causal_mask(5)
check("La forma es (n, n)", lambda: _M.shape == (5, 5),
      msg=f"Se esperaba (5, 5), llegó {_M.shape}")
_iu = np.triu_indices(5, k=1)
check("Estructura exacta: 0 en j<=i, -inf en j>i",
      lambda: np.all(np.tril(_M) == 0.0) and np.all(np.isneginf(_M[_iu])),
      msg="Triángulo inferior (diagonal incluida) a 0.0; triángulo superior estricto a -np.inf")
check("La diagonal está permitida (cada token se ve a sí mismo)",
      lambda: np.all(np.diag(_M) == 0.0),
      msg="La diagonal debe ser 0: un token siempre puede mirarse a sí mismo")

_rng = np.random.default_rng(9)
_n = 6
_Q = _rng.normal(size=(_n, 8)); _K = _rng.normal(size=(_n, 8))
_scores = _Q @ _K.T / np.sqrt(8)
_sm = _scores + causal_mask(_n)
_e = np.exp(_sm - _sm.max(axis=1, keepdims=True))
_w = _e / _e.sum(axis=1, keepdims=True)
check("Con la máscara, la posición i queda ciega a j > i (peso ≈ 0)",
      lambda: np.allclose(np.triu(_w, k=1), 0.0, atol=1e-12),
      msg="Tras aplicar la máscara, los pesos sobre la diagonal deben ser 0")
check("Sin embargo cada fila sigue sumando 1",
      lambda: np.allclose(_w.sum(axis=1), 1.0),
      msg="La máscara no debe romper la normalización de la softmax")
_M10 = causal_mask(10)
_iu10 = np.triu_indices(10, k=1)
check("Funciona para cualquier n",
      lambda: _M10.shape == (10, 10) and np.all(np.tril(_M10) == 0.0) and np.all(np.isneginf(_M10[_iu10])),
      msg="La máscara debe construirse para n arbitrario")
`,
    hints: [
      'Crea una matriz llena de `-np.inf` y quédate solo con el triángulo superior estricto: `np.triu(M, k=1)`. El resto quedará a 0.',
      'Alternativa: `np.where(np.tril(np.ones((n, n), dtype=bool)), 0.0, -np.inf)`.',
      'La diagonal pertenece al pasado permitido: usa `k=1` (estrictamente superior) para el $-\\infty$.',
    ],
  },
  {
    id: 'transformers-ffn-residual',
    title: 'E4 · Feed-forward + conexión residual',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: [
      'Cada bloque Transformer termina con una red feed-forward aplicada a cada posición por separado, envuelta en una **conexión residual** y **LayerNorm**:',
      '$$\\mathrm{FFN}(x) = \\max(0,\\; xW_1 + b_1)\\,W_2 + b_2$$',
      '$$\\mathrm{salida} = \\mathrm{LayerNorm}\\big(x + \\mathrm{FFN}(x)\\big)$$',
      '',
      'Te damos `layer_norm(x)` ya implementada. Implementa `ffn_block(x, W1, b1, W2, b2)` que devuelva `layer_norm(x + relu(x @ W1 + b1) @ W2 + b2)`.',
      '',
      'La residual es lo que permite apilar decenas de capas sin que el gradiente muera: si los pesos son cero, la salida es simplemente `layer_norm(x)`.',
    ].join('\n'),
    starter_code: `import numpy as np

def layer_norm(x, eps=1e-6):
    """Normaliza cada fila a media 0 y varianza 1 (ya implementada)."""
    x = np.asarray(x, dtype=float)
    mu = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps)

def ffn_block(x, W1, b1, W2, b2):
    """
    Bloque FFN con residual y LayerNorm:
      layer_norm(x + relu(x @ W1 + b1) @ W2 + b2)
    x: (n, d); W1: (d, d_ff); W2: (d_ff, d).
    """
    # TODO: FFN con ReLU, suma residual y layer_norm
    return np.zeros_like(x)

# Prueba rápida
rng = np.random.default_rng(0)
x = rng.normal(size=(3, 4))
W1 = rng.normal(size=(4, 8)) * 0.5
b1 = np.zeros(8)
W2 = rng.normal(size=(8, 4)) * 0.5
b2 = np.zeros(4)
print(ffn_block(x, W1, b1, W2, b2).round(3))
`,
    solution_code: `import numpy as np

def layer_norm(x, eps=1e-6):
    x = np.asarray(x, dtype=float)
    mu = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps)

def ffn_block(x, W1, b1, W2, b2):
    x = np.asarray(x, dtype=float)
    ffn = np.maximum(0.0, x @ W1 + b1) @ W2 + b2
    return layer_norm(x + ffn)
`,
    test_code: `
_rng = np.random.default_rng(17)
_x = _rng.normal(size=(3, 4))
_W1 = _rng.normal(size=(4, 8)) * 0.5
_b1 = _rng.normal(size=8) * 0.1
_W2 = _rng.normal(size=(8, 4)) * 0.5
_b2 = _rng.normal(size=4) * 0.1

def _ln_ref(x, eps=1e-6):
    mu = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mu) / np.sqrt(var + eps)
_ffn_ref = np.maximum(0.0, _x @ _W1 + _b1) @ _W2 + _b2
_ref = _ln_ref(_x + _ffn_ref)

_y = ffn_block(_x, _W1, _b1, _W2, _b2)
check("La salida tiene la misma forma que la entrada",
      lambda: _y.shape == _x.shape,
      msg=f"Se esperaba {_x.shape}, llegó {_y.shape}: W2 debe devolver a dimensión d")
check("Los valores coinciden con la referencia",
      lambda: np.allclose(_y, _ref, atol=1e-8),
      msg="Revisa: relu(x@W1+b1)@W2+b2, luego residual +x, luego layer_norm")
check("La activación intermedia es ReLU (sin tanh ni sigmoide)",
      lambda: np.allclose(
          ffn_block(np.zeros((1, 4)), _W1, -np.abs(_b1) - 1.0, _W2, np.zeros(4)),
          _ln_ref(np.zeros((1, 4)) + np.maximum(0.0, -np.abs(_b1) - 1.0) @ _W2),
          atol=1e-8),
      msg="Con x=0 y b1 negativo, la ReLU debe recortar a 0 la activación intermedia")
_y0 = ffn_block(_x, np.zeros_like(_W1), np.zeros(8), np.zeros_like(_W2), np.zeros(4))
check("Con pesos cero queda la identidad residual: layer_norm(x)",
      lambda: np.allclose(_y0, _ln_ref(_x), atol=1e-8),
      msg="Si W1=W2=0 la FFN es 0 y debe quedar layer_norm(x): ¿sumaste la residual?")
check("Cada fila de la salida está normalizada (media≈0, var≈1)",
      lambda: np.allclose(_y.mean(axis=-1), 0.0, atol=1e-6)
              and np.allclose(_y.var(axis=-1), 1.0, atol=1e-3),
      msg="Falta la LayerNorm final: cada fila debe tener media 0 y varianza ~1")
`,
    hints: [
      'La FFN es `np.maximum(0.0, x @ W1 + b1) @ W2 + b2` — expande a $d_{ff}$, aplica ReLU y proyecta de vuelta a $d$.',
      'La conexión residual suma la entrada original: `x + ffn`.',
      'Cierra con `layer_norm(x + ffn)` usando la función dada.',
    ],
  },
  {
    id: 'transformers-multihead-desde-cero',
    title: 'E5 · Multi-head self-attention desde cero',
    difficulty: 'AVANZADO',
    xp: 160,
    statement: [
      'El ejercicio cumbre del nivel: implementa **multi-head self-attention** completo, solo con numpy:',
      '$$\\mathrm{head}_j = \\mathrm{Attention}(XW_j^Q,\\; XW_j^K,\\; XW_j^V), \\qquad \\mathrm{MultiHead}(X) = \\mathrm{Concat}(\\mathrm{head}_1, \\dots, \\mathrm{head}_h)\\, W^O$$',
      '',
      'En la práctica las $h$ cabezas se obtienen **partiendo** una única proyección grande: `Q = X @ Wq` de forma $(n, d)$ se reorganiza en $h$ trozos de $d_k = d / h$, y cada cabeza hace su propia atención escalada.',
      '',
      'Implementa `multihead(X, Wq, Wk, Wv, Wo, h)` que devuelva la tupla `(output, heads)`:',
      '',
      '- `X`: $(n, d)$; `Wq, Wk, Wv`: $(d, d)$; `Wo`: $(d, d)$; `h`: nº de cabezas (divide a $d$).\n- `heads`: lista de $h$ matrices $(n, d_k)$ — la salida de cada cabeza (para depurar).\n- `output`: $(n, d)$, igual a `concat(heads, axis=1) @ Wo`.',
      '',
      'Sin bucles sobre posiciones: cada cabeza es una atención escalada sobre matrices $(n, d_k)$.',
    ].join('\n'),
    starter_code: `import numpy as np

def multihead(X, Wq, Wk, Wv, Wo, h):
    """
    Multi-head self-attention.
    X: (n, d); Wq, Wk, Wv, Wo: (d, d); h: nº de cabezas (d % h == 0).
    Devuelve (output, heads):
      heads  — lista de h matrices (n, d_k), una por cabeza
      output — (n, d): concat(heads, axis=1) @ Wo
    """
    n, d = X.shape
    d_k = d // h
    Q = X @ Wq
    K = X @ Wk
    V = X @ Wv
    heads = []
    # TODO: para cada cabeza j, toma las columnas j*d_k:(j+1)*d_k de Q, K, V,
    # aplica atención escalada (softmax estable por filas) y guarda la salida
    output = np.zeros((n, d))
    return output, heads

# Prueba rápida
rng = np.random.default_rng(0)
X = rng.normal(size=(5, 8))
Wq, Wk, Wv, Wo = (rng.normal(size=(8, 8)) * 0.3 for _ in range(4))
out, heads = multihead(X, Wq, Wk, Wv, Wo, h=2)
print(out.shape, [hd.shape for hd in heads])  # (5, 8) [(5, 4), (5, 4)]
`,
    solution_code: `import numpy as np

def multihead(X, Wq, Wk, Wv, Wo, h):
    X = np.asarray(X, dtype=float)
    n, d = X.shape
    d_k = d // h
    Q = X @ Wq
    K = X @ Wk
    V = X @ Wv
    heads = []
    for j in range(h):
        sl = slice(j * d_k, (j + 1) * d_k)
        Qj, Kj, Vj = Q[:, sl], K[:, sl], V[:, sl]
        scores = Qj @ Kj.T / np.sqrt(d_k)
        scores = scores - scores.max(axis=1, keepdims=True)
        e = np.exp(scores)
        w = e / e.sum(axis=1, keepdims=True)
        heads.append(w @ Vj)
    output = np.concatenate(heads, axis=1) @ Wo
    return output, heads
`,
    test_code: `
_rng = np.random.default_rng(41)
_n, _d, _h = 5, 8, 4
_dk = _d // _h
_X = _rng.normal(size=(_n, _d))
_Wq, _Wk, _Wv, _Wo = (_rng.normal(size=(_d, _d)) * 0.3 for _ in range(4))

_out, _heads = multihead(_X, _Wq, _Wk, _Wv, _Wo, _h)
check("Devuelve (output, heads) con las formas correctas",
      lambda: _out.shape == (_n, _d) and len(_heads) == _h
              and all(hd.shape == (_n, _dk) for hd in _heads),
      msg="output debe ser (n, d) y heads una lista de h matrices (n, d/h)")

def _head_ref(j):
    sl = slice(j * _dk, (j + 1) * _dk)
    Qj, Kj, Vj = (_X @ _Wq)[:, sl], (_X @ _Wk)[:, sl], (_X @ _Wv)[:, sl]
    s = Qj @ Kj.T / np.sqrt(_dk)
    e = np.exp(s - s.max(axis=1, keepdims=True))
    return (e / e.sum(axis=1, keepdims=True)) @ Vj
for _j in range(_h):
    check(f"head {_j}: atención escalada sobre su rebanada de columnas",
          (lambda j: (lambda: np.allclose(_heads[j], _head_ref(j), atol=1e-8)))(_j),
          msg="Cada cabeza usa SU propio trozo de columnas de Q, K, V y escala por √(d/h)")
_out_ref = np.concatenate([_head_ref(j) for j in range(_h)], axis=1) @ _Wo
check("La salida es concat(heads) @ Wo",
      lambda: np.allclose(_out, _out_ref, atol=1e-8),
      msg="Primero concatena las cabezas por columnas, luego proyecta con Wo")

_o1a, _h1 = multihead(_X, _Wq, _Wk, _Wv, _Wo, 1)
_s1 = (_X @ _Wq) @ (_X @ _Wk).T / np.sqrt(_d)
_e1 = np.exp(_s1 - _s1.max(axis=1, keepdims=True))
_w1 = _e1 / _e1.sum(axis=1, keepdims=True)
check("Con h=1 coincide con la atención simple (una sola cabeza grande)",
      lambda: len(_h1) == 1 and np.allclose(_o1a, (_w1 @ (_X @ _Wv)) @ _Wo, atol=1e-8),
      msg="El caso h=1 debe reducirse a softmax(QKᵀ/√d)V @ Wo sobre toda la dimensión")

_oA, _ = multihead(_X, _Wq, _Wk, _Wv, _Wo, _h)
_oB, _ = multihead(_X, _Wq, _Wk, _Wv, _Wo, _h)
check("Es determinista: dos llamadas idénticas dan el mismo resultado",
      lambda: np.array_equal(_oA, _oB),
      msg="La función no debe tener aleatoriedad: mismo input → mismo output")

_X2 = _rng.normal(size=(3, 6))
_W2 = [_rng.normal(size=(6, 6)) * 0.3 for _ in range(4)]
_o2, _h2 = multihead(_X2, *_W2, 3)
check("Generaliza a otros n, d, h (d divisible entre h)",
      lambda: _o2.shape == (3, 6) and len(_h2) == 3 and _h2[0].shape == (3, 2),
      msg="Debe funcionar para cualquier d divisible entre h")
`,
    hints: [
      'Proyecta una vez: `Q, K, V = X @ Wq, X @ Wk, X @ Wv`. La cabeza `j` usa las columnas `j*d_k : (j+1)*d_k` de cada una.',
      'Cada cabeza es la atención escalada de siempre: softmax estable por filas de `Qj @ Kj.T / np.sqrt(d_k)`, y su salida `w @ Vj` tiene forma $(n, d_k)$.',
      'Al final: `np.concatenate(heads, axis=1) @ Wo`. Guarda también la lista `heads` tal cual para la segunda salida.',
    ],
  },
]

registerExercises(TRANSFORMERS_EXERCISES)
