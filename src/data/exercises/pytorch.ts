/**
 * Ejercicios del módulo PyTorch práctico (N7).
 * Prefijo de ids: `pytorch-`. Enfoque micrograd: construyes tu propio
 * mini-PyTorch con numpy y entiendes la API real para siempre.
 * Cada solution_code está verificado contra su test_code (python3 + numpy,
 * harness con check() idéntico al de grading.ts).
 */

import type { Exercise } from '@/lib/exercises'
import { registerExercises } from '@/lib/exercises'

export const PYTORCH_EXERCISES: Exercise[] = [
  {
    id: 'pytorch-micrograd-escalar',
    title: 'E1 · Micrograd: autograd escalar desde cero',
    difficulty: 'BASICO',
    xp: 60,
    statement: String.raw`Vas a construir, en unas 40 líneas, el corazón de PyTorch: \`torch.autograd\`. Implementa la clase \`Value\` — un escalar que recuerda cómo se calculó — con las operaciones \`+\`, \`*\` y \`tanh\`, y un método \`backward()\` que calcule TODOS los gradientes en una sola pasada hacia atrás.

Cada operación crea un \`Value\` nuevo que guarda su valor, sus «padres» y una función \`_backward\` que reparte el gradiente a los padres con su regla local:

si $c = a + b$: $\frac{\partial L}{\partial a} \mathrel{+}= \frac{\partial L}{\partial c}$ (el gradiente se copia)

si $c = a \cdot b$: $\frac{\partial L}{\partial a} \mathrel{+}= b \cdot \frac{\partial L}{\partial c}$

si $c = \tanh(a)$: $\frac{\partial L}{\partial a} \mathrel{+}= (1 - c^2) \cdot \frac{\partial L}{\partial c}$

\`backward()\` debe: (1) ordenar el grafo en **orden topológico** (padres antes que hijos), (2) sembrar \`self.grad = 1.0\` ($\partial L / \partial L = 1$) y (3) recorrer el orden al revés llamando a cada \`_backward\`.

**Ojo al bug clásico**: acumula con \`+=\`. Si una variable se usa dos veces ($y = x \cdot x + x$), sus dos contribuciones al gradiente deben SUMARSE.

Esto que estás construyendo es, literalmente, lo que hace \`loss.backward()\` en PyTorch. Andrej Karpathy lo llama *micrograd* — y cuando lo termines, \`autograd\` jamás volverá a ser magia.`,
    starter_code: `import numpy as np

class Value:
    """Un escalar que recuerda cómo se calculó, para derivarse solo."""
    def __init__(self, data, _hijos=()):
        self.data = float(data)
        self.grad = 0.0          # dL/d(este valor): se rellena en backward()
        self._backward = lambda: None  # cómo repartir el gradiente a los padres
        self._prev = set(_hijos)       # los Value que produjeron este

    def __add__(self, otro):
        otro = otro if isinstance(otro, Value) else Value(otro)
        out = Value(self.data + otro.data, (self, otro))
        def _backward():
            self.grad += 1.0 * out.grad   # d(a+b)/da = 1
            otro.grad += 1.0 * out.grad   # d(a+b)/db = 1
        out._backward = _backward
        return out

    __radd__ = __add__   # para poder escribir 2.0 + a

    def __mul__(self, otro):
        # TODO: como __add__, pero con la regla del producto.
        # self.grad += otro.data * out.grad  ·  otro.grad += self.data * out.grad
        pass

    __rmul__ = __mul__   # para poder escribir 2.0 * a

    def tanh(self):
        # TODO: t = np.tanh(self.data); la derivada local es (1 - t**2)
        pass

    def backward(self):
        # TODO: (1) orden topológico del grafo con DFS,
        # (2) self.grad = 1.0,
        # (3) recorre el orden en reversa llamando a v._backward()
        pass

# Prueba rápida: L = tanh(a*b + a) con a=2, b=-3
a = Value(2.0); b = Value(-3.0)
L = (a * b + a).tanh()
L.backward()
print("L =", L.data)          # esperado: -0.9993...
print("dL/da =", a.grad)      # esperado: ≈ -0.003866 (b+1)·(1-tanh²)
print("dL/db =", b.grad)      # esperado: ≈ 0.002706 (a·(1-tanh²))
`,
    solution_code: `import numpy as np

class Value:
    """Un escalar que recuerda cómo se calculó, para derivarse solo."""
    def __init__(self, data, _hijos=()):
        self.data = float(data)
        self.grad = 0.0
        self._backward = lambda: None
        self._prev = set(_hijos)

    def __add__(self, otro):
        otro = otro if isinstance(otro, Value) else Value(otro)
        out = Value(self.data + otro.data, (self, otro))
        def _backward():
            self.grad += 1.0 * out.grad
            otro.grad += 1.0 * out.grad
        out._backward = _backward
        return out

    __radd__ = __add__

    def __mul__(self, otro):
        otro = otro if isinstance(otro, Value) else Value(otro)
        out = Value(self.data * otro.data, (self, otro))
        def _backward():
            self.grad += otro.data * out.grad
            otro.grad += self.data * out.grad
        out._backward = _backward
        return out

    __rmul__ = __mul__

    def tanh(self):
        t = float(np.tanh(self.data))
        out = Value(t, (self,))
        def _backward():
            self.grad += (1.0 - t * t) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if v not in visitados:
                visitados.add(v)
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()
`,
    test_code: `
def _f_expr(av, bv):
    a = Value(av); b = Value(bv)
    L = (a * b + a).tanh()
    L.backward()
    return a.grad, b.grad, L.data

def _num_a(av, bv, eps=1e-6):
    f = lambda x: np.tanh(x * bv + x)
    return (f(av + eps) - f(av - eps)) / (2 * eps)

def _num_b(av, bv, eps=1e-6):
    f = lambda x: np.tanh(av * x + av)
    return (f(bv + eps) - f(bv - eps)) / (2 * eps)

ga, gb, lv = _f_expr(2.0, -3.0)
check("L.data coincide con tanh(a*b + a)", lambda: np.allclose(lv, np.tanh(2.0 * -3.0 + 2.0)),
      msg="El forward debería dar tanh(-4) ≈ -0.9993")
check("dL/da correcto (vs derivada numérica)", lambda: np.allclose(ga, _num_a(2.0, -3.0), atol=1e-5),
      msg="El gradiente de a no coincide con la derivada numérica: revisa las reglas locales de +, * y tanh")
check("dL/db correcto (vs derivada numérica)", lambda: np.allclose(gb, _num_b(2.0, -3.0), atol=1e-5),
      msg="El gradiente de b no coincide con la derivada numérica")
check("backward() siembra grad=1 en la raíz",
      lambda: (lambda v: (v.backward(), np.allclose(v.grad, 1.0))[1])(Value(0.5).tanh()),
      msg="Al llamar backward() sobre L, L.grad debe empezar en 1.0")
def _t5():
    x = Value(1.5)
    y = x * x + x
    y.backward()
    return np.allclose(x.grad, 2 * 1.5 + 1.0, atol=1e-8)
check("Una variable usada dos veces acumula sus gradientes (y = x*x + x → dy/dx = 2x+1)", _t5,
      msg="Cuando x se usa dos veces, sus contribuciones deben SUMARSE (+= en _backward), no sobreescribirse")
def _t6():
    x = Value(-0.7)
    y = ((x * 2.0 + 1.0) * x).tanh()
    y.backward()
    f = lambda t: np.tanh((t * 2.0 + 1.0) * t)
    num = (f(-0.7 + 1e-6) - f(-0.7 - 1e-6)) / 2e-6
    return np.allclose(x.grad, num, atol=1e-5)
check("Cadena larga con mezcla de ops (vs derivada numérica)", _t6,
      msg="La regla de la cadena debe encadenarse bien en grafos más profundos")
`,
    hints: [
      'La regla local del producto: si $c = a \\cdot b$, entonces $\\partial L/\\partial a \\mathrel{+}= b \\cdot \\partial L/\\partial c$ y al revés. La de tanh: $\\partial L/\\partial a \\mathrel{+}= (1 - \\tanh(a)^2) \\cdot \\partial L/\\partial c$.',
      'Para el orden topológico: DFS desde `self` metiendo cada nodo en la lista DESPUÉS de visitar a sus padres. Recorrer esa lista en reversa garantiza que cada nodo recibe su gradiente antes de repartirlo.',
      'Si `x * x` te da el gradiente de una sola rama, estás usando `=` en vez de `+=` en `_backward`. PyTorch también acumula: por eso existe `zero_grad()`.',
    ],
  },
  {
    id: 'pytorch-broadcasting',
    title: 'E2 · Broadcasting: piensa en lotes, no en bucles',
    difficulty: 'BASICO',
    xp: 40,
    statement: String.raw`Antes de GPU y autograd, el primer superpoder de \`torch.Tensor\` (heredado de numpy) es el **broadcasting**: operar arrays de formas distintas sin escribir un solo bucle. Las reglas: se alinean las formas por la derecha; una dimensión vale 1 puede *estirarse*; una dimensión ausente se convierte en 1.

Implementa cuatro funciones **sin bucles ni comprensiones sobre filas**:

1. \`centra_columnas(X)\`: resta a cada columna su media. Con $X \in \mathbb{R}^{n \times d}$, la media por columna tiene forma $(d,)$ y broadcasting hace el resto.
2. \`normaliza_filas(X)\`: divide cada fila entre su norma $\ell_2$ (si una fila tiene norma 0, déjala igual). Pista: \`keepdims=True\` para obtener forma $(n, 1)$.
3. \`producto_externo(u, v)\`: devuelve $P_{ij} = u_i v_j$, de formas $(m,) \times (k,) \to (m, k)$. Pista: \`u[:, None]\` tiene forma $(m, 1)$ y \`v[None, :]\` forma $(1, k)$.
4. \`predice_lote(X, w, b)\`: el forward de un modelo lineal para un lote entero, $\hat{y} = Xw + b$. Fíjate en que el sesgo $b$ (escalar o vector) se suma a todas las filas a la vez — eso es exactamente lo que hace \`nn.Linear\` con su \`bias\`.

En PyTorch escribirás esto mil veces: \`(x - x.mean(0)) / x.std(0)\`, \`logits - logits.max(dim=1, keepdim=True)\`… El día que dejes de pensar en bucles, escribirás código 100 veces más rápido (en CPU y en GPU).`,
    starter_code: `import numpy as np

def centra_columnas(X):
    """Resta a cada columna su media (X es (n, d) → devuelve (n, d))."""
    # TODO: una línea con X.mean(axis=?) y broadcasting
    pass

def normaliza_filas(X):
    """Divide cada fila entre su norma L2. Filas de norma 0 se quedan igual."""
    # TODO: np.linalg.norm(X, axis=1, keepdims=True) tiene forma (n, 1)
    pass

def producto_externo(u, v):
    """P[i, j] = u[i] * v[j], de (m,) y (k,) a (m, k). Sin bucles."""
    # TODO: convierte u en columna y v en fila con None (np.newaxis)
    pass

def predice_lote(X, w, b):
    """Forward de un modelo lineal por lotes: y = X @ w + b."""
    # TODO: una línea; b puede ser escalar o vector y debe funcionar igual
    pass

# Pruebas rápidas
X = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
print(centra_columnas(X))                    # columnas con media 0
print(normaliza_filas(X))                    # filas con norma 1
print(producto_externo(np.array([1., 2.]), np.array([3., 4., 5.])))
print(predice_lote(X, np.array([1., 0., -1.]), 0.5))
`,
    solution_code: `import numpy as np

def centra_columnas(X):
    """Resta a cada columna su media: X - media_por_columna."""
    return X - X.mean(axis=0)

def normaliza_filas(X):
    """Divide cada fila entre su norma L2 (filas con norma 0 se quedan igual)."""
    normas = np.linalg.norm(X, axis=1, keepdims=True)
    normas = np.where(normas == 0.0, 1.0, normas)
    return X / normas

def producto_externo(u, v):
    """Devuelve la matriz P con P[i, j] = u[i] * v[j], sin bucles."""
    return u[:, None] * v[None, :]

def predice_lote(X, w, b):
    """Predicción de un modelo lineal para un lote: y = X @ w + b."""
    return X @ w + b
`,
    test_code: `
rng = np.random.default_rng(3)
X = rng.normal(size=(5, 4))
check("centra_columnas deja cada columna con media 0",
      lambda: np.allclose(centra_columnas(X).mean(axis=0), 0.0, atol=1e-12),
      msg="Tras centrar, la media de cada columna debe ser 0 (usa X.mean(axis=0) y broadcasting)")
check("centra_columnas no cambia las diferencias dentro de una columna",
      lambda: np.allclose(np.diff(centra_columnas(X), axis=0), np.diff(X, axis=0)),
      msg="Centrar solo desplaza: las diferencias entre filas deben conservarse")
Xn = rng.normal(size=(6, 3))
Nn = normaliza_filas(Xn)
check("normaliza_filas deja cada fila con norma 1",
      lambda: np.allclose(np.linalg.norm(Nn, axis=1), 1.0),
      msg="La norma de cada fila debe ser 1: divide por np.linalg.norm(X, axis=1, keepdims=True)")
check("normaliza_filas mantiene la dirección de cada fila",
      lambda: np.allclose(Nn[0] * np.linalg.norm(Xn[0]), Xn[0]),
      msg="Normalizar no debe rotar el vector, solo escalarlo")
u = np.array([1.0, -2.0, 0.5, 3.0])
v = np.array([2.0, -1.0])
P = producto_externo(u, v)
check("producto_externo tiene forma (len(u), len(v))",
      lambda: P.shape == (4, 2),
      msg="El producto externo de un (4,) con un (2,) debe ser (4, 2): usa u[:, None] * v[None, :]")
check("producto_externo calcula u[i]*v[j]",
      lambda: np.allclose(P, np.array([[u[i] * v[j] for j in range(2)] for i in range(4)])),
      msg="P[i, j] debe ser u[i] * v[j]")
w = rng.normal(size=4)
b = 1.25
check("predice_lote devuelve una predicción por fila (forma (n,))",
      lambda: predice_lote(X, w, b).shape == (5,),
      msg="X (5,4) @ w (4,) + b debe dar forma (5,)")
check("predice_lote coincide con el bucle de referencia",
      lambda: np.allclose(predice_lote(X, w, b), np.array([X[i] @ w + b for i in range(5)])),
      msg="Cada predicción es X[i] · w + b; el broadcasting suma b a todo el vector de una vez")
check("predice_lote acepta sesgo vectorial por muestra",
      lambda: np.allclose(predice_lote(X, w, np.arange(5.0)), X @ w + np.arange(5.0)),
      msg="Con b de forma (n,) también debe funcionar: broadcasting puro")
`,
    hints: [
      '`X.mean(axis=0)` colapsa las filas y devuelve forma `(d,)`; numpy la estira sobre las `n` filas al restar. Para filas necesitas `keepdims=True` y obtener forma `(n, 1)`.',
      '`u[:, None]` añade un eje: de `(m,)` a `(m, 1)`. Cuando `(m, 1)` se multiplica por `(1, k)`, ambos se estiran a `(m, k)`.',
      'El operador `@` ya hace el producto matriz-vector para todo el lote; sumar `b` después es broadcasting gratis.',
    ],
  },
  {
    id: 'pytorch-autograd-tensorial',
    title: 'E3 · Autograd tensorial: tu propio torch.Tensor',
    difficulty: 'INTERMEDIO',
    xp: 90,
    statement: String.raw`El \`Value\` escalar era el juguete; ahora va la herramienta real. Implementa la clase \`Tensor\`: un ndarray de numpy con \`requires_grad\`, \`.grad\` y \`backward()\`. Es, en pequeño, \`torch.Tensor\` + \`torch.autograd\`.

Debe soportar estas operaciones, cada una con su regla de backward:

- **suma** (\`__add__\`): el gradiente se copia a ambos operandos… pero con broadcasting hay que **deshacer la expansión**: si $c = a + b$ con $b$ estirado desde forma $(m,)$ a $(n, m)$, entonces $\partial L/\partial b$ es la suma de las $n$ copias. Te regalamos \`_unbroadcast(grad, shape)\` que hace exactamente eso.
- **producto elemento a elemento** (\`__mul__\`): cada operando recibe el gradiente multiplicado por el dato del otro (con \`_unbroadcast\`).
- **matmul**: si $C = A \, B$, entonces
$$\frac{\partial L}{\partial A} = \frac{\partial L}{\partial C} \, B^{\top}, \qquad \frac{\partial L}{\partial B} = A^{\top} \, \frac{\partial L}{\partial C}$$
- **relu**: deja pasar el gradiente solo donde la entrada era positiva (máscara \`data > 0\`).
- **sum**: $L = \sum_{ij} A_{ij}$ reparte un gradiente de unos: cada elemento recibe \`out.grad\`.

\`backward()\` ya viene hecho (es el mismo orden topológico del ejercicio anterior, con \`id()\` para marcar visitados). Acumula gradientes con suma, como PyTorch: \`p.grad\` no se sobreescribe, se acumula — por eso en el training loop llamas a \`zero_grad()\`.

Cuando termines, habrás implementado el 90 % de lo que usas a diario: \`torch.matmul\`, \`torch.relu\`, broadcasting y \`.backward()\`.`,
    starter_code: `import numpy as np

def _unbroadcast(grad, shape):
    """Reduce \`grad\` hasta que tenga exactamente \`shape\` (inversa del broadcasting)."""
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad

class Tensor:
    """Un ndarray que recuerda cómo se calculó y sabe derivarse."""
    def __init__(self, data, requires_grad=False, _hijos=()):
        self.data = np.asarray(data, dtype=float)
        self.requires_grad = requires_grad
        self.grad = np.zeros_like(self.data)
        self._backward = lambda: None
        self._prev = list(_hijos)

    @property
    def shape(self):
        return self.data.shape

    def _wrap(self, otro):
        return otro if isinstance(otro, Tensor) else Tensor(otro)

    def __add__(self, otro):
        # TODO: forward = self.data + otro.data
        # backward: copia out.grad a cada operando, con _unbroadcast
        pass

    __radd__ = __add__

    def __mul__(self, otro):
        # TODO: forward = self.data * otro.data
        # backward: cada operando recibe out.grad * dato_del_otro, con _unbroadcast
        pass

    __rmul__ = __mul__

    def matmul(self, otro):
        # TODO: forward = self.data @ otro.data
        # dA = out.grad @ B.T   ·   dB = A.T @ out.grad
        pass

    def relu(self):
        # TODO: forward = np.maximum(0, data); backward = mascara (data > 0)
        pass

    def sum(self):
        # TODO: forward = escalar con la suma total; backward = unos * out.grad
        pass

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if id(v) not in visitados:
                visitados.add(id(v))
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

# Prueba rápida: L = relu(X @ W + b).sum()
rng = np.random.default_rng(11)
X = Tensor(rng.normal(size=(4, 3)), requires_grad=True)
W = Tensor(rng.normal(size=(3, 2)), requires_grad=True)
b = Tensor(rng.normal(size=2), requires_grad=True)
L = (X.matmul(W) + b).relu().sum()
L.backward()
print("dL/db =", b.grad)   # cada entrada: nº de filas activas de esa columna
`,
    solution_code: `import numpy as np

def _unbroadcast(grad, shape):
    """Reduce \`grad\` hasta que tenga exactamente \`shape\` (inversa del broadcasting)."""
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad

class Tensor:
    """Un ndarray que recuerda cómo se calculó y sabe derivarse."""
    def __init__(self, data, requires_grad=False, _hijos=()):
        self.data = np.asarray(data, dtype=float)
        self.requires_grad = requires_grad
        self.grad = np.zeros_like(self.data)
        self._backward = lambda: None
        self._prev = list(_hijos)

    @property
    def shape(self):
        return self.data.shape

    def _wrap(self, otro):
        return otro if isinstance(otro, Tensor) else Tensor(otro)

    def __add__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data + otro.data,
                     self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad, otro.data.shape)
        out._backward = _backward
        return out

    __radd__ = __add__

    def __mul__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data * otro.data,
                     self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad * otro.data, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad * self.data, otro.data.shape)
        out._backward = _backward
        return out

    __rmul__ = __mul__

    def matmul(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data @ otro.data,
                     self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad @ otro.data.T
            if otro.requires_grad:
                otro.grad = otro.grad + self.data.T @ out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Tensor(np.maximum(0.0, self.data), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (self.data > 0)
        out._backward = _backward
        return out

    def sum(self):
        out = Tensor(np.array(self.data.sum()), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + np.ones_like(self.data) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if id(v) not in visitados:
                visitados.add(id(v))
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()
`,
    test_code: `
rng = np.random.default_rng(11)
X = Tensor(rng.normal(size=(4, 3)), requires_grad=True)
W = Tensor(rng.normal(size=(3, 2)), requires_grad=True)
b = Tensor(rng.normal(size=2), requires_grad=True)
Z = X.matmul(W) + b
A = Z.relu()
L = A.sum()
L.backward()
mascara = (X.data @ W.data + b.data) > 0
dW_ref = X.data.T @ mascara
db_ref = mascara.sum(axis=0)
dX_ref = mascara @ W.data.T
check("forward: matmul + bias + relu produce la forma correcta",
      lambda: A.shape == (4, 2),
      msg="(4,3) @ (3,2) + (2,) debe dar (4,2); revisa matmul y el broadcasting del sesgo")
check("dL/dW coincide con X.T @ mascara_relu",
      lambda: np.allclose(W.grad, dW_ref, atol=1e-10),
      msg="Por cada posición activa de ReLU pasa gradiente 1: dW = X.T @ mascara")
check("dL/db suma el gradiente por columna (deshacer el broadcasting)",
      lambda: np.allclose(b.grad, db_ref, atol=1e-10),
      msg="El sesgo se sumó a las 4 filas: su gradiente es la SUMA de los gradientes de las 4 filas")
check("dL/dX coincide con mascara @ W.T",
      lambda: np.allclose(X.grad, dX_ref, atol=1e-10),
      msg="En matmul, el gradiente respecto a la izquierda es grad_salida @ W.T")
check("relu bloquea el gradiente donde la entrada era negativa",
      lambda: np.allclose(Z.grad[~mascara], 0.0) and np.allclose(Z.grad[mascara], 1.0),
      msg="ReLU tiene derivada 1 en z>0 y 0 en z<0: filtra el gradiente con la máscara")
def _t_escalar():
    a = Tensor(rng.normal(size=(3, 3)), requires_grad=True)
    c = Tensor(2.5, requires_grad=True)
    L2 = (a * c).sum()
    L2.backward()
    return np.allclose(c.grad, a.data.sum()) and np.allclose(a.grad, np.full((3, 3), 2.5))
check("escalar * matriz: el escalar acumula la suma de todos los gradientes", _t_escalar,
      msg="Si c multiplica a 9 elementos, dL/dc es la suma de los 9; y cada dL/da_ij = c")
def _t_acum():
    w = Tensor(np.array([1.0, -2.0]), requires_grad=True)
    L3 = (w * w).sum() + w.sum()
    L3.backward()
    return np.allclose(w.grad, 2 * np.array([1.0, -2.0]) + 1.0)
check("una variable usada dos veces acumula ambas contribuciones (L = sum(w*w) + sum(w))", _t_acum,
      msg="Los gradientes deben SUMARSE (acumular), no sobreescribirse")
check("backward() siembra unos en la raíz",
      lambda: np.allclose(L.grad, 1.0),
      msg="L.grad debe empezar siendo 1 (dL/dL = 1)")
`,
    hints: [
      'Todas las reglas locales siguen el mismo patrón: `out.grad` es $\\partial L/\\partial(\\text{salida})$; multiplícalo por la derivada local y deshaz el broadcasting con `_unbroadcast` antes de acumular.',
      'En matmul, las formas te guían: si $C = AB$ es $(n, m)$ con $A$ $(n, d)$ y $B$ $(d, m)$, entonces $\\partial L/\\partial A$ debe ser $(n, d)$: solo cuadra como `(out.grad @ B.T)`.',
      'El error más común: olvidar `_unbroadcast` en el sesgo. Si `b` tiene forma `(2,)` y recibe un gradiente `(4, 2)`, su gradiente real es la suma por filas: forma `(2,)`.',
    ],
  },
  {
    id: 'pytorch-training-loop',
    title: 'E4 · El training loop, con TU autograd',
    difficulty: 'INTERMEDIO',
    xp: 100,
    statement: String.raw`Llega el momento de la verdad: entrenar de verdad con el motor que construiste. Abajo tienes la clase \`Tensor\` completa (tu trabajo de E3, ampliada con \`-\`, \`mean()\` y \`zero_grad()\`). Tu misión: escribir \`entrena(X, y, lr, epochs, batch_size, seed)\`, que ajuste una regresión lineal $\hat{y} = Xw + b$ por **SGD con mini-batches**.

El bucle es EXACTAMENTE el de PyTorch; cada línea tuya tiene su equivalente:

\`perm = rng.permutation(n)\` → \`DataLoader(..., shuffle=True)\`

\`pred = xb.matmul(W) + b\` → \`model(xb)\` (el forward)

\`loss = ((pred - yb)**2).mean()\` → \`criterion(pred, yb)\` (\`nn.MSELoss\`)

\`W.zero_grad(); b.zero_grad()\` → \`optimizer.zero_grad()\`

\`loss.backward()\` → \`loss.backward()\` (¡idéntico!)

\`W.data -= lr * W.grad\` → \`optimizer.step()\`

Detalles que importan: baraja los índices **cada epoch** (con la semilla, para que sea reproducible), resetea los gradientes ANTES de \`backward()\` (PyTorch acumula, igual que tu \`Tensor\`), y devuelve \`(W, b, historial)\` con la pérdida sobre TODO el dataset al final de cada epoch. Objetivo: pérdida final < 0.02 y $w \approx (3, -2)$, $b \approx 1$.`,
    starter_code: `import numpy as np

# ---------- TU autograd de E3, ya completo (no toques esta clase) ----------
def _unbroadcast(grad, shape):
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad

class Tensor:
    def __init__(self, data, requires_grad=False, _hijos=()):
        self.data = np.asarray(data, dtype=float)
        self.requires_grad = requires_grad
        self.grad = np.zeros_like(self.data)
        self._backward = lambda: None
        self._prev = list(_hijos)

    @property
    def shape(self):
        return self.data.shape

    def zero_grad(self):
        self.grad = np.zeros_like(self.data)

    def _wrap(self, otro):
        return otro if isinstance(otro, Tensor) else Tensor(otro)

    def __add__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data + otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad, otro.data.shape)
        out._backward = _backward
        return out
    __radd__ = __add__

    def __mul__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data * otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad * otro.data, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad * self.data, otro.data.shape)
        out._backward = _backward
        return out
    __rmul__ = __mul__

    def __neg__(self):
        return self * -1.0

    def __sub__(self, otro):
        return self + (-self._wrap(otro))

    def __rsub__(self, otro):
        return self._wrap(otro) + (-self)

    def matmul(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data @ otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad @ otro.data.T
            if otro.requires_grad:
                otro.grad = otro.grad + self.data.T @ out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Tensor(np.maximum(0.0, self.data), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (self.data > 0)
        out._backward = _backward
        return out

    def tanh(self):
        t = np.tanh(self.data)
        out = Tensor(t, self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (1 - t * t)
        out._backward = _backward
        return out

    def sum(self):
        out = Tensor(np.array(self.data.sum()), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + np.ones_like(self.data) * out.grad
        out._backward = _backward
        return out

    def mean(self):
        return self.sum() * (1.0 / self.data.size)

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if id(v) not in visitados:
                visitados.add(id(v))
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

# ---------- TU TRABAJO: el bucle de entrenamiento ----------
def entrena(X, y, lr=0.1, epochs=150, batch_size=16, seed=0):
    """Regresión lineal y = X @ w + b por SGD con mini-batches.

    Devuelve (W, b, historial): los parámetros aprendidos y la pérdida
    sobre todo el dataset al final de cada epoch.
    """
    rng = np.random.default_rng(seed)
    n = X.shape[0]
    W = Tensor(rng.normal(0.0, 0.1, size=(X.shape[1], 1)), requires_grad=True)
    b = Tensor(np.zeros(1), requires_grad=True)
    historial = []
    for _epoch in range(epochs):
        # TODO 1: baraja los índices: perm = rng.permutation(n)
        for ini in range(0, n, batch_size):
            # TODO 2: saca el batch: idx = perm[ini:ini+batch_size]
            #         xb = Tensor(X[idx]); yb = Tensor(y[idx].reshape(-1, 1))
            # TODO 3: forward + loss: pred = xb.matmul(W) + b
            #         loss = ((pred - yb) * (pred - yb)).mean()
            # TODO 4: W.zero_grad(); b.zero_grad()
            # TODO 5: loss.backward()
            # TODO 6: paso SGD: W.data -= lr * W.grad; b.data -= lr * b.grad
            pass
        # TODO 7: añade a historial la MSE sobre TODO el dataset (float)
    return W, b, historial

# Prueba rápida
rng = np.random.default_rng(42)
X = rng.normal(size=(200, 2))
y = 3.0 * X[:, 0] - 2.0 * X[:, 1] + 1.0 + rng.normal(0, 0.05, 200)
W, b, hist = entrena(X, y)
print("primera pérdida:", hist[0], "→ última:", hist[-1])
print("W =", W.data.ravel(), " b =", b.data)
`,
    solution_code: `import numpy as np

def _unbroadcast(grad, shape):
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad

class Tensor:
    def __init__(self, data, requires_grad=False, _hijos=()):
        self.data = np.asarray(data, dtype=float)
        self.requires_grad = requires_grad
        self.grad = np.zeros_like(self.data)
        self._backward = lambda: None
        self._prev = list(_hijos)

    @property
    def shape(self):
        return self.data.shape

    def zero_grad(self):
        self.grad = np.zeros_like(self.data)

    def _wrap(self, otro):
        return otro if isinstance(otro, Tensor) else Tensor(otro)

    def __add__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data + otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad, otro.data.shape)
        out._backward = _backward
        return out
    __radd__ = __add__

    def __mul__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data * otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad * otro.data, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad * self.data, otro.data.shape)
        out._backward = _backward
        return out
    __rmul__ = __mul__

    def __neg__(self):
        return self * -1.0

    def __sub__(self, otro):
        return self + (-self._wrap(otro))

    def __rsub__(self, otro):
        return self._wrap(otro) + (-self)

    def matmul(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data @ otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad @ otro.data.T
            if otro.requires_grad:
                otro.grad = otro.grad + self.data.T @ out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Tensor(np.maximum(0.0, self.data), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (self.data > 0)
        out._backward = _backward
        return out

    def tanh(self):
        t = np.tanh(self.data)
        out = Tensor(t, self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (1 - t * t)
        out._backward = _backward
        return out

    def sum(self):
        out = Tensor(np.array(self.data.sum()), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + np.ones_like(self.data) * out.grad
        out._backward = _backward
        return out

    def mean(self):
        return self.sum() * (1.0 / self.data.size)

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if id(v) not in visitados:
                visitados.add(id(v))
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

def entrena(X, y, lr=0.1, epochs=150, batch_size=16, seed=0):
    """Regresión lineal y = X @ w + b entrenada con SGD por mini-batches."""
    rng = np.random.default_rng(seed)
    n = X.shape[0]
    W = Tensor(rng.normal(0.0, 0.1, size=(X.shape[1], 1)), requires_grad=True)
    b = Tensor(np.zeros(1), requires_grad=True)
    historial = []
    for _epoch in range(epochs):
        perm = rng.permutation(n)
        for ini in range(0, n, batch_size):
            idx = perm[ini:ini + batch_size]
            xb = Tensor(X[idx])
            yb = Tensor(y[idx].reshape(-1, 1))
            pred = xb.matmul(W) + b
            loss = ((pred - yb) * (pred - yb)).mean()
            W.zero_grad(); b.zero_grad()
            loss.backward()
            W.data -= lr * W.grad
            b.data -= lr * b.grad
        pred_full = Tensor(X).matmul(W) + b
        historial.append(float(np.mean((pred_full.data - y.reshape(-1, 1)) ** 2)))
    return W, b, historial
`,
    test_code: `
rng_t = np.random.default_rng(42)
X_t = rng_t.normal(size=(200, 2))
y_t = 3.0 * X_t[:, 0] - 2.0 * X_t[:, 1] + 1.0 + rng_t.normal(0, 0.05, 200)
W_r, b_r, hist = entrena(X_t, y_t)
check("devuelve (W, b, historial)",
      lambda: isinstance(W_r, Tensor) and isinstance(b_r, Tensor) and len(hist) == 150,
      msg="entrena debe devolver (W, b, historial) con una pérdida por epoch")
check("la pérdida baja de verdad (última < primera / 20)",
      lambda: hist[-1] < hist[0] / 20,
      msg="La pérdida apenas bajó. Revisa el signo del paso SGD (resta, no sumes) y el zero_grad")
check("la pérdida final es < 0.02",
      lambda: hist[-1] < 0.02,
      msg="Con lr=0.1 y 150 epochs la pérdida debería acercarse al nivel de ruido (~0.003)")
check("W aprende los pesos verdaderos [3, -2] (±0.1)",
      lambda: np.allclose(W_r.data.ravel(), [3.0, -2.0], atol=0.1),
      msg="W debería acercarse a [3, -2]; si no, revisa el reshape de yb a (batch, 1)")
check("b aprende el sesgo verdadero 1.0 (±0.1)",
      lambda: np.allclose(b_r.data, [1.0], atol=0.1),
      msg="b debería acercarse a 1.0")
check("el entrenamiento es reproducible con la misma semilla",
      lambda: entrena(X_t, y_t)[2] == hist,
      msg="Misma semilla → mismo shuffle → mismo resultado. Es el torch.manual_seed(42) de tu framework")
def _grad_final():
    W2, b2, _ = entrena(X_t, y_t)
    pred = Tensor(X_t).matmul(W2) + b2
    yb = Tensor(y_t.reshape(-1, 1))
    loss = ((pred - yb) * (pred - yb)).mean()
    W2.zero_grad(); loss.backward()
    return float(np.abs(W2.grad).max()) < 0.05
check("al converger, el gradiente sobre TODO el dataset es casi 0", _grad_final,
      msg="En el óptimo, el gradiente medio es ~0 (el de cada batch no: por eso SGD 'tiembla')")
`,
    hints: [
      'El orden dentro del batch es sagrado: forward → loss → `zero_grad` → `backward` → paso. Si haces `backward` antes de `zero_grad`, mezclas gradientes de batches distintos (a veces es lo que quieres — *gradient accumulation* — pero aquí no).',
      'El paso SGD toca solo los DATOS, no el grafo: `W.data -= lr * W.grad`. En PyTorch por eso el `optimizer.step()` se hace dentro de `torch.no_grad()` implícito.',
      'Para el historial, evalúa sobre todo el dataset SIN entrenar: `Tensor(X).matmul(W) + b`, calcula la MSE con numpy plano y guarda un `float`.',
    ],
  },
  {
    id: 'pytorch-softmax-ce',
    title: 'E5 · Softmax + cross-entropy sin trampa numérica',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: String.raw`En clasificación nunca haces softmax y luego log por separado: es la receta para un \`overflow\`. Implementa la pareja tal como la usa PyTorch en \`torch.nn.functional.cross_entropy\` (que recibe **logits crudos**, no probabilidades).

1. \`softmax_estable(logits)\`: softmax por filas sobre una matriz $(n, k)$:
$$p_{ij} = \frac{e^{z_{ij} - m_i}}{\sum_{c} e^{z_{ic} - m_i}}, \qquad m_i = \max_c z_{ic}$$
Restar el máximo $m_i$ de cada fila no cambia el resultado (el softmax es invariante a constantes) pero evita que \`exp(1000)\` explote.

2. \`cross_entropy(logits, y)\`: la pérdida media, con $y$ los índices de clase correcta:
$$L = -\frac{1}{n} \sum_{i} \log p_{i,\, y_i}$$
\`logits\` es $(n, k)$ e \`y\` es $(n,)$ con enteros $0 \le y_i < k$. Devuelve un \`float\`.

Detalles que los tests vigilan: las probabilidades deben sumar 1 por fila, la función debe sobrevivir a logits de magnitud 1000, y con logits todos iguales la pérdida debe ser exactamente $\log k$. Si alguna vez depuras un \`nan\` en un entrenamiento real, acuérdate de este ejercicio.`,
    starter_code: `import numpy as np

def softmax_estable(logits):
    """Softmax por filas, numéricamente estable. logits: (n, k) → (n, k)."""
    # TODO 1: z = logits - logits.max(axis=1, keepdims=True)
    # TODO 2: e = np.exp(z); devuelve e / e.sum(axis=1, keepdims=True)
    pass

def cross_entropy(logits, y):
    """Entropía cruzada media desde LOGITS crudos.
    logits: (n, k) · y: (n,) con la clase correcta de cada muestra."""
    # TODO 1: probs = softmax_estable(logits)
    # TODO 2: p_correcta = probs[np.arange(n), y]  (indexado fancy)
    # TODO 3: devuelve float(-np.mean(np.log(p_correcta)))
    pass

# Pruebas rápidas
logits = np.array([[2.0, 0.5, -1.0], [0.1, 0.1, 0.1]])
print(softmax_estable(logits))                    # filas que suman 1
print(cross_entropy(logits, np.array([0, 2])))    # mezcla de acierto y empate
print(cross_entropy(np.zeros((4, 5)), np.array([0, 1, 2, 3])))  # = log(5) ≈ 1.609
`,
    solution_code: `import numpy as np

def softmax_estable(logits):
    """Softmax por filas, restando el máximo de cada fila para estabilidad numérica."""
    z = logits - logits.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def cross_entropy(logits, y):
    """Entropía cruzada media desde logits (sin softmax previo).
    logits: (n, k) · y: (n,) con la clase correcta de cada muestra."""
    probs = softmax_estable(logits)
    n = logits.shape[0]
    p_correcta = probs[np.arange(n), y]
    return float(-np.mean(np.log(p_correcta)))
`,
    test_code: `
rng = np.random.default_rng(5)
logits = rng.normal(size=(7, 4))
P = softmax_estable(logits)
check("softmax_estable: cada fila suma 1",
      lambda: np.allclose(P.sum(axis=1), 1.0),
      msg="Cada fila de la salida debe ser una distribución: suma 1")
check("softmax_estable: salidas en (0, 1)",
      lambda: bool(((P > 0) & (P < 1)).all()),
      msg="Las probabilidades deben ser estrictamente positivas y menores que 1")
check("softmax_estable: invariante a sumar una constante a todos los logits",
      lambda: np.allclose(softmax_estable(logits + 1000.0), P),
      msg="softmax(z) = softmax(z + c): resta el máximo por fila y esto sale gratis (y sin overflow)")
check("softmax_estable: no explota con logits enormes",
      lambda: bool(np.isfinite(softmax_estable(np.array([[1000.0, 1001.0, 999.0]]))).all()),
      msg="Sin restar el máximo, exp(1000) = inf: la versión estable debe sobrevivir")
y = rng.integers(0, 4, size=7)
def _ce_ref(lg, yy):
    z = lg - lg.max(axis=1, keepdims=True)
    lse = np.log(np.exp(z).sum(axis=1))
    n = lg.shape[0]
    return float(np.mean(lse - z[np.arange(n), yy]))
check("cross_entropy coincide con la forma log-sum-exp de referencia",
      lambda: np.allclose(cross_entropy(logits, y), _ce_ref(logits, y), atol=1e-10),
      msg="CE = media de (logsumexp(z) - z_clase_correcta)")
check("cross_entropy: predicción perfecta y confiada → pérdida ≈ 0",
      lambda: cross_entropy(np.array([[10.0, -10.0, -10.0], [-10.0, -10.0, 10.0]]), np.array([0, 2])) < 1e-3,
      msg="Si el logit correcto domina, -log(p) ≈ 0")
check("cross_entropy: predicción uniforme sobre k clases → pérdida = log(k)",
      lambda: np.allclose(cross_entropy(np.zeros((5, 6)), rng.integers(0, 6, 5)), np.log(6), atol=1e-10),
      msg="Con logits iguales, p = 1/k y la pérdida es exactamente log(k)")
check("cross_entropy devuelve un float de Python",
      lambda: isinstance(cross_entropy(logits, y), float),
      msg="Devuelve float(...), no un array de numpy")
`,
    hints: [
      'La clave de la estabilidad: `logits.max(axis=1, keepdims=True)` da forma `(n, 1)` y broadcasting lo resta a toda la fila. Es la misma operación que en el ejercicio de broadcasting.',
      'Para seleccionar la probabilidad de la clase correcta de cada fila: `probs[np.arange(n), y]` — indexado fancy, un elemento por fila.',
      'La forma equivalente `logsumexp(z) - z_correcta` es lo que usa PyTorch internamente; si tu resultado difiere de ella, revisa el orden de las operaciones.',
    ],
  },
  {
    id: 'pytorch-mini-framework',
    title: 'E6 · BOSS: tu mini-PyTorch completo',
    difficulty: 'AVANZADO',
    xp: 140,
    statement: String.raw`Júntalo todo. Con la clase \`Tensor\` ya construida (abajo, completa), vas a replicar la API de PyTorch pieza a pieza y entrenar una red de verdad en un problema **no lineal** (dos círculos concéntricos):

1. \`class Linear(n_in, n_out, seed)\` — el \`nn.Linear\` de tu framework: $W$ con inicialización $\mathcal{N}(0, \sqrt{1/n_{in}})$, $b = 0$, \`__call__(x)\` que devuelve $xW + b$ y \`parameters()\` con \`[W, b]\`.
2. \`class MLP(n_in, n_hidden, n_out, seed)\` — el \`nn.Module\`: dos \`Linear\` con $\tanh$ entre medias. Su \`parameters()\` agrupa los de ambas capas (exactamente como \`model.parameters()\` recorre los submódulos).
3. \`mse_loss(pred, target)\` — el \`nn.MSELoss\`: devuelve un \`Tensor\` escalar (¡diferenciable!).
4. \`class SGD(params, lr)\` — el \`torch.optim.SGD\`: \`zero_grad()\` pone a cero todos los \`.grad\` y \`step()\` aplica $p \leftarrow p - \eta \, \nabla_p L$ sobre \`.data\`.
5. \`train(modelo, X, y_onehot, lr, epochs, batch_size, seed)\` — el training loop: shuffle por epoch, batches, \`loss = mse_loss(modelo(xb), yb)\`, \`opt.zero_grad()\`, \`loss.backward()\`, \`opt.step()\`. Devuelve la lista de pérdidas (una por epoch, sobre todo el dataset). Usamos MSE sobre one-hot para no distraernos; en PyTorch real usarías \`CrossEntropyLoss\`.

Los tests generan el dataset de círculos, construyen \`MLP(2, 16, 2, seed=1)\`, entrenan con \`lr=0.5, epochs=300, batch_size=32, seed=0\` y exigen **accuracy ≥ 0.90**. Cuando pase, ya no hay diferencia conceptual entre tu código y esto:

\`\`\`
model = MLP(2, 16, 2); opt = torch.optim.SGD(model.parameters(), lr=0.5)
for xb, yb in loader:
    loss = criterion(model(xb), yb); opt.zero_grad(); loss.backward(); opt.step()
\`\`\`

Eso es PyTorch. Todo lo demás (GPU, AMP, compilación) es ingeniería alrededor de ESTO.`,
    starter_code: `import numpy as np

# ---------- TU autograd, ya completo (no toques esta clase) ----------
def _unbroadcast(grad, shape):
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad

class Tensor:
    def __init__(self, data, requires_grad=False, _hijos=()):
        self.data = np.asarray(data, dtype=float)
        self.requires_grad = requires_grad
        self.grad = np.zeros_like(self.data)
        self._backward = lambda: None
        self._prev = list(_hijos)

    @property
    def shape(self):
        return self.data.shape

    def zero_grad(self):
        self.grad = np.zeros_like(self.data)

    def _wrap(self, otro):
        return otro if isinstance(otro, Tensor) else Tensor(otro)

    def __add__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data + otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad, otro.data.shape)
        out._backward = _backward
        return out
    __radd__ = __add__

    def __mul__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data * otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad * otro.data, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad * self.data, otro.data.shape)
        out._backward = _backward
        return out
    __rmul__ = __mul__

    def __neg__(self):
        return self * -1.0

    def __sub__(self, otro):
        return self + (-self._wrap(otro))

    def __rsub__(self, otro):
        return self._wrap(otro) + (-self)

    def matmul(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data @ otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad @ otro.data.T
            if otro.requires_grad:
                otro.grad = otro.grad + self.data.T @ out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Tensor(np.maximum(0.0, self.data), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (self.data > 0)
        out._backward = _backward
        return out

    def tanh(self):
        t = np.tanh(self.data)
        out = Tensor(t, self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (1 - t * t)
        out._backward = _backward
        return out

    def sum(self):
        out = Tensor(np.array(self.data.sum()), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + np.ones_like(self.data) * out.grad
        out._backward = _backward
        return out

    def mean(self):
        return self.sum() * (1.0 / self.data.size)

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if id(v) not in visitados:
                visitados.add(id(v))
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

# ---------- TU FRAMEWORK ----------
class Linear:
    """Tu nn.Linear: y = x @ W + b con inicialización sensata."""
    def __init__(self, n_in, n_out, seed=0):
        rng = np.random.default_rng(seed)
        # TODO: self.W = Tensor(rng.normal(0, sqrt(1/n_in), (n_in, n_out)), requires_grad=True)
        # TODO: self.b = Tensor(zeros(n_out), requires_grad=True)
        pass
    def __call__(self, x):
        # TODO: devuelve x.matmul(self.W) + self.b
        pass
    def parameters(self):
        # TODO: devuelve la lista [self.W, self.b]
        pass

class MLP:
    """Tu nn.Module: dos Linear con tanh entre medias."""
    def __init__(self, n_in, n_hidden, n_out, seed=0):
        # TODO: self.capa1 = Linear(n_in, n_hidden, seed); self.capa2 = Linear(n_hidden, n_out, seed + 1)
        pass
    def __call__(self, x):
        # TODO: capa1 → tanh → capa2
        pass
    def parameters(self):
        # TODO: concatena los parameters() de ambas capas
        pass

def mse_loss(pred, target):
    # TODO: d = pred - target; devuelve (d * d).mean()  (un Tensor escalar)
    pass

class SGD:
    """Tu torch.optim.SGD."""
    def __init__(self, params, lr):
        self.params = list(params)
        self.lr = lr
    def zero_grad(self):
        # TODO: p.zero_grad() para cada parámetro
        pass
    def step(self):
        # TODO: p.data -= self.lr * p.grad para cada parámetro
        pass

def train(modelo, X, y_onehot, lr=0.5, epochs=300, batch_size=32, seed=0):
    """Shuffle → batches → forward → loss → zero_grad → backward → step.
    Devuelve la lista de pérdidas por epoch (sobre todo el dataset)."""
    rng = np.random.default_rng(seed)
    n = X.shape[0]
    opt = SGD(modelo.parameters(), lr)
    historial = []
    for _epoch in range(epochs):
        # TODO: perm = rng.permutation(n); recorre batches
        #   xb = Tensor(X[idx]); yb = Tensor(y_onehot[idx])
        #   loss = mse_loss(modelo(xb), yb)
        #   opt.zero_grad(); loss.backward(); opt.step()
        # TODO: historial.append(pérdida sobre todo el dataset, float)
        pass
    return historial
`,
    solution_code: `import numpy as np

def _unbroadcast(grad, shape):
    while grad.ndim > len(shape):
        grad = grad.sum(axis=0)
    for i, s in enumerate(shape):
        if s == 1 and grad.shape[i] != 1:
            grad = grad.sum(axis=i, keepdims=True)
    return grad

class Tensor:
    def __init__(self, data, requires_grad=False, _hijos=()):
        self.data = np.asarray(data, dtype=float)
        self.requires_grad = requires_grad
        self.grad = np.zeros_like(self.data)
        self._backward = lambda: None
        self._prev = list(_hijos)

    @property
    def shape(self):
        return self.data.shape

    def zero_grad(self):
        self.grad = np.zeros_like(self.data)

    def _wrap(self, otro):
        return otro if isinstance(otro, Tensor) else Tensor(otro)

    def __add__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data + otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad, otro.data.shape)
        out._backward = _backward
        return out
    __radd__ = __add__

    def __mul__(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data * otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + _unbroadcast(out.grad * otro.data, self.data.shape)
            if otro.requires_grad:
                otro.grad = otro.grad + _unbroadcast(out.grad * self.data, otro.data.shape)
        out._backward = _backward
        return out
    __rmul__ = __mul__

    def __neg__(self):
        return self * -1.0

    def __sub__(self, otro):
        return self + (-self._wrap(otro))

    def __rsub__(self, otro):
        return self._wrap(otro) + (-self)

    def matmul(self, otro):
        otro = self._wrap(otro)
        out = Tensor(self.data @ otro.data, self.requires_grad or otro.requires_grad, (self, otro))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad @ otro.data.T
            if otro.requires_grad:
                otro.grad = otro.grad + self.data.T @ out.grad
        out._backward = _backward
        return out

    def relu(self):
        out = Tensor(np.maximum(0.0, self.data), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (self.data > 0)
        out._backward = _backward
        return out

    def tanh(self):
        t = np.tanh(self.data)
        out = Tensor(t, self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + out.grad * (1 - t * t)
        out._backward = _backward
        return out

    def sum(self):
        out = Tensor(np.array(self.data.sum()), self.requires_grad, (self,))
        def _backward():
            if self.requires_grad:
                self.grad = self.grad + np.ones_like(self.data) * out.grad
        out._backward = _backward
        return out

    def mean(self):
        return self.sum() * (1.0 / self.data.size)

    def backward(self):
        topo = []
        visitados = set()
        def construir(v):
            if id(v) not in visitados:
                visitados.add(id(v))
                for p in v._prev:
                    construir(p)
                topo.append(v)
        construir(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()

class Linear:
    """Una capa densa: y = x @ W + b. Lo que en PyTorch es nn.Linear."""
    def __init__(self, n_in, n_out, seed=0):
        rng = np.random.default_rng(seed)
        escala = np.sqrt(1.0 / n_in)
        self.W = Tensor(rng.normal(0.0, escala, size=(n_in, n_out)), requires_grad=True)
        self.b = Tensor(np.zeros(n_out), requires_grad=True)
    def __call__(self, x):
        return x.matmul(self.W) + self.b
    def parameters(self):
        return [self.W, self.b]

class MLP:
    """Dos capas con tanh entre medias. Lo que en PyTorch es un nn.Module."""
    def __init__(self, n_in, n_hidden, n_out, seed=0):
        self.capa1 = Linear(n_in, n_hidden, seed)
        self.capa2 = Linear(n_hidden, n_out, seed + 1)
    def __call__(self, x):
        return self.capa2(self.capa1(x).tanh())
    def parameters(self):
        return self.capa1.parameters() + self.capa2.parameters()

def mse_loss(pred, target):
    d = pred - target
    return (d * d).mean()

class SGD:
    """El optimizador: guarda parámetros y los mueve contra su gradiente."""
    def __init__(self, params, lr):
        self.params = list(params)
        self.lr = lr
    def zero_grad(self):
        for p in self.params:
            p.zero_grad()
    def step(self):
        for p in self.params:
            p.data -= self.lr * p.grad

def train(modelo, X, y_onehot, lr=0.5, epochs=300, batch_size=32, seed=0):
    """El training loop completo: shuffle → batches → forward → loss → backward → step."""
    rng = np.random.default_rng(seed)
    n = X.shape[0]
    opt = SGD(modelo.parameters(), lr)
    historial = []
    for _epoch in range(epochs):
        perm = rng.permutation(n)
        for ini in range(0, n, batch_size):
            idx = perm[ini:ini + batch_size]
            xb = Tensor(X[idx])
            yb = Tensor(y_onehot[idx])
            loss = mse_loss(modelo(xb), yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
        historial.append(float(mse_loss(modelo(Tensor(X)), Tensor(y_onehot)).data))
    return historial
`,
    test_code: `
def _circulos(n_por_clase=120, seed=7):
    rng = np.random.default_rng(seed)
    ang0 = rng.uniform(0, 2 * np.pi, n_por_clase)
    r0 = 0.7 + rng.normal(0, 0.08, n_por_clase)
    ang1 = rng.uniform(0, 2 * np.pi, n_por_clase)
    r1 = 1.8 + rng.normal(0, 0.12, n_por_clase)
    X = np.vstack([np.c_[r0 * np.cos(ang0), r0 * np.sin(ang0)],
                   np.c_[r1 * np.cos(ang1), r1 * np.sin(ang1)]])
    y = np.concatenate([np.zeros(n_por_clase, dtype=int), np.ones(n_por_clase, dtype=int)])
    return X, y

X_c, y_c = _circulos()
Y_oh = np.eye(2)[y_c]
modelo = MLP(2, 16, 2, seed=1)
check("MLP produce la forma correcta (n, 2)",
      lambda: modelo(Tensor(X_c)).shape == (240, 2),
      msg="Una MLP 2→16→2 aplicada a (240,2) debe devolver (240,2)")
check("parameters() devuelve los 4 tensores (W1, b1, W2, b2)",
      lambda: len(modelo.parameters()) == 4 and all(isinstance(p, Tensor) for p in modelo.parameters()),
      msg="nn.Module.parameters() agrupa los parámetros de todas las subcapas: el tuyo debe hacer lo mismo")
check("mse_loss devuelve un Tensor escalar (diferenciable)",
      lambda: float(mse_loss(modelo(Tensor(X_c[:4])), Tensor(Y_oh[:4])).data) >= 0.0,
      msg="mse_loss debe devolver un Tensor (no un float) para poder llamar a backward()")
hist = train(modelo, X_c, Y_oh, lr=0.5, epochs=300, batch_size=32, seed=0)
acc = float((modelo(Tensor(X_c)).data.argmax(axis=1) == y_c).mean())
check("la pérdida cae (última < primera / 5)",
      lambda: hist[-1] < hist[0] / 5,
      msg="Revisa el orden: zero_grad → backward → step, en cada batch")
check("accuracy ≥ 0.90 en un problema NO lineal",
      lambda: acc >= 0.90,
      msg="Una MLP con tanh debería separar los círculos con holgura; revisa la inicialización y el lr")
check("el entrenamiento es reproducible con la misma semilla",
      lambda: train(MLP(2, 16, 2, seed=1), X_c, Y_oh, lr=0.5, epochs=300, batch_size=32, seed=0)[-1] == hist[-1],
      msg="Con las mismas semillas, dos entrenamientos deben dar la misma pérdida final (como torch.manual_seed)")
`,
    hints: [
      'La inicialización importa: $W \\sim \\mathcal{N}(0, \\sqrt{1/n_{in}})$ mantiene la varianza de las activaciones bajo control. Con ceros absolutos, todas las neuronas ocultas aprenderían lo mismo (problema de simetría).',
      '`parameters()` es el pegamento: el optimizador no conoce tu arquitectura, solo una lista plana de tensores con `.data` y `.grad`. Por eso en PyTorch haces `optim.SGD(model.parameters(), lr=...)`.',
      'Si la pérdida oscila pero no baja: ¿hiciste `zero_grad()` ANTES de `backward()` en cada batch? Si baja lento: ¿el `step()` modifica `p.data` y no `p.grad`?',
    ],
  },
]

registerExercises(PYTORCH_EXERCISES)
