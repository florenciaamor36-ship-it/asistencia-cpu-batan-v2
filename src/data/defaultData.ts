import { AppData } from '../types';

export const INITIAL_DATA: AppData = {
  version: 1,
  last_updated: new Date().toISOString(),
  materias: [
    {
      id: "mat_1",
      nombre: "Alfabetización y Terminativa Primaria",
      dias: ["Lunes", "Miércoles"],
      horario: "09:00 a 11:00",
      fechas: ["2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23", "2026-03-30", "2026-04-06"],
      alumnos: [
        {
          id: "alu_101",
          apellido: "GARCÍA",
          nombre: "CARLOS ALBERTO",
          dni: "32456789",
          pabellon: "Pabellón 4",
          fecha_inscripcion: "2026-02-15",
          fecha_vencimiento_carnet: "2026-11-30",
          asist: {
            "2026-03-02": true,
            "2026-03-09": true,
            "2026-03-16": false,
            "2026-03-23": true,
            "2026-03-30": "justificado",
            "2026-04-06": true
          },
          observaciones: "Muy buen compromiso con el estudio."
        },
        {
          id: "alu_102",
          apellido: "PEREYRA",
          nombre: "ESTEBAN DANIEL",
          dni: "35123456",
          pabellon: "Pabellón 2",
          fecha_inscripcion: "2026-02-20",
          fecha_vencimiento_carnet: "2026-08-15",
          asist: {
            "2026-03-02": true,
            "2026-03-09": false,
            "2026-03-16": true,
            "2026-03-23": true,
            "2026-03-30": true,
            "2026-04-06": false
          },
          observaciones: "Requiere apoyo en lectura."
        },
        {
          id: "alu_103",
          apellido: "SÁNCHEZ",
          nombre: "LUCAS NAHUEL",
          dni: "38999888",
          pabellon: "Pabellón 4",
          fecha_inscripcion: "2026-03-01",
          fecha_vencimiento_carnet: "2026-12-10",
          asist: {
            "2026-03-02": true,
            "2026-03-09": true,
            "2026-03-16": true,
            "2026-03-23": true,
            "2026-03-30": true,
            "2026-04-06": true
          },
          observaciones: "Excelente asistencia."
        }
      ]
    },
    {
      id: "mat_2",
      nombre: "Talleres de Informática y Robótica",
      dias: ["Martes", "Jueves"],
      horario: "14:00 a 16:30",
      fechas: ["2026-03-03", "2026-03-10", "2026-03-17", "2026-03-24", "2026-03-31", "2026-04-07"],
      alumnos: [
        {
          id: "alu_101",
          apellido: "GARCÍA",
          nombre: "CARLOS ALBERTO",
          dni: "32456789",
          pabellon: "Pabellón 4",
          fecha_inscripcion: "2026-02-15",
          fecha_vencimiento_carnet: "2026-11-30",
          asist: {
            "2026-03-03": true,
            "2026-03-10": true,
            "2026-03-17": true,
            "2026-03-24": false,
            "2026-03-31": true,
            "2026-04-07": true
          },
          observaciones: "Muestra gran interés en programación básica."
        },
        {
          id: "alu_104",
          apellido: "GÓMEZ",
          nombre: "RODRIGO JAVIER",
          dni: "31789456",
          pabellon: "Pabellón 1",
          fecha_inscripcion: "2026-02-18",
          fecha_vencimiento_carnet: "2026-05-20",
          asist: {
            "2026-03-03": false,
            "2026-03-10": false,
            "2026-03-17": "justificado",
            "2026-03-24": true,
            "2026-03-31": true,
            "2026-04-07": true
          },
          observaciones: "Carnet próximo a vencer."
        }
      ]
    },
    {
      id: "mat_3",
      nombre: "Derechos Humanos y Ciudadanía",
      dias: ["Viernes"],
      horario: "10:00 a 12:00",
      fechas: ["2026-03-06", "2026-03-13", "2026-03-20", "2026-03-27", "2026-04-03"],
      alumnos: [
        {
          id: "alu_102",
          apellido: "PEREYRA",
          nombre: "ESTEBAN DANIEL",
          dni: "35123456",
          pabellon: "Pabellón 2",
          fecha_inscripcion: "2026-02-20",
          fecha_vencimiento_carnet: "2026-08-15",
          asist: {
            "2026-03-06": true,
            "2026-03-13": true,
            "2026-03-20": true,
            "2026-03-27": false,
            "2026-04-03": true
          },
          observaciones: "Participa activamente en los debates."
        },
        {
          id: "alu_105",
          apellido: "MARTÍNEZ",
          nombre: "MATÍAS EZEQUIEL",
          dni: "39444555",
          pabellon: "Pabellón 3",
          fecha_inscripcion: "2026-03-02",
          fecha_vencimiento_carnet: "2026-10-10",
          asist: {
            "2026-03-06": true,
            "2026-03-13": true,
            "2026-03-20": true,
            "2026-03-27": true,
            "2026-04-03": true
          },
          observaciones: "Sin observaciones."
        }
      ]
    },
    {
      id: "mat_4",
      nombre: "Cooperativa y Economía Social",
      dias: ["Miércoles"],
      horario: "15:00 a 17:00",
      fechas: ["2026-03-04", "2026-03-11", "2026-03-18", "2026-03-25", "2026-04-01"],
      alumnos: [
        {
          id: "alu_103",
          apellido: "SÁNCHEZ",
          nombre: "LUCAS NAHUEL",
          dni: "38999888",
          pabellon: "Pabellón 4",
          fecha_inscripcion: "2026-03-01",
          fecha_vencimiento_carnet: "2026-12-10",
          asist: {
            "2026-03-04": true,
            "2026-03-11": true,
            "2026-03-18": true,
            "2026-03-25": true,
            "2026-04-01": true
          },
          observaciones: "Colabora en la organización grupal."
        }
      ]
    },
    {
      id: "mat_5",
      nombre: "Educación Física y Recreación",
      dias: ["Martes", "Viernes"],
      horario: "08:30 a 10:00",
      fechas: ["2026-03-03", "2026-03-06", "2026-03-10", "2026-03-13", "2026-03-17", "2026-03-20"],
      alumnos: [
        {
          id: "alu_101",
          apellido: "GARCÍA",
          nombre: "CARLOS ALBERTO",
          dni: "32456789",
          pabellon: "Pabellón 4",
          fecha_inscripcion: "2026-02-15",
          fecha_vencimiento_carnet: "2026-11-30",
          asist: {
            "2026-03-03": true,
            "2026-03-06": true,
            "2026-03-10": false,
            "2026-03-13": true,
            "2026-03-17": true,
            "2026-03-20": true
          },
          observaciones: ""
        },
        {
          id: "alu_102",
          apellido: "PEREYRA",
          nombre: "ESTEBAN DANIEL",
          dni: "35123456",
          pabellon: "Pabellón 2",
          fecha_inscripcion: "2026-02-20",
          fecha_vencimiento_carnet: "2026-08-15",
          asist: {
            "2026-03-03": true,
            "2026-03-06": true,
            "2026-03-10": true,
            "2026-03-13": true,
            "2026-03-17": false,
            "2026-03-20": true
          },
          observaciones: ""
        },
        {
          id: "alu_104",
          apellido: "GÓMEZ",
          nombre: "RODRIGO JAVIER",
          dni: "31789456",
          pabellon: "Pabellón 1",
          fecha_inscripcion: "2026-02-18",
          fecha_vencimiento_carnet: "2026-05-20",
          asist: {
            "2026-03-03": true,
            "2026-03-06": true,
            "2026-03-10": true,
            "2026-03-13": true,
            "2026-03-17": true,
            "2026-03-20": true
          },
          observaciones: ""
        }
      ]
    },
    {
      id: "mat_6",
      nombre: "Taller de Lectura y Escritura Creativa",
      dias: ["Lunes", "Jueves"],
      horario: "16:00 a 18:00",
      fechas: ["2026-03-02", "2026-03-05", "2026-03-09", "2026-03-12", "2026-03-16"],
      alumnos: [
        {
          id: "alu_105",
          apellido: "MARTÍNEZ",
          nombre: "MATÍAS EZEQUIEL",
          dni: "39444555",
          pabellon: "Pabellón 3",
          fecha_inscripcion: "2026-03-02",
          fecha_vencimiento_carnet: "2026-10-10",
          asist: {
            "2026-03-02": true,
            "2026-03-05": true,
            "2026-03-09": true,
            "2026-03-12": false,
            "2026-03-16": true
          },
          observaciones: "Presentó cuentos propios muy buenos."
        }
      ]
    }
  ],
  alumnos: [
    {
      id: "alu_101",
      apellido: "GARCÍA",
      nombre: "CARLOS ALBERTO",
      dni: "32456789",
      pabellon: "Pabellón 4",
      fecha_inscripcion: "2026-02-15",
      fecha_vencimiento_carnet: "2026-11-30",
      asist: {},
      observaciones: "Muy buen compromiso con el estudio."
    },
    {
      id: "alu_102",
      apellido: "PEREYRA",
      nombre: "ESTEBAN DANIEL",
      dni: "35123456",
      pabellon: "Pabellón 2",
      fecha_inscripcion: "2026-02-20",
      fecha_vencimiento_carnet: "2026-08-15",
      asist: {},
      observaciones: "Requiere apoyo en lectura."
    },
    {
      id: "alu_103",
      apellido: "SÁNCHEZ",
      nombre: "LUCAS NAHUEL",
      dni: "38999888",
      pabellon: "Pabellón 4",
      fecha_inscripcion: "2026-03-01",
      fecha_vencimiento_carnet: "2026-12-10",
      asist: {},
      observaciones: "Excelente asistencia."
    },
    {
      id: "alu_104",
      apellido: "GÓMEZ",
      nombre: "RODRIGO JAVIER",
      dni: "31789456",
      pabellon: "Pabellón 1",
      fecha_inscripcion: "2026-02-18",
      fecha_vencimiento_carnet: "2026-05-20",
      asist: {},
      observaciones: "Carnet próximo a vencer."
    },
    {
      id: "alu_105",
      apellido: "MARTÍNEZ",
      nombre: "MATÍAS EZEQUIEL",
      dni: "39444555",
      pabellon: "Pabellón 3",
      fecha_inscripcion: "2026-03-02",
      fecha_vencimiento_carnet: "2026-10-10",
      asist: {},
      observaciones: "Participativo."
    }
  ],
  trabajadores: [
    {
      id: "trab_1",
      apellido: "RODRÍGUEZ",
      nombre: "MARCELO",
      dni: "25111222",
      pabellon: "Administración",
      puesto: "Coordinador General",
      vencimiento_carnet: "2026-12-31",
      observaciones: "Responsable de enlace institucional."
    },
    {
      id: "trab_2",
      apellido: "LÓPEZ",
      nombre: "CLAUDIA",
      dni: "28333444",
      pabellon: "Educación",
      puesto: "Docente Tutor",
      vencimiento_carnet: "2026-09-15",
      observaciones: "Tutora de Alfabetización."
    },
    {
      id: "trab_3",
      apellido: "FERNÁNDEZ",
      nombre: "PABLO",
      dni: "26555666",
      pabellon: "Talleres",
      puesto: "Instructor de Informática",
      vencimiento_carnet: "2026-10-20",
      observaciones: ""
    },
    {
      id: "trab_4",
      apellido: "GIMÉNEZ",
      nombre: "SILVIA",
      dni: "27888999",
      pabellon: "Coordinación",
      puesto: "Asistente Social",
      vencimiento_carnet: "2026-07-10",
      observaciones: ""
    },
    {
      id: "trab_5",
      apellido: "BENÍTEZ",
      nombre: "JORGE",
      dni: "24000111",
      pabellon: "Seguridad / Enlace",
      puesto: "Referente de Pabellones",
      vencimiento_carnet: "2026-11-05",
      observaciones: ""
    }
  ]
};
