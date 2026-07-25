/**
 * MLClasico — /modulos/ml-clasico · Nivel N1–N2.
 * Regresión logística, métricas, overfitting/regularización, KNN/SVM/árboles/
 * ensembles, K-means y PCA. 7 demos interactivas, 6 ejercicios + quiz.
 */

import { Link } from 'react-router'
import { ArrowRight, FlaskConical } from 'lucide-react'
import ChapterNav, { type ChapterSection } from '@/components/ChapterNav'
import ModuleHero from '@/components/ModuleHero'
import FormulaBlock from '@/components/FormulaBlock'
import ExerciseCard from '@/components/ExerciseCard'
import QuizCard from '@/components/QuizCard'
import DemoFrontera from '@/components/mlclasico/DemoFrontera'
import DemoMetricas from '@/components/mlclasico/DemoMetricas'
import DemoPolinomio from '@/components/mlclasico/DemoPolinomio'
import DemoZoo from '@/components/mlclasico/DemoZoo'
import DemoKMeans from '@/components/mlclasico/DemoKMeans'
import DemoPCA from '@/components/mlclasico/DemoPCA'
import { TeX } from '@/lib/katex-content'
import { registerExercises } from '@/lib/exercises'
import { ML_CLASICO_EXERCISES } from '@/data/exercises/ml-clasico'

registerExercises(ML_CLASICO_EXERCISES)

const SECTIONS: ChapterSection[] = [
  { id: 'idea', label: '1.0 La idea sin fórmulas' },
  { id: 'logistica', label: '1.1 Regresión logística' },
  { id: 'metricas', label: '1.2 Métricas' },
  { id: 'overfitting', label: '1.3 Overfitting' },
  { id: 'zoo', label: '1.4 El zoo clásico' },
  { id: 'nosupervisado', label: '1.5 K-means y PCA' },
  { id: 'ejercicios', label: '1.6 Ejercicios' },
  { id: 'siguiente', label: '1.7 Siguiente nivel' },
]

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string
  kicker: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line/60 py-14 first:border-t-0 first:pt-4">
      <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-cyan">{kicker}</span>
      <h2 className="mb-6 mt-2 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.95rem] leading-[1.8] text-muted">{children}</p>
}

/** Traducción sin notación de la fórmula que viene a continuación. */
function EnClaro({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-2 border-lime/60 bg-lime/5 px-4 py-3 text-[0.9rem] leading-[1.7] text-muted">
      <span className="mr-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-lime">
        En castellano llano:
      </span>
      {children}
    </p>
  )
}

