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
  {
    id: 'transformers-sent-embed',
    title: 'P1 · Batch con padding y máscara',
    difficulty: 'BASICO',
    xp: 50,
    statement: [
      'Te incorporas al equipo de ML de un ecommerce: quieren detectar automáticamente las **reseñas negativas** de producto. El generador `make_reviews(n, seed)` produce reseñas sintéticas pero traicioneras: junto a las positivas y negativas obvias hay **negaciones** («no me gusta nada», «no es malo») que delatan a cualquier modelo de bolsa de palabras.',
      '',
      'Primera pieza del pipeline: convertir una lista de secuencias de token ids (de longitudes variables) en un tensor con **padding enmascarado**. Implementa `encode_batch(seqs, E, max_len)`:',
      '',
      '- `X`: tensor $(B, max\\_len, d)$ donde cada fila válida es `E[token] + PE[posición]` (embedding + codificación posicional sinusoidal, dada) y las posiciones de padding quedan **exactamente a cero**.\n- `mask`: matriz $(B, max\\_len)$ con 1.0 en tokens reales y 0.0 en padding.\n- Las secuencias más largas que `max_len` se truncan.',
      '',
      'La máscara es lo que permitirá a la atención (siguientes ejercicios) ignorar el padding: un batallón de ceros que no debe contar para nada.',
    ].join('\n'),
    starter_code: `import numpy as np

VOCAB = {
    '<pad>': 0, 'me': 1, 'gusta': 2, 'encanta': 3, 'no': 4, 'este': 5,
    'producto': 6, 'calidad': 7, 'increible': 8, 'horrible': 9, 'rompio': 10,
    'primer': 11, 'dia': 12, 'muy': 13, 'nada': 14, 'malo': 15, 'bueno': 16,
    'genial': 17, 'perfecto': 18, 'funciona': 19, 'bien': 20, 'mal': 21,
    'decepcion': 22, 'recomiendo': 23, 'compra': 24, 'llego': 25, 'roto': 26,
    'tarde': 27, 'rapido': 28, 'envio': 29, 'precio': 30, 'caro': 31,
    'barato': 32, 'es': 33, 'una': 34, 'el': 35, 'se': 36, 'volveria': 37,
    'comprar': 38, 'nunca': 39, 'siempre': 40, 'lo': 41, 'total': 42,
    'y': 43, 'a': 44, 'la': 45, 'buena': 46, 'mala': 47, 'perfecta': 48,
}

_POS = [
    "me encanta este producto", "la calidad es increible", "funciona muy bien",
    "es genial y barato", "llego rapido y funciona bien", "una compra perfecta",
    "lo recomiendo siempre", "precio barato y buena calidad", "es muy bueno",
    "me gusta este producto",
]
_NEG = [
    "es horrible", "se rompio el primer dia", "una decepcion total",
    "es muy malo", "llego roto y tarde", "precio caro y mala calidad",
    "nunca volveria a comprar", "es una compra mala", "el envio llego tarde",
    "calidad mala y precio caro",
]
_NEG_FLIP = [   # negativas con negación
    "no me gusta nada", "no funciona nada bien", "no lo recomiendo",
    "no es bueno", "no me gusta este producto",
]
_NEG_POS = [    # positivas con negación (las que delatan a un bag-of-words)
    "no es malo", "no es horrible", "no es una decepcion",
]
_NEUTRAL = ["este producto", "el producto", "la compra", "el envio"]

def make_reviews(n, seed=1):
    """Reseñas sintéticas: lista de listas de token ids + etiquetas (1=pos, 0=neg)."""
    rng = np.random.default_rng(seed)
    cats = rng.choice(4, size=n, p=[0.30, 0.30, 0.25, 0.15])
    seqs, labels = [], []
    for c in cats:
        if c == 0:
            words, y = rng.choice(_POS).split(), 1
        elif c == 1:
            words, y = rng.choice(_NEG).split(), 0
        elif c == 2:
            words, y = rng.choice(_NEG_FLIP).split(), 0
        else:
            words, y = rng.choice(_NEG_POS).split(), 1
        if rng.random() < 0.35:                     # ruido neutro al final
            words = words + rng.choice(_NEUTRAL).split()
        seqs.append([VOCAB[w] for w in words])
        labels.append(y)
    return seqs, np.array(labels)

D = 16
_rng = np.random.default_rng(42)
E = _rng.normal(0, 1.0, size=(len(VOCAB), D))
E[0] = 0.0   # el embedding de <pad> es cero

def positional_encoding(max_pos, d):
    """PE sinusoidal del ejercicio E2 del módulo (ya implementada)."""
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE

def encode_batch(seqs, E, max_len):
    """
    Convierte una lista de secuencias de token ids en:
      X:    (B, max_len, d) — embedding + PE, CERO en posiciones de padding
      mask: (B, max_len)    — 1.0 en tokens reales, 0.0 en padding
    Las secuencias más largas que max_len se truncan.
    """
    # TODO: inicializa a ceros, rellena las filas reales con E[token] + PE[pos]
    # y marca la máscara
    B = len(seqs)
    d = E.shape[1]
    return np.zeros((B, max_len, d)), np.zeros((B, max_len))

# Prueba rápida
seqs, labels = make_reviews(8, seed=3)
X, mask = encode_batch(seqs, E, 8)
print(X.shape, mask.shape)
print(mask.astype(int))
`,
    solution_code: `import numpy as np

VOCAB = {
    '<pad>': 0, 'me': 1, 'gusta': 2, 'encanta': 3, 'no': 4, 'este': 5,
    'producto': 6, 'calidad': 7, 'increible': 8, 'horrible': 9, 'rompio': 10,
    'primer': 11, 'dia': 12, 'muy': 13, 'nada': 14, 'malo': 15, 'bueno': 16,
    'genial': 17, 'perfecto': 18, 'funciona': 19, 'bien': 20, 'mal': 21,
    'decepcion': 22, 'recomiendo': 23, 'compra': 24, 'llego': 25, 'roto': 26,
    'tarde': 27, 'rapido': 28, 'envio': 29, 'precio': 30, 'caro': 31,
    'barato': 32, 'es': 33, 'una': 34, 'el': 35, 'se': 36, 'volveria': 37,
    'comprar': 38, 'nunca': 39, 'siempre': 40, 'lo': 41, 'total': 42,
    'y': 43, 'a': 44, 'la': 45, 'buena': 46, 'mala': 47, 'perfecta': 48,
}

_POS = [
    "me encanta este producto", "la calidad es increible", "funciona muy bien",
    "es genial y barato", "llego rapido y funciona bien", "una compra perfecta",
    "lo recomiendo siempre", "precio barato y buena calidad", "es muy bueno",
    "me gusta este producto",
]
_NEG = [
    "es horrible", "se rompio el primer dia", "una decepcion total",
    "es muy malo", "llego roto y tarde", "precio caro y mala calidad",
    "nunca volveria a comprar", "es una compra mala", "el envio llego tarde",
    "calidad mala y precio caro",
]
_NEG_FLIP = [
    "no me gusta nada", "no funciona nada bien", "no lo recomiendo",
    "no es bueno", "no me gusta este producto",
]
_NEG_POS = [
    "no es malo", "no es horrible", "no es una decepcion",
]
_NEUTRAL = ["este producto", "el producto", "la compra", "el envio"]

def make_reviews(n, seed=1):
    rng = np.random.default_rng(seed)
    cats = rng.choice(4, size=n, p=[0.30, 0.30, 0.25, 0.15])
    seqs, labels = [], []
    for c in cats:
        if c == 0:
            words, y = rng.choice(_POS).split(), 1
        elif c == 1:
            words, y = rng.choice(_NEG).split(), 0
        elif c == 2:
            words, y = rng.choice(_NEG_FLIP).split(), 0
        else:
            words, y = rng.choice(_NEG_POS).split(), 1
        if rng.random() < 0.35:
            words = words + rng.choice(_NEUTRAL).split()
        seqs.append([VOCAB[w] for w in words])
        labels.append(y)
    return seqs, np.array(labels)

D = 16
_rng = np.random.default_rng(42)
E = _rng.normal(0, 1.0, size=(len(VOCAB), D))
E[0] = 0.0

def positional_encoding(max_pos, d):
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE

def encode_batch(seqs, E, max_len):
    B = len(seqs)
    d = E.shape[1]
    X = np.zeros((B, max_len, d))
    mask = np.zeros((B, max_len))
    PE = positional_encoding(max_len, d)
    for b, s in enumerate(seqs):
        L = min(len(s), max_len)
        X[b, :L] = E[np.asarray(s[:L])] + PE[:L]
        mask[b, :L] = 1.0
    return X, mask

# Prueba rápida
seqs, labels = make_reviews(8, seed=3)
X, mask = encode_batch(seqs, E, 8)
print(X.shape, mask.shape)
print(mask.astype(int))
`,
    test_code: `
_seqs, _y = make_reviews(20, seed=5)
_max = 8
_X, _mask = encode_batch(_seqs, E, _max)
check("Formas: X (B, max_len, d) y mask (B, max_len)",
      lambda: _X.shape == (20, _max, 16) and _mask.shape == (20, _max),
      msg=f"Se esperaba (20, {_max}, 16) y (20, {_max}), llegaron {_X.shape} y {_mask.shape}")

_L = np.array([min(len(s), _max) for s in _seqs])
_mask_ref = (np.arange(_max)[None, :] < _L[:, None]).astype(float)
check("La máscara vale 1 en tokens reales y 0 en padding",
      lambda: np.array_equal(np.asarray(_mask), _mask_ref),
      msg="mask[b, j] = 1 si j < longitud de la reseña b, 0 en caso contrario")

_PE = positional_encoding(_max, 16)
_b = 3
_Lb = min(len(_seqs[_b]), _max)
_ref_rows = E[np.asarray(_seqs[_b][:_Lb])] + _PE[:_Lb]
check("Las filas reales son embedding + codificación posicional",
      lambda: np.allclose(_X[_b, :_Lb], _ref_rows, atol=1e-10),
      msg="Cada fila debe ser E[token] + PE[posicion] para los tokens reales")
check("El padding queda anulado a cero (la PE no se cuela)",
      lambda: np.allclose(_X[np.asarray(_mask) == 0], 0.0),
      msg="En las posiciones de padding X debe ser exactamente 0: suma la PE solo a los tokens reales (o multiplica por la máscara al final)")
check("Multiplicar por la máscara no cambia nada (ya está enmascarado)",
      lambda: np.allclose(_X * np.asarray(_mask)[..., None], _X),
      msg="X debe venir ya anulado en padding")
check("Secuencias más largas que max_len se truncan sin error",
      lambda: encode_batch([list(range(1, 15))], E, 6)[0].shape == (1, 6, 16),
      msg="Si len(seq) > max_len, quédate con los primeros max_len tokens")
`,
    hints: [
      'Recorre las secuencias con `for b, s in enumerate(seqs)`; la longitud real es `L = min(len(s), max_len)` y la máscara `mask[b, :L] = 1.0`.',
      'Las filas válidas son `E[np.asarray(s[:L])] + PE[:L]`. Si inicializas $X$ a ceros y solo rellenas las filas reales, el padding ya queda anulado.',
      'Imprime `mask.astype(int)` para comprobar que las reseñas cortas tienen ceros al final.',
    ],
  },
  {
    id: 'transformers-sent-attention',
    title: 'P2 · Forward del clasificador con atención',
    difficulty: 'INTERMEDIO',
    xp: 90,
    statement: [
      'Segunda pieza del proyecto: el **forward completo** del clasificador de sentimiento con una capa de self-attention. Los pesos vienen dados (todavía sin entrenar): tu misión es que el cálculo sea exacto.',
      '',
      '$$Q = XW^Q \\quad K = XW^K \\quad V = XW^V \\qquad \\mathrm{attn} = \\mathrm{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d}} + M_{pad}\\right) \\qquad O = \\mathrm{attn}\\,V$$',
      '',
      'Implementa `sentiment_forward(X, mask, Wq, Wk, Wv, w_head, b_head)` que devuelva `(probs, attn)`:',
      '',
      '- `attn`: softmax estable por filas sobre las **keys**, con máscara de padding aditiva: suma $(1 - mask) \\cdot (-10^9)$ en el eje de las keys antes de la softmax.\n- `pooled`: media de $O$ **solo sobre tokens reales** (mean-pooling enmascarado: suma con máscara y divide entre `mask.sum`).\n- `probs`: softmax de `pooled @ w_head + b_head`, forma $(B, 2)$.',
      '',
      'El test compara contra la referencia paso a paso: padding con peso ~0, filas que suman 1 y probabilidades exactas. Es el mismo pipeline que usarás entrenado en el siguiente ejercicio.',
    ].join('\n'),
    starter_code: `import numpy as np

VOCAB = {
    '<pad>': 0, 'me': 1, 'gusta': 2, 'encanta': 3, 'no': 4, 'este': 5,
    'producto': 6, 'calidad': 7, 'increible': 8, 'horrible': 9, 'rompio': 10,
    'primer': 11, 'dia': 12, 'muy': 13, 'nada': 14, 'malo': 15, 'bueno': 16,
    'genial': 17, 'perfecto': 18, 'funciona': 19, 'bien': 20, 'mal': 21,
    'decepcion': 22, 'recomiendo': 23, 'compra': 24, 'llego': 25, 'roto': 26,
    'tarde': 27, 'rapido': 28, 'envio': 29, 'precio': 30, 'caro': 31,
    'barato': 32, 'es': 33, 'una': 34, 'el': 35, 'se': 36, 'volveria': 37,
    'comprar': 38, 'nunca': 39, 'siempre': 40, 'lo': 41, 'total': 42,
    'y': 43, 'a': 44, 'la': 45, 'buena': 46, 'mala': 47, 'perfecta': 48,
}

_POS = [
    "me encanta este producto", "la calidad es increible", "funciona muy bien",
    "es genial y barato", "llego rapido y funciona bien", "una compra perfecta",
    "lo recomiendo siempre", "precio barato y buena calidad", "es muy bueno",
    "me gusta este producto",
]
_NEG = [
    "es horrible", "se rompio el primer dia", "una decepcion total",
    "es muy malo", "llego roto y tarde", "precio caro y mala calidad",
    "nunca volveria a comprar", "es una compra mala", "el envio llego tarde",
    "calidad mala y precio caro",
]
_NEG_FLIP = [
    "no me gusta nada", "no funciona nada bien", "no lo recomiendo",
    "no es bueno", "no me gusta este producto",
]
_NEG_POS = [
    "no es malo", "no es horrible", "no es una decepcion",
]
_NEUTRAL = ["este producto", "el producto", "la compra", "el envio"]

def make_reviews(n, seed=1):
    rng = np.random.default_rng(seed)
    cats = rng.choice(4, size=n, p=[0.30, 0.30, 0.25, 0.15])
    seqs, labels = [], []
    for c in cats:
        if c == 0:
            words, y = rng.choice(_POS).split(), 1
        elif c == 1:
            words, y = rng.choice(_NEG).split(), 0
        elif c == 2:
            words, y = rng.choice(_NEG_FLIP).split(), 0
        else:
            words, y = rng.choice(_NEG_POS).split(), 1
        if rng.random() < 0.35:
            words = words + rng.choice(_NEUTRAL).split()
        seqs.append([VOCAB[w] for w in words])
        labels.append(y)
    return seqs, np.array(labels)

D = 16
_rng = np.random.default_rng(42)
E = _rng.normal(0, 1.0, size=(len(VOCAB), D))
E[0] = 0.0

def positional_encoding(max_pos, d):
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE

def encode_batch(seqs, E, max_len):
    """La función del ejercicio anterior, ya implementada."""
    B = len(seqs)
    d = E.shape[1]
    X = np.zeros((B, max_len, d))
    mask = np.zeros((B, max_len))
    PE = positional_encoding(max_len, d)
    for b, s in enumerate(seqs):
        L = min(len(s), max_len)
        X[b, :L] = E[np.asarray(s[:L])] + PE[:L]
        mask[b, :L] = 1.0
    return X, mask

# Pesos dados (sin entrenar): el ejercicio es implementar el forward
_rngW = np.random.default_rng(0)
Wq = _rngW.normal(0, 0.3, size=(D, D))
Wk = _rngW.normal(0, 0.3, size=(D, D))
Wv = _rngW.normal(0, 0.3, size=(D, D))
w_head = _rngW.normal(0, 0.3, size=(D, 2))
b_head = np.zeros(2)

def sentiment_forward(X, mask, Wq, Wk, Wv, w_head, b_head):
    """
    Forward completo del clasificador de una capa de self-attention:
      Q = X@Wq; K = X@Wk; V = X@Wv
      attn = softmax(Q @ K^T / sqrt(d) + máscara de padding en las KEYS)
      O = attn @ V
      pooled = media de O sobre tokens REALES (mean-pooling enmascarado)
      probs = softmax(pooled @ w_head + b_head)
    Devuelve (probs, attn): (B, 2) y (B, L, L).
    """
    # TODO
    B, L, d = X.shape
    return np.zeros((B, 2)), np.zeros((B, L, L))

# Prueba rápida
seqs, labels = make_reviews(6, seed=9)
X, mask = encode_batch(seqs, E, 8)
probs, attn = sentiment_forward(X, mask, Wq, Wk, Wv, w_head, b_head)
print(probs.round(3))
print("peso hacia keys de padding (debe ser 0):", round(float(attn[0][:, mask[0] == 0].sum()), 6))
`,
    solution_code: `import numpy as np

VOCAB = {
    '<pad>': 0, 'me': 1, 'gusta': 2, 'encanta': 3, 'no': 4, 'este': 5,
    'producto': 6, 'calidad': 7, 'increible': 8, 'horrible': 9, 'rompio': 10,
    'primer': 11, 'dia': 12, 'muy': 13, 'nada': 14, 'malo': 15, 'bueno': 16,
    'genial': 17, 'perfecto': 18, 'funciona': 19, 'bien': 20, 'mal': 21,
    'decepcion': 22, 'recomiendo': 23, 'compra': 24, 'llego': 25, 'roto': 26,
    'tarde': 27, 'rapido': 28, 'envio': 29, 'precio': 30, 'caro': 31,
    'barato': 32, 'es': 33, 'una': 34, 'el': 35, 'se': 36, 'volveria': 37,
    'comprar': 38, 'nunca': 39, 'siempre': 40, 'lo': 41, 'total': 42,
    'y': 43, 'a': 44, 'la': 45, 'buena': 46, 'mala': 47, 'perfecta': 48,
}

_POS = [
    "me encanta este producto", "la calidad es increible", "funciona muy bien",
    "es genial y barato", "llego rapido y funciona bien", "una compra perfecta",
    "lo recomiendo siempre", "precio barato y buena calidad", "es muy bueno",
    "me gusta este producto",
]
_NEG = [
    "es horrible", "se rompio el primer dia", "una decepcion total",
    "es muy malo", "llego roto y tarde", "precio caro y mala calidad",
    "nunca volveria a comprar", "es una compra mala", "el envio llego tarde",
    "calidad mala y precio caro",
]
_NEG_FLIP = [
    "no me gusta nada", "no funciona nada bien", "no lo recomiendo",
    "no es bueno", "no me gusta este producto",
]
_NEG_POS = [
    "no es malo", "no es horrible", "no es una decepcion",
]
_NEUTRAL = ["este producto", "el producto", "la compra", "el envio"]

def make_reviews(n, seed=1):
    rng = np.random.default_rng(seed)
    cats = rng.choice(4, size=n, p=[0.30, 0.30, 0.25, 0.15])
    seqs, labels = [], []
    for c in cats:
        if c == 0:
            words, y = rng.choice(_POS).split(), 1
        elif c == 1:
            words, y = rng.choice(_NEG).split(), 0
        elif c == 2:
            words, y = rng.choice(_NEG_FLIP).split(), 0
        else:
            words, y = rng.choice(_NEG_POS).split(), 1
        if rng.random() < 0.35:
            words = words + rng.choice(_NEUTRAL).split()
        seqs.append([VOCAB[w] for w in words])
        labels.append(y)
    return seqs, np.array(labels)

D = 16
_rng = np.random.default_rng(42)
E = _rng.normal(0, 1.0, size=(len(VOCAB), D))
E[0] = 0.0

def positional_encoding(max_pos, d):
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE

def encode_batch(seqs, E, max_len):
    B = len(seqs)
    d = E.shape[1]
    X = np.zeros((B, max_len, d))
    mask = np.zeros((B, max_len))
    PE = positional_encoding(max_len, d)
    for b, s in enumerate(seqs):
        L = min(len(s), max_len)
        X[b, :L] = E[np.asarray(s[:L])] + PE[:L]
        mask[b, :L] = 1.0
    return X, mask

# Pesos dados (sin entrenar)
_rngW = np.random.default_rng(0)
Wq = _rngW.normal(0, 0.3, size=(D, D))
Wk = _rngW.normal(0, 0.3, size=(D, D))
Wv = _rngW.normal(0, 0.3, size=(D, D))
w_head = _rngW.normal(0, 0.3, size=(D, 2))
b_head = np.zeros(2)

def sentiment_forward(X, mask, Wq, Wk, Wv, w_head, b_head):
    X = np.asarray(X, dtype=float)
    mask = np.asarray(mask, dtype=float)
    Q = X @ Wq
    K = X @ Wk
    V = X @ Wv
    d = Q.shape[-1]
    scores = Q @ K.transpose(0, 2, 1) / np.sqrt(d)
    scores = scores + (1.0 - mask)[:, None, :] * (-1e9)   # máscara en las keys
    scores = scores - scores.max(axis=-1, keepdims=True)
    e = np.exp(scores)
    attn = e / e.sum(axis=-1, keepdims=True)
    O = attn @ V
    cnt = mask.sum(axis=1, keepdims=True)
    pooled = (O * mask[:, :, None]).sum(axis=1) / cnt     # mean-pooling enmascarado
    logits = pooled @ w_head + b_head
    logits = logits - logits.max(axis=-1, keepdims=True)
    el = np.exp(logits)
    probs = el / el.sum(axis=-1, keepdims=True)
    return probs, attn

# Prueba rápida
seqs, labels = make_reviews(6, seed=9)
X, mask = encode_batch(seqs, E, 8)
probs, attn = sentiment_forward(X, mask, Wq, Wk, Wv, w_head, b_head)
print(probs.round(3))
print("peso hacia keys de padding (debe ser 0):", round(float(attn[0][:, mask[0] == 0].sum()), 6))
`,
    test_code: `
_seqs, _y = make_reviews(24, seed=11)
_Lmax = 8
_X, _mask = encode_batch(_seqs, E, _Lmax)
_probs, _attn = sentiment_forward(_X, _mask, Wq, Wk, Wv, w_head, b_head)

check("Formas: probs (B, 2) y attn (B, L, L)",
      lambda: _probs.shape == (24, 2) and _attn.shape == (24, _Lmax, _Lmax),
      msg=f"Se esperaba (24, 2) y (24, {_Lmax}, {_Lmax}), llegaron {_probs.shape} y {_attn.shape}")
check("probs son probabilidades: cada fila suma 1",
      lambda: np.allclose(_probs.sum(axis=1), 1.0),
      msg="Aplica softmax a los logits de salida")
check("Cada fila de attn suma 1 (softmax por filas sobre las keys)",
      lambda: np.allclose(_attn.sum(axis=-1), 1.0),
      msg="La softmax de la atención se hace a lo largo del eje de las keys (último eje)")
check("Las keys de padding reciben peso ~0",
      lambda: np.allclose(_attn * (1.0 - _mask)[:, None, :], 0.0, atol=1e-6),
      msg="Suma (1 - mask) * (-inf o -1e9) a las puntuaciones antes de la softmax, en el eje de las keys")

# referencia completa, paso a paso
_Q = _X @ Wq
_K = _X @ Wk
_V = _X @ Wv
_s = _Q @ _K.transpose(0, 2, 1) / np.sqrt(_Q.shape[-1]) + (1.0 - _mask)[:, None, :] * (-1e9)
_s = _s - _s.max(axis=-1, keepdims=True)
_e = np.exp(_s)
_attn_ref = _e / _e.sum(axis=-1, keepdims=True)
_O = _attn_ref @ _V
_pooled_ref = (_O * _mask[:, :, None]).sum(axis=1) / _mask.sum(axis=1, keepdims=True)
_logits = _pooled_ref @ w_head + b_head
_logits = _logits - _logits.max(axis=-1, keepdims=True)
_el = np.exp(_logits)
_probs_ref = _el / _el.sum(axis=-1, keepdims=True)

check("Los pesos de atención coinciden con la referencia",
      lambda: np.allclose(_attn, _attn_ref, atol=1e-8),
      msg="Revisa Q = X@Wq, K = X@Wk, el escalado por sqrt(d) y la máscara de padding en las keys")
check("Las probabilidades coinciden con la referencia completa",
      lambda: np.allclose(_probs, _probs_ref, atol=1e-8),
      msg="Revisa O = attn@V, el mean-pooling SOLO sobre tokens reales (divide entre la suma de la máscara) y logits = pooled@w_head + b_head")

# el mean-pooling debe ignorar el padding: mover la máscara cambia el resultado
_X1 = _X[:1]
_m_bad = np.ones_like(_mask[:1])
_p_bad, _ = sentiment_forward(_X1, _m_bad, Wq, Wk, Wv, w_head, b_head)
_p_ok, _ = sentiment_forward(_X1, _mask[:1], Wq, Wk, Wv, w_head, b_head)
check("El pooling usa la máscara (contar el padding cambia el resultado)",
      lambda: not np.allclose(_p_bad, _p_ok, atol=1e-6),
      msg="Divide entre el número de tokens REALES y multiplica O por la máscara antes de sumar")
`,
    hints: [
      'La máscara se aplica sobre las **keys** (último eje): `scores + (1.0 - mask)[:, None, :] * (-1e9)` antes de la softmax estable (resta el máximo por fila).',
      'El pooling enmascarado: `(O * mask[:, :, None]).sum(axis=1) / mask.sum(axis=1, keepdims=True)` — el padding no cuenta ni arriba ni abajo.',
      'Cierra con `logits = pooled @ w_head + b_head` y una softmax estable por filas. Devuelve `(probs, attn)` en ese orden.',
    ],
  },
  {
    id: 'transformers-sent-train',
    title: 'P3 · Entrena el clasificador de sentimiento',
    difficulty: 'AVANZADO',
    xp: 130,
    statement: [
      'La pieza final: **entrenar el modelo de verdad**. Embeddings congelados y una capa de self-attention cuyos pesos $W^Q, W^K, W^V$ se entrenan junto a la cabeza clasificadora — todo con backpropagation escrita a mano y entropía cruzada:',
      '',
      '$$\\mathcal{L} = -\\frac{1}{B}\\sum_i \\log p_i(y_i)$$',
      '',
      'Implementa `forward(X, mask, params)` (el pipeline del ejercicio anterior, con `params = (Wq, Wk, Wv, w_head, b_head)`) y `train(X, mask, y, epochs=400, lr=0.5, seed=0)`, que devuelve la tupla de parámetros entrenada. El backward atraviesa, en orden inverso: la softmax de salida, la cabeza, el pooling (solo tokens reales), el producto $\\mathrm{attn}\\,V$, la softmax de la atención (regla $A \\odot (dA - \\sum dA \\cdot A)$ por filas), el escalado por $\\sqrt{d}$ y las tres proyecciones.',
      '',
      '**Objetivo**: accuracy ≥ 0.90 en test… incluyendo las reseñas con **negación**. Un bag-of-words no puede distinguir «no es malo» de «no es bueno»; tu atención sí puede aprender a combinar el «no» con el adjetivo. Ese es, en miniatura, el trabajo que hace BERT en producción.',
    ].join('\n'),
    starter_code: `import numpy as np

VOCAB = {
    '<pad>': 0, 'me': 1, 'gusta': 2, 'encanta': 3, 'no': 4, 'este': 5,
    'producto': 6, 'calidad': 7, 'increible': 8, 'horrible': 9, 'rompio': 10,
    'primer': 11, 'dia': 12, 'muy': 13, 'nada': 14, 'malo': 15, 'bueno': 16,
    'genial': 17, 'perfecto': 18, 'funciona': 19, 'bien': 20, 'mal': 21,
    'decepcion': 22, 'recomiendo': 23, 'compra': 24, 'llego': 25, 'roto': 26,
    'tarde': 27, 'rapido': 28, 'envio': 29, 'precio': 30, 'caro': 31,
    'barato': 32, 'es': 33, 'una': 34, 'el': 35, 'se': 36, 'volveria': 37,
    'comprar': 38, 'nunca': 39, 'siempre': 40, 'lo': 41, 'total': 42,
    'y': 43, 'a': 44, 'la': 45, 'buena': 46, 'mala': 47, 'perfecta': 48,
}

_POS = [
    "me encanta este producto", "la calidad es increible", "funciona muy bien",
    "es genial y barato", "llego rapido y funciona bien", "una compra perfecta",
    "lo recomiendo siempre", "precio barato y buena calidad", "es muy bueno",
    "me gusta este producto",
]
_NEG = [
    "es horrible", "se rompio el primer dia", "una decepcion total",
    "es muy malo", "llego roto y tarde", "precio caro y mala calidad",
    "nunca volveria a comprar", "es una compra mala", "el envio llego tarde",
    "calidad mala y precio caro",
]
_NEG_FLIP = [
    "no me gusta nada", "no funciona nada bien", "no lo recomiendo",
    "no es bueno", "no me gusta este producto",
]
_NEG_POS = [
    "no es malo", "no es horrible", "no es una decepcion",
]
_NEUTRAL = ["este producto", "el producto", "la compra", "el envio"]

def make_reviews(n, seed=1):
    rng = np.random.default_rng(seed)
    cats = rng.choice(4, size=n, p=[0.30, 0.30, 0.25, 0.15])
    seqs, labels = [], []
    for c in cats:
        if c == 0:
            words, y = rng.choice(_POS).split(), 1
        elif c == 1:
            words, y = rng.choice(_NEG).split(), 0
        elif c == 2:
            words, y = rng.choice(_NEG_FLIP).split(), 0
        else:
            words, y = rng.choice(_NEG_POS).split(), 1
        if rng.random() < 0.35:
            words = words + rng.choice(_NEUTRAL).split()
        seqs.append([VOCAB[w] for w in words])
        labels.append(y)
    return seqs, np.array(labels)

D = 16
_rng = np.random.default_rng(42)
E = _rng.normal(0, 1.0, size=(len(VOCAB), D))
E[0] = 0.0

def positional_encoding(max_pos, d):
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE

def encode_batch(seqs, E, max_len):
    """La función del primer ejercicio, ya implementada."""
    B = len(seqs)
    d = E.shape[1]
    X = np.zeros((B, max_len, d))
    mask = np.zeros((B, max_len))
    PE = positional_encoding(max_len, d)
    for b, s in enumerate(seqs):
        L = min(len(s), max_len)
        X[b, :L] = E[np.asarray(s[:L])] + PE[:L]
        mask[b, :L] = 1.0
    return X, mask

# --- Datos ---
MAX_LEN = 8
seqs_train, y_train = make_reviews(260, seed=1)
seqs_test, y_test = make_reviews(160, seed=2)
X_train, mask_train = encode_batch(seqs_train, E, MAX_LEN)
X_test, mask_test = encode_batch(seqs_test, E, MAX_LEN)

def forward(X, mask, params):
    """probs (B, 2) del clasificador. params = (Wq, Wk, Wv, w_head, b_head)."""
    Wq, Wk, Wv, w_head, b_head = params
    # TODO: el pipeline del ejercicio anterior (atención enmascarada +
    # mean-pooling enmascarado + cabeza + softmax)
    return np.zeros((X.shape[0], 2))

def train(X, mask, y, epochs=400, lr=0.5, seed=0):
    """
    Entrena (Wq, Wk, Wv, w_head, b_head) por descenso de gradiente con batch
    completo y entropía cruzada. Los embeddings E quedan congelados.
    Devuelve la tupla de parámetros entrenada.
    """
    rng = np.random.default_rng(seed)
    d = X.shape[2]
    Wq = rng.normal(0, 0.3, size=(d, d))
    Wk = rng.normal(0, 0.3, size=(d, d))
    Wv = rng.normal(0, 0.3, size=(d, d))
    w_head = rng.normal(0, 0.3, size=(d, 2))
    b_head = np.zeros(2)
    B = X.shape[0]
    y_oh = np.zeros((B, 2))
    y_oh[np.arange(B), y] = 1.0
    for ep in range(epochs):
        # TODO forward CON CACHÉ (guarda Q, K, V, A, O, pooled)
        # TODO backward: dlogits = (probs - y_oh) / B y regla de la cadena
        # hacia atrás por cabeza, pooling, attn@V, softmax de atención,
        # escalado y proyecciones; actualiza los 5 parámetros
        pass
    return Wq, Wk, Wv, w_head, b_head

params = train(X_train, mask_train, y_train)
probs_test = forward(X_test, mask_test, params)
acc = float(np.mean(probs_test.argmax(axis=1) == y_test))
print("accuracy test:", round(acc, 3))
`,
    solution_code: `import numpy as np

VOCAB = {
    '<pad>': 0, 'me': 1, 'gusta': 2, 'encanta': 3, 'no': 4, 'este': 5,
    'producto': 6, 'calidad': 7, 'increible': 8, 'horrible': 9, 'rompio': 10,
    'primer': 11, 'dia': 12, 'muy': 13, 'nada': 14, 'malo': 15, 'bueno': 16,
    'genial': 17, 'perfecto': 18, 'funciona': 19, 'bien': 20, 'mal': 21,
    'decepcion': 22, 'recomiendo': 23, 'compra': 24, 'llego': 25, 'roto': 26,
    'tarde': 27, 'rapido': 28, 'envio': 29, 'precio': 30, 'caro': 31,
    'barato': 32, 'es': 33, 'una': 34, 'el': 35, 'se': 36, 'volveria': 37,
    'comprar': 38, 'nunca': 39, 'siempre': 40, 'lo': 41, 'total': 42,
    'y': 43, 'a': 44, 'la': 45, 'buena': 46, 'mala': 47, 'perfecta': 48,
}

_POS = [
    "me encanta este producto", "la calidad es increible", "funciona muy bien",
    "es genial y barato", "llego rapido y funciona bien", "una compra perfecta",
    "lo recomiendo siempre", "precio barato y buena calidad", "es muy bueno",
    "me gusta este producto",
]
_NEG = [
    "es horrible", "se rompio el primer dia", "una decepcion total",
    "es muy malo", "llego roto y tarde", "precio caro y mala calidad",
    "nunca volveria a comprar", "es una compra mala", "el envio llego tarde",
    "calidad mala y precio caro",
]
_NEG_FLIP = [
    "no me gusta nada", "no funciona nada bien", "no lo recomiendo",
    "no es bueno", "no me gusta este producto",
]
_NEG_POS = [
    "no es malo", "no es horrible", "no es una decepcion",
]
_NEUTRAL = ["este producto", "el producto", "la compra", "el envio"]

def make_reviews(n, seed=1):
    rng = np.random.default_rng(seed)
    cats = rng.choice(4, size=n, p=[0.30, 0.30, 0.25, 0.15])
    seqs, labels = [], []
    for c in cats:
        if c == 0:
            words, y = rng.choice(_POS).split(), 1
        elif c == 1:
            words, y = rng.choice(_NEG).split(), 0
        elif c == 2:
            words, y = rng.choice(_NEG_FLIP).split(), 0
        else:
            words, y = rng.choice(_NEG_POS).split(), 1
        if rng.random() < 0.35:
            words = words + rng.choice(_NEUTRAL).split()
        seqs.append([VOCAB[w] for w in words])
        labels.append(y)
    return seqs, np.array(labels)

D = 16
_rng = np.random.default_rng(42)
E = _rng.normal(0, 1.0, size=(len(VOCAB), D))
E[0] = 0.0

def positional_encoding(max_pos, d):
    PE = np.zeros((max_pos, d))
    pos = np.arange(max_pos)[:, None]
    i = np.arange(d)[None, :]
    angle = pos / np.power(10000.0, (2 * (i // 2)) / d)
    PE[:, 0::2] = np.sin(angle[:, 0::2])
    PE[:, 1::2] = np.cos(angle[:, 1::2])
    return PE

def encode_batch(seqs, E, max_len):
    B = len(seqs)
    d = E.shape[1]
    X = np.zeros((B, max_len, d))
    mask = np.zeros((B, max_len))
    PE = positional_encoding(max_len, d)
    for b, s in enumerate(seqs):
        L = min(len(s), max_len)
        X[b, :L] = E[np.asarray(s[:L])] + PE[:L]
        mask[b, :L] = 1.0
    return X, mask

# --- Datos ---
MAX_LEN = 8
seqs_train, y_train = make_reviews(260, seed=1)
seqs_test, y_test = make_reviews(160, seed=2)
X_train, mask_train = encode_batch(seqs_train, E, MAX_LEN)
X_test, mask_test = encode_batch(seqs_test, E, MAX_LEN)

def forward(X, mask, params):
    Wq, Wk, Wv, w_head, b_head = params
    Q = X @ Wq
    K = X @ Wk
    V = X @ Wv
    d = Q.shape[-1]
    scores = Q @ K.transpose(0, 2, 1) / np.sqrt(d)
    scores = scores + (1.0 - mask)[:, None, :] * (-1e9)
    scores = scores - scores.max(axis=-1, keepdims=True)
    e = np.exp(scores)
    attn = e / e.sum(axis=-1, keepdims=True)
    O = attn @ V
    pooled = (O * mask[:, :, None]).sum(axis=1) / mask.sum(axis=1, keepdims=True)
    logits = pooled @ w_head + b_head
    logits = logits - logits.max(axis=-1, keepdims=True)
    el = np.exp(logits)
    return el / el.sum(axis=-1, keepdims=True)

def train(X, mask, y, epochs=400, lr=0.5, seed=0):
    rng = np.random.default_rng(seed)
    d = X.shape[2]
    Wq = rng.normal(0, 0.3, size=(d, d))
    Wk = rng.normal(0, 0.3, size=(d, d))
    Wv = rng.normal(0, 0.3, size=(d, d))
    w_head = rng.normal(0, 0.3, size=(d, 2))
    b_head = np.zeros(2)
    B = X.shape[0]
    y_oh = np.zeros((B, 2))
    y_oh[np.arange(B), y] = 1.0
    for ep in range(epochs):
        # forward con caché
        Q = X @ Wq
        K = X @ Wk
        V = X @ Wv
        scores = Q @ K.transpose(0, 2, 1) / np.sqrt(d)
        scores = scores + (1.0 - mask)[:, None, :] * (-1e9)
        scores = scores - scores.max(axis=-1, keepdims=True)
        e = np.exp(scores)
        A = e / e.sum(axis=-1, keepdims=True)
        O = A @ V
        cnt = mask.sum(axis=1, keepdims=True)
        pooled = (O * mask[:, :, None]).sum(axis=1) / cnt
        logits = pooled @ w_head + b_head
        logits = logits - logits.max(axis=-1, keepdims=True)
        el = np.exp(logits)
        probs = el / el.sum(axis=-1, keepdims=True)
        loss = -float(np.mean(np.sum(y_oh * np.log(probs + 1e-12), axis=1)))
        # backward
        dlogits = (probs - y_oh) / B
        dw_head = pooled.T @ dlogits
        db_head = dlogits.sum(axis=0)
        dpooled = dlogits @ w_head.T
        dO = dpooled[:, None, :] * mask[:, :, None] / cnt[:, :, None]
        dA = dO @ V.transpose(0, 2, 1)
        dV = A.transpose(0, 2, 1) @ dO
        dscores = A * (dA - (dA * A).sum(axis=-1, keepdims=True))
        dscores = dscores * mask[:, None, :]
        dQ = dscores @ K / np.sqrt(d)
        dK = dscores.transpose(0, 2, 1) @ Q / np.sqrt(d)
        Wq -= lr * (X.transpose(0, 2, 1) @ dQ).sum(axis=0)
        Wk -= lr * (X.transpose(0, 2, 1) @ dK).sum(axis=0)
        Wv -= lr * (X.transpose(0, 2, 1) @ dV).sum(axis=0)
        w_head -= lr * dw_head
        b_head -= lr * db_head
    return Wq, Wk, Wv, w_head, b_head

params = train(X_train, mask_train, y_train)
probs_test = forward(X_test, mask_test, params)
acc = float(np.mean(probs_test.argmax(axis=1) == y_test))
print("accuracy test:", round(acc, 3))
`,
    test_code: `
_probs_tr = forward(X_train, mask_train, params)
_probs_te = forward(X_test, mask_test, params)
check("forward devuelve probabilidades (B, 2) que suman 1",
      lambda: _probs_te.shape == (len(y_test), 2) and np.allclose(_probs_te.sum(axis=1), 1.0),
      msg="forward debe devolver la softmax de los logits, forma (B, 2)")

_acc_tr = float(np.mean(_probs_tr.argmax(axis=1) == y_train))
_acc_te = float(np.mean(_probs_te.argmax(axis=1) == y_test))
check("El modelo aprende: accuracy en train ≥ 0.95",
      lambda: _acc_tr >= 0.95,
      msg=f"Accuracy train {_acc_tr:.3f}: revisa el bucle de entrenamiento y el backprop")
check("Generaliza: accuracy en test ≥ 0.90",
      lambda: _acc_te >= 0.90,
      msg=f"Accuracy test {_acc_te:.3f}: el modelo debe generalizar a reseñas nuevas")
check("Mejor que el azar de verdad: accuracy ≥ 0.75 incluso sin mirar la clase mayoritaria",
      lambda: _acc_te >= 0.75 and _acc_tr >= 0.75,
      msg="Umbral mínimo de aprendizaje")

_no = VOCAB['no']
_neg = np.array([_no in s for s in seqs_test])
_acc_neg = float(np.mean(_probs_te.argmax(axis=1)[_neg] == y_test[_neg]))
check("Acierta las reseñas con negación ('no ...'): accuracy ≥ 0.90 en ese subconjunto",
      lambda: _acc_neg >= 0.90,
      msg=f"Accuracy con negación {_acc_neg:.3f}: la atención tiene que aprender a combinar 'no' con el adjetivo")
check("El subconjunto de negación no es trivial (al menos 30 ejemplos)",
      lambda: _neg.sum() >= 30,
      msg="Comprueba que estás evaluando sobre las reseñas que contienen 'no'")
`,
    hints: [
      'Reutiliza tu `forward` del ejercicio anterior pero guardando las intermedias (`Q, K, V, A, O, pooled`): las necesitas todas en el backward.',
      'El gradiente de la softmax de atención por filas es `A * (dA - (dA * A).sum(axis=-1, keepdims=True))`; anula después las keys de padding multiplicando por `mask[:, None, :]`.',
      'Con batch completo, `lr=0.5` y 400 épocas la accuracy de test supera 0.95. Si no aprende, revisa que `dlogits = (probs - y_oh) / B` y que acumulas `X.transpose(0,2,1) @ dQ` sumado sobre el batch.',
    ],
  },
]

registerExercises(TRANSFORMERS_EXERCISES)
