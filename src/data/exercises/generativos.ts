/**
 * generativos.ts — Ejercicios autocorregidos del módulo N6 · Modelos Generativos.
 * Cada solution_code pasa su propio test_code al 100% (verificado localmente
 * con numpy 2.x + shim de check()).
 */

import { registerExercises, type Exercise } from '@/lib/exercises'

const reparam: Exercise = {
  id: 'generativos-reparam',
  title: 'El truco de la reparametrización',
  difficulty: 'BASICO',
  xp: 30,
  statement: [
    'En un VAE el encoder no devuelve un vector $z$ directamente, sino los parámetros de una gaussiana: la media $\\mu$ y el log de la varianza $\\log \\sigma^2$. Para muestrear $z$ de forma **diferenciable** usamos el truco de la reparametrización:',
    '$$z = \\mu + \\sigma \\odot \\varepsilon = \\mu + \\exp\\!\\left(\\tfrac{1}{2}\\log \\sigma^2\\right) \\odot \\varepsilon, \\qquad \\varepsilon \\sim \\mathcal{N}(0, I)$$',
    'Implementa `reparameterize(mu, logvar, eps)` que devuelva $z$. Los tres argumentos son arrays de numpy de la misma forma (o escalares).',
  ].join('\n'),
  starter_code: `import numpy as np

def reparameterize(mu, logvar, eps):
    """
    Devuelve z = mu + exp(0.5 * logvar) * eps.
    mu, logvar, eps: arrays de numpy (misma forma) o escalares.
    """
    # TODO: una sola línea
    return mu  # ¡esto ignora la incertidumbre!

# Prueba rápida
mu = np.array([1.5, -2.0, 0.3])
logvar = np.array([0.2, -1.0, 0.5])
eps = np.random.default_rng(0).standard_normal((10000, 3))
z = reparameterize(mu, logvar, eps)
print("media muestral :", z.mean(axis=0), "→ esperada:", mu)
print("std muestral   :", z.std(axis=0), "→ esperada:", np.exp(0.5 * logvar))
`,
  solution_code: `import numpy as np

def reparameterize(mu, logvar, eps):
    return mu + np.exp(0.5 * logvar) * eps
`,
  test_code: `
mu = np.array([1.5, -2.0, 0.3])
logvar = np.array([0.2, -1.0, 0.5])
rng = np.random.default_rng(0)
eps = rng.standard_normal((20000, 3))
z = reparameterize(mu, logvar, eps)
check("Forma correcta", lambda: z.shape == (20000, 3), msg="reparameterize debe conservar la forma de las entradas")
check("La media muestral coincide con mu", lambda: np.allclose(z.mean(axis=0), mu, atol=0.05),
      msg=f"media obtenida {z.mean(axis=0)}, esperada {mu}")
check("La desviación coincide con exp(0.5·logvar)", lambda: np.allclose(z.std(axis=0), np.exp(0.5*logvar), atol=0.05),
      msg=f"std obtenida {z.std(axis=0)}, esperada {np.exp(0.5*logvar)}")
eps_one = np.ones(3)
check("Ruta de gradiente: mu entra linealmente", lambda: np.allclose(reparameterize(mu, logvar, eps_one) - mu, np.exp(0.5*logvar)),
      msg="Con eps=1, z − mu debe ser exactamente exp(0.5·logvar): mu debe SUMAR, no multiplicar")
check("Funciona con escalares", lambda: np.isclose(reparameterize(2.0, 0.0, 3.0), 5.0),
      msg="Con logvar=0, z = mu + eps")
`,
  hints: [
    'El desvío estándar es $\\sigma = \\sqrt{\\exp(\\text{logvar})} = \\exp(0.5 \\cdot \\text{logvar})$.',
    'Es literalmente `mu + np.exp(0.5 * logvar) * eps`. El ruido `eps` es el que "absorbe" el muestreo, así el gradiente fluye limpio hacia $\\mu$ y $\\sigma$.',
  ],
}

