import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { attendanceValueForDate, latestDateChronologically, sameCalendarDate, sortDatesChronologically } from '../src/utils/dates';
import { createInitialSubjectRoster, isAttendanceEligibleStudent, markWorkersPresentForAllDates, markWorkersPresentForNewDate, summarizeAttendance } from '../src/utils/attendance';
import { Student, Subject, Worker } from '../src/types';

const student = (id: string, asist: Record<string, boolean | string> = {}, estado_inscripcion?: Student['estado_inscripcion']): Student => ({
  id, apellido: 'PEREZ', nombre: 'ANA', dni: id, pabellon: '', fecha_inscripcion: '', fecha_vencimiento_carnet: '', asist, estado_inscripcion
});
const subject = (nombre: string, alumnos: Student[], fechas: string[]): Subject => ({ id: 's1', nombre, dias: [], horario: '', fechas, alumnos });

describe('date ordering and worker attendance snapshots', () => {
  it('sorts mixed date formats chronologically without removing duplicates or invalid values', () => {
    const input = ['13/10/2026', '2026-06-30', '1/7/2026', '2026-10-02', 'bad', '30/06/2026'];
    assert.deepEqual(sortDatesChronologically(input), ['2026-06-30', '30/06/2026', '1/7/2026', '2026-10-02', '13/10/2026', 'bad']);
    assert.equal(latestDateChronologically(input), '13/10/2026');
    assert.equal(sameCalendarDate('1/7/2026', '2026-07-01'), true);
  });

  it('reads legacy attendance keys through ISO and DD/MM/YYYY dates without rewriting fixtures', () => {
    const fixture = { '03/11/2026': 'justificado' };
    assert.equal(attendanceValueForDate(fixture, '2026-11-03'), 'justificado');
    assert.equal(attendanceValueForDate({ '2026-11-03': true }, '3/11/2026'), true);
    assert.deepEqual(fixture, { '03/11/2026': 'justificado' });
  });

  it('counts present, absent, justified and unmarked against eligible dates; justified is not present', () => {
    const roster = [student('a', { '03/11/2026': true }, 'inscripto'), student('b', { '2026-11-03': false }, 'inscripto'), student('c', { '2026-11-03': 'justificado' }, 'inscripto'), student('d', {}, 'inscripto')];
    const stats = summarizeAttendance(subject('Taller', roster, ['2026-11-03']), []);
    assert.deepEqual(stats, { presentes: 1, ausentes: 1, justificados: 1, sinMarcar: 1, posibles: 4, marcados: 3, porcentaje: 25 });
  });

  it('uses the same Estudio Bíblico enrollment eligibility in summary and attendance row helper', () => {
    const roster = [student('ok', { '03/11/2026': true }, 'inscripto'), student('pending', { '2026-11-03': true }, 'pendiente'), student('archived', { '2026-11-03': true }, 'historico'), student('none', {}, 'no_inscripto')];
    const bible = subject('Estudio Bíblico', roster, ['2026-11-03']);
    assert.deepEqual(roster.map(row => isAttendanceEligibleStudent(bible, row)), [true, false, false, false]);
    assert.deepEqual(summarizeAttendance(bible), { presentes: 1, ausentes: 0, justificados: 0, sinMarcar: 0, posibles: 1, marcados: 1, porcentaje: 100 });
  });

  it('marks the current worker roster only on a new date and preserves historical attendance', () => {
    const students: Student[] = [student('student-1', { '2026-06-30': false }), student('student-2', { '2026-06-30': 'justificado' })];
    const workers: Worker[] = [
      { id: 'student-1', apellido: 'PEREZ', nombre: 'ANA', dni: '123', pabellon: '', puesto: '', vencimiento_carnet: '' },
      { id: 'worker-2', apellido: 'GOMEZ', nombre: 'MARTA', dni: '789', pabellon: '', puesto: '', vencimiento_carnet: '' }
    ];
    const result = markWorkersPresentForNewDate(students, workers, '2026-10-13');
    assert.equal(result.length, 3);
    assert.equal(result[0].asist['2026-06-30'], false);
    assert.equal(result[0].asist['2026-10-13'], true);
    assert.equal(result[1].asist['2026-06-30'], 'justificado');
    assert.equal(result[1].asist['2026-10-13'], undefined);
    assert.equal(result[2].id, 'worker-2');
  });

  it('marks current workers present across existing dates and starts new subjects with workers only', () => {
    const workers: Worker[] = [{ id: 'worker-1', apellido: 'GOMEZ', nombre: 'MARTA', dni: '789', pabellon: '', puesto: '', vencimiento_carnet: '' }];
    const all = markWorkersPresentForAllDates([], workers, ['2026-06-30', '2026-10-13']);
    assert.equal(all[0].asist['2026-06-30'], true);
    assert.equal(all[0].asist['2026-10-13'], true);
    const roster = createInitialSubjectRoster(workers, '2026-10-19');
    assert.equal(roster.length, 1);
    assert.equal(roster[0].id, 'worker-1');
  });
});
