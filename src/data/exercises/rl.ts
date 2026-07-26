/**
 * rl.ts — Ejercicios del módulo N9 · Aprendizaje por refuerzo.
 * Se registran en el registro global al importarse (side-effect).
 *
 * Nota de estocasticidad: TODAS las soluciones y tests usan
 * np.random.default_rng(seed) con semilla fija → deterministas.
 */

import type { Exercise } from '@/lib/exercises'
import { registerExercises } from '@/lib/exercises'

/* ------------------------------------------------------------------ */
/* E1 · ε-greedy en un bandido de k brazos (BÁSICO)                    */
/* ------------------------------------------------------------------ */

const epsilonGreedy: Exercise = {
  id: 'rl-epsilon-greedy',
  title: 'Bandido con ε-greedy',
  difficulty: 'BASICO',
  xp: 50,
  statement: String.raw`Implementa \`epsilon_greedy(means, n_pasos, epsilon, seed)\`, que simula un bandido de $k$ brazos:

- Cada brazo $i$ paga una recompensa **gaussiana** $\mathcal{N}(\mu_i, 1)$ (usa el rng).
- Mantén estimaciones $Q_i$ como la **media incremental** de las recompensas recibidas del brazo $i$.
- En cada paso: con probabilidad $\varepsilon$ elige un brazo **uniformemente al azar** (explorar); si no, elige $\arg\max_i Q_i$ (explotar). Los empates en el argmax se rompen al azar (\`rng.integers\` sobre los índices empatados).
- Devuelve la tupla \`(selecciones, Q, recompensas)\`: arrays de longitud \`n_pasos\` con el brazo elegido y la recompensa obtenida en cada paso, y el array $Q$ final de longitud $k$.

**Pista de orden**: dentro de cada paso, los consumos de aleatoriedad deben ser (1) decidir si exploras con \`rng.random()\`, (2) elegir el brazo, (3) generar la recompensa con \`rng.normal(means[a], 1.0)\`. Así el resultado es reproducible con la semilla.`,
  starter_code: `import numpy as np

def epsilon_greedy(means, n_pasos, epsilon, seed):
    """
    Bandido de k brazos con estrategia ε-greedy.
    means: array (k,) con las medias verdaderas de cada brazo.
    Devuelve (selecciones, Q, recompensas):
      selecciones: array (n_pasos,) de enteros (brazo elegido en cada paso)
      Q: array (k,) con la estimación final de cada brazo
      recompensas: array (n_pasos,) con la recompensa de cada paso
    """
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)

    Q = np.zeros(k)      # estimaciones actuales
    N = np.zeros(k)      # cuántas veces se tiró de cada brazo
    selecciones = np.zeros(n_pasos, dtype=int)
    recompensas = np.zeros(n_pasos)

    for t in range(n_pasos):
        # TODO: 1) decide explorar/explotar con rng.random()
        #       2) elige el brazo a (empates del argmax al azar)
        #       3) r = rng.normal(means[a], 1.0)
        #       4) actualiza N[a] y Q[a] con la media incremental
        a = 0
        r = 0.0
        selecciones[t] = a
        recompensas[t] = r

    return selecciones, Q, recompensas

# Prueba rápida
means = np.array([0.2, 0.8, 0.5])
sel, Q, rew = epsilon_greedy(means, 2000, 0.1, 7)
print("Q estimado:", Q)
print("Veces por brazo:", np.bincount(sel, minlength=3))
print(f"Recompensa media: {rew.mean():.3f}")
`,
  solution_code: `import numpy as np

def epsilon_greedy(means, n_pasos, epsilon, seed):
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)

    Q = np.zeros(k)
    N = np.zeros(k)
    selecciones = np.zeros(n_pasos, dtype=int)
    recompensas = np.zeros(n_pasos)

    for t in range(n_pasos):
        if rng.random() < epsilon:
            a = int(rng.integers(k))
        else:
            mejores = np.flatnonzero(Q == Q.max())
            a = int(mejores[rng.integers(len(mejores))])
        r = float(rng.normal(means[a], 1.0))
        N[a] += 1
        Q[a] += (r - Q[a]) / N[a]
        selecciones[t] = a
        recompensas[t] = r

    return selecciones, Q, recompensas
`,
  test_code: `
means = np.array([0.2, 0.8, 0.5])
sel, Q, rew = epsilon_greedy(means, 3000, 0.1, 7)

check("Devuelve una tupla de 3 arrays con las longitudes correctas",
      lambda: len(sel) == 3000 and len(rew) == 3000 and len(Q) == 3,
      msg="esperaba (selecciones[3000], Q[3], recompensas[3000])")
check("La estimación Q se acerca a las medias verdaderas (±0.2)",
      lambda: bool(np.allclose(Q, means, atol=0.2)),
      msg=f"Q={Q} debería estar cerca de {means}; ¿actualizas con la media incremental?")
check("El brazo óptimo (índice 1) es el más tirado",
      lambda: int(np.bincount(sel, minlength=3).argmax()) == 1,
      msg="con ε=0.1 y 3000 pasos, el brazo de media 0.8 debería ser el más elegido")
check("El brazo óptimo se tira más del 60% de las veces",
      lambda: float((sel == 1).mean()) > 0.6,
      msg=f"el brazo óptimo solo se tiró un {float((sel==1).mean())*100:.1f}% de las veces")
check("La recompensa media acumulada supera 0.65 (mejor que jugar al azar)",
      lambda: float(rew.mean()) > 0.65,
      msg="jugar al azar daría ~0.5; una buena ε-greedy debería acercarse a 0.8")
`,
  hints: [
    'La media incremental es `Q[a] += (r - Q[a]) / N[a]` — así no guardas el historial.',
    'Para romper empates del argmax al azar: `mejores = np.flatnonzero(Q == Q.max())` y elige uno con `rng.integers(len(mejores))`.',
    'Orden de aleatoriedad por paso: `rng.random()` (¿exploro?), elegir brazo, `rng.normal(means[a], 1.0)` (recompensa).',
  ],
}

