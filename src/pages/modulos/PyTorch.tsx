/**
 * Página · PyTorch práctico — /modulos/pytorch (N7)
 * Enfoque: construye tu propio mini-PyTorch (micrograd) y la API real
 * deja de ser magia. Autograd → tensores/broadcasting → training loop →
 * GPU/AMP/buenas prácticas → ejercicios (numpy puro en Pyodide).
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { InlineMath } from 'react-katex'
import ModuleHero from '@/components/ModuleHero'
import ChapterNav from '@/components/ChapterNav'
import FormulaBlock from '@/components/FormulaBlock'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import { TeXParagraphs } from '@/lib/katex-content'
import { getExercise, registerExercises } from '@/lib/exercises'
import { PYTORCH_EXERCISES } from '@/data/exercises/pytorch'
import GrafoComputacionalDemo from '@/components/pytorch/GrafoComputacionalDemo'
import BroadcastingDemo from '@/components/pytorch/BroadcastingDemo'
import TrainingLoopDemo from '@/components/pytorch/TrainingLoopDemo'

registerExercises(PYTORCH_EXERCISES)

const SECTIONS = [
  { id: 'idea', label: '7.A La idea sin fórmulas' },
  { id: 'repaso', label: '7.B Repaso exprés' },
  { id: 'glosario', label: '7.C Glosario de símbolos' },
  { id: 'autograd', label: '7.1 Autograd: el motor' },
  { id: 'tensores', label: '7.2 Tensores' },
  { id: 'loop', label: '7.3 El training loop real' },
  { id: 'gpu', label: '7.4 GPU y buenas prácticas' },
  { id: 'ejercicios', label: '7.5 Ejercicios' },
]

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <span className="mb-3 inline-block rounded-full border border-lime/30 bg-lime/10 px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-lime">
        {kicker}
      </span>
      <h2 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
        {title}
      </h2>
    </div>
  )
}

function Prose({ content }: { content: string }) {
  return <TeXParagraphs content={content} className="mb-6 max-w-[720px] text-base leading-[1.75] text-muted" />
}

/** Aviso antes de una fórmula: qué hace, sin notación. */
function Llano({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 max-w-[720px] rounded-lg border-l-2 border-lime/60 bg-lime/5 px-4 py-3">
      <div className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-lime">// en castellano llano</div>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </div>
  )
}

/** Checklist de prerrequisitos con enlace al módulo donde se explican. */
function Repaso({ items }: { items: { q: string; d: string; to: string; toLabel: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((r) => (
        <div key={r.q} className="rounded-xl border border-line bg-panel px-5 py-4 transition-all hover:-translate-y-1 hover:border-lime/50">
          <div className="mb-1.5 font-display text-sm font-semibold text-ink">{r.q}</div>
          <p className="mb-2 text-xs leading-relaxed text-muted">{r.d}</p>
          <Link to={r.to} className="font-mono text-xs text-cyan transition-colors hover:text-ink">
            → {r.toLabel}
          </Link>
        </div>
      ))}
    </div>
  )
}

/** Tarjetas símbolo → significado en una línea. */
function Glosario({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([sym, desc]) => (
        <div key={sym} className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3">
          <span className="inline-flex min-w-[2.75rem] shrink-0 justify-center rounded-md border border-violet/40 bg-violet/10 px-2 py-1 font-mono text-sm text-violet">
            <InlineMath math={sym} />
          </span>
          <span className="text-xs leading-relaxed text-muted">{desc}</span>
        </div>
      ))}
    </div>
  )
}

