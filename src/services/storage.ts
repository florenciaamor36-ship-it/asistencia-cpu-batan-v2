import { AppData, Student } from '../types';
import { INITIAL_DATA } from '../data/defaultData';

const LOCAL_STORAGE_KEY = 'cpu_batan_asistencia_data_v1';
const ROLE_KEY = 'cpu_batan_user_role';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ayoxwnqzrfojknhlocdg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API = `${SUPABASE_URL}/rest/v1/app_data`;

function aplicarAsistenciaAutomaticaTrabajadores(target: any): any {
  const normalizar = (valor: unknown) => String(valor ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const coincide = (a: any, w: any) => {
    const da = normalizar(a.dni), dw = normalizar(w.dni);
    return (da && dw && da === dw) || (normalizar(a.apellido) === normalizar(w.apellido) && normalizar(a.nombre) === normalizar(w.nombre));
  };
  const workers = Array.isArray(target?.trabajadores) ? target.trabajadores : [];
  for (const materia of (target?.materias || [])) {
    if (!Array.isArray(materia.alumnos)) materia.alumnos = [];
    for (const worker of workers) {
      let alumno = materia.alumnos.find((x: any) => coincide(x, worker));
      if (!alumno) {
        alumno = { id: worker.id, apellido: worker.apellido, nombre: worker.nombre, dni: worker.dni, pabellon: worker.pabellon || '', fecha_inscripcion: '', fecha_vencimiento_carnet: worker.vencimiento_carnet || '', asist: {}, observaciones: 'Trabajador CPU Batán - asistencia automática' };
        materia.alumnos.push(alumno);
      }
      alumno.asist = { ...(alumno.asist || {}) };
      (materia.fechas || []).forEach((f: string) => alumno.asist[f] = true);
    }
  }
  return target;
}

function normalize(raw: any): AppData | null {
  const target = raw?.payload?.record || raw?.record || raw;
  if (!target?.materias) return null;
  aplicarAsistenciaAutomaticaTrabajadores(target);
  return { materias: target.materias || [], alumnos: target.alumnos || [], trabajadores: target.trabajadores || [], version: target.version || 1, last_updated: target.last_updated || new Date().toISOString() };
}

const headers = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' });

export const StorageService = {
  getRole(): 'admin' | 'espectador' { return localStorage.getItem(ROLE_KEY) === 'admin' ? 'admin' : 'espectador'; },
  setRole(role: 'admin' | 'espectador') { localStorage.setItem(ROLE_KEY, role); },

  async loadData(): Promise<AppData> {
    try {
      if (SUPABASE_KEY) {
        const res = await fetch(`${API}?id=eq.1&select=payload,updated_at`, { headers: headers() });
        if (res.ok) {
          const rows = await res.json();
          const normalized = normalize(rows?.[0]);
          if (normalized) { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized)); return normalized; }
        }
      }
    } catch (e) { console.warn('Supabase no disponible; usando caché local.', e); }
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) { try { const n = normalize(JSON.parse(local)); if (n) return n; } catch {} }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  },

  async saveData(data: AppData): Promise<boolean> {
    data.last_updated = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    if (!SUPABASE_KEY) return false;
    try {
      const res = await fetch(`${API}?id=eq.1`, { method: 'PATCH', headers: { ...headers(), Prefer: 'return=minimal' }, body: JSON.stringify({ payload: { record: data }, updated_at: data.last_updated }) });
      return res.ok;
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
