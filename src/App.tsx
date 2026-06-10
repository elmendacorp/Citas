import React from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Bell, 
  Mail, 
  Smartphone, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Volume2, 
  Trash,
  HelpCircle,
  FileMinus,
  Sparkles,
  RefreshCw,
  PhoneCall
} from 'lucide-react';

import { Client, Appointment, SentNotification } from './types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_NOTIFICATIONS 
} from './data';
import { calculateAlertDate, formatHumanDate, parseTemplate } from './utils';

// Import subcomponents
import CalendarComponent from './components/CalendarComponent';
import AppointmentModal from './components/AppointmentModal';
import AlertsManager from './components/AlertsManager';

export default function App() {
  // State management
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [notifications, setNotifications] = React.useState<SentNotification[]>([]);
  
  // Selection and search states
  const [selectedDate, setSelectedDate] = React.useState<string>('2026-06-10');
  const [simulatedDate, setSimulatedDate] = React.useState<string>('2026-06-10');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [filterActive, setFilterActive] = React.useState<boolean>(false);
  
  // Modal visibility states
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);

  // App notification banner / toast states
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load state from localStorage on mount (with safety fallback to static INITIAL_DATA)
  React.useEffect(() => {
    try {
      const savedAppts = localStorage.getItem('gestorcitas_appointments');
      const savedClients = localStorage.getItem('gestorcitas_clients');
      const savedNotifs = localStorage.getItem('gestorcitas_notifications');
      const savedSimDate = localStorage.getItem('gestorcitas_sim_date');

      if (savedAppts) setAppointments(JSON.parse(savedAppts));
      else setAppointments(INITIAL_APPOINTMENTS);

      if (savedClients) setClients(JSON.parse(savedClients));
      else setClients(INITIAL_CLIENTS);

      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      else setNotifications(INITIAL_NOTIFICATIONS);

      if (savedSimDate) setSimulatedDate(savedSimDate);
      else setSimulatedDate('2026-06-10');
    } catch (e) {
      console.error("No se pudieron cargar datos previos de localStorage, recurriendo a datos iniciales.", e);
      setAppointments(INITIAL_APPOINTMENTS);
      setClients(INITIAL_CLIENTS);
      setNotifications(INITIAL_NOTIFICATIONS);
    }
  }, []);

  // Save changes to localStorage
  const saveState = (
    newAppts: Appointment[],
    newClients: Client[],
    newNotifs: SentNotification[]
  ) => {
    try {
      localStorage.setItem('gestorcitas_appointments', JSON.stringify(newAppts));
      localStorage.setItem('gestorcitas_clients', JSON.stringify(newClients));
      localStorage.setItem('gestorcitas_notifications', JSON.stringify(newNotifs));
    } catch (e) {
      console.error("Error al guardar estado en local storage: ", e);
    }
  };

  // Helper helper to show elegant alerts
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Automated notification generator
  const generateScheduledNotifications = (appt: Appointment): SentNotification[] => {
    if (!appt.notificationEnabled || appt.status === 'cancelled') return [];
    
    const alertDate = calculateAlertDate(appt.date);
    const notificationsToSchedule: SentNotification[] = [];
    
    const compilePayload = {
      nombre: appt.clientName,
      servicio: appt.service,
      fecha: appt.date,
      hora: appt.time,
      duracion: appt.duration,
      telefono: appt.clientPhone,
      email: appt.clientEmail
    };

    if (appt.notificationType === 'sms' || appt.notificationType === 'both') {
      notificationsToSchedule.push({
        id: `sms-${appt.id}-${Date.now()}`,
        appointmentId: appt.id,
        clientName: appt.clientName,
        type: 'sms',
        recipient: appt.clientPhone || 'Móvil no registrado',
        content: parseTemplate(appt.smsTemplate, compilePayload),
        scheduledForDate: alertDate,
        status: 'pending'
      });
    }

    if (appt.notificationType === 'email' || appt.notificationType === 'both') {
      notificationsToSchedule.push({
        id: `email-${appt.id}-${Date.now()}`,
        appointmentId: appt.id,
        clientName: appt.clientName,
        type: 'email',
        recipient: appt.clientEmail || 'Email no registrado',
        subject: parseTemplate(appt.emailSubject, compilePayload),
        content: parseTemplate(appt.emailTemplate, compilePayload),
        scheduledForDate: alertDate,
        status: 'pending'
      });
    }

    return notificationsToSchedule;
  };

  // Handle appointment creation or editing
  const handleSaveAppointment = (
    apptData: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }
  ) => {
    let updatedAppts = [...appointments];
    let updatedNotifs = [...notifications];
    let updatedClients = [...clients];

    // Check if client is unique/new to auto-save profile in client database
    const clientExists = updatedClients.some(
      c => c.name.toLowerCase() === apptData.clientName.toLowerCase() ||
      (apptData.clientEmail && c.email.toLowerCase() === apptData.clientEmail.toLowerCase()) ||
      (apptData.clientPhone && c.phone === apptData.clientPhone)
    );

    if (!clientExists) {
      const newClient: Client = {
        id: `c-${Date.now()}`,
        name: apptData.clientName,
        email: apptData.clientEmail || 'sin@correo.com',
        phone: apptData.clientPhone || 'sin-telefono',
        notes: 'Cliente registrado automáticamente desde agenda.'
      };
      updatedClients = [newClient, ...updatedClients];
      setClients(updatedClients);
      showToast(`👤 Nuevo cliente "${apptData.clientName}" registrado automáticamente.`, 'info');
    }

    if (apptData.id) {
      // ✏️ EDITING existing appointment
      updatedAppts = updatedAppts.map(a => {
        if (a.id === apptData.id) {
          return {
            ...a,
            ...apptData,
            createdAt: a.createdAt
          } as Appointment;
        }
        return a;
      });

      // Remove previous pending notifications of this appointment and schedule fresh configurations
      updatedNotifs = updatedNotifs.filter(n => !(n.appointmentId === apptData.id && n.status === 'pending'));
      
      const targetAppt = updatedAppts.find(a => a.id === apptData.id)!;
      const freshNotifs = generateScheduledNotifications(targetAppt);
      updatedNotifs = [...updatedNotifs, ...freshNotifs];

      setAppointments(updatedAppts);
      setNotifications(updatedNotifs);
      showToast(`📝 Cita de ${apptData.clientName} actualizada con éxito.`);
    } else {
      // 📅 CREATING a new appointment
      const newApptId = `a-${Date.now()}`;
      const newAppt: Appointment = {
        ...apptData,
        id: newApptId,
        createdAt: new Date().toISOString()
      };

      updatedAppts = [newAppt, ...updatedAppts];
      
      // Schedule automatic notifications for the new appointment
      const freshNotifs = generateScheduledNotifications(newAppt);
      updatedNotifs = [...updatedNotifs, ...freshNotifs];

      setAppointments(updatedAppts);
      setNotifications(updatedNotifs);
      setSelectedDate(newAppt.date); // jump focus to the new date
      showToast(`✅ Cita agendada correctamente para ${apptData.clientName}.`);
    }

    saveState(updatedAppts, updatedClients, updatedNotifs);
  };

  // Delete an appointment
  const handleDeleteAppointment = (apptId: string) => {
    const updatedAppts = appointments.filter(a => a.id !== apptId);
    // Remove both pending and sent corresponding alerts or just keep logs? Keep sent clean, delete pending
    const updatedNotifs = notifications.filter(n => !(n.appointmentId === apptId && n.status === 'pending'));
    
    setAppointments(updatedAppts);
    setNotifications(updatedNotifs);
    saveState(updatedAppts, clients, updatedNotifs);
    showToast(`🗑️ Cita eliminada y avisos programados desactivados.`, 'info');
  };

  // Trigger simulated delivery of a single notification
  const handleTriggerSendNotification = (notifId: string) => {
    let clientNameRecipient = '';
    let method = 'notificación';

    const updatedNotifs = notifications.map(notif => {
      if (notif.id === notifId) {
        clientNameRecipient = notif.clientName;
        method = notif.type === 'sms' ? '📱 SMS' : '✉️ Email';
        return {
          ...notif,
          status: 'sent' as const,
          sentAt: `${simulatedDate} 09:12` // simulated timestamp
        };
      }
      return notif;
    });

    setNotifications(updatedNotifs);
    saveState(appointments, clients, updatedNotifs);
    showToast(`🚀 ${method} automático entregado con éxito a ${clientNameRecipient}.`);
  };

  // Bulk trigger all due pending alarm notices for simulated date or earlier
  const handleTriggerAllDueNotifications = () => {
    let triggeredCount = 0;
    
    const updatedNotifs = notifications.map(notif => {
      if (notif.status === 'pending' && notif.scheduledForDate <= simulatedDate) {
        triggeredCount++;
        return {
          ...notif,
          status: 'sent' as const,
          sentAt: `${simulatedDate} 09:00` // process batch trigger at morning
        };
      }
      return notif;
    });

    if (triggeredCount > 0) {
      setNotifications(updatedNotifs);
      saveState(appointments, clients, updatedNotifs);
      showToast(`🔔 ¡Procesado automático! Se han despachado ${triggeredCount} avisos programados para el ${simulatedDate}.`, 'success');
    } else {
      showToast(`ℹ️ No se encontraron nuevos avisos pendientes para despachar hoy.`, 'info');
    }
  };

  // Delete notification log item from sent list
  const handleDeleteNotificationLog = (id: string) => {
    const updatedNotifs = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifs);
    saveState(appointments, clients, updatedNotifs);
  };

  // Time travel system date modifier
  const handleAdvanceSimulatedDate = (newDate: string) => {
    setSimulatedDate(newDate);
    localStorage.setItem('gestorcitas_sim_date', newDate);
    
    // Automatically query if there are pending alerts that are due exactly on this new date or earlier
    const automaticallyDispatchable = notifications.filter(
      n => n.status === 'pending' && n.scheduledForDate <= newDate
    );

    if (automaticallyDispatchable.length > 0) {
      // Autotrigger simulation!
      const updatedNotifs = notifications.map(notif => {
        if (notif.status === 'pending' && notif.scheduledForDate <= newDate) {
          return {
            ...notif,
            status: 'sent' as const,
            sentAt: `${newDate} 09:00`
          };
        }
        return notif;
      });

      setNotifications(updatedNotifs);
      saveState(appointments, clients, updatedNotifs);
      showToast(`🌟 Sistema avanzado al ${newDate}. Se despacharon automáticamente ${automaticallyDispatchable.length} avisos de citas.`, 'success');
    } else {
      showToast(`📅 Fecha simulada establecida en: ${newDate}`, 'info');
    }
  };

  // Client database clean reset
  const handleResetData = () => {
    if (window.confirm("¿Seguro que desea restaurar los datos iniciales? Se perderán las citas nuevas.")) {
      localStorage.clear();
      setAppointments(INITIAL_APPOINTMENTS);
      setClients(INITIAL_CLIENTS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setSimulatedDate('2026-06-10');
      setSelectedDate('2026-06-10');
      showToast("🔄 Aplicación restaurada a valores predeterminados.");
    }
  };

  // Filter day's list of appointments
  const selectedDayAppointments = React.useMemo(() => {
    let dayAppts = appointments.filter(a => a.date === selectedDate);
    
    // If search filter is active and queries have text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      dayAppts = dayAppts.filter(appt => (
        appt.clientName.toLowerCase().includes(q) ||
        appt.clientEmail.toLowerCase().includes(q) ||
        appt.clientPhone.includes(q) ||
        appt.service.toLowerCase().includes(q)
      ));
    }
    
    return dayAppts.sort((a,b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, searchQuery]);

  // Global search clients list
  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    ));
  }, [clients, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16 flex flex-col justify-between" id="applet-viewport">
      {/* Dynamic Toast Element */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 transition-all transform scale-100 max-w-md animate-bounce border text-xs font-bold ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-900 border-emerald-800 text-white' 
              : toastMessage.type === 'info'
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-rose-900 border-rose-800 text-white'
          }`}
          id="toast-notification"
        >
          <div className="flex-1 whitespace-pre-line">{toastMessage.text}</div>
          <button onClick={() => setToastMessage(null)} className="opacity-70 hover:opacity-100">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Top Nav-Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-105">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 leading-none">
                Gestión de Citas y Alertas
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Agenda de clientes y avisos programados (SMS / Email) enviados 1 día antes
              </p>
            </div>
          </div>

          {/* Quick Metrics display */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-slate-50 border border-slate-100 p-2 rounded-xl">
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Citas</span>
              <span className="text-sm font-black text-slate-800">{appointments.length}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Clientes</span>
              <span className="text-sm font-black text-slate-800">{clients.length}</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] uppercase font-bold text-slate-400">📬 Enviados</span>
              <span className="text-sm font-black text-emerald-650 font-mono">
                {notifications.filter(n => n.status === 'sent').length}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-3 py-1">
              <span className="block text-[10px] uppercase font-bold text-slate-400">⏰ Pendientes</span>
              <span className="text-sm font-black text-amber-600 font-mono">
                {notifications.filter(n => n.status === 'pending').length}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResetData}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
              title="Restaurar base de datos para pruebas"
            >
              Resetear BD
            </button>
            <button
              onClick={() => {
                setEditingAppointment(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 flex items-center gap-1.5 transition cursor-pointer"
              id="new-appointment-btn"
            >
              <Plus className="w-4 h-4" /> Nueva Cita
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN: Client search / quick lookup (3 Columns width) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-3xs" id="client-lookup-card">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Buscador de Citas
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Filtra el calendario ingresando nombre, email o móvil del cliente.
              </p>
            </div>

            {/* Main Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre, teléfono o email..."
                className="w-full text-xs pl-9 pr-8 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                id="search-box-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded-full cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Calendar filter vs highlight */}
            {searchQuery && (
              <div className="bg-slate-50 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">Filtrar calendario</span>
                <button
                  type="button"
                  onClick={() => setFilterActive(!filterActive)}
                  className={`text-[10px] px-2 py-1 font-bold rounded-md transition-all border shrink-0 cursor-pointer ${
                    filterActive 
                      ? 'bg-blue-600 text-white border-blue-700' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filterActive ? 'Filtro Activo' : 'Efecto Destacar'}
                </button>
              </div>
            )}

            {/* List of matched clients or directory profiles */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Directorio ({filteredClients.length})
              </div>
              
              <div className="max-h-[190px] lg:max-h-[400px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No hay clientes que coincidan.
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const clientApptCount = appointments.filter(
                      a => a.clientName.toLowerCase() === client.name.toLowerCase()
                    ).length;

                    return (
                      <div 
                        key={client.id}
                        onClick={() => setSearchQuery(client.name)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          searchQuery.toLowerCase() === client.name.toLowerCase()
                            ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-500 shadow-2xs'
                            : 'bg-slate-50/30 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-slate-800 leading-tight flex items-center justify-between">
                          <span className="truncate">{client.name}</span>
                          <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono font-bold shrink-0">
                            {clientApptCount} {clientApptCount === 1 ? 'cita' : 'citas'}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                          <p className="truncate font-mono">📱 {client.phone}</p>
                          <p className="truncate">✉️ {client.email}</p>
                        </div>

                        <div className="flex gap-2 justify-end mt-2 border-t border-slate-100 pt-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open modal with this client details prefilled
                              setEditingAppointment({
                                clientName: client.name,
                                clientPhone: client.phone,
                                clientEmail: client.email,
                                service: '',
                                date: selectedDate,
                                time: '10:00',
                                duration: 30,
                                notes: '',
                                notificationEnabled: true,
                                notificationType: 'both',
                                smsTemplate: '',
                                emailSubject: '',
                                emailTemplate: '',
                                status: 'scheduled'
                              } as any);
                              setIsModalOpen(true);
                            }}
                            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" /> Nueva Cita
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Calendar & Day's appointment details (6 Columns width) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Custom Calendar view */}
          <CalendarComponent
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            searchedTerm={searchQuery}
            filterActive={filterActive}
            onOpenAddModal={(dateStr) => {
              setSelectedDate(dateStr);
              setEditingAppointment(null);
              setIsModalOpen(true);
            }}
          />

          {/* Day details list */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-3xs" id="day-appointments-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  🗒️ Citas Agendadas
                </h3>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">
                  📁 {formatHumanDate(selectedDate)}
                </span>
              </div>
              
              <button
                onClick={() => {
                  setEditingAppointment(null);
                  setIsModalOpen(true);
                }}
                className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg flex items-center gap-1 transition-colors justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Cita para hoy
              </button>
            </div>

            {/* List container */}
            <div className="space-y-3.5" id="day-appointments-list">
              {selectedDayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center text-xs space-y-2 border border-dashed border-slate-100 rounded-xl">
                  <FileMinus className="w-7 h-7 text-slate-350" />
                  <div>
                    <h4 className="font-bold text-slate-500">
                      No hay citas para {searchQuery ? 'este cliente' : 'este día'}
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs px-4 mt-0.5">
                      {searchQuery 
                        ? 'Prueba limpiando el buscador superior para ver todas las citas programadas de este día.' 
                        : 'Haz clic en el botón superior o en el calendario para programar una cita en esta fecha.'}
                    </p>
                  </div>
                </div>
              ) : (
                selectedDayAppointments.map((appt) => {
                  // Find all scheduled alerts matching this appointment ID
                  const apptAlerts = notifications.filter(n => n.appointmentId === appt.id);
                  const isAnyAlertPending = apptAlerts.some(a => a.status === 'pending');

                  return (
                    <div 
                      key={appt.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:border-slate-200 hover:bg-slate-50/50 transition-all shadow-3xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        {/* Service / Client header */}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono shadow-3xs">
                              ⏰ {appt.time}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              appt.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : appt.status === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-sky-100 text-sky-800'
                            }`}>
                              {appt.status === 'scheduled' ? 'Programada' : appt.status === 'completed' ? 'Completada' : 'Cancelada'}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-800 mt-2">
                            {appt.service}
                          </h4>
                          
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                            👤 Cliente: <span className="text-slate-800">{appt.clientName}</span>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex gap-1.5 items-center justify-end">
                          <button
                            onClick={() => {
                              setEditingAppointment(appt);
                              setIsModalOpen(true);
                            }}
                            className="p-1 px-2.5 hover:bg-white text-slate-600 border border-transparent hover:border-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                            title="Editar Cita"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("¿Seguro que desea eliminar esta cita?")) {
                                handleDeleteAppointment(appt.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-150 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Eliminar cita"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact & notification configuration logs footer inside item card */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                          <p className="truncate">📱 Tel: <strong className="font-mono text-slate-700">{appt.clientPhone || 'No registrado'}</strong></p>
                          <p className="truncate">✉️ Email: <strong className="font-sans text-slate-700 underline">{appt.clientEmail || 'No registrado'}</strong></p>
                          {appt.notes && (
                            <p className="text-[10px] text-slate-400 bg-white p-1.5 border border-slate-100 rounded-md mt-1 leading-normal italic">
                              📝 Notas: "{appt.notes}"
                            </p>
                          )}
                        </div>

                        {/* Alarm/Notifications summary info */}
                        <div className="bg-white/95 border border-slate-150 p-2.5 rounded-lg text-[10px] space-y-2">
                          <span className="block font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5 text-blue-600" /> Registro de Avisos (1 día antes)
                          </span>
                          
                          {appt.notificationEnabled ? (
                            <div className="space-y-1.5">
                              <p className="text-slate-600">
                                Programado para: <strong className="text-blue-900 font-mono">{calculateAlertDate(appt.date)}</strong>
                              </p>
                              
                              <div className="flex flex-wrap gap-1">
                                {apptAlerts.map(alert => (
                                  <span 
                                    key={alert.id} 
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                                      alert.status === 'sent' 
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                        : 'bg-amber-50 text-amber-800 border border-amber-100 animate-pulse'
                                    }`}
                                    title={alert.content}
                                  >
                                    {alert.type === 'sms' ? '📱 SMS' : '✉️ Email'} ({alert.status === 'sent' ? 'Enviado' : 'Pendiente'})
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400 font-medium italic">
                              ❌ Avisos desactivados para esta cita creados por el administrador.
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Alerts management / simulated dispatcher clock (3 Columns width) */}
        <div className="lg:col-span-3">
          <AlertsManager
            notifications={notifications}
            appointments={appointments}
            simulatedDate={simulatedDate}
            onAdvanceDate={handleAdvanceSimulatedDate}
            onTriggerSend={handleTriggerSendNotification}
            onTriggerAllDue={handleTriggerAllDueNotifications}
            onDeleteNotification={handleDeleteNotificationLog}
          />
        </div>

      </main>

      {/* Footer information section */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-400 font-semibold space-y-1">
        <p>📅 Calendario y Gestión de Citas y Avisos Automáticos de SMS/Email (1 día antes)</p>
        <p className="font-normal text-slate-350">
          Desarrollado para demostración de alertas automáticas. Dispone de un selector de fecha en tiempo real para simular avances temporales sin necesidad de servicios de fondo.
        </p>
      </footer>

      {/* Scheduling / Creation Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        selectedDate={selectedDate}
        clients={clients}
        initialAppointment={editingAppointment}
      />
    </div>
  );
}