const klNormal: Exercise = {
  id: 'generativos-kl-normal',
  title: 'KL entre gaussianas (forma cerrada)',
  difficulty: 'INTERMEDIO',
  xp: 50,
  statement: [
    'El término regularizador del ELBO de un VAE es la divergencia KL entre el posterior $q(z|x) = \\mathcal{N}(\\mu, \\sigma^2 I)$ y el prior $p(z) = \\mathcal{N}(0, I)$. Para gaussianas tiene forma cerrada:',
    '$$D_{KL}\\!\\left(q \\,\\|\\, p\\right) = -\\frac{1}{2}\\sum_{j} \\left( 1 + \\log \\sigma_j^2 - \\mu_j^2 - \\sigma_j^2 \\right)$$',
    'Implementa `kl_normal(mu, logvar)` que la calcule (sumando sobre todas las dimensiones latentes) y devuelva un `float`. Recuerda: $\\sigma_j^2 = \\exp(\\text{logvar}_j)$.',
  ].join('\n'),
  starter_code: `import numpy as np

def kl_normal(mu, logvar):
    """
    Divergencia KL entre N(mu, diag(exp(logvar))) y N(0, I), en forma cerrada.
    Devuelve un float (suma sobre todas las dimensiones).
    """
    # TODO
    return 0.0

# Si mu=0 y logvar=0, el posterior ES el prior → KL = 0
print(kl_normal(np.zeros(4), np.zeros(4)))  # esperado: 0.0
`,
  solution_code: `import numpy as np

def kl_normal(mu, logvar):
    return float(-0.5 * np.sum(1 + logvar - mu**2 - np.exp(logvar)))
`,
  test_code: `
rng = np.random.default_rng(1)
mu = rng.normal(0, 1, 5)
logvar = rng.normal(0, 0.5, 5)

def kl_mc(mu, logvar, n=400000):
    rng2 = np.random.default_rng(3)
    eps = rng2.standard_normal((n, len(mu)))
    z = mu + np.exp(0.5*logvar)*eps
    log_q = -0.5*np.sum(np.log(2*np.pi) + logvar + (z-mu)**2/np.exp(logvar), axis=1)
    log_p = -0.5*np.sum(np.log(2*np.pi) + z**2, axis=1)
    return float(np.mean(log_q - log_p))

check("Coincide con la estimación Monte Carlo", lambda: np.isclose(kl_normal(mu, logvar), kl_mc(mu, logvar), atol=0.02),
      msg=f"KL={kl_normal(mu, logvar):.4f}, Monte Carlo={kl_mc(mu, logvar):.4f}")
check("KL(N(0,I) ‖ N(0,I)) = 0", lambda: np.isclose(kl_normal(np.zeros(4), np.zeros(4)), 0.0, atol=1e-9),
      msg="Con mu=0 y logvar=0 la KL debe ser exactamente 0")
check("La KL es siempre no negativa", lambda: kl_normal(rng.normal(0, 2, 6), rng.normal(0, 1, 6)) >= -1e-9,
      msg="Una divergencia KL nunca puede ser negativa: revisa los signos de la fórmula")
check("Devuelve un escalar float", lambda: isinstance(kl_normal(mu, logvar), float),
      msg="Suma sobre todas las dimensiones latentes y devuelve un float de Python")
`,
  hints: [
    'Cada dimensión aporta $-\\tfrac{1}{2}(1 + \\text{logvar}_j - \\mu_j^2 - \\exp(\\text{logvar}_j))$; luego sumas todo.',
    '`np.exp(logvar)` es $\\sigma^2$. No uses `np.sqrt`: la fórmula trabaja con varianzas, no con desviaciones.',
    'Comprueba tu fórmula con el caso trivial: si `mu=0` y `logvar=0`, cada término vale $1 + 0 - 0 - 1 = 0$.',
  ],
}

