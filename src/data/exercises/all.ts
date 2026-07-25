/**
 * all.ts — Agregador de ejercicios de TODOS los módulos.
 * Importado por side-effect en App.tsx para que el registro global
 * (`allExercises()`) esté completo en cualquier página (p. ej. el
 * centro de ejercicios del Laboratorio). El registro es idempotente.
 */
import { registerExercises } from '@/lib/exercises'
import { FUNDAMENTOS_EXERCISES } from './fundamentos'
import { ML_CLASICO_EXERCISES } from './ml-clasico'
import { REDES_NEURONALES_EXERCISES } from './redes-neuronales'
import { CNN_EXERCISES } from './cnn'
import { SECUENCIAS_EXERCISES } from './secuencias'
import { TRANSFORMERS_EXERCISES } from './transformers'
import { GENERATIVOS_EXERCISES } from './generativos'
import { BOSS_EXERCISES } from './boss'

registerExercises(FUNDAMENTOS_EXERCISES)
registerExercises(ML_CLASICO_EXERCISES)
registerExercises(REDES_NEURONALES_EXERCISES)
registerExercises(CNN_EXERCISES)
registerExercises(SECUENCIAS_EXERCISES)
registerExercises(TRANSFORMERS_EXERCISES)
registerExercises(GENERATIVOS_EXERCISES)
registerExercises(BOSS_EXERCISES)
