export function attendanceDisabled(role: 'admin' | 'espectador'): boolean {
  return role !== 'admin';
}