const ganLosses: Exercise = {
  id: 'generativos-gan-losses',
  title: 'Las pérdidas del duelo GAN',
  difficulty: 'INTERMEDIO',
  xp: 60,
  statement: [
    'En una GAN el discriminador $D$ y el generador $G$ juegan al minimax:',
    '$$\\min_G \\max_D \\; V = \\mathbb{E}_x[\\log D(x)] + \\mathbb{E}_z[\\log(1 - D(G(z)))]$$',
    'Recibes **scores** (probabilidades que $D$ asigna a "real", valores en $[0,1]$). Implementa:',
    '- `d_loss(real_scores, fake_scores)` → $-\\frac{1}{n}\\sum \\log D(x) \\;-\\; \\frac{1}{m}\\sum \\log(1 - D(G(z)))$',
    '- `g_loss(fake_scores)` → versión **no saturante**: $-\\frac{1}{m}\\sum \\log D(G(z))$',
    'Ambas deben ser numéricamente estables en los extremos: usa `np.clip(scores, eps, 1 - eps)` con `eps = 1e-12` para no evaluar $\\log 0$.',
  ].join('\n'),
  starter_code: `import numpy as np

def d_loss(real_scores, fake_scores):
    """
    Pérdida BCE del discriminador: -mean(log(real)) - mean(log(1 - fake)).
    Estable en los extremos (clip a [eps, 1-eps]).
    """
    # TODO
    return 0.0

def g_loss(fake_scores):
    """
    Pérdida no saturante del generador: -mean(log(fake)).
    """
    # TODO
    return 0.0

real = np.array([0.9, 0.8, 0.95])
fake = np.array([0.3, 0.4, 0.2])
print(f"d_loss = {d_loss(real, fake):.4f}")  # esperado ≈ 0.4356
print(f"g_loss = {g_loss(fake):.4f}")        # esperado ≈ 1.2040
`,
  solution_code: `import numpy as np

def d_loss(real_scores, fake_scores):
    eps = 1e-12
    real_scores = np.clip(np.asarray(real_scores, dtype=float), eps, 1.0 - eps)
    fake_scores = np.clip(np.asarray(fake_scores, dtype=float), eps, 1.0 - eps)
    return float(-np.mean(np.log(real_scores)) - np.mean(np.log(1.0 - fake_scores)))

def g_loss(fake_scores):
    eps = 1e-12
    fake_scores = np.clip(np.asarray(fake_scores, dtype=float), eps, 1.0 - eps)
    return float(-np.mean(np.log(fake_scores)))
`,
  test_code: `
real = np.array([0.9, 0.8, 0.95])
fake = np.array([0.3, 0.4, 0.2])
ref_d = -np.mean(np.log(real)) - np.mean(np.log(1-fake))
ref_g = -np.mean(np.log(fake))
check("d_loss coincide con la referencia BCE", lambda: np.isclose(d_loss(real, fake), ref_d),
      msg=f"obtenido {d_loss(real, fake):.4f}, esperado {ref_d:.4f}")
check("g_loss coincide con la referencia no saturante", lambda: np.isclose(g_loss(fake), ref_g),
      msg=f"obtenido {g_loss(fake):.4f}, esperado {ref_g:.4f}")
check("Un D perfecto tiene pérdida ≈ 0", lambda: d_loss(np.ones(5), np.full(5, 1e-9)) < 0.01,
      msg="Si D acierta todo (reales→1, falsas→0), d_loss debe ser casi 0")
check("Estable en los extremos (sin nan ni inf)", lambda: np.isfinite(d_loss(np.array([1.0, 1.0]), np.array([1.0, 0.0]))) and np.isfinite(g_loss(np.array([0.0, 1.0]))),
      msg="Con scores de 0.0 o 1.0 la pérdida debe ser finita: aplica np.clip antes del logaritmo")
check("g_loss crece cuando G engaña peor", lambda: g_loss(np.array([0.1])) > g_loss(np.array([0.9])),
      msg="g_loss debe premiar que D(G(z)) se acerque a 1, no a 0")
`,
  hints: [
    'Antes del logaritmo, recorta: `np.clip(scores, 1e-12, 1 - 1e-12)`. Así $\\log 0$ nunca aparece.',
    'Ojo con `1 - fake_scores`: en `d_loss` el segundo término usa $\\log(1 - D(G(z)))$; en `g_loss` (no saturante) es $\\log D(G(z))$ directamente.',
    'Las medias de los dos términos de `d_loss` se calculan por separado (`np.mean` de cada sumando) y luego se restan ambas.',
  ],
}