/* ------------------------------------------------------------------ */
/* E2 · UCB vs ε-greedy (INTERMEDIO)                                   */
/* ------------------------------------------------------------------ */

const ucb: Exercise = {
  id: 'rl-ucb',
  title: 'UCB: explorar con optimismo',
  difficulty: 'INTERMEDIO',
  xp: 80,
  statement: String.raw`Implementa \`ucb(means, n_pasos, c, seed)\`, la estrategia **Upper Confidence Bound**:

$$a_t = \arg\max_i \left[ Q_i + c\sqrt{\frac{\ln t}{N_i}} \right]$$

- $Q_i$: media de recompensas del brazo $i$; $N_i$: veces que se tiró del brazo $i$; $t$: paso actual (empezando en 1).
- Los brazos con $N_i = 0$ tienen bonus infinito: **primero prueba cada brazo una vez**, en orden.
- Igual que antes, la recompensa del brazo $i$ es $\mathcal{N}(\mu_i, 1)$ con \`rng.normal(means[a], 1.0)\`, y los empates del argmax se rompen al azar.
- Devuelve \`(selecciones, Q, recompensas)\` como en el ejercicio anterior.

El corrector compara tu UCB con una ε-greedy de referencia en el mismo escenario: el **arrepentimiento** (regret = lo que dejaste de ganar respecto a tirar siempre del brazo óptimo) debe ser menor.`,
  starter_code: `import numpy as np

def ucb(means, n_pasos, c, seed):
    """
    Bandido de k brazos con estrategia UCB.
    Devuelve (selecciones, Q, recompensas), igual que ε-greedy.
    """
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)

    Q = np.zeros(k)
    N = np.zeros(k)
    selecciones = np.zeros(n_pasos, dtype=int)
    recompensas = np.zeros(n_pasos)

    for t in range(n_pasos):
        # TODO: si queda algún brazo con N==0, pruébalo (el de menor índice).
        # Si no: bonus_i = c * sqrt(ln(t+1) / N_i); a = argmax(Q + bonus)
        # con empates al azar. Recompensa: rng.normal(means[a], 1.0).
        # Actualiza N[a] y Q[a] (media incremental).
        a = 0
        r = 0.0
        selecciones[t] = a
        recompensas[t] = r

    return selecciones, Q, recompensas

# Prueba rápida
means = np.array([0.2, 0.8, 0.5])
sel, Q, rew = ucb(means, 2000, 1.0, 7)
print("Q estimado:", Q)
print("Veces por brazo:", np.bincount(sel, minlength=3))
print(f"Recompensa media: {rew.mean():.3f}")
`,
  solution_code: `import numpy as np

def ucb(means, n_pasos, c, seed):
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)

    Q = np.zeros(k)
    N = np.zeros(k)
    selecciones = np.zeros(n_pasos, dtype=int)
    recompensas = np.zeros(n_pasos)

    for t in range(n_pasos):
        if (N == 0).any():
            a = int(np.argmax(N == 0))  # primer brazo no probado
        else:
            bonus = c * np.sqrt(np.log(t + 1) / N)
            mejores = np.flatnonzero(Q + bonus == (Q + bonus).max())
            a = int(mejores[rng.integers(len(mejores))])
        r = float(rng.normal(means[a], 1.0))
        N[a] += 1
        Q[a] += (r - Q[a]) / N[a]
        selecciones[t] = a
        recompensas[t] = r

    return selecciones, Q, recompensas
`,
  test_code: `
means = np.array([0.2, 0.8, 0.5])

def _eps_greedy_ref(means, n_pasos, epsilon, seed):
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)
    Q = np.zeros(k); N = np.zeros(k); total = 0.0
    for t in range(n_pasos):
        if rng.random() < epsilon:
            a = int(rng.integers(k))
        else:
            mejores = np.flatnonzero(Q == Q.max())
            a = int(mejores[rng.integers(len(mejores))])
        r = float(rng.normal(means[a], 1.0))
        N[a] += 1; Q[a] += (r - Q[a]) / N[a]
        total += r
    return total

sel, Q, rew = ucb(means, 2000, 1.0, 7)

check("Devuelve una tupla de 3 arrays con las longitudes correctas",
      lambda: len(sel) == 2000 and len(rew) == 2000 and len(Q) == 3,
      msg="esperaba (selecciones[2000], Q[3], recompensas[2000])")
check("Cada brazo se prueba al menos una vez",
      lambda: bool((np.bincount(sel, minlength=3) > 0).all()),
      msg="UCB debe probar cada brazo una vez al principio (N_i = 0 → bonus infinito)")
check("El brazo óptimo es el más tirado",
      lambda: int(np.bincount(sel, minlength=3).argmax()) == 1,
      msg="UCB debería concentrarse en el brazo de media 0.8")
check("UCB acumula más recompensa que ε-greedy en este escenario",
      lambda: float(rew.sum()) > _eps_greedy_ref(means, 2000, 0.1, 7),
      msg=f"UCB acumuló {float(rew.sum()):.1f}; ε-greedy acumula más — revisa el bonus o el ln(t)")
check("La estimación del brazo óptimo es precisa (±0.15)",
      lambda: bool(np.allclose(Q[1], means[1], atol=0.15)),
      msg=f"Q[1]={Q[1]:.3f} pero la media verdadera es 0.8; ¿media incremental bien hecha?")
`,
  hints: [
    'Al empezar (o tras un reseteo), los brazos con `N == 0` deben elegirse primero; `np.argmax(N == 0)` te da el primero.',
    'El bonus es $c\\sqrt{\\ln(t)/N_i}$ con $t$ empezando en 1 (en el bucle `for t in range(n_pasos)` usa `np.log(t + 1)`).',
    'Es el mismo esqueleto que ε-greedy: solo cambia la regla de selección del brazo.',
  ],
}

