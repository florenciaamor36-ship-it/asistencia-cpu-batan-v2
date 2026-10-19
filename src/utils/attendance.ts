import { Student, Worker } from '../types';

const normalizePerson = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

function isSamePerson(student: Student, worker: Worker): boolean {
  const studentDni = normalizePerson(student.dni);
  const workerDni = normalizePerson(worker.dni);
  if (studentDni && workerDni && studentDni === workerDni) return true;

  const studentName = `${normalizePerson(student.apellido)}${normalizePerson(student.nombre)}`;
  const workerName = `${normalizePerson(worker.apellido)}${normalizePerson(worker.nombre)}`;
  return Boolean(studentName && workerName && studentName === workerName);
}

/**
 * Snapshot the current worker roster for one newly created class date.
 * Existing attendance keys and all non-worker students remain unchanged.
 */
export function markWorkersPresentForNewDate(
  students: Student[],
  workers: Worker[],
  date: string
): Student[] {
  const result = students.map(student => {
    if (!workers.some(worker => isSamePerson(student, worker))) return student;
    return { ...student, asist: { ...(student.asist || {}), [date]: true } };
  });

  const missingWorkers = workers
    .filter(worker => !result.some(student => isSamePerson(student, worker)))
    .map(worker => ({
      id: worker.id,
      apellido: worker.apellido,
      nombre: worker.nombre,
      dni: worker.dni,
      pabellon: worker.pabellon || '',
      fecha_inscripcion: '',
      fecha_vencimiento_carnet: worker.vencimiento_carnet || '',
      asist: { [date]: true },
      observaciones: 'Trabajador CPU Batán - asistencia automática'
    }));

  return [...result, ...missingWorkers];
}
