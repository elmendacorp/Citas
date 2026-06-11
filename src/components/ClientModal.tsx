import React from 'react';
import { X, Check } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'> & { id?: string }) => void;
  initialClient?: Client | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  initialClient
}: ClientModalProps) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const isEditMode = !!(initialClient && initialClient.id);

  React.useEffect(() => {
    if (initialClient) {
      setName(initialClient.name);
      setPhone(initialClient.phone);
      setEmail(initialClient.email);
      setNotes(initialClient.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
  }, [initialClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSave({
      id: initialClient?.id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || 'sin@correo.com',
      notes: notes.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="relative bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[92vh] border border-slate-100 overflow-hidden"
        id="client-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditMode ? '👤 Editar Cliente' : '👤 Registrar Nuevo Cliente'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditMode ? 'Actualice la información de contacto y notas del cliente.' : 'Añada un cliente manualmente a la base de datos.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Nombre y Apellidos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
            <input
              type="tel"
              required
              placeholder="e.g. +34 612 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="e.g. cliente@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas Internas</label>
            <textarea
              placeholder="Detalles sobre el cliente, observaciones..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {(!name.trim() || !phone.trim()) && (
              <span className="text-xs text-rose-500 font-medium">* Nombre y teléfono son obligatorios.</span>
            )}
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
              disabled={!name.trim() || !phone.trim()}
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-blue-200 flex items-center gap-1.5 transition transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
