import React from 'react';
import { X, Bell, Eye, Info, Check, Trash2 } from 'lucide-react';
import { parseTemplate } from '../utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    notificationEnabled: boolean;
    notificationType: 'sms' | 'email' | 'whatsapp' | 'both';
    smsTemplate: string;
    emailSubject: string;
    emailTemplate: string;
    dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    defaultDuration?: number;
    defaultStatus?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    defaultNotificationType?: 'sms' | 'email' | 'whatsapp' | 'both' | 'none';
    dispatcherHour?: string;
    professionals?: string;
  };
  onSave: (settings: any) => Promise<void>;
}

interface Professional {
  id: string;
  name: string;
  contact: string;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave
}: SettingsModalProps) {
  const [notificationEnabled, setNotificationEnabled] = React.useState(true);
  const [notificationType, setNotificationType] = React.useState<'sms' | 'email' | 'whatsapp' | 'both'>('both');
  const [smsTemplate, setSmsTemplate] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('');
  const [emailTemplate, setEmailTemplate] = React.useState('');
  const [dateFormat, setDateFormat] = React.useState<'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'>('YYYY-MM-DD');
  const [defaultDuration, setDefaultDuration] = React.useState<number>(30);
  const [defaultStatus, setDefaultStatus] = React.useState<'scheduled' | 'confirmed' | 'completed' | 'cancelled'>('scheduled');
  const [defaultNotificationType, setDefaultNotificationType] = React.useState<'sms' | 'email' | 'whatsapp' | 'both' | 'none'>('whatsapp');
  const [dispatcherHour, setDispatcherHour] = React.useState('09:00');
  const [professionals, setProfessionals] = React.useState<Professional[]>([]);
  const [newProfName, setNewProfName] = React.useState('');
  const [newProfContact, setNewProfContact] = React.useState('');
  const [systemTime, setSystemTime] = React.useState('');
  const [previewTab, setPreviewTab] = React.useState<'sms' | 'email' | 'whatsapp'>('whatsapp');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (settings) {
      setNotificationEnabled(settings.notificationEnabled);
      setNotificationType('whatsapp');
      setSmsTemplate(settings.smsTemplate || '');
      setEmailSubject('');
      setEmailTemplate('');
      setDateFormat(settings.dateFormat || 'YYYY-MM-DD');
      setDefaultDuration(settings.defaultDuration || 30);
      setDefaultStatus(settings.defaultStatus || 'scheduled');
      setDefaultNotificationType('whatsapp');
      setDispatcherHour(settings.dispatcherHour || '09:00');
      
      try {
        const parsed = JSON.parse(settings.professionals || '[]');
        setProfessionals(parsed);
      } catch (e) {
        setProfessionals([]);
      }
      
      setPreviewTab('whatsapp');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const previewPayload = {
    nombre: 'Juan Pérez',
    servicio: 'Cita de Fisioterapia',
    fecha: '2026-06-11',
    hora: '10:00',
    duracion: 30,
    telefono: '+34 600 000 000',
    email: 'juan.perez@email.com'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        notificationEnabled,
        notificationType,
        smsTemplate,
        emailSubject,
        emailTemplate,
        dateFormat,
        defaultDuration,
        defaultStatus,
        defaultNotificationType,
        dispatcherHour,
        professionals: JSON.stringify(professionals)
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="relative bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[92vh] border border-slate-100 overflow-hidden"
        id="settings-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              ⚙️ Configuración Global de Avisos
            </h3>
            <p className="text-xs text-slate-500">
              Establezca las plantillas y canales de notificaciones automáticas para todas las citas.
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
            
            {/* LEFT COLUMN: Configuration options */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-500" /> Opciones del Sistema
                </h4>
                
                {/* Enabled Toggle Switch */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={(e) => setNotificationEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                  <span className="text-xs font-bold text-slate-707">Avisos Activos</span>
                </label>
              </div>

              {/* Formatos y Valores Predeterminados */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-3xs">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  📅 Formatos y Valores Predeterminados
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Formato de Fecha
                    </label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="YYYY-MM-DD">AAAA-MM-DD (e.g. 2026-06-10)</option>
                      <option value="DD/MM/YYYY">DD/MM/AAAA (e.g. 10/06/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/AAAA (e.g. 06/10/2026)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Duración por Defecto
                    </label>
                    <select
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-605 mb-1">
                      Estado por Defecto
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="scheduled">🟢 Programada</option>
                      <option value="confirmed">🔵 Confirmada</option>
                      <option value="completed">💙 Completada</option>
                      <option value="cancelled">🔴 Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-650 mb-1">
                      Aviso por Defecto
                    </label>
                    <select
                      value={defaultNotificationType}
                      onChange={(e) => setDefaultNotificationType(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="whatsapp">💬 WhatsApp</option>
                      <option value="none">❌ Desactivado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-605 mb-1">
                      Hora del Despachador
                    </label>
                    <input
                      type="time"
                      value={dispatcherHour}
                      onChange={(e) => setDispatcherHour(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col justify-end h-full pb-1">
                    <span className="text-[10px] font-semibold text-slate-500">
                      ⏰ Hora Actual del Sistema
                    </span>
                    <span className="text-xs font-black text-slate-700 font-mono mt-1 flex items-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      {systemTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gestión de Profesionales */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-3xs">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  👥 Gestión de Profesionales
                </h5>
                
                {/* List of professionals */}
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {professionals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center bg-white rounded-lg border border-slate-100">
                      No hay profesionales registrados.
                    </p>
                  ) : (
                    professionals.map((prof) => (
                      <div key={prof.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-150 shadow-3xs">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">👩‍⚕️ {prof.name}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">📞 Contacto: {prof.contact}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfessionals(prev => prev.filter(p => p.id !== prof.id))}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                          title="Eliminar profesional"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new professional form */}
                <div className="border-t border-slate-200 pt-3">
                  <span className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    Añadir Nuevo Profesional
                  </span>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Nombre (ej. Dr. Pérez)"
                        value={newProfName}
                        onChange={(e) => setNewProfName(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Contacto (ej. +34 600...)"
                        value={newProfContact}
                        onChange={(e) => setNewProfContact(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProfName.trim()) return;
                      const newProf = {
                        id: `p-${Date.now()}`,
                        name: newProfName.trim(),
                        contact: newProfContact.trim() || 'Sin contacto'
                      };
                      setProfessionals(prev => [...prev, newProf]);
                      setNewProfName('');
                      setNewProfContact('');
                    }}
                    className="w-full text-xs py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    + Añadir Profesional
                  </button>
                </div>
              </div>

              {notificationEnabled ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-850 rounded-xl p-3 text-xs flex gap-2">
                    <Info className="w-4 h-4 text-emerald-605 shrink-0 mt-0.5" />
                    <div>
                      Al modificar la plantilla, <strong>todos los avisos pendientes en la base de datos</strong> se regenerarán automáticamente para reflejar estos cambios.
                    </div>
                  </div>

                  {/* Template Editor Box */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-3xs">
                    <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Personalizar Plantilla</span>
                    </div>

                    <div className="p-3.5 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cuerpo del Mensaje (WhatsApp)</label>
                        <textarea
                          rows={4}
                          value={smsTemplate}
                          onChange={(e) => setSmsTemplate(e.target.value)}
                          className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          placeholder="Escriba la plantilla..."
                        ></textarea>
                        <p className="text-[9px] mt-1 text-emerald-600 font-bold italic">
                          * El mensaje de WhatsApp se enviará con los dos botones interactivos ("Sí" / "No") de manera automática.
                        </p>
                      </div>

                      {/* dynamic keywords tags */}
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <span className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Variables Dinámicas (clic para insertar):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['{nombre}', '{fecha}', '{hora}', '{duracion}', '{profesional}'].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSmsTemplate(prev => prev + ' ' + tag);
                              }}
                              className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 font-mono text-[9px] text-slate-600 rounded px-2 py-0.5 transition-colors cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-100/50 rounded-xl text-slate-400 text-center text-xs space-y-2 border border-dashed border-slate-200">
                  <Bell className="w-8 h-8 text-slate-300 animate-none" />
                  <div>
                    <p className="font-bold text-slate-500">Recordatorios desactivados globalmente</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ningún cliente recibirá alertas automáticas un día antes de su cita.</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Real-Time Live Preview Mockup */}
            <div className="flex flex-col justify-start space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-500" /> Vista Previa del Cliente (Simulación)
              </h4>
              
              <div className="border border-amber-100 rounded-xl overflow-hidden bg-amber-50/15 flex-1 min-h-[300px]">
                <div className="bg-amber-100/50 px-3.5 py-2 border-b border-amber-100 flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Eye className="w-4 h-4 text-amber-600" /> Vista en Pantalla Movil:
                </div>
                
                <div className="p-4 bg-slate-100/40 h-full flex flex-col justify-start min-h-[300px] overflow-y-auto">
                  {notificationEnabled ? (
                    <div className="bg-[#e5ddd5] p-4 rounded-xl border border-slate-300 font-sans shadow-md max-w-sm flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[9px] text-[#075e54] font-black tracking-widest uppercase block mb-1">💬 WHATSAPP RECIBIDO:</span>
                        <div className="bg-white p-3 rounded-tr-lg rounded-b-lg shadow-xs text-xs text-slate-900 leading-normal max-w-[85%] relative">
                          {parseTemplate(smsTemplate, previewPayload)}
                        </div>
                      </div>
                      
                      {/* Interactive WA buttons */}
                      <div className="flex flex-col gap-1.5">
                        <div className="bg-white p-2 rounded-lg text-center text-[#00a884] font-bold text-xs shadow-xs cursor-default hover:bg-slate-50 transition">
                          Sí (Confirmar cita)
                        </div>
                        <div className="bg-white p-2 rounded-lg text-center text-[#f44336] font-bold text-xs shadow-xs cursor-default hover:bg-slate-50 transition">
                          No (Rechazar cita)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="m-auto text-slate-400 text-center text-xs p-6 bg-white rounded-xl border border-slate-150 max-w-xs shadow-3xs italic">
                      Las notificaciones están apagadas. Active "Avisos Activos" a la izquierda para previsualizar los mensajes.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400 italic">
            * Los cambios se aplican inmediatamente después de guardar.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
