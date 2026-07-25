/**
 * Página · CNN — /modulos/cnn (N4)
 * Convolución hands-on → pooling → kernels sobre foto real → LeNet…ResNet → campo receptivo.
 */

import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import ModuleHero from '@/components/ModuleHero'
import ChapterNav from '@/components/ChapterNav'
import FormulaBlock from '@/components/FormulaBlock'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import { TeXParagraphs } from '@/lib/katex-content'
import { getExercise, registerExercises } from '@/lib/exercises'
import { CNN_EXERCISES } from '@/data/exercises/cnn'
import ConvolucionDemo from '@/components/cnn/ConvolucionDemo'
import PoolingDemo from '@/components/cnn/PoolingDemo'
import FotoKernelsDemo from '@/components/cnn/FotoKernelsDemo'
import ResnetDemo from '@/components/cnn/ResnetDemo'
import CampoReceptivoDemo from '@/components/cnn/CampoReceptivoDemo'

registerExercises(CNN_EXERCISES)

const SECTIONS = [
  { id: 'convolucion', label: '4.1 Convolución' },
  { id: 'pooling', label: '4.2 Pooling' },
  { id: 'kernels', label: '4.3 Kernels reales' },
  { id: 'arquitecturas', label: '4.4 LeNet → ResNet' },
  { id: 'receptivo', label: '4.5 Campo receptivo' },
  { id: 'ejercicios', label: '4.6 Ejercicios' },
]

const ARCHS = [
  {
    name: 'LeNet-5', year: '1998', author: 'Yann LeCun',
    stack: [2, 3, 2, 3, 4],
    params: '60 K', top5: '—',
    idea: 'Dígitos manuscritos para el banco: conv + pooling + densas. La prueba de que la convolución funciona.',
  },
  {
    name: 'AlexNet', year: '2012', author: 'Krizhevsky et al.',
    stack: [4, 3, 3, 2, 3, 4, 4],
    params: '60 M', top5: '15.3 %',
    idea: 'ReLU + GPU + dropout + data augmentation. Aplastó ImageNet y encendió la revolución del deep learning.',
  },
  {
    name: 'VGG', year: '2014', author: 'Simonyan & Zisserman',
    stack: [2, 2, 3, 3, 3, 3, 3, 4],
    params: '138 M', top5: '7.3 %',
    idea: 'Solo kernels 3×3 apiladas: máximo campo receptivo con mínimos parámetros. La elegancia de la simplicidad.',
  },
  {
    name: 'GoogLeNet', year: '2014', author: 'Szegedy et al.',
    stack: [2, 3, 2, 4, 2, 3, 2, 4],
    params: '6.8 M', top5: '6.7 %',
    idea: 'Módulos Inception: convoluciones 1×1, 3×3 y 5×5 en paralelo; la red elige la escala. 22 capas con pocos parámetros.',
  },
  {
    name: 'ResNet', year: '2015', author: 'He et al.',
    stack: [3, 3, 3, 3, 3, 3, 3, 3],
    params: '25 M', top5: '3.6 %',
    idea: 'La conexión residual y = F(x) + x: el gradiente fluye por el atajo y las redes de 152 capas se vuelven entrenables.',
  },
]

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-6">
      <span className="mb-3 inline-block rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">
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

