export type AttendanceStatus = 'presente' | 'ausente' | 'justificado' | 'sin_marcar' | true | false | '';

export interface Student {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  pabellon: string;
  fecha_inscripcion: string;
  fecha_vencimiento_carnet: string;
  asist: Record<string, boolean | string>; // date string -> status/boolean
  observaciones?: string;
  materias?: string[]; // subject IDs or names
}

export interface Subject {
  id: string;
  nombre: string;
  dias: string[];
  horario: string;
  fechas: string[];
  alumnos: Student[];
}

export interface Worker {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  pabellon: string;
  puesto: string;
  vencimiento_carnet: string;
  observaciones?: string;
}

export interface AppData {
  materias: Subject[];
  alumnos: Student[];
  trabajadores: Worker[];
  version?: number;
  last_updated?: string;
}

export type ViewMode = 'dashboard' | 'matricula' | 'materias' | 'asistencia' | 'trabajadores' | 'estadisticas' | 'respaldo' | 'acerca';
