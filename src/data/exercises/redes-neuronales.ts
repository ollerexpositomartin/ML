/**
 * Ejercicios del módulo Redes Neuronales (N3).
 * Prefijo de ids: `redes-`. Cada solution_code está verificado contra su test_code.
 */

import type { Exercise } from '@/lib/exercises'

export const REDES_NEURONALES_EXERCISES: Exercise[] = [
  {
    id: 'redes-layer-forward',
    title: 'E1 · Forward de una capa',
    difficulty: 'BASICO',
    xp: 30,
    statement: String.raw`Implementa \`layer_forward(X, W, b, activation)\` que calcule el paso hacia delante de una capa densa:

$$z = XW + b, \qquad a = \varphi(z)$$

donde $X \in \mathbb{R}^{n \times d}$ son los datos (una fila por muestra), $W \in \mathbb{R}^{d \times m}$ los pesos y $b \in \mathbb{R}^{m}$ el sesgo.

El parámetro \`activation\` es un string: \`'relu'\`, \`'tanh'\` o \`'sigmoid'\`. Si recibe cualquier otro valor, lanza un \`ValueError\`.

Recordatorio: $\mathrm{relu}(z) = \max(0, z)$, $\sigma(z) = \frac{1}{1 + e^{-z}}$.`,
    starter_code: `import numpy as np

def layer_forward(X, W, b, activation):
    """
    X: (n, d), W: (d, m), b: (m,)
    activation: 'relu' | 'tanh' | 'sigmoid'
    Devuelve a = phi(X @ W + b) con shape (n, m).
    """
    # TODO: calcula z = X @ W + b y aplica la activación pedida
    z = X @ W + b
    a = z  # <-- sustituye por la activación correcta
    return a

# Prueba rápida
X = np.array([[1.0, -2.0], [0.5, 3.0]])
W = np.array([[0.4, -0.7, 0.2], [1.1, 0.3, -0.9]])
b = np.array([0.1, -0.2, 0.05])
print(layer_forward(X, W, b, 'relu'))
print(layer_forward(X, W, b, 'sigmoid'))
`,
    solution_code: `import numpy as np

def layer_forward(X, W, b, activation):
    z = X @ W + b
    if activation == 'relu':
        return np.maximum(0.0, z)
    if activation == 'tanh':
        return np.tanh(z)
    if activation == 'sigmoid':
        return 1.0 / (1.0 + np.exp(-z))
    raise ValueError(f"Activación desconocida: {activation}")
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

rng = np.random.default_rng(11)
X_t = rng.normal(size=(7, 4))
W_t = rng.normal(size=(4, 3))
b_t = rng.normal(size=(3,))
z_ref = X_t @ W_t + b_t

_a = layer_forward(X_t, W_t, b_t, 'relu')
check("La salida tiene shape (n, m)", lambda: _a.shape == (7, 3),
      msg=f"Se esperaba (7, 3) y llegó {_a.shape}")

check("ReLU correcta", lambda: _ac(_a, np.maximum(0, z_ref), atol=1e-10),
      msg="relu(z) = max(0, z) elemento a elemento")

check("tanh correcta", lambda: _ac(
        layer_forward(X_t, W_t, b_t, 'tanh'), np.tanh(z_ref), atol=1e-10),
      msg="Usa np.tanh(z)")

check("Sigmoide correcta", lambda: _ac(
        layer_forward(X_t, W_t, b_t, 'sigmoid'), 1.0 / (1.0 + np.exp(-z_ref)), atol=1e-10),
      msg="sigma(z) = 1 / (1 + exp(-z))")

def _raises():
    try:
        layer_forward(X_t, W_t, b_t, 'softplus')
        return False
    except ValueError:
        return True

check("Lanza ValueError con activación desconocida", _raises,
      msg="Si activation no es relu/tanh/sigmoid debes hacer raise ValueError")
`,
    hints: [
      'Primero calcula $z = X @ W + b$; luego decide la activación con un `if` sobre el string.',
      'Para ReLU basta `np.maximum(0, z)`; para la sigmoide, `1 / (1 + np.exp(-z))`.',
      'El caso por defecto (ningún `if` cumplido) debe terminar en `raise ValueError(...)`.',
    ],
  },
  {
    id: 'redes-mlp-forward',
    title: 'E2 · MLP completo',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: String.raw`Ahora apila capas. Implementa \`mlp_forward(X, params)\` que ejecute el forward completo de un perceptrón multicapa:

$$a^{(0)} = X, \qquad z^{(l)} = a^{(l-1)} W^{(l)} + b^{(l)}, \qquad a^{(l)} = \varphi_l\!\left(z^{(l)}\right)$$

\`params\` es una **lista de diccionarios**, uno por capa, con claves \`'W'\`, \`'b'\` y \`'activation'\` (\`'relu'\`, \`'tanh'\` o \`'sigmoid'\`).

La disciplina de formas es sagrada: si $a^{(l-1)} \in \mathbb{R}^{n \times n_{l-1}}$ entonces $W^{(l)} \in \mathbb{R}^{n_{l-1} \times n_l}$. Si las dimensiones no encajan, numpy lanzará un error — déjalo estallar, es la señal de que la arquitectura está mal definida.`,
    starter_code: `import numpy as np

def mlp_forward(X, params):
    """
    X: (n, d). params: lista de dicts {'W', 'b', 'activation'}.
    Devuelve la activación de la última capa.
    """
    a = X
    # TODO: recorre las capas aplicando z = a @ W + b y la activación
    return a

# Red 2 -> 3 -> 1 para probar
params = [
    {'W': np.array([[ 0.6, -0.3,  0.8],
                    [-0.5,  0.9,  0.2]]),
     'b': np.array([0.1, 0.0, -0.2]), 'activation': 'tanh'},
    {'W': np.array([[ 0.7],
                    [-0.4],
                    [ 0.5]]),
     'b': np.array([0.05]), 'activation': 'sigmoid'},
]
X = np.array([[1.0, 0.5], [-0.5, 2.0]])
print(mlp_forward(X, params))
`,
    solution_code: `import numpy as np

def _phi(z, activation):
    if activation == 'relu':
        return np.maximum(0.0, z)
    if activation == 'tanh':
        return np.tanh(z)
    if activation == 'sigmoid':
        return 1.0 / (1.0 + np.exp(-z))
    raise ValueError(f"Activación desconocida: {activation}")

def mlp_forward(X, params):
    a = X
    for p in params:
        a = _phi(a @ p['W'] + p['b'], p['activation'])
    return a
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

rng = np.random.default_rng(23)

def _phi_ref(z, act):
    if act == 'relu':
        return np.maximum(0.0, z)
    if act == 'tanh':
        return np.tanh(z)
    if act == 'sigmoid':
        return 1.0 / (1.0 + np.exp(-z))
    raise ValueError(act)

def _mlp_ref(X, params):
    a = X
    for p in params:
        a = _phi_ref(a @ p['W'] + p['b'], p['activation'])
    return a

dims = [5, 8, 6, 3]
acts = ['relu', 'tanh', 'sigmoid']
params_t = [
    {'W': rng.normal(size=(dims[l], dims[l + 1])),
     'b': rng.normal(size=(dims[l + 1],)),
     'activation': acts[l]}
    for l in range(3)
]
X_t = rng.normal(size=(12, 5))
_out = mlp_forward(X_t, params_t)

check("La salida tiene la shape de la última capa", lambda: _out.shape == (12, 3),
      msg=f"Se esperaba (12, 3) y llegó {_out.shape}")

check("Coincide con la referencia capa a capa", lambda: _ac(
        _out, _mlp_ref(X_t, params_t), atol=1e-9),
      msg="Recorre las capas en orden: a = phi(a @ W + b)")

params_1 = [dict(params_t[0])]
check("Funciona con una sola capa", lambda: _ac(
        mlp_forward(X_t, params_1), _mlp_ref(X_t, params_1), atol=1e-9),
      msg="El caso L=1 también debe funcionar (un solo paso del bucle)")

def _explota():
    try:
        malos = [{'W': np.ones((4, 4)), 'b': np.zeros(4), 'activation': 'relu'}]
        mlp_forward(np.ones((3, 5)), malos)
        return False
    except ValueError:
        return True

check("Dimensiones incompatibles lanzan error (shape discipline)", _explota,
      msg="No enmascares el error de numpy: si W no encaja con a, el @ debe fallar")
`,
    hints: [
      'Un bucle `for p in params:` donde actualizas `a = phi(a @ p["W"] + p["b"], p["activation"])`.',
      'Te conviene escribir una función auxiliar `_phi(z, activation)` como en el E1.',
      'No inicialices `a` a ceros: la entrada de la primera capa es la propia `X`.',
    ],
  },
  {
    id: 'redes-activation-grads',
    title: 'E3 · Derivadas de activaciones',
    difficulty: 'BASICO',
    xp: 30,
    statement: String.raw`Backpropagation necesita la derivada de cada activación respecto a su **pre-activación** $z$. Implementa:

$$\mathrm{relu}'(z) = \begin{cases} 1 & z > 0 \\ 0 & z \le 0 \end{cases} \qquad \sigma'(z) = \sigma(z)\,\bigl(1 - \sigma(z)\bigr)$$

con las funciones \`relu_grad(z)\` y \`sigmoid_grad(z)\` (aceptan arrays de numpy y devuelven arrays del mismo shape).

Los tests comparan tu derivada contra la **derivada numérica** $\varphi'(z) \approx \frac{\varphi(z+\varepsilon) - \varphi(z-\varepsilon)}{2\varepsilon}$ — el mismo truco del gradient check que usarás en el ejercicio estrella.`,
    starter_code: `import numpy as np

def relu_grad(z):
    """Derivada de ReLU respecto a z (array -> array)."""
    # TODO
    return np.zeros_like(z)

def sigmoid_grad(z):
    """Derivada de la sigmoide respecto a z (array -> array)."""
    # TODO: pista — calcula s = sigmoid(z) y usa s * (1 - s)
    return np.zeros_like(z)

# Prueba rápida
z = np.array([-2.0, -0.5, 0.5, 2.0])
print("relu':", relu_grad(z))      # esperado: [0 0 1 1]
print("sigmoid':", sigmoid_grad(z))  # valores entre 0 y 0.25
`,
    solution_code: `import numpy as np

def relu_grad(z):
    return (np.asarray(z) > 0).astype(float)

def sigmoid_grad(z):
    s = 1.0 / (1.0 + np.exp(-z))
    return s * (1.0 - s)
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

eps = 1e-6

def _num_grad(f, z):
    return (f(z + eps) - f(z - eps)) / (2 * eps)

def _sig(z):
    return 1.0 / (1.0 + np.exp(-z))

def _relu(z):
    return np.maximum(0.0, z)

z_t = np.array([-3.0, -1.7, -0.4, 0.4, 1.7, 3.0])

check("relu_grad conserva el shape", lambda: relu_grad(z_t).shape == z_t.shape,
      msg="Debe devolver un array del mismo shape que la entrada")

check("relu_grad coincide con la derivada numérica", lambda: _ac(
        relu_grad(z_t), _num_grad(_relu, z_t), atol=1e-4),
      msg="relu'(z) vale 1 si z > 0 y 0 si z < 0")

check("sigmoid_grad coincide con la derivada numérica", lambda: _ac(
        sigmoid_grad(z_t), _num_grad(_sig, z_t), atol=1e-4),
      msg="sigma'(z) = sigma(z) * (1 - sigma(z)); no confundir con s*(1-s) usando z crudo")

check("sigmoid_grad nunca supera 0.25", lambda: bool(np.all(sigmoid_grad(z_t) <= 0.25 + 1e-12)),
      msg="El máximo de sigma' está en z=0 y vale exactamente 0.25")
`,
    hints: [
      'Para ReLU: `(z > 0).astype(float)` es la forma más compacta.',
      'Para la sigmoide, calcula primero $s = \\sigma(z)$ y devuelve $s(1-s)$.',
      'En $z=0$ la ReLU no es derivable; los tests usan puntos alejados de 0, así que no te preocupes por ese caso.',
    ],
  },
  {
    id: 'redes-backprop',
    title: 'E4 · Backprop de verdad (gradient check)',
    difficulty: 'AVANZADO',
    xp: 150,
    statement: String.raw`El ejercicio estrella del nivel. Implementa \`backprop(X, y, params)\` para una red de dos capas:

$$z^{(1)} = XW^{(1)} + b^{(1)}, \quad a^{(1)} = \tanh(z^{(1)}), \quad z^{(2)} = a^{(1)}W^{(2)} + b^{(2)}, \quad \hat{y} = \sigma(z^{(2)})$$

con pérdida **entropía cruzada binaria** media:

$$L = -\frac{1}{n}\sum_i \Big[ y_i \log \hat{y}_i + (1 - y_i)\log(1 - \hat{y}_i) \Big]$$

\`X\` es $(n, d)$, \`y\` es $(n, 1)$ y \`params\` es el dict \`{'W1', 'b1', 'W2', 'b2'}\`. Devuelve un dict \`{'W1', 'b1', 'W2', 'b2'}\` con los gradientes analíticos.

Las ecuaciones clave (con $\odot$ el producto elemento a elemento):

$$\delta^{(2)} = \frac{\hat{y} - y}{n}, \qquad \delta^{(1)} = \bigl(\delta^{(2)} W^{(2)\top}\bigr) \odot \bigl(1 - (a^{(1)})^2\bigr)$$
$$\frac{\partial L}{\partial W^{(l)}} = (a^{(l-1)})^{\top} \delta^{(l)}, \qquad \frac{\partial L}{\partial b^{(l)}} = \sum_i \delta^{(l)}_i$$

El corrector ejecuta un **gradient check numérico** por parámetro: si tu gradiente analítico no coincide con $\frac{L(\theta+\varepsilon) - L(\theta-\varepsilon)}{2\varepsilon}$, el test te dice exactamente qué capa revisar.`,
    starter_code: `import numpy as np

def backprop(X, y, params):
    """
    X: (n, d), y: (n, 1), params: dict {'W1','b1','W2','b2'}.
    Red: X -> tanh -> sigmoide, pérdida BCE media.
    Devuelve dict {'W1','b1','W2','b2'} con dL/d(param).
    """
    W1, b1, W2, b2 = params['W1'], params['b1'], params['W2'], params['b2']
    n = X.shape[0]

    # --- forward ---
    z1 = X @ W1 + b1
    a1 = np.tanh(z1)
    z2 = a1 @ W2 + b2
    y_hat = 1.0 / (1.0 + np.exp(-z2))

    # --- backward (TODO) ---
    dz2 = np.zeros_like(z2)      # dL/dz2 = (y_hat - y) / n
    dW2 = np.zeros_like(W2)
    db2 = np.zeros_like(b2)
    dz1 = np.zeros_like(z1)      # (dz2 @ W2.T) * (1 - a1**2)
    dW1 = np.zeros_like(W1)
    db1 = np.zeros_like(b1)

    return {'W1': dW1, 'b1': db1, 'W2': dW2, 'b2': db2}

# Prueba rápida: los gradientes no deberían ser cero
rng = np.random.default_rng(0)
params = {'W1': rng.normal(size=(4, 5)), 'b1': np.zeros(5),
          'W2': rng.normal(size=(5, 1)), 'b2': np.zeros(1)}
X = rng.normal(size=(16, 4))
y = (rng.random((16, 1)) > 0.5).astype(float)
grads = backprop(X, y, params)
for k, g in grads.items():
    print(k, g.shape, float(np.abs(g).max()))
`,
    solution_code: `import numpy as np

def backprop(X, y, params):
    W1, b1, W2, b2 = params['W1'], params['b1'], params['W2'], params['b2']
    n = X.shape[0]

    # forward
    z1 = X @ W1 + b1
    a1 = np.tanh(z1)
    z2 = a1 @ W2 + b2
    y_hat = 1.0 / (1.0 + np.exp(-z2))

    # backward
    dz2 = (y_hat - y) / n
    dW2 = a1.T @ dz2
    db2 = dz2.sum(axis=0)
    dz1 = (dz2 @ W2.T) * (1.0 - a1 ** 2)
    dW1 = X.T @ dz1
    db1 = dz1.sum(axis=0)

    return {'W1': dW1, 'b1': db1, 'W2': dW2, 'b2': db2}
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

rng = np.random.default_rng(5)
n_t, d_t, h_t = 24, 4, 6
params_t = {'W1': rng.normal(scale=0.8, size=(d_t, h_t)),
            'b1': rng.normal(scale=0.3, size=(h_t,)),
            'W2': rng.normal(scale=0.8, size=(h_t, 1)),
            'b2': rng.normal(scale=0.3, size=(1,))}
X_t = rng.normal(size=(n_t, d_t))
y_t = (rng.random((n_t, 1)) > 0.5).astype(float)

def _loss(p):
    z1 = X_t @ p['W1'] + p['b1']
    a1 = np.tanh(z1)
    z2 = a1 @ p['W2'] + p['b2']
    yh = 1.0 / (1.0 + np.exp(-z2))
    yh = np.clip(yh, 1e-12, 1 - 1e-12)
    return float(-np.mean(y_t * np.log(yh) + (1 - y_t) * np.log(1 - yh)))

def _num_grad(key):
    g = np.zeros_like(params_t[key])
    it = np.nditer(params_t[key], flags=['multi_index'])
    eps_g = 1e-5
    while not it.finished:
        idx = it.multi_index
        old = params_t[key][idx]
        params_t[key][idx] = old + eps_g
        lp = _loss(params_t)
        params_t[key][idx] = old - eps_g
        lm = _loss(params_t)
        params_t[key][idx] = old
        g[idx] = (lp - lm) / (2 * eps_g)
        it.iternext()
    return g

grads_t = backprop(X_t, y_t, params_t)

check("Devuelve un dict con las 4 claves y shapes correctas",
      lambda: all(k in grads_t and grads_t[k].shape == params_t[k].shape
                  for k in ('W1', 'b1', 'W2', 'b2')),
      msg="El dict debe tener 'W1','b1','W2','b2', cada una con el shape de su parámetro")

check("Gradiente de W2 supera el gradient check", lambda: _ac(
        grads_t['W2'], _num_grad('W2'), rtol=1e-3, atol=1e-6),
      msg="∂L/∂W⁽²⁾ falla: dW2 = a1.T @ dz2 con dz2 = (ŷ − y)/n")

check("Gradiente de b2 supera el gradient check", lambda: _ac(
        grads_t['b2'], _num_grad('b2'), rtol=1e-3, atol=1e-6),
      msg="∂L/∂b⁽²⁾ falla: db2 = dz2.sum(axis=0)")

check("Gradiente de W1 supera el gradient check", lambda: _ac(
        grads_t['W1'], _num_grad('W1'), rtol=1e-3, atol=1e-6),
      msg="∂L/∂W⁽¹⁾ falla: revisa δ⁽¹⁾ = (δ⁽²⁾W⁽²⁾ᵀ) ⊙ (1 − a1²) y dW1 = X.T @ dz1")

check("Gradiente de b1 supera el gradient check", lambda: _ac(
        grads_t['b1'], _num_grad('b1'), rtol=1e-3, atol=1e-6),
      msg="∂L/∂b⁽¹⁾ falla: db1 = dz1.sum(axis=0)")
`,
    hints: [
      'Con BCE + sigmoide, el error de salida se simplifica de forma elegante: $\\delta^{(2)} = (\\hat{y} - y)/n$.',
      'Para la capa oculta: propaga $\\delta^{(2)}$ hacia atrás con $W^{(2)\\top}$ y multiplica por la derivada de tanh, que es $1 - \\tanh^2(z^{(1)}) = 1 - (a^{(1)})^2$.',
      'Los gradientes de pesos son productos externos acumulados sobre las muestras: `dW = a_prev.T @ delta`. Los de sesgo, la suma de `delta` por el eje de muestras. No olvides dividir entre $n$ (va dentro de $\\delta^{(2)}$).',
    ],
  },
  {
    id: 'redes-adam-step',
    title: 'E5 · Adam desde cero',
    difficulty: 'INTERMEDIO',
    xp: 70,
    statement: String.raw`Implementa un paso del optimizador **Adam** con corrección de sesgo:

$$m \leftarrow \beta_1 m + (1-\beta_1)\,g, \qquad v \leftarrow \beta_2 v + (1-\beta_2)\,g^2$$
$$\hat{m} = \frac{m}{1-\beta_1^t}, \qquad \hat{v} = \frac{v}{1-\beta_2^t}, \qquad \theta \leftarrow \theta - \eta\,\frac{\hat{m}}{\sqrt{\hat{v}} + \varepsilon}$$

\`adam_step(param, grad, m, v, t, lr, b1, b2, eps)\` debe devolver la tupla \`(param_nuevo, m_nuevo, v_nuevo)\`. El contador \`t\` empieza en 1 en el primer paso (los momentos llegan inicializados a cero).

Los tests ejecutan 200 pasos sobre una función cuadrática y comparan toda la trayectoria con la implementación de referencia.`,
    starter_code: `import numpy as np

def adam_step(param, grad, m, v, t, lr=0.001, b1=0.9, b2=0.999, eps=1e-8):
    """
    Un paso de Adam. Devuelve (param_nuevo, m_nuevo, v_nuevo).
    t: número de paso (1 en la primera llamada).
    """
    # TODO: actualiza m y v, corrige el sesgo, actualiza param
    m_new = m
    v_new = v
    param_new = param - lr * grad  # <-- esto es SGD, cámbialo por Adam
    return param_new, m_new, v_new

# Mini-entrenamiento sobre f(theta) = (theta - 3)^2
theta = np.array([0.0])
m = np.zeros_like(theta)
v = np.zeros_like(theta)
for t in range(1, 51):
    g = 2 * (theta - 3.0)
    theta, m, v = adam_step(theta, g, m, v, t, lr=0.1)
print("theta tras 50 pasos:", theta)  # debería acercarse a 3
`,
    solution_code: `import numpy as np

def adam_step(param, grad, m, v, t, lr=0.001, b1=0.9, b2=0.999, eps=1e-8):
    m_new = b1 * m + (1.0 - b1) * grad
    v_new = b2 * v + (1.0 - b2) * grad ** 2
    m_hat = m_new / (1.0 - b1 ** t)
    v_hat = v_new / (1.0 - b2 ** t)
    param_new = param - lr * m_hat / (np.sqrt(v_hat) + eps)
    return param_new, m_new, v_new
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

def _adam_ref(param, grad, m, v, t, lr, b1, b2, eps):
    m = b1 * m + (1.0 - b1) * grad
    v = b2 * v + (1.0 - b2) * grad ** 2
    m_hat = m / (1.0 - b1 ** t)
    v_hat = v / (1.0 - b2 ** t)
    return param - lr * m_hat / (np.sqrt(v_hat) + eps), m, v

rng = np.random.default_rng(31)
theta_t = rng.normal(size=6)
m_t = np.zeros(6)
v_t = np.zeros(6)
theta_r = theta_t.copy()
m_r = np.zeros(6)
v_r = np.zeros(6)

for t_i in range(1, 201):
    g_t = 2 * (theta_t - 3.0) + rng.normal(scale=0.01, size=6)
    theta_t, m_t, v_t = adam_step(theta_t, g_t, m_t, v_t, t_i,
                                  lr=0.05, b1=0.9, b2=0.999, eps=1e-8)
    theta_r, m_r, v_r = _adam_ref(theta_r, g_t, m_r, v_r, t_i,
                                  lr=0.05, b1=0.9, b2=0.999, eps=1e-8)

check("Devuelve una tupla (param, m, v)", lambda: isinstance(
        adam_step(np.zeros(3), np.ones(3), np.zeros(3), np.zeros(3), 1), tuple),
      msg="La función debe devolver (param_nuevo, m_nuevo, v_nuevo)")

check("Los momentos m y v se actualizan", lambda: not np.allclose(m_t, 0) and not np.allclose(v_t, 0),
      msg="Tras 200 pasos m y v no pueden seguir siendo cero: actualízalos y devuélvelos")

check("La trayectoria de parámetros coincide con la referencia", lambda: _ac(
        theta_t, theta_r, rtol=1e-6, atol=1e-8),
      msg="Revisa la corrección de sesgo: m_hat = m/(1-b1**t), v_hat = v/(1-b2**t)")

check("Los momentos coinciden con la referencia", lambda: (
        _ac(m_t, m_r, rtol=1e-6, atol=1e-10),
        _ac(v_t, v_r, rtol=1e-6, atol=1e-10)),
      msg="m = b1*m + (1-b1)*g ; v = b2*v + (1-b2)*g**2")

check("Converge cerca del mínimo en 200 pasos", lambda: bool(np.all(np.abs(theta_t - 3.0) < 0.5)),
      msg="Adam debería llevar theta muy cerca de 3 en 200 pasos con lr=0.05")
`,
    hints: [
      'Primero actualiza $m$ y $v$ con las medias exponenciales; **después** calcula $\\hat{m}$ y $\\hat{v}$.',
      'La corrección de sesgo usa $\\beta^{t}$ con el $t$ que llega como argumento (1 en el primer paso).',
      'El paso final es `param - lr * m_hat / (np.sqrt(v_hat) + eps)`. No actualices `param` con `m` sin corregir.',
    ],
  },
]
