import { Appointment, Client, SentNotification } from './types';

export const DEFAULT_SMS_TEMPLATE = "Hola {nombre}, te recordamos tu cita de {servicio} mañana d\u00EDa {fecha} a las {hora}. \u00A1Te esperamos!";
export const DEFAULT_EMAIL_SUBJECT = "Recordatorio de Cita - {servicio} ma\u00F1ana {fecha}";
export const DEFAULT_EMAIL_TEMPLATE = `Estimado/a {nombre},

Le recordamos que se ha agendado una cita para usted:

- \u00C1rea/Servicio: {servicio}
- Fecha: {fecha}
- Hora: {hora}hs
- Duraci\u00F3n estimada: {duracion} minutos

Si necesita realizar alg\u00FAn cambio, cancelar o postergar su cita, por favor responda a este correo o ll\u00E1menos de inmediato.

\u00A1Muchas gracias por confiar en nosotros!
Atentamente,
Centro de Gesti\u00F3n de Citas`;

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+34 612 345 678',
    notes: 'Prefiere atención por la tarde.'
  },
  {
    id: 'c2',
    name: 'Sof\u00EDa Rodr\u00EDguez',
    email: 'sofia.rod@email.com',
    phone: '+34 689 765 432',
    notes: 'Nueva cliente. Requiere valoración inicial.'
  },
  {
    id: 'c3',
    name: 'Alejandro G\u00F3mez',
    email: 'ale.gomez@email.com',
    phone: '+34 677 888 999',
    notes: 'Siempre puntual.'
  },
  {
    id: 'c4',
    name: 'Mar\u00EDa \u00C1lvarez',
    email: 'maria.alv@email.com',
    phone: '+34 633 444 555',
    notes: 'Recordatorios por SMS preferidos.'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clientName: 'Carlos Mendoza',
    clientPhone: '+34 612 345 678',
    clientEmail: 'carlos.mendoza@email.com',
    service: 'Fisioterapia General',
    date: '2026-06-12', // today is June 10, so this is +2 days
    time: '16:00',
    duration: 50,
    notes: 'Segunda sesión de hombro.',
    notificationEnabled: true,
    notificationType: 'both',
    smsTemplate: DEFAULT_SMS_TEMPLATE,
    emailSubject: DEFAULT_EMAIL_SUBJECT,
    emailTemplate: DEFAULT_EMAIL_TEMPLATE,
    status: 'scheduled',
    createdAt: '2026-06-08T09:30:00Z'
  },
  {
    id: 'a2',
    clientName: 'Sof\u00EDa Rodr\u00EDguez',
    clientPhone: '+34 689 765 432',
    clientEmail: 'sofia.rod@email.com',
    service: 'Limpieza Dental',
    date: '2026-06-11', // today is June 10, so this is tomorrow! Notification scheduled for June 10 (today)
    time: '10:30',
    duration: 45,
    notes: 'Limpieza semestral estándar.',
    notificationEnabled: true,
    notificationType: 'email',
    smsTemplate: DEFAULT_SMS_TEMPLATE,
    emailSubject: DEFAULT_EMAIL_SUBJECT,
    emailTemplate: DEFAULT_EMAIL_TEMPLATE,
    status: 'scheduled',
    createdAt: '2026-06-09T14:15:00Z'
  },
  {
    id: 'a3',
    clientName: 'Alejandro G\u00F3mez',
    clientPhone: '+34 677 888 999',
    clientEmail: 'ale.gomez@email.com',
    service: 'Revisi\u00F3n de Presupuesto',
    date: '2026-06-08', // in the past
    time: '12:00',
    duration: 30,
    notes: 'Cita completada con éxito.',
    notificationEnabled: true,
    notificationType: 'sms',
    smsTemplate: DEFAULT_SMS_TEMPLATE,
    emailSubject: DEFAULT_EMAIL_SUBJECT,
    emailTemplate: DEFAULT_EMAIL_TEMPLATE,
    status: 'completed',
    createdAt: '2026-06-05T11:00:00Z'
  },
  {
    id: 'a4',
    clientName: 'Mar\u00EDa \u00C1lvarez',
    clientPhone: '+34 633 444 555',
    clientEmail: 'maria.alv@email.com',
    service: 'Consulta de Nutrici\u00F3n',
    date: '2026-06-15', // +5 days
    time: '18:00',
    duration: 60,
    notes: 'Ajuste de dieta de entrenamiento.',
    notificationEnabled: true,
    notificationType: 'both',
    smsTemplate: DEFAULT_SMS_TEMPLATE,
    emailSubject: DEFAULT_EMAIL_SUBJECT,
    emailTemplate: DEFAULT_EMAIL_TEMPLATE,
    status: 'scheduled',
    createdAt: '2026-06-10T08:00:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: SentNotification[] = [
  {
    id: 'n1',
    appointmentId: 'a3',
    clientName: 'Alejandro G\u00F3mez',
    type: 'sms',
    recipient: '+34 677 888 999',
    content: 'Hola Alejandro G\u00F3mez, te recordamos tu cita de Revisi\u00F3n de Presupuesto ma\u00F1ana d\u00EDa 2026-06-08 a las 12:00. \u00A1Te esperamos!',
    scheduledForDate: '2026-06-07',
    sentAt: '2026-06-07 09:00',
    status: 'sent'
  },
  {
    // Sofia's appointment is June 11, so notice scheduled for June 10 (today!)
    id: 'n2',
    appointmentId: 'a2',
    clientName: 'Sof\u00EDa Rodr\u00EDguez',
    type: 'email',
    recipient: 'sofia.rod@email.com',
    subject: 'Recordatorio de Cita - Limpieza Dental ma\u00F1ana 2026-06-11',
    content: `Estimado/a Sof\u00EDa Rodr\u00EDguez,\n\nLe recordamos que se ha agendado una cita para usted:\n\n- \u00C1rea/Servicio: Limpieza Dental\n- Fecha: 2026-06-11\n- Hora: 10:30hs\n- Duraci\u00F3n estimada: 45 minutos\n\nSi necesita realizar alg\u00FAn cambio, cancelar o postergar su cita, por favor responda a este correo o ll\u00E1menos de inmediato.\n\n\u00A1Muchas gracias por confiar en nosotros!\nAtentamente,\nCentro de Gesti\u00F3n de Citas`,
    scheduledForDate: '2026-06-10',
    status: 'pending' // pending because today is June 10, user can trigger "Procesar envíos automáticos" or "Simular enviado"
  },
  {
    id: 'n3',
    appointmentId: 'a1',
    clientName: 'Carlos Mendoza',
    type: 'sms',
    recipient: '+34 612 345 678',
    content: 'Hola Carlos Mendoza, te recordamos tu cita de Fisioterapia General ma\u00F1ana d\u00EDa 2026-06-12 a las 16:00. \u00A1Te esperamos!',
    scheduledForDate: '2026-06-11',
    status: 'pending'
  },
  {
    id: 'n4',
    appointmentId: 'a1',
    clientName: 'Carlos Mendoza',
    type: 'email',
    recipient: 'carlos.mendoza@email.com',
    subject: 'Recordatorio de Cita - Fisioterapia General ma\u00F1ana 2026-06-12',
    content: `Estimado/a Carlos Mendoza,\n\nLe recordamos que se ha agendado una cita para usted:\n\n- \u00C1rea/Servicio: Fisioterapia General\n- Fecha: 2026-06-12\n- Hora: 16:00hs\n- Duraci\u00F3n estimada: 50 minutos\n\nSi necesita realizar alg\u00FAn cambio, cancelar o postergar su cita, por favor responda a este correo o ll\u00E1menos de inmediato.\n\n\u00A1Muchas gracias por confiar en nosotros!\nAtentamente,\nCentro de Gesti\u00F3n de Citas`,
    scheduledForDate: '2026-06-11',
    status: 'pending'
  }
];
