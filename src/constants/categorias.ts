import { Categoria } from '../types';

export interface CategoriaInfo {
  key: Categoria | 'todos';
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { key: 'todos', label: 'Todos', emoji: '🐾', color: '#e1f5ee' },
  { key: 'comida', label: 'Comida', emoji: '🥩', color: '#faeeda' },
  { key: 'juguetes', label: 'Juguetes', emoji: '🎾', color: '#eeedfe' },
  { key: 'medicamentos', label: 'Medicamentos', emoji: '💊', color: '#faece7' },
  { key: 'collares', label: 'Collares', emoji: '🦮', color: '#fbeaf0' },
  { key: 'accesorios', label: 'Accesorios', emoji: '✨', color: '#e6f1fb' },
  { key: 'otros', label: 'Otros', emoji: '📦', color: '#f1efe8' },
];

export function getCategoriaInfo(key: string): CategoriaInfo {
  return CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS[0];
}
