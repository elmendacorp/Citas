import React from 'react';
import { ChevronLeft, ChevronRight, Bell, Plus, Users, Calendar } from 'lucide-react';
import { Appointment } from '../types';
import { formatHumanDate, formatCustomDate } from '../utils';

interface CalendarComponentProps {
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  searchedTerm: string;
  filterActive: boolean;
  onOpenAddModal: (dateString: string, timeString?: string) => void;
  professionalFilter: string;
  onSelectProfessionalFilter: (prof: string) => void;
  professionalsList: any[];
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarComponent({
  appointments,
  selectedDate,
  onSelectDate,
  searchedTerm,
  filterActive,
  onOpenAddModal,
  professionalFilter,
  onSelectProfessionalFilter,
  professionalsList
}: CalendarComponentProps) {
  // Extract year and month from selectedDate to initialize local view state
  const [currentYear, setCurrentYear] = React.useState(2026);
  const [currentMonth, setCurrentMonth] = React.useState(5); // June (0-indexed: 5)
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        setCurrentYear(Number(parts[0]));
        setCurrentMonth(Number(parts[1]) - 1);
      }
    }
  }, [selectedDate]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
      onSelectDate(`${currentYear - 1}-12-01`);
    } else {
      setCurrentMonth(prev => prev - 1);
      onSelectDate(`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
      onSelectDate(`${currentYear + 1}-01-01`);
    } else {
      setCurrentMonth(prev => prev + 1);
      onSelectDate(`${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`);
    }
  };

  // Navigate days
  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() - 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onSelectDate(`${y}-${m}-${d}`);
    }
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      date.setDate(date.getDate() + 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onSelectDate(`${y}-${m}-${d}`);
    }
  };

  React.useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const day = Number(parts[2]);
        const element = document.getElementById(`day-strip-${day}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }
  }, [selectedDate]);

  // Get number of days in the month
  const daysInMonth = React.useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const daysArray = React.useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const getDayOfWeekName = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return WEEKDAYS_ES[date.getDay()];
  };

  // Timeline Hour config
  const startHour = 8; // 8 AM
  const endHour = 22;  // 10 PM
  const totalHours = endHour - startHour + 1; // 15 hours
  const rowHeight = 80; // pixels per hour

  // Filter and sort appointments for the selected date
  const dayAppts = React.useMemo(() => {
    return appointments
      .filter(appt => appt.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  // Check if appointment matches search term (name, email, or phone)
  const isMatchingSearch = React.useCallback((appt: Appointment) => {
    if (!searchedTerm.trim()) return false;
    const term = searchedTerm.toLowerCase();
    return (
      appt.clientName.toLowerCase().includes(term) ||
      appt.clientEmail.toLowerCase().includes(term) ||
      appt.clientPhone.toLowerCase().includes(term) ||
      appt.service.toLowerCase().includes(term)
    );
  }, [searchedTerm]);

  // Parse HH:MM into minutes from 00:00
  const getMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Compute timeline event positions using side-by-side overlap detection
  const timelineEvents = React.useMemo(() => {
    const startMin = startHour * 60; // 480
    
    // Convert appointments to timeline events
    const events = dayAppts.map(appt => {
      const start = getMinutes(appt.time);
      const end = start + appt.duration;
      return {
        appt,
        start,
        end,
        column: 0,
        totalColumns: 1
      };
    });

    // Detect overlaps and assign column offsets and widths
    for (let i = 0; i < events.length; i++) {
      const ev1 = events[i];
      const overlaps = [];
      for (let j = 0; j < events.length; j++) {
        const ev2 = events[j];
        if (ev1 !== ev2 && ev1.start < ev2.end && ev2.start < ev1.end) {
          overlaps.push(ev2);
        }
      }

      if (overlaps.length > 0) {
        const takenColumns = overlaps.map(o => o.column);
        let col = 0;
        while (takenColumns.includes(col)) {
          col++;
        }
        ev1.column = col;
        
        const maxCol = Math.max(...overlaps.map(o => o.column), col);
        ev1.totalColumns = maxCol + 1;

        overlaps.forEach(o => {
          o.totalColumns = Math.max(o.totalColumns, ev1.totalColumns);
        });
      }
    }

    // Map events to styling properties
    return events.map(ev => {
      const startMins = ev.start;
      const durationMins = ev.appt.duration;
      
      // Calculate top and height relative to startHour
      let top = ((startMins - startMin) / 60) * rowHeight;
      let height = (durationMins / 60) * rowHeight;

      // Clamping logic to prevent out-of-bounds rendering
      if (top < 0) {
        height = Math.max(15, height + top);
        top = 0;
      }
      if (top + height > totalHours * rowHeight) {
        height = Math.max(20, (totalHours * rowHeight) - top);
      }

      // Width and Left percentages based on overlap columns
      const widthPercent = 90 / ev.totalColumns;
      const leftPercent = 10 + ev.column * widthPercent;

      // Matches search terms
      const matches = searchedTerm ? isMatchingSearch(ev.appt) : false;

      // Color scheme
      let colorClasses = "bg-sky-50 border-sky-400 text-sky-950 hover:bg-sky-100";
      if (ev.appt.status === 'completed') {
        colorClasses = "bg-emerald-50 border-emerald-505 text-emerald-950 hover:bg-emerald-100";
      } else if (ev.appt.status === 'confirmed') {
        colorClasses = "bg-teal-50 border-teal-500 text-teal-950 hover:bg-teal-100 font-semibold";
      } else if (ev.appt.status === 'cancelled') {
        colorClasses = "bg-rose-50 border-rose-400 text-rose-950 hover:bg-rose-100 line-through opacity-70";
      } else if (matches) {
        colorClasses = "bg-blue-600 border-yellow-400 text-white hover:bg-blue-700 shadow-sm transition-transform scale-102";
      } else if (searchedTerm && !matches) {
        colorClasses = "bg-slate-100/50 border-slate-300 text-slate-500 opacity-40";
      }

      return {
        ...ev,
        top,
        height,
        leftPercent,
        widthPercent,
        colorClasses,
        matches
      };
    });
  }, [dayAppts, searchedTerm, isMatchingSearch, totalHours, rowHeight]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-slate-900 font-sans flex flex-col animate-fade-in" id="calendar-card">
      
      {/* Month/Year selector header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {MONTHS_ES[currentMonth]} {currentYear}
          </h2>
          {searchedTerm && (
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Filtrado: "{searchedTerm}"
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Professional Filter Select */}
          <select
            value={professionalFilter}
            onChange={(e) => onSelectProfessionalFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 hover:border-slate-350 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-bold text-slate-700 cursor-pointer shadow-3xs"
          >
            <option value="">👤 Todos los profesionales</option>
            {professionalsList.map((prof: any) => (
              <option key={prof.id} value={prof.name}>
                👩‍⚕️ {prof.name}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer animate-none"
            id="prev-month-btn"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              const dateString = now.toISOString().split('T')[0];
              onSelectDate(dateString);
            }}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
            id="today-btn"
          >
            Hoy
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDate(e.target.value);
              }
            }}
            className="absolute invisible w-0 h-0"
          />
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 animate-none"
            id="picker-btn"
            title="Elegir fecha en mini calendario"
          >
            📅 <span className="hidden sm:inline">Mini Cal</span>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer animate-none"
            id="next-month-btn"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Day-of-Month Navigator strip with prev/next day arrow controls */}
      <div className="flex items-center bg-slate-50/40 border-b border-slate-100 px-1.5 shadow-inner">
        <button
          onClick={handlePrevDay}
          className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-550 hover:text-slate-800 transition cursor-pointer shrink-0 animate-none"
          title="Día anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex gap-2 overflow-x-auto py-2.5 px-1.5 scrollbar-none">
          {daysArray.map((day) => {
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateString;
            const isToday = dateString === new Date().toISOString().split('T')[0];
            const dayOfWeek = getDayOfWeekName(day);
            
            return (
              <button
                key={day}
                id={`day-strip-${day}`}
                onClick={() => onSelectDate(dateString)}
                className={`flex flex-col items-center justify-center min-w-[42px] h-[52px] rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-200'
                    : isToday
                      ? 'bg-slate-900 border-slate-900 text-white font-bold'
                      : 'bg-white border-slate-200 hover:border-slate-355 text-slate-705'
                }`}
              >
                <span className={`text-[9px] uppercase tracking-wider ${isSelected ? 'text-blue-105' : 'text-slate-400 font-semibold'}`}>
                  {dayOfWeek}
                </span>
                <span className="text-sm font-bold mt-0.5">{day}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNextDay}
          className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-550 hover:text-slate-800 transition cursor-pointer shrink-0 animate-none"
          title="Día siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Daily Time Grid Scheduler */}
      <div className="p-4 bg-white overflow-y-auto max-h-[600px] scrollbar-thin relative flex">
        {/* Left Column: Hour Labels */}
        <div className="w-[50px] shrink-0 text-slate-400 text-[11px] font-bold font-mono select-none" style={{ height: `${totalHours * rowHeight}px` }}>
          {Array.from({ length: totalHours }, (_, i) => {
            const hour = i + startHour;
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div key={hourStr} className="flex items-start justify-end pr-2.5" style={{ height: `${rowHeight}px`, paddingTop: '4px' }}>
                {hourStr}
              </div>
            );
          })}
        </div>

        {/* Right Column: Grid and Cards Area */}
        <div className="flex-1 relative border-l border-slate-100" style={{ height: `${totalHours * rowHeight}px` }}>
          
          {/* Background Hour Rows Grid with click trigger */}
          {Array.from({ length: totalHours }, (_, i) => {
            const hour = i + startHour;
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div 
                key={hourStr}
                className="absolute w-full border-t border-slate-100 flex items-start"
                style={{ top: `${i * rowHeight}px`, height: `${rowHeight}px` }}
              >
                <div 
                  onClick={() => {
                    onOpenAddModal(selectedDate, hourStr);
                  }}
                  className="w-full h-full hover:bg-slate-50/50 transition-colors cursor-pointer relative group/row"
                  title={`Agendar cita a las ${hourStr}`}
                >
                  <span className="absolute left-3 top-3 opacity-0 group-hover/row:opacity-100 text-[10px] text-blue-600 font-bold bg-blue-50/80 px-2 py-0.5 border border-blue-100 rounded-lg transition-all flex items-center gap-1 shadow-3xs">
                    ➕ Agendar cita a las {hourStr}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Absolute Positioned Events Stack */}
          {timelineEvents.map(({ appt, top, height, leftPercent, widthPercent, colorClasses }) => {
            const isShort = height < 50;
            const isVeryShort = height < 30;

            return (
              <div
                key={appt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddModal(appt.date, appt.time);
                }}
                className={`absolute rounded-xl border-l-4 p-2 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between overflow-hidden cursor-pointer select-none ${colorClasses}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  minHeight: '20px',
                  zIndex: 20
                }}
              >
                {isVeryShort ? (
                  <div className="text-[9px] font-bold truncate flex items-center justify-between leading-none w-full">
                    <span className="truncate"><span className="font-mono font-black">{appt.time}</span> {appt.clientName}</span>
                    <span className="text-[8px] opacity-75 truncate">{appt.service}</span>
                  </div>
                ) : isShort ? (
                  <div className="flex flex-col justify-start leading-none h-full justify-between">
                    <div className="text-[10px] font-black font-mono leading-none">{appt.time}</div>
                    <div className="text-[10px] font-bold truncate leading-none mt-0.5">{appt.clientName}</div>
                    <div className="text-[8px] opacity-75 truncate leading-none mt-0.5">{appt.service}</div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-wider opacity-75">
                        <span className="font-mono font-black">{appt.time} ({appt.duration}m)</span>
                        <span className="font-sans font-black">{appt.status === 'scheduled' ? 'Programada' : appt.status === 'confirmed' ? 'Confirmada' : appt.status === 'completed' ? 'Completada' : 'Cancelada'}</span>
                      </div>
                      <h4 className="text-[11px] font-black truncate mt-1 leading-tight">{appt.service}</h4>
                      <p className="text-[10px] font-bold truncate mt-0.5 opacity-90">👤 {appt.clientName}</p>
                      <p className="text-[9px] font-semibold truncate mt-0.5 opacity-90">👩‍⚕️ {appt.professional || 'Sin asignar'}</p>
                    </div>
                    
                    {height >= 70 && appt.notes && (
                      <p className="text-[9px] truncate opacity-70 italic mt-1 border-t border-slate-200/40 pt-1">
                        "{appt.notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>

      {/* Legend display footer */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-sky-105 border-l-2 border-sky-400 rounded-xs" /> Programadas
        </span>
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-teal-100 border-l-2 border-teal-500 rounded-xs" /> Confirmadas
        </span>
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-emerald-100 border-l-2 border-emerald-500 rounded-xs" /> Completadas
        </span>
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-rose-100 border-l-2 border-rose-400 rounded-xs" /> Canceladas
        </span>
      </div>

    </div>
  );
}
