import { AppData, Student } from '../types';
import { sortDatesChronologically } from '../utils/dates';

const LOCAL_STORAGE_KEY = 'cpu_batan_asistencia_data_v1';
const ROLE_KEY = 'cpu_batan_user_role';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ayoxwnqzrfojknhlocdg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API = `${SUPABASE_URL}/rest/v1/app_data`;

function normalizarPlanillas(target: any): any {
  for (const materia of (target?.materias || [])) {
    if (!Array.isArray(materia.fechas)) materia.fechas = [];
    // Ordena una copia lógica en memoria sin eliminar fechas duplicadas ni registros.
    materia.fechas = sortDatesChronologically(materia.fechas);
    if (!Array.isArray(materia.alumnos)) materia.alumnos = [];
  }
  return target;
}

function normalize(raw: any): AppData | null {
  const target = raw?.payload?.record || raw?.record || raw;
  if (!target?.materias) return null;
  normalizarPlanillas(target);
  return { materias: target.materias || [], alumnos: target.alumnos || [], trabajadores: target.trabajadores || [], version: target.version || 1, last_updated: target.last_updated || new Date().toISOString() };
}

const headers = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' });

export const StorageService = {
  getRole(): 'admin' | 'espectador' { return localStorage.getItem(ROLE_KEY) === 'admin' ? 'admin' : 'espectador'; },
  setRole(role: 'admin' | 'espectador') { localStorage.setItem(ROLE_KEY, role); },

  async loadRemoteData(): Promise<AppData> {
    if (!SUPABASE_KEY) throw new Error('No hay conexión configurada con el servidor.');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(`${API}?id=eq.1&select=payload,updated_at`, { headers: headers(), signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
    if (!res.ok) throw new Error('No se pudieron actualizar los datos desde el servidor.');
    const rows = await res.json();
    const normalized = normalize(rows?.[0]);
    if (!normalized) throw new Error('El servidor no devolvió datos válidos.');
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  },

  async loadData(): Promise<AppData> {
    try {
      return await this.loadRemoteData();
    } catch (e) { console.warn('Supabase no disponible; usando caché local.', e); }
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) { try { const n = normalize(JSON.parse(local)); if (n) return n; } catch {} }
    throw new Error('No se pudo cargar la información.');
  },

  async saveData(data: AppData): Promise<boolean> {
    const dataToSave: AppData = {
      ...data,
      materias: data.materias.map(materia => ({
        ...materia,
        fechas: sortDatesChronologically(Array.isArray(materia.fechas) ? materia.fechas : [])
      })),
      last_updated: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    if (!SUPABASE_KEY) return false;
    try {
      const res = await fetch(`${API}?id=eq.1`, { method: 'PATCH', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify({ payload: { record: dataToSave }, updated_at: dataToSave.last_updated }) });
      if (!res.ok) return false;
      const updatedRows = await res.json();
      return Array.isArray(updatedRows) && updatedRows.length > 0;
    } catch (e) { console.warn('No se pudo guardar en Supabase.', e); return false; }
  },

  startRealtime(onData: (data: AppData) => void): () => void {
    if (!SUPABASE_KEY) return () => {};
    let last = '';
    const poll = async () => {
      try { const r = await fetch(`${API}?id=eq.1&select=payload,updated_at`, { headers: headers() }); const rows = await r.json(); const n = normalize(rows?.[0]); const stamp = rows?.[0]?.updated_at || n?.last_updated || ''; if (n && stamp !== last) { last = stamp; localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(n)); onData(n); } } catch {}
    };
    const timer = window.setInterval(poll, 3000); poll();
    return () => window.clearInterval(timer);
  },

  findDuplicates(alumnos: Student[]): Array<{ student: Student; duplicateOf: Student; reason: string }> {
    const results: Array<{ student: Student; duplicateOf: Student; reason: string }> = [];
    for (let i = 0; i < alumnos.length; i++) for (let j = i + 1; j < alumnos.length; j++) {
      const a = alumnos[i], b = alumnos[j];
      if (a.dni && b.dni && a.dni.trim() && a.dni.trim() === b.dni.trim()) results.push({ student: b, duplicateOf: a, reason: `DNI idéntico: ${a.dni}` });
      else if (`${a.apellido} ${a.nombre}`.trim().toLowerCase() === `${b.apellido} ${b.nombre}`.trim().toLowerCase()) results.push({ student: b, duplicateOf: a, reason: `Nombre y apellido idénticos: ${a.apellido}, ${a.nombre}` });
    }
    return results;
  }
};
