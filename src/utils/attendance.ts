import { AppData, Student, Worker } from '../types';

const normalizePerson = (value: unknown): string => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

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
    if (!workers.some(worker => isSameWorkerIdentity(student, worker))) return student;
    return { ...student, asist: { ...(student.asist || {}), [date]: true } };
  });

  const missingWorkers = workers
    .filter(worker => !result.some(student => isSameWorkerIdentity(student, worker)))
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

/**
 * Reconcile the current worker roster across every date already registered
 * for a subject. Workers are always present; non-worker attendance is untouched.
 */
export function markWorkersPresentForAllDates(
  students: Student[],
  workers: Worker[],
  dates: string[]
): Student[] {
  return dates.reduce(
    (currentStudents, date) => markWorkersPresentForNewDate(currentStudents, workers, date),
    students
  );
}

/** A new subject starts with workers only; students enroll explicitly. */
export function createInitialSubjectRoster(workers: Worker[], date: string): Student[] {
  return markWorkersPresentForNewDate([], workers, date);
}


/**
 * Apply current registry demographics to a subject roster row without replacing
 * that subject's independently tracked attendance or enrollment state.
 */
export function mergeStudentDemographicsIntoRosterRow(row: Student, student: Student): Student {
  return {
    ...row,
    ...student,
    id: row.id,
    asist: row.asist || {},
    estado_inscripcion: row.estado_inscripcion
  };
}

/** Start an enrollment with no inherited, date-keyed attendance from another context. */
export function createStudentEnrollment(student: Student): Student {
  return { ...student, asist: {}, estado_inscripcion: 'inscripto' };
}


/** True unless a roster row was explicitly withdrawn or archived. Legacy rows remain active. */
export function isActiveEnrollment(student: Student): boolean {
  return student.estado_inscripcion !== 'no_inscripto' && student.estado_inscripcion !== 'historico';
}


/** Archive a registry entry without deleting its demographics or subject attendance history. */
export function archiveStudentRecord(data: AppData, studentId: string): AppData {
  return {
    ...data,
    alumnos: data.alumnos.map(student => student.id === studentId ? { ...student, estado: 'inactivo' } : student),
    materias: data.materias.map(subject => ({
      ...subject,
      alumnos: subject.alumnos.map(student => student.id === studentId
        ? { ...student, estado_inscripcion: 'historico' }
        : student)
    }))
  };
}

export function isActiveStudent(student: Student): boolean {
  return student.estado !== 'inactivo';
}
