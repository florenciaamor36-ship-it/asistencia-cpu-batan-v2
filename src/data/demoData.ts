import { AppData } from '../types';

/** Datos sintéticos para una vista pública de prueba. Nunca cargar ni persistir datos reales en modo demo. */
export function createDemoData(): AppData {
  const fechas = ['2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24'];
  const alumnos = [
    { id: 'demo-alumno-01', apellido: 'Pérez', nombre: 'Alma Demo', dni: '00000001', pabellon: 'A', fecha_inscripcion: '2026-08-01', fecha_vencimiento_carnet: '2027-08-01', estado: 'activo', materias: ['demo-materia-1', 'demo-materia-2'], asist: {} },
    { id: 'demo-alumno-02', apellido: 'Gómez', nombre: 'Bruno Demo', dni: '00000002', pabellon: 'B', fecha_inscripcion: '2026-08-04', fecha_vencimiento_carnet: '2027-08-04', estado: 'activo', materias: ['demo-materia-1'], asist: {} },
    { id: 'demo-alumno-03', apellido: 'López', nombre: 'Cata Demo', dni: '00000003', pabellon: 'C', fecha_inscripcion: '2026-08-06', fecha_vencimiento_carnet: '2026-12-02', estado: 'activo', materias: ['demo-materia-1', 'demo-materia-2'], asist: {} },
    { id: 'demo-alumno-04', apellido: 'Díaz', nombre: 'Damián Demo', dni: '00000004', pabellon: 'A', fecha_inscripcion: '2026-08-08', fecha_vencimiento_carnet: '2027-08-08', estado: 'activo', materias: ['demo-materia-2'], asist: {} },
    { id: 'demo-alumno-05', apellido: 'Ruiz', nombre: 'Eva Demo', dni: '00000005', pabellon: 'B', fecha_inscripcion: '2026-08-11', fecha_vencimiento_carnet: '2027-08-11', estado: 'activo', materias: ['demo-materia-1'], asist: {} }
  ];
  const attendance = [
    { '2026-11-03': true, '2026-11-10': true, '2026-11-17': true, '2026-11-24': true },
    { '2026-11-03': true, '2026-11-10': false, '2026-11-17': true, '2026-11-24': true },
    { '2026-11-03': true, '2026-11-10': 'justificado', '2026-11-17': true, '2026-11-24': true },
    { '2026-11-03': true, '2026-11-10': true, '2026-11-17': false, '2026-11-24': true },
    { '2026-11-03': false, '2026-11-10': true, '2026-11-17': true, '2026-11-24': true }
  ];
  const trabajadores = [
    { id: 'demo-trabajador-01', apellido: 'Fernández', nombre: 'Alex Demo', dni: '99999991', pabellon: 'CPU', puesto: 'Personal', vencimiento_carnet: '2027-12-31' },
    { id: 'demo-trabajador-02', apellido: 'Sosa', nombre: 'Nico Demo', dni: '99999992', pabellon: 'CPU', puesto: 'Personal', vencimiento_carnet: '2027-12-31' }
  ];
  const copy = (indices: number[]) => indices.map(index => ({
    ...alumnos[index],
    materias: [...(alumnos[index].materias || [])],
    asist: { ...attendance[index] }
  }));
  return {
    version: 1,
    last_updated: '2026-11-24T12:00:00.000Z',
    alumnos: alumnos.map(student => ({ ...student, materias: [...(student.materias || [])] })),
    trabajadores,
    materias: [
      { id: 'demo-materia-1', nombre: 'Taller de ejemplo', dias: ['Martes'], horario: '10:00 a 12:00', fechas: [...fechas], alumnos: copy([0, 1, 2, 4]) },
      { id: 'demo-materia-2', nombre: 'Materia de muestra', dias: ['Jueves'], horario: '14:00 a 16:00', fechas: [...fechas.slice(0, 3)], alumnos: copy([0, 2, 3]) }
    ]
  };
}
