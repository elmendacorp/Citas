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
  initialAppointment
}: AppointmentModalProps) {
  // Client info state
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [clientEmail, setClientEmail] = React.useState('');
  
  // Appointment info state
  const [service, setService] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('10:00');
  const [duration, setDuration] = React.useState(30);
  const [notes, setNotes] = React.useState('');
  const [status, setStatus] = React.useState<Appointment['status']>('scheduled');

  // Automatic Notification setup
  const [notificationEnabled, setNotificationEnabled] = React.useState(true);
  const [notificationType, setNotificationType] = React.useState<Appointment['notificationType']>('both');
  const [smsTemplate, setSmsTemplate] = React.useState(DEFAULT_SMS_TEMPLATE);
  const [emailSubject, setEmailSubject] = React.useState(DEFAULT_EMAIL_SUBJECT);
  const [emailTemplate, setEmailTemplate] = React.useState(DEFAULT_EMAIL_TEMPLATE);

  // Autocomplete UI support
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Client[]>([]);

  // Live preview tab within configuration matching UI
  const [previewTab, setPreviewTab] = React.useState<'sms' | 'email'>('sms');

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
    } else {
      // Default creation
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setService('');
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTime('10:00');
      setDuration(30);
      setNotes('');
      setStatus('scheduled');
      
      setNotificationEnabled(true);
      setNotificationType('both');
      setSmsTemplate(DEFAULT_SMS_TEMPLATE);
      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
      setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
    }
  }, [initialAppointment, selectedDate, isOpen]);

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
    if (!clientName.trim() || !service.trim() || !date) {
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
      status
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="relative bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[92vh] border border-slate-100 overflow-hidden"
        id="appointment-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {initialAppointment ? '✏️ Editar Cita Agendada' : '📅 Agendar Nueva Cita'}
            </h3>
            <p className="text-xs text-slate-500">
              {initialAppointment 
                ? `Editando registro de cita #${initialAppointment.id}` 
                : 'Complete los datos del cliente y personalice el aviso automático.'
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Main Appointment Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Datos de la Cita y del Cliente
              </h4>
              
              {/* Cliente Autocomplete Group */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Cliente *</label>
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

              {/* Contact Data (Trigger SMS/Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
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

              {/* Service Details & Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio / Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corte de pelo, Consulta clínica..."
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550"
                  id="service-input"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SERVICE_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setService(preset)}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Datetime Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de la Citas *</label>
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

              {/* Duration and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duración (minutos)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-white"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Appointment['status'])}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-550 bg-white"
                  >
                    <option value="scheduled">🟢 Programada</option>
                    <option value="completed">💙 Completada</option>
                    <option value="cancelled">🔴 Cancelada</option>
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

            {/* RIGHT COLUMN: SMS / EMAIL alert setup */}
            <div className="space-y-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-500" /> Recordatorio Automatizado
                  </h4>
                  
                  {/* Enabled Toggle Switch */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationEnabled}
                      onChange={(e) => setNotificationEnabled(e.target.checked)}
                      className="sr-only peer"
                      id="enable-notification-toggle"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                    <span className="text-xs font-semibold text-slate-700">Aviso Activo</span>
                  </label>
                </div>

                {notificationEnabled ? (
                  <div className="space-y-3">
                    {/* Select Channel */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Canal del Aviso</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNotificationType('sms')}
                          className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            notificationType === 'sms'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationType('email')}
                          className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            notificationType === 'email'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotificationType('both')}
                          className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            notificationType === 'both'
                              ? 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          Ambos
                        </button>
                      </div>
                    </div>

                    {/* Schedule Timing Callout */}
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg p-2.5 text-[11px] flex gap-2">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        El sistema generará automáticamente este aviso para ser enviado exactamente{' '}
                        <strong>un día antes</strong> de la cita. 
                        {alertDate ? (
                          <span className="block mt-1 font-semibold text-emerald-900">
                            📅 Fecha de envío programada: {alertDate} (1 día antes)
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Template Customizer tabs */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Personalizar Mensaje</span>
                        
                        <div className="flex bg-slate-100 p-0.5 rounded-md gap-0.5 animate-none">
                          {(notificationType === 'sms' || notificationType === 'both') && (
                            <button
                              type="button"
                              onClick={() => setPreviewTab('sms')}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                                previewTab === 'sms' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              SMS
                            </button>
                          )}
                          {(notificationType === 'email' || notificationType === 'both') && (
                            <button
                              type="button"
                              onClick={() => setPreviewTab('email')}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md cursor-pointer transition-all ${
                                previewTab === 'email' || notificationType === 'email' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Email
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editing panel Content */}
                      <div className="p-3 space-y-3">
                        {previewTab === 'sms' && (notificationType === 'sms' || notificationType === 'both') ? (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cuerpo del SMS</label>
                            <textarea
                              rows={3}
                              value={smsTemplate}
                              onChange={(e) => setSmsTemplate(e.target.value)}
                              className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              placeholder="Escriba la plantilla del SMS..."
                            ></textarea>
                          </div>
                        ) : (
                          <div className="space-y-2">
                             <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Asunto del Correo</label>
                              <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                placeholder="Asunto..."
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Cuerpo del Email</label>
                              <textarea
                                rows={4}
                                value={emailTemplate}
                                onChange={(e) => setEmailTemplate(e.target.value)}
                                className="w-full text-xs font-mono p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                placeholder="Cuerpo del correo..."
                              ></textarea>
                            </div>
                          </div>
                        )}

                        {/* Keyword list assistance */}
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Etiquetas dinámicas disponibles:</span>
                          <div className="flex flex-wrap gap-1">
                            {['{nombre}', '{servicio}', '{fecha}', '{hora}', '{duracion}'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (previewTab === 'sms') {
                                    setSmsTemplate(prev => prev + ' ' + tag);
                                  } else {
                                    setEmailTemplate(prev => prev + ' ' + tag);
                                  }
                                }}
                                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 font-mono text-[9px] text-slate-600 rounded px-1.5 py-0.5 transition-colors cursor-pointer"
                                title="Haga clic para insertar"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-rendered Live Preview box */}
                    <div className="border border-amber-100 rounded-xl overflow-hidden bg-amber-50/20">
                      <div className="bg-amber-100/50 px-3 py-1.5 border-b border-amber-100 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                        <Eye className="w-4 h-4" /> Vista Previa Real (Lo que recibirá {clientName || 'el cliente'}):
                      </div>
                      <div className="p-3 text-xs text-slate-700 bg-white min-h-[90px] max-h-[140px] overflow-y-auto whitespace-pre-wrap font-sans">
                        {previewTab === 'sms' && (notificationType === 'sms' || notificationType === 'both') ? (
                          <div className="bg-emerald-50/10 p-2 border border-slate-100 rounded-lg font-mono">
                            <span className="text-[10px] text-emerald-700 font-bold tracking-widest uppercase block mb-1">📱 SMS RECIBIDO:</span>
                            {parseTemplate(smsTemplate, previewPayload)}
                          </div>
                        ) : (
                          <div className="bg-slate-50/30 p-2 border border-slate-100 rounded-lg">
                            <span className="text-[10px] text-blue-700 font-bold block mb-1 uppercase tracking-wider">✉️ EMAIL RECIBIDO:</span>
                            <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 mb-1.5">
                              Asunto: {parseTemplate(emailSubject, previewPayload)}
                            </div>
                            <div className="text-slate-600 font-sans text-xs">
                              {parseTemplate(emailTemplate, previewPayload)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-100/50 rounded-xl text-slate-400 text-center text-xs space-y-2 border border-dashed border-slate-200">
                    <Bell className="w-8 h-8 text-slate-300" />
                    <div>
                      <p className="font-semibold text-slate-500">Aviso automático desactivado</p>
                      <p className="text-[11px]">Este cliente no recibirá alertas programadas de SMS o email un día antes de la cita.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Warnings client missing info */}
              {notificationEnabled && (
                <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                  {(notificationType === 'sms' || notificationType === 'both') && !clientPhone.trim() && (
                    <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-sm">
                      ⚠️ Se requiere número de móvil para enviar alertas por SMS.
                    </p>
                  )}
                  {(notificationType === 'email' || notificationType === 'both') && !clientEmail.trim() && (
                    <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-sm">
                      ⚠️ Se requiere correo electrónico para enviar alertas por email.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </form>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {!clientName.trim() || !service.trim() ? (
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
              disabled={!clientName.trim() || !service.trim()}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-blue-200 flex items-center gap-1.5 transition transition-colors cursor-pointer"
              id="save-appointment-btn"
            >
              <Check className="w-4 h-4" />
              {initialAppointment ? 'Actualizar Cita' : 'Agendar Cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