/** Bloque de código estático con chrome de terminal. */
function CodeBlock({ title, code, accent = '#22D3EE' }: { title: string; code: string; accent?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="border-b border-line bg-panel-2 px-4 py-2 font-mono text-xs" style={{ color: accent }}>
        {title}
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-muted">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function PyTorch() {
  return (
    <>
      <ModuleHero
        level="N7"
        kicker="// NIVEL 7 · EL FRAMEWORK"
        title="PyTorch práctico: constrúyelo y entiéndelo para siempre"
        abstract="Nada de memorizar la API: vas a construir tu propio mini-PyTorch con numpy — autograd, tensores, capas, optimizador — y descubrir que torch es exactamente eso, pero rápido y en GPU. Cuando tu micrograd entrene una red, loss.backward() jamás volverá a ser magia."
        meta={{ duration: '≈ 4 h', demos: 3, exercises: 6, xp: 510 }}
        art="/art-pytorch.svg"
        color="#A3E635"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-20">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1 space-y-28">
          {/* S0a · La idea sin fórmulas */}
          <section id="idea">
            <SectionHead kicker="// 7.A · antes de empezar" title="La idea sin fórmulas" />
            <Prose content={String.raw`Un framework de deep learning es, despojado del marketing, **cuatro piezas que ya conoces**: (1) un **motor de autograd** que deriva solo cualquier cálculo que hagas — es tu backprop del N2 automatizado; (2) un **tensor**, un array como los de numpy pero que vive también en la GPU y se multiplica millones de veces más rápido; (3) un catálogo de **capas** prefabricadas (lineales, convoluciones, atención…) que no son más que funciones con pesos dentro; y (4) un **optimizador**, el objeto que guarda esos pesos y los gira en la dirección que baja el error.

¿Y el training loop tan famoso? Cinco líneas: toma un puñado de ejemplos, calcula la predicción, mide el error, propaga la culpa hacia atrás y ajusta los pesos. Es **exactamente** el bucle que escribiste a mano en el N2 — PyTorch solo lo empaqueta para que no tengas que re-derivar nada cada vez que cambias la arquitectura.

Por eso este módulo no empieza enseñándote \`import torch\`: empieza haciéndote **construir** las cuatro piezas con numpy, en ejercicios que corren aquí mismo, en tu navegador. Cuando tu propio motor de autograd entrene una red de verdad, la API de PyTorch se convertirá en una simple tabla de traducción: cada clase que escribiste tiene su gemela profesional. PyTorch no hace magia: hace lo que tú ya sabes hacer, pero rápido, en GPU y sin que tengas que depurar la regla de la cadena a mano.`} />
          </section>

          {/* S0b · Repaso exprés */}
          <section id="repaso">
            <SectionHead kicker="// 7.B · prerrequisitos en 1 minuto" title="Repaso exprés" />
            <Prose content={String.raw`Este módulo reutiliza todo lo que ya construiste. Si algo te suena lejano, pulsa el enlace antes de seguir.`} />
            <Repaso items={[
              { q: '¿Derivaste backprop a mano?', d: 'La regla de la cadena capa a capa, con los δ viajando hacia atrás. Autograd es ESO, automatizado.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes Neuronales' },
              { q: '¿Recuerdas el descenso de gradiente?', d: 'Girar cada peso contra el gradiente del error, paso a paso. El optimizer de PyTorch hace justo eso.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Manejas numpy con soltura?', d: 'Arrays, formas, productos de matrices. Los tensores de PyTorch son ndarrays con superpoderes.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué era el MSE?', d: 'La media de los errores al cuadrado: la pérdida que minimizarás en los ejercicios.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Softmax y entropía cruzada?', d: 'Convertir logits en probabilidades y medir la sorpresa. Aquí los reimplementas con estabilidad numérica.', to: '/modulos/ml-clasico', toLabel: 'repásalo en ML Clásico' },
              { q: '¿Y una MLP completa?', d: 'Capas lineales con no-linealidad entre medias. La entrenarás con TU propio framework en el ejercicio final.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes Neuronales' },
            ]} />
          </section>

          {/* S0c · Glosario */}
          <section id="glosario">
            <SectionHead kicker="// 7.C · diccionario del módulo" title="Glosario de símbolos" />
            <Prose content={String.raw`Conceptos de PyTorch y de tu mini-framework, traducidos en una línea. Vuelve aquí cuando te pierdas.`} />
            <Glosario items={[
              [String.raw`\mathrm{Tensor}`, 'un ndarray que recuerda cómo se calculó: dato + gradiente + historial de operaciones'],
              [String.raw`\mathrm{requires\_grad}`, 'interruptor que dice "vigila este tensor: querré su gradiente"'],
              [String.raw`\mathrm{backward()}`, 'recorre el grafo hacia atrás aplicando la regla de la cadena y rellena todos los .grad'],
              [String.raw`p\mathrm{.grad}`, 'donde se ACUMULA ∂L/∂p; por eso hay que ponerlo a cero en cada paso'],
              [String.raw`\partial L / \partial p`, 'cuánto sube la pérdida si mueves el parámetro p un poquitín'],
              [String.raw`\eta`, 'learning rate: el tamaño del paso del optimizador'],
              [String.raw`\mathrm{batch}`, 'un puñado de ejemplos procesados a la vez (vectorizado, sin bucles)'],
              [String.raw`\mathrm{epoch}`, 'una pasada completa por todos los datos de entrenamiento'],
              [String.raw`\mathrm{broadcasting}`, 'estirar arrays de formas compatibles para operarlos sin bucles ni copias'],
              [String.raw`\mathrm{no\_grad}`, 'modo "no vigiles nada": evaluación más rápida y con menos memoria'],
              [String.raw`\mathrm{AMP}`, 'mixed precision: calcular en fp16 donde es seguro para ir ~2× más rápido en GPU'],
              [String.raw`\top`, 'transpuesta: la matriz girada; aparece en las reglas de backward del matmul'],
            ]} />
          </section>

          {/* S1 · Autograd */}
          <section id="autograd">
            <SectionHead kicker="// 7.1 · el corazón del framework" title="Autograd: el motor" />
            <Prose content={String.raw`Cada vez que ejecutas una operación sobre tensores con \`requires_grad=True\`, PyTorch **graba** qué operación fue y quiénes fueron sus padres. El resultado es un **grafo computacional**: nodos que son valores, aristas que son operaciones. Cuando llamas a \`loss.backward()\`, el motor siembra un 1 en la pérdida ($\partial L/\partial L = 1$) y recorre el grafo **en orden topológico inverso**, aplicando en cada nodo su regla local de derivación y ACUMULANDO el resultado en el \`.grad\` de cada padre.

La revelación: esto es tu backprop del N3. Allí propagabas $\delta^{(l)}$ capa a capa con la regla de la cadena; aquí cada operación sabe su derivada local y el motor encadena todas. La eficiencia es la misma que descubriste entonces: el coste de obtener TODOS los gradientes es comparable a UN forward.`} />
            <Llano>
              Piensa en un vídeo de tu cálculo: el forward lo graba fotograma a fotograma (quién salió de quién).
              backward() rebobina el vídeo y, en cada fotograma, reparte la culpa del error según la receta de esa
              operación concreta. La multiplicación reparte "cruzado" (a recibe b·grad), la suma reparte "copiando",
              y si un valor aparece en dos sitios, sus culpas se suman.
            </Llano>
            <FormulaBlock
              formula={String.raw`\frac{\partial L}{\partial x} = \sum_{c \;\in\; \mathrm{hijos}(x)} \frac{\partial L}{\partial c} \cdot \frac{\partial c}{\partial x}`}
              caption="La regla de la cadena multivariable: TODA la maquinaria de autograd cabe aquí"
              breakdown={[
                { symbol: '\\frac{\\partial L}{\\partial x}', color: '#FB7185', explanation: 'lo que quieres: cuánto culpa tiene x del error final' },
                { symbol: '\\mathrm{hijos}(x)', color: '#22D3EE', explanation: 'todas las operaciones que usaron x (si x se usó dos veces, ¡suma las dos!)' },
                { symbol: '\\frac{\\partial c}{\\partial x}', color: '#8B5CF6', explanation: 'la derivada LOCAL: cada operación solo necesita saber la suya' },
              ]}
            />
            <div className="mt-8">
              <GrafoComputacionalDemo />
            </div>
            <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-faint">
                    <th className="px-4 py-2.5 uppercase tracking-wider">tu micrograd (ejercicios E1–E3)</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">PyTorch real</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {[
                    ['class Value / class Tensor', 'torch.Tensor'],
                    ['Tensor(datos, requires_grad=True)', 'torch.tensor(datos, requires_grad=True)'],
                    ['loss.backward()  # orden topológico + regla de la cadena', 'loss.backward()  # idéntico'],
                    ['w.grad  (se acumula con cada backward)', 'w.grad  (también acumula: mismo diseño)'],
                    ['_unbroadcast(grad, shape)  # deshacer el estiramiento', 'lo hace autograd internamente, invisible'],
                    ['W.data -= lr * W.grad  # tocar solo los datos', 'con torch.no_grad(): p -= lr * p.grad'],
                  ].map(([a, b]) => (
                    <tr key={a} className="border-b border-line/50 last:border-0">
                      <td className="px-4 py-2 text-lime">{a}</td>
                      <td className="px-4 py-2 text-cyan">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* S2 · Tensores */}
          <section id="tensores">
            <SectionHead kicker="// 7.2 · ndarrays con esteroides" title="Tensores: datos que viven en GPU" />
            <Prose content={String.raw`Un \`torch.Tensor\` es un \`np.ndarray\` con tres superpoderes: puede portar gradiente (lo visto arriba), puede vivir en la **GPU** con \`.to('cuda')\`, y su API es casi calcada de numpy — \`@\`, \`.sum()\`, \`.reshape()\`, \`[:, None]\`… Si sabes numpy, ya sabes el 80 % de los tensores.

El concepto que más bugs y más velocidad te va a dar es el **broadcasting**: operar formas distintas sin bucles. Las reglas caben en una línea: alinea las formas por la derecha; una dimensión que vale 1 se *estira*; una dimensión ausente se convierte en 1. Y el estiramiento es **virtual**: no se copia memoria, solo se re-indexa. Por eso \`X - X.mean(0)\` centra un millón de filas en microsegundos.

La vectorización no es estética, es física: un bucle en Python ejecuta ~10⁷ operaciones por segundo; una operación vectorizada en C/GPU, ~10¹⁰. Mil veces. El bucle \`for i: y[i] = w*x[i] + b\` y la expresión \`y = X @ w + b\` calculan lo mismo — uno tarda un café, el otro un parpadeo.`} />
            <Llano>
              Broadcasting = fotocopiadora imaginaria. Si un array es "demasiado pequeño" para la operación,
              numpy/PyTorch finge que lo ha fotocopiado las veces necesarias para encajar — sin gastar memoria.
              Solo hay que vigilar que las formas encajen por la derecha; si no, te regala un RuntimeError
              que ahora sabrás leer de un vistazo.
            </Llano>
            <FormulaBlock
              formula={String.raw`(n, d) - (d,) \;\longrightarrow\; (n, d) \qquad (m, 1) \times (1, k) \;\longrightarrow\; (m, k)`}
              caption="Las dos formas de broadcasting que usarás el 95 % del tiempo"
              breakdown={[
                { symbol: '(n, d) - (d,)', color: '#22D3EE', explanation: 'un vector por columna aplicado a todas las filas (centrar, escalar, sesgo)' },
                { symbol: '(m,1) \\times (1,k)', color: '#8B5CF6', explanation: 'columna × fila = rejilla completa (producto externo, máscaras, distancias)' },
              ]}
            />
            <div className="mt-8">
              <BroadcastingDemo />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <CodeBlock
                title="con bucles — 10⁷ ops/s"
                accent="#FB7185"
                code={`# 1.000.000 de filas, una a una...
for i in range(n):
    s = 0.0
    for j in range(d):
        s += X[i, j] * w[j]
    y[i] = s + b   # ☕`}
              />
              <CodeBlock
                title="vectorizado — 10¹⁰ ops/s"
                accent="#A3E635"
                code={`# el mismo cálculo, en C/GPU:
y = X @ w + b    # parpadeo

# en GPU es aún más directo:
y = X.cuda() @ w.cuda() + b.cuda()`}
              />
            </div>
          </section>

          {/* S3 · Training loop */}
          <section id="loop">
            <SectionHead kicker="// 7.3 · donde todo se junta" title="La anatomía de un training loop real" />
            <Prose content={String.raw`Todo entrenamiento en PyTorch — del perceptrón a GPT — es el mismo bucle de cinco movimientos: **batch → forward → loss → backward → step**. El \`Dataset\` envuelve tus datos y el \`DataLoader\` los sirve en batches barajados (\`shuffle=True\` rompe el orden para que cada epoch cuente una historia distinta). El modelo es un \`nn.Module\`: una clase cuyo \`forward(x)\` define el cálculo y cuyo \`parameters()\` devuelve, recursivamente, todos los pesos de todas las subcapas — así el optimizador no necesita conocer tu arquitectura.

Y el orden sagrado dentro del batch: \`optimizer.zero_grad()\` (los \`.grad\` se acumulan, hay que vaciarlos), \`loss.backward()\` (rellena los gradientes) y \`optimizer.step()\` (mueve los pesos contra su gradiente). Olvidar el \`zero_grad()\` es el bug nº 1 del principiante: el entrenamiento "funciona" pero los gradientes se mezclan entre batches.`} />
            <Llano>
              Es una cadena de montaje de cinco estaciones que se repite miles de veces: coge una caja de ejemplos,
              haz la predicción, mide cuánto te has equivocado, reparte la culpa entre los tornillos, gira los
              tornillos un poquito. Caja siguiente. El modelo aprende por puro aburrimiento repetido.
            </Llano>
            <div className="my-8">
              <TrainingLoopDemo />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CodeBlock
                title="tu mini-framework (E4–E6)"
                accent="#A3E635"
                code={`for epoch in range(epochs):
    perm = rng.permutation(n)
    for ini in range(0, n, bs):
        idx = perm[ini:ini+bs]
        pred = modelo(Tensor(X[idx]))
        loss = mse_loss(pred, yb)
        opt.zero_grad()
        loss.backward()
        opt.step()`}
              />
              <CodeBlock
                title="PyTorch real — misma película"
                accent="#22D3EE"
                code={`model = MLP(); opt = optim.SGD(
    model.parameters(), lr=0.5)
for epoch in range(epochs):
    for xb, yb in loader:  # shuffle=True
        pred = model(xb)
        loss = criterion(pred, yb)
        opt.zero_grad()
        loss.backward()
        opt.step()`}
              />
            </div>
            <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-faint">
                    <th className="px-4 py-2.5 uppercase tracking-wider">pieza</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">la tuya</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">PyTorch</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {[
                    ['datos en batches', 'rng.permutation(n) + slicing', 'Dataset + DataLoader(shuffle=True)'],
                    ['capa densa', 'class Linear (x @ W + b)', 'nn.Linear(n_in, n_out)'],
                    ['modelo', 'class MLP con parameters()', 'nn.Module con forward()'],
                    ['pérdida', 'mse_loss(pred, yb)', 'nn.MSELoss() / nn.CrossEntropyLoss()'],
                    ['optimizador', 'class SGD (zero_grad / step)', 'torch.optim.SGD / Adam'],
                    ['gradientes a cero', 'p.zero_grad() en cada p', 'optimizer.zero_grad()'],
                    ['paso', 'p.data -= lr * p.grad', 'optimizer.step()'],
                  ].map(([pieza, tuya, torch]) => (
                    <tr key={pieza} className="border-b border-line/50 last:border-0">
                      <td className="px-4 py-2 text-ink">{pieza}</td>
                      <td className="px-4 py-2 text-lime">{tuya}</td>
                      <td className="px-4 py-2 text-cyan">{torch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* S4 · GPU y buenas prácticas */}
          <section id="gpu">
            <SectionHead kicker="// 7.4 · de juguete a producción" title="GPU, mixed precision y buenas prácticas" />
            <Prose content={String.raw`Tu framework y PyTorch calculan lo mismo; la diferencia de velocidad está en DÓNDE y CON QUÉ PRECISIÓN. Mover trabajo a la GPU son dos llamadas: \`model.to('cuda')\` y \`xb = xb.to('cuda')\` — modelo y datos deben vivir en el mismo dispositivo o el error te lo recordará. La **mixed precision** (AMP) guarda los pesos en fp32 pero ejecuta los matmuls en fp16/bf16 dentro de \`torch.autocast('cuda')\`: ~2× de velocidad en GPUs modernas sin apenas pérdida de exactitud, con un \`GradScaler\` que rescala la pérdida para que los gradientes pequeños no se desvanezcan en fp16.

Las buenas prácticas no son decoración, son bugs que ya cometió alguien por ti: \`model.train()\` / \`model.eval()\` conmutan el comportamiento de dropout y batchnorm; la evaluación se hace bajo \`with torch.no_grad():\` para no construir grafos innecesarios (menos memoria, más velocidad); el checkpointing guarda \`model.state_dict()\` y \`optimizer.state_dict()\` (reanudar sin el optimizador es empezar el descenso con amnesia); y \`torch.manual_seed(42)\` fija TODAS las semillas para que un resultado sea reproducible — en tus ejercicios E4–E6 ya lo comprobaste: misma semilla, mismo entrenamiento, bit a bit.`} />
            <Llano>
              Piensa en train/eval como el modo "obra" y el modo "visita" de un edificio: en obra hay andamios
              (dropout apaga neuronas al azar) que en la visita deben quitarse. Y no_grad es decirle al cámara
              que deje de grabar: si nadie va a rebobinar el vídeo, grabarlo solo gasta memoria.
            </Llano>
            <div className="grid gap-4 md:grid-cols-2">
              <CodeBlock
                title="evaluación correcta"
                accent="#22D3EE"
                code={`model.eval()          # dropout off, BN en modo inferencia
with torch.no_grad(): # no construyas el grafo
    logits = model(x_test.to(device))
    acc = (logits.argmax(1) == y_test).float().mean()`}
              />
              <CodeBlock
                title="AMP + checkpoint + semilla"
                accent="#A3E635"
                code={`torch.manual_seed(42)
scaler = torch.cuda.amp.GradScaler()
with torch.autocast('cuda'):
    loss = criterion(model(xb), yb)
scaler.scale(loss).backward()
scaler.step(opt); scaler.update()
torch.save({'model': model.state_dict(),
            'opt': opt.state_dict()}, 'ckpt.pt')`}
              />
            </div>
          </section>

          {/* S5 · Ejercicios */}
          <section id="ejercicios">
            <SectionHead kicker="// 7.5 · construye tu PyTorch" title="Ejercicios" />
            <Prose content={String.raw`Aquí no hay \`import torch\`: hay \`import numpy\` y tus manos. Cada ejercicio construye una pieza del framework; el último las junta todas y entrena una red real en un problema no lineal. Al terminar, vuelve a las tablas de traducción de arriba y comprueba que ya no hay nada que traducir.`} />
            <div className="space-y-10">
              <ExerciseCard exercise={getExercise('pytorch-micrograd-escalar')!} />
              <ExerciseCard exercise={getExercise('pytorch-broadcasting')!} />
              <ExerciseCard exercise={getExercise('pytorch-autograd-tensorial')!} />
              <ExerciseCard exercise={getExercise('pytorch-training-loop')!} />
              <ExerciseCard exercise={getExercise('pytorch-softmax-ce')!} />
              <ExerciseCard exercise={getExercise('pytorch-mini-framework')!} />
            </div>

            <div className="mt-16 space-y-6">
              <h3 className="font-display text-xl font-semibold text-ink">Chequeo rápido de conceptos</h3>
              <QuizCard
                quizId="pytorch-quiz-1"
                xp={10}
                question="¿Por qué hay que llamar a `optimizer.zero_grad()` antes de `loss.backward()` en cada iteración?"
                options={[
                  { text: 'Porque los gradientes se ACUMULAN en `.grad` con cada backward; sin reset, se mezclan batches', correct: true, explanation: 'Exacto: PyTorch suma las nuevas contribuciones sobre las viejas por diseño (permite gradient accumulation). Tu micrograd hace lo mismo con el `+=`.' },
                  { text: 'Porque backward() se niega a correr si hay gradientes viejos', correct: false, explanation: 'No: backward() corre perfectamente… y suma sobre lo acumulado. El bug es silencioso, por eso es tan peligroso.' },
                  { text: 'Para liberar memoria de la GPU', correct: false, explanation: 'La memoria del grafo se libera tras backward(), no con zero_grad(). Son dos recursos distintos.' },
                  { text: 'Para reiniciar los pesos a su valor inicial', correct: false, explanation: 'zero_grad() toca los GRADIENTES, no los pesos. Los pesos solo los mueve step().' },
                ]}
              />
              <QuizCard
                quizId="pytorch-quiz-2"
                xp={10}
                question="Tras ejecutar `loss.backward()`, ¿qué ha cambiado exactamente en el modelo?"
                options={[
                  { text: 'Los pesos se han actualizado en la dirección que baja la pérdida', correct: false, explanation: 'Eso lo hace optimizer.step(). backward() solo CALCULA gradientes, no mueve nada.' },
                  { text: 'Cada parámetro con requires_grad=True tiene ahora su $\\partial L/\\partial p$ acumulado en `.grad`', correct: true, explanation: 'Correcto: backward() rellena los .grad recorriendo el grafo con la regla de la cadena. Actualizar es trabajo del optimizador.' },
                  { text: 'El grafo computacional se ha guardado en disco como checkpoint', correct: false, explanation: 'El grafo vive en memoria y se libera tras backward(); los checkpoints se guardan explícitamente con torch.save.' },
                  { text: 'El modelo ha pasado a modo evaluación', correct: false, explanation: 'train()/eval() son independientes de backward(): el modo solo afecta a capas como dropout o batchnorm.' },
                ]}
              />
              <QuizCard
                quizId="pytorch-quiz-3"
                xp={10}
                question="¿Cuál es la forma del resultado de sumar un tensor $(32, 1)$ con uno $(1, 128)$ por broadcasting?"
                options={[
                  { text: '$(32, 128)$ — ambos se estiran virtualmente hasta la forma común', correct: true, explanation: '¡Eso es! Cada dimensión con 1 se estira a la del otro. Es la base del producto externo y de las máscaras de atención.' },
                  { text: '$(32, 1)$, porque el primero manda', correct: false, explanation: 'El broadcasting no "manda": estira TODAS las dimensiones de 1 hasta la forma común máxima.' },
                  { text: 'Error: las formas no coinciden', correct: false, explanation: 'Sería error si una dimensión fuera 32 y otra 128 con ninguna igual a 1… pero ambas tienen un 1 que estirar.' },
                  { text: '$(1, 1)$, porque se colapsan las dimensiones de 1', correct: false, explanation: 'Al revés: las dimensiones de 1 se EXPANDEN, nunca se colapsan. Colapsar sería una reducción (sum/mean).' },
                ]}
              />
              <QuizCard
                quizId="pytorch-quiz-4"
                xp={10}
                question="¿Qué combinación es la correcta para EVALUAR un modelo ya entrenado?"
                options={[
                  { text: '`model.eval()` + `with torch.no_grad():` — sin dropout/BN en modo train y sin construir el grafo', correct: true, explanation: 'Perfecto: eval() fija el comportamiento de las capas y no_grad() ahorra memoria y tiempo al no grabar operaciones.' },
                  { text: '`model.train()` + `loss.backward()`, para que siga aprendiendo un poquito', correct: false, explanation: 'Evaluar no es entrenar: con train() el dropout seguiría activo y backward() construiría grafos innecesarios.' },
                  { text: 'Solo `model.eval()`: no_grad() es opcional y no cambia nada', correct: false, explanation: 'eval() basta para el RESULTADO correcto, pero sin no_grad() construyes el grafo completo: misma respuesta, mucha más memoria.' },
                  { text: '`torch.no_grad()` solo: el modo train/eval no influye en la evaluación', correct: false, explanation: 'Sí influye: dropout y batchnorm se comportan distinto en train. Evaluar en modo train da métricas ruidosas y peores.' },
                ]}
              />
            </div>
          </section>

          {/* Siguiente paso */}
          <section>
            <Link
              to="/modulos/llm-modernos"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-rose/60 hover:shadow-[0_0_40px_rgba(251,113,133,0.15)]"
            >
              <div>
                <div className="mb-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-faint">
                  // siguiente paso · N8 LLMs modernos
                </div>
                <h3 className="font-display text-xl font-bold text-ink">
                  LLMs modernos: del Transformer de 2017 a GPT-4
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Ya dominas el framework con el que se construyen. En el siguiente nivel: RoPE, KV cache, MoE, RLHF/DPO, RAG y LoRA — la fontanería real de los modelos que usas a diario.
                </p>
              </div>
              <ArrowRight className="h-6 w-6 shrink-0 text-rose transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
