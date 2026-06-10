import React from 'react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Smartphone, 
  Mail, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Calendar,
  Eye,
  Trash2
} from 'lucide-react';
import { SentNotification, Appointment } from '../types';
import { formatHumanDate } from '../utils';

interface AlertsManagerProps {
  notifications: SentNotification[];
  appointments: Appointment[];
  simulatedDate: string;
  onAdvanceDate: (newDate: string) => void;
  onTriggerSend: (notifId: string) => void;
  onTriggerAllDue: () => void;
  onDeleteNotification: (id: string) => void;
}

export default function AlertsManager({
  notifications,
  appointments,
  simulatedDate,
  onAdvanceDate,
  onTriggerSend,
  onTriggerAllDue,
  onDeleteNotification
}: AlertsManagerProps) {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'sent'>('pending');
  const [inspectingNotif, setInspectingNotif] = React.useState<SentNotification | null>(null);

  // Group notifications
  const pendingNotifs = React.useMemo(() => {
    return notifications.filter(n => n.status === 'pending');
  }, [notifications]);

  const sentNotifs = React.useMemo(() => {
    return notifications.filter(n => n.status === 'sent');
  }, [notifications]);

  // Count alerts that are scheduled for EXACTLY the simulated date or earlier but still pending
  const dueCount = React.useMemo(() => {
    return pendingNotifs.filter(n => n.scheduledForDate <= simulatedDate).length;
  }, [pendingNotifs, simulatedDate]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full" id="alerts-card">
      
      {/* Simulation/Time Travel Controller */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 select-none" />
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest leading-none">Fecha de Control del Sistema</span>
            <span className="text-sm font-bold block text-slate-100" id="simulated-date-display">
              📅 {formatHumanDate(simulatedDate)}
            </span>
          </div>
        </div>

        {/* Change simulation day */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs text-slate-300 font-medium">Viajar al:</span>
          <select
            value={simulatedDate}
            onChange={(e) => onAdvanceDate(e.target.value)}
            className="text-xs font-bold text-slate-900 bg-white border border-transparent rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="2026-06-09">09 Jun (Ayer)</option>
            <option value="2026-06-10">10 Jun (Hoy Inicial)</option>
            <option value="2026-06-11">11 Jun (Mañana)</option>
            <option value="2026-06-12">12 Jun (Viernes)</option>
            <option value="2026-06-13">13 Jun (Sábado)</option>
            <option value="2026-06-14">14 Jun (Domingo)</option>
            <option value="2026-06-15">15 Jun (Siguiente Lunes)</option>
            <option value="2026-06-16">16 Jun (+6 Días)</option>
          </select>
        </div>
      </div>

      {/* Due indicator alert bar */}
      {dueCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 text-amber-900 px-4 py-2.5 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tienes <strong>{dueCount}</strong> avisos pendientes programados para enviar el <strong>{simulatedDate}</strong>.
            </span>
          </div>
          <button
            onClick={onTriggerAllDue}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer text-[10px] uppercase shadow-xs shrink-0"
            id="trigger-due-alerts-btn"
          >
            <Send className="w-3 h-3" /> Enviar Todos
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex px-4 pt-3 border-b border-slate-200 bg-slate-50/40">
        <button
          onClick={() => {
            setActiveTab('pending');
            setInspectingNotif(null);
          }}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer relative ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⏰ Pendientes ({pendingNotifs.length})
          {dueCount > 0 && (
            <span className="absolute top-1 right-[-4px] w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('sent');
            setInspectingNotif(null);
          }}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sent'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ✅ Enviados ({sentNotifs.length})
        </button>
      </div>

      {/* Alerts Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[350px] md:max-h-[500px]">
        {activeTab === 'pending' ? (
          pendingNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center text-xs space-y-2">
              <Clock className="w-8 h-8 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-500">No hay avisos pendientes</p>
                <p className="text-[11px] max-w-xs mt-1">Crea nuevas citas con avisos habilitados para verlos programados aquí.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5" id="pending-notifs-list">
              {pendingNotifs.map((notif) => {
                const appt = appointments.find(a => a.id === notif.appointmentId);
                const isDue = notif.scheduledForDate <= simulatedDate;
                
                return (
                  <div 
                    key={notif.id}
                    className={`p-3 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
                      isDue 
                        ? 'bg-amber-50/50 border-amber-200 shadow-xs' 
                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      notif.type === 'sms' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {notif.type === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 truncate">{notif.clientName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                          isDue ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isDue ? '¡Pendiente!' : 'Programado'}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {appt ? `Cita de ${appt.service} (${appt.date})` : 'Cita agendada'}
                      </p>

                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100/60 pt-2">
                        <span>
                          📅 Alerta: <strong>{notif.scheduledForDate}</strong>
                        </span>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => setInspectingNotif(notif)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition"
                            title="Ver mensaje"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onTriggerSend(notif.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-blue-50 transition flex items-center gap-0.5 cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          sentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center text-xs space-y-2">
              <CheckCircle className="w-8 h-8 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-500">No se han enviado avisos aún</p>
                <p className="text-[11px] max-w-xs mt-1">Los avisos enviados un día antes de las citas se archivarán en esta lista.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5" id="sent-notifs-list">
              {sentNotifs.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-3 rounded-xl border border-slate-100 bg-white text-xs flex items-start gap-2.5 hover:border-slate-200 transition-all shadow-2xs"
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    notif.type === 'sms' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {notif.type === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-800 truncate">{notif.clientName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 shrink-0 uppercase tracking-widest">
                        Enviado
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Enviado a: <strong className="font-mono text-slate-700">{notif.recipient}</strong>
                    </p>

                    <p className="text-[10px] text-slate-400 font-mono mt-1 shrink-0">
                      ⏱️ Enviado: {notif.sentAt}
                    </p>

                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100/60 pt-2">
                      <button
                        onClick={() => setInspectingNotif(notif)}
                        className="text-[10px] text-slate-600 hover:text-blue-600 font-bold hover:underline transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Contenido
                      </button>
                      
                      <button
                        onClick={() => onDeleteNotification(notif.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded transition cursor-pointer"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Inspect template modal dialog inside alerts right sidebar */}
      {inspectingNotif && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" /> Inspección de Alerta
            </span>
            <button
              onClick={() => setInspectingNotif(null)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-md px-1.5 py-0.5 animate-none"
            >
              Cerrar
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-[10px] border-b border-slate-100 pb-1 text-slate-400">
              <span>Para: <strong>{inspectingNotif.clientName}</strong> ({inspectingNotif.recipient})</span>
              <span className="uppercase font-bold text-blue-600">{inspectingNotif.type}</span>
            </div>
            {inspectingNotif.subject && (
              <p className="text-xs font-bold text-slate-800">
                Asunto: {inspectingNotif.subject}
              </p>
            )}
            <p className="text-xs text-slate-600 leading-normal whitespace-pre-wrap font-sans bg-slate-50/55 p-2 rounded border border-slate-100 max-h-[120px] overflow-y-auto font-mono text-[11px]">
              {inspectingNotif.content}
            </p>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="p-3 bg-slate-50 text-[10px] text-slate-400 border-t border-slate-100 text-center font-semibold">
        🛡️ El despachador automático corre 1 día antes a las 09:00hs.
      </div>

    </div>
  );
}
