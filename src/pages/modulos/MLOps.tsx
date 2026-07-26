/**
 * Página · MLOps — /modulos/mlops (N10)
 * Del notebook a producción: ciclo de vida, cuantización int8, pruning,
 * destilación, ONNX y monitoring con PSI. Más ingeniería que matemáticas,
 * con las partes cuantitativas implementables en numpy.
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
import { MLOPS_EXERCISES } from '@/data/exercises/mlops'
import QuantDemo from '@/components/mlops/QuantDemo'
import DriftDemo from '@/components/mlops/DriftDemo'
import LatencyDemo from '@/components/mlops/LatencyDemo'

registerExercises(MLOPS_EXERCISES)

const SECTIONS = [
  { id: 'idea', label: '10.A La idea sin fórmulas' },
  { id: 'repaso', label: '10.B Repaso exprés' },
  { id: 'glosario', label: '10.C Glosario' },
  { id: 'ciclo', label: '10.1 Ciclo de vida del modelo' },
  { id: 'cuantizacion', label: '10.2 Cuantización' },
  { id: 'pruning', label: '10.3 Pruning y destilación' },
  { id: 'onnx', label: '10.4 ONNX y formatos' },
  { id: 'monitoring', label: '10.5 Monitoring y drift' },
  { id: 'ejercicios', label: '10.6 Ejercicios' },
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
        <div key={r.q} className="rounded-xl border border-line bg-panel px-5 py-4 transition-all hover:-translate-y-1 hover:border-cyan/50">
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

/** Tarjetas término → significado en una línea. */
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

const PIPELINE = [
  { fase: 'Entrenamiento', color: '#8B5CF6', detalle: 'Experimentos, semillas fijadas, tracking de métricas y artefactos versionados.' },
  { fase: 'Evaluación', color: '#22D3EE', detalle: 'No solo accuracy global: cortes por segmento, calibración y tests de regresión del modelo.' },
  { fase: 'Empaquetado', color: '#8B5CF6', detalle: 'Exportar el grafo (ONNX), cuantizar, podar. El modelo se convierte en artefacto inmutable.' },
  { fase: 'Serving', color: '#22D3EE', detalle: 'Batch (jobs nocturnos) u online (API con SLA de latencia). Aquí vive el P99.' },
  { fase: 'Monitorización', color: '#FBBF24', detalle: 'Latencia, errores, drift de datos y de concepto. Sin esto, el modelo envejece en silencio.' },
  { fase: 'Re-entrenamiento', color: '#A3E635', detalle: 'Triggers por drift o por calendario. El ciclo se cierra: producción alimenta al notebook.' },
]

