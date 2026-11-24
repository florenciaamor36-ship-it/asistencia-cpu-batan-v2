import React from 'react';
import { AppData, ViewMode, Student } from '../types';
import { Activity, ArrowUpRight, BookOpen, BriefcaseBusiness, CalendarCheck, CalendarDays, CheckCircle2, ChevronRight, Clock3, GraduationCap, Plus, UserRoundCheck, UserRoundX, Users, type LucideIcon } from 'lucide-react';
import { attendanceValueForDate, latestDateChronologically } from '../utils/dates';
import { isAttendanceEligibleStudent, summarizeAttendance } from '../utils/attendance';

interface DemoOverviewProps {
  data: AppData;
  onSelectView: (view: ViewMode) => void;
  onSelectSubject: (id: string) => void;
}

type Counts = { present: number; absent: number; justified: number; unmarked: number; late: number };
const statusFor = (student: Student, date: string): keyof Counts => {
  const value = attendanceValueForDate(student.asist, date);
  if (value === true || value === 'presente') return 'present';
  if (value === false || value === 'ausente') return 'absent';
  if (value === 'justificado') return 'justified';
  if (value === 'tarde') return 'late';
  return 'unmarked';
};
const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : 'Sin fechas';

const DonutChart: React.FC<{ values: number[]; colors: string[]; total: number }> = ({ values, colors, total }) => {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  let consumed = 0;
  return <div className="ref-donut-wrap">
    <svg className="ref-donut" viewBox="0 0 140 140" role="img" aria-label={`Distribución de asistencia: ${total} registros`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(154,171,199,.13)" strokeWidth="18" />
      {values.map((value, i) => {
        const length = total ? (value / total) * circumference : 0;
        const offset = consumed;
        consumed += length;
        return value > 0 ? <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={colors[i]} strokeWidth="18" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} strokeLinecap="round" transform="rotate(-90 70 70)" /> : null;
      })}
      <text x="70" y="66" textAnchor="middle" className="ref-donut-total">{total}</text>
      <text x="70" y="84" textAnchor="middle" className="ref-donut-label">registros</text>
    </svg>
  </div>;
};

const StatCard: React.FC<{ label: string; value: string | number; note: string; icon: LucideIcon; color: string }> = ({ label, value, note, icon: Icon, color }) => <article className="ref-stat-card">
  <div className="ref-stat-main"><div><p className="ref-stat-label">{label}</p><p className="ref-stat-value">{value}</p><p className="ref-stat-note">{note}</p></div><span className={`ref-stat-icon ${color}`}><Icon size={18} /></span></div>
</article>;

