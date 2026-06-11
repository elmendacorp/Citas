export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  notes?: string;
  
  // Notification Config
  notificationEnabled: boolean;
  notificationType: 'sms' | 'email' | 'whatsapp' | 'both';
  smsTemplate: string;
  emailSubject: string;
  emailTemplate: string;
  
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  professional?: string;
}

export interface SentNotification {
  id: string;
  appointmentId: string;
  clientName: string;
  type: 'sms' | 'email' | 'whatsapp';
  recipient: string; // phone or email
  subject?: string;
  content: string;
  scheduledForDate: string; // YYYY-MM-DD (1 day before appointment date)
  sentAt?: string; // YYYY-MM-DD HH:MM if sent, or undefined if pending
  status: 'pending' | 'sent' | 'failed';
}

export interface AppLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

