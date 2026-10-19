import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { latestDateChronologically, sameCalendarDate, sortDatesChronologically } from '../src/utils/dates';
import { markWorkersPresentForAllDates, markWorkersPresentForNewDate } from '../src/utils/attendance';
import { Student, Worker } from '../src/types';

describe('date ordering and worker attendance snapshots', () => {
  it('sorts mixed date formats chronologically without removing duplicates or invalid values', () => {
    const input = ['13/10/2026', '2026-06-30', '1/7/2026', '2026-10-02', 'bad', '30/06/2026'];
    assert.deepEqual(sortDatesChronologically(input), [
      '2026-06-30', '30/06/2026', '1/7/2026', '2026-10-02', '13/10/2026', 'bad'
    ]);
    assert.equal(latestDateChronologically(input), '13/10/2026');
    assert.equal(sameCalendarDate('1/7/2026', '2026-07-01'), true);
  });

  it('marks the current worker roster only on a new date and preserves historical attendance', () => {
    const students: Student[] = [
      {
        id: 'student-1', apellido: 'PEREZ', nombre: 'ANA', dni: '123', pabellon: '',
        fecha_inscripcion: '', fecha_vencimiento_carnet: '', asist: { '2026-06-30': false }
      },
      {
        id: 'student-2', apellido: 'LOPEZ', nombre: 'LUIS', dni: '456', pabellon: '',
        fecha_inscripcion: '', fecha_vencimiento_carnet: '', asist: { '2026-06-30': 'justificado' }
      }
    ];
    const workers: Worker[] = [
      { id: 'worker-1', apellido: 'PEREZ', nombre: 'ANA', dni: '123', pabellon: '', puesto: '', vencimiento_carnet: '' },
      { id: 'worker-2', apellido: 'GOMEZ', nombre: 'MARTA', dni: '789', pabellon: '', puesto: '', vencimiento_carnet: '' }
    ];

    const result = markWorkersPresentForNewDate(students, workers, '2026-10-13');
    assert.equal(result.length, 3);
    assert.equal(result[0].asist['2026-06-30'], false);
    assert.equal(result[0].asist['2026-10-13'], true);
    assert.equal(result[1], students[1]);
    assert.equal(result[1].asist['2026-06-30'], 'justificado');
    assert.equal(result[1].asist['2026-10-13'], undefined);
    assert.equal(result[2].id, 'worker-2');
    assert.equal(result[2].asist['2026-10-13'], true);
  });

  it('marks current workers present across all existing dates when the roster changes', () => {
    const students: Student[] = [
      {
        id: 'student-1', apellido: 'PEREZ', nombre: 'ANA', dni: '123', pabellon: '',
        fecha_inscripcion: '', fecha_vencimiento_carnet: '', asist: { '2026-06-30': false }
      },
      {
        id: 'student-2', apellido: 'LOPEZ', nombre: 'LUIS', dni: '456', pabellon: '',
        fecha_inscripcion: '', fecha_vencimiento_carnet: '', asist: { '2026-06-30': 'justificado' }
      }
    ];
    const workers: Worker[] = [
      { id: 'worker-1', apellido: 'PEREZ', nombre: 'ANA', dni: '123', pabellon: '', puesto: '', vencimiento_carnet: '' },
      { id: 'worker-2', apellido: 'GOMEZ', nombre: 'MARTA', dni: '789', pabellon: '', puesto: '', vencimiento_carnet: '' }
    ];

    const result = markWorkersPresentForAllDates(students, workers, ['2026-06-30', '2026-10-13']);
    assert.equal(result[0].asist['2026-06-30'], true);
    assert.equal(result[0].asist['2026-10-13'], true);
    assert.equal(result[1], students[1]);
    const addedWorker = result.find(student => student.id === 'worker-2');
    assert.ok(addedWorker);
    assert.equal(addedWorker.asist['2026-06-30'], true);
    assert.equal(addedWorker.asist['2026-10-13'], true);
  });

});