export default function MLClasico() {
  return (
    <>
      <ModuleHero
        level="N1"
        kicker="// NIVEL 1–2 · MACHINE LEARNING CLÁSICO"
        title="ML clásico: clasificar, medir y no sobreajustar"
        abstract="La regresión logística convierte la recta en una probabilidad. Después: cómo medir de verdad un modelo, por qué memorizar no es aprender, y el zoo de modelos que aún dominan los datos tabulares."
        meta={{ duration: '≈ 4 h', demos: 7, exercises: 7, xp: 400 }}
        art="/art-clasico.png"
        color="#22D3EE"
      />

      <div className="mx-auto flex max-w-[1200px] gap-10 px-4 py-14 md:px-6">
        <ChapterNav sections={SECTIONS} />

        <main className="min-w-0 max-w-[860px] flex-1">
          {/* S0 · la idea sin fórmulas */}
          <Section id="idea" kicker="// 1.0 · ANTES DE EMPEZAR" title="La idea sin fórmulas: clasificar y trazar fronteras">
            <P>
              <b className="text-ink">Clasificar</b> es decidir a qué grupo pertenece algo: ¿este email es
              spam o no?, ¿esta transacción es fraude?, ¿este tumor es benigno o maligno? Hasta ahora
              predecías un número (un precio); ahora la salida es una <b className="text-cyan">etiqueta</b>{' '}
              entre unas pocas posibles. El truco es que el modelo sigue calculando un número — una
              «confianza» entre 0 y 1 — y luego aplicamos una regla de corte: si pasa de 0.5, clase 1; si
              no, clase 0.
            </P>
            <P>
              Cada ejemplo es una fila de números con su etiqueta. Si dibujas los ejemplos como puntos (un
              color por clase), aprender a clasificar es <b className="text-violet">trazar una frontera de
              decisión</b>: la línea o curva que separa los grupos. Todo punto que cae a un lado se declara
              de una clase; al otro lado, de la otra. Piensa en la línea de banda de un campo de fútbol: no
              importa dónde esté el balón exactamente, importa <b className="text-ink">de qué lado de la
              línea cayó</b>. Los modelos de este módulo se diferencian, sobre todo, en la forma de frontera
              que saben dibujar: rectas (regresión logística, SVM), fronteras que serpentean por los vecinos
              (KNN), o escalones a base de preguntas sí/no (árboles).
            </P>
            <P>
              Mini-glosario de los símbolos que repetirás en todo el módulo (ninguno es nuevo: todos salen
              del Bloque 0 de Fundamentos):
            </P>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                    <th className="px-4 py-3">símbolo</th>
                    <th className="px-4 py-3">qué es</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 text-muted">
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-cyan"><TeX content="$\\sigma(z)$" /></td>
                    <td className="px-4 py-2.5">la <b className="text-ink">sigmoide</b>: una curva en forma de S que aplasta cualquier número al rango (0, 1) para convertirlo en probabilidad</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-violet"><TeX content="$z = w \\cdot x + b$" /></td>
                    <td className="px-4 py-2.5">la <b className="text-ink">puntuación cruda</b> (producto escalar + sesgo) antes de aplastarla con la sigmoide</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-amber"><TeX content="$p$" /></td>
                    <td className="px-4 py-2.5">la <b className="text-ink">probabilidad estimada</b> de la clase positiva; la regla de corte es «p ≥ 0.5 → clase 1»</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-lime">TP · FP · TN · FN</td>
                    <td className="px-4 py-2.5">las cuatro casillas de la <b className="text-ink">matriz de confusión</b>: aciertos y errores de cada tipo (verdadero/falso positivo/negativo)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-amber"><TeX content="$\\lambda$" /></td>
                    <td className="px-4 py-2.5">fuerza de la <b className="text-ink">regularización</b>: cuánto castigamos los pesos grandes para evitar memorizar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-mono text-rose"><TeX content="$H$" /></td>
                    <td className="px-4 py-2.5">la <b className="text-ink">entropía</b>: cuánto «desorden» (mezcla de clases) hay en un grupo de ejemplos; la usan los árboles</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* S1 · logistica */}
          <Section id="logistica" kicker="// 1.1 · CLASIFICACIÓN" title="De la recta a la probabilidad">
            <P>
              Predecir un precio es regresión; decidir <b className="text-ink">si un email es spam</b> es
              clasificación. Una recta no sirve: la salida debe vivir entre 0 y 1. La solución es pasar
              la combinación lineal por la <b className="text-cyan">sigmoide</b>, que comprime todo{' '}
              <TeX content="$\\mathbb{R}$" /> al intervalo <TeX content="$(0, 1)$" /> — una probabilidad.
            </P>
            <EnClaro>
              Calcula una puntuación como la de la regresión lineal (pesos por datos, más un ajuste) y pásala
              por una curva en forma de S que la convierte en un número entre 0 y 1: esa es la probabilidad.
              Si supera 0.5, dices «clase 1»; si no, «clase 0».
            </EnClaro>
            <FormulaBlock
              formula="\sigma(z) = \frac{1}{1 + e^{-z}}, \qquad p = \sigma(w \cdot x + b), \qquad \hat{y} = \mathbb{1}[p \geq 0.5]"
              caption="Regresión logística: lineal por dentro, probabilidad por fuera"
              breakdown={[
                { symbol: '\\sigma(z)', color: '#22D3EE', explanation: 'aplasta cualquier número al rango (0, 1): z muy negativo → 0, z muy positivo → 1' },
                { symbol: 'p', color: '#FBBF24', explanation: 'la probabilidad estimada de la clase positiva' },
                { symbol: '\\mathbb{1}[p \\geq 0.5]', color: '#A3E635', explanation: 'la regla de decisión: clase 1 si la probabilidad supera el umbral (0.5 por defecto, pero es ajustable)' },
              ]}
            />
            <P>
              Detalle elegante: su derivada se escribe con ella misma,{' '}
              <TeX content="$\\sigma'(z) = \\sigma(z)\\,(1 - \\sigma(z))$" /> — y eso hace que el gradiente
              de su pérdida sea tan limpio como el de la regresión lineal. ¿Y qué pérdida? Si el modelo
              dice «90 % de spam» y no era spam, el error debe doler: entra la{' '}
              <b className="text-rose">entropía cruzada</b> (log-loss), que no es más que la máxima
              verosimilitud de un modelo Bernoulli (mismo puente que vimos en N0).
            </P>
            <EnClaro>
              Mira qué probabilidad le diste a la clase correcta y castígala: cuanto más baja era, más duele.
              Decir «1 %» cuando la respuesta era sí duele muchísimo; decir «99 %» casi no cuesta nada. Haz
              la media de ese castigo en todos los ejemplos.
            </EnClaro>
            <FormulaBlock
              formula="L = -\frac{1}{N}\sum_{i=1}^{N} \Big[ y_i \log p_i + (1 - y_i)\log(1 - p_i) \Big]"
              caption="Entropía cruzada binaria (log-loss)"
              breakdown={[
                { symbol: 'y_i \\log p_i', color: '#22D3EE', explanation: 'si la etiqueta es 1, solo cuenta cuánta probabilidad le diste a la clase correcta' },
                { symbol: '\\log(1-p_i)', color: '#8B5CF6', explanation: 'si la etiqueta es 0, cuenta cuánta le diste a la clase negativa' },
                { symbol: '-\\log', color: '#FB7185', explanation: 'predecir 0.01 cuando la verdad es 1 cuesta −log(0.01) ≈ 4.6: la confianza equivocada se paga cara' },
              ]}
            />
            <DemoFrontera />
            <P>
              Entrena el modelo y luego mueve el <b className="text-cyan">umbral</b>: bajarlo detecta más
              positivos (a costa de más falsas alarmas); subirlo es más conservador. Ese trade-off es el
              tema de la siguiente sección.
            </P>
          </Section>

          {/* S2 · metricas */}
          <Section id="metricas" kicker="// 1.2 · EVALUACIÓN HONESTA" title="Métricas: no te engañes">
            <P>
              En un detector de enfermedad rara (1 % de positivos), un modelo que siempre dice «sano»
              acierta el <b className="text-rose">99 %</b>… y es completamente inútil. La accuracy miente
              con clases desbalanceadas. La verdad está en la <b className="text-ink">matriz de confusión</b>:
              verdaderos/falsos positivos y negativos (TP, FP, TN, FN).
            </P>
            <EnClaro>
              Precision: de todas las veces que dijiste «positivo», ¿en cuántas acertaste? Recall: de todos
              los positivos que existían de verdad, ¿cuántos cazaste? F1: una nota única que solo sale alta
              si las dos anteriores son altas a la vez.
            </EnClaro>
            <FormulaBlock
              formula="\mathrm{Precision} = \frac{TP}{TP + FP}, \qquad \mathrm{Recall} = \frac{TP}{TP + FN}, \qquad F_1 = \frac{2\,P\,R}{P + R}"
              caption="Las tres métricas que importan en clasificación"
              breakdown={[
                { symbol: 'P', color: '#8B5CF6', explanation: 'precision: de todo lo que marcaste como positivo, ¿cuánto lo era de verdad? (importa en spam: cada FP es un correo bueno perdido)' },
                { symbol: 'R', color: '#22D3EE', explanation: 'recall o sensibilidad: de todos los positivos reales, ¿cuántos cazaste? (importa en medicina: cada FN es un enfermo sin diagnosticar)' },
                { symbol: 'F_1', color: '#FBBF24', explanation: 'media armónica: solo es alta si AMBAS lo son; es la métrica de compromiso' },
              ]}
            />
            <P>
              Cada umbral de decisión produce un punto (precision, recall) y un punto (FPR, TPR). Recorrer
              todos los umbrales dibuja la <b className="text-cyan">curva ROC</b>; su área (<b className="text-cyan">AUC</b>)
              resume la calidad del ranking del modelo independientemente del umbral: 0.5 es azar, 1.0 es
              perfección.
            </P>
            <DemoMetricas />
            <P>
              Regla práctica: en <b className="text-ink">fraude</b> y <b className="text-ink">medicina</b>{' '}
              prioriza recall (no dejes escapar positivos); en <b className="text-ink">spam</b> prioriza
              precision (no ensucies la bandeja). Y nunca reportes una sola métrica sin contexto.
            </P>
          </Section>

          {/* S3 · overfitting */}
          <Section id="overfitting" kicker="// 1.3 · EL PECADO CAPITAL" title="Overfitting y regularización">
            <P>
              Un modelo con suficientes grados de libertad puede <b className="text-rose">memorizar</b> los
              datos de entrenamiento — incluido el ruido — y fallar estrepitosamente con datos nuevos.
              Ese es el overfitting: MSE de entrenamiento por los suelos, MSE de validación disparado.
              El equilibrio se llama <b className="text-ink">trade-off sesgo–varianza</b>: modelos simples
              (alto sesgo) infra-ajustan; modelos muy flexibles (alta varianza) sobre-ajustan.
            </P>
            <P>
              El antídoto más directo es penalizar la complejidad: añadir a la pérdida un castigo por
              pesos grandes.
            </P>
            <FormulaBlock
              formula="L' = L + \lambda \sum_{i} w_i^2 \qquad \text{(L2 · ridge)}"
              caption="Regularización L2: los pesos grandes cuestan"
              breakdown={[
                { symbol: '\\lambda', color: '#FBBF24', explanation: 'fuerza de la penalización: λ=0 es OLS; λ grande empuja los pesos hacia 0' },
                { symbol: '\\sum w_i^2', color: '#8B5CF6', explanation: 'L2 encoge todos los pesos suavemente («weight decay»): el modelo prefiere explicaciones repartidas' },
              ]}
            />
            <FormulaBlock
              formula="L' = L + \lambda \sum_{i} |w_i| \qquad \text{(L1 · lasso)}"
              caption="Regularización L1: genera pesos exactamente cero"
            />
            <P>
              L1 lleva muchos pesos a <b className="text-ink">cero exacto</b> — hace selección de
              características automática. Otras dos herramientas del arsenal: <b className="text-lime">early
              stopping</b> (para cuando el error de validación deja de bajar) y <b className="text-lime">validación
              cruzada</b> (rota qué trozo de datos hace de validación para una estimación robusta).
            </P>
            <DemoPolinomio />
          </Section>

          {/* S4 · zoo */}
          <Section id="zoo" kicker="// 1.4 · EL ZOO CLÁSICO" title="KNN, SVM, árboles y ensembles">
            <P>
              <b className="text-cyan">KNN</b> (k vecinos más cercanos) no entrena nada: para predecir,
              busca los <TeX content="$k$" /> ejemplos más parecidos y vota. Toda la «inteligencia» está
              en la métrica de distancia — con <TeX content="$k=1$" /> memoriza el dataset entero.
            </P>
            <FormulaBlock
              formula="d(x, x') = \|x - x'\|_2 = \sqrt{\sum_{j} (x_j - x'_j)^2}"
              caption="Distancia euclídea: la noción de «parecido» de KNN"
            />
            <P>
              <b className="text-violet">SVM</b> (máquinas de vectores soporte) busca la frontera que deja
              el <b className="text-ink">margen más ancho</b> posible entre clases: solo unos pocos puntos
              (los vectores soporte) deciden dónde va la frontera.
            </P>
            <FormulaBlock
              formula="\min_{w,b}\; \frac{1}{2}\|w\|^2 \quad \text{s.t.} \quad y_i\,(w \cdot x_i + b) \geq 1"
              caption="SVM de margen duro: maximizar el margen = minimizar ‖w‖"
              breakdown={[
                { symbol: '\\frac{1}{2}\\|w\\|^2', color: '#8B5CF6', explanation: 'minimizar la norma maximiza el margen (que mide 2/‖w‖)' },
                { symbol: 'y_i(w \\cdot x_i + b) \\geq 1', color: '#22D3EE', explanation: 'cada punto debe estar en su lado y fuera de la banda del margen' },
              ]}
            />
            <P>
              <b className="text-lime">Los árboles de decisión</b> aprenden una secuencia de preguntas
              («¿x₁ ≤ 2.3?») eligiendo en cada nodo el corte con mayor <b className="text-ink">ganancia de
              información</b>: el que más reduce la entropía (desorden) de las etiquetas.
            </P>
            <FormulaBlock
              formula="H = -\sum_{c} p_c \log_2 p_c, \qquad IG = H(\mathrm{padre}) - \sum_{k} \frac{n_k}{n}\, H(\mathrm{hijo}_k)"
              caption="Entropía y ganancia de información"
            />
            <P>
              Y los <b className="text-amber">ensembles</b>: muchos modelos débiles votando.{' '}
              <b className="text-ink">Bagging</b> (Random Forest) entrena cada árbol con una muestra
              bootstrap y promedia; <b className="text-ink">boosting</b> entrena modelos en secuencia,
              cada uno corrigiendo los errores del anterior — AdaBoost pondera cada stump según su
              acierto, <TeX content="$\\alpha_t = \\tfrac{1}{2}\\ln\\frac{1 - \\mathrm{err}}{\\mathrm{err}}$" />.
            </P>
            <DemoZoo />
          </Section>

          {/* S5 · nosupervisado */}
          <Section id="nosupervisado" kicker="// 1.5 · SIN ETIQUETAS" title="Clustering (K-means) y PCA">
            <P>
              A veces no hay respuestas correctas: solo datos. El <b className="text-cyan">aprendizaje no
              supervisado</b> busca estructura. <b className="text-cyan">K-means</b> agrupa los puntos en{' '}
              <TeX content="$k$" /> clusters minimizando la distancia al centroide de cada grupo:
            </P>
            <FormulaBlock
              formula="\min_{\mu_1, \dots, \mu_k} \; \sum_{i=1}^{N} \left\| x_i - \mu_{c(i)} \right\|^2"
              caption="Objetivo de K-means (inercia intra-cluster)"
            />
            <P>
              El algoritmo de Lloyd alterna dos pasos hasta converger: <b className="text-ink">asignar</b>{' '}
              cada punto a su centroide más cercano y <b className="text-ink">mover</b> cada centroide a la
              media de sus puntos. Advertencia: el resultado depende de la inicialización, y elegir{' '}
              <TeX content="$k$" /> es un arte (el «método del codo» ayuda, pero no decide por ti).
            </P>
            <DemoKMeans />
            <P>
              <b className="text-violet">PCA</b> (análisis de componentes principales) hace otra cosa:
              encuentra las direcciones de <b className="text-ink">máxima varianza</b> de los datos — los
              autovectores de la matriz de covarianza — para proyectar a menos dimensiones perdiendo la
              menor información posible.
            </P>
            <FormulaBlock
              formula="\Sigma = \frac{1}{N} X^{\top} X, \qquad \Sigma v_j = \lambda_j v_j, \qquad \text{varianza explicada}_j = \frac{\lambda_j}{\sum_l \lambda_l}"
              caption="PCA: autovalores de la covarianza = varianza capturada por dirección"
              breakdown={[
                { symbol: '\\Sigma', color: '#8B5CF6', explanation: 'matriz de covarianza de los datos centrados: cómo varían juntas las variables' },
                { symbol: 'v_j', color: '#22D3EE', explanation: 'componente principal j: dirección ortogonal de máxima varianza restante' },
                { symbol: '\\lambda_j', color: '#FBBF24', explanation: 'autovalor: cuánta varianza captura esa dirección' },
              ]}
            />
            <DemoPCA />
          </Section>

          {/* S6 · ejercicios */}
          <Section id="ejercicios" kicker="// 1.6 · PRÁCTICA" title="Ejercicios autocorregidos">
            <P>
              Python real (numpy) en tu navegador. Pulsa <b className="text-ink">Corregir</b> para
              evaluar tu código con tests ocultos y sumar XP.
            </P>
            <div className="space-y-6">
              {ML_CLASICO_EXERCISES.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-faint">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                Q1 · Quiz conceptual (5 preguntas · 10 XP c/u)
              </div>
              <QuizCard
                quizId="mlc-quiz-1"
                xp={10}
                question="En un diagnóstico médico donde perder un caso positivo es grave, ¿qué métrica priorizarías?"
                options={[
                  { text: 'Precision', correct: false, explanation: 'La precision cuida los falsos positivos. Aquí el error caro es el FALSO NEGATIVO (enfermo no detectado).' },
                  { text: 'Recall', correct: true, explanation: 'Correcto: recall = TP/(TP+FN). Maximizarlo significa cazar a todos los enfermos aunque aceptemos más falsas alarmas.' },
                  { text: 'Accuracy', correct: false, explanation: 'Con clases raras, la accuracy puede ser altísima sin detectar ni un solo caso positivo.' },
                  { text: 'AUC', correct: false, explanation: 'El AUC resume el ranking global, pero no te dice qué umbral elegir para minimizar los FN.' },
                ]}
              />
              <QuizCard
                quizId="mlc-quiz-2"
                xp={10}
                question="¿Qué efecto tiene un $\\lambda$ de regularización DEMASIADO grande (L1 o L2)?"
                options={[
                  { text: 'El modelo sobreajusta más', correct: false, explanation: 'Al contrario: λ grande reduce la capacidad del modelo.' },
                  { text: 'Los pesos crecen sin control', correct: false, explanation: 'La penalización empuja los pesos hacia cero, nunca hacia arriba.' },
                  { text: 'El modelo infra-ajusta: pesos tan pequeños que ignora los datos', correct: true, explanation: 'Exacto: con λ enorme, minimizar la penalización domina sobre minimizar el error — el modelo queda casi constante (underfitting).' },
                  { text: 'No cambia nada: λ solo afecta al test', correct: false, explanation: 'λ actúa durante el entrenamiento, cambiando los pesos aprendidos.' },
                ]}
              />
              <QuizCard
                quizId="mlc-quiz-3"
                xp={10}
                question="¿Por qué KNN con $k = 1$ sobreajusta?"
                options={[
                  { text: 'Porque copia la etiqueta del punto más cercano, ruido incluido', correct: true, explanation: '¡Eso es! Con k=1 cada punto de entrenamiento «posee» su región: la frontera se contorsiona para acertar TODO el train, incluidos los errores de etiqueta.' },
                  { text: 'Porque tarda demasiado en predecir', correct: false, explanation: 'La lentitud es un problema práctico, no de generalización.' },
                  { text: 'Porque no usa todas las características', correct: false, explanation: 'KNN usa todas las features en la distancia; el problema es la ausencia de suavizado por votación.' },
                  { text: 'Porque la distancia euclídea no funciona', correct: false, explanation: 'La métrica es válida; el problema es k=1: cero promediado, varianza máxima.' },
                ]}
              />
              <QuizCard
                quizId="mlc-quiz-4"
                xp={10}
                question="¿Qué maximiza una SVM (de margen duro)?"
                options={[
                  { text: 'La accuracy en entrenamiento', correct: false, explanation: 'Muchas fronteras aciertan todo el train; la SVM elige una en concreto por otro criterio.' },
                  { text: 'El margen: la distancia de la frontera a los puntos más cercanos', correct: true, explanation: 'Correcto: minimizar ½‖w‖² equivale a maximizar el margen 2/‖w‖. Solo los vectores soporte determinan la solución.' },
                  { text: 'El número de vectores soporte', correct: false, explanation: 'Los vectores soporte son una CONSECUENCIA de la solución, no el objetivo.' },
                  { text: 'La entropía de las clases', correct: false, explanation: 'La entropía es el criterio de los árboles de decisión, no de las SVM.' },
                ]}
              />
              <QuizCard
                quizId="mlc-quiz-5"
                xp={10}
                question="¿Qué preserva PCA al proyectar a menos dimensiones?"
                options={[
                  { text: 'Las etiquetas de clase', correct: false, explanation: 'PCA es no supervisado: ni siquiera mira las etiquetas.' },
                  { text: 'Las distancias entre todos los pares de puntos exactamente', correct: false, explanation: 'Solo una proyección a TODAS las dimensiones las preservaría; PCA aproxima priorizando las direcciones importantes.' },
                  { text: 'La máxima varianza posible de los datos', correct: true, explanation: 'Exacto: PC1 es la dirección de máxima varianza, PC2 la siguiente ortogonal, etc. Equivalentemente, minimiza el error de reconstrucción.' },
                  { text: 'Los clusters de K-means', correct: false, explanation: 'No hay garantía de conservar clusters; PCA preserva varianza global, que a menudo (pero no siempre) coincide con la estructura.' },
                ]}
              />
            </div>
          </Section>

          {/* S7 · siguiente */}
          <section id="siguiente" className="scroll-mt-24 border-t border-line/60 py-14">
            <Link
              to="/modulos/redes-neuronales"
              className="group block rounded-2xl border border-line bg-panel p-7 transition-all hover:-translate-y-1 hover:border-violet/50 hover:shadow-glow-violet"
            >
              <span className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-violet">
                // SIGUIENTE · NIVEL 3
              </span>
              <div className="mt-2 flex items-center justify-between gap-4">
                <h3 className="font-display text-2xl font-bold text-ink">
                  Redes neuronales: apilar neuronas y propagar el error
                </h3>
                <ArrowRight className="h-6 w-6 shrink-0 text-violet transition-transform group-hover:translate-x-2" aria-hidden />
              </div>
              <p className="mt-2 text-sm text-muted">
                Del perceptrón al MLP: activaciones, backpropagation y optimizadores.
              </p>
            </Link>
          </section>
        </main>
      </div>
    </>
  )
}
