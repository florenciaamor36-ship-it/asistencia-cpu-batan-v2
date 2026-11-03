import { AppData, Student, Worker, Subject } from '../types';
import { attendanceValueForDate } from './dates';

const normalizePerson = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const normalizeSubjectName = (value: unknown) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function isStudyBibleSubject(subject: Pick<Subject, 'nombre'>): boolean {
  return normalizeSubjectName(subject.nombre) === 'estudio biblico';
}

export function isSameWorkerIdentity(student: Student, worker: Worker): boolean {
  // Auto-created roster snapshots use the worker's stable ID; retain identity across name/DNI edits.
  if (student.id && worker.id && student.id === worker.id) return true;
  const studentDni = normalizePerson(student.dni);
  const workerDni = normalizePerson(worker.dni);
  if (studentDni && workerDni) return studentDni === workerDni;
  const studentName = `${normalizePerson(student.apellido)}${normalizePerson(student.nombre)}`;
  const workerName = `${normalizePerson(worker.apellido)}${normalizePerson(worker.nombre)}`;
  return Boolean(studentName && workerName && studentName === workerName);
}

export function isWorkerRosterRow(student: Student, workers: Worker[] = []): boolean {
  return workers.some(worker => isSameWorkerIdentity(student, worker));
}

/** In Estudio Bíblico, pending/unconfirmed and archived rows are not part of attendance counts. */
export function isAttendanceEligibleStudent(subject: Subject, student: Student, workers: Worker[] = []): boolean {
  if (!isStudyBibleSubject(subject)) return true;
  return isWorkerRosterRow(student, workers) || student.estado_inscripcion === 'inscripto';
}

export interface AttendanceSummary {
  presentes: number;
  ausentes: number;
  justificados: number;
  sinMarcar: number;
  posibles: number;
  marcados: number;
  porcentaje: number;
}

/** Uses each registered class date as one opportunity; unmarked remains explicit in the denominator. */
export function summarizeAttendance(subject: Subject, workers: Worker[] = []): AttendanceSummary {
  const summary: AttendanceSummary = { presentes: 0, ausentes: 0, justificados: 0, sinMarcar: 0, posibles: 0, marcados: 0, porcentaje: 0 };
  const eligible = subject.alumnos.filter(student => isAttendanceEligibleStudent(subject, student, workers));
  for (const date of subject.fechas || []) {
    for (const student of eligible) {
      summary.posibles++;
      const value = attendanceValueForDate(student.asist, date);
      if (value === true || value === 'presente') summary.presentes++;
      else if (value === false || value === 'ausente') summary.ausentes++;
      else if (value === 'justificado') summary.justificados++;
      else summary.sinMarcar++;
    }
  }
  summary.marcados = summary.presentes + summary.ausentes + summary.justificados;
  summary.porcentaje = summary.posibles ? Math.round(summary.presentes / summary.posibles * 100) : 0;
  return summary;
}

/** Snapshot the current worker roster for one newly created class date. */
export function markWorkersPresentForNewDate(students: Student[], workers: Worker[], date: string): Student[] {
  const result = students.map(student => {
    if (!workers.some(worker => isSameWorkerIdentity(student, worker))) return student;
    return { ...student, asist: { ...(student.asist || {}), [date]: true } };
  });
  const missingWorkers = workers.filter(worker => !result.some(student => isSameWorkerIdentity(student, worker))).map(worker => ({
    id: worker.id, apellido: worker.apellido, nombre: worker.nombre, dni: worker.dni, pabellon: worker.pabellon || '',
    fecha_inscripcion: '', fecha_vencimiento_carnet: worker.vencimiento_carnet || '', asist: { [date]: true },
    observaciones: 'Trabajador CPU Batán - asistencia automática'
  }));
  return [...result, ...missingWorkers];
}

export function markWorkersPresentForAllDates(students: Student[], workers: Worker[], dates: string[]): Student[] {
  return dates.reduce((currentStudents, date) => markWorkersPresentForNewDate(currentStudents, workers, date), students);
}

/** A new subject starts with workers only; students enroll explicitly. */
export function createInitialSubjectRoster(workers: Worker[], date: string): Student[] {
  return markWorkersPresentForNewDate([], workers, date);
}

export function mergeStudentDemographicsIntoRosterRow(row: Student, student: Student): Student {
  return { ...row, ...student, id: row.id, asist: row.asist || {}, estado_inscripcion: row.estado_inscripcion };
}

export function createStudentEnrollment(student: Student): Student {
  return { ...student, asist: {}, estado_inscripcion: 'inscripto' };
}

export function isActiveEnrollment(student: Student): boolean {
  return student.estado_inscripcion !== 'no_inscripto' && student.estado_inscripcion !== 'historico';
}

export function archiveStudentRecord(data: AppData, studentId: string): AppData {
  return {
    ...data,
    alumnos: data.alumnos.map(student => student.id === studentId ? { ...student, estado: 'inactivo' } : student),
    materias: data.materias.map(subject => ({ ...subject, alumnos: subject.alumnos.map(student => student.id === studentId
      ? { ...student, estado_inscripcion: 'historico' } : student) }))
  };
}

export function isActiveStudent(student: Student): boolean {
  return student.estado !== 'inactivo';
}