const ganStep: Exercise = {
  id: 'generativos-gan-step',
  title: 'Un paso de entrenamiento GAN (D primero, G después)',
  difficulty: 'AVANZADO',
  xp: 140,
  statement: [
    'Tienes una GAN mínima en 1D, con ambos modelos **lineales**:',
    '$$G(z) = g_w \\, z + g_b, \\qquad D(x) = \\sigma\\!\\left(d_w \\, x + d_b\\right)$$',
    'Implementa `gan_step(D, G, real_batch, z, lr)` que realice **un paso de descenso de gradiente** y devuelva `(D_nuevo, G_nuevo)` (dicts nuevos con claves `"w"` y `"b"`, sin mutar los originales):',
    '1. **Actualiza D** con su pérdida BCE. Con $p = D(x)$ y etiqueta $y \\in \\{0,1\\}$, el gradiente del logit es $p - y$:',
    '$$\\frac{\\partial L_D}{\\partial d_w} = \\overline{(p_{real}-1)\\, x} + \\overline{p_{fake}\\, \\hat{x}}, \\qquad \\frac{\\partial L_D}{\\partial d_b} = \\overline{(p_{real}-1)} + \\overline{p_{fake}}$$',
    '2. **Actualiza G** con la pérdida no saturante $L_G = -\\overline{\\log D(G(z))}$, calculando el gradiente **con el D ya actualizado** (paso secuencial, como en la práctica):',
    '$$\\frac{\\partial L_G}{\\partial g_w} = \\overline{(p_{fake}-1)\\, d_w^{nuevo}\\, z}, \\qquad \\frac{\\partial L_G}{\\partial g_b} = \\overline{(p_{fake}-1)}$$',
    '**Trampa clásica**: si calculas el gradiente de G con el D viejo (stale), el test de orden te cazará.',
  ].join('\n'),
  starter_code: `import numpy as np

def _sigmoid(v):
    return 1.0 / (1.0 + np.exp(-v))

def gan_step(D, G, real_batch, z, lr):
    """
    Un paso de entrenamiento GAN. D y G son dicts {"w": float, "b": float}.
    Devuelve (D_nuevo, G_nuevo): dicts NUEVOS (no mutar los de entrada).
    Orden: primero descenso sobre la BCE de D, luego descenso sobre -log D(G(z))
    usando el D ya actualizado.
    """
    # TODO: forward de D sobre reales y falsas
    # TODO: gradientes de D y actualización
    # TODO: gradiente de G con el D NUEVO y actualización
    return D, G  # esto no actualiza nada…

# Prueba rápida
rng = np.random.default_rng(11)
real_batch = rng.normal(2.0, 0.5, 256)
z = rng.standard_normal(256)
D = {"w": 0.3, "b": -0.2}
G = {"w": 1.1, "b": 0.0}
D2, G2 = gan_step(D, G, real_batch, z, 0.5)
print("D:", D, "→", D2)
print("G:", G, "→", G2)
`,
  solution_code: `import numpy as np

def _sigmoid(v):
    return 1.0 / (1.0 + np.exp(-v))

def gan_step(D, G, real_batch, z, lr):
    real_batch = np.asarray(real_batch, dtype=float)
    z = np.asarray(z, dtype=float)

    # 1) Forward de D sobre reales y generadas
    p_real = _sigmoid(D["w"] * real_batch + D["b"])   # D(x_real)
    fake = G["w"] * z + G["b"]                         # G(z)
    p_fake = _sigmoid(D["w"] * fake + D["b"])          # D(G(z))

    # 2) Gradientes de la BCE de D (dL/dlogit = p - y)
    d_w = np.mean((p_real - 1.0) * real_batch) + np.mean(p_fake * fake)
    d_b = np.mean(p_real - 1.0) + np.mean(p_fake)
    D_new = {"w": D["w"] - lr * d_w, "b": D["b"] - lr * d_b}

    # 3) Gradiente de G con el D YA ACTUALIZADO (paso secuencial)
    p_fake_new = _sigmoid(D_new["w"] * fake + D_new["b"])
    g_w = np.mean((p_fake_new - 1.0) * D_new["w"] * z)
    g_b = np.mean(p_fake_new - 1.0)
    G_new = {"w": G["w"] - lr * g_w, "b": G["b"] - lr * g_b}

    return D_new, G_new
`,
  test_code: `
rng = np.random.default_rng(11)
real_batch = rng.normal(2.0, 0.5, 256)
z = rng.standard_normal(256)
D0 = {"w": 0.3, "b": -0.2}
G0 = {"w": 1.1, "b": 0.0}

def sig(v): return 1/(1+np.exp(-v))
def d_loss(D, G):
    fake = G["w"]*z + G["b"]
    eps = 1e-12
    pr = np.clip(sig(D["w"]*real_batch + D["b"]), eps, 1-eps)
    pf = np.clip(sig(D["w"]*fake + D["b"]), eps, 1-eps)
    return -np.mean(np.log(pr)) - np.mean(np.log(1-pf))
def g_loss(D, G):
    fake = G["w"]*z + G["b"]
    pf = np.clip(sig(D["w"]*fake + D["b"]), 1e-12, 1-1e-12)
    return -np.mean(np.log(pf))

D1, G1 = gan_step(D0, G0, real_batch, z, 0.5)

check("[D] Devuelve dos dicts de parámetros", lambda: isinstance(D1, dict) and isinstance(G1, dict) and "w" in D1 and "b" in G1,
      msg="gan_step debe devolver (D_nuevo, G_nuevo), cada uno con claves 'w' y 'b'")
check("[D] Su pérdida BCE baja tras el paso", lambda: d_loss(D1, G0) < d_loss(D0, G0),
      msg=f"d_loss antes={d_loss(D0,G0):.4f}, después={d_loss(D1,G0):.4f}: el paso de D debe reducirla")
check("[G] Su pérdida baja con el D actualizado", lambda: g_loss(D1, G1) < g_loss(D1, G0),
      msg="El paso de G debe reducir -log D(G(z)) (tiene que engañar mejor a D)")
pr = sig(D0["w"]*real_batch + D0["b"]); fk = G0["w"]*z + G0["b"]; pf = sig(D0["w"]*fk + D0["b"])
Dw = D0["w"] - 0.5*(np.mean((pr-1)*real_batch) + np.mean(pf*fk))
Db = D0["b"] - 0.5*(np.mean(pr-1) + np.mean(pf))
pf2 = sig(Dw*fk + Db)
Gw = G0["w"] - 0.5*np.mean((pf2-1)*Dw*z)
Gb = G0["b"] - 0.5*np.mean(pf2-1)
check("[orden] G usa el D actualizado (gradiente fresco)", lambda: np.isclose(G1["w"], Gw, atol=1e-8) and np.isclose(G1["b"], Gb, atol=1e-8),
      msg="G debe calcular su gradiente con el discriminador YA actualizado, no con el D viejo (stale)")
check("[orden] Los dicts originales no se mutan in-place", lambda: D0["w"] == 0.3 and G0["b"] == 0.0,
      msg="Devuelve dicts nuevos; no modifiques D y G in-place")
`,
  hints: [
    'Para la BCE con sigmoide, $\\partial L / \\partial \\text{logit} = p - y$. Reales: $y=1$; generadas: $y=0$.',
    'En el paso de G, la cadena es: logit $= d_w \\cdot \\hat{x} + d_b$ y $\\hat{x} = g_w z + g_b$, así $\\partial\\, \\text{logit} / \\partial g_w = d_w \\cdot z$. Usa el $d_w$ **nuevo**.',
    'Crea dicts nuevos: `D_new = {"w": D["w"] - lr*d_w, ...}` y calcula `p_fake` otra vez con `D_new` antes del gradiente de G.',
  ],
}

