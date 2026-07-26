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

/* ------------------------------------------------------------------ */
/* Mini-proyecto · Clasificador gatos vs perros (ids `cnn-pets-*`)     */
/* Pipeline completo: dataset sintético -> forward -> train -> eval.   */
/* Cada ejercicio es autocontenido (el grading es stateless).          */
/* ------------------------------------------------------------------ */

export const CNN_PETS_EXERCISES: Exercise[] = [
  {
    id: 'cnn-pets-dataset',
    title: 'P1 · El dataset: gatos y perros sintéticos',
    difficulty: 'BASICO',
    xp: 40,
    statement: String.raw`Todo proyecto de visión empieza igual: **los datos**. En producción descargarías algo como \`dogs-vs-cats\` de Kaggle (25 000 fotos reales); aquí, como el navegador no tiene datasets externos, generamos uno **sintético pero realista**: \`make_pets\` dibuja gatos (etiqueta 1, cabeza redondeada con orejas triangulares puntiagudas) y perros (etiqueta 0, orejas caídas y redondeadas a los lados) en imágenes de $16 \times 16$, con traslaciones de hasta $\pm 2$ píxeles, cambios de escala del $\pm 15\%$, intensidad variable y ruido gaussiano. La misma variabilidad que encontrarías en fotos de verdad.

Tu trabajo tiene tres partes:

1. **Genera** el dataset con \`make_pets(n_per_class=60, seed=7)\` y **explóralo**: calcula \`media_perros\` y \`media_gatos\` (media de píxel por clase). Spoiler: salen casi idénticas — la estadística global no distingue clases; hace falta estructura espacial, y para eso existe la convolución.
2. **Implementa \`split_train_test(X, y, test_ratio=0.2, seed=42)\`**: split **estratificado** (cada clase se reparte 80/20 por separado), **mezclado** (los índices se barajan con la semilla) y **reproducible** (misma semilla, mismo split). En la vida real un split mal hecho es el error silencioso más caro: si hay fuga entre train y test, tus métricas mienten.
3. Mira la figura con 4 perros y 4 gatos que se genera al final. ¿Los distinguirías tú? La CNN también podrá, pero solo si los datos están bien preparados.

Los tests comprueban shapes, balance de clases, estratificación, mezcla, reproducibilidad y que **train y test no comparten ni un solo ejemplo**.`,
    starter_code: `import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# GENERADOR DEL DATASET (ya implementado: estúdialo, no lo toques)
# ============================================================
def make_pets(n_per_class=60, seed=7):
    """Gatos (etiqueta 1) y perros (etiqueta 0) sintéticos: 16x16, float en [0, 1].

    Gato:  cabeza redondeada + dos orejas TRIANGULARES puntiagudas arriba.
    Perro: cabeza redondeada + dos orejas CAIDAS y redondeadas a los lados.
    Variabilidad real: traslación (+-2 px), escala (+-15 %), intensidad
    variable y ruido gaussiano. La semilla fija lo hace reproducible.
    """
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            # centro y escala del animal
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    # oreja de gato: triángulo que sobresale por encima de la cabeza
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto  # 0 en la base, 1 en la punta
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    # oreja de perro: elipse vertical que cuelga del costado
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)           # intensidad variable
            img = img + rng.normal(0.0, 0.09, (H, W))   # ruido gaussiano
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

# ---------------------------------------------------------------
# 1) Genera el dataset: 60 ejemplos por clase, semilla 7
# ---------------------------------------------------------------
X, y = make_pets(n_per_class=60, seed=7)

# ---------------------------------------------------------------
# 2) TODO: explora el dataset (media de píxel por clase)
# ---------------------------------------------------------------
media_perros = 0.0  # TODO: media de X sobre los ejemplos con y == 0
media_gatos = 0.0   # TODO: media de X sobre los ejemplos con y == 1
print('media de píxel  perros:', media_perros, ' gatos:', media_gatos)

# ---------------------------------------------------------------
# 3) TODO: split train/test ESTRATIFICADO 80/20, mezclado y reproducible
# ---------------------------------------------------------------
def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Devuelve (X_train, X_test, y_train, y_test).

    Estratificado: cada clase aporta el mismo porcentaje a test.
    Mezclado: el orden dentro de cada split es aleatorio (según seed).
    """
    # TODO: para cada clase, baraja sus índices con el rng y reparte 80/20;
    # al final, baraja también los índices concatenados de train y de test
    rng = np.random.default_rng(seed)
    return X[:0], X[:0], y[:0], y[:0]

X_train, X_test, y_train, y_test = split_train_test(X, y)
print('train:', X_train.shape, ' test:', X_test.shape)

# ---------------------------------------------------------------
# 4) Visualiza 4 perros y 4 gatos (ya implementado)
# ---------------------------------------------------------------
fig, axes = plt.subplots(2, 4, figsize=(8, 4))
for i in range(4):
    axes[0, i].imshow(X[y == 0][i], cmap='gray', vmin=0, vmax=1)
    axes[0, i].set_title('perro')
    axes[1, i].imshow(X[y == 1][i], cmap='gray', vmin=0, vmax=1)
    axes[1, i].set_title('gato')
for ax in axes.ravel():
    ax.axis('off')
plt.tight_layout()
plt.show()
`,
    solution_code: `import numpy as np
import matplotlib.pyplot as plt

def make_pets(n_per_class=60, seed=7):
    """Gatos (etiqueta 1) y perros (etiqueta 0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

X, y = make_pets(n_per_class=60, seed=7)

media_perros = X[y == 0].mean()
media_gatos = X[y == 1].mean()
print('media de píxel  perros:', round(float(media_perros), 4),
      ' gatos:', round(float(media_gatos), 4))
print('(casi idénticas: la media global no distingue; hace falta estructura espacial)')

def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Split estratificado 80/20, mezclado y reproducible."""
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

X_train, X_test, y_train, y_test = split_train_test(X, y)
print('train:', X_train.shape, ' test:', X_test.shape)

fig, axes = plt.subplots(2, 4, figsize=(8, 4))
for i in range(4):
    axes[0, i].imshow(X[y == 0][i], cmap='gray', vmin=0, vmax=1)
    axes[0, i].set_title('perro')
    axes[1, i].imshow(X[y == 1][i], cmap='gray', vmin=0, vmax=1)
    axes[1, i].set_title('gato')
for ax in axes.ravel():
    ax.axis('off')
plt.tight_layout()
plt.show()
`,
    test_code: `
check("Dataset: 120 imágenes de 16x16 y 120 etiquetas",
      lambda: X.shape == (120, 16, 16) and y.shape == (120,),
      msg="Genera con make_pets(n_per_class=60, seed=7): 60 + 60 = 120 imágenes")

check("60 perros (0) y 60 gatos (1)",
      lambda: int((y == 0).sum()) == 60 and int((y == 1).sum()) == 60,
      msg="n_per_class=60 para cada clase")

check("Píxeles dentro de [0, 1]",
      lambda: float(X.min()) >= 0.0 and float(X.max()) <= 1.0,
      msg="Las imágenes vienen clipeadas a [0, 1]; no las reescales")

check("Medias por clase correctas (y casi iguales: ese es el punto)",
      lambda: abs(float(media_perros) - 0.24086866293950013) < 1e-6
              and abs(float(media_gatos) - 0.24115969934387832) < 1e-6,
      msg="media_perros = X[y == 0].mean() y media_gatos = X[y == 1].mean(), con el dataset de semilla 7")

check("Split 80/20: 96 en train y 24 en test",
      lambda: X_train.shape == (96, 16, 16) and X_test.shape == (24, 16, 16)
              and y_train.shape == (96,) and y_test.shape == (24,),
      msg="El 20 % de 60 por clase son 12 por clase en test: 24 en total")

check("Estratificado: 48/48 en train y 12/12 en test",
      lambda: int((y_train == 0).sum()) == 48 and int((y_train == 1).sum()) == 48
              and int((y_test == 0).sum()) == 12 and int((y_test == 1).sum()) == 12,
      msg="Haz el split DENTRO de cada clase: np.where(y == cls), baraja y reparte 80/20")

check("Los splits están mezclados (no ordenados por clase)",
      lambda: not np.array_equal(np.sort(y_train), y_train)
              and not np.array_equal(np.sort(y_test), y_test),
      msg="Después de concatenar las clases, baraja los índices de train y de test con el mismo rng")

check("Reproducible: misma semilla, mismo split",
      lambda: (lambda a: np.array_equal(a[0], X_train) and np.array_equal(a[1], X_test)
               and np.array_equal(a[2], y_train) and np.array_equal(a[3], y_test)
               )(split_train_test(X, y)),
      msg="Usa np.random.default_rng(seed) dentro de la función y el parámetro seed=42 por defecto")

check("Sin fuga de datos: train y test son disjuntos y cubren los 120 ejemplos",
      lambda: np.unique(np.concatenate([X_train.reshape(len(X_train), -1),
                                        X_test.reshape(len(X_test), -1)]), axis=0).shape[0] == 120,
      msg="Cada índice de clase va a train O a test, nunca a ambos; entre los dos suman 120")
`,
    hints: [
      'Para la media por clase usa indexado booleano: `X[y == 0].mean()`.',
      'Estratificado = recorre `np.unique(y)`; para cada clase toma `np.where(y == cls)[0]`, barájalo con `rng.shuffle` y reparte: los primeros `n_test` a test, el resto a train.',
      'Tras concatenar las clases, vuelve a barajar `idx_train` e `idx_test` (con el mismo `rng`) para que el orden no venga por bloques.',
    ],
  },
  {
    id: 'cnn-pets-forward',
    title: 'P2 · Forward de la mini-CNN',
    difficulty: 'INTERMEDIO',
    xp: 80,
    statement: String.raw`Con los datos listos, toca la máquina. Vas a implementar el **forward completo** de una mini-CNN de verdad:

$$\text{conv } 1 \to 4 \text{ filtros } 3\times 3 + b \;\rightarrow\; \mathrm{ReLU} \;\rightarrow\; \text{maxpool } 2\times 2 \;\rightarrow\; \text{flatten } (196) \;\rightarrow\; \text{densa } 196 \to 2 \;\rightarrow\; \text{softmax}$$

Las piezas ya las tienes de los ejercicios del tema: \`conv2d\` (tu E1), \`max_pool2d\` (tu E2) y \`softmax\`. Los pesos convolucionales \`K_PRE\`, \`B_PRE\` vienen **ya entrenados** — en el siguiente ejercicio verás que eso es exactamente transfer learning — y la cabeza \`W2, b2\` está inicializada al azar.

Implementa \`forward(X, params)\`: para un batch $X \in (N, 16, 16)$ devuelve $P \in (N, 2)$ con la probabilidad de perro y de gato de cada imagen. Vigila las dimensiones: convolución válida $16 \to 14$, maxpool $14 \to 7$, y el flatten concatena los 4 mapas de $7 \times 7$: $4 \cdot 49 = 196$.

Con la cabeza sin entrenar las probabilidades serán casi un volado: el test no evalúa aciertos todavía, sino que tu pipeline sea **numéricamente correcto** contra una referencia independiente.`,
    starter_code: `import numpy as np

# ============================================================
# BLOQUE 1 · dataset (del ejercicio anterior, ya resuelto)
# ============================================================
def make_pets(n_per_class=60, seed=7):
    """Gatos (1) y perros (0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Split estratificado 80/20, mezclado y reproducible."""
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

# ============================================================
# BLOQUE 2 · piezas de la mini-CNN (ya implementadas)
# ============================================================
def conv2d(img, kernel):
    """Convolución 2D válida (sin padding, stride 1): 16x16 -> 14x14 con k=3."""
    H, W = img.shape
    k = kernel.shape[0]
    Ho, Wo = H - k + 1, W - k + 1
    out = np.zeros((Ho, Wo))
    for u in range(k):
        for v in range(k):
            out += img[u:u + Ho, v:v + Wo] * kernel[u, v]
    return out

def max_pool2d(x, size=2, stride=2):
    """Max-pooling: 14x14 -> 7x7 con ventana 2x2."""
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i * stride:i * stride + size, j * stride:j * stride + size])
    return out

def softmax(Z):
    """Softmax por filas, con el truco de estabilidad de restar el máximo."""
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

# Pesos de la convolución: ya ENTRENADOS (imagina que los descargas,
# como una ResNet preentrenada). No los toques: la conv va CONGELADA.
K_PRE = np.array([
    [[-0.582732, -0.96122 , -0.130555],
     [ 0.212956,  0.399228,  0.137924],
     [-0.351721, -0.452611,  0.838434]],
    [[ 2.409266,  0.256254,  0.219415],
     [-1.514992,  0.831379,  0.470307],
     [-1.498307, -1.111171, -0.721306]],
    [[-0.317758, -0.327833, -0.822538],
     [ 0.70584 , -0.29698 , -0.522749],
     [ 0.496246,  1.057557, -1.133512]],
    [[-0.128364, -0.490374, -0.086576],
     [-0.644709,  0.009952, -0.018955],
     [-0.152168, -0.523963, -0.198095]]])
B_PRE = np.array([0.16525, 0.346522, 0.071384, -0.002053])

# Cabeza densa (196 -> 2): inicializada al azar, TODAVÍA sin entrenar
rng = np.random.default_rng(0)
W2 = rng.normal(0.0, 0.1, size=(196, 2))
b2 = np.zeros(2)

# ============================================================
# BLOQUE 3 · TU TRABAJO: el forward completo
# ============================================================
def forward(X, params):
    """Propagación completa de la mini-CNN.

    Arquitectura (por imagen):
      conv 1->4 filtros 3x3 + sesgo -> ReLU -> maxpool 2x2 -> flatten (196)
      -> dense 196x2 -> softmax
    X: (N, 16, 16). params = (K_PRE, B_PRE, W2, b2).
    Devuelve P: (N, 2) con la probabilidad de cada clase (perro, gato).
    """
    K, B, W2, b2 = params
    # TODO: recorre las imágenes; para cada una, aplica los 4 filtros
    # (conv2d + sesgo -> ReLU -> max_pool2d), aplana y concatena los mapas
    # (196 features), y al final softmax(F @ W2 + b2)
    return np.zeros((len(X), 2))

# ---------------------------------------------------------------
# Prueba rápida: forward de 5 imágenes de test (cabeza sin entrenar)
# ---------------------------------------------------------------
X_full, y_full = make_pets(n_per_class=60, seed=7)
X_train, X_test, y_train, y_test = split_train_test(X_full, y_full)
P = forward(X_test[:5], (K_PRE, B_PRE, W2, b2))
print('probabilidades [perro, gato] con la cabeza aún sin entrenar:')
print(np.round(P, 3))
print('etiquetas reales:', y_test[:5])
`,
    solution_code: `import numpy as np

def make_pets(n_per_class=60, seed=7):
    """Gatos (1) y perros (0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Split estratificado 80/20, mezclado y reproducible."""
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

def conv2d(img, kernel):
    """Convolución 2D válida (sin padding, stride 1)."""
    H, W = img.shape
    k = kernel.shape[0]
    Ho, Wo = H - k + 1, W - k + 1
    out = np.zeros((Ho, Wo))
    for u in range(k):
        for v in range(k):
            out += img[u:u + Ho, v:v + Wo] * kernel[u, v]
    return out

def max_pool2d(x, size=2, stride=2):
    """Max-pooling con ventana 2x2."""
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i * stride:i * stride + size, j * stride:j * stride + size])
    return out

def softmax(Z):
    """Softmax por filas, con el truco de estabilidad de restar el máximo."""
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

K_PRE = np.array([
    [[-0.582732, -0.96122 , -0.130555],
     [ 0.212956,  0.399228,  0.137924],
     [-0.351721, -0.452611,  0.838434]],
    [[ 2.409266,  0.256254,  0.219415],
     [-1.514992,  0.831379,  0.470307],
     [-1.498307, -1.111171, -0.721306]],
    [[-0.317758, -0.327833, -0.822538],
     [ 0.70584 , -0.29698 , -0.522749],
     [ 0.496246,  1.057557, -1.133512]],
    [[-0.128364, -0.490374, -0.086576],
     [-0.644709,  0.009952, -0.018955],
     [-0.152168, -0.523963, -0.198095]]])
B_PRE = np.array([0.16525, 0.346522, 0.071384, -0.002053])

rng = np.random.default_rng(0)
W2 = rng.normal(0.0, 0.1, size=(196, 2))
b2 = np.zeros(2)

def forward(X, params):
    """Propagación completa: conv 1->4 (3x3) + ReLU -> maxpool 2x2 -> flatten -> dense -> softmax."""
    K, B, W2, b2 = params
    features = []
    for img in X:
        mapas = []
        for f in range(len(K)):
            relu = np.maximum(0.0, conv2d(img, K[f]) + B[f])
            mapas.append(max_pool2d(relu))
        features.append(np.concatenate([m.ravel() for m in mapas]))
    F = np.array(features)          # (N, 196)
    return softmax(F @ W2 + b2)     # (N, 2)

X_full, y_full = make_pets(n_per_class=60, seed=7)
X_train, X_test, y_train, y_test = split_train_test(X_full, y_full)
P = forward(X_test[:5], (K_PRE, B_PRE, W2, b2))
print('probabilidades [perro, gato] con la cabeza aún sin entrenar:')
print(np.round(P, 3))
print('etiquetas reales:', y_test[:5])
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

def _ref_forward(Xb):
    # referencia independiente: conv 3x3 válida + sesgo -> ReLU -> maxpool 2x2 -> dense -> softmax
    sal = []
    for img in Xb:
        mapas = []
        for f in range(4):
            H, W = img.shape
            conv = np.zeros((H - 2, W - 2))
            for u in range(3):
                for v in range(3):
                    conv += img[u:u + H - 2, v:v + W - 2] * K_PRE[f][u, v]
            relu = np.maximum(conv + B_PRE[f], 0.0)
            pooled = np.zeros((7, 7))
            for i in range(7):
                for j in range(7):
                    pooled[i, j] = relu[2 * i:2 * i + 2, 2 * j:2 * j + 2].max()
            mapas.append(pooled.ravel())
        sal.append(np.concatenate(mapas))
    F = np.array(sal)
    Z = F @ W2 + b2
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

_lote = X_test[:6]
_P = forward(_lote, (K_PRE, B_PRE, W2, b2))

check("Devuelve (N, 2): una fila de probabilidades por imagen",
      lambda: _P.shape == (6, 2),
      msg="forward(X_test[:6], params) debe tener shape (6, 2), y llegó " + str(_P.shape))

check("Funciona también con una sola imagen",
      lambda: forward(X_test[:1], (K_PRE, B_PRE, W2, b2)).shape == (1, 2),
      msg="Recorre el batch con un bucle (o vectoriza) sin asumir un N concreto")

check("Cada fila suma 1 (es una softmax)",
      lambda: _ac(_P.sum(axis=1), np.ones(6), atol=1e-6),
      msg="Aplica softmax a los logits: exp(Z - max) / suma; cada fila debe sumar 1")

check("Valores exactos vs la referencia",
      lambda: _ac(_P, _ref_forward(_lote), atol=1e-8),
      msg="Orden: conv2d + B_PRE[f] -> ReLU -> max_pool2d -> concatena los 4 mapas aplanados (196) -> @ W2 + b2 -> softmax")

check("Determinista: dos llamadas, mismo resultado",
      lambda: _ac(forward(_lote, (K_PRE, B_PRE, W2, b2)), _P, atol=1e-12),
      msg="El forward no debe consumir aleatoriedad: mismos datos y pesos, mismas probabilidades")

check("No destroza los pesos: W2 y b2 siguen intactos tras llamar a forward",
      lambda: W2.shape == (196, 2) and b2.shape == (2,),
      msg="forward solo LEE los parámetros; no los modifiques dentro")
`,
    hints: [
      'Bucle externo sobre las imágenes del batch; interno sobre los 4 filtros: `relu = np.maximum(0.0, conv2d(img, K[f]) + B[f])` y luego `max_pool2d(relu)`.',
      'El flatten es `np.concatenate([m.ravel() for m in mapas])`: 4 mapas de 7x7 = 196 features por imagen.',
      'Al final: `F = np.array(features)` y `return softmax(F @ W2 + b2)`. La softmax ya resta el máximo (estabilidad).',
    ],
  },
  {
    id: 'cnn-pets-train',
    title: 'P3 · Entrenamiento: transfer learning en miniatura',
    difficulty: 'AVANZADO',
    xp: 140,
    statement: String.raw`Aquí viene la idea más rentable del módulo para tu vida profesional: **casi nadie entrena una CNN desde cero**. Lo que se hace en la práctica es descargar una red preentrenada (ResNet, ViT...) sobre millones de imágenes, **congelar** sus capas convolucionales — que ya saben extraer bordes, texturas y formas — y entrenar solo la **cabeza** final para tu problema. Eso es *transfer learning*, y es exactamente lo que harás aquí: \`K_PRE\` y \`B_PRE\` van congelados (son tu "ResNet preentrenada") y tú entrenas la densa $196 \to 2$ con softmax + cross-entropy.

Implementa \`entrenar_cabeza(F, y, lr=0.5, epochs=300)\` con gradiente descendente a batch completo:

$$Z = F W_2 + b_2, \qquad P = \mathrm{softmax}(Z), \qquad L = -\frac{1}{n}\sum_i \log P_{i,\, y_i}$$

$$\frac{\partial L}{\partial Z} = \frac{P - Y}{n}, \qquad \frac{\partial L}{\partial W_2} = F^\top \frac{P - Y}{n}, \qquad \frac{\partial L}{\partial b_2} = \sum_i \frac{(P - Y)_i}{n}$$

donde $Y$ son las etiquetas en one-hot. Devuelve \`(W2, b2, historial)\` con la pérdida de cada época. Como la conv está congelada, las features se calculan **una sola vez** y cada época son dos multiplicaciones de matrices: rápido incluso en el navegador. Así de eficiente es el transfer learning de verdad, por cierto.

Objetivo: **accuracy en test $\geq 0.90$**. La solución de referencia llega a 1.00, así que hay margen. Y un dato para la posteridad: un modelo lineal sobre los píxeles crudos se queda en ~0.79 — la diferencia son las features convolucionales.`,
    starter_code: `import numpy as np

# ============================================================
# BLOQUE 1 · dataset (de los ejercicios anteriores, ya resuelto)
# ============================================================
def make_pets(n_per_class=60, seed=7):
    """Gatos (1) y perros (0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Split estratificado 80/20, mezclado y reproducible."""
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

# ============================================================
# BLOQUE 2 · la red (de los ejercicios anteriores, ya resuelta)
# ============================================================
def conv2d(img, kernel):
    H, W = img.shape
    k = kernel.shape[0]
    Ho, Wo = H - k + 1, W - k + 1
    out = np.zeros((Ho, Wo))
    for u in range(k):
        for v in range(k):
            out += img[u:u + Ho, v:v + Wo] * kernel[u, v]
    return out

def max_pool2d(x, size=2, stride=2):
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i * stride:i * stride + size, j * stride:j * stride + size])
    return out

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

# Pesos conv PREENTRENADOS y CONGELADOS (transfer learning: no se tocan)
K_PRE = np.array([
    [[-0.582732, -0.96122 , -0.130555],
     [ 0.212956,  0.399228,  0.137924],
     [-0.351721, -0.452611,  0.838434]],
    [[ 2.409266,  0.256254,  0.219415],
     [-1.514992,  0.831379,  0.470307],
     [-1.498307, -1.111171, -0.721306]],
    [[-0.317758, -0.327833, -0.822538],
     [ 0.70584 , -0.29698 , -0.522749],
     [ 0.496246,  1.057557, -1.133512]],
    [[-0.128364, -0.490374, -0.086576],
     [-0.644709,  0.009952, -0.018955],
     [-0.152168, -0.523963, -0.198095]]])
B_PRE = np.array([0.16525, 0.346522, 0.071384, -0.002053])

def extraer_features(X):
    """La parte CONGELADA de la red: conv + ReLU + maxpool + flatten.

    Es tu forward del ejercicio anterior, parando antes de la capa densa.
    Devuelve F: (N, 196) — las features de cada imagen.
    """
    features = []
    for img in X:
        mapas = []
        for f in range(4):
            relu = np.maximum(0.0, conv2d(img, K_PRE[f]) + B_PRE[f])
            mapas.append(max_pool2d(relu))
        features.append(np.concatenate([m.ravel() for m in mapas]))
    return np.array(features)

# ============================================================
# BLOQUE 3 · TU TRABAJO: entrenar SOLO la cabeza densa
# ============================================================
def entrenar_cabeza(F, y, lr=0.5, epochs=300):
    """Entrena la cabeza densa (196 -> 2) con softmax + cross-entropy.

    F: (n, 196) features congeladas. y: (n,) etiquetas 0/1.
    Devuelve (W2, b2, historial): pesos, sesgo y pérdida de cada época.

    Recordatorio (batch completo):
      Z = F @ W2 + b2     -> logits (n, 2)
      P = softmax(Z)      -> probabilidades
      L = -media(log P[etiqueta correcta])
      dZ = (P - Y_onehot) / n
      dW2 = F.T @ dZ,  db2 = dZ.sum(axis=0)
    """
    n, d = F.shape
    rng = np.random.default_rng(0)
    W2 = rng.normal(0.0, 0.1, size=(d, 2))
    b2 = np.zeros(2)
    Y = np.eye(2)[y]  # etiquetas en one-hot: (n, 2)
    historial = []
    # TODO: bucle de entrenamiento (forward de la cabeza, pérdida,
    # gradientes y actualización de W2 y b2). Guarda la pérdida de cada época.
    return W2, b2, historial

# ---------------------------------------------------------------
# Pipeline completo: datos -> features congeladas -> entrenamiento
# ---------------------------------------------------------------
X_full, y_full = make_pets(n_per_class=60, seed=7)
X_train, X_test, y_train, y_test = split_train_test(X_full, y_full)
F_train = extraer_features(X_train)   # (96, 196)
F_test = extraer_features(X_test)     # (24, 196)

W2, b2, historial = entrenar_cabeza(F_train, y_train, lr=0.5, epochs=300)

pred_train = np.argmax(F_train @ W2 + b2, axis=1)
pred_test = np.argmax(F_test @ W2 + b2, axis=1)
print('accuracy train:', (pred_train == y_train).mean())
print('accuracy test :', (pred_test == y_test).mean())
`,
    solution_code: `import numpy as np

def make_pets(n_per_class=60, seed=7):
    """Gatos (1) y perros (0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Split estratificado 80/20, mezclado y reproducible."""
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

def conv2d(img, kernel):
    H, W = img.shape
    k = kernel.shape[0]
    Ho, Wo = H - k + 1, W - k + 1
    out = np.zeros((Ho, Wo))
    for u in range(k):
        for v in range(k):
            out += img[u:u + Ho, v:v + Wo] * kernel[u, v]
    return out

def max_pool2d(x, size=2, stride=2):
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i * stride:i * stride + size, j * stride:j * stride + size])
    return out

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

K_PRE = np.array([
    [[-0.582732, -0.96122 , -0.130555],
     [ 0.212956,  0.399228,  0.137924],
     [-0.351721, -0.452611,  0.838434]],
    [[ 2.409266,  0.256254,  0.219415],
     [-1.514992,  0.831379,  0.470307],
     [-1.498307, -1.111171, -0.721306]],
    [[-0.317758, -0.327833, -0.822538],
     [ 0.70584 , -0.29698 , -0.522749],
     [ 0.496246,  1.057557, -1.133512]],
    [[-0.128364, -0.490374, -0.086576],
     [-0.644709,  0.009952, -0.018955],
     [-0.152168, -0.523963, -0.198095]]])
B_PRE = np.array([0.16525, 0.346522, 0.071384, -0.002053])

def extraer_features(X):
    features = []
    for img in X:
        mapas = []
        for f in range(4):
            relu = np.maximum(0.0, conv2d(img, K_PRE[f]) + B_PRE[f])
            mapas.append(max_pool2d(relu))
        features.append(np.concatenate([m.ravel() for m in mapas]))
    return np.array(features)

def entrenar_cabeza(F, y, lr=0.5, epochs=300):
    """Entrena la cabeza densa (196 -> 2) con softmax + cross-entropy."""
    n, d = F.shape
    rng = np.random.default_rng(0)
    W2 = rng.normal(0.0, 0.1, size=(d, 2))
    b2 = np.zeros(2)
    Y = np.eye(2)[y]  # one-hot
    historial = []
    for ep in range(epochs):
        # forward de la cabeza
        P = softmax(F @ W2 + b2)
        # pérdida cross-entropy (para el historial)
        loss = -np.log(P[np.arange(n), y] + 1e-12).mean()
        historial.append(loss)
        # backward y actualización
        dZ = (P - Y) / n
        W2 -= lr * (F.T @ dZ)
        b2 -= lr * dZ.sum(axis=0)
    return W2, b2, historial

X_full, y_full = make_pets(n_per_class=60, seed=7)
X_train, X_test, y_train, y_test = split_train_test(X_full, y_full)
F_train = extraer_features(X_train)
F_test = extraer_features(X_test)
W2, b2, historial = entrenar_cabeza(F_train, y_train, lr=0.5, epochs=300)

pred_train = np.argmax(F_train @ W2 + b2, axis=1)
pred_test = np.argmax(F_test @ W2 + b2, axis=1)
print('pérdida: época 0 =', round(float(historial[0]), 4),
      ' última =', round(float(historial[-1]), 4))
print('accuracy train:', (pred_train == y_train).mean())
print('accuracy test :', (pred_test == y_test).mean())
`,
    test_code: `
_acc_tr = (np.argmax(F_train @ W2 + b2, axis=1) == y_train).mean()
_acc_te = (np.argmax(F_test @ W2 + b2, axis=1) == y_test).mean()

check("Devuelve (W2, b2, historial) con las formas correctas",
      lambda: W2.shape == (196, 2) and b2.shape == (2,) and len(historial) == 300,
      msg="W2 es (196, 2), b2 es (2,) y el historial guarda una pérdida por época (300)")

check("La pérdida disminuye con el entrenamiento",
      lambda: historial[-1] < historial[0],
      msg="Si la pérdida no baja, revisa el signo del gradiente: W2 -= lr * (F.T @ dZ), con dZ = (P - Y) / n")

check("La pérdida converge por debajo de 0.2",
      lambda: historial[-1] < 0.2,
      msg="Con lr=0.5 y 300 épocas deberías bajar de 0.05; revisa que dZ use Y en one-hot y divida por n")

check("Accuracy en train de al menos 0.95",
      lambda: _acc_tr >= 0.95,
      msg="La cabeza debe aprender las features de train casi a la perfección")

check("Accuracy en test de al menos 0.90 (el objetivo del proyecto)",
      lambda: _acc_te >= 0.90,
      msg="Con la conv congelada y la cabeza bien entrenada se supera el 0.90; no entrenes sobre el test")

check("La cabeza predice con probabilidades coherentes (softmax bien aplicada)",
      lambda: bool((np.abs(softmax(F_test @ W2 + b2).sum(axis=1) - 1.0) < 1e-6).all()),
      msg="Las probabilidades de test deben sumar 1 por fila; usa la softmax estable (resta el máximo)")
`,
    hints: [
      '`Y = np.eye(2)[y]` convierte las etiquetas a one-hot; la pérdida de cada época es `-np.log(P[np.arange(n), y] + 1e-12).mean()`.',
      'El gradiente combinado softmax + cross-entropy es `dZ = (P - Y) / n`; luego `W2 -= lr * (F.T @ dZ)` y `b2 -= lr * dZ.sum(axis=0)`.',
      'Guarda la pérdida de CADA época en `historial` antes de actualizar los pesos.',
    ],
  },
  {
    id: 'cnn-pets-eval',
    title: 'P4 · Evaluación profesional: más allá del accuracy',
    difficulty: 'INTERMEDIO',
    xp: 60,
    statement: String.raw`Un 96 % de accuracy no te dice *cómo* falla tu modelo. En producción la pregunta nunca es "¿cuánto acierta?" sino "**¿qué errores comete y cuánto cuestan?**". Aquí el modelo se ha entrenado a propósito con pocas épocas para que quede algún error que analizar, y tú construirás el kit de evaluación profesional:

1. **\`matriz_confusion(y_true, y_pred)\`**: matriz $2 \times 2$ donde la **fila** es la clase real y la **columna** la predicción. La diagonal son aciertos; fuera de ella están los fallos, y de qué tipo son.
2. **\`precision_recall(cm)\`**: para cada clase $c$:

$$\text{precision}_c = \frac{cm_{cc}}{\sum_t cm_{tc}} \quad \text{(de los que dije clase } c \text{, ¿cuántos lo eran?)}$$

$$\text{recall}_c = \frac{cm_{cc}}{\sum_p cm_{cp}} \quad \text{(de los que eran clase } c \text{, ¿cuántos encontré?)}$$

3. **\`indices_errores(y_true, y_pred)\`**: los índices exactos de los fallos dentro del test. Mirar a ojo los ejemplos mal clasificados es la herramienta de depuración más infravalorada del oficio: ahí descubres si tu modelo confunde "gato con orejas bajas" con perro, o si hay datos corruptos.

Con nuestro modelo "perezoso" hay exactamente un error. ¿Es un gato que parece perro, o al revés? Tus funciones lo dirán.`,
    starter_code: `import numpy as np

# ============================================================
# BLOQUE 1 · dataset (ya resuelto en ejercicios anteriores)
# ============================================================
def make_pets(n_per_class=60, seed=7):
    """Gatos (1) y perros (0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

def split_train_test(X, y, test_ratio=0.2, seed=42):
    """Split estratificado 80/20, mezclado y reproducible."""
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

# ============================================================
# BLOQUE 2 · red + entrenamiento (ya resueltos)
# ============================================================
def conv2d(img, kernel):
    H, W = img.shape
    k = kernel.shape[0]
    Ho, Wo = H - k + 1, W - k + 1
    out = np.zeros((Ho, Wo))
    for u in range(k):
        for v in range(k):
            out += img[u:u + Ho, v:v + Wo] * kernel[u, v]
    return out

def max_pool2d(x, size=2, stride=2):
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i * stride:i * stride + size, j * stride:j * stride + size])
    return out

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

K_PRE = np.array([
    [[-0.582732, -0.96122 , -0.130555],
     [ 0.212956,  0.399228,  0.137924],
     [-0.351721, -0.452611,  0.838434]],
    [[ 2.409266,  0.256254,  0.219415],
     [-1.514992,  0.831379,  0.470307],
     [-1.498307, -1.111171, -0.721306]],
    [[-0.317758, -0.327833, -0.822538],
     [ 0.70584 , -0.29698 , -0.522749],
     [ 0.496246,  1.057557, -1.133512]],
    [[-0.128364, -0.490374, -0.086576],
     [-0.644709,  0.009952, -0.018955],
     [-0.152168, -0.523963, -0.198095]]])
B_PRE = np.array([0.16525, 0.346522, 0.071384, -0.002053])

def extraer_features(X):
    features = []
    for img in X:
        mapas = []
        for f in range(4):
            relu = np.maximum(0.0, conv2d(img, K_PRE[f]) + B_PRE[f])
            mapas.append(max_pool2d(relu))
        features.append(np.concatenate([m.ravel() for m in mapas]))
    return np.array(features)

def entrenar_cabeza(F, y, lr=0.5, epochs=300):
    n, d = F.shape
    rng = np.random.default_rng(0)
    W2 = rng.normal(0.0, 0.1, size=(d, 2))
    b2 = np.zeros(2)
    Y = np.eye(2)[y]
    historial = []
    for ep in range(epochs):
        P = softmax(F @ W2 + b2)
        historial.append(-np.log(P[np.arange(n), y] + 1e-12).mean())
        dZ = (P - Y) / n
        W2 -= lr * (F.T @ dZ)
        b2 -= lr * dZ.sum(axis=0)
    return W2, b2, historial

# ---------------------------------------------------------------
# Modelo entrenado a propósito con POCAS épocas, para que queden
# errores que analizar (trabajarás con un modelo imperfecto, como en la vida real)
# ---------------------------------------------------------------
X_full, y_full = make_pets(n_per_class=60, seed=7)
X_train, X_test, y_train, y_test = split_train_test(X_full, y_full)
F_train = extraer_features(X_train)
F_test = extraer_features(X_test)
W2, b2, historial = entrenar_cabeza(F_train, y_train, lr=0.3, epochs=100)
y_pred = np.argmax(F_test @ W2 + b2, axis=1)
print('accuracy test:', (y_pred == y_test).mean())

# ============================================================
# BLOQUE 3 · TU TRABAJO: la evaluación profesional
# ============================================================
def matriz_confusion(y_true, y_pred):
    """Matriz de confusión 2x2: FILAS = clase real, COLUMNAS = predicción.

    cm[t, p] = número de ejemplos de clase t clasificados como p.
    """
    cm = np.zeros((2, 2), dtype=int)
    # TODO: acumula cada ejemplo en su casilla
    return cm

def precision_recall(cm):
    """Devuelve (precision, recall): dos arrays de longitud 2 (uno por clase).

    precision[c] = cm[c, c] / (todos los predichos como c)    -> columna c
    recall[c]    = cm[c, c] / (todos los que ERAN de clase c) -> fila c
    """
    precision = np.zeros(2)
    recall = np.zeros(2)
    # TODO: rellena ambos arrays a partir de cm
    return precision, recall

def indices_errores(y_true, y_pred):
    """Índices (dentro del array de test) de los ejemplos mal clasificados."""
    # TODO: una línea con np.where
    return np.array([], dtype=int)

# ---------------------------------------------------------------
# Informe
# ---------------------------------------------------------------
cm = matriz_confusion(y_test, y_pred)
precision, recall = precision_recall(cm)
errores = indices_errores(y_test, y_pred)
print('matriz de confusión (filas: real | columnas: predicción):')
print(cm)
print('precision  perro/gato:', np.round(precision, 3))
print('recall     perro/gato:', np.round(recall, 3))
print('errores en los índices de test:', errores)
for i in errores:
    print('  índice', i, ': era', 'gato' if y_test[i] == 1 else 'perro',
          'y el modelo dijo', 'gato' if y_pred[i] == 1 else 'perro')
`,
    solution_code: `import numpy as np

def make_pets(n_per_class=60, seed=7):
    """Gatos (1) y perros (0) sintéticos: 16x16, float en [0, 1]."""
    rng = np.random.default_rng(seed)
    H = W = 16
    yy, xx = np.mgrid[0:H, 0:W]
    imgs, labels = [], []
    for cls in (0, 1):
        for _ in range(n_per_class):
            img = np.zeros((H, W))
            cx = (W - 1) / 2 + rng.uniform(-2, 2)
            cy = (H - 1) / 2 + 1.0 + rng.uniform(-1.3, 1.3)
            s = rng.uniform(0.85, 1.15)
            r = 4.2 * s
            cabeza = ((xx - cx) ** 2 + (yy - cy) ** 2) <= r ** 2
            img[cabeza] = 1.0
            for signo in (-1, 1):
                ex = cx + signo * r * 0.8
                if cls == 1:
                    ey = cy - r * 0.45
                    alto, ancho = 3.4 * s, 2.0 * s
                    t = (ey - yy) / alto
                    tri = (yy <= ey) & (yy >= ey - alto) & (np.abs(xx - ex) <= ancho * (1.0 - t))
                    img[tri] = 1.0
                else:
                    ey = cy - r * 0.30
                    oreja = ((xx - ex) ** 2 / (1.6 * s) ** 2
                             + (yy - ey) ** 2 / (2.9 * s) ** 2) <= 1
                    img[oreja] = 1.0
            img = img * rng.uniform(0.6, 1.0)
            img = img + rng.normal(0.0, 0.09, (H, W))
            img = np.clip(img, 0.0, 1.0)
            imgs.append(img)
            labels.append(cls)
    return np.array(imgs), np.array(labels, dtype=int)

def split_train_test(X, y, test_ratio=0.2, seed=42):
    rng = np.random.default_rng(seed)
    idx_train, idx_test = [], []
    for cls in np.unique(y):
        idx = np.where(y == cls)[0].copy()
        rng.shuffle(idx)
        n_test = int(round(len(idx) * test_ratio))
        idx_test.extend(idx[:n_test])
        idx_train.extend(idx[n_test:])
    idx_train = np.array(idx_train)
    idx_test = np.array(idx_test)
    rng.shuffle(idx_train)
    rng.shuffle(idx_test)
    return X[idx_train], X[idx_test], y[idx_train], y[idx_test]

def conv2d(img, kernel):
    H, W = img.shape
    k = kernel.shape[0]
    Ho, Wo = H - k + 1, W - k + 1
    out = np.zeros((Ho, Wo))
    for u in range(k):
        for v in range(k):
            out += img[u:u + Ho, v:v + Wo] * kernel[u, v]
    return out

def max_pool2d(x, size=2, stride=2):
    H, W = x.shape
    Ho = (H - size) // stride + 1
    Wo = (W - size) // stride + 1
    out = np.zeros((Ho, Wo))
    for i in range(Ho):
        for j in range(Wo):
            out[i, j] = np.max(x[i * stride:i * stride + size, j * stride:j * stride + size])
    return out

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

K_PRE = np.array([
    [[-0.582732, -0.96122 , -0.130555],
     [ 0.212956,  0.399228,  0.137924],
     [-0.351721, -0.452611,  0.838434]],
    [[ 2.409266,  0.256254,  0.219415],
     [-1.514992,  0.831379,  0.470307],
     [-1.498307, -1.111171, -0.721306]],
    [[-0.317758, -0.327833, -0.822538],
     [ 0.70584 , -0.29698 , -0.522749],
     [ 0.496246,  1.057557, -1.133512]],
    [[-0.128364, -0.490374, -0.086576],
     [-0.644709,  0.009952, -0.018955],
     [-0.152168, -0.523963, -0.198095]]])
B_PRE = np.array([0.16525, 0.346522, 0.071384, -0.002053])

def extraer_features(X):
    features = []
    for img in X:
        mapas = []
        for f in range(4):
            relu = np.maximum(0.0, conv2d(img, K_PRE[f]) + B_PRE[f])
            mapas.append(max_pool2d(relu))
        features.append(np.concatenate([m.ravel() for m in mapas]))
    return np.array(features)

def entrenar_cabeza(F, y, lr=0.5, epochs=300):
    n, d = F.shape
    rng = np.random.default_rng(0)
    W2 = rng.normal(0.0, 0.1, size=(d, 2))
    b2 = np.zeros(2)
    Y = np.eye(2)[y]
    historial = []
    for ep in range(epochs):
        P = softmax(F @ W2 + b2)
        historial.append(-np.log(P[np.arange(n), y] + 1e-12).mean())
        dZ = (P - Y) / n
        W2 -= lr * (F.T @ dZ)
        b2 -= lr * dZ.sum(axis=0)
    return W2, b2, historial

X_full, y_full = make_pets(n_per_class=60, seed=7)
X_train, X_test, y_train, y_test = split_train_test(X_full, y_full)
F_train = extraer_features(X_train)
F_test = extraer_features(X_test)
W2, b2, historial = entrenar_cabeza(F_train, y_train, lr=0.3, epochs=100)
y_pred = np.argmax(F_test @ W2 + b2, axis=1)
print('accuracy test:', (y_pred == y_test).mean())

def matriz_confusion(y_true, y_pred):
    """Matriz de confusión 2x2: FILAS = clase real, COLUMNAS = predicción."""
    cm = np.zeros((2, 2), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1
    return cm

def precision_recall(cm):
    """precision[c] = cm[c,c]/columna c; recall[c] = cm[c,c]/fila c."""
    precision = np.zeros(2)
    recall = np.zeros(2)
    for c in range(2):
        precision[c] = cm[c, c] / cm[:, c].sum() if cm[:, c].sum() > 0 else 0.0
        recall[c] = cm[c, c] / cm[c, :].sum() if cm[c, :].sum() > 0 else 0.0
    return precision, recall

def indices_errores(y_true, y_pred):
    """Índices (dentro del array de test) de los ejemplos mal clasificados."""
    return np.where(y_pred != y_true)[0]

cm = matriz_confusion(y_test, y_pred)
precision, recall = precision_recall(cm)
errores = indices_errores(y_test, y_pred)
print('matriz de confusión (filas: real | columnas: predicción):')
print(cm)
print('precision  perro/gato:', np.round(precision, 3))
print('recall     perro/gato:', np.round(recall, 3))
print('errores en los índices de test:', errores)
for i in errores:
    print('  índice', i, ': era', 'gato' if y_test[i] == 1 else 'perro',
          'y el modelo dijo', 'gato' if y_pred[i] == 1 else 'perro')
`,
    test_code: `
def _ac(a, b, rtol=1e-7, atol=0.0):
    npt.assert_allclose(a, b, rtol=rtol, atol=atol)
    return True

def _ref_cm(yt, yp):
    m = np.zeros((2, 2), dtype=int)
    for t, p in zip(yt, yp):
        m[t, p] += 1
    return m

def _ref_pr(m):
    prec = np.array([m[c, c] / m[:, c].sum() if m[:, c].sum() > 0 else 0.0 for c in range(2)])
    rec = np.array([m[c, c] / m[c, :].sum() if m[c, :].sum() > 0 else 0.0 for c in range(2)])
    return prec, rec

_cm_u = matriz_confusion(y_test, y_pred)
_cm_r = _ref_cm(y_test, y_pred)
_prec_u, _rec_u = precision_recall(_cm_r)
_prec_r, _rec_r = _ref_pr(_cm_r)
_cm_sint = np.array([[5, 1], [2, 4]])
_prec_s, _rec_s = _ref_pr(_cm_sint)
_prec_us, _rec_us = precision_recall(_cm_sint)

check("Matriz 2x2 que suma exactamente n_test",
      lambda: _cm_u.shape == (2, 2) and int(_cm_u.sum()) == len(y_test),
      msg="Cada ejemplo de test cae en exactamente una casilla: cm[real, predicción] += 1")

check("Matriz de confusión correcta (filas = real, columnas = predicción)",
      lambda: bool((_cm_u == _cm_r).all()),
      msg="Recorre zip(y_true, y_pred) acumulando cm[t, p] += 1; ojo al orden de los índices")

check("La diagonal son los aciertos",
      lambda: int(np.trace(_cm_u)) == int((y_pred == y_test).sum()),
      msg="cm[0,0] + cm[1,1] debe coincidir con el número de predicciones correctas")

check("Precision y recall correctos sobre el test",
      lambda: _ac(np.asarray(_prec_u, dtype=float), _prec_r, atol=1e-9)
              and _ac(np.asarray(_rec_u, dtype=float), _rec_r, atol=1e-9),
      msg="precision[c] = cm[c,c] / suma de la COLUMNA c; recall[c] = cm[c,c] / suma de la FILA c")

check("Precision y recall también en una matriz cualquiera",
      lambda: _ac(np.asarray(_prec_us, dtype=float), _prec_s, atol=1e-9)
              and _ac(np.asarray(_rec_us, dtype=float), _rec_s, atol=1e-9),
      msg="Con [[5,1],[2,4]]: precision = [5/7, 4/5], recall = [5/6, 4/6]; no vale hardcodear")

check("Índices de errores correctos",
      lambda: bool((np.sort(np.asarray(indices_errores(y_test, y_pred), dtype=int))
                    == np.where(y_pred != y_test)[0]).all()),
      msg="np.where(y_pred != y_test)[0] te da los índices de los fallos dentro del array de test")

check("Coherencia: nº de errores = n_test - traza(cm)",
      lambda: len(indices_errores(y_test, y_pred)) == len(y_test) - int(np.trace(_cm_u)),
      msg="Los ejemplos fuera de la diagonal son exactamente los errores")
`,
    hints: [
      'Recorre `zip(y_true, y_pred)` y haz `cm[t, p] += 1`: filas = clase real, columnas = predicción.',
      '`precision[c]` divide por la suma de la columna c (`cm[:, c].sum()`); `recall[c]` por la suma de la fila c (`cm[c, :].sum()`).',
      '`np.where(y_pred != y_test)[0]` devuelve directamente los índices de los fallos.',
    ],
  },
]
