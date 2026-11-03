import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { attendanceValueForDate } from '../src/utils/dates';
import { setAttendanceForDate, nextMatrixAttendance } from '../src/utils/attendanceWrites';
import { attendanceDisabled } from '../src/utils/attendanceAccess';

describe('attendance editing regression cases (isolated fixtures)', () => {
  it('enables admin attendance actions for pending Estudio Bíblico rows without promoting enrollment', () => {
    const pending = { id: 'pending-1', estado_inscripcion: 'pendiente', asist: {} as Record<string, boolean | string> };
    assert.equal(attendanceDisabled('admin'), false);
    assert.equal(attendanceDisabled('espectador'), true);
    pending.asist = setAttendanceForDate(pending.asist, '2026-11-03', true);
    assert.equal(pending.asist['2026-11-03'], true);
    assert.equal(pending.estado_inscripcion, 'pendiente');
  });

  it('cycles matrix states and clears the canonical day after justified', () => {
    assert.equal(nextMatrixAttendance(undefined), true);
    assert.equal(nextMatrixAttendance(true), false);
    assert.equal(nextMatrixAttendance(false), 'justificado');
    assert.equal(nextMatrixAttendance('justificado'), undefined);
  });

  it('reads old date formats and writes a single canonical key without touching other dates', () => {
    const previous = { '03/11/2026': 'ausente', '2026-11-03': true, '2026-11-04': false };
    assert.equal(attendanceValueForDate(previous, '2026-11-03'), 'ausente');
    const updated = setAttendanceForDate(previous, '2026-11-03', 'justificado');
    assert.deepEqual(updated, { '2026-11-04': false, '2026-11-03': 'justificado' });
    assert.deepEqual(previous, { '03/11/2026': 'ausente', '2026-11-03': true, '2026-11-04': false });
  });
});