/* ------------------------------------------------------------------ */
/* E3 · Retorno descontado (BÁSICO)                                    */
/* ------------------------------------------------------------------ */

const retorno: Exercise = {
  id: 'rl-retorno',
  title: 'El retorno descontado',
  difficulty: 'BASICO',
  xp: 40,
  statement: String.raw`Implementa \`retorno_descontado(recompensas, gamma)\`, que calcula:

$$G_0 = \sum_{k=0}^{T-1} \gamma^k \, r_k$$

Es decir: la primera recompensa cuenta entera, la segunda multiplicada por $\gamma$, la tercera por $\gamma^2$…

Debe aceptar cualquier array-like de números y devolver un \`float\`. **Prohibido** bucles de potencias costosos: basta un bucle que multiplica por $\gamma$ en cada paso (o vectorizar con \`np.power\`).`,
  starter_code: `import numpy as np

def retorno_descontado(recompensas, gamma):
    """
    G_0 = sum_k gamma**k * r_k
    recompensas: array-like de floats; gamma: float en [0, 1].
    Devuelve un float.
    """
    # TODO
    return 0.0

print(retorno_descontado([1, 1, 1], 0.9))      # esperado: 2.71
print(retorno_descontado([10, 0, 0, 0], 0.5))  # esperado: 10.0
print(retorno_descontado([], 0.9))             # esperado: 0.0
`,
  solution_code: `import numpy as np

def retorno_descontado(recompensas, gamma):
    r = np.asarray(recompensas, dtype=float).ravel()
    if r.size == 0:
        return 0.0
    factores = np.power(float(gamma), np.arange(r.size))
    return float(np.sum(factores * r))
`,
  test_code: `
check("Caso base: [1,1,1] con γ=0.9 da 2.71",
      lambda: bool(np.allclose(retorno_descontado([1, 1, 1], 0.9), 2.71)),
      msg="1 + 0.9 + 0.81 = 2.71")
check("Recompensa inmediata no se descuenta",
      lambda: bool(np.allclose(retorno_descontado([10, 0, 0, 0], 0.5), 10.0)),
      msg="la primera recompensa va multiplicada por γ^0 = 1")
check("Devuelve un float",
      lambda: isinstance(retorno_descontado([1.0, 2.0], 0.9), float),
      msg="debe devolver un float de Python, no un array de numpy")
check("Lista vacía devuelve 0.0",
      lambda: retorno_descontado([], 0.9) == 0.0,
      msg="con 0 recompensas el retorno es 0")
check("Caso general contra la fórmula",
      lambda: bool(np.allclose(
          retorno_descontado([2.0, -1.0, 3.0, 0.5], 0.7),
          sum(0.7 ** k * r for k, r in enumerate([2.0, -1.0, 3.0, 0.5])))),
      msg="revisa que el exponente de γ sea la posición k (empezando en 0)")
check("Acepta arrays de numpy",
      lambda: bool(np.allclose(retorno_descontado(np.array([1.0, 1.0]), 0.5), 1.5)),
      msg="debe funcionar con np.array, no solo con listas")
`,
  hints: [
    'Recorre las recompensas llevando un `factor` que empieza en 1 y se multiplica por γ en cada paso.',
    '`np.power(gamma, np.arange(len(r)))` te da todos los factores de golpe.',
    'Convierte la entrada con `np.asarray(recompensas, dtype=float)` y usa `float(...)` al devolver.',
  ],
}

