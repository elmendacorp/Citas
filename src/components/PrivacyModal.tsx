import React from 'react';
import { X, Shield, Lock, Eye, Check } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh] border border-slate-100 overflow-hidden"
        id="privacy-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Política de Privacidad
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Última actualización: Junio 2026
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-650 text-xs leading-relaxed">
          <section className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Lock className="w-4 h-4 text-blue-500 shrink-0" /> 1. Tratamiento de Datos Personales
            </h4>
            <p>
              En nuestro sistema de Gestión de Citas y Alertas, la privacidad y seguridad de la información es primordial. Recopilamos y almacenamos los siguientes datos de los clientes con el único propósito de gestionar sus citas médicas y recordatorios:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1.5 text-[11px]">
              <li><strong>Nombre y Apellido:</strong> Para identificar al titular de la cita.</li>
              <li><strong>Teléfono Móvil:</strong> Utilizado para el envío de recordatorios de citas vía SMS o WhatsApp.</li>
              <li><strong>Correo Electrónico:</strong> Empleado para enviar notificaciones de citas y detalles de confirmación.</li>
              <li><strong>Notas de Cita:</strong> Información adicional que sea estrictamente necesaria para la atención.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Eye className="w-4 h-4 text-blue-500 shrink-0" /> 2. Finalidad del Tratamiento
            </h4>
            <p>
              Tus datos son tratados de forma exclusiva para asegurar el correcto flujo de las citas programadas y alertar automáticamente al cliente con <strong>24 horas de antelación</strong>. No compartimos, vendemos ni distribuimos información personal a terceros ajenos a los canales oficiales de despacho y pasarelas de envío (como WhatsApp Business API).
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Check className="w-4 h-4 text-blue-500 shrink-0" /> 3. Control e Integridad (Derechos ARCO)
            </h4>
            <p>
              Como usuario o administrador, dispones de total control sobre los datos. A través de la interfaz de la aplicación, puedes realizar las siguientes acciones en cualquier momento:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1.5 text-[11px]">
              <li><strong>Acceder y Rectificar:</strong> Modificar los perfiles de los clientes o cambiar su información de contacto desde el Directorio.</li>
              <li><strong>Desactivar Avisos:</strong> Deshabilitar el envío automático de notificaciones para citas específicas o de forma global en los Ajustes.</li>
              <li><strong>Eliminación Definitiva:</strong> Borrar completamente a un cliente o sus citas asociadas de la base de datos local (SQLite).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              🛡️ 4. Seguridad de la Información
            </h4>
            <p>
              Los datos se almacenan de forma local en una base de datos segura y encriptada, utilizando protocolos de transferencia HTTPS para todas las comunicaciones y conexiones con las APIs externas.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition transition-colors cursor-pointer"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
