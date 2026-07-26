/**
 * Ejercicios del módulo Redes Neuronales (N3).
 * Prefijo de ids: `redes-`. Cada solution_code está verificado contra su test_code.
 * Incluye el proyecto práctico «mini-MNIST de dígitos» (P3.x, ids redes-digits-*).
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
  /* ---------------------------------------------------------------- */
  /* Proyecto práctico: mini-MNIST de dígitos escritos a mano          */
  /* ---------------------------------------------------------------- */
  {
    id: 'redes-digits-forward',
    title: 'P3.1 · Dígitos: el forward de la red',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: [
      'El clásico de visión por computador: reconocer dígitos escritos a mano. En lugar de MNIST (55 MB que no caben aquí), te damos `make_digits(n_per_class, seed)`: un mini-MNIST procedural con 3 clases —los dígitos **0, 1 y 7**— renderizados como fuentes de píxeles 5×3 sobre un lienzo 8×8, con traslación aleatoria, ruido y píxeles muertos o encendidos al azar. Cada imagen queda aplanada a un vector de 64 valores en $[0, 1]$; las etiquetas son 0, 1 y 2 (para los dígitos 0, 1 y 7).',
      'Tu modelo será un MLP $64 \\rightarrow 16 \\;(\\mathrm{ReLU})\\; \\rightarrow 3 \\;(\\mathrm{softmax})$. Implementa `forward_mlp(X, W1, b1, W2, b2)` para un **batch** completo `X` de forma $(B, 64)$, devolviendo la tupla `(A1, P)`: las activaciones ocultas $(B, 16)$ y las probabilidades $(B, 3)$.',
      '$$Z_1 = XW_1 + b_1, \\quad A_1 = \\max(Z_1, 0), \\quad Z_2 = A_1 W_2 + b_2, \\quad P = \\mathrm{softmax}(Z_2)$$',
      'El softmax debe ser **estable**: resta el máximo de cada fila antes de la exponencial, $\\mathrm{softmax}(z)_i = e^{z_i - m} / \\sum_j e^{z_j - m}$ con $m = \\max(z)$. El resultado es idéntico, pero `np.exp` nunca desborda.',
    ].join('\n\n'),
    starter_code: `import numpy as np

PATTERNS = np.array([
    [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],  # dígito 0
    [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],  # dígito 1
    [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],  # dígito 7
], dtype=float)
CLASES = [0, 1, 7]

def make_digits(n_per_class=150, seed=3):
    """Mini-MNIST procedural: 3 clases (0, 1, 7), imágenes 8x8 aplanadas a 64."""
    rng = np.random.default_rng(seed)
    n = 3 * n_per_class
    X = np.zeros((n, 64))
    y = np.repeat(np.arange(3), n_per_class)
    for i in range(n):
        r = int(rng.integers(0, 4))
        c = int(rng.integers(1, 5))
        img = np.zeros((8, 8))
        img[r:r + 5, c:c + 3] = PATTERNS[y[i]]
        img = img * 0.9 + rng.normal(0, 0.12, (8, 8))
        dead = rng.random((8, 8)) < 0.03
        hot = rng.random((8, 8)) < 0.03
        img[dead] = 0.0
        img[hot] = rng.uniform(0.5, 1.0, int(hot.sum()))
        X[i] = np.clip(img, 0.0, 1.0).ravel()
    return X, y

def forward_mlp(X, W1, b1, W2, b2):
    """Forward de un MLP 64 -> 16 (ReLU) -> 3 (softmax) para un batch X (B, 64).
    Devuelve (A1, P): activaciones ocultas (B, 16) y probabilidades (B, 3)."""
    # TODO: Z1, ReLU, Z2, softmax estable
    return None, None

X, y = make_digits(150, seed=3)
rng = np.random.default_rng(0)
W1 = rng.normal(0, np.sqrt(2 / 64), (64, 16)); b1 = np.zeros(16)
W2 = rng.normal(0, np.sqrt(2 / 16), (16, 3)); b2 = np.zeros(3)
A1, P = forward_mlp(X[:8], W1, b1, W2, b2)
print(P.round(3))
print("las filas suman:", P.sum(axis=1).round(6))
`,
    solution_code: `import numpy as np

PATTERNS = np.array([
    [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],
], dtype=float)
CLASES = [0, 1, 7]

def make_digits(n_per_class=150, seed=3):
    rng = np.random.default_rng(seed)
    n = 3 * n_per_class
    X = np.zeros((n, 64))
    y = np.repeat(np.arange(3), n_per_class)
    for i in range(n):
        r = int(rng.integers(0, 4))
        c = int(rng.integers(1, 5))
        img = np.zeros((8, 8))
        img[r:r + 5, c:c + 3] = PATTERNS[y[i]]
        img = img * 0.9 + rng.normal(0, 0.12, (8, 8))
        dead = rng.random((8, 8)) < 0.03
        hot = rng.random((8, 8)) < 0.03
        img[dead] = 0.0
        img[hot] = rng.uniform(0.5, 1.0, int(hot.sum()))
        X[i] = np.clip(img, 0.0, 1.0).ravel()
    return X, y

def forward_mlp(X, W1, b1, W2, b2):
    Z1 = X @ W1 + b1
    A1 = np.maximum(Z1, 0.0)
    Z2 = A1 @ W2 + b2
    Z2 = Z2 - Z2.max(axis=1, keepdims=True)
    E = np.exp(Z2)
    P = E / E.sum(axis=1, keepdims=True)
    return A1, P
`,
    test_code: `
_X, _y = make_digits(150, seed=3)
check("Dataset: 450 imágenes de 64 píxeles, 3 clases equilibradas",
      lambda: _X.shape == (450, 64) and np.allclose(np.bincount(_y), [150, 150, 150]),
      msg="150 ejemplos por dígito (0, 1, 7), cada imagen 8x8 aplanada")
check("Píxeles en [0, 1]",
      lambda: _X.min() >= 0.0 and _X.max() <= 1.0,
      msg="recorta con np.clip tras añadir el ruido")

_rng = np.random.default_rng(0)
_W1 = _rng.normal(0, np.sqrt(2 / 64), (64, 16))
_b1 = _rng.normal(0, 0.1, 16)
_W2 = _rng.normal(0, np.sqrt(2 / 16), (16, 3))
_b2 = _rng.normal(0, 0.1, 3)
_Xb = _X[:32]

_A1, _P = forward_mlp(_Xb, _W1, _b1, _W2, _b2)
check("Formas: A1 (32, 16) y P (32, 3)",
      lambda: np.asarray(_A1).shape == (32, 16) and np.asarray(_P).shape == (32, 3),
      msg="una fila por imagen del batch; 16 neuronas ocultas, 3 salidas")
check("ReLU: la capa oculta no tiene valores negativos",
      lambda: bool(np.all(_A1 >= 0)),
      msg="A1 = max(Z1, 0) elemento a elemento")
check("Softmax: cada fila de P suma 1 y está en (0, 1)",
      lambda: np.allclose(_P.sum(axis=1), 1.0) and bool(np.all(_P > 0)) and bool(np.all(_P < 1)),
      msg="P = exp(Z2) / sum(exp(Z2)) por fila")

_Z1 = _Xb @ _W1 + _b1
_A1r = np.maximum(_Z1, 0.0)
_Z2 = _A1r @ _W2 + _b2
_E = np.exp(_Z2 - _Z2.max(axis=1, keepdims=True))
_Pr = _E / _E.sum(axis=1, keepdims=True)
check("Coincide con el forward de referencia",
      lambda: np.allclose(_A1, _A1r) and np.allclose(_P, _Pr, atol=1e-10),
      msg="Z1 = X@W1+b1, A1 = relu(Z1), Z2 = A1@W2+b2, P = softmax(Z2)")
check("Softmax estable con logits grandes (sin nan/inf)",
      lambda: bool(np.all(np.isfinite(forward_mlp(_Xb, _W1, _b1, _W2 * 100.0, _b2 * 100.0)[1]))),
      msg="resta el máximo de cada fila antes de exp(): exp(Z - max) nunca desborda")
check("El argmax de P coincide con el argmax de Z2",
      lambda: np.array_equal(np.asarray(_P).argmax(axis=1), _Z2.argmax(axis=1)),
      msg="softmax es monótona: no cambia la clase ganadora")
`,
    hints: [
      'Son cuatro líneas de numpy: `Z1 = X @ W1 + b1`, `A1 = np.maximum(Z1, 0.0)`, `Z2 = A1 @ W2 + b2`, y el softmax por filas.',
      'Softmax estable: `Z2 = Z2 - Z2.max(axis=1, keepdims=True)` antes de `np.exp`; luego divide cada fila entre su suma.',
      'El `keepdims=True` es la clave para que el broadcasting reste/divida fila a fila.',
    ],
  },
  {
    id: 'redes-digits-train',
    title: 'P3.2 · Dígitos: backprop y entrenamiento completo',
    difficulty: 'AVANZADO',
    xp: 140,
    statement: [
      'El jefe del proyecto: entrenar la red del ejercicio anterior con **backpropagation** escrita a mano. Implementa `train_mlp(X, y, hidden=16, lr=0.5, epochs=800, seed=0)` que entrene un MLP $64 \\rightarrow h \\;(\\mathrm{ReLU})\\; \\rightarrow 3 \\;(\\mathrm{softmax})$ minimizando la entropía cruzada con descenso del gradiente batch, y `predict_mlp(X, W1, b1, W2, b2)`.',
      'Inicialización de He con la semilla dada: $W_1 \\sim \\mathcal{N}(0, 2/64)$, $W_2 \\sim \\mathcal{N}(0, 2/h)$, sesgos a cero. Con etiquetas one-hot $Y$, el backward completo es:',
      '$$dZ_2 = \\frac{P - Y}{N}, \\qquad dW_2 = A_1^{\\top} dZ_2, \\qquad dZ_1 = (dZ_2 W_2^{\\top}) \\odot \\mathbb{1}[Z_1 > 0], \\qquad dW_1 = X^{\\top} dZ_1$$',
      'Devuelve la tupla `(W1, b1, W2, b2, losses)`, con `losses` registrando la entropía cruzada media **antes de cada actualización**. El test genera 450 dígitos, reserva 90 para test y exige **accuracy ≥ 0.95 en test** — el dataset es fácil a propósito: una implementación correcta supera 0.97. Entrena en segundos; si tarda más, estás haciendo bucles sobre muestras en vez de operar con el batch entero.',
    ].join('\n\n'),
    starter_code: `import numpy as np

PATTERNS = np.array([
    [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],  # dígito 0
    [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],  # dígito 1
    [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],  # dígito 7
], dtype=float)

def make_digits(n_per_class=150, seed=3):
    """Mini-MNIST procedural: 3 clases (0, 1, 7), imágenes 8x8 aplanadas a 64."""
    rng = np.random.default_rng(seed)
    n = 3 * n_per_class
    X = np.zeros((n, 64))
    y = np.repeat(np.arange(3), n_per_class)
    for i in range(n):
        r = int(rng.integers(0, 4))
        c = int(rng.integers(1, 5))
        img = np.zeros((8, 8))
        img[r:r + 5, c:c + 3] = PATTERNS[y[i]]
        img = img * 0.9 + rng.normal(0, 0.12, (8, 8))
        dead = rng.random((8, 8)) < 0.03
        hot = rng.random((8, 8)) < 0.03
        img[dead] = 0.0
        img[hot] = rng.uniform(0.5, 1.0, int(hot.sum()))
        X[i] = np.clip(img, 0.0, 1.0).ravel()
    return X, y

def train_mlp(X, y, hidden=16, lr=0.5, epochs=800, seed=0):
    """MLP 64 -> hidden (ReLU) -> 3 (softmax), entropía cruzada y GD batch.
    Devuelve (W1, b1, W2, b2, losses) con len(losses) == epochs."""
    # TODO: init He con default_rng(seed), forward, loss, backward, update
    return None, None, None, None, []

def predict_mlp(X, W1, b1, W2, b2):
    """Clase predicha (argmax de los logits) para cada imagen."""
    # TODO
    return None

X, y = make_digits(150, seed=3)
rng = np.random.default_rng(1)
idx = rng.permutation(len(y))
te, tr = idx[:90], idx[90:]
W1, b1, W2, b2, losses = train_mlp(X[tr], y[tr], hidden=16, lr=0.5, epochs=800, seed=0)
acc = np.mean(predict_mlp(X[te], W1, b1, W2, b2) == y[te])
print("loss final:", losses[-1] if losses else None, "| accuracy test:", acc)
`,
    solution_code: `import numpy as np

PATTERNS = np.array([
    [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],
], dtype=float)

def make_digits(n_per_class=150, seed=3):
    rng = np.random.default_rng(seed)
    n = 3 * n_per_class
    X = np.zeros((n, 64))
    y = np.repeat(np.arange(3), n_per_class)
    for i in range(n):
        r = int(rng.integers(0, 4))
        c = int(rng.integers(1, 5))
        img = np.zeros((8, 8))
        img[r:r + 5, c:c + 3] = PATTERNS[y[i]]
        img = img * 0.9 + rng.normal(0, 0.12, (8, 8))
        dead = rng.random((8, 8)) < 0.03
        hot = rng.random((8, 8)) < 0.03
        img[dead] = 0.0
        img[hot] = rng.uniform(0.5, 1.0, int(hot.sum()))
        X[i] = np.clip(img, 0.0, 1.0).ravel()
    return X, y

def train_mlp(X, y, hidden=16, lr=0.5, epochs=800, seed=0):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=int)
    n, d = X.shape
    rng = np.random.default_rng(seed)
    W1 = rng.normal(0, np.sqrt(2.0 / d), (d, hidden))
    b1 = np.zeros(hidden)
    W2 = rng.normal(0, np.sqrt(2.0 / hidden), (hidden, 3))
    b2 = np.zeros(3)
    Y = np.eye(3)[y]
    losses = []
    for _ in range(epochs):
        Z1 = X @ W1 + b1
        A1 = np.maximum(Z1, 0.0)
        Z2 = A1 @ W2 + b2
        E = np.exp(Z2 - Z2.max(axis=1, keepdims=True))
        P = E / E.sum(axis=1, keepdims=True)
        losses.append(float(-np.mean(np.sum(Y * np.log(P + 1e-12), axis=1))))
        dZ2 = (P - Y) / n
        dW2 = A1.T @ dZ2
        db2 = dZ2.sum(axis=0)
        dA1 = dZ2 @ W2.T
        dZ1 = dA1 * (Z1 > 0)
        dW1 = X.T @ dZ1
        db1 = dZ1.sum(axis=0)
        W1 -= lr * dW1
        b1 -= lr * db1
        W2 -= lr * dW2
        b2 -= lr * db2
    return W1, b1, W2, b2, losses

def predict_mlp(X, W1, b1, W2, b2):
    A1 = np.maximum(X @ W1 + b1, 0.0)
    return (A1 @ W2 + b2).argmax(axis=1)
`,
    test_code: `
_X, _y = make_digits(150, seed=3)
_rng = np.random.default_rng(1)
_idx = _rng.permutation(len(_y))
_te, _tr = _idx[:90], _idx[90:]
_Xtr, _Xte, _ytr, _yte = _X[_tr], _X[_te], _y[_tr], _y[_te]

_W1, _b1, _W2, _b2, _losses = train_mlp(_Xtr, _ytr, hidden=16, lr=0.5, epochs=800, seed=0)
check("Formas de los parámetros: (64,16), (16,), (16,3), (3,)",
      lambda: _W1.shape == (64, 16) and _b1.shape == (16,) and _W2.shape == (16, 3) and _b2.shape == (3,),
      msg="W1 conecta 64 píxeles con 16 neuronas; W2 conecta 16 neuronas con 3 clases")
check("losses registra un valor por época y termina muy por debajo",
      lambda: len(_losses) == 800 and _losses[-1] < 0.05 * _losses[0],
      msg="guarda la entropía cruzada antes de cada actualización")
check("La pérdida final es baja (< 0.15)",
      lambda: _losses[-1] < 0.15,
      msg="con lr=0.5 y 800 épocas la red separa casi perfectamente el train")

_pred_tr = predict_mlp(_Xtr, _W1, _b1, _W2, _b2)
_pred_te = predict_mlp(_Xte, _W1, _b1, _W2, _b2)
_acc_tr = float(np.mean(_pred_tr == _ytr))
_acc_te = float(np.mean(_pred_te == _yte))
check("Accuracy en train >= 0.98",
      lambda: _acc_tr >= 0.98,
      msg="revisa dZ2 = (P - Y)/n y la máscara de la ReLU (Z1 > 0) en el backward")
check("Accuracy en test >= 0.95 (objetivo del proyecto)",
      lambda: _acc_te >= 0.95,
      msg="el dataset es fácil: un backprop correcto supera 0.97 en test")
check("Generaliza: test no cae más de 5 puntos respecto a train",
      lambda: _acc_te >= _acc_tr - 0.05,
      msg="si memorizas (train 1.0, test 0.8) algo falla en el pipeline")

_W1b, _b1b, _W2b, _b2b, _ = train_mlp(_Xtr[:64], _ytr[:64], hidden=16, lr=0.5, epochs=5, seed=0)
check("Misma semilla -> mismos pesos (inicialización reproducible)",
      lambda: np.allclose(_W1b, train_mlp(_Xtr[:64], _ytr[:64], 16, 0.5, 5, 0)[0]),
      msg="usa np.random.default_rng(seed) para inicializar")
`,
    hints: [
      'Forward y loss: `Z1 = X@W1+b1`, `A1 = relu(Z1)`, softmax estable, y `loss = -mean(sum(Y * log(P)))` por filas.',
      'El gradiente de entrada es `dZ2 = (P - Y) / n` — la división entre `n` aquí ya promedia todos los gradientes siguientes.',
      'La máscara de la ReLU en el backward es `(Z1 > 0)`, no `(A1 > 0)`: en el borde no afecta, pero lo correcto es mirar la pre-activación.',
    ],
  },
  {
    id: 'redes-digits-errors',
    title: 'P3.3 · Dígitos: autopsia de los errores',
    difficulty: 'BASICO',
    xp: 40,
    statement: [
      'Entrenar es solo la mitad del trabajo; la otra mitad es **mirar los errores**. ¿Qué dígitos se confunde tu red? El 0 y el 7 comparten buena parte de sus píxeles (el anillo del 0 incluye la barra superior y el trazo derecho del 7), así que bajo ruido y traslaciones son los candidatos naturales a confundirse.',
      'Implementa `matriz_confusion(y_true, y_pred, n_clases=3)`: una matriz $(3 \\times 3)$ de enteros donde `M[i, j]` cuenta cuántas veces la clase real $i$ se predijo como $j$ (la diagonal son los aciertos). Y `par_mas_confundido(M)`, que devuelve el par $(i, j)$ con $i < j$ que maximiza $M_{ij} + M_{ji}$ — las confusiones cruzadas entre ambas clases, en cualquier dirección. En empates, gana el par de índice menor.',
      'Estas dos funciones son las mismas que usarías sobre el MNIST real o sobre cualquier clasificador en producción: la matriz de confusión es el primer diagnóstico cuando un modelo «tiene un 95 % de accuracy» pero falla siempre en el mismo sitio.',
    ].join('\n\n'),
    starter_code: `import numpy as np

def matriz_confusion(y_true, y_pred, n_clases=3):
    """M[i, j] = cuántas veces la clase real i se predijo como j."""
    # TODO: recorre los pares (real, predicho) e incrementa
    return np.zeros((n_clases, n_clases), dtype=int)

def par_mas_confundido(M):
    """Par (i, j), i < j, con más confusiones cruzadas M[i,j] + M[j,i].
    Empate: gana el de índice menor."""
    # TODO
    return (0, 1)

y_true = np.array([0, 0, 0, 1, 1, 2, 2, 2])
y_pred = np.array([0, 2, 0, 1, 2, 2, 0, 2])
M = matriz_confusion(y_true, y_pred)
print(M)
print("par más confundido:", par_mas_confundido(M))  # esperado: (0, 2)
`,
    solution_code: `import numpy as np

def matriz_confusion(y_true, y_pred, n_clases=3):
    y_true = np.asarray(y_true, dtype=int)
    y_pred = np.asarray(y_pred, dtype=int)
    M = np.zeros((n_clases, n_clases), dtype=int)
    for real, pred in zip(y_true, y_pred):
        M[real, pred] += 1
    return M

def par_mas_confundido(M):
    M = np.asarray(M)
    n = M.shape[0]
    mejor_par, mejor_cuenta = (0, 1), -1
    for i in range(n):
        for j in range(i + 1, n):
            cuenta = int(M[i, j]) + int(M[j, i])
            if cuenta > mejor_cuenta:
                mejor_cuenta = cuenta
                mejor_par = (i, j)
    return mejor_par
`,
    test_code: `
_yt = np.array([0, 0, 0, 1, 1, 2, 2, 2])
_yp = np.array([0, 2, 0, 1, 2, 2, 0, 2])
check("matriz_confusion cuenta bien (filas = real, columnas = predicción)",
      lambda: np.array_equal(matriz_confusion(_yt, _yp), np.array([[2, 0, 1], [0, 1, 1], [1, 0, 2]])),
      msg="M[0, 2] = 1 (un 0 predicho como clase 2); M[2, 0] = 1 (un 2 predicho como 0)")
check("La diagonal son los aciertos",
      lambda: int(np.trace(matriz_confusion(_yt, _yp))) == int(np.sum(_yt == _yp)),
      msg="trace(M) = aciertos totales")
check("par_mas_confundido ignora la diagonal",
      lambda: par_mas_confundido(np.array([[5, 0, 0], [0, 5, 0], [0, 0, 5]])) == (0, 1),
      msg="sin errores todos los pares empatan a 0: devuelve el primero por orden")
check("Detecta el par correcto aunque la confusión sea en un solo sentido",
      lambda: par_mas_confundido(matriz_confusion(_yt, _yp)) == (0, 2),
      msg="las clases 1 y 2 se confunden 1 vez (1->2); las 0 y 2, 2 veces (0->2 y 2->0): gana (0, 2)")
check("Desempate determinista: gana el par de índice menor",
      lambda: par_mas_confundido(np.array([[3, 2, 0], [2, 3, 0], [0, 0, 3]])) == (0, 1)
              and par_mas_confundido(np.eye(4, dtype=int)) == (0, 1),
      msg="recorre i < j en orden y actualiza solo si la cuenta es estrictamente mayor")

# Sobre predicciones realistas de una red ya entrenada
_rng = np.random.default_rng(5)
_yreal = np.repeat(np.arange(3), 40)
_ypred = _yreal.copy()
_err = _rng.random(120) < 0.08
_cambio = _rng.integers(1, 3, 120)
_ypred[_err] = (_ypred[_err] + _cambio[_err]) % 3
_M = matriz_confusion(_yreal, _ypred)
_Mref = np.zeros((3, 3), dtype=int)
for _r, _p in zip(_yreal, _ypred):
    _Mref[_r, _p] += 1
check("Tu matriz coincide con la referencia en 120 predicciones",
      lambda: np.array_equal(_M, _Mref),
      msg="recorre los pares (real, predicho) e incrementa M[real, pred]")
check("Accuracy desde la matriz = trace / total",
      lambda: np.allclose(np.trace(_M) / _M.sum(), float(np.mean(_yreal == _ypred))),
      msg="la matriz resume todo lo necesario para las métricas por clase")
check("El par más confundido cuadra con la referencia",
      lambda: par_mas_confundido(_M) == par_mas_confundido(_Mref),
      msg="mismo criterio: maximiza M[i,j] + M[j,i] con i < j")
`,
    hints: [
      'La matriz: bucle `for real, pred in zip(y_true, y_pred): M[real, pred] += 1`. Convierte las entradas a enteros con `np.zeros((n, n), dtype=int)`.',
      'Para el par, dos bucles anidados `i < j` comparando `M[i, j] + M[j, i]`; actualiza el mejor solo si la cuenta es **estrictamente** mayor (así el empate lo gana el primero).',
      'No cuentes la diagonal: `M[i, i]` son aciertos, no confusiones.',
    ],
  },
]