/* ------------------------------------------------------------------ */
/* E4 · Value iteration en un gridworld (INTERMEDIO)                   */
/* ------------------------------------------------------------------ */

const GRID_SPEC = String.raw`El mundo se describe con una lista de strings (filas), carácter a carácter:

- \`'.'\`: celda libre (recompensa 0 al entrar)
- \`'#'\`: muro (no se puede entrar; si chocas, te quedas donde estabas)
- \`'G'\`: meta (recompensa +10 al entrar, estado **terminal**)
- \`'X'\`: pozo (recompensa −10 al entrar, estado **terminal**)

Las acciones son 0=arriba, 1=derecha, 2=abajo, 3=izquierda y son **deterministas**.`

const valueIteration: Exercise = {
  id: 'rl-value-iteration',
  title: 'Value iteration en un gridworld',
  difficulty: 'INTERMEDIO',
  xp: 90,
  statement: String.raw`Implementa \`value_iteration(grid, gamma, theta)\` que calcula el valor óptimo $V^*$ de cada celda por **iteración de Bellman**.

${GRID_SPEC}

El algoritmo: inicializa $V = 0$ en todas partes y repite hasta que el cambio máximo sea menor que \`theta\`:

$$V(s) \leftarrow \max_a \; r(s, a) + \gamma\, V(s')$$

donde $s'$ es la celda a la que te lleva la acción $a$ (o la misma $s$ si chocas con un muro o el borde). Los estados terminales (\`G\` y \`X\`) tienen $V = 0$ fijo: su recompensa se cobra **al entrar**, no al estar.

Devuelve un array \`float\` de la misma forma que el grid.`,
  starter_code: `import numpy as np

ACCIONES = [(-1, 0), (0, 1), (1, 0), (0, -1)]  # arriba, derecha, abajo, izquierda

def value_iteration(grid, gamma, theta):
    """
    grid: lista de strings con '.', '#', 'G', 'X'.
    Devuelve V (array H×W de floats) con el valor óptimo de cada celda.
    Muros: valor 0. Terminales (G, X): valor 0 (la recompensa se cobra al entrar).
    """
    H, W = len(grid), len(grid[0])
    V = np.zeros((H, W))

    def paso(i, j, a):
        """Devuelve ((ni, nj), r): destino y recompensa inmediata al hacer a en (i,j)."""
        di, dj = ACCIONES[a]
        ni, nj = i + di, j + dj
        # TODO: si (ni, nj) está fuera o es muro → quedarse en (i, j) con r = 0
        #       si es 'G' → r = +10; si es 'X' → r = -10; si no → r = 0
        return (ni, nj), 0.0

    # TODO: bucle de iteración de Bellman hasta converger (cambio máx < theta)
    # V_new[i, j] = max_a (r + gamma * V[destino])   para celdas libres
    # (terminales y muros se quedan en 0)

    return V

grid = [
    "....",
    ".#X.",
    "..#G",
]
V = value_iteration(grid, 0.9, 1e-6)
print(np.round(V, 2))
`,
  solution_code: `import numpy as np

ACCIONES = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def value_iteration(grid, gamma, theta):
    H, W = len(grid), len(grid[0])
    V = np.zeros((H, W))

    def paso(i, j, a):
        di, dj = ACCIONES[a]
        ni, nj = i + di, j + dj
        if ni < 0 or ni >= H or nj < 0 or nj >= W or grid[ni][nj] == '#':
            return (i, j), 0.0
        if grid[ni][nj] == 'G':
            return (ni, nj), 10.0
        if grid[ni][nj] == 'X':
            return (ni, nj), -10.0
        return (ni, nj), 0.0

    while True:
        delta = 0.0
        V_new = V.copy()
        for i in range(H):
            for j in range(W):
                if grid[i][j] in '#GX':
                    continue
                V_new[i, j] = max(
                    r + gamma * V[ni, nj]
                    for a in range(4)
                    for (ni, nj), r in [paso(i, j, a)]
                )
                delta = max(delta, abs(V_new[i, j] - V[i, j]))
        V = V_new
        if delta < theta:
            break
    return V
`,
  test_code: `
grid = [
    "....",
    ".#X.",
    "..#G",
]

def _vi_ref(grid, gamma, theta):
    ACC = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    H, W = len(grid), len(grid[0])
    V = np.zeros((H, W))
    while True:
        delta = 0.0
        Vn = V.copy()
        for i in range(H):
            for j in range(W):
                if grid[i][j] in '#GX':
                    continue
                vals = []
                for di, dj in ACC:
                    ni, nj = i + di, j + dj
                    if ni < 0 or ni >= H or nj < 0 or nj >= W or grid[ni][nj] == '#':
                        vals.append(0.0 + gamma * V[i, j])
                    else:
                        c = grid[ni][nj]
                        r = 10.0 if c == 'G' else (-10.0 if c == 'X' else 0.0)
                        vals.append(r + gamma * V[ni, nj])
                Vn[i, j] = max(vals)
                delta = max(delta, abs(Vn[i, j] - V[i, j]))
        V = Vn
        if delta < theta:
            break
    return V

V = value_iteration(grid, 0.9, 1e-6)
V_ref = _vi_ref(grid, 0.9, 1e-6)

check("Devuelve un array de la forma del grid", lambda: isinstance(V, np.ndarray) and V.shape == (3, 4),
      msg="V debe ser un np.ndarray 3×4")
check("La celda (1,3), vecina de la meta, vale 10.0",
      lambda: bool(np.allclose(V[1, 3], 10.0, atol=1e-3)),
      msg=f"V[1,3]={V[1,3]:.3f}; la recompensa se cobra al ENTRAR en G: V = max_a r + γV(s') con V(G)=0 → 10.0")
check("Los valores coinciden con la referencia (±1e-3)",
      lambda: bool(np.allclose(V, V_ref, atol=1e-3)),
      msg=f"tu V:\n{V}\nreferencia:\n{V_ref}")
check("Converge: repetir la llamada da el mismo resultado",
      lambda: bool(np.allclose(value_iteration(grid, 0.9, 1e-6), V, atol=1e-6)),
      msg="value_iteration debe ser determinista y converger")
check("Funciona con otro grid y otro γ",
      lambda: bool(np.allclose(
          value_iteration(["..G"], 0.5, 1e-8)[0, 0],
          0.5 * 10.0, atol=1e-4)),
      msg="en ['..G'] con γ=0.5, la celda (0,0) está a dos pasos de la meta: V = γ·10 = 5.0")
`,
  hints: [
    'Estructura del bucle: `V_new = V.copy()`, recorre todas las celdas libres, `V_new[i,j] = max_a (r + γ·V[destino])`, mide el cambio máximo y para cuando sea < theta.',
    'Si el destino está fuera del grid o es un muro, el agente NO se mueve: destino = (i, j) y recompensa 0.',
    'Las terminales y los muros se saltan (su valor se queda en 0). La recompensa de entrar en G/X la recibe la celda DESDE la que se entra.',
  ],
}