const difusionForward: Exercise = {
  id: 'generativos-difusion-forward',
  title: 'Difusión forward en forma cerrada',
  difficulty: 'INTERMEDIO',
  xp: 60,
  statement: [
    'El proceso forward de difusión añade ruido paso a paso: $q(x_t \\,|\\, x_{t-1}) = \\mathcal{N}(\\sqrt{1-\\beta_t}\\, x_{t-1}, \\, \\beta_t I)$. En vez de simular los $T$ pasos, la forma cerrada salta directamente a cualquier $t$:',
    '$$x_t = \\sqrt{\\bar{\\alpha}_t}\\, x_0 + \\sqrt{1 - \\bar{\\alpha}_t}\\, \\varepsilon, \\qquad \\bar{\\alpha}_t = \\prod_{s=0}^{t} (1 - \\beta_s), \\quad \\varepsilon \\sim \\mathcal{N}(0, I)$$',
    'Implementa `q_sample(x0, t, betas, eps)`: `betas` es el array con el schedule $\\{\\beta_s\\}_{s=0}^{T-1}$ y `t` el índice del paso (0-based). Debe conservar la forma de `x0`.',
  ].join('\n'),
  starter_code: `import numpy as np

def q_sample(x0, t, betas, eps):
    """
    Salto directo al paso t del proceso forward de difusión.
    x0, eps: arrays de la misma forma. t: índice (int). betas: array 1D.
    """
    # TODO: abar_t = producto acumulado de (1 - betas) hasta el índice t
    return x0  # sin ruido todavía…

# Prueba rápida
T = 1000
betas = np.linspace(1e-4, 0.02, T)
x0 = np.random.default_rng(5).normal(3.0, 0.5, (20000,))
eps = np.random.default_rng(6).standard_normal(20000)
xT = q_sample(x0, T - 1, betas, eps)
print(f"x_T: media={xT.mean():.3f}, std={xT.std():.3f}")  # esperado: ≈ N(0, 1)
`,
  solution_code: `import numpy as np

def q_sample(x0, t, betas, eps):
    betas = np.asarray(betas, dtype=float)
    alphas_cum = np.cumprod(1.0 - betas)
    abar_t = alphas_cum[t]
    return np.sqrt(abar_t) * x0 + np.sqrt(1.0 - abar_t) * eps
`,
  test_code: `
T = 1000
betas = np.linspace(1e-4, 0.02, T)
rng = np.random.default_rng(5)
x0 = rng.normal(3.0, 0.5, (20000,))
eps = rng.standard_normal(20000)

abar0 = 1 - betas[0]
check("t=0 aplica la forma cerrada con abar_0 = 1 − beta_0", lambda: np.allclose(q_sample(x0, 0, betas, eps), np.sqrt(abar0)*x0 + np.sqrt(1-abar0)*eps, atol=1e-10),
      msg="En t=0: x = sqrt(abar_0)·x0 + sqrt(1−abar_0)·eps, con abar_0 = 1 − beta_0")
xT = q_sample(x0, T-1, betas, eps)
check("En t=T la distribución es ≈ N(0, I)", lambda: abs(xT.mean()) < 0.05 and abs(xT.std() - 1) < 0.05,
      msg=f"media={xT.mean():.3f}, std={xT.std():.3f}: con T=1000 pasos, x_T debe ser prácticamente ruido puro")
x0v = np.array([2.0]); epsv = np.array([0.5]); t_mid = 500
abar = np.cumprod(1-betas)[t_mid]
ref = np.sqrt(abar)*x0v + np.sqrt(1-abar)*epsv
check("Valor intermedio exacto vs forma cerrada", lambda: np.allclose(q_sample(x0v, t_mid, betas, epsv), ref, atol=1e-12),
      msg="Usa la forma cerrada: x_t = sqrt(abar_t)·x0 + sqrt(1−abar_t)·eps (abar = cumprod de 1−beta)")
check("Conserva la forma del array", lambda: q_sample(np.zeros((4,3)), 10, betas, np.ones((4,3))).shape == (4,3),
      msg="q_sample debe funcionar con arrays de cualquier forma")
`,
  hints: [
    '`np.cumprod(1 - betas)` te da todos los $\\bar{\\alpha}_s$ de golpe; indexa con `t`.',
    'Son DOS raíces cuadradas distintas: $\\sqrt{\\bar{\\alpha}_t}$ multiplica a `x0` y $\\sqrt{1-\\bar{\\alpha}_t}$ multiplica a `eps`.',
    'No simules el bucle paso a paso: la gracia de la forma cerrada es que es O(1) para cualquier `t`.',
  ],
}

export const GENERATIVOS_EXERCISES: Exercise[] = [reparam, klNormal, ganLosses, ganStep, difusionForward]

registerExercises(GENERATIVOS_EXERCISES)
