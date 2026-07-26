/**
 * Página /modulos/generativos — N6 · Modelos Generativos.
 * VAE (reparametrización + ELBO), el duelo minimax de las GAN, difusión y
 * ética. Cierra con ejercicios autocorregidos y el CTA al Boss Final.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldAlert, Scale, Copyright, Leaf } from 'lucide-react'
import { InlineMath } from 'react-katex'
import ChapterNav from '@/components/ChapterNav'
import ModuleHero from '@/components/ModuleHero'
import FormulaBlock from '@/components/FormulaBlock'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import { TeX } from '@/lib/katex-content'
import { getExercise } from '@/lib/exercises'
import LatenteIntroDemo from '@/components/generativos/LatenteIntroDemo'
import VAEExplorerDemo from '@/components/generativos/VAEExplorerDemo'
import GANDuelDemo from '@/components/generativos/GANDuelDemo'
import DiffusionDemo from '@/components/generativos/DiffusionDemo'
import '@/data/exercises/generativos'

const SECTIONS = [
  { id: 'idea', label: 'A · La idea sin fórmulas' },
  { id: 'repaso', label: 'B · Repaso exprés' },
  { id: 'glosario', label: 'C · Glosario de símbolos' },
  { id: 'problema', label: '1 · El problema generativo' },
  { id: 'vae', label: '2 · VAE' },
  { id: 'gan', label: '3 · GAN: el juego minimax' },
  { id: 'difusion', label: '4 · Difusión' },
  { id: 'etica', label: '5 · Ética y límites' },
  { id: 'ejercicios', label: '6 · Ejercicios' },
  { id: 'boss', label: '7 · Boss Final' },
]

const COLOR = '#FBBF24'

function Kicker({ children }: { children: string }) {
  return (
    <span
      className="mb-4 inline-block rounded-full border px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em]"
      style={{ color: COLOR, borderColor: `${COLOR}44`, background: `${COLOR}11` }}
    >
      {children}
    </span>
  )
}

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line py-16 last:border-b-0 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <Kicker>{kicker}</Kicker>
        <h2 className="mb-6 font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-ink">
          {title}
        </h2>
        {children}
      </motion.div>
    </section>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[720px] space-y-4 text-base leading-[1.75] text-muted">{children}</div>
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

const ETHICS = [
  {
    icon: ShieldAlert,
    title: 'Deepfakes y desinformación',
    body: 'La misma tecnología que restaura películas o da voz a quien la perdió también fabrica vídeos falsos de personas reales. El coste de producir una mentira verosímil tiende a cero, y la verificación se convierte en un problema social, no solo técnico.',
    question: '¿Debería todo contenido generado llevar una marca de agua obligatoria?',
  },
  {
    icon: Scale,
    title: 'Sesgo en los datos de generación',
    body: 'Un modelo generativo aprende p(x): si el mundo que le muestras está sesgado, generará ese sesgo amplificado. Los datasets de caras, voces o textos sobrerrepresentan a unos grupos e invisibilizan a otros, y el modelo lo aprende con fidelidad matemática.',
    question: '¿Quién decide qué distribución “debería” aprender un modelo generativo?',
  },
  {
    icon: Copyright,
    title: 'Derechos de autor y datos de entrenamiento',
    body: 'Millones de imágenes, canciones y textos con copyright alimentan los modelos sin consentimiento explícito de sus autores. ¿Es el entrenamiento “uso legítimo” o apropiación? Los tribunales de medio mundo lo están decidiendo ahora mismo.',
    question: '¿Deberían los artistas poder vetar (o cobrar por) el uso de su obra en el entrenamiento?',
  },
  {
    icon: Leaf,
    title: 'Huella energética',
    body: 'Entrenar un gran modelo de difusión consume la electricidad de cientos de hogares durante un año, y cada imagen generada suma. La eficiencia — distilación, menos pasos de muestreo, hardware mejor — es hoy una línea de investigación tan importante como la calidad.',
    question: '¿Cuánta energía “merece” generar una imagen? ¿Quién paga esa factura?',
  },
]

export default function Generativos() {
  const exercises = [
    'generativos-reparam',
    'generativos-kl-normal',
    'generativos-gan-losses',
    'generativos-gan-step',
    'generativos-difusion-forward',
  ]
    .map((id) => getExercise(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))

  return (
    <div>
      <ModuleHero
        level="N6"
        kicker="// NIVEL 6 · CREAR EN LUGAR DE CLASIFICAR"
        title="Modelos generativos: máquinas que imaginan"
        abstract="Hasta ahora, tus modelos discriminaban. Ahora generan: caras que no existen, imágenes a partir de ruido puro. VAEs, el duelo adversario de las GAN y la difusión que alimenta a DALL·E y Stable Diffusion."
        meta={{ duration: '≈ 4 h', demos: 5, exercises: 6, xp: 560 }}
        art="/art-generativos.png"
        color={COLOR}
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 md:px-6">
        <ChapterNav sections={SECTIONS} className="pt-10" />

        <div className="min-w-0 flex-1">
          {/* ---------------- S0a · La idea sin fórmulas ---------------- */}
          <Section id="idea" kicker="// A · ANTES DE EMPEZAR" title="La idea sin fórmulas">
            <Prose>
              <p>
                Hasta ahora tus modelos respondían preguntas («¿esto es un gato o un perro?»). Este módulo es
                al revés: <strong className="text-ink">fabricar datos nuevos que parecen reales</strong> — caras
                de personas que no existen, imágenes a partir de una frase. El truco de partida es
                sorprendentemente simple: saca unos números al azar de la campana de Gauss (como tirar dados) y
                aprende una función — una red neuronal como las que ya conoces — que los transforma poco a poco
                hasta que parecen un dato auténtico.
              </p>
              <p>
                Las tres familias del módulo son tres recetas para aprender esa transformación. El{' '}
                <strong className="text-ink">VAE</strong> comprime cada dato a un «código» corto y aprende a
                reconstruirlo, obligando a que los códigos ocupen un espacio ordenado y continuo: así puedes
                moverte por ese espacio e ir morfando una cosa en otra. La{' '}
                <strong className="text-ink">GAN</strong> convierte el aprendizaje en un duelo: un{' '}
                <strong className="text-ink">falsificador</strong> que hace billetes falsos y un{' '}
                <strong className="text-ink">detective</strong> que intenta pillarle; cada uno mejora para
                vencer al otro, hasta que los billetes falsos son indistinguibles. Y la{' '}
                <strong className="text-ink">difusión</strong> — la tecnología detrás de DALL·E o Stable
                Diffusion — hace algo aún más raro y más elegante: ensucia fotos con ruido paso a paso hasta
                dejar solo estática, y luego aprende el camino de vuelta: quitar el ruido un poquito cada vez.
                Generar es empezar en estática pura y limpiar.
              </p>
              <p>
                Todo lo demás del módulo — latentes, ELBO, minimax, schedules de ruido — son los detalles
                técnicos de estas tres recetas, más una pausa necesaria para hablar de lo que significa
                fabricar realidad falsa.
              </p>
            </Prose>
          </Section>

          {/* ---------------- S0b · Repaso exprés ---------------- */}
          <Section id="repaso" kicker="// B · PRERREQUISITOS EN 1 MINUTO" title="Repaso exprés">
            <Prose>
              <p>
                Las ideas de probabilidad que usa este módulo, en una frase cada una. Pulsa el enlace si algo
                necesita repaso.
              </p>
            </Prose>
            <Repaso items={[
              { q: '¿Qué es la campana de Gauss (normal)?', d: 'La forma típica del azar: casi todo cae cerca del centro y las colas se desvanecen. De ahí salen los números de partida.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué son media (μ) y desviación (σ)?', d: 'El centro de la campana y su anchura: dónde se concentra el azar y cuánto se dispersa.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es una probabilidad p(x)?', d: 'Un número entre 0 y 1 que dice cuán esperable es cada dato. «Aprender la distribución» es aprender ese mapa completo.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Qué es una esperanza 𝔼?', d: 'El promedio de algo sobre muchos casos. Como la media de tirar un dado muchísimas veces.', to: '/modulos/fundamentos', toLabel: 'repásalo en Fundamentos' },
              { q: '¿Recuerdas qué es un encoder/decoder?', d: 'Dos redes encadenadas: una comprime el dato a un código y otra lo reconstruye. Son las mismas capas que ya conoces.', to: '/modulos/redes-neuronales', toLabel: 'repásalo en Redes Neuronales' },
              { q: '¿Y las convoluciones?', d: 'Los generadores de imágenes usan capas convolucionales por dentro: las lupas del módulo anterior.', to: '/modulos/cnn', toLabel: 'repásalo en CNN' },
            ]} />
          </Section>

          {/* ---------------- S0c · Glosario ---------------- */}
          <Section id="glosario" kicker="// C · DICCIONARIO DEL MÓDULO" title="Glosario de símbolos">
            <Prose>
              <p>Los símbolos que aparecerán en esta página, traducidos en una línea.</p>
            </Prose>
            <Glosario items={[
              [String.raw`z`, 'el código o semilla aleatoria: los números de los que parte toda la generación'],
              [String.raw`\mathcal{N}(0, I)`, 'la campana de Gauss estándar: «tira los dados» en forma matemática'],
              [String.raw`\mu`, 'mu: el centro de una campana de Gauss'],
              [String.raw`\sigma`, 'sigma: la anchura de la campana; también la sigmoide, según el contexto'],
              [String.raw`\varepsilon`, 'épsilon: el azar puro que se inyecta; sale de tirar los dados, no de la red'],
              [String.raw`\mathbb{E}[\cdot]`, 'esperanza: el promedio sobre muchísimos casos'],
              [String.raw`D_{KL}`, 'distancia KL: cuánto se diferencian dos distribuciones; la «multa» por desordenar el latente'],
              [String.raw`G`, 'el generador: el falsificador que fabrica datos a partir de ruido'],
              [String.raw`D`, 'el discriminador: el detective que puntúa si un dato es real o falso'],
              [String.raw`\min_G \max_D`, '«G intenta empeorar lo que D intenta mejorar»: el tira y afloja del duelo'],
              [String.raw`\beta_t`, 'cuánta suciedad (ruido) se añade en el paso t de la difusión'],
              [String.raw`\log`, 'logaritmo: convierte multiplicaciones de probabilidades en sumas manejables'],
            ]} />
          </Section>

          {/* ---------------- S1 · El problema generativo ---------------- */}
          <Section id="problema" kicker="// 01 · DISCRIMINAR VS GENERAR" title="El problema generativo">
            <Prose>
              <p>
                Todo lo que has hecho hasta ahora era <strong className="text-ink">discriminativo</strong>:
                aprender <TeX content="$p(y \\mid x)$" /> — dada una imagen, ¿gato o perro? El modelo dibuja
                fronteras entre clases y nada más. Un modelo <strong className="text-ink">generativo</strong>{' '}
                aprende algo mucho más ambicioso: <TeX content="$p(x)$" />, la distribución completa de los
                datos. Si la dominas, puedes <em>muestrear</em> de ella y crear datos nuevos que nunca existieron.
              </p>
              <p>
                ¿Por qué es tan difícil? Una imagen de <TeX content="$256 \\times 256$" /> vive en un espacio de
                ~200.000 dimensiones, y las imágenes “naturales” ocupan un rincón minúsculo y con estructura
                complicada. Aprender <TeX content="$p(x)$" /> directamente ahí es imposible. La idea que cambia
                todo: <strong className="text-ink">las variables latentes</strong>. Empieza con una distribución
                trivial, <TeX content="$z \\sim \\mathcal{N}(0, I)$" />, y aprende una función (el{' '}
                <em>decoder</em>) que la deforma hasta la distribución compleja:
              </p>
            </Prose>
            <Llano>
              Generar un dato nuevo es una receta de dos pasos: tira los dados (saca números al azar de la
              campana de Gauss) y pásalos por una función aprendida que los «deforma» hasta que parecen un
              dato real. La fórmula dice exactamente eso: azar → función → algo indistinguible de los datos.
            </Llano>
            <div className="my-8">
              <FormulaBlock
                formula="z \sim \mathcal{N}(0, I) \;\xrightarrow{\;D_\theta\;}\; x = D_\theta(z) \sim p_{\text{datos}}(x)"
                caption="El truco fundacional: muestrear de algo simple y empujar (push-forward) hacia algo complejo"
                breakdown={[
                  { symbol: 'z \\sim \\mathcal{N}(0, I)', color: '#8B5CF6', explanation: 'ruido gaussiano: fácil de muestrear, sin estructura' },
                  { symbol: 'D_\\theta', color: '#22D3EE', explanation: 'el decoder: una red que deforma el espacio z hasta el espacio de datos' },
                  { symbol: 'p_{\\text{datos}}(x)', color: '#FBBF24', explanation: 'la distribución real (caras, voces, texto…) que queremos imitar' },
                ]}
              />
            </div>
            <Prose>
              <p>
                VAEs, GANs y difusión son tres maneras distintas de aprender esa deformación. En la demo puedes
                sentir el mecanismo con las manos: arrastra puntos de la nube gaussiana y mira cómo el decoder
                los convierte en una distribución de “dos lunas”.
              </p>
            </Prose>
            <div className="mt-8">
              <LatenteIntroDemo />
            </div>
          </Section>

          {/* ---------------- S2 · VAE ---------------- */}
          <Section id="vae" kicker="// 02 · AUTOENCODERS PROBABILÍSTICOS" title="VAE: el autoencoder variacional">
            <Prose>
              <p>
                Un autoencoder clásico comprime <TeX content="$x$" /> a un código <TeX content="$z$" /> y lo
                reconstruye. Problema: su espacio latente es un caos de “agujeros” — si muestreas un{' '}
                <TeX content="$z$" /> al azar, el decoder produce basura. El <strong className="text-ink">VAE</strong>{' '}
                lo arregla haciendo el encoder probabilístico: en vez de un punto, devuelve una gaussiana{' '}
                <TeX content="$\\mu(x), \\sigma(x)$" />, y obliga a esas gaussianas a solaparse ordenadamente
                cerca del origen.
              </p>
              <p>
                Pero muestrear <TeX content="$z \\sim \\mathcal{N}(\\mu, \\sigma^2)$" /> es una operación
                aleatoria: <strong className="text-ink">no es diferenciable</strong> y el gradiente no puede
                atravesarla. La solución es el truco de la reparametrización:
              </p>
            </Prose>
            <Llano>
              Meter azar en medio de la red bloquea el aprendizaje, porque la culpa del error no puede
              atravesar una tirada de dados. El truco: genera el azar fuera (ε) y mézclalo con una fórmula
              normal y corriente — multiplicar y sumar — que sí deja pasar las instrucciones de mejora hasta
              las perillas μ y σ.
            </Llano>
            <div className="my-8">
              <FormulaBlock
                formula="z = \mu + \sigma \odot \varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I)"
                caption="El muestreo se externaliza a ε: μ y σ reciben gradiente limpio"
                breakdown={[
                  { symbol: '\\mu, \\sigma', color: '#8B5CF6', explanation: 'salidas del encoder: parámetros del posterior, sí reciben gradiente' },
                  { symbol: '\\varepsilon', color: '#22D3EE', explanation: 'el azar, sacado fuera del grafo: no necesita gradiente' },
                  { symbol: 'z', color: '#FBBF24', explanation: 'la muestra, ahora una función determinista y diferenciable de μ y σ' },
                ]}
              />
            </div>
            <Prose>
              <p>
                ¿Y qué función de pérdida entrena todo esto? El <strong className="text-ink">ELBO</strong>, una
                suma de dos términos en tensión permanente:
              </p>
            </Prose>
            <Llano>
              El objetivo del VAE es un equilibrio entre dos deseos: reconstruir bien el dato original y, al
              mismo tiempo, mantener los códigos ordenados y juntitos cerca del centro para que el espacio sea
              navegable. La fórmula pone ambos en la misma balanza: si gana uno, sufre el otro.
            </Llano>
            <div className="my-8">
              <FormulaBlock
                formula="\mathcal{L} = \underbrace{\mathbb{E}_q[\log p(x \mid z)]}_{\text{reconstrucción}} \;-\; \underbrace{D_{KL}\left(q(z \mid x) \,\|\, p(z)\right)}_{\text{regularizador}}"
                caption="Reconstruir bien vs. mantener el latente ordenado cerca del prior"
                breakdown={[
                  { symbol: '\\mathbb{E}_q[\\log p(x \\mid z)]', color: '#22D3EE', explanation: 'término de reconstrucción: que el decoder recupere x a partir de z' },
                  { symbol: 'D_{KL}(q \\,\\|\\, p)', color: '#FB7185', explanation: 'cuánto se aleja el posterior q(z|x) del prior N(0,I): la “multa” por desordenar el latente' },
                  { symbol: 'q(z \\mid x)', color: '#8B5CF6', explanation: 'el posterior aprendido por el encoder: una gaussiana por cada dato' },
                ]}
              />
            </div>
            <Prose>
              <p>
                El equilibrio es delicado: si el término KL pesa demasiado poco, el encoder separa los
                posteriores tanto que el latente deja de ser navegable; si pesa demasiado, llega el{' '}
                <em>posterior collapse</em> — todas las gaussianas se apilan sobre el prior y el decoder
                acaba ignorando z. En el explorador de abajo puedes recorrer una rejilla latente 2D y ver la forma
                decodificada morfar en vivo — y romper el equilibrio con el toggle.
              </p>
            </Prose>
            <div className="mt-8">
              <VAEExplorerDemo />
            </div>
          </Section>

          {/* ---------------- S3 · GAN ---------------- */}
          <Section id="gan" kicker="// 03 · EL DUELO ADVERSARIO" title="GAN: el juego minimax">
            <Prose>
              <p>
                Las GAN plantean el aprendizaje como un juego de dos jugadores. El{' '}
                <strong className="text-ink">generador</strong> <TeX content="$G$" /> es un falsificador:
                convierte ruido <TeX content="$z$" /> en datos falsos. El{' '}
                <strong className="text-ink">discriminador</strong> <TeX content="$D$" /> es el detective:
                estima la probabilidad de que una muestra sea real. Cada uno mejora intentando vencer al otro:
              </p>
            </Prose>
            <Llano>
              Todo el duelo en una sola puntuación: el detective intenta subirla (decir «real» a los datos
              auténticos y «falso» a los fabricados) y el falsificador intenta bajarla (que sus piezas cuelen
              como reales). Entrenar es alternar turnos: mueve D un paso, mueve G un paso, y repite.
            </Llano>
            <div className="my-8">
              <FormulaBlock
                formula="\min_G \max_D \; V(D, G) = \mathbb{E}_{x}[\log D(x)] + \mathbb{E}_{z}[\log\!\left(1 - D(G(z))\right)]"
                caption="El falsificador contra el detective, en una sola ecuación"
                breakdown={[
                  { symbol: '\\mathbb{E}_{x}[\\log D(x)]', color: '#22D3EE', explanation: 'D quiere decir “real” (score → 1) a los datos auténticos' },
                  { symbol: '\\log(1 - D(G(z)))', color: '#FB7185', explanation: 'D quiere decir “falso” (score → 0) a las falsificaciones; G quiere lo contrario' },
                  { symbol: '\\min_G \\max_D', color: '#FBBF24', explanation: 'D maximiza su acierto; G minimiza el mismo valor: un tira y afloja' },
                ]}
              />
            </div>
            <Prose>
              <p>
                En el equilibrio teórico, <TeX content="$D^*(x) = \\frac{p_{datos}(x)}{p_{datos}(x) + p_g(x)}$" />{' '}
                — el detective óptimo solo puede adivinar al 50% cuando el falsificador es perfecto. El
                entrenamiento alterna pasos de D y pasos de G, y es notoriamente inestable:{' '}
                <strong className="text-ink">mode collapse</strong> (G se obsesiona con una sola moda que engaña
                a D), oscilaciones eternas, y el gradiente que se desvanece cuando D gana por goleada. Juega el
                duelo completo:
              </p>
            </Prose>
            <div className="mt-8">
              <GANDuelDemo />
            </div>
          </Section>

          {/* ---------------- S4 · Difusión ---------------- */}
          <Section id="difusion" kicker="// 04 · CREAR DESDE EL RUIDO" title="Difusión: crear desde el ruido">
            <Prose>
              <p>
                Los modelos de difusión invierten la perspectiva: en vez de aprender a generar de golpe, aprenden
                a <strong className="text-ink">des-hacer la destrucción</strong>. El proceso forward es trivial y
                fijo: añade ruido gaussiano paso a paso hasta que solo queda{' '}
                <TeX content="$\\mathcal{N}(0, I)$" />:
              </p>
            </Prose>
            <Llano>
              Ensuciar una foto es fácil y no hay que aprender nada: en cada paso le echas un chorrito de ruido
              encima. La fórmula de la derecha es un atajo muy práctico: te dice directamente cuánta foto
              original sobrevive tras t pasos, sin tener que simularlos uno a uno.
            </Llano>
            <div className="my-8">
              <FormulaBlock
                formula="q(x_t \mid x_{t-1}) = \mathcal{N}\!\left(\sqrt{1 - \beta_t}\, x_{t-1}, \; \beta_t I\right) \qquad\Longleftrightarrow\qquad x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1 - \bar{\alpha}_t}\, \varepsilon"
                caption="Forward fijo (izquierda) y su salto en forma cerrada a cualquier t (derecha)"
                breakdown={[
                  { symbol: '\\beta_t', color: '#FB7185', explanation: 'cuánto ruido se añade en el paso t (el schedule)' },
                  { symbol: '\\bar{\\alpha}_t = \\prod_s (1-\\beta_s)', color: '#22D3EE', explanation: 'fracción de señal que sobrevive tras t pasos' },
                  { symbol: '\\varepsilon', color: '#8B5CF6', explanation: 'ruido gaussiano: el ingrediente que la red aprenderá a predecir' },
                ]}
              />
            </div>
            <Prose>
              <p>
                El proceso inverso es lo aprendido: una red <TeX content="$\\varepsilon_\\theta(x_t, t)$" />{' '}
                predice el ruido que contiene <TeX content="$x_t$" />, y muestrear consiste en quitar ruido paso
                a paso desde <TeX content="$x_T \\sim \\mathcal{N}(0, I)$" /> hasta una imagen limpia. ¿Por qué
                le ganó la partida a las GAN? <strong className="text-ink">Estabilidad</strong> (no hay duelo
                minimax) y <strong className="text-ink">cobertura</strong> (no hay mode collapse: el forward
                toca todos los modos de los datos). Desliza t y luego ejecuta el denoise:
              </p>
            </Prose>
            <div className="mt-8">
              <DiffusionDemo />
            </div>
          </Section>

          {/* ---------------- S5 · Ética ---------------- */}
          <Section id="etica" kicker="// 05 · PAUSA HONESTA" title="Ética y límites">
            <Prose>
              <p>
                Ya sabes construir máquinas que imaginan. Antes de los ejercicios, una pausa deliberada: cuatro
                problemas que ninguna función de pérdida va a resolver por ti.
              </p>
            </Prose>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {ETHICS.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 1.2, delay: i * 0.2 }}
                  className="rounded-xl border border-line bg-panel p-6"
                >
                  <c.icon className="mb-3 h-5 w-5 text-amber" aria-hidden />
                  <h3 className="mb-2 font-display text-lg font-semibold text-ink">{c.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted">{c.body}</p>
                  <span className="inline-block rounded-full border border-amber/30 bg-amber/5 px-3 py-1.5 font-mono text-[11px] leading-snug text-amber">
                    para debatir · {c.question}
                  </span>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* ---------------- S6 · Ejercicios ---------------- */}
          <Section id="ejercicios" kicker="// 06 · DEMUESTRA LO APRENDIDO" title="Ejercicios autocorregidos">
            <div className="space-y-6">
              {exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>

            <h3 className="mb-2 mt-14 font-display text-xl font-semibold text-ink">
              Quiz relámpago <span className="font-mono text-sm text-faint">· 5 preguntas · 220 XP</span>
            </h3>
            <div className="space-y-5">
              <QuizCard
                quizId="generativos-q1"
                xp={44}
                question="¿Para qué sirve el truco de la reparametrización en un VAE?"
                options={[
                  { text: 'Para que el muestreo de $z$ sea más rápido en GPU', correct: false, explanation: 'No es una cuestión de velocidad: el problema es matemático, no computacional.' },
                  { text: 'Para que el gradiente pueda fluir hacia $\\mu$ y $\\sigma$ a pesar del muestreo aleatorio', correct: true, explanation: 'Exacto: muestrear $z \\sim \\mathcal{N}(\\mu, \\sigma^2)$ no es diferenciable; escribir $z = \\mu + \\sigma\\varepsilon$ saca el azar fuera del grafo y la ruta hacia $\\mu$ y $\\sigma$ queda limpia.' },
                  { text: 'Para reducir la varianza del posterior', correct: false, explanation: 'No cambia la distribución muestreada: $z$ sigue siendo $\\mathcal{N}(\\mu, \\sigma^2)$. Solo cambia cómo se parametriza.' },
                  { text: 'Para inicializar los pesos del decoder', correct: false, explanation: 'La inicialización es independiente; la reparametrización actúa en cada forward pass.' },
                ]}
              />
              <QuizCard
                quizId="generativos-q2"
                xp={44}
                question="En el ELBO, ¿qué equilibra el término $D_{KL}(q(z|x) \\| p(z))$?"
                options={[
                  { text: 'La velocidad de entrenamiento frente a la precisión', correct: false, explanation: 'La KL no afecta directamente a la velocidad: es un término de la función objetivo.' },
                  { text: 'La calidad de reconstrucción frente a un espacio latente ordenado y muestreable', correct: true, explanation: 'Eso es: la KL “multa” posteriores que se alejan del prior $\\mathcal{N}(0,I)$, manteniendo el latente denso y navegable a cambio de algo de fidelidad.' },
                  { text: 'El tamaño del batch frente al learning rate', correct: false, explanation: 'Son hiperparámetros del optimizador, ajenos al ELBO.' },
                  { text: 'La profundidad del encoder frente a la del decoder', correct: false, explanation: 'La arquitectura no aparece en la fórmula del ELBO.' },
                ]}
              />
              <QuizCard
                quizId="generativos-q3"
                xp={44}
                question="¿Por qué colapsa una GAN (mode collapse)?"
                options={[
                  { text: 'Porque G encuentra una única salida que engaña a D y deja de explorar el resto de modas', correct: true, explanation: 'Correcto: si una moda engaña al D actual, el gradiente empuja a G a producir solo eso. D se adapta, G salta a otra moda… y el ciclo oscila sin cubrir $p_{datos}$.' },
                  { text: 'Porque el discriminador tiene demasiados parámetros', correct: false, explanation: 'El tamaño de D puede causar otros problemas (saturación), pero el colapso de modas es una dinámica del juego, no de la capacidad.' },
                  { text: 'Porque el ruido $z$ tiene pocas dimensiones', correct: false, explanation: 'La dimensión de $z$ no es la causa: colapsos ocurren incluso con latentes de alta dimensión.' },
                  { text: 'Porque la función de pérdida BCE no tiene mínimo', correct: false, explanation: 'La BCE tiene mínimo bien definido; el problema es la dinámica minimax del entrenamiento alterno.' },
                ]}
              />
              <QuizCard
                quizId="generativos-q4"
                xp={44}
                question="En un modelo de difusión, ¿qué predice la red $\\varepsilon_\\theta(x_t, t)$?"
                options={[
                  { text: 'La imagen limpia $x_0$ directamente', correct: false, explanation: 'Algunas variantes predicen $x_0$, pero la formulación estándar (DDPM) predice otra cosa…' },
                  { text: 'El ruido $\\varepsilon$ que se añadió a $x_0$ para obtener $x_t$', correct: true, explanation: 'Exacto: predecir el ruido equivale a saber “hacia dónde está lo limpio”. Restándolo iterativamente se muestrea desde ruido puro.' },
                  { text: 'La varianza $\\beta_t$ del siguiente paso', correct: false, explanation: 'El schedule $\\beta_t$ es fijo y lo eliges tú: no hay nada que aprender ahí.' },
                  { text: 'La probabilidad de que $x_t$ sea una imagen real', correct: false, explanation: 'Eso sería un discriminador: difusión no usa ninguno.' },
                ]}
              />
              <QuizCard
                quizId="generativos-q5"
                xp={44}
                question="¿Por qué la difusión es más estable de entrenar que una GAN?"
                options={[
                  { text: 'Porque usa arquitecturas convolucionales en vez de MLPs', correct: false, explanation: 'La arquitectura es irrelevante aquí: hay GANs convolucionales y difusión con Transformers.' },
                  { text: 'Porque no hay juego adversario: el forward es fijo y la pérdida es una regresión directa sobre el ruido', correct: true, explanation: 'Eso es: no hay minimax ni oscilaciones. Además el forward cubre todas las modas por construcción, así que no hay mode collapse.' },
                  { text: 'Porque necesita menos datos de entrenamiento', correct: false, explanation: 'Al contrario: los modelos de difusión suelen entrenarse con datasets gigantescos.' },
                  { text: 'Porque no usa gradiente descendente', correct: false, explanation: 'Por supuesto que usa gradiente descendente: la diferencia está en qué se optimiza.' },
                ]}
              />
            </div>
          </Section>

          {/* ---------------- S7 · Siguiente nivel CTA ---------------- */}
          <section id="siguiente" className="scroll-mt-24 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9 }}
              className="relative overflow-hidden rounded-2xl border border-line bg-panel p-8 md:p-12"
              style={{ boxShadow: '0 0 60px rgba(163,230,53,0.10)' }}
            >
              <div
                className="pointer-events-none absolute inset-0 animate-pulse-soft"
                style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(163,230,53,0.10), transparent 70%)' }}
                aria-hidden
              />
              <div className="relative">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-3 py-1 font-mono text-[0.78rem] uppercase tracking-[0.14em] text-lime">
                  // SIGUIENTE · N7 PYTORCH
                </span>
                <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-[-0.03em] text-ink">
                  PyTorch práctico: el framework de los profesionales
                </h3>
                <p className="mt-3 max-w-[560px] text-base leading-[1.75] text-muted">
                  Ya entiendes la teoría profunda: autograd, backprop, GAN y difusión. Ahora aprendes la
                  herramienta con la que se construye todo esto en el mundo real — construyendo tu propio
                  mini-framework con autograd incluido.
                </p>
                <Link
                  to="/modulos/pytorch"
                  className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-lime to-cyan px-6 py-3 font-mono text-sm font-bold text-bg-0 transition-transform hover:scale-[1.03] active:scale-[0.97]"
                >
                  Seguir al N7
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </div>
  )
}