/* ------------------------------------------------------------------ */
/* E5 · Q-learning tabular (AVANZADO — jefe del nivel)                 */
/* ------------------------------------------------------------------ */

const qLearning: Exercise = {
  id: 'rl-q-learning',
  title: 'Q-learning: aprender la política sin mapa',
  difficulty: 'AVANZADO',
  xp: 140,
  statement: String.raw`El jefe del nivel. Implementa \`q_learning(grid, alpha, gamma, epsilon, n_episodios, seed, max_pasos)\`: Q-learning tabular **completo** en el mismo tipo de gridworld del ejercicio anterior.

${GRID_SPEC}

Además hay una \`'S'\`: la celda de inicio de cada episodio.

**Reglas**: la tabla $Q$ es un array \`(H, W, 4)\` inicializado a 0. En cada episodio empiezas en \`S\` y repites hasta llegar a un terminal o gastar \`max_pasos\`: eliges acción ε-greedy sobre $Q(s, \cdot)$ (empates al azar), ejecutas la acción, y actualizas:

$$Q(s,a) \leftarrow Q(s,a) + \alpha\big[r + \gamma \max_{a'} Q(s',a') - Q(s,a)\big]$$

(recordatorio: si $s'$ es terminal, su $Q$ es 0, así que el objetivo es simplemente $r$). Devuelve la tabla $Q$ final.

**Orden de aleatoriedad** (para reproducibilidad): un solo \`rng = np.random.default_rng(seed)\` para TODO; por cada acción: (1) \`rng.random()\` para decidir si exploras, (2) elección de la acción (\`rng.integers(4)\` al explorar; al azar entre los empatados al explotar).

El corrector evalúa la **política greedy** resultante desde TODAS las celdas libres: debe alcanzar la meta en ≥ 90% de ellas.`,
  starter_code: `import numpy as np

ACCIONES = [(-1, 0), (0, 1), (1, 0), (0, -1)]  # arriba, derecha, abajo, izquierda

def q_learning(grid, alpha, gamma, epsilon, n_episodios, seed, max_pasos):
    """
    Q-learning tabular.
    grid: lista de strings con '.', '#', 'G', 'X', 'S' (inicio).
    Devuelve Q: array (H, W, 4) con los valores de acción aprendidos.
    """
    H, W = len(grid), len(grid[0])
    rng = np.random.default_rng(seed)
    Q = np.zeros((H, W, 4))

    # localiza la S
    S = next((i, j) for i in range(H) for j in range(W) if grid[i][j] == 'S')

    def paso(i, j, a):
        """((ni, nj), r, terminal): resultado de hacer a en (i,j)."""
        di, dj = ACCIONES[a]
        ni, nj = i + di, j + dj
        if ni < 0 or ni >= H or nj < 0 or nj >= W or grid[ni][nj] == '#':
            return (i, j), 0.0, False
        c = grid[ni][nj]
        r = 10.0 if c == 'G' else (-10.0 if c == 'X' else 0.0)
        return (ni, nj), r, c in 'GX'

    for ep in range(n_episodios):
        i, j = S
        for t in range(max_pasos):
            # TODO: 1) acción ε-greedy sobre Q[i, j] (empates al azar)
            #       2) (ni, nj), r, terminal = paso(i, j, a)
            #       3) objetivo = r si terminal, si no r + gamma * Q[ni, nj].max()
            #       4) Q[i, j, a] += alpha * (objetivo - Q[i, j, a])
            #       5) avanzar; si terminal, break
            pass

    return Q

grid = [
    "S....",
    ".##X.",
    ".#...",
    ".X#..",
    "....G",
]
Q = q_learning(grid, alpha=0.5, gamma=0.95, epsilon=0.1,
               n_episodios=2000, seed=11, max_pasos=100)
print("Mejor acción en S:", Q[0, 0].argmax(), Q[0, 0].round(2))
`,
  solution_code: `import numpy as np

ACCIONES = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def q_learning(grid, alpha, gamma, epsilon, n_episodios, seed, max_pasos):
    H, W = len(grid), len(grid[0])
    rng = np.random.default_rng(seed)
    Q = np.zeros((H, W, 4))

    S = next((i, j) for i in range(H) for j in range(W) if grid[i][j] == 'S')

    def paso(i, j, a):
        di, dj = ACCIONES[a]
        ni, nj = i + di, j + dj
        if ni < 0 or ni >= H or nj < 0 or nj >= W or grid[ni][nj] == '#':
            return (i, j), 0.0, False
        c = grid[ni][nj]
        r = 10.0 if c == 'G' else (-10.0 if c == 'X' else 0.0)
        return (ni, nj), r, c in 'GX'

    for ep in range(n_episodios):
        i, j = S
        for t in range(max_pasos):
            if rng.random() < epsilon:
                a = int(rng.integers(4))
            else:
                mejores = np.flatnonzero(Q[i, j] == Q[i, j].max())
                a = int(mejores[rng.integers(len(mejores))])
            (ni, nj), r, terminal = paso(i, j, a)
            objetivo = r if terminal else r + gamma * Q[ni, nj].max()
            Q[i, j, a] += alpha * (objetivo - Q[i, j, a])
            i, j = ni, nj
            if terminal:
                break

    return Q
`,
  test_code: `
grid = [
    "S....",
    ".##X.",
    ".#...",
    ".X#..",
    "....G",
]
ACC = [(-1, 0), (0, 1), (1, 0), (0, -1)]

Q = q_learning(grid, 0.5, 0.95, 0.1, 2000, 11, 100)

check("Devuelve una tabla Q (H, W, 4)",
      lambda: isinstance(Q, np.ndarray) and Q.shape == (5, 5, 4),
      msg=f"esperaba shape (5,5,4), recibí {getattr(Q, 'shape', None)}")

def _llega(Q, grid, s0):
    """Sigue la política greedy desde s0 (máx 60 pasos). True si llega a G."""
    H, W = len(grid), len(grid[0])
    i, j = s0
    for _ in range(60):
        a = int(np.argmax(Q[i, j]))
        di, dj = ACC[a]
        ni, nj = i + di, j + dj
        if ni < 0 or ni >= H or nj < 0 or nj >= W or grid[ni][nj] == '#':
            ni, nj = i, j
        c = grid[ni][nj]
        if c == 'G':
            return True
        if c == 'X':
            return False
        if (ni, nj) == (i, j):
            return False  # atascado contra un muro
        i, j = ni, nj
    return False

check("La política greedy llega a la meta desde la S",
      lambda: _llega(Q, grid, (0, 0)),
      msg="siguiendo argmax_a Q(s,a) desde S deberías llegar a G en menos de 60 pasos")

def _episodio_eval(Q, grid, rng, eps=0.05, max_pasos=60):
    """Un episodio de evaluación: greedy con un 5% de ruido (ε=0.05)."""
    H, W = len(grid), len(grid[0])
    i, j = next((a, b) for a in range(H) for b in range(W) if grid[a][b] == 'S')
    for _ in range(max_pasos):
        if rng.random() < eps:
            a = int(rng.integers(4))
        else:
            a = int(np.argmax(Q[i, j]))
        di, dj = ACC[a]
        ni, nj = i + di, j + dj
        if ni < 0 or ni >= H or nj < 0 or nj >= W or grid[ni][nj] == '#':
            ni, nj = i, j
        c = grid[ni][nj]
        if c == 'G':
            return True
        if c == 'X':
            return False
        i, j = ni, nj
    return False

rng_eval = np.random.default_rng(99)
exitos = sum(1 for _ in range(200) if _episodio_eval(Q, grid, rng_eval))
tasa = exitos / 200

check("La política alcanza la meta en ≥ 90% de 200 episodios de evaluación",
      lambda: tasa >= 0.9,
      msg=f"tasa de éxito: {tasa*100:.0f}%. ¿Suficientes episodios? ¿El objetivo TD usa max_a' Q(s',a')? ¿Cortas el episodio al llegar a un terminal?")
check("Q de la S refleja que la meta está cerca (valor positivo)",
      lambda: bool(Q[0, 0].max() > 5.0),
      msg=f"max Q(S,·)={Q[0,0].max():.2f}; con γ=0.95 y la meta a pocos pasos debería ser > 5")
check("La celda (0,3), encima de un pozo, aprende a no bajar",
      lambda: int(np.argmax(Q[0, 3])) != 2 and bool(Q[0, 3, 2] < 0),
      msg="desde (0,3) la acción 'abajo' lleva al pozo X; su Q debería ser negativa y no ser la greedy")
`,
  hints: [
    'El objetivo TD es `r` si el siguiente estado es terminal; si no, `r + gamma * Q[ni, nj].max()`.',
    'Mismo patrón que en el bandido para los empates: `mejores = np.flatnonzero(Q[i,j] == Q[i,j].max())`.',
    '2000 episodios con ε=0.1 y α=0.5 sobran para este grid; si no converge, casi seguro el fallo está en el objetivo TD o en no romper el episodio al llegar a un terminal.',
  ],
}

