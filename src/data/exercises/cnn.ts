/**
 * Ejercicios del módulo CNN (N4).
 * Prefijo de ids: `cnn-`. Cada solution_code está verificado contra su test_code.
 */

import type { Exercise } from '@/lib/exercises'

export const CNN_EXERCISES: Exercise[] = [
  {
    id: 'cnn-conv2d',
    title: 'E1 · Convolución 2D',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: String.raw`Implementa \`conv2d(img, kernel, stride=1, pad=0)\`: la convolución 2D de un solo canal (correlación cruzada, como en PyTorch — **sin voltear el kernel**):

$$(I * K)[i, j] = \sum_u \sum_v I_{\text{pad}}[s i + u,\; s j + v] \cdot K[u, v]$$

\`img\` es $(n, n)$ o $(H, W)$ y \`kernel\` es $(k, k)$. \`pad\` añade un marco de ceros y \`stride\` es el salto de la ventana. El tamaño de salida es:

$$n_{\text{out}} = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1$$

Los tests te comparan contra una implementación de referencia con bucles sobre arrays aleatorios, incluyendo combinaciones de padding y stride.`,
    starter_code: `import numpy as np

def conv2d(img, kernel, stride=1, pad=0):
    """
    img: (H, W), kernel: (k, k). stride: salto, pad: marco de ceros.
    Devuelve el mapa de salida ((H+2p-k)//s + 1, (W+2p-k)//s + 1).
    """
    # TODO: aplica padding con np.pad, calcula el tamaño de salida y
    # acumula el producto de la ventana por el kernel en cada posición
    H, W = img.shape
    k = kernel.shape[0]
    img_pad = np.pad(img, pad) if pad > 0 else img
    H_out = (H + 2 * pad - k) // stride + 1
    W_out = (W + 2 * pad - k) // stride + 1
    out = np.zeros((H_out, W_out))
    # ... tu doble bucle aquí ...
    return out

# Prueba rápida
img = np.arange(36.0).reshape(6, 6)
kernel = np.array([[1, 0, -1],
                   [1, 0, -1],
                   [1, 0, -1]])
print(conv2d(img, kernel))
`,
    solution_code: `import numpy as np

def conv2d(img, kernel, stride=1, pad=0):
    H, W = img.shape
    k = kernel.shape[0]
    img_pad = np.pad(img, pad) if pad > 0 else img
    H_out = (H + 2 * pad - k) // stride + 1
    W_out = (W + 2 * pad - k) // stride + 1
    out = np.zeros((H_out, W_out))
    for i in range(H_out):
        for j in range(W_out):
            r = i * stride
            c = j * stride
            out[i, j] = np.sum(img_pad[r:r + k, c:c + k] * kernel)
    return out
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

rng = np.random.default_rng(101)

def _conv_ref(img, kernel, stride=1, pad=0):
    H, W = img.shape
    k = kernel.shape[0]
    ip = np.pad(img, pad) if pad > 0 else img
    Ho = (H + 2 * pad - k) // stride + 1
    Wo = (W + 2 * pad - k) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.sum(ip[i*stride:i*stride+k, j*stride:j*stride+k] * kernel)
    return out

img_t = rng.normal(size=(6, 6))
ker_t = rng.normal(size=(3, 3))

_out = conv2d(img_t, ker_t)
check("Shape correcta sin padding ni stride", lambda: _out.shape == (4, 4),
      msg=f"6x6 con k=3, p=0, s=1 → 4x4, y llegó {_out.shape}")

check("Valores correctos (caso base)", lambda: _ac(
        _out, _conv_ref(img_t, ker_t), atol=1e-10),
      msg="Suma la ventana elemento a elemento por el kernel (correlación, sin voltear)")

check("Con padding p=1", lambda: _ac(
        conv2d(img_t, ker_t, stride=1, pad=1), _conv_ref(img_t, ker_t, 1, 1), atol=1e-10),
      msg="np.pad(img, 1) rodea la imagen de ceros; la salida vuelve a ser 6x6")

check("Con stride s=2", lambda: _ac(
        conv2d(img_t, ker_t, stride=2, pad=0), _conv_ref(img_t, ker_t, 2, 0), atol=1e-10),
      msg="La ventana salta de 2 en 2: fila base = i*stride")

check("Padding + stride a la vez", lambda: _ac(
        conv2d(img_t, ker_t, stride=2, pad=2), _conv_ref(img_t, ker_t, 2, 2), atol=1e-10),
      msg="Combina ambos: primero padding, luego ventanas con salto")

img_r = rng.normal(size=(5, 8))
check("Funciona con imágenes rectangulares", lambda: _ac(
        conv2d(img_r, ker_t), _conv_ref(img_r, ker_t), atol=1e-10),
      msg="No asumas H == W: usa img.shape por separado")
`,
    hints: [
      'Rodea la imagen de ceros con `np.pad(img, pad)` antes de convolucionar.',
      'La posición de la ventana en la imagen (con padding) es `(i*stride, j*stride)`; recorta `[r:r+k, c:c+k]`.',
      'Cada celda de salida es `np.sum(ventana * kernel)`. El tamaño de salida ya lo tienes calculado en el starter.',
    ],
  },
  {
    id: 'cnn-max-pool',
    title: 'E2 · Max-pooling',
    difficulty: 'BASICO',
    xp: 30,
    statement: String.raw`Implementa \`max_pool2d(x, size=2, stride=2)\`:

$$\mathrm{pool}(X)[i, j] = \max_{0 \le u,v < \text{size}} X[s i + u,\; s j + v]$$

El max-pooling reduce la resolución quedándose con la activación más fuerte de cada ventana: aporta **invariancia local** a pequeñas traslaciones y hace crecer el campo receptivo.

Los tests cubren el caso clásico no solapado (\`size=2, stride=2\`) y ventanas solapadas (\`size=3, stride=2\`).`,
    starter_code: `import numpy as np

def max_pool2d(x, size=2, stride=2):
    """
    x: (H, W). Devuelve el max de cada ventana de (size, size)
    recorrida con el salto dado.
    """
    H, W = x.shape
    H_out = (H - size) // stride + 1
    W_out = (W - size) // stride + 1
    out = np.zeros((H_out, W_out))
    # TODO: rellena out[i, j] con el máximo de la ventana correspondiente
    return out

# Prueba rápida
x = np.arange(64.0).reshape(8, 8)
print(max_pool2d(x))  # 4x4 con los máximos de cada bloque 2x2
`,
    solution_code: `import numpy as np

def max_pool2d(x, size=2, stride=2):
    H, W = x.shape
    H_out = (H - size) // stride + 1
    W_out = (W - size) // stride + 1
    out = np.zeros((H_out, W_out))
    for i in range(H_out):
        for j in range(W_out):
            r = i * stride
            c = j * stride
            out[i, j] = np.max(x[r:r + size, c:c + size])
    return out
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

rng = np.random.default_rng(77)

def _pool_ref(x, size=2, stride=2):
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i*stride:i*stride+size, j*stride:j*stride+size])
    return out

x_t = rng.normal(size=(8, 8))

check("Shape del caso clásico 8x8 → 4x4", lambda: max_pool2d(x_t).shape == (4, 4),
      msg="size=2, stride=2 sobre 8x8 debe dar 4x4")

check("Valores correctos (no solapado)", lambda: _ac(
        max_pool2d(x_t), _pool_ref(x_t), atol=1e-12),
      msg="out[i,j] = max de la ventana x[2i:2i+2, 2j:2j+2]")

check("Ventanas solapadas size=3, stride=2", lambda: _ac(
        max_pool2d(x_t, size=3, stride=2), _pool_ref(x_t, 3, 2), atol=1e-12),
      msg="Con solape, la ventana sigue empezando en (i*stride, j*stride)")

check("El máximo de cada ventana proviene de la entrada", lambda: bool(
        np.isin(max_pool2d(x_t), x_t).all()),
      msg="Cada valor de salida debe ser exactamente un valor de la entrada (es un max)")
`,
    hints: [
      'La estructura es idéntica a la convolución, pero en vez de `np.sum(ventana * K)` usas `np.max(ventana)`.',
      'La esquina de la ventana es `(i * stride, j * stride)`; el recorte es `[r:r+size, c:c+size]`.',
      'Con stride < size las ventanas se solapan: no hace falta tratarlo como caso especial.',
    ],
  },
  {
    id: 'cnn-dimensiones',
    title: 'E3 · Dimensiones de salida',
    difficulty: 'BASICO',
    xp: 20,
    statement: String.raw`El cálculo mental más usado en CNNs. Implementa \`output_size(n, k, p, s)\` que devuelva el tamaño (entero) del mapa de salida de una convolución sobre una entrada $n \times n$:

$$n_{\text{out}} = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1$$

Ojo a las trampas: el floor importa cuando el stride no divide exactamente, y el padding "same" ($p = (k-1)/2$ con $s=1$) devuelve $n$.

Los 6 casos de prueba incluyen ambas.`,
    starter_code: `import numpy as np

def output_size(n, k, p, s):
    """Tamaño de salida (entero) de una conv n×n, kernel k, padding p, stride s."""
    # TODO: una sola línea (cuidado: división entera)
    return 0

# Prueba rápida
print(output_size(6, 3, 0, 1))   # 4
print(output_size(224, 3, 1, 1)) # 224 (padding "same")
print(output_size(7, 3, 0, 2))   # 3  (¡el floor importa!)
`,
    solution_code: `import numpy as np

def output_size(n, k, p, s):
    return (n + 2 * p - k) // s + 1
`,
    test_code: `
casos = [
    (6, 3, 0, 1, 4),      # caso base
    (224, 3, 1, 1, 224),  # padding "same"
    (7, 3, 0, 2, 3),      # stride que no divide: floor
    (32, 5, 2, 1, 32),    # same con k=5
    (227, 11, 0, 4, 55),  # primera capa de AlexNet
    (14, 3, 0, 2, 6),     # downsampling típico
]
for n_i, k_i, p_i, s_i, esperado in casos:
    check(f"n={n_i}, k={k_i}, p={p_i}, s={s_i} → {esperado}",
          lambda n_i=n_i, k_i=k_i, p_i=p_i, s_i=s_i, esperado=esperado:
              output_size(n_i, k_i, p_i, s_i) == esperado,
          msg=f"Aplica floor((n + 2p - k)/s) + 1; en Python es (n + 2*p - k) // s + 1")

check("Devuelve un entero", lambda: isinstance(output_size(6, 3, 0, 1), (int, np.integer)),
      msg="Usa división entera // (no /), el tamaño de un mapa no puede ser float")
`,
    hints: [
      'Es literalmente la fórmula: `(n + 2*p - k) // s + 1`.',
      'El operador `//` hace la división entera (el floor de la fórmula); con `/` obtendrías un float.',
      'Comprueba mentalmente el caso (7, 3, 0, 2): $(7-3)/2 + 1 = 3$ — la última ventana no cabe y se descarta.',
    ],
  },
  {
    id: 'cnn-conv-multicanal',
    title: 'E4 · Convolución multicanal (capa completa)',
    difficulty: 'AVANZADO',
    xp: 130,
    statement: String.raw`El ejercicio estrella del módulo: una **capa convolucional completa**, como la de PyTorch. Implementa \`conv_forward(X, W, b, stride, pad)\` con:

$$X \in \mathbb{R}^{N \times C_{in} \times H \times W}, \qquad W \in \mathbb{R}^{C_{out} \times C_{in} \times k \times k}, \qquad b \in \mathbb{R}^{C_{out}}$$

$$\text{out}[n, f, i, j] = b_f + \sum_{c=0}^{C_{in}-1} \sum_{u=0}^{k-1} \sum_{v=0}^{k-1} X_{\text{pad}}[n, c,\; s i + u,\; s j + v] \cdot W[f, c, u, v]$$

Cada filtro $f$ suma sobre **todos** los canales de entrada antes de escribir su mapa. Puedes resolverlo con cuatro bucles o reutilizando tu \`conv2d\` del E1 por canal.

Los tests comparan contra una referencia vectorizada con \`im2col\` (la tienes implementada abajo para estudiarla): shapes, valores con \`assert_allclose\`, padding y stride.`,
    starter_code: `import numpy as np

def conv_forward(X, W, b, stride=1, pad=0):
    """
    X: (N, C_in, H, W_dim). W: (C_out, C_in, k, k). b: (C_out,)
    Devuelve out: (N, C_out, H_out, W_out).
    """
    N, C_in, H, W_dim = X.shape
    C_out, _, k, _ = W.shape
    X_pad = np.pad(X, ((0, 0), (0, 0), (pad, pad), (pad, pad))) if pad > 0 else X
    H_out = (H + 2 * pad - k) // stride + 1
    W_out = (W_dim + 2 * pad - k) // stride + 1
    out = np.zeros((N, C_out, H_out, W_out))
    # TODO: para cada muestra n y filtro f, suma sobre canales la correlación
    # de X_pad[n, c] con W[f, c], y añade el sesgo b[f]
    return out

# --- im2col: la forma vectorizada "profesional" (referencia, no hace falta usarla) ---
def im2col(X, k, stride, pad):
    N, C, H, Wd = X.shape
    Xp = np.pad(X, ((0,0),(0,0),(pad,pad),(pad,pad)))
    Ho = (H + 2*pad - k)//stride + 1
    Wo = (Wd + 2*pad - k)//stride + 1
    cols = np.zeros((N, C, k, k, Ho, Wo))
    for u in range(k):
        for v in range(k):
            cols[:, :, u, v] = Xp[:, :, u:u+stride*Ho:stride, v:v+stride*Wo:stride]
    return cols.transpose(0, 4, 5, 1, 2, 3).reshape(N*Ho*Wo, -1)

# Prueba rápida
rng = np.random.default_rng(0)
X = rng.normal(size=(2, 3, 6, 6))
W = rng.normal(size=(4, 3, 3, 3))
b = rng.normal(size=4)
print(conv_forward(X, W, b, stride=1, pad=1).shape)  # (2, 4, 6, 6)
`,
    solution_code: `import numpy as np

def conv_forward(X, W, b, stride=1, pad=0):
    N, C_in, H, W_dim = X.shape
    C_out, _, k, _ = W.shape
    X_pad = np.pad(X, ((0, 0), (0, 0), (pad, pad), (pad, pad))) if pad > 0 else X
    H_out = (H + 2 * pad - k) // stride + 1
    W_out = (W_dim + 2 * pad - k) // stride + 1
    out = np.zeros((N, C_out, H_out, W_out))
    for n in range(N):
        for f in range(C_out):
            acc = np.zeros((H_out, W_out))
            for c in range(C_in):
                for i in range(H_out):
                    for j in range(W_out):
                        r = i * stride
                        cc = j * stride
                        acc[i, j] += np.sum(X_pad[n, c, r:r + k, cc:cc + k] * W[f, c])
            out[n, f] = acc + b[f]
    return out
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

rng = np.random.default_rng(2024)

def _conv_ref(X, W, b, stride, pad):
    N, C, H, Wd = X.shape
    F, _, k, _ = W.shape
    Xp = np.pad(X, ((0,0),(0,0),(pad,pad),(pad,pad))) if pad > 0 else X
    Ho = (H + 2*pad - k)//stride + 1
    Wo = (Wd + 2*pad - k)//stride + 1
    cols = np.zeros((N, C, k, k, Ho, Wo))
    for u in range(k):
        for v in range(k):
            cols[:, :, u, v] = Xp[:, :, u:u+stride*Ho:stride, v:v+stride*Wo:stride]
    cols = cols.transpose(0, 4, 5, 1, 2, 3).reshape(N*Ho*Wo, -1)
    out = cols @ W.reshape(F, -1).T + b
    return out.T.reshape(N, F, Ho, Wo).transpose(0, 1, 2, 3) if False else out.reshape(N, Ho, Wo, F).transpose(0, 3, 1, 2)

X_t = rng.normal(size=(2, 3, 6, 6))
W_t = rng.normal(size=(4, 3, 3, 3))
b_t = rng.normal(size=4)

_out = conv_forward(X_t, W_t, b_t, stride=1, pad=0)
check("Shape correcta: (N, C_out, H_out, W_out)", lambda: _out.shape == (2, 4, 4, 4),
      msg=f"Esperado (2, 4, 4, 4) y llegó {_out.shape}: orden N, C_out, H_out, W_out")

check("Valores correctos vs referencia im2col", lambda: _ac(
        _out, _conv_ref(X_t, W_t, b_t, 1, 0), atol=1e-9),
      msg="Cada filtro suma sobre TODOS los canales de entrada, luego añade b[f]")

check("Con padding same", lambda: _ac(
        conv_forward(X_t, W_t, b_t, 1, 1), _conv_ref(X_t, W_t, b_t, 1, 1), atol=1e-9),
      msg="Aplica el padding por muestra y canal: np.pad con ((0,0),(0,0),(p,p),(p,p))")

check("Con stride 2", lambda: _ac(
        conv_forward(X_t, W_t, b_t, 2, 1), _conv_ref(X_t, W_t, b_t, 2, 1), atol=1e-9),
      msg="La ventana empieza en (i*stride, j*stride) dentro del eje espacial")

X1 = rng.normal(size=(1, 1, 5, 5))
W1 = rng.normal(size=(2, 1, 3, 3))
b1 = np.array([0.5, -0.5])
check("Caso 1 canal → equivale a conv2d por filtro", lambda: _ac(
        conv_forward(X1, W1, b1, 1, 0), _conv_ref(X1, W1, b1, 1, 0), atol=1e-9),
      msg="Con C_in=1 cada filtro es una conv2d simple más su sesgo")
`,
    hints: [
      'Estructura de bucles: `for n, for f, for c, for i, for j` — el filtro $f$ acumula sobre todos los canales $c$ antes de sumar $b_f$.',
      'El padding en 4D: `np.pad(X, ((0,0),(0,0),(pad,pad),(pad,pad)))` — solo se rellenan los ejes espaciales.',
      'Si tu E1 funciona, puedes llamarlo por canal: `acc += conv2d(X_pad[n, c], W[f, c], stride, 0)` (ojo: ahí ya no metas pad).',
    ],
  },
  {
    id: 'cnn-bloque-residual',
    title: 'E5 · Bloque residual',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: String.raw`La idea que desbloqueó las redes de 100+ capas. Implementa \`residual_block(x, W1, b1, W2, b2)\`:

$$y = \mathrm{relu}\Big( F(x) + x \Big), \qquad F(x) = \mathrm{conv}\big(\mathrm{relu}(\mathrm{conv}(x, W_1, b_1)), W_2, b_2\big)$$

Las convoluciones son 3×3 con padding 1 y stride 1 (**same**), de un solo canal: \`x\` es $(H, W)$ y \`W1\`, \`W2\` son $(3, 3)$.

La conexión de atajo suma la entrada intacta a la salida de la rama convolucional — por ahí es por donde fluye el gradiente en una ResNet: $\frac{\partial y}{\partial x}$ siempre contiene un camino directo.

Los tests verifican que con pesos nulos el bloque degenera en $\mathrm{relu}(x)$ (identidad para entradas positivas) y los valores contra una referencia.`,
    starter_code: `import numpy as np

def residual_block(x, W1, b1, W2, b2):
    """
    x: (H, W). W1, W2: (3, 3). b1, b2: escalares.
    conv -> relu -> conv -> +x -> relu. Convoluciones same (k=3, p=1, s=1).
    """
    def conv_same(img, kernel, bias):
        H, W = img.shape
        xp = np.pad(img, 1)
        out = np.zeros((H, W))
        for i in range(H):
            for j in range(W):
                out[i, j] = np.sum(xp[i:i+3, j:j+3] * kernel) + bias
        return out

    # TODO: implementa la rama F(x), suma el atajo y aplica la relu final
    return x

# Prueba rápida: con pesos cero, el bloque equivale a relu(x)
rng = np.random.default_rng(0)
x = rng.normal(size=(8, 8))
W = np.zeros((3, 3))
print(np.allclose(residual_block(x, W, 0.0, W, 0.0), np.maximum(0, x)))  # True
`,
    solution_code: `import numpy as np

def residual_block(x, W1, b1, W2, b2):
    def conv_same(img, kernel, bias):
        H, W = img.shape
        xp = np.pad(img, 1)
        out = np.zeros((H, W))
        for i in range(H):
            for j in range(W):
                out[i, j] = np.sum(xp[i:i+3, j:j+3] * kernel) + bias
        return out

    h = np.maximum(0.0, conv_same(x, W1, b1))
    F = conv_same(h, W2, b2)
    return np.maximum(0.0, F + x)
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

def _conv_same_ref(img, kernel, bias):
    H, W = img.shape
    xp = np.pad(img, 1)
    out = np.zeros((H, W))
    for i in range(H):
        for j in range(W):
            out[i, j] = np.sum(xp[i:i+3, j:j+3] * kernel) + bias
    return out

def _res_ref(x, W1, b1, W2, b2):
    h = np.maximum(0.0, _conv_same_ref(x, W1, b1))
    F = _conv_same_ref(h, W2, b2)
    return np.maximum(0.0, F + x)

rng = np.random.default_rng(9)
x_t = rng.normal(size=(9, 7))
W1_t = rng.normal(scale=0.4, size=(3, 3))
W2_t = rng.normal(scale=0.4, size=(3, 3))
b1_t, b2_t = 0.1, -0.2

check("Conserva el shape (same)", lambda: residual_block(x_t, W1_t, b1_t, W2_t, b2_t).shape == x_t.shape,
      msg="El bloque residual no cambia la resolución: k=3, p=1, s=1")

check("Valores correctos vs referencia", lambda: _ac(
        residual_block(x_t, W1_t, b1_t, W2_t, b2_t), _res_ref(x_t, W1_t, b1_t, W2_t, b2_t), atol=1e-10),
      msg="Orden: conv -> relu -> conv -> sumar x -> relu")

check("Pesos nulos → relu(x) (el atajo sobrevive)", lambda: _ac(
        residual_block(x_t, np.zeros((3,3)), 0.0, np.zeros((3,3)), 0.0), np.maximum(0, x_t), atol=1e-12),
      msg="Con F(x)=0 la salida es relu(x): la conexión de atajo debe sumar la x ORIGINAL")

check("El atajo suma la entrada intacta (gradient flow)", lambda: _ac(
        residual_block(x_t, np.zeros((3,3)), 0.0, np.zeros((3,3)), 0.0) - np.maximum(0, x_t),
        0.0, atol=1e-12),
      msg="Si sumaras x después de la relu final o dentro de la rama, este test fallaría")
`,
    hints: [
      'Guarda la entrada original: `x_in = x` antes de la rama, y súmala al final: `relu(F + x_in)`.',
      'La primera conv va seguida de ReLU; la segunda NO lleva activación propia (la relu final es compartida tras la suma).',
      'Con `np.pad(img, 1)` y ventanas `[i:i+3, j:j+3]` la convolución es automáticamente "same".',
    ],
  },
]
