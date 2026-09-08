import { AppData, Student, Subject, Worker } from '../types';
import { INITIAL_DATA } from '../data/defaultData';

const LOCAL_STORAGE_KEY = 'cpu_batan_asistencia_data_v1';
const ROLE_KEY = 'cpu_batan_user_role';

// Los trabajadores de CPU Batán figuran automáticamente como presentes en todas las materias.
function aplicarAsistenciaAutomaticaTrabajadores(target: any): any {
  const normalizar = (valor: unknown) => String(valor ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const coincide = (alumno: any, trabajador: any) => {
    const dniAlumno = normalizar(alumno.dni);
    const dniTrabajador = normalizar(trabajador.dni);
    return (dniAlumno && dniTrabajador && dniAlumno === dniTrabajador) ||
      (normalizar(alumno.apellido) === normalizar(trabajador.apellido) && normalizar(alumno.nombre) === normalizar(trabajador.nombre));
  };
  const trabajadores = Array.isArray(target?.trabajadores) ? target.trabajadores : [];
  const materias = Array.isArray(target?.materias) ? target.materias : [];
  for (const materia of materias) {
    const fechas = Array.isArray(materia.fechas) ? materia.fechas : [];
    if (!Array.isArray(materia.alumnos)) materia.alumnos = [];
    for (const trabajador of trabajadores) {
      let alumno = materia.alumnos.find((item: any) => coincide(item, trabajador));
      if (!alumno) {
        alumno = {
          id: trabajador.id,
          apellido: trabajador.apellido,
          nombre: trabajador.nombre,
          dni: trabajador.dni,
          pabellon: trabajador.pabellon || '',
          fecha_inscripcion: '',
          fecha_vencimiento_carnet: trabajador.vencimiento_carnet || '',
          asist: {},
          observaciones: 'Trabajador CPU Batán - asistencia automática'
        };
        materia.alumnos.push(alumno);
      }
      alumno.asist = { ...(alumno.asist || {}) };
      fechas.forEach((fecha: string) => { alumno.asist[fecha] = true; });
    }
  }
  return target;
}

export const StorageService = {
  getRole(): 'admin' | 'espectador' {
    const role = localStorage.getItem(ROLE_KEY);
    return role === 'admin' ? 'admin' : 'espectador';
  },

  setRole(role: 'admin' | 'espectador') {
    localStorage.setItem(ROLE_KEY, role);
  },

  async loadData(): Promise<AppData> {
    const normalize = (raw: any): AppData | null => {
      if (!raw) return null;
      const target = raw.record && raw.record.materias ? raw.record : raw;
      aplicarAsistenciaAutomaticaTrabajadores(target);
      if (target && Array.isArray(target.materias)) {
        return {
          materias: target.materias || [],
          alumnos: target.alumnos || [],
          trabajadores: target.trabajadores || [],
          version: target.version || 1,
          last_updated: target.last_updated
        };
      }
      return null;
    };

    try {
      // Try backend first
      const res = await fetch('/api/data');
      if (res.ok) {
        const raw = await res.json();
        const normalized = normalize(raw);
        if (normalized) {
          // Cache locally
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (e) {
      console.warn("Backend offline or unreachable, loading local storage cache:", e);
    }

    // Fallback to localStorage
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const raw = JSON.parse(local);
        const normalized = normalize(raw);
        if (normalized) return normalized;
      } catch (err) {
        console.error("Error parsing local data:", err);
      }
    }

    // Initialize with default data if nothing exists
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  },

  async saveData(data: AppData): Promise<boolean> {
    data.last_updated = new Date().toISOString();
    // Save locally immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    // Try syncing to backend
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      console.warn("Offline: Data saved locally, will sync when online.", e);
      return false;
    }
  },

  // Duplicate detection helper
  findDuplicates(alumnos: Student[]): Array<{ student: Student; duplicateOf: Student; reason: string }> {
    const results: Array<{ student: Student; duplicateOf: Student; reason: string }> = [];
    
    for (let i = 0; i < alumnos.length; i++) {
      for (let j = i + 1; j < alumnos.length; j++) {
        const a = alumnos[i];
        const b = alumnos[j];

        // Check DNI match (if both have DNI and not empty)
        if (a.dni && b.dni && a.dni.trim() !== '' && a.dni.trim() === b.dni.trim()) {
          results.push({ student: b, duplicateOf: a, reason: `DNI idéntico: ${a.dni}` });
          continue;
        }

        // Check Full Name match (exact or very close)
        const nameA = `${a.apellido} ${a.nombre}`.trim().toLowerCase();
        const nameB = `${b.apellido} ${b.nombre}`.trim().toLowerCase();
        if (nameA === nameB && nameA.length > 3) {
          results.push({ student: b, duplicateOf: a, reason: `Nombre y apellido idénticos: ${a.apellido}, ${a.nombre}` });
        }
      }
    }

    return results;
  }
};