/* ------------------------------------------------------------------ */
/* E6 · REINFORCE en un bandido (AVANZADO, bonus)                      */
/* ------------------------------------------------------------------ */

const reinforce: Exercise = {
  id: 'rl-reinforce',
  title: 'REINFORCE: aprender la política directamente',
  difficulty: 'AVANZADO',
  xp: 130,
  statement: String.raw`Implementa \`reinforce(means, n_pasos, alpha, seed)\`: REINFORCE con **baseline** sobre un bandido de $k$ brazos con política **softmax**.

Mantén un vector de preferencias $h \in \mathbb{R}^k$ (empieza en 0) y la política $\pi_i = \mathrm{softmax}(h)_i$. En cada paso:

1. Muestrea $a \sim \pi$ (con \`rng.choice(k, p=pi)\`).
2. Recibe $r \sim \mathcal{N}(\mu_a, 1)$.
3. Actualiza el baseline como la media de todas las recompensas vistas: $\bar{r}$.
4. Actualiza las preferencias: $h_i \leftarrow h_i + \alpha\,(r - \bar{r})\,(\mathbb{1}[i=a] - \pi_i)$.

Devuelve \`(h, recompensas)\`: el vector de preferencias final y el array de recompensas de cada paso.

En llano: si la recompensa fue **mejor que la media**, sube la probabilidad de lo que acabas de hacer ($\mathbb{1}[i=a] - \pi_i > 0$ para el brazo elegido); si fue peor, bájala. Eso es todo el truco detrás de RLHF.`,
  starter_code: `import numpy as np

def reinforce(means, n_pasos, alpha, seed):
    """
    REINFORCE con baseline en un bandido de k brazos.
    means: array (k,) de medias verdaderas.
    Devuelve (h, recompensas): preferencias finales (k,) y recompensas (n_pasos,).
    """
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)

    h = np.zeros(k)
    recompensas = np.zeros(n_pasos)
    n = 0        # cuántas recompensas vistas
    r_media = 0.0

    for t in range(n_pasos):
        # TODO: 1) pi = softmax(h)  (resta h.max() por estabilidad)
        #       2) a = rng.choice(k, p=pi)
        #       3) r = rng.normal(means[a], 1.0)
        #       4) actualiza r_media con la media incremental (¡antes del gradiente!)
        #       5) h += alpha * (r - r_media) * (onehot(a) - pi)
        recompensas[t] = 0.0

    return h, recompensas

means = np.array([0.0, 1.0, 0.2])
h, rew = reinforce(means, 3000, 0.1, 3)
print("h:", h.round(2))
print("π final:", np.round(np.exp(h) / np.exp(h).sum(), 3))
print(f"Recompensa media: {rew.mean():.3f}")
`,
  solution_code: `import numpy as np

def reinforce(means, n_pasos, alpha, seed):
    means = np.asarray(means, dtype=float)
    k = len(means)
    rng = np.random.default_rng(seed)

    h = np.zeros(k)
    recompensas = np.zeros(n_pasos)
    n = 0
    r_media = 0.0

    for t in range(n_pasos):
        z = h - h.max()
        e = np.exp(z)
        pi = e / e.sum()
        a = int(rng.choice(k, p=pi))
        r = float(rng.normal(means[a], 1.0))
        n += 1
        r_media += (r - r_media) / n
        onehot = np.zeros(k)
        onehot[a] = 1.0
        h += alpha * (r - r_media) * (onehot - pi)
        recompensas[t] = r

    return h, recompensas
`,
  test_code: `
means = np.array([0.0, 1.0, 0.2])
h, rew = reinforce(means, 3000, 0.1, 3)

def _softmax(x):
    z = np.asarray(x, dtype=float) - np.max(x)
    e = np.exp(z)
    return e / e.sum()

pi = _softmax(h)

check("Devuelve (h[k], recompensas[n_pasos])",
      lambda: len(h) == 3 and len(rew) == 3000,
      msg="esperaba h de longitud 3 y recompensas de longitud 3000")
check("El brazo óptimo (índice 1) es el más probable",
      lambda: int(np.argmax(h)) == 1,
      msg="tras 3000 pasos, la preferencia del brazo con media 1.0 debería ser la mayor")
check("La política final asigna > 60% de probabilidad al brazo óptimo",
      lambda: bool(pi[1] > 0.6),
      msg=f"π[1]={pi[1]:.3f}; REINFORCE con baseline debería concentrar la política en el mejor brazo")
check("La recompensa media supera 0.75 (aprende, no juega al azar)",
      lambda: float(rew.mean()) > 0.75,
      msg="jugar al azar daría ~0.4; una política que aprende se acerca a 1.0")
check("Determinista con la misma semilla",
      lambda: bool(np.allclose(reinforce(means, 3000, 0.1, 3)[0], h)),
      msg="con la misma semilla debe dar el mismo resultado (usa un solo rng para todo)")
`,
  hints: [
    'Softmax estable: resta el máximo antes de `np.exp` y normaliza.',
    'El gradiente de $\log \pi_a$ respecto a $h$ es $\mathbb{1}[i=a] - \pi_i$: un vector que vale $1-\pi_a$ en el brazo elegido y $-\pi_i$ en los demás.',
    'Actualiza la media de recompensas ANTES de usarla como baseline en el gradiente.',
  ],
}

/* ------------------------------------------------------------------ */

export const RL_EXERCISES: Exercise[] = [
  epsilonGreedy,
  ucb,
  retorno,
  valueIteration,
  qLearning,
  reinforce,
]

registerExercises(RL_EXERCISES)