export const DemoOverview: React.FC<DemoOverviewProps> = ({ data, onSelectView, onSelectSubject }) => {
  const allDates = data.materias.flatMap(subject => subject.fechas || []);
  const latestDate = latestDateChronologically(allDates);
  const dateLabel = formatDate(latestDate);
  const todayCounts: Counts = { present: 0, absent: 0, justified: 0, unmarked: 0, late: 0 };
  for (const subject of data.materias) {
    const date = latestDateChronologically(subject.fechas || []);
    if (!date) continue;
    for (const student of subject.alumnos || []) {
      if (!isAttendanceEligibleStudent(subject, student, data.trabajadores || [])) continue;
      todayCounts[statusFor(student, date)] += 1;
    }
  }
  const totalToday = Object.values(todayCounts).reduce((a, b) => a + b, 0);
  const totalStudents = data.alumnos.length;
  const average = data.materias.length ? Math.round(data.materias.reduce((n, s) => n + summarizeAttendance(s, data.trabajadores || []).porcentaje, 0) / data.materias.length) : 0;
  const subjects = data.materias.map((subject, index) => {
    const summary = summarizeAttendance(subject, data.trabajadores || []);
    return { subject, summary, index, latest: latestDateChronologically(subject.fechas || []) };
  });
  const maxRoster = Math.max(1, ...subjects.map(item => item.subject.alumnos.length));
  const actions = [
    { title: 'Registrar asistencia', description: 'Abrir una lista de materia', icon: CalendarCheck, view: 'asistencia' as ViewMode, subject: data.materias[0]?.id, tone: 'cyan' },
    { title: 'Ver matrícula', description: 'Buscar y revisar alumnos', icon: Users, view: 'matricula' as ViewMode, tone: 'purple' },
    { title: 'Gestionar materias', description: 'Cursos, horarios y nóminas', icon: BookOpen, view: 'materias' as ViewMode, tone: 'green' },
    { title: 'Personal CPU', description: 'Consultar trabajadores', icon: BriefcaseBusiness, view: 'trabajadores' as ViewMode, tone: 'yellow' }
  ];
  const activity = [
    ...subjects.slice(0, 3).map(({ subject, summary, latest }) => ({
      module: 'Asistencia', title: `Lista · ${subject.nombre}`, detail: `${summary.presentes} presentes de ${summary.posibles} registros posibles`, when: `Última clase · ${formatDate(latest)}`, subjectId: subject.id, tone: 'cyan'
    })),
    { module: 'Matrícula', title: 'Padrón institucional', detail: `${totalStudents} alumnos de ejemplo · ${data.trabajadores.length} trabajadores`, when: 'Datos ficticios para explorar la interfaz', subjectId: '', tone: 'purple' }
  ];
  const distributionColors = ['#22d3ee', '#a855f7', '#4ade80', '#facc15', '#fb7185'];
  const allStatus = [todayCounts.present, todayCounts.absent, todayCounts.late, todayCounts.justified + todayCounts.unmarked];
  const statCards = [
    { label: 'Alumnos en padrón', value: totalStudents, note: 'Matrícula institucional', icon: Users, color: 'cyan' },
    { label: 'Trabajadores CPU', value: data.trabajadores.length, note: 'Personal institucional', icon: BriefcaseBusiness, color: 'purple' },
    { label: 'Presentes · última clase', value: todayCounts.present, note: `${percent(todayCounts.present, totalToday)}% de ${totalToday} registros · ${dateLabel}`, icon: UserRoundCheck, color: 'green' },
    { label: 'Ausencias · última clase', value: todayCounts.absent, note: `${todayCounts.justified} justificadas · ${todayCounts.unmarked} sin marcar`, icon: UserRoundX, color: 'red' },
    { label: 'Materias y talleres', value: data.materias.length, note: 'Nóminas por materia', icon: BookOpen, color: 'blue' },
    { label: 'Clases registradas', value: allDates.length, note: 'Fechas cargadas en las materias', icon: CalendarDays, color: 'yellow' },
    { label: 'Asistencia promedio', value: `${average}%`, note: 'Cálculo por materia', icon: Activity, color: 'green' },
    { label: 'Registros del período', value: subjects.reduce((sum, x) => sum + x.summary.marcados, 0), note: 'Presentes, ausentes y justificados', icon: CheckCircle2, color: 'purple' }
  ];

  return <div className="ref-dashboard">
    <section className="ref-stats-grid" aria-label="Indicadores institucionales">{statCards.map(card => <StatCard key={card.label} {...card} />)}</section>

    <section className="ref-dashboard-layout">
      <div className="ref-dashboard-left">
        <div className="ref-charts-grid">
          <article className="ref-chart-card">
            <div className="ref-card-heading"><div><h2>Asistencia · última clase</h2><p>Presentes, ausentes, tardanzas y otros registros.</p></div><span className="ref-badge">{dateLabel}</span></div>
            <div className="ref-attendance-chart"><DonutChart values={allStatus} colors={['#4ade80', '#fb7185', '#facc15', '#94a3b8']} total={totalToday} />
              <div className="ref-legend">{[
                ['Presentes', todayCounts.present, '#4ade80'], ['Ausentes', todayCounts.absent, '#fb7185'], ['Tarde', todayCounts.late, '#facc15'], ['Justificados / sin marcar', todayCounts.justified + todayCounts.unmarked, '#94a3b8']
              ].map(([label, value, color]) => <div className="ref-legend-item" key={String(label)}><span className="ref-legend-dot" style={{ backgroundColor: String(color) }} /><span>{label}</span><strong>{value}</strong></div>)}</div>
            </div>
          </article>

          <article className="ref-chart-card">
            <div className="ref-card-heading"><div><h2>Alumnos por materia</h2><p>Distribución de los registros en las nóminas.</p></div><span className="ref-badge">{subjects.length} listas</span></div>
            <div className="ref-bar-chart">
              {subjects.length ? subjects.map(({ subject }, i) => <button key={subject.id} type="button" className="ref-bar-row" onClick={() => { onSelectSubject(subject.id); onSelectView('asistencia'); }}>
                <span className="ref-bar-label">{subject.nombre}</span><span className="ref-bar-track"><span className="ref-bar-fill" style={{ width: `${Math.max(6, subject.alumnos.length / maxRoster * 100)}%`, background: distributionColors[i % distributionColors.length] }} /></span><strong>{subject.alumnos.length}</strong>
              </button>) : <div className="ref-empty-chart">No hay listas para mostrar todavía.</div>}
              <div className="ref-chart-footnote"><span className="ref-chart-footnote-dot" /> Alumnos cargados en cada materia</div>
            </div>
          </article>
        </div>

        <article className="ref-panel ref-activity-panel">
          <div className="ref-card-heading"><div><h2>Actividad reciente</h2><p>Últimos movimientos de las listas de asistencia.</p></div><span className="ref-icon-chip"><Activity size={16} /></span></div>
          <div className="ref-activity-list">{activity.map((item, i) => <button type="button" key={`${item.title}-${i}`} className="ref-activity-item" onClick={() => item.subjectId ? (onSelectSubject(item.subjectId), onSelectView('asistencia')) : onSelectView('matricula')}>
            <span className={`ref-activity-mark ${item.tone}`}><span /></span><span className="ref-activity-copy"><span className="ref-activity-title">{item.module} <span>·</span> {item.title}</span><span className="ref-activity-detail">{item.detail}</span><span className="ref-activity-time"><Clock3 size={12} /> {item.when}</span></span><ChevronRight size={16} className="ref-activity-chevron" />
          </button>)}</div>
        </article>

        <article className="ref-panel ref-subjects-panel">
          <div className="ref-card-heading"><div><h2>Materias y talleres</h2><p>Acceso directo a las nóminas y al registro de clases.</p></div><button type="button" className="ref-text-action" onClick={() => onSelectView('materias')}>Ver materias <ArrowUpRight size={14} /></button></div>
          <div className="ref-subject-grid">{subjects.map(({ subject, summary, latest, index }) => <button type="button" key={subject.id} className="ref-subject-card" onClick={() => { onSelectSubject(subject.id); onSelectView('asistencia'); }}>
            <span className="ref-subject-card-top"><span className="ref-subject-card-icon" style={{ color: distributionColors[index % distributionColors.length] }}><BookOpen size={17} /></span><span className="ref-subject-percentage">{summary.porcentaje}%</span></span>
            <strong>{subject.nombre}</strong><span className="ref-subject-meta">{subject.dias?.join(', ') || 'Día no especificado'}{subject.horario ? ` · ${subject.horario}` : ''}</span>
            <span className="ref-subject-meter"><span style={{ width: `${summary.porcentaje}%`, background: distributionColors[index % distributionColors.length] }} /></span>
            <span className="ref-subject-bottom"><span><Users size={12} /> {subject.alumnos.length} registros</span><span><CalendarCheck size={12} /> {subject.fechas.length} clases</span><span>Últ. {formatDate(latest)}</span></span>
          </button>)}</div>
        </article>
      </div>

      <aside className="ref-quick-panel">
        <div className="ref-card-heading"><div><h2>Accesos rápidos</h2><p>Ir directo a tareas frecuentes.</p></div></div>
        <div className="ref-quick-actions">{actions.map(({ title, description, icon: Icon, view, subject, tone }) => <button type="button" key={title} className="ref-action-card" onClick={() => { if (subject && view === 'asistencia') onSelectSubject(subject); onSelectView(view); }}>
          <span className={`ref-action-icon ${tone}`}><Icon size={18} /></span><span className="ref-action-copy"><strong>{title}</strong><small>{description}</small></span><ChevronRight size={16} className="ref-action-chevron" />
        </button>)}</div>
        <div className="ref-quick-divider" />
        <div className="ref-quick-summary"><span className="ref-summary-icon"><GraduationCap size={17} /></span><span><strong>Resumen del padrón</strong><small>{totalStudents} alumnos · {data.materias.length} listas</small></span></div>
        <button type="button" className="ref-outline-action" onClick={() => onSelectView('matricula')}><Plus size={15} /> Abrir matrícula completa</button>
        <div className="ref-quick-footnote"><ShieldCheck size={14} /><span>Demo aislada<br />No se conecta a datos reales</span></div>
      </aside>
    </section>
    <p className="ref-demo-footnote"><CheckCircle2 size={14} /> La asistencia se resume desde las listas ficticias de cada materia; ningún cambio se guarda en el sistema real.</p>
  </div>;
};