export default function CNN() {
  return (
    <>
      <ModuleHero
        level="N4"
        kicker="// NIVEL 4 · VISIÓN POR COMPUTADOR"
        title="CNN: aprender a ver, un píxel a la vez"
        abstract="Una imagen no es un vector: tiene estructura espacial. La convolución la explota con kernels que detectan bordes, texturas y formas. Construirás la operación a mano y recorrerás 25 años de arquitecturas hasta ResNet."
        meta={{ duration: '≈ 4 h', demos: 6, exercises: 6, xp: 540 }}
        art="/art-cnn.png"
        color="#8B5CF6"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-20">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1 space-y-28">
          {/* S1 · Convolución */}
          <section id="convolucion">
            <SectionHead kicker="// 4.1 · la operación" title="De píxeles a patrones" />
            <Prose content={String.raw`Una imagen es un tensor $H \times W \times C$, no un vector. Aplanarla para dársela a un MLP comete dos crímenes: destruye la geometría (dos píxeles vecinos son tan importantes como dos lejanos) y dispara los parámetros (una foto de 224×224×3 → millones de pesos solo en la primera capa). Además, un MLP no sabe que un gato desplazado 10 píxeles sigue siendo el mismo gato.

La convolución lo resuelve con una idea humilde: una pequeña ventana (kernel) que recorre la imagen calculando un producto escalar en cada posición. El mismo kernel se reutiliza en todas las posiciones — **weight sharing** —, lo que da dos superpoderes: poquísimos parámetros y **equivariancia a traslaciones** (si el patrón se mueve, el mapa de salida se mueve con él).`} />
            <FormulaBlock
              formula={String.raw`(I * K)[i, j] = \sum_u \sum_v I_{\text{pad}}[s i + u,\; s j + v] \cdot K[u, v], \qquad n_{\text{out}} = \left\lfloor \frac{n + 2p - k}{s} \right\rfloor + 1`}
              caption="La convolución (correlación cruzada) y el tamaño de salida"
              breakdown={[
                { symbol: 'K', color: '#8B5CF6', explanation: 'kernel k×k: el detector de patrones' },
                { symbol: 'p', color: '#22D3EE', explanation: 'padding: marco de ceros para controlar el tamaño' },
                { symbol: 's', color: '#22D3EE', explanation: 'stride: salto de la ventana (s=2 reduce a la mitad)' },
                { symbol: 'n_{\\text{out}}', color: '#A3E635', explanation: 'tamaño del mapa de salida' },
              ]}
            />
            <div className="mt-8">
              <ConvolucionDemo />
            </div>
          </section>

          {/* S2 · Pooling */}
          <section id="pooling">
            <SectionHead kicker="// 4.2 · menos es más" title="Pooling y downsampling" />
            <Prose content={String.raw`Una vez detectado un borde, ¿importa su posición exacta al píxel? No: importa que está por ahí. El pooling resume cada ventana del mapa en un solo número: **max-pool** conserva la activación más fuerte (invariancia local y nada de desenfoque), **avg-pool** promedia (suaviza).

Reduce la resolución, lo que abarata el cómputo y hace crecer el campo receptivo de las capas siguientes. Nota moderna: muchas arquitecturas recientes reemplazan el pooling por **convoluciones con stride 2**, que aprenden su propio downsampling en vez de imponerlo.`} />
            <PoolingDemo />
          </section>

          {/* S3 · Kernels reales */}
          <section id="kernels">
            <SectionHead kicker="// 4.3 · sobre una foto real" title="Kernels artesanales" />
            <Prose content={String.raw`Antes de aprenderlos, los kernels se diseñaban a mano. Sobel detecta bordes verticales u horizontales (una derivada discreta), el Laplaciano responde a cambios en todas direcciones, el desenfoque gaussiano suaviza y el enfoque realza el detalle restando una versión difusa.

Aquí está el dato que cambió la historia: **las CNN aprenden solas kernels muy parecidos a estos**. Las primeras capas de AlexNet convergieron a detectores de bordes y colores orientados sin que nadie se los programara. La demo aplica los clásicos a una foto real.`} />
            <div className="mb-6 overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-faint">
                    <th className="px-4 py-2.5 uppercase tracking-wider">kernel</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">matriz 3×3</th>
                    <th className="px-4 py-2.5 uppercase tracking-wider">efecto</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {[
                    ['Sobel-x', '[-1 0 1; -2 0 2; -1 0 1]', 'bordes verticales'],
                    ['Sobel-y', '[-1 -2 -1; 0 0 0; 1 2 1]', 'bordes horizontales'],
                    ['Laplaciano', '[0 -1 0; -1 4 -1; 0 -1 0]', 'bordes en todas direcciones'],
                    ['Desenfoque', '[1 1 1; 1 1 1; 1 1 1] / 9', 'suavizado gaussiano'],
                    ['Enfoque', '[0 -1 0; -1 5 -1; 0 -1 0]', 'realza detalle (identidad + laplaciano)'],
                  ].map(([k, m, e]) => (
                    <tr key={k} className="border-b border-line/50 last:border-0">
                      <td className="px-4 py-2 text-ink">{k}</td>
                      <td className="px-4 py-2 text-violet">{m}</td>
                      <td className="px-4 py-2 text-cyan">{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <FotoKernelsDemo />
          </section>

          {/* S4 · Arquitecturas */}
          <section id="arquitecturas">
            <SectionHead kicker="// 4.4 · 25 años en 5 hitos" title="Arquitecturas: la línea evolutiva" />
            <Prose content={String.raw`De 60 mil parámetros para leer cheques a redes de 152 capas que superan al humano en ImageNet. Cada salto resolvió un cuello de botella distinto: datos, cómputo, profundidad, y finalmente el propio gradiente.`} />
            <div className="-mx-4 overflow-x-auto px-4 pb-2">
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {ARCHS.map((a) => (
                  <div key={a.name} className="w-[260px] shrink-0 rounded-xl border border-line bg-panel p-5 transition-all hover:-translate-y-1 hover:border-violet/50">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-lg font-bold text-ink">{a.name}</span>
                      <span className="font-mono text-xs text-cyan">{a.year}</span>
                    </div>
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-faint">{a.author}</div>
                    {/* diagrama de capas estilizado */}
                    <div className="mb-3 flex h-16 items-end gap-1">
                      {a.stack.map((h, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${(h / 4) * 100}%`,
                            background: i % 2 === 0 ? 'linear-gradient(180deg, #8B5CF6, #8B5CF633)' : 'linear-gradient(180deg, #22D3EE, #22D3EE33)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="mb-2 flex gap-2 font-mono text-[10px]">
                      <span className="rounded border border-line bg-bg-0 px-1.5 py-0.5 text-muted">params: <span className="text-violet">{a.params}</span></span>
                      <span className="rounded border border-line bg-bg-0 px-1.5 py-0.5 text-muted">top-5: <span className="text-amber">{a.top5}</span></span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{a.idea}</p>
                  </div>
                ))}
              </div>
            </div>
            <FormulaBlock
              formula={String.raw`y = F(x) + x \qquad \Rightarrow \qquad \frac{\partial y}{\partial x} = F'(x) + 1`}
              caption="La conexión residual: por qué el gradiente fluye por el atajo"
              breakdown={[
                { symbol: 'F(x)', color: '#8B5CF6', explanation: 'lo que aprende la rama convolucional (el “residuo”)' },
                { symbol: '+ x', color: '#A3E635', explanation: 'el atajo: la entrada viaja intacta' },
                { symbol: "F'(x) + 1", color: '#FB7185', explanation: 'el +1 garantiza gradiente ≠ 0 por muy profunda que sea la red' },
              ]}
              className="mt-6"
            />
            <div className="mt-8">
              <ResnetDemo />
            </div>
          </section>

          {/* S5 · Campo receptivo */}
          <section id="receptivo">
            <SectionHead kicker="// 4.5 · cuánto ve cada neurona" title="Campo receptivo y augmentation" />
            <Prose content={String.raw`El **campo receptivo** de una neurona es la región de la imagen original que puede influir en su salida. Con una capa 3×3 ves 3×3 píxeles; con dos, 5×5; con tres, 7×7 — el RF crece linealmente con la profundidad (y mucho más rápido con stride).

Aquí está la cuenta que hizo famosa a VGG: tres capas 3×3 ven lo mismo que una 7×7, pero con 27 pesos en vez de 49 (por canal) y con tres no-linealidades en vez de una. Más expresividad, menos parámetros. Y cuando los datos escasean, la **data augmentation** — flips, crops, jitter de color — multiplica el dataset gratis enseñando invariancias al modelo.`} />
            <CampoReceptivoDemo />
          </section>

          {/* S6 · Ejercicios */}
          <section id="ejercicios">
            <SectionHead kicker="// 4.6 · demuestra lo aprendido" title="Ejercicios autocorregidos" />
            <Prose content={String.raw`Construirás la convolución con tus manos: primero 2D de un canal, luego pooling, el cálculo de dimensiones (con trampas de floor incluidas) y el jefe del nivel — una **capa convolucional multicanal completa** $(N, C_{in}, H, W) \rightarrow (N, C_{out}, H', W')$ verificada contra una referencia im2col.`} />
            <div className="space-y-6">
              {CNN_EXERCISES.map((ex) => (
                <ExerciseCard key={ex.id} exercise={getExercise(ex.id)!} />
              ))}
            </div>

            <h3 className="mb-4 mt-12 font-display text-xl font-semibold text-ink">
              Q1 · Chequeo conceptual
            </h3>
            <div className="space-y-4">
              <QuizCard
                quizId="cnn-quiz-1"
                xp={10}
                question="¿Por qué el weight sharing de la convolución ahorra tantos parámetros frente a una capa densa?"
                options={[
                  { text: 'Porque el kernel se aplica con stride, saltándose posiciones', correct: false, explanation: 'El stride reduce el tamaño del mapa, no el número de pesos. El ahorro viene de reutilizar el mismo kernel en todas las posiciones.' },
                  { text: String.raw`Porque un kernel $k\times k$ se reutiliza en todas las posiciones de la imagen`, correct: true, explanation: 'Exacto: 9 pesos para una 3×3 procesan una imagen de cualquier tamaño. Una capa densa necesitaría un peso por cada par (píxel de entrada, neurona).' },
                  { text: 'Porque el padding rellena con ceros y esos no cuentan', correct: false, explanation: 'El padding no tiene parámetros, pero tampoco es la fuente del ahorro: lo es compartir el kernel en todo el espacio.' },
                  { text: 'Porque los kernels son siempre 3×3', correct: false, explanation: 'El tamaño pequeño ayuda, pero la clave es el reuso espacial: los mismos pesos en cada posición.' },
                ]}
              />
              <QuizCard
                quizId="cnn-quiz-2"
                xp={10}
                question="¿Qué aporta principalmente el max-pooling?"
                options={[
                  { text: 'Aumenta la resolución del mapa de features', correct: false, explanation: 'Al contrario: la reduce (típicamente a la mitad). Lo que aporta es invariancia y menor coste.' },
                  { text: 'Invariancia local a pequeñas traslaciones y reducción de resolución', correct: true, explanation: 'Correcto: quedarse con el máximo hace que la respuesta sobreviva aunque el patrón se mueva un píxel, y el mapa más pequeño abarata y amplía el RF.' },
                  { text: 'Añade no-linealidad entre capas', correct: false, explanation: 'Aunque max es no lineal, su propósito no es ese: para eso están ReLU y compañía. Pooling resume espacialmente.' },
                  { text: 'Aprende qué regiones de la imagen son importantes', correct: false, explanation: 'Max-pool no tiene parámetros: no aprende nada. Es una operación fija de resumen.' },
                ]}
              />
              <QuizCard
                quizId="cnn-quiz-3"
                xp={10}
                question="¿Por qué tres capas 3×3 son preferibles a una sola capa 7×7?"
                options={[
                  { text: String.raw`Mismo campo receptivo (7×7) con menos parámetros (27 vs 49) y más no-linealidad`, correct: true, explanation: 'Exacto — la cuenta de VGG. Y con stride 1 el RF crece 2 píxeles por capa 3×3 apilada.' },
                  { text: 'Porque 3×3 es siempre más rápido en GPU', correct: false, explanation: 'La eficiencia en hardware ayuda, pero la razón conceptual es la relación parámetros/expresividad a igual campo receptivo.' },
                  { text: 'Porque una kernel 7×7 no puede aprender bordes', correct: false, explanation: 'Claro que puede; simplemente cuesta más parámetros y encadena menos transformaciones no lineales.' },
                  { text: 'Porque el campo receptivo de tres 3×3 es mayor que 7×7', correct: false, explanation: 'No: es exactamente 7×7 en ambos casos ($3 + 2 + 2 = 7$). La ventaja es de parámetros y no-linealidad, no de alcance.' },
                ]}
              />
              <QuizCard
                quizId="cnn-quiz-4"
                xp={10}
                question="¿Qué problema resuelve la conexión de atajo (skip) de ResNet?"
                options={[
                  { text: 'El overfitting en ImageNet', correct: false, explanation: 'El skip no es un regularizador: ResNet resolvió la degradación del ENTRENAMIENTO en redes muy profundas.' },
                  { text: 'La falta de datos de entrenamiento', correct: false, explanation: 'Los datos se atacan con augmentation o transfer learning. El skip ataca el flujo del gradiente.' },
                  { text: String.raw`El desvanecimiento del gradiente: $\partial y / \partial x = F'(x) + 1$ mantiene un camino directo`, correct: true, explanation: 'Correcto: el +1 en la derivada garantiza que el gradiente llegue a las primeras capas incluso con 100+ capas.' },
                  { text: 'El coste de memoria de las activaciones', correct: false, explanation: 'El skip apenas añade coste, pero su propósito no es la memoria: es hacer entrenable la profundidad extrema.' },
                ]}
              />
              <QuizCard
                quizId="cnn-quiz-5"
                xp={10}
                question="¿Para qué sirve la data augmentation?"
                options={[
                  { text: 'Para aumentar la resolución de las imágenes de entrada', correct: false, explanation: 'No cambia la resolución: genera variantes (flips, crops, jitter) de las imágenes existentes.' },
                  { text: 'Para acelerar la convergencia del optimizador', correct: false, explanation: 'La augmentation no acelera el optimizador; de hecho puede hacer el entrenamiento más largo. Su valor es estadístico.' },
                  { text: 'Regularización gratuita: enseña invariancias y multiplica los datos efectivos', correct: true, explanation: 'Exacto: cada época ve variantes nuevas, así que el modelo no puede memorizar y aprende que un gato girado sigue siendo un gato.' },
                  { text: 'Para equilibrar las clases del dataset', correct: false, explanation: 'Puede ayudar con el desbalance, pero ese no es su propósito principal: es enseñar invariancia a transformaciones.' },
                ]}
              />
            </div>
          </section>

          {/* S7 · Siguiente nivel */}
          <section>
            <Link
              to="/modulos/secuencias"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-violet/60 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            >
              <div>
                <div className="mb-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-violet">
                  // SIGUIENTE · NIVEL 5
                </div>
                <div className="font-display text-2xl font-bold text-ink">Secuencias: memoria y atención</div>
                <p className="mt-1 text-sm text-muted">
                  Las imágenes tienen espacio; el texto tiene tiempo. Embeddings, RNN, puertas LSTM y la primera mirada a la atención.
                </p>
              </div>
              <ArrowRight className="h-8 w-8 shrink-0 text-violet transition-transform group-hover:translate-x-2" aria-hidden />
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
