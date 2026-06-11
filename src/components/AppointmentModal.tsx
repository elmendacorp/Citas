import React from 'react';
import { X, Bell, Eye, Sliders, Smartphone, Mail, Info, FileText, Check } from 'lucide-react';
import { Appointment, Client } from '../types';
import { 
  DEFAULT_SMS_TEMPLATE, 
  DEFAULT_EMAIL_SUBJECT, 
  DEFAULT_EMAIL_TEMPLATE 
} from '../data';
import { parseTemplate, calculateAlertDate } from '../utils';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id' | 'createdAt'> & { id?: string }) => void;
  selectedDate: string;
  clients: Client[];
  initialAppointment?: Appointment | null; // If editing
  settings?: {
    notificationEnabled: boolean;
    notificationType: 'sms' | 'email' | 'whatsapp' | 'both';
    smsTemplate: string;
    emailSubject: string;
    emailTemplate: string;
    dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    defaultDuration?: number;
    defaultStatus?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    defaultNotificationType?: 'sms' | 'email' | 'whatsapp' | 'both' | 'none';
  } | null;
}

const SERVICE_PRESETS = [
  'Consulta Médica',
  'Sesión de Fisioterapia',
  'Limpieza Bucal',
  'Asesoramiento Legal',
  'Corte de Cabello',
  'Clase Particular',
  'Mantenimiento Técnico',
  'Asesoría de Nutrición'
];

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  clients,
  initialAppointment,
  settings
}: AppointmentModalProps) {
  const isEditMode = !!(initialAppointment && initialAppointment.id);
  
  const professionalsList: { id: string; name: string; contact: string }[] = React.useMemo(() => {
    try {
      return JSON.parse(settings?.professionals || '[]');
    } catch (e) {
      return [];
    }
  }, [settings?.professionals]);

  // Client info state
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [clientEmail, setClientEmail] = React.useState('');
  
  // Appointment info state
  const [service, setService] = React.useState('Cita de Fisioterapia');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('10:00');
  const [duration, setDuration] = React.useState(30);
  const [notes, setNotes] = React.useState('');
  const [status, setStatus] = React.useState<Appointment['status']>('scheduled');
  const [professional, setProfessional] = React.useState('');

  // Automatic Notification setup
  const [notificationEnabled, setNotificationEnabled] = React.useState(true);
  const [notificationType, setNotificationType] = React.useState<Appointment['notificationType']>('whatsapp');
  const [smsTemplate, setSmsTemplate] = React.useState(DEFAULT_SMS_TEMPLATE);
  const [emailSubject, setEmailSubject] = React.useState(DEFAULT_EMAIL_SUBJECT);
  const [emailTemplate, setEmailTemplate] = React.useState(DEFAULT_EMAIL_TEMPLATE);

  // Autocomplete UI support
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Client[]>([]);

  // Search existing client searchbar support
  const [searchClientQuery, setSearchClientQuery] = React.useState('');
  const [showClientSearchSuggestions, setShowClientSearchSuggestions] = React.useState(false);
  const [clientSearchSuggestions, setClientSearchSuggestions] = React.useState<Client[]>([]);

  // Load existing appointment data on edit
  React.useEffect(() => {
    if (initialAppointment) {
      setClientName(initialAppointment.clientName);
      setClientPhone(initialAppointment.clientPhone);
      setClientEmail(initialAppointment.clientEmail);
      setService(initialAppointment.service);
      setDate(initialAppointment.date);
      setTime(initialAppointment.time);
      setDuration(initialAppointment.duration);
      setNotes(initialAppointment.notes || '');
      setStatus(initialAppointment.status);
      
      setNotificationEnabled(initialAppointment.notificationEnabled);
      setNotificationType(initialAppointment.notificationType);
      setSmsTemplate(initialAppointment.smsTemplate || DEFAULT_SMS_TEMPLATE);
      setEmailSubject(initialAppointment.emailSubject || DEFAULT_EMAIL_SUBJECT);
      setEmailTemplate(initialAppointment.emailTemplate || DEFAULT_EMAIL_TEMPLATE);
      const defaultProf = isEditMode ? '' : (professionalsList.length > 0 ? professionalsList[0].name : '');
      setProfessional(initialAppointment.professional || defaultProf);
    } else {
      // Default creation
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setService('Cita de Fisioterapia');
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTime('10:00');
      setDuration(settings?.defaultDuration || 30);
      setNotes('');
      setStatus(settings?.defaultStatus || 'scheduled');
      
      const defNotificationType = settings?.defaultNotificationType || 'whatsapp';
      if (defNotificationType === 'none') {
        setNotificationEnabled(false);
        setNotificationType('whatsapp');
      } else {
        setNotificationEnabled(true);
        setNotificationType(defNotificationType as any);
      }
      setSmsTemplate(settings?.smsTemplate || DEFAULT_SMS_TEMPLATE);
      setEmailSubject(settings?.emailSubject || DEFAULT_EMAIL_SUBJECT);
      setEmailTemplate(settings?.emailTemplate || DEFAULT_EMAIL_TEMPLATE);

      // Prefill with first available professional
      if (professionalsList.length > 0) {
        setProfessional(professionalsList[0].name);
      } else {
        setProfessional('');
      }
    }
  }, [initialAppointment, selectedDate, isOpen, settings, professionalsList]);

  // Handle Client input filter suggestions
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    if (val.trim().length > 1) {
      const filtered = clients.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        c.phone.includes(val) ||
        c.email.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectClientSuggestion = (client: Client) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    setClientEmail(client.email);
    setShowSuggestions(false);
  };

  const handleClientSearchChange = (val: string) => {
    setSearchClientQuery(val);
    if (val.trim().length > 0) {
      const filtered = clients.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase()) ||
        c.phone.includes(val) ||
        c.email.toLowerCase().includes(val.toLowerCase())
      );
      setClientSearchSuggestions(filtered);
      setShowClientSearchSuggestions(filtered.length > 0);
    } else {
      setClientSearchSuggestions([]);
      setShowClientSearchSuggestions(false);
    }
  };

  const selectSearchedClient = (client: Client) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    setClientEmail(client.email);
    setSearchClientQuery('');
    setShowClientSearchSuggestions(false);
  };

  if (!isOpen) return null;

  // Compile real-time interpolator payload for notification preview
  const previewPayload = {
    nombre: clientName || '[Nombre del Cliente]',
    servicio: service || '[Servicio o Tarea]',
    fecha: date || '[Fecha]',
    hora: time || '[Hora]',
    duracion: duration,
    telefono: clientPhone || '[Teléfono]',
    email: clientEmail || '[Email]'
  };

  const alertDate = calculateAlertDate(date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !service.trim() || !date) {
      return;
    }

    onSave({
      id: initialAppointment?.id,
      clientName,
      clientPhone,
      clientEmail,
      service,
      date,
      time,
      duration,
      notes,
      notificationEnabled,
      notificationType,
      smsTemplate,
      emailSubject,
      emailTemplate,
      status,
      professional
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="relative bg-white rounded-2xl w-full max-w-xl shadow-xl flex flex-col max-h-[92vh] border border-slate-100 overflow-hidden"
        id="appointment-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditMode ? '✏️ Editar Cita Agendada' : '📅 Agendar Nueva Cita'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditMode 
                ? `Editando registro de cita #${initialAppointment.id}` 
                : 'Complete los datos de la cita y del cliente.'
              }
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-4">
            
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Datos de la Cita y del Cliente
            </h4>

            {/* Search Existing Client Bar */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-750 mb-1">🔍 Buscar Cliente Existente (Base de Datos)</label>
              <input
                type="text"
                placeholder="Buscar por nombre, correo o móvil..."
                value={searchClientQuery}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchClientQuery.length > 0 && clientSearchSuggestions.length > 0) setShowClientSearchSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowClientSearchSuggestions(false), 200);
                }}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-slate-50 font-medium"
              />
              
              {/* Search Suggestions Box */}
              {showClientSearchSuggestions && (
                <div className="absolute z-40 w-full bg-white mt-1 rounded-xl border border-slate-200 shadow-lg max-h-48 overflow-y-auto p-1 divide-y divide-slate-50">
                  {clientSearchSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectSearchedClient(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex flex-col rounded-lg transition-colors cursor-pointer pt-2"
                    >
                      <span className="font-semibold text-slate-805">{c.name}</span>
                      <span className="text-slate-500 text-[10px]">{c.phone} • {c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cliente Autocomplete Group */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-755 mb-1">Nombre del Cliente *</label>
              <input
                type="text"
                required
                placeholder="Escriba el nombre, correo o móvil del cliente..."
                value={clientName}
                onChange={(e) => handleClientNameChange(e.target.value)}
                onFocus={() => {
                  if (clientName.length > 1 && suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Let clock ticks pass so clicking suggestion registers prior to blur
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
                id="client-name-input"
              />
              
              {/* Autocomplete Suggestions Box */}
              {showSuggestions && (
                <div className="absolute z-30 w-full bg-white mt-1 rounded-xl border border-slate-200 shadow-lg max-h-48 overflow-y-auto p-1 divide-y divide-slate-50">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded-md">
                    Clientes Existentes
                  </div>
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectClientSuggestion(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex flex-col rounded-lg transition-colors cursor-pointer pt-2"
                    >
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="text-slate-500 text-[10px]">{c.phone} • {c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +34 612 345 678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
                  id="client-phone-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="e.g. cliente@correo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
                  id="client-email-input"
                />
              </div>
            </div>



            {/* Datetime Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de la Cita *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
                  id="appointment-date-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hora de Inicio *</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
                  id="appointment-time-input"
                />
              </div>
            </div>

            {/* Professional and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">Profesional *</label>
                <select
                  value={professional}
                  onChange={(e) => setProfessional(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-white font-medium"
                >
                  <option value="">Sin profesional</option>
                  {professionalsList.map((prof) => (
                    <option key={prof.id} value={prof.name}>
                      👩‍⚕️ {prof.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">Duración</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-white font-medium"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={50}>50 minutos</option>
                  <option value={60}>1 hora (60 min)</option>
                  <option value={90}>1.5 horas (90 min)</option>
                  <option value={120}>2 horas (120 min)</option>
                </select>
              </div>
            </div>

            {/* Status and Notification Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Appointment['status'])}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-white font-medium"
                >
                  <option value="scheduled">🟢 Programada</option>
                  <option value="confirmed">🔵 Confirmada</option>
                  <option value="completed">💙 Completada</option>
                  <option value="cancelled">🔴 Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">Aviso Automatizado</label>
                <select
                  value={notificationEnabled ? notificationType : 'none'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'none') {
                      setNotificationEnabled(false);
                    } else {
                      setNotificationEnabled(true);
                      setNotificationType(val as any);
                    }
                  }}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-white font-medium"
                >
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="sms">📱 SMS</option>
                  <option value="email">✉️ Email</option>
                  <option value="both">👥 Varios (Todos)</option>
                  <option value="none">❌ Desactivado</option>
                </select>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notas Internas</label>
              <textarea
                placeholder="Detalles de la cita, requisitos, advertencias..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
              ></textarea>
            </div>
          </div>
        </form>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {!clientName.trim() || !clientPhone.trim() || !service.trim() ? (
              <span className="text-xs text-rose-500 font-medium">
                * Complete todos los campos obligatorios para guardar.
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!clientName.trim() || !clientPhone.trim() || !service.trim()}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-blue-200 flex items-center gap-1.5 transition transition-colors cursor-pointer"
              id="save-appointment-btn"
            >
              <Check className="w-4 h-4" />
              {isEditMode ? 'Actualizar Cita' : 'Agendar Cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
