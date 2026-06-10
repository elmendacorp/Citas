import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Users, Calendar, AlertCircle, Bell } from 'lucide-react';
import { Appointment } from '../types';
import { generateMonthGrid, formatHumanDate } from '../utils';

interface CalendarComponentProps {
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  searchedTerm: string;
  filterActive: boolean;
  onOpenAddModal: (dateString: string) => void;
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarComponent({
  appointments,
  selectedDate,
  onSelectDate,
  searchedTerm,
  filterActive,
  onOpenAddModal
}: CalendarComponentProps) {
  const [currentYear, setCurrentYear] = React.useState(2026);
  const [currentMonth, setCurrentMonth] = React.useState(5); // June (0-indexed: 5)

  const monthGrid = React.useMemo(() => {
    return generateMonthGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Helper to check if appointment matches search term (name, email, or phone)
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

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-slate-900 font-sans" id="calendar-card">
      {/* Month Selector Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {MONTHS_ES[currentMonth]} {currentYear}
          </h2>
          {searchedTerm && (
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Filtrado por: "{searchedTerm}"
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            id="prev-month-btn"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCurrentYear(now.getFullYear());
              setCurrentMonth(now.getMonth());
              onSelectDate(now.toISOString().split('T')[0]);
            }}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
            id="today-btn"
          >
            Hoy
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            id="next-month-btn"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
        {WEEKDAYS_ES.map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Grid Days */}
      <div className="grid grid-cols-7 gap-px bg-slate-100" id="calendar-grid">
        {monthGrid.map((day) => {
          // Find appointments for this day
          const dayAppts = appointments.filter(appt => appt.date === day.dateString);
          
          // Check if any appt has notifications enabled
          const hasNotifs = dayAppts.some(appt => appt.notificationEnabled);

          // Filtering behavior:
          // If we have a Search Term:
          // Filter option is ON: We only show matching appointments in this cell.
          // Filter option is OFF: We show all, but color-highlight matching ones and mute others.
          const matchingAppts = dayAppts.filter(isMatchingSearch);
          const hasMatchingInDay = matchingAppts.length > 0;
          
          const displayedAppts = (searchedTerm && filterActive) ? matchingAppts : dayAppts;

          const isSelected = selectedDate === day.dateString;

          return (
            <div
              key={day.dateString}
              onClick={() => onSelectDate(day.dateString)}
              className={`min-h-[100px] bg-white p-2 flex flex-col justify-between group transition-all cursor-pointer relative ${
                day.isCurrentMonth ? 'text-slate-800' : 'text-slate-400 bg-slate-50/40'
              } ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20 z-10' : 'hover:bg-slate-50/70'}`}
              id={`day-${day.dateString}`}
            >
              {/* Day Header */}
              <div className="flex justify-between items-start mb-1 mb-md-2">
                <span className={`text-sm font-semibold flex items-center justify-center rounded-full w-6 h-6 leading-none ${
                  isSelected 
                    ? 'bg-blue-600 text-white font-bold' 
                    : day.dateString === new Date().toISOString().split('T')[0]
                      ? 'bg-slate-900 text-white font-bold'
                      : ''
                }`}>
                  {day.dayLabel}
                </span>

                {/* Micro Indicators */}
                <div className="flex gap-1">
                  {hasNotifs && (
                    <Bell className="w-3.5 h-3.5 text-emerald-500" title="Alerta automática configurada" />
                  )}
                  {searchedTerm && hasMatchingInDay && !filterActive && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 block animate-ping" />
                  )}
                </div>
              </div>

              {/* Day Appointments stack */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                {displayedAppts.slice(0, 3).map((appt) => {
                  const matches = searchedTerm ? isMatchingSearch(appt) : false;
                  
                  // Color codes
                  let bgClass = "bg-slate-100 hover:bg-slate-200 border-l-2 border-slate-400 text-slate-700";
                  if (appt.status === 'completed') {
                    bgClass = "bg-emerald-50 hover:bg-emerald-100 border-l-2 border-emerald-500 text-emerald-800";
                  } else if (appt.status === 'cancelled') {
                    bgClass = "bg-rose-50 hover:bg-rose-100 border-l-2 border-rose-400 text-rose-700 line-through";
                  } else if (matches) {
                    bgClass = "bg-blue-600 hover:bg-blue-700 border-l-2 border-yellow-400 text-white font-medium shadow-sm transition-transform scale-102";
                  } else if (searchedTerm && !matches) {
                    bgClass = "bg-slate-100/60 opacity-40 border-l-2 border-slate-300 text-slate-500";
                  } else {
                    bgClass = "bg-sky-50 hover:bg-sky-100 border-l-2 border-sky-400 text-sky-800";
                  }

                  return (
                    <div
                      key={appt.id}
                      title={`${appt.clientName} - ${appt.service} (${appt.time})`}
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium transition-all ${bgClass}`}
                    >
                      <span className="font-bold font-mono mr-1">{appt.time}</span>
                      {appt.clientName}
                    </div>
                  );
                })}
                {displayedAppts.length > 3 && (
                  <div className="text-[9px] text-slate-500 text-center font-bold font-mono bg-slate-50 py-0.5 rounded border border-slate-100">
                    +{displayedAppts.length - 3} más
                  </div>
                )}
              </div>

              {/* Add Hover Shortcut */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-1 right-1 transition-opacity hidden md:block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddModal(day.dateString);
                  }}
                  className="p-1 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 rounded-md shadow-xs transition-colors cursor-pointer"
                  title="Añadir cita"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend footer */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-sky-100 border-l-2 border-sky-400 rounded-xs" /> Programadas
        </span>
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-emerald-100 border-l-2 border-emerald-500 rounded-xs" /> Completadas
        </span>
        <span className="flex items-semibold gap-1.5 items-center">
          <span className="w-3 h-3 bg-rose-100 border-l-2 border-rose-400 rounded-xs" /> Canceladas
        </span>
        {searchedTerm && (
          <span className="flex items-semibold gap-1.5 items-center ml-auto">
            <span className="w-3 h-3 bg-blue-600 border-l-2 border-yellow-400 rounded-xs" /> Coincide con Búsqueda
          </span>
        )}
      </div>
    </div>
  );
}
