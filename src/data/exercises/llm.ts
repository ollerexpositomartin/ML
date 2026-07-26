/**
 * Ejercicios del módulo LLMs modernos (N8).
 * Cada solution_code pasa su propio test_code al 100% (verificado localmente
 * con python3 + numpy y un shim de check()).
 */
import type { Exercise } from '@/lib/exercises'
import { registerExercises } from '@/lib/exercises'

export const LLM_EXERCISES: Exercise[] = [
  {
    id: 'llm-rope',
    title: 'E1 · RoPE: posición por rotación',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: [
      'Los LLM modernos ya no suman una codificación posicional: **rotan** cada vector query/key. Implementa `aplicar_rope(x, pos, base=10000.0)` que aplique **RoPE** al vector `x` (dimensión $d$, par) en la posición entera `pos`:',
      '',
      '$$\\begin{pmatrix} x\'_{2i} \\\\ x\'_{2i+1} \\end{pmatrix} = \\begin{pmatrix} \\cos\\theta_i & -\\sin\\theta_i \\\\ \\sin\\theta_i & \\phantom{-}\\cos\\theta_i \\end{pmatrix} \\begin{pmatrix} x_{2i} \\\\ x_{2i+1} \\end{pmatrix}, \\qquad \\theta_i = \\mathrm{pos} \\cdot \\mathrm{base}^{-2i/d}$$',
      '',
      'Es decir: agrupa las $d$ componentes en $d/2$ parejas y gira cada pareja un ángulo distinto (las primeras giran rápido, las últimas muy despacio).',
      '',
      'La propiedad mágica que comprobarán los tests: $\\mathrm{RoPE}(q, m) \\cdot \\mathrm{RoPE}(k, n)$ **solo depende de la distancia** $m - n$, no de las posiciones absolutas.',
    ].join('\n'),
    starter_code: `import numpy as np

def aplicar_rope(x, pos, base=10000.0):
    """
    Aplica RoPE al vector x (dim d, par) en la posición 'pos'.
    Cada pareja (x[2i], x[2i+1]) se rota el ángulo pos · base^(-2i/d).
    Devuelve un vector de la misma forma que x.
    """
    x = np.asarray(x, dtype=float)
    d = x.shape[0]
    # TODO: agrupa en parejas, calcula los ángulos y rota cada pareja
    return x.copy()

# Prueba rápida
q = np.array([1.0, 0.0, 0.0, 1.0])
print(aplicar_rope(q, 0))   # debe ser idéntico a q (ángulo 0)
print(aplicar_rope(q, 2))   # cada pareja rotada
`,
    solution_code: `import numpy as np

def aplicar_rope(x, pos, base=10000.0):
    """Aplica RoPE al vector x (dim d, par) en la posición 'pos'."""
    x = np.asarray(x, dtype=float)
    d = x.shape[0]
    pares = x.reshape(-1, 2)                       # (d/2, 2)
    i = np.arange(d // 2)
    theta = base ** (-2.0 * i / d)                 # frecuencias por par
    ang = pos * theta                              # ángulo de cada par
    c, s = np.cos(ang), np.sin(ang)
    r0 = pares[:, 0] * c - pares[:, 1] * s
    r1 = pares[:, 0] * s + pares[:, 1] * c
    return np.stack([r0, r1], axis=1).reshape(d)
`,
    test_code: `
rng = np.random.default_rng(0)
d = 16
q = rng.normal(size=d)
k = rng.normal(size=d)

check("Devuelve un vector de la misma dimensión", lambda: aplicar_rope(q, 3).shape == (d,),
      msg="aplicar_rope(x, pos) debe devolver un vector de la misma forma que x")

check("RoPE conserva la norma (es una rotación)", lambda: np.allclose(np.linalg.norm(aplicar_rope(q, 7)), np.linalg.norm(q)),
      msg="Una rotación no cambia la longitud del vector: ||rope(x)|| debe ser ||x||")

def _ref_rope(x, pos, base=10000.0):
    d = x.shape[0]
    R = np.zeros((d, d))
    for i in range(d // 2):
        a = pos * base ** (-2.0 * i / d)
        R[2*i, 2*i] = np.cos(a); R[2*i, 2*i+1] = -np.sin(a)
        R[2*i+1, 2*i] = np.sin(a); R[2*i+1, 2*i+1] = np.cos(a)
    return R @ x

check("Coincide con la matriz de rotación por bloques", lambda: np.allclose(aplicar_rope(q, 5), _ref_rope(q, 5), atol=1e-10),
      msg="Cada par (x_2i, x_2i+1) debe rotarse el ángulo pos·base^(-2i/d)")

m, n, shift = 4, 1, 9
d1 = float(aplicar_rope(q, m) @ aplicar_rope(k, n))
d2 = float(aplicar_rope(q, m + shift) @ aplicar_rope(k, n + shift))
check("El producto punto solo depende de la posición relativa", lambda: np.allclose(d1, d2, atol=1e-10),
      msg="rope(q,m)·rope(k,n) debe ser igual a rope(q,m+s)·rope(k,n+s): solo importa m-n")

check("Posición cero es la identidad", lambda: np.allclose(aplicar_rope(q, 0), q),
      msg="Con pos=0 el ángulo es 0: el vector no debería cambiar")
`,
    hints: [
      '`x.reshape(-1, 2)` te da las parejas; las frecuencias son `base ** (-2*np.arange(d//2)/d)`.',
      'Para cada pareja: $x\'_0 = x_0\\cos\\theta - x_1\\sin\\theta$ y $x\'_1 = x_0\\sin\\theta + x_1\\cos\\theta$, con $\\theta = \\mathrm{pos}\\cdot\\mathrm{base}^{-2i/d}$.',
      'Reconstruye con `np.stack([r0, r1], axis=1).reshape(d)` para mantener el orden intercalado.',
    ],
  },
  {
    id: 'llm-kv-cache',
    title: 'E2 · KV cache: generar sin recomputar',
    difficulty: 'INTERMEDIO',
    xp: 90,
    statement: [
      'En generación autoregresiva, recomputar las K y V de **toda** la secuencia en cada paso es tirar el dinero: los tokens viejos no cambian. La **KV cache** guarda los $k_t, v_t$ ya calculados y cada paso solo proyecta el token nuevo.',
      '',
      'Implementa dos funciones:',
      '',
      '- `paso_con_cache(x_t, Wq, Wk, Wv, cache)`: proyecta el token nuevo `x_t` (vector de tamaño `d_model`), **añade** su $k$ y su $v$ a la caché y devuelve `(out_t, cache_actualizado)`. `out_t` es la atención de la query nueva sobre **todo** lo cacheado: $\\mathrm{softmax}(K q / \\sqrt{d_k})\\, V$.\n- `generar(X, Wq, Wk, Wv)`: aplica `paso_con_cache` token a token (caché inicial vacía: arrays de 0 filas) y devuelve `(salidas, cache_final)` con `salidas` de forma $(T, d_v)$.',
      '',
      'Los tests comprueban que el resultado es **idéntico** (a 1e-10) a la atención causal completa sin caché: la caché es velocidad pura, no aproximación.',
    ].join('\n'),
    starter_code: `import numpy as np

def paso_con_cache(x_t, Wq, Wk, Wv, cache):
    """
    Un paso de generación con KV cache.
    x_t: (d_model,) embedding del token nuevo.
    cache: dict con 'K' (t, d_k) y 'V' (t, d_v) de los tokens anteriores.
    Devuelve (out_t, cache_actualizado) donde out_t es (d_v,).
    """
    q = x_t @ Wq
    k_nuevo = x_t @ Wk
    v_nuevo = x_t @ Wv
    # TODO: apila k_nuevo/v_nuevo en la caché (np.vstack), calcula los
    # scores K @ q / sqrt(d_k), softmax estable y mezcla V
    out = np.zeros(cache['V'].shape[1] if cache['V'].size else Wv.shape[1])
    return out, cache

def generar(X, Wq, Wk, Wv):
    """Generación autoregresiva: un paso por token, caché vacía al inicio."""
    cache = {'K': np.zeros((0, Wk.shape[1])), 'V': np.zeros((0, Wv.shape[1]))}
    outs = []
    for t in range(X.shape[0]):
        out, cache = paso_con_cache(X[t], Wq, Wk, Wv, cache)
        outs.append(out)
    return np.stack(outs), cache

# Prueba rápida
rng = np.random.default_rng(0)
X = rng.normal(size=(4, 8))
Wq = rng.normal(size=(8, 4)); Wk = rng.normal(size=(8, 4)); Wv = rng.normal(size=(8, 4))
outs, cache = generar(X, Wq, Wk, Wv)
print(outs.shape, cache['K'].shape)  # (4, 4) (4, 4)
`,
    solution_code: `import numpy as np

def paso_con_cache(x_t, Wq, Wk, Wv, cache):
    """
    Un paso de generación con KV cache.
    x_t: (d_model,) embedding del token nuevo.
    cache: dict con 'K' (t, d_k) y 'V' (t, d_v) de los tokens anteriores.
    Devuelve (out_t, cache_actualizado) donde out_t es (d_v,).
    """
    q = x_t @ Wq                                  # (d_k,)
    k_nuevo = x_t @ Wk
    v_nuevo = x_t @ Wv
    K = np.vstack([cache['K'], k_nuevo])          # añadimos al final
    V = np.vstack([cache['V'], v_nuevo])
    scores = (K @ q) / np.sqrt(q.shape[0])        # (t+1,)
    scores = scores - scores.max()                # softmax estable
    w = np.exp(scores) / np.exp(scores).sum()
    out = w @ V
    return out, {'K': K, 'V': V}

def generar(X, Wq, Wk, Wv):
    """Generación autoregresiva: un paso por token, caché vacía al inicio."""
    cache = {'K': np.zeros((0, Wk.shape[1])), 'V': np.zeros((0, Wv.shape[1]))}
    outs = []
    for t in range(X.shape[0]):
        out, cache = paso_con_cache(X[t], Wq, Wk, Wv, cache)
        outs.append(out)
    return np.stack(outs), cache
`,
    test_code: `
rng = np.random.default_rng(1)
T, dm, dk, dv = 6, 8, 4, 4
X = rng.normal(size=(T, dm))
Wq = rng.normal(size=(dm, dk)); Wk = rng.normal(size=(dm, dk)); Wv = rng.normal(size=(dm, dv))

outs, cache = generar(X, Wq, Wk, Wv)

check("La salida tiene forma (T, d_v)", lambda: outs.shape == (T, dv),
      msg="generar debe devolver una salida por cada token: (T, d_v)")

check("La caché final contiene los T tokens", lambda: cache['K'].shape == (T, dk) and cache['V'].shape == (T, dv),
      msg="Tras T pasos la caché debe tener T filas de K y T de V")

# Referencia sin caché: atención causal completa recalculando todo
def _ref_full(X, Wq, Wk, Wv):
    Q = X @ Wq; K = X @ Wk; V = X @ Wv
    T = X.shape[0]
    S = Q @ K.T / np.sqrt(dk)
    mask = np.triu(np.ones((T, T)), k=1).astype(bool)
    S = np.where(mask, -np.inf, S)
    S = S - S.max(axis=1, keepdims=True)
    W_ = np.exp(S) / np.exp(S).sum(axis=1, keepdims=True)
    return W_ @ V

check("Con caché da IDÉNTICO resultado que recomputando todo", lambda: np.allclose(outs, _ref_full(X, Wq, Wk, Wv), atol=1e-10),
      msg="La KV cache es solo una optimización: el resultado debe ser exactamente el mismo que la atención causal completa")

check("El paso 1 solo se atiende a sí mismo (out = v_0)", lambda: np.allclose(outs[0], X[0] @ Wv),
      msg="En el primer paso la caché tiene 1 token: la softmax es 1.0 y la salida es su value")

check("La caché guarda exactamente K = X·Wk (sin recomputar)", lambda: np.allclose(cache['K'], X @ Wk),
      msg="cache['K'] debe ser la concatenación de los k_t = x_t·Wk de cada paso")
`,
    hints: [
      'En cada paso, la caché nueva es `np.vstack([cache[\'K\'], k_nuevo])` — una fila más que antes.',
      'Los scores son `K @ q / np.sqrt(d_k)`: la query nueva contra **todas** las K cacheadas (incluida la suya).',
      'Usa softmax estable: resta el máximo antes de `np.exp`. La salida es `w @ V` con `w` los pesos.',
    ],
  },
  {
    id: 'llm-gqa',
    title: 'E3 · GQA: cabezas que comparten K/V',
    difficulty: 'BASICO',
    xp: 50,
    statement: [
      'La KV cache crece con el número de **cabezas**. **Grouped-Query Attention (GQA)** recorta esa memoria: las $H$ cabezas de query se reparten en $G$ grupos y todas las cabezas de un grupo **comparten** el mismo par $K, V$. Con $G = 1$ se llama MQA (Multi-Query); con $G = H$ es la atención multi-cabeza clásica.',
      '',
      'Implementa `expandir_kv_gqa(K, V, num_cabezas)` que recibe `K` $(G, S, d_k)$ y `V` $(G, S, d_v)$ — $S$ posiciones de secuencia por grupo — y devuelve `(K_exp, V_exp)` de forma $(H, S, \\cdot)$ donde el grupo $g$ se repite para las cabezas $[g \\cdot H/G,\\; (g+1) \\cdot H/G)$.',
      '',
      'Expandir es solo una forma de *verlo*: el cómputo real nunca materializa la copia, pero comprobarás que cada cabeza obtiene **exactamente** el mismo resultado atendiendo a su grupo que a su copia expandida.',
    ].join('\n'),
    starter_code: `import numpy as np

def expandir_kv_gqa(K, V, num_cabezas):
    """
    Grouped-Query Attention: K (G, S, dk) y V (G, S, dv) contienen las K/V
    de G grupos; cada grupo sirve a num_cabezas // G cabezas de query.
    Devuelve (K_exp, V_exp) de forma (num_cabezas, S, ·): el grupo g ocupa
    las cabezas [g·(H/G) : (g+1)·(H/G)].
    """
    # TODO: repite cada grupo H/G veces SEGUIDAS sobre el eje 0
    return K, V

# Prueba rápida
K = np.arange(2*3*1).reshape(2, 3, 1)   # G=2 grupos, S=3 posiciones, dk=1
V = K + 100
K_exp, V_exp = expandir_kv_gqa(K, V, 4)
print(K_exp[:, 0, 0])  # esperado: [0 0 3 3] -> grupo 0 a las cabezas 0-1, grupo 1 a las 2-3
`,
    solution_code: `import numpy as np

def expandir_kv_gqa(K, V, num_cabezas):
    """
    Grouped-Query Attention: K (G, S, dk) y V (G, S, dv) contienen las K/V de
    G grupos; cada grupo sirve a num_cabezas // G cabezas de query.
    Devuelve (K_exp, V_exp) de forma (num_cabezas, S, ·): el grupo g ocupa
    las cabezas [g·(H/G) : (g+1)·(H/G)].
    """
    rep = num_cabezas // K.shape[0]
    return np.repeat(K, rep, axis=0), np.repeat(V, rep, axis=0)
`,
    test_code: `
rng = np.random.default_rng(2)
G, H, S, dk, dv = 2, 8, 5, 4, 4
K = rng.normal(size=(G, S, dk)); V = rng.normal(size=(G, S, dv))
K_exp, V_exp = expandir_kv_gqa(K, V, H)

check("Devuelve un par de K/V por cada cabeza", lambda: K_exp.shape == (H, S, dk) and V_exp.shape == (H, S, dv),
      msg="Con H cabezas, K_exp debe ser (H, S, dk) y V_exp (H, S, dv)")

check("Cada grupo se repite H/G veces seguidas y en orden", lambda: np.allclose(K_exp, np.stack([K[g] for g in range(G) for _ in range(H // G)])),
      msg="El grupo 0 debe ocupar las primeras H/G cabezas, el grupo 1 las siguientes, etc. (np.repeat sobre el eje 0)")

check("GQA con H = G es multi-head clásico (sin compartir)", lambda: np.allclose(expandir_kv_gqa(K, V, G)[0], K),
      msg="Si H == G no se comparte nada: la expansión debe ser la identidad")

check("GQA con G = 1 es MQA: todas las cabezas usan el mismo K/V", lambda: np.allclose(expandir_kv_gqa(K[:1], V[:1], H)[0], np.repeat(K[:1], H, axis=0)),
      msg="Multi-Query Attention es el caso extremo: un único K/V replicado en todas las cabezas")

# Equivalencia funcional: la cabeza h atendiendo a K_exp[h] == atendiendo a su grupo K[h//(H/G)]
def _attn(Qh, Kh, Vh):
    s = Qh @ Kh.T / np.sqrt(Qh.shape[-1])
    w = np.exp(s - s.max(axis=-1, keepdims=True))
    w /= w.sum(axis=-1, keepdims=True)
    return w @ Vh

Q = rng.normal(size=(H, S, dk))
rep = H // G
ok_equiv = all(np.allclose(_attn(Q[h], K_exp[h], V_exp[h]), _attn(Q[h], K[h // rep], V[h // rep]), atol=1e-10) for h in range(H))
check("Expandir es solo notación: cada cabeza da lo mismo con su grupo", cond=ok_equiv,
      msg="La cabeza h debe producir exactamente la misma atención con K_exp[h] que con K[h//(H/G)]: compartir no cambia el cálculo, solo la memoria")
`,
    hints: [
      '`np.repeat(K, rep, axis=0)` repite cada elemento del eje 0 `rep` veces seguidas: justo el reparto por grupos.',
      'Ojo: `np.tile` repite el bloque entero (grupo 0, 1, 0, 1, …) — no es lo que queremos. `np.repeat` da (0, 0, 1, 1, …).',
      'El número de repeticiones es `num_cabezas // K.shape[0]`.',
    ],
  },
  {
    id: 'llm-dpo-loss',
    title: 'E4 · La pérdida DPO',
    difficulty: 'INTERMEDIO',
    xp: 90,
    statement: [
      '**DPO** (Direct Preference Optimization) alinea el modelo sin reward model ni PPO: directamente compara cuánto le gustan al modelo la respuesta preferida $y_w$ y la rechazada $y_l$, **relativas** a un modelo de referencia $\\pi_{ref}$ congelado:',
      '',
      '$$\\mathcal{L}_{DPO} = -\\log \\sigma\\!\\left( \\beta \\left[ \\log \\frac{\\pi_\\theta(y_w \\mid x)}{\\pi_{ref}(y_w \\mid x)} - \\log \\frac{\\pi_\\theta(y_l \\mid x)}{\\pi_{ref}(y_l \\mid x)} \\right] \\right)$$',
      '',
      'Implementa `dpo_loss(lp_pol_w, lp_ref_w, lp_pol_l, lp_ref_l, beta=0.1)` que recibe **log-probabilidades** (arrays con un valor por par del lote) y devuelve la **media** de la pérdida sobre el lote.',
      '',
      'Pistas de implementación: $\\log \\frac{a}{b} = \\log a - \\log b$ (ya te dan los logaritmos) y $-\\log \\sigma(z)$ se escribe de forma numéricamente estable como `np.logaddexp(0.0, -z)`.',
    ].join('\n'),
    starter_code: `import numpy as np

def dpo_loss(lp_pol_w, lp_ref_w, lp_pol_l, lp_ref_l, beta=0.1):
    """
    Pérdida DPO para un lote de pares (preferida y_w, rechazada y_l).
    lp_*: log-probabilidades (arrays) de la política y del modelo de referencia.
    Devuelve la media de -log sigmoid(beta · (dif_w - dif_l)).
    """
    # TODO: z = beta · ((lp_pol_w - lp_ref_w) - (lp_pol_l - lp_ref_l))
    # pérdida = media de -log sigmoid(z)   (usa np.logaddexp para estabilidad)
    return 0.0

# Prueba rápida: política = referencia -> z = 0 -> pérdida = log(2) ≈ 0.693
print(dpo_loss([-1.0], [-1.0], [-2.0], [-2.0]))
`,
    solution_code: `import numpy as np

def dpo_loss(lp_pol_w, lp_ref_w, lp_pol_l, lp_ref_l, beta=0.1):
    """
    Pérdida DPO para un lote de pares (preferida y_w, rechazada y_l).
    lp_*: log-probabilidades (arrays) de la política y del modelo de referencia.
    Devuelve la media de -log sigmoid(beta * (dif_w - dif_l)).
    """
    dif_w = np.asarray(lp_pol_w) - np.asarray(lp_ref_w)
    dif_l = np.asarray(lp_pol_l) - np.asarray(lp_ref_l)
    z = beta * (dif_w - dif_l)
    # -log sigmoid(z) = softplus(-z), estable numéricamente
    loss = np.logaddexp(0.0, -z)
    return float(np.mean(loss))
`,
    test_code: `
# Caso manual: política = referencia en todo -> z = 0 -> loss = log(2)
check("Si la política copia al ref, la pérdida es log(2)", lambda: np.allclose(dpo_loss([-1.0], [-1.0], [-2.0], [-2.0]), np.log(2), atol=1e-10),
      msg="Con z=0, -log σ(0) = -log(0.5) = log 2 ≈ 0.693")

# Fórmula explícita
pw, rw, pl, rl = -0.5, -1.0, -3.0, -1.5
beta = 0.5
z = beta * ((pw - rw) - (pl - rl))
esperado = -np.log(1.0 / (1.0 + np.exp(-z)))
check("Coincide con la fórmula -log σ(β(Δw − Δl))", lambda: np.allclose(dpo_loss([pw], [rw], [pl], [rl], beta=beta), esperado, atol=1e-10),
      msg="z = beta·((lp_pol_w − lp_ref_w) − (lp_pol_l − lp_ref_l)); pérdida = −log sigmoid(z)")

# Aumentar lp_pol_w (manteniendo todo lo demás) debe BAJAR la pérdida
l1 = dpo_loss([-1.0], [-1.0], [-2.0], [-2.0])
l2 = dpo_loss([-0.2], [-1.0], [-2.0], [-2.0])
check("Subir la prob. de la respuesta preferida baja la pérdida", lambda: l2 < l1,
      msg="Si la política da más prob. a y_w (sin mover y_l), la pérdida DPO debe disminuir")

# Simetría: mover la preferida igual que la rechazada no cambia nada
a = dpo_loss([-1.0], [-1.0], [-2.0], [-2.0])
b = dpo_loss([-0.5], [-1.0], [-1.5], [-2.0])
check("Lo que importa es el MARGEN, no el nivel absoluto", lambda: np.allclose(a, b, atol=1e-10),
      msg="Subir +0.5 tanto a y_w como a y_l deja z intacto: DPO premia el margen entre preferida y rechazada")

# Lote: media de varios pares
zs = np.array([0.3, -0.7, 1.2])
manual = np.mean(-np.log(1/(1+np.exp(-zs))))
check("Promedia correctamente sobre un lote", lambda: np.allclose(dpo_loss(zs, np.zeros(3), np.zeros(3), np.zeros(3), beta=1.0), manual, atol=1e-10),
      msg="Con un lote, la pérdida es la MEDIA de -log sigmoid(z) de cada par")
`,
    hints: [
      'Cada cociente de probabilidades ya viene en logaritmos: $\\log \\frac{\\pi_\\theta}{\\pi_{ref}} = lp_{pol} - lp_{ref}$.',
      'El argumento de la sigmoide es $z = \\beta\\,[(lp_{pol,w} - lp_{ref,w}) - (lp_{pol,l} - lp_{ref,l})]$.',
      '`np.logaddexp(0.0, -z)` calcula $\\log(1 + e^{-z}) = -\\log\\sigma(z)$ sin desbordar. Devuelve la media con `float(np.mean(...))`.',
    ],
  },
  {
    id: 'llm-mini-rag',
    title: 'E5 · Mini-RAG: recuperar antes de responder',
    difficulty: 'INTERMEDIO',
    xp: 90,
    statement: [
      '**RAG** (Retrieval-Augmented Generation) en tres piezas: (1) convierte documentos y pregunta en vectores, (2) recupera los $k$ documentos más afines por **similitud coseno**, (3) los pega en el prompt como contexto.',
      '',
      'Implementa las tres funciones con **embeddings de juguete** deterministas (bolsa de palabras hasheada):',
      '',
      '- `embed(texto, dim=64)`: para cada token (minúsculas, separado por espacios), genera un vector pseudoaleatorio de $\\pm 1$ con semilla `sum((i+1)*ord(ch) for i, ch in enumerate(tok))` vía `np.random.default_rng(semilla)` y `rng.choice([-1.0, 1.0], size=dim)`; súmalos y **normaliza** el resultado (norma 1).\n- `buscar(query, docs, k=2)`: devuelve la **lista de índices** de los $k$ documentos con mayor coseno, de mayor a menor.\n- `construir_contexto(query, docs, k=2)`: concatena los textos recuperados separados por `"\\n---\\n"`.',
      '',
      'Con embeddings de verdad (de un modelo entrenado) la semántica sustituiría al truco del hash, pero el pipeline es idéntico.',
    ].join('\n'),
    starter_code: `import numpy as np

def embed(texto, dim=64):
    """Embedding de juguete determinista: bolsa de palabras hasheada."""
    v = np.zeros(dim)
    for tok in texto.lower().split():
        # TODO: semilla determinista a partir del token (suma de ords ponderada),
        # vector de ±1 con esa semilla, acumular en v
        pass
    # TODO: normalizar (norma 1); si la norma es 0, devolver v tal cual
    return v

def buscar(query, docs, k=2):
    """Devuelve los índices de los k documentos más afines (coseno)."""
    # TODO: similitudes query↔doc y orden descendente
    return []

def construir_contexto(query, docs, k=2):
    """Recupera top-k y ensambla el contexto para el prompt."""
    # TODO: une los textos de buscar() con "\\n---\\n"
    return ""

# Prueba rápida
docs = ["el gato duerme en el sofa",
        "la fisica cuantica estudia particulas subatomicas",
        "los gatos son animales independientes y domesticos"]
print(buscar("gato sofa", docs, k=2))        # esperado: [0, ...]
print(construir_contexto("gato sofa", docs)) # el doc del gato, primero
`,
    solution_code: `import numpy as np

def embed(texto, dim=64):
    """Embedding de juguete determinista: bolsa de palabras hasheada."""
    v = np.zeros(dim)
    for tok in texto.lower().split():
        rng = np.random.default_rng(sum((i + 1) * ord(ch) for i, ch in enumerate(tok)))
        v += rng.choice([-1.0, 1.0], size=dim)
    n = np.linalg.norm(v)
    return v / n if n > 0 else v

def buscar(query, docs, k=2):
    """Devuelve los índices de los k documentos más afines (coseno)."""
    q = embed(query)
    sims = np.array([float(q @ embed(d)) for d in docs])
    return np.argsort(-sims)[:k].tolist()

def construir_contexto(query, docs, k=2):
    """Recupera top-k y ensambla el contexto para el prompt."""
    idx = buscar(query, docs, k)
    return "\\n---\\n".join(docs[i] for i in idx)
`,
    test_code: `
docs = [
    "el gato duerme en el sofa",
    "la fisica cuantica estudia particulas subatomicas",
    "el perro juega con la pelota en el parque",
    "los gatos son animales independientes y domesticos",
]

q = embed("gato sofa")
s_gato = q @ embed(docs[0]); s_fis = q @ embed(docs[1])
check("El coseno premia documentos que comparten palabras", lambda: s_gato > 0.3 and s_gato > s_fis,
      msg="'gato sofa' debería ser claramente más afín al documento del gato que al de física cuántica")

check("embed devuelve vectores normalizados de la dimensión dada", lambda: np.allclose(np.linalg.norm(embed('hola mundo', 32)), 1.0) and embed('x', 32).shape == (32,),
      msg="Normaliza: ||embed(t)|| debe ser 1 (y la dimensión la pedida)")

check("embed es determinista", lambda: np.allclose(embed('transformer rope'), embed('transformer rope')),
      msg="La misma frase debe producir siempre el mismo vector")

res = buscar("cuentame de gatos y animales", docs, k=2)
check("buscar devuelve k índices ordenados por similitud", lambda: len(res) == 2 and res[0] == int(np.argmax([embed('cuentame de gatos y animales') @ embed(d) for d in docs])),
      msg="El primer índice debe ser el documento con mayor coseno con la query")

idx_ref = np.argsort(-np.array([embed('cuentame de gatos y animales') @ embed(d) for d in docs]))[:2]
check("El top-2 contiene exactamente los dos documentos más afines", lambda: set(res) == set(int(i) for i in idx_ref),
      msg="Compara la similitud coseno de la query con TODOS los documentos y quédate con los k mayores")

ctx = construir_contexto("cuentame de gatos y animales", docs, k=2)
check("El contexto contiene los textos de los documentos recuperados", lambda: all(docs[i] in ctx for i in idx_ref),
      msg="construir_contexto debe concatenar los documentos top-k separados por '\\n---\\n'")
`,
    hints: [
      'La semilla de cada token: `sum((i+1)*ord(ch) for i, ch in enumerate(tok))`. Con ella, `np.random.default_rng(semilla).choice([-1.0, 1.0], size=dim)`.',
      'Normaliza con `v / np.linalg.norm(v)` (guarda el caso de norma 0). Como todo está normalizado, el coseno es un simple producto punto.',
      'Para ordenar de mayor a menor: `np.argsort(-sims)[:k].tolist()`.',
    ],
  },
  {
    id: 'llm-lora',
    title: 'E6 · LoRA desde cero (boss del módulo)',
    difficulty: 'AVANZADO',
    xp: 140,
    statement: [
      '**LoRA** fine-tunea un gigante sin tocarlo: congela $W$ y aprende un ajuste de **bajo rango** $\\Delta W = \\frac{\\alpha}{r} B A$ con $A \\in \\mathbb{R}^{r \\times d_{in}}$ y $B \\in \\mathbb{R}^{d_{out} \\times r}$, con $r \\ll d$. Si $W$ tiene un millón de parámetros, $A$ y $B$ tienen unos pocos miles.',
      '',
      '$$y = x W^{\\top} + \\frac{\\alpha}{r}\\, x A^{\\top} B^{\\top}$$',
      '',
      'Implementa cuatro piezas:',
      '',
      '- `lora_init(d_in, d_out, r, seed=0)`: `A` con ruido pequeño (`np.random.default_rng(seed).normal(0, 0.01, (r, d_in))`) y `B` a **ceros** (así, al inicio, $\\Delta W = 0$ y el modelo intacto).\n- `lora_forward(X, W, A, B, alpha=1.0)`: la fórmula de arriba para un lote `X` $(n, d_{in})$.\n- `lora_delta(A, B, alpha=1.0)`: devuelve $\\Delta W = \\frac{\\alpha}{r} B A$.\n- `entrenar_lora(X, Y, W, r, alpha=1.0, lr=0.05, pasos=2000, seed=0)`: descenso de gradiente del MSE actualizando **solo** `A` y `B` (jamás `W`). Gradientes, con $E = \\frac{2}{n}(\\hat{Y} - Y)$:\n\n$$\\frac{\\partial L}{\\partial B} = \\frac{\\alpha}{r}\\, E^{\\top} (X A^{\\top}), \\qquad \\frac{\\partial L}{\\partial A} = \\frac{\\alpha}{r}\\, (E B)^{\\top} X$$',
      '',
      'La tarea de juguete: `Y = X·(W + ΔW_real)ᵀ` donde el ajuste real es de rango $r$ — exactamente la situación en la que LoRA brilla.',
    ].join('\n'),
    starter_code: `import numpy as np

def lora_init(d_in, d_out, r, seed=0):
    """Inicializa A (r, d_in) con ruido pequeño y B (d_out, r) a ceros."""
    # TODO
    A = np.zeros((r, d_in)); B = np.zeros((d_out, r))
    return A, B

def lora_forward(X, W, A, B, alpha=1.0):
    """y = X·Wᵀ + (alpha/r)·X·Aᵀ·Bᵀ — W congelada, solo A y B se entrenan."""
    # TODO
    return X @ W.T

def lora_delta(A, B, alpha=1.0):
    """El ajuste efectivo sobre los pesos: ΔW = (alpha/r)·B·A."""
    # TODO
    return np.zeros((B.shape[0], A.shape[1]))

def entrenar_lora(X, Y, W, r, alpha=1.0, lr=0.05, pasos=2000, seed=0):
    """Descenso de gradiente SOLO sobre A y B (W nunca se toca)."""
    A, B = lora_init(X.shape[1], W.shape[0], r, seed)
    n = X.shape[0]
    for _ in range(pasos):
        pred = lora_forward(X, W, A, B, alpha)
        E = (pred - Y) * (2.0 / n)          # d MSE / d pred
        # TODO: gB = (alpha/r)·Eᵀ·(X·Aᵀ) ; gA = (alpha/r)·(E·B)ᵀ·X
        # B -= lr·gB ; A -= lr·gA
    return A, B

# Prueba rápida
rng = np.random.default_rng(0)
X = rng.normal(size=(32, 8)); W = rng.normal(size=(4, 8))
Y = X @ (W + rng.normal(size=(2, 8)).T @ rng.normal(size=(2, 8)) * 0 + np.eye(4, 8) * 0.5).T
A, B = entrenar_lora(X, Y, W, r=2)
print("ΔW:", lora_delta(A, B).shape)  # (4, 8)
`,
    solution_code: `import numpy as np

def lora_init(d_in, d_out, r, seed=0):
    """Inicializa A (r, d_in) con ruido pequeño y B (d_out, r) a ceros."""
    rng = np.random.default_rng(seed)
    A = rng.normal(0, 0.01, size=(r, d_in))
    B = np.zeros((d_out, r))
    return A, B

def lora_forward(X, W, A, B, alpha=1.0):
    """y = X·Wᵀ + (alpha/r)·X·Aᵀ·Bᵀ — W congelada, solo A y B se entrenan."""
    r = A.shape[0]
    return X @ W.T + (alpha / r) * (X @ A.T) @ B.T

def lora_delta(A, B, alpha=1.0):
    """El ajuste efectivo sobre los pesos: ΔW = (alpha/r)·B·A."""
    return (alpha / A.shape[0]) * B @ A

def entrenar_lora(X, Y, W, r, alpha=1.0, lr=0.05, pasos=2000, seed=0):
    """Descenso de gradiente SOLO sobre A y B (W nunca se toca)."""
    A, B = lora_init(X.shape[1], W.shape[0], r, seed)
    n = X.shape[0]
    for _ in range(pasos):
        pred = lora_forward(X, W, A, B, alpha)
        E = (pred - Y) * (2.0 / n)          # d MSE / d pred
        gB = (alpha / r) * E.T @ (X @ A.T)  # (d_out, r)
        gA = (alpha / r) * (E @ B).T @ X    # (r, d_in)
        B -= lr * gB
        A -= lr * gA
    return A, B
`,
    test_code: `
rng = np.random.default_rng(3)
n, d_in, d_out, r = 64, 12, 6, 2
X = rng.normal(size=(n, d_in))
W = rng.normal(size=(d_out, d_in))
A_true = rng.normal(size=(r, d_in)); B_true = rng.normal(size=(d_out, r))
Y = X @ (W + B_true @ A_true).T                   # tarea: ajuste verdadero de rango r

A0, B0 = lora_init(d_in, d_out, r, seed=1)
check("Al inicio (B=0) el forward es exactamente X·Wᵀ", lambda: np.allclose(lora_forward(X, W, A0, B0), X @ W.T),
      msg="Con B inicializado a cero, LoRA no altera la salida: y = X·Wᵀ")

A = rng.normal(size=(r, d_in)); B = rng.normal(size=(d_out, r))
manual = X @ W.T + (1.0 / r) * (X @ A.T) @ B.T
check("Forward coincide con la fórmula y = X·Wᵀ + (α/r)·X·Aᵀ·Bᵀ", lambda: np.allclose(lora_forward(X, W, A, B, alpha=1.0), manual, atol=1e-10),
      msg="El término LoRA es (alpha/r) · (X @ A.T) @ B.T, sumado a la salida congelada")

dW = lora_delta(A, B)
check("ΔW tiene rango como mucho r", lambda: np.linalg.matrix_rank(dW, tol=1e-8) <= r,
      msg="ΔW = (α/r)·B·A con A (r,d) y B (d,r): el rango no puede superar r — es la gracia de LoRA")

W_copia = W.copy()
A_t, B_t = entrenar_lora(X, Y, W, r, alpha=1.0, lr=0.05, pasos=2000, seed=1)
pred = lora_forward(X, W, A_t, B_t)
loss_ini = float(np.mean((lora_forward(X, W, A0, B0) - Y) ** 2))
loss_fin = float(np.mean((pred - Y) ** 2))
check("Entrenar solo A y B reduce mucho el error", lambda: loss_fin < 0.02 * loss_ini,
      msg="Con lr y pasos suficientes, A y B deben aprender el ajuste: el MSE final debería ser <2% del inicial")

check("W permanece intacta (congelada)", lambda: np.allclose(W, W_copia),
      msg="LoRA nunca modifica W: comprueba que no la actualizas en el bucle de entrenamiento")
`,
    hints: [
      '`lora_init`: `A = np.random.default_rng(seed).normal(0, 0.01, (r, d_in))`, `B = np.zeros((d_out, r))`. B a cero hace que el arranque no perturbe el modelo.',
      'En `lora_forward` el término nuevo es `(alpha / A.shape[0]) * (X @ A.T) @ B.T` — primero bajas a dimensión $r$, luego subes.',
      'Gradientes: `gB = (alpha/r) * E.T @ (X @ A.T)` y `gA = (alpha/r) * (E @ B).T @ X`. Actualiza solo A y B.',
    ],
  },
]

registerExercises(LLM_EXERCISES)
