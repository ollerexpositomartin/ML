/**
 * exerciseMeta — mapea el prefijo de un id de ejercicio a su nivel/módulo.
 * Módulo separado para no romper fast-refresh en ExerciseCenter.
 */

const LEVEL_OF: Record<string, { level: string; label: string; color: string }> = {
  fundamentos: { level: 'N0', label: 'Fundamentos', color: '#22D3EE' },
  'ml-clasico': { level: 'N1', label: 'ML Clásico', color: '#22D3EE' },
  mlc: { level: 'N1', label: 'ML Clásico', color: '#22D3EE' },
  redes: { level: 'N2', label: 'Redes Neuronales', color: '#8B5CF6' },
  cnn: { level: 'N3', label: 'CNN', color: '#8B5CF6' },
  secuencias: { level: 'N4', label: 'Secuencias', color: '#8B5CF6' },
  transformers: { level: 'N5', label: 'Transformers', color: '#FBBF24' },
  generativos: { level: 'N6', label: 'Generativos', color: '#FBBF24' },
  pytorch: { level: 'N7', label: 'PyTorch', color: '#A3E635' },
  llm: { level: 'N8', label: 'LLMs Modernos', color: '#FB7185' },
  rl: { level: 'N9', label: 'Reinforcement Learning', color: '#22D3EE' },
  mlops: { level: 'N10', label: 'MLOps', color: '#8B5CF6' },
  boss: { level: 'BOSS', label: 'Boss Final', color: '#FB7185' },
}

export const LEVEL_ORDER = ['N0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'BOSS']

export const LEVEL_COLORS: Record<string, string> = {
  N0: '#22D3EE',
  N1: '#22D3EE',
  N2: '#8B5CF6',
  N3: '#8B5CF6',
  N4: '#8B5CF6',
  N5: '#FBBF24',
  N6: '#FBBF24',
  N7: '#A3E635',
  N8: '#FB7185',
  N9: '#22D3EE',
  N10: '#8B5CF6',
  BOSS: '#FB7185',
}

export function exerciseMeta(id: string) {
  // Resuelve por el prefijo más largo que exista en LEVEL_OF
  // (soporta prefijos con guion como 'ml-clasico-*' y alias como 'mlc-*').
  const parts = id.split('-')
  for (let len = parts.length - 1; len >= 1; len--) {
    const key = parts.slice(0, len).join('-')
    if (LEVEL_OF[key]) return LEVEL_OF[key]
  }
  return { level: '?', label: parts[0], color: '#8E9AB8' }
}
