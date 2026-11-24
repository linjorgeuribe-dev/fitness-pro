import { useEffect, useState } from 'react'
import type { Exercise } from './types'

let cache: Promise<Exercise[]> | null = null
let byId: Map<string, Exercise> | null = null
let instr: Promise<Record<string, string[]>> | null = null

export function loadCatalog(): Promise<Exercise[]> {
  cache ??= fetch('/data/exercises.json').then((r) => {
    if (!r.ok) throw new Error('No se pudo cargar el catálogo')
    return r.json()
  }).then((d) => { byId = new Map(d.items.map((x: Exercise) => [x.id, x])); return d.items as Exercise[] })
    .catch((e) => { cache = null; throw e })
  return cache
}
export function loadInstructions() {
  instr ??= fetch('/data/instructions.json').then((r) => r.json()).catch((e) => { instr = null; throw e })
  return instr
}
export const exById = (id: string) => byId?.get(id)
export const imgUrl = (id: string, i: 0 | 1) => `/media/ex/${id}/${i}.webp?v=2` // v=2: fotos con tratamiento; cambia la URL para saltar la caché de un año

export function useCatalog() {
  const [state, set] = useState<{ items: Exercise[]; error: string | null; ready: boolean }>({ items: [], error: null, ready: false })
  useEffect(() => {
    let on = true
    loadCatalog().then((items) => on && set({ items, error: null, ready: true }))
      .catch(() => on && set({ items: [], error: 'No se pudo cargar el catálogo de ejercicios. Revisa tu conexión e inténtalo de nuevo.', ready: true }))
    return () => { on = false }
  }, [])
  return state
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
/** Búsqueda tolerante a acentos: todas las palabras deben aparecer en el nombre (es o en). */
export function searchExercises(items: Exercise[], q: string) {
  const words = norm(q).split(/\s+/).filter(Boolean)
  if (!words.length) return items
  return items.filter((x) => { const h = norm(x.n + ' ' + x.e); return words.every((w) => h.includes(w)) })
}
