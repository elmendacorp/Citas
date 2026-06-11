/**
 * Utility functions for date calculations, formatting, and template parsing.
 */

// Format: '2026-06-10' -> 'Mi\u00E9rcoles, 10 de Junio de 2026'
export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Generate an array representing a month's grid (including trailing and leading days)
export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayLabel: number;
  isCurrentMonth: boolean;
  date: Date;
}

export function generateMonthGrid(year: number, month: number): CalendarDay[] {
  // month is 0-indexed (0 = January)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Starting day of week (0 = Sunday, 1 = Monday ...)
  // We want Monday (1) as the first day of the week in ES-ES calendar.
  let startDayOfWeek = firstDayOfMonth.getDay();
  // Adjust so Monday is 0, Tuesday is 1... Sunday is 6
  let adjustedStartIdx = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  const grid: CalendarDay[] = [];
  
  // 1. Add days from previous month
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = adjustedStartIdx - 1; i >= 0; i--) {
    const prevMonthDate = new Date(year, month - 1, prevMonthLastDate - i);
    grid.push({
      dateString: formatDateString(prevMonthDate),
      dayLabel: prevMonthDate.getDate(),
      isCurrentMonth: false,
      date: prevMonthDate
    });
  }
  
  // 2. Add days of the current month
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDay = new Date(year, month, i);
    grid.push({
      dateString: formatDateString(currentDay),
      dayLabel: i,
      isCurrentMonth: true,
      date: currentDay
    });
  }
  
  // 3. Add days of next month to complete the grid (usually up to 42 items for 6 weeks)
  const totalCells = grid.length > 35 ? 42 : 35;
  const remainingCells = totalCells - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    grid.push({
      dateString: formatDateString(nextMonthDate),
      dayLabel: i,
      isCurrentMonth: false,
      date: nextMonthDate
    });
  }
  
  return grid;
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateAlertDate(appointmentDateStr: string): string {
  if (!appointmentDateStr) return '';
  const [year, month, day] = appointmentDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1); // Subtract 1 day
  return formatDateString(date);
}

export function parseTemplate(
  template: string,
  data: {
    nombre: string;
    servicio: string;
    fecha: string;
    hora: string;
    duracion: number;
    telefono?: string;
    email?: string;
  }
): string {
  if (!template) return '';
  let result = template;
  result = result.replace(/{nombre}/g, data.nombre || '');
  result = result.replace(/{servicio}/g, data.servicio || '');
  result = result.replace(/{fecha}/g, data.fecha || '');
  result = result.replace(/{hora}/g, data.hora || '');
  result = result.replace(/{duracion}/g, String(data.duracion || 0));
  result = result.replace(/{telefono}/g, data.telefono || '');
  result = result.replace(/{email}/g, data.email || '');
  return result;
}

export function formatCustomDate(dateStr: string, format?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  return dateStr; // default to YYYY-MM-DD
}
