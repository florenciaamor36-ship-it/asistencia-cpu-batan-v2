import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { archiveStudentRecord, createStudentEnrollment, isActiveEnrollment, isActiveStudent, isSameWorkerIdentity, markWorkersPresentForNewDate, mergeStudentDemographicsIntoRosterRow } from '../src/utils/attendance';
import { Student, Worker } from '../src/types';

const student: Student = {
  id: 'student-1', apellido: 'PEREZ', nombre: 'ANA', dni: '123', pabellon: '1',
  fecha_inscripcion: '', fecha_vencimiento_carnet: '', asist: { '2026-10-01': true }
};

describe('data-preserving roster updates', () => {
  it('updates demographics without replacing subject attendance or enrollment status', () => {
    const rosterRow: Student = {
      ...student, pabellon: '2', asist: { '2026-09-01': 'justificado' }, estado_inscripcion: 'historico'
    };
    const changed = mergeStudentDemographicsIntoRosterRow(rosterRow, { ...student, pabellon: '3', asist: {} });
    assert.equal(changed.pabellon, '3');
    assert.deepEqual(changed.asist, { '2026-09-01': 'justificado' });
    assert.equal(changed.estado_inscripcion, 'historico');
  });

  it('starts enrollment with an empty attendance map and explicit active status', () => {
    const enrolled = createStudentEnrollment(student);
    assert.deepEqual(enrolled.asist, {});
    assert.equal(enrolled.estado_inscripcion, 'inscripto');
    assert.equal(student.asist['2026-10-01'], true);
  });

  it('keeps withdrawn and historical enrollments inactive without deleting their row', () => {
    assert.equal(isActiveEnrollment({ ...student, estado_inscripcion: 'no_inscripto' }), false);
    assert.equal(isActiveEnrollment({ ...student, estado_inscripcion: 'historico' }), false);
    assert.equal(isActiveEnrollment({ ...student, estado_inscripcion: 'pendiente' }), true);
    assert.equal(isActiveEnrollment(student), true); // legacy roster rows
  });

  it('archives student records instead of deleting roster and attendance history', () => {
    const data = { materias: [{ id: 'subject-1', nombre: 'Taller', dias: [], horario: '', fechas: ['2026-10-01'], alumnos: [{ ...student, asist: { '2026-10-01': true } }] }], alumnos: [student], trabajadores: [] };
    const archived = archiveStudentRecord(data, student.id);
    assert.equal(archived.alumnos.length, 1);
    assert.equal(isActiveStudent(archived.alumnos[0]), false);
    assert.equal(archived.materias[0].alumnos.length, 1);
    assert.equal(archived.materias[0].alumnos[0].estado_inscripcion, 'historico');
    assert.deepEqual(archived.materias[0].alumnos[0].asist, { '2026-10-01': true });
  });

  it('recognizes an existing worker snapshot by stable ID after name and DNI changes', () => {
    const worker: Worker = { id: student.id, apellido: 'GARCIA', nombre: 'ANA', dni: '999', pabellon: '', puesto: '', vencimiento_carnet: '' };
    assert.equal(isSameWorkerIdentity(student, worker), true);
    const result = markWorkersPresentForNewDate([student], [worker], '2026-10-02');
    assert.equal(result.length, 1);
    assert.equal(result[0].asist['2026-10-02'], true);
  });

  it('does not confuse people whose names match but whose known DNI values differ', () => {
    const worker: Worker = {
      id: 'worker-1', apellido: student.apellido, nombre: student.nombre, dni: '999',
      pabellon: '', puesto: '', vencimiento_carnet: ''
    };
    assert.equal(isSameWorkerIdentity(student, worker), false);
    const result = markWorkersPresentForNewDate([student], [worker], '2026-10-02');
    assert.equal(result[0].asist['2026-10-02'], undefined);
    assert.equal(result.length, 2);
    assert.equal(result[1].id, worker.id);
  });
});
