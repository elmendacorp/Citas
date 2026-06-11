import React from 'react';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  Eye, 
  Trash2,
  MessageCircle
} from 'lucide-react';
import { SentNotification, Appointment, AppLog } from '../types';
import { formatHumanDate, formatCustomDate } from '../utils';

interface AlertsManagerProps {
  notifications: SentNotification[];
  appointments: Appointment[];
  simulatedDate: string;
  onAdvanceDate: (newDate: string) => void;
  onTriggerSend: (notifId: string) => void;
  onTriggerAllDue: () => void;
  onDeleteNotification: (id: string) => void;
  onRefreshData?: () => void;
  settings?: {
    dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    dispatcherHour?: string;
  } | null;
  logs: AppLog[];
  onClearLogs: () => void;
}

export default function AlertsManager({
  notifications,
  appointments,
  simulatedDate,
  onAdvanceDate,
  onTriggerSend,
  onTriggerAllDue,
  onDeleteNotification,
  onRefreshData,
  settings,
  logs,
  onClearLogs
}: AlertsManagerProps) {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'sent' | 'logs'>('pending');
  const [inspectingNotif, setInspectingNotif] = React.useState<SentNotification | null>(null);
  const [deletingNotif, setDeletingNotif] = React.useState<SentNotification | null>(null);

  const handleConfirmAppointmentManually = async (apptId: string, notifId: string) => {
    try {
      const appt = appointments.find(a => a.id === apptId);
      if (appt) {
        const updatedAppt = { ...appt, status: 'confirmed' as const };
        await fetch(`/api/appointments/${apptId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedAppt)
        });
      }
      onDeleteNotification(notifId);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error('Failed to confirm appointment manually:', e);
    }
  };

  // Group notifications
  const pendingNotifs = React.useMemo(() => {
    return notifications.filter(n => n.status === 'pending' && n.scheduledForDate === simulatedDate);
  }, [notifications, simulatedDate]);

  const sentNotifs = React.useMemo(() => {
    return notifications.filter(n => n.status === 'sent');
  }, [notifications]);

  // Count alerts that are scheduled for EXACTLY the simulated date or earlier but still pending
  const dueCount = React.useMemo(() => {
    return pendingNotifs.filter(n => n.scheduledForDate <= simulatedDate).length;
  }, [pendingNotifs, simulatedDate]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full" id="alerts-card">
      

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
        <button
          onClick={() => {
            setActiveTab('logs');
            setInspectingNotif(null);
          }}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📜 Logs ({logs.length})
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
                    <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-emerald-50 text-emerald-600">
                      <MessageCircle className="w-4 h-4" />
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
                        {appt ? `Cita de ${appt.service} (${formatCustomDate(appt.date, settings?.dateFormat)})` : 'Cita agendada'}
                      </p>

                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100/60 pt-2">
                        <span>
                          📅 Alerta: <strong>{formatCustomDate(notif.scheduledForDate, settings?.dateFormat)}</strong>
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
                          <button
                            onClick={() => setDeletingNotif(notif)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                            title="Eliminar aviso pendiente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'sent' ? (
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
                  <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-emerald-50 text-emerald-600">
                    <MessageCircle className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-800 truncate">{notif.clientName}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 shrink-0 uppercase tracking-widest">
                        Enviado
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-slate-555 truncate mt-0.5 font-semibold">
                      Enviado a: <strong className="font-mono text-slate-700 font-bold">{notif.recipient}</strong>
                    </p>

                    <p className="text-[10px] text-slate-400 font-mono mt-1 shrink-0">
                      ⏱️ Enviado: {(() => {
                        if (!notif.sentAt) return '';
                        const parts = notif.sentAt.split(' ');
                        if (parts.length === 2) {
                          return `${formatCustomDate(parts[0], settings?.dateFormat)} ${parts[1]}`;
                        }
                        return notif.sentAt;
                      })()}
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
        ) : (
          /* Logs Tab */
          <div className="space-y-2.5" id="app-logs-list">
            <div className="flex justify-between items-center mb-2 bg-slate-50/60 p-2 rounded-lg border border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400">Actividad de la Aplicación</span>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-[9px] font-bold text-rose-550 hover:text-rose-700 hover:underline transition cursor-pointer flex items-center gap-0.5"
                >
                  🗑️ Borrar Logs
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center text-xs space-y-2">
                <Clock className="w-8 h-8 text-slate-300" />
                <div>
                  <p className="font-semibold text-slate-500">No hay actividad registrada</p>
                  <p className="text-[10px] max-w-xs mt-1">Los movimientos de citas, alertas y clientes se listarán aquí.</p>
                </div>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition text-[11px] space-y-1 hover:bg-slate-50/70"
                >
                  <div className="flex justify-between items-start gap-2 font-bold">
                    <span className="text-slate-800 leading-tight">{log.action}</span>
                    <span className="text-[8px] text-slate-400 font-mono font-bold shrink-0 mt-0.5 bg-slate-100 px-1 py-0.5 rounded">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium whitespace-pre-wrap">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
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
              <span className="uppercase font-bold text-emerald-600">{inspectingNotif.type}</span>
            </div>
            {inspectingNotif.subject && (
              <p className="text-xs font-bold text-slate-800">
                Asunto: {inspectingNotif.subject}
              </p>
            )}
            
            <p className="text-xs text-slate-600 leading-normal whitespace-pre-wrap font-sans bg-slate-50/55 p-2.5 rounded border border-slate-100 max-h-[150px] overflow-y-auto font-mono text-[11px]">
              {inspectingNotif.content}
            </p>
          </div>
        </div>
      )}

      {deletingNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                🗑️ Eliminar Alerta Pendiente
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                ¿Qué acción deseas realizar con la alerta de <strong>{deletingNotif.clientName}</strong>?
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  onDeleteNotification(deletingNotif.id);
                  setDeletingNotif(null);
                }}
                className="w-full text-left p-3 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/20 rounded-xl transition cursor-pointer flex flex-col justify-start"
              >
                <span className="text-xs font-bold text-slate-800">❌ Cancelar envío de notificación</span>
                <span className="text-[10px] text-slate-450 mt-0.5">Elimina el aviso programado sin modificar el estado de la cita.</span>
              </button>
              
              <button
                onClick={() => {
                  handleConfirmAppointmentManually(deletingNotif.appointmentId, deletingNotif.id);
                  setDeletingNotif(null);
                }}
                className="w-full text-left p-3 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/20 rounded-xl transition cursor-pointer flex flex-col justify-start"
              >
                <span className="text-xs font-bold text-emerald-800">✅ Confirmar cita manualmente</span>
                <span className="text-[10px] text-slate-450 mt-0.5">Elimina el aviso y marca el estado de la cita como "Confirmada".</span>
              </button>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDeletingNotif(null)}
                className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="p-3 bg-slate-50 text-[10px] text-slate-400 border-t border-slate-100 text-center font-semibold">
        🛡️ El despachador automático corre 1 día antes a las {settings?.dispatcherHour || '09:00'}hs.
      </div>

    </div>
  );
}