export default function MLOps() {
  return (
    <>
      <ModuleHero
        level="N10"
        kicker="// NIVEL 10 · PRODUCCIÓN"
        title="MLOps: del notebook a producción"
        abstract="Entrenar el modelo es el 20% del trabajo. El otro 80% es servirlo rápido, barato y sin que se rompa cuando el mundo cambia: cuantización int8, pruning, destilación, ONNX, percentiles de latencia y detección de drift."
        meta={{ duration: '≈ 3 h', demos: 3, exercises: 5, xp: 490 }}
        art="/art-mlops.svg"
        color="#8B5CF6"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-16 md:px-6 md:py-20">
        <ChapterNav sections={SECTIONS} />

        <div className="min-w-0 max-w-[860px] flex-1 space-y-28">
          {/* S0a · La idea sin fórmulas */}
          <section id="idea">
            <SectionHead kicker="// 10.A · antes de empezar" title="La idea sin fórmulas" />
            <Prose content={String.raw`Llevas diez niveles entrenando modelos en un notebook. Ahí todo es cómodo: los datos caben en memoria, nadie espera respuesta y si falla algo vuelves a ejecutar la celda. Producción es otro planeta: tu modelo vive dentro de un servicio que recibe miles de peticiones por segundo, responde en milisegundos, comparte máquina con otros procesos y —esto es lo peor— **el mundo sigue moviéndose** después del entrenamiento. Los usuarios cambian de hábitos, llegan nuevos dispositivos, y la distribución que aprendió tu modelo se va quedando vieja.

Poner un modelo en producción es como pasar de cocinar en casa a montar un restaurante. La receta (el entrenamiento) es importante, pero el negocio se sostiene con logística: ingredientes que llegan a tiempo (pipelines de datos), platos que salen rápido aunque haya cola en la barra (latencia y percentiles), porciones consistentes (reproducibilidad) y alguien que se dé cuenta de que los clientes han dejado de pedir pescado (monitorización y drift).

En este módulo aprenderás el kit del oficio: cómo se sirve un modelo (batch vs online), cómo se le hace dieta para que corra en cualquier hardware (cuantización, pruning, destilación), cómo viaja entre frameworks (ONNX) y cómo se vigila su salud para re-entrenarlo antes de que muera en silencio. Es menos matemático que los anteriores, pero todo lo cuantitativo — cuantizar, podar, medir drift — lo implementarás tú en numpy.`} />
          </section>

          {/* S0b · Repaso exprés */}
          <section id="repaso">
            <SectionHead kicker="// 10.B · prerrequisitos en 1 minuto" title="Repaso exprés" />
            <Prose content={String.raw`Cuatro ideas de módulos anteriores que aquí se reutilizan tal cual. Pulsa el enlace si algo necesita repaso.`} />
            <Repaso items={[
              { q: '¿Qué es un peso / parámetro?', d: 'Un número ajustable del modelo. Podarlo, cuantizarlo o exportarlo es manipular esos números.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes Neuronales' },
              { q: '¿Recuerdas el softmax y los logits?', d: 'Los logits son la puntuación cruda de cada clase; el softmax los convierte en probabilidades. La destilación los usa con temperatura.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes Neuronales' },
              { q: '¿Qué es una distribución / histograma?', d: 'Cómo se reparten los valores de una variable. Comparar histogramas es la base de la detección de drift.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué era el MSE y la divergencia KL?', d: 'Errores medios para regresión y distancia entre distribuciones: las métricas de cuantización y destilación.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es el sobreajuste?', d: 'Memorizar el entrenamiento. En producción aparece su primo: funcionar bien con datos de ayer y mal con los de hoy.', to: '/modulos/ml-clasico', toLabel: 'repásalo en ML Clásico' },
            ]} />
          </section>

          {/* S0c · Glosario */}
          <section id="glosario">
            <SectionHead kicker="// 10.C · diccionario del módulo" title="Glosario" />
            <Prose content={String.raw`Los términos que sonarán en esta página (y en cualquier reunión de plataforma), traducidos en una línea.`} />
            <Glosario items={[
              [String.raw`\text{ONNX}`, 'Open Neural Network Exchange: formato abierto para exportar el grafo del modelo y ejecutarlo en cualquier runtime (edge, navegador, móvil)'],
              [String.raw`\text{int8}`, 'entero de 8 bits (−128…127): 4× menos memoria que float32 y aritmética mucho más rápida en CPU/NPU'],
              [String.raw`P99`, 'percentil 99: la latencia que solo supera el 1% más lento de las peticiones. Donde viven los usuarios furiosos'],
              [String.raw`\text{PSI}`, 'Population Stability Index: cuánto ha cambiado un histograma respecto a la referencia. ≥ 0.2 → alarma'],
              [String.raw`\text{drift}`, 'deriva: los datos de entrada (data drift) o la relación entrada→salida (concept drift) cambian con el tiempo'],
              [String.raw`\text{SLA}`, 'Service Level Agreement: contrato de servicio, p. ej. «P99 < 100 ms el 99.9% del tiempo»'],
              [String.raw`s,\; z`, 'scale y zero-point: los dos números que convierten floats en enteros (y viceversa) al cuantizar'],
              [String.raw`T`, 'temperatura: divide los logits antes del softmax; T alta suaviza la distribución del maestro'],
              [String.raw`\text{PTQ / QAT}`, 'cuantización post-entrenamiento (rápida, sin re-entrenar) vs entrenamiento consciente de la cuantización (más preciso)'],
              [String.raw`\mathrm{KL}(p \| q)`, 'divergencia de Kullback–Leibler: cuánto se equivoca q al imitar a p. Motor de la destilación'],
            ]} />
          </section>

          {/* S1 · Ciclo de vida */}
          <section id="ciclo">
            <SectionHead kicker="// 10.1 · la máquina completa" title="El ciclo de vida del modelo" />
            <Prose content={String.raw`Un modelo en producción no es un fichero \`.pkl\`: es un **ciclo** que gira mientras el producto exista. Entrenar es solo la primera fase; el resto es ingeniería de fiabilidad.`} />
            <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PIPELINE.map((p, i) => (
                <div key={p.fase} className="relative rounded-xl border border-line bg-panel px-5 py-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                      style={{ color: p.color, border: `1px solid ${p.color}66`, background: `${p.color}14` }}
                    >
                      {i + 1}
                    </span>
                    <span className="font-display text-sm font-semibold text-ink">{p.fase}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{p.detalle}</p>
                  {i < PIPELINE.length - 1 && (
                    <span className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-faint lg:block" aria-hidden>→</span>
                  )}
                </div>
              ))}
            </div>
            <Prose content={String.raw`**Batch vs online.** En *batch* procesas millones de filas de golpe, una vez al día: scoring de riesgo nocturno, recomendaciones precalculadas. Latencia irrelevante, throughput (filas/segundo) lo es todo. En *online* el modelo vive detrás de una API y responde en milisegundos: aquí la métrica que manda es la **latencia**, y no la media — los percentiles.

¿Por qué el P99 y no la media? Porque la media esconde la cola. Si tu servicio responde en 30 ms de media pero el 1% de las peticiones tarda 2 segundos, ese 1% son tus usuarios más activos — los que más peticiones hacen y, por tanto, los que más probabilidad tienen de caer en la cola. La cola no es ruido estadístico: es contención real (GC, colas de la cola de peticiones, un batch grande que ocupa la GPU). Un SLA serio se escribe sobre el P99: «el 99% de las respuestas, por debajo de 100 ms».`} />
            <Llano>
              La media de latencia miente porque promedia a todos los usuarios por igual; el P99 mira solo a los
              que peor lo pasan. Cuando subes la carga en esta demo, la media apenas se mueve pero la cola (P95, P99)
              se dispara — y eso es exactamente lo que rompe los SLA en la vida real.
            </Llano>
            <LatencyDemo />
          </section>

          {/* S2 · Cuantización */}
          <section id="cuantizacion">
            <SectionHead kicker="// 10.2 · dieta del modelo" title="Cuantización: de float32 a int8" />
            <Prose content={String.raw`Un float32 cuesta 4 bytes y una multiplicación en punto flotante cuesta varios ciclos. Un int8 cuesta 1 byte y las CPUs/NPUs tienen instrucciones enteras SIMD que hacen decenas de multiplicaciones por ciclo. La **cuantización** traduce cada tensor a enteros con solo dos parámetros: una escala $s$ (el tamaño del escalón) y un punto cero $z$ (qué entero representa al 0.0 real).`} />
            <Llano>
              Es cambiar de moneda: en vez de pagar con billetes de «float32» con decimales infinitos, pagas con
              monedas de tamaño fijo (s). El redondeo te cuesta como mucho media moneda por valor — ese es todo
              el error. A cambio, el modelo pesa 4× menos y corre varias veces más rápido.
            </Llano>
            <FormulaBlock
              formula={String.raw`x_q = \mathrm{clip}\!\left(\mathrm{round}\!\left(\frac{x}{s}\right) + z,\; q_{\min},\; q_{\max}\right) \qquad \hat{x} = s\,(x_q - z) \qquad s = \frac{x_{\max} - x_{\min}}{q_{\max} - q_{\min}} \qquad |\hat{x} - x| \le \frac{s}{2}`}
              caption="Cuantización affine a int8 (q_min = −128, q_max = 127) y su error acotado"
              breakdown={[
                { symbol: 'x_q', color: '#8B5CF6', explanation: 'el valor entero (int8) que se guarda y se multiplica en hardware' },
                { symbol: 's', color: '#22D3EE', explanation: 'scale: cuántos floats vale cada escalón entero' },
                { symbol: 'z', color: '#A3E635', explanation: 'zero-point: el entero que representa exactamente al 0.0 real (clave para que el padding y ReLU sigan siendo exactos)' },
                { symbol: '\\hat{x}', color: '#FB7185', explanation: 'el float reconstruido: nunca idéntico, pero a ≤ medio escalón de distancia' },
              ]}
              className="mb-6"
            />
            <Prose content={String.raw`El error máximo es $s/2$ por valor — acotado, predecible y, en la práctica, casi invisible para la accuracy si eliges bien los rangos. ¿Y la multiplicación de matrices? Se cuantizan pesos y activaciones (simétrico, $z=0$), se acumulan productos int8 en acumuladores **int32** (si no, desbordan) y al final se multiplica por $s_A \cdot s_B$. Es literalmente lo que hace un TPU.

**PTQ vs QAT.** Con *post-training quantization* (PTQ) cuantizas el modelo ya entrenado calibrando rangos con unos cientos de ejemplos: gratis y casi siempre suficiente a int8. Si bajas a 4 bits o el modelo es sensible, toca *quantization-aware training* (QAT): se simula la cuantización durante el entrenamiento (fake-quant) para que los pesos aprendan a vivir con el redondeo. Más caro, pero recupera la precisión perdida.`} />
            <QuantDemo />
          </section>

          {/* S3 · Pruning y destilación */}
          <section id="pruning">
            <SectionHead kicker="// 10.3 · adelgazar con criterio" title="Pruning y destilación" />
            <Prose content={String.raw`**Magnitude pruning.** En una red entrenada, gran parte de los pesos son casi cero y apenas influyen en la salida. La poda por magnitud los pone exactamente a cero (el percentil marca el umbral), y un breve *fine-tune* — manteniendo la máscara — deja que los supervivientes compensen. Resultado típico: 80–90% de pesos a cero con pérdida mínima de accuracy. Ojo: para que el ahorro sea real necesitas kernels dispersos (formatos CSR/ sparse en el runtime); si no, solo has ganado la capacidad de comprimir mejor el artefacto.

**Destilación.** Otra vía: entrena un modelo pequeño (alumno) para imitar a uno grande (maestro). El truco de Hinton et al. (2015) es no imitar la etiqueta dura («es un 7»), sino la distribución completa del maestro suavizada con temperatura $T$ — «esto es un 7, pero se parece un poco a un 1 y casi nada a un 8». Esa sombra entre clases, invisible en las etiquetas, es el **conocimiento oscuro**: le dice al alumno qué errores son razonables.`} />
            <Llano>
              La temperatura es un mando de «difuminado»: T=1 da la distribución normal del maestro (casi toda la
              probabilidad en la clase ganadora); T alta la suaviza y deja ver cuánto se parecen las clases entre
              sí. El alumno aprende copiando esa foto difuminada, y el factor T² simplemente reescala la pérdida
              para que el gradiente no se achique al difuminar.
            </Llano>
            <FormulaBlock
              formula={String.raw`p_i(T) = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}} \qquad\qquad \mathcal{L}_{\text{dest}} = T^2 \cdot \mathrm{KL}\!\left(p^{\text{maestro}}(T) \,\|\, p^{\text{alumno}}(T)\right)`}
              caption="Soft targets con temperatura y pérdida de destilación"
              breakdown={[
                { symbol: 'z_i', color: '#22D3EE', explanation: 'logit (puntuación cruda) de la clase i' },
                { symbol: 'T', color: '#FBBF24', explanation: 'temperatura: T > 1 suaviza la distribución y revela las similitudes entre clases' },
                { symbol: 'p(T)', color: '#8B5CF6', explanation: 'probabilidades suavizadas: los "soft targets" que el alumno copia' },
                { symbol: 'T^2', color: '#A3E635', explanation: 'factor de escala: compensa que los gradientes se reducen ~1/T² al suavizar' },
              ]}
            />
          </section>

          {/* S4 · ONNX */}
          <section id="onnx">
            <SectionHead kicker="// 10.4 · el modelo viaja" title="ONNX y formatos de intercambio" />
            <Prose content={String.raw`Entrenas en PyTorch, pero el móvil del usuario no tiene PyTorch; el navegador tampoco; y el edge device de la fábrica, menos. **ONNX** (Open Neural Network Exchange) resuelve el viaje: exportas el grafo de computación — operaciones, tensores, formas — a un formato abierto, y un runtime (ONNX Runtime, TensorRT, OpenVINO) lo ejecuta en casi cualquier hardware.

Exportar no es solo «guardar»: el exporter **congela el grafo** y el runtime aplica *graph optimizations* — fusiona operaciones (conv + batch-norm + ReLU en un solo kernel), elimina nodos muertos, dobla constantes en tiempo de compilación (constant folding) y reescribe el grafo para el hardware concreto. Por eso el mismo modelo puede correr 2–5× más rápido tras exportarlo bien que en eager mode.

Y sí: **esta misma web es un caso de inferencia en el borde** — los ejercicios que corregirás abajo ejecutan Python real con numpy en tu navegador gracias a Pyodide (CPython compilado a WebAssembly). ONNX Runtime Web sigue la misma filosofía: el modelo viaja al usuario en vez de los datos viajar al servidor. Cero latencia de red, privacidad por diseño y coste de servidor ≈ 0. La contrapartida: el artefacto debe ser pequeño (¿te suenan la cuantización y el pruning?).`} />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { t: 'Constant folding', d: 'Lo que se puede calcular sin la entrada se calcula al exportar, no en cada inferencia.' },
                { t: 'Fusión de ops', d: 'Conv + BatchNorm + ReLU → un único kernel: menos memoria intermedia, menos lanzamientos.' },
                { t: 'Eliminación de grafo muerto', d: 'Ramas de entrenamiento (dropout, pérdidas auxiliares) que no alcanzan la salida: fuera.' },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-line bg-panel px-4 py-3">
                  <div className="mb-1 font-mono text-xs font-bold text-cyan">{c.t}</div>
                  <p className="text-xs leading-relaxed text-muted">{c.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* S5 · Monitoring y drift */}
          <section id="monitoring">
            <SectionHead kicker="// 10.5 · la salud del modelo" title="Monitoring y drift" />
            <Prose content={String.raw`Un modelo desplegado se degrada en silencio: no lanza excepciones, simplemente acierta menos. Hay dos enemigos distintos. **Data drift**: cambia la entrada ($P(X)$) — los usuarios de diciembre compran distinto que los de junio. **Concept drift**: cambia la relación entrada→salida ($P(y|X)$) — lo que antes era fraude ahora es comportamiento normal. El primero lo detectas mirando solo las entradas (no necesitas etiquetas); el segundo exige comparar predicciones con realidad, casi siempre con retraso.

La herramienta básica para data drift es comparar histogramas: referencia (entrenamiento) contra ventana actual. El **PSI** resume esa comparación en un número; el **test KS** (Kolmogorov–Smirnov) hace lo propio con las CDFs para variables continuas. Con PSI ≥ 0.2 la convención de la industria es clara: alerta, investiga y probablemente re-entrena.`} />
            <Llano>
              Divide el rango de la variable en cajones (bins) y apunta qué fracción de ejemplos caía en cada cajón
              cuando entrenaste (e) y qué fracción cae ahora (a). El PSI castiga cada cajón que se ha movido, en
              proporción al cambio relativo: pocos cajones muy movidos ya encienden la alarma.
            </Llano>
            <FormulaBlock
              formula={String.raw`\mathrm{PSI} = \sum_{i=1}^{B} (a_i - e_i)\,\ln\frac{a_i}{e_i} \qquad\qquad \mathrm{PSI} < 0.1 \;\text{estable}, \quad 0.1\text{–}0.2 \;\text{vigilar}, \quad \ge 0.2 \;\text{re-entrenar}`}
              caption="Population Stability Index y umbrales de alerta habituales"
              breakdown={[
                { symbol: 'e_i', color: '#22D3EE', explanation: 'proporción esperada en el bin i (histograma de referencia, entrenamiento)' },
                { symbol: 'a_i', color: '#8B5CF6', explanation: 'proporción actual en el bin i (ventana de producción)' },
                { symbol: '(a_i - e_i)\\ln\\frac{a_i}{e_i}', color: '#FB7185', explanation: 'contribución del bin: positiva tanto si crece como si se encoge; el log la hace relativa' },
              ]}
              className="mb-6"
            />
            <DriftDemo />
            <Prose content={String.raw`**Retraining triggers.** No re-entrenes «cuando alguien se acuerde»: define disparadores — PSI o KS por encima de umbral en features críticas, métrica de negocio cayendo, o calendario (cada N semanas con datos frescos). Y cierra el círculo con **reproducibilidad**: semilla fijada, datos versionados (DVC/lakehouse), código versionado (git) y modelo versionado con su linaje (qué datos + qué commit + qué hiperparámetros → qué artefacto). Sin experiment tracking, «el modelo de marzo que funcionaba» es irreproducible y, por tanto, inmantenible.`} />
          </section>

          {/* S6 · Ejercicios */}
          <section id="ejercicios">
            <SectionHead kicker="// 10.6 · demuestra lo aprendido" title="Ejercicios autocorregidos" />
            <Prose content={String.raw`Aquí se acaba la teoría: implementarás la cuantización affine completa, una **matmul int8 con acumulación int32** como la de un acelerador real, poda por magnitud con fine-tune, la pérdida de destilación con temperatura y un detector de drift por PSI con umbrales de producción. El jefe del nivel es la matmul cuantizada: 120 XP si tu error relativo queda por debajo del 2%.`} />
            <div className="space-y-6">
              {MLOPS_EXERCISES.map((ex) => (
                <ExerciseCard key={ex.id} exercise={getExercise(ex.id)!} />
              ))}
            </div>

            <h3 className="mb-4 mt-12 font-display text-xl font-semibold text-ink">
              Q1 · Chequeo conceptual
            </h3>
            <div className="space-y-4">
              <QuizCard
                quizId="mlops-quiz-1"
                xp={10}
                question="Tu API tiene latencia media de 30 ms pero P99 de 900 ms. ¿Qué está pasando?"
                options={[
                  { text: 'El 1% más lento de las peticiones espera casi un segundo: la media esconde la cola', correct: true, explanation: 'Exacto. La media promedia a todos por igual; el P99 revela contención real (colas, GC, batches). Los SLA serios se escriben sobre percentiles.' },
                  { text: 'El 99% de las peticiones tarda 900 ms', correct: false, explanation: 'Al revés: el 99% tarda MENOS de 900 ms. El P99 es el límite superior de casi todas, no lo típico.' },
                  { text: 'El servidor está roto y hay que reiniciarlo', correct: false, explanation: 'No necesariamente: la cola gorda bajo carga es un fenómeno estadístico-estructural normal. Se ataca con más capacidad, timeouts y colas bien dimensionadas.' },
                  { text: 'Hay que promediar mejor las métricas', correct: false, explanation: 'Promediar más no arregla nada: precisamente el problema es mirar la media en vez de los percentiles.' },
                ]}
              />
              <QuizCard
                quizId="mlops-quiz-2"
                xp={10}
                question={String.raw`¿Por qué un modelo cuantizado a int8 corre más rápido que en float32?`}
                options={[
                  { text: 'Porque int8 tiene menos valores posibles y el modelo se vuelve más simple', correct: false, explanation: 'La red tiene la misma arquitectura y operaciones. La velocidad viene del hardware y la memoria, no de simplificar el grafo.' },
                  { text: String.raw`4× menos bytes por peso (mejor uso de caché/ancho de banda) y multiplicaciones enteras SIMD mucho más rápidas`, correct: true, explanation: 'Correcto: la inferencia suele estar limitada por memoria, e int8 mueve 4× menos datos; además las instrucciones enteras vectorizadas procesan más elementos por ciclo.' },
                  { text: 'Porque se eliminan los pesos negativos', correct: false, explanation: 'int8 con signo (−128…127) representa negativos perfectamente. Eso sería pruning, que es otra técnica.' },
                  { text: 'Porque el error de redondeo actúa como regularización y acelera la convergencia', correct: false, explanation: 'La cuantización se aplica en inferencia: no hay convergencia que acelerar. El ruido de redondeo es un coste, no una ventaja de velocidad.' },
                ]}
              />
              <QuizCard
                quizId="mlops-quiz-3"
                xp={10}
                question={String.raw`En destilación, ¿qué aporta usar $p(T)$ con $T$ alta en vez de las etiquetas duras?`}
                options={[
                  { text: 'Acelera el entrenamiento del alumno al tener menos clases activas', correct: false, explanation: 'T alta activa MÁS clases (distribución más uniforme), no menos. Y su valor no es la velocidad.' },
                  { text: 'Evita el overfitting del alumno al suavizar la pérdida', correct: false, explanation: 'Aunque puede regularizar algo, no es la idea central: la clave es la información extra entre clases.' },
                  { text: 'Revela las similitudes entre clases («un 7 se parece a un 1») que la etiqueta dura esconde', correct: true, explanation: 'Exacto: el dark knowledge. Con T alta, la sombra de probabilidad sobre clases incorrectas le enseña al alumno la geometría del problema.' },
                  { text: 'Hace que el alumno copie exactamente los pesos del maestro', correct: false, explanation: 'El alumno nunca ve los pesos del maestro: solo sus salidas (logits). Arquitecturas completamente distintas pueden destilarse.' },
                ]}
              />
              <QuizCard
                quizId="mlops-quiz-4"
                xp={10}
                question="El PSI de tu feature más importante sube de 0.05 a 0.3 en dos semanas. ¿Qué toca?"
                options={[
                  { text: 'Nada: PSI solo importa si supera 1.0', correct: false, explanation: 'La convención es 0.1 vigilar, 0.2 actuar. Con 0.3 la distribución cambió de verdad.' },
                  { text: 'Data drift severo: investigar la causa y disparar re-entrenamiento con datos recientes', correct: true, explanation: 'Correcto: PSI ≥ 0.2 es el umbral clásico de alarma. El modelo ya ve un mundo distinto al de su entrenamiento.' },
                  { text: 'Concept drift: la relación entrada→salida cambió', correct: false, explanation: 'El PSI solo mira las entradas (P(X)): detecta data drift. El concept drift requiere comparar predicciones con etiquetas reales.' },
                  { text: 'Reiniciar el servicio para que se recalibren los histogramas', correct: false, explanation: 'El histograma de referencia es el de entrenamiento, no se «recalibra» reiniciando. El cambio es real y está en los datos.' },
                ]}
              />
            </div>
          </section>

          {/* S7 · Siguiente */}
          <section>
            <Link
              to="/laboratorio"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-8 transition-all hover:-translate-y-1 hover:border-violet/60 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)]"
            >
              <div>
                <div className="mb-2 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-violet">
                  // SIGUIENTE · LABORATORIO
                </div>
                <div className="font-display text-2xl font-bold text-ink">El Boss Final te espera</div>
                <p className="mt-1 text-sm text-muted">
                  Llevas el modelo a producción. Ahora demuestra todo el camino — de la regresión lineal al MLOps — en el examen capstone del laboratorio.
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
