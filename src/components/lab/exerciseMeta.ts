/**
 * exerciseMeta — mapea el prefijo de un id de ejercicio a su nivel/módulo.
 * Módulo separado para no romper fast-refresh en ExerciseCenter.
 */

const LEVEL_OF: Record<string, { level: string; label: string; color: string }> = {
  fundamentos: { level: 'N0', label: 'Fundamentos', color: '#22D3EE' },
  'ml-clasico': { level: 'N1', label: 'ML Clásico', color: '#22D3EE' },
  redes: { level: 'N2', label: 'Redes Neuronales', color: '#8B5CF6' },
  cnn: { level: 'N3', label: 'CNN', color: '#8B5CF6' },
  secuencias: { level: 'N4', label: 'Secuencias', color: '#8B5CF6' },
  transformers: { level: 'N5', label: 'Transformers', color: '#FBBF24' },
  generativos: { level: 'N6', label: 'Generativos', color: '#FBBF24' },
  boss: { level: 'BOSS', label: 'Boss Final', color: '#FB7185' },
}

export const LEVEL_ORDER = ['N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'BOSS']

export const LEVEL_COLORS: Record<string, string> = {
  N0: '#22D3EE',
  N1: '#22D3EE',
  N2: '#8B5CF6',
  N3: '#8B5CF6',
  N4: '#8B5CF6',
  N5: '#FBBF24',
  N6: '#FBBF24',
  BOSS: '#FB7185',
}

export function exerciseMeta(id: string) {
  const prefix = id.split('-')[0]
  return LEVEL_OF[prefix] ?? { level: '?', label: prefix, color: '#8E9AB8' }
}
