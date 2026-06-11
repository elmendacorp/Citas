import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to add activity log
function addLog(action: string, details?: string) {
  try {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO logs (id, action, details, timestamp) VALUES (?, ?, ?, ?)');
    stmt.run(id, action, details || '', timestamp);
  } catch (error) {
    console.error('Failed to insert log:', error);
  }
}

// --- Clients API ---

app.get('/api/clients', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients').all();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const { id, name, email, phone, notes } = req.body;
    const stmt = db.prepare('INSERT INTO clients (id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, email, phone, notes);
    addLog('Cliente Creado', `Registrado cliente: ${name} (${phone})`);
    res.status(201).json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;
    const stmt = db.prepare('UPDATE clients SET name = ?, email = ?, phone = ?, notes = ? WHERE id = ?');
    stmt.run(name, email, phone, notes, req.params.id);
    addLog('Cliente Actualizado', `Modificado cliente: ${name} (${phone})`);
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  try {
    const client: any = db.prepare('SELECT name FROM clients WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    addLog('Cliente Eliminado', `Eliminado cliente: ${client ? client.name : req.params.id}`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// --- Appointments API ---

app.get('/api/appointments', (req, res) => {
  try {
    const appointments = db.prepare('SELECT * FROM appointments').all();
    // Convert boolean stored as INTEGER back to boolean for the frontend
    const mapped = appointments.map(a => ({
      ...a,
      notificationEnabled: a.notificationEnabled === 1
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    const appt = req.body;
    const stmt = db.prepare(`
      INSERT INTO appointments (
        id, clientName, clientPhone, clientEmail, service, date, time, duration, notes, 
        notificationEnabled, notificationType, smsTemplate, emailSubject, emailTemplate, status, createdAt, professional
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      appt.id, appt.clientName, appt.clientPhone, appt.clientEmail, appt.service, appt.date, appt.time, appt.duration, appt.notes,
      appt.notificationEnabled ? 1 : 0, appt.notificationType, appt.smsTemplate, appt.emailSubject, appt.emailTemplate, appt.status, appt.createdAt, appt.professional
    );
    syncNotificationsForAppointment(appt.id);
    addLog('Cita Creada', `Cita para ${appt.clientName} (${appt.service}) el ${appt.date} a las ${appt.time} con ${appt.professional || 'Sin asignar'}`);
    res.status(201).json(appt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const appt = req.body;
    const stmt = db.prepare(`
      UPDATE appointments SET 
        clientName = ?, clientPhone = ?, clientEmail = ?, service = ?, date = ?, time = ?, duration = ?, notes = ?, 
        notificationEnabled = ?, notificationType = ?, smsTemplate = ?, emailSubject = ?, emailTemplate = ?, status = ?, professional = ?
      WHERE id = ?
    `);
    stmt.run(
      appt.clientName, appt.clientPhone, appt.clientEmail, appt.service, appt.date, appt.time, appt.duration, appt.notes,
      appt.notificationEnabled ? 1 : 0, appt.notificationType, appt.smsTemplate, appt.emailSubject, appt.emailTemplate, appt.status, appt.professional, req.params.id
    );
    syncNotificationsForAppointment(req.params.id);
    addLog('Cita Actualizada', `Cita de ${appt.clientName} (${appt.service}) el ${appt.date} a las ${appt.time}. Estado: ${appt.status}. Profesional: ${appt.professional || 'Sin asignar'}`);
    res.json(appt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const appt: any = db.prepare('SELECT clientName, service, date, time FROM appointments WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
    // Also delete associated pending notifications
    db.prepare("DELETE FROM notifications WHERE appointmentId = ? AND status = 'pending'").run(req.params.id);
    addLog('Cita Eliminada', `Eliminada cita de ${appt ? appt.clientName : req.params.id} (${appt ? appt.service : ''} el ${appt ? appt.date : ''})`);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

// --- Notifications API ---

app.get('/api/notifications', (req, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications').all();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications', (req, res) => {
  try {
    const notif = req.body;
    const stmt = db.prepare(`
      INSERT INTO notifications (id, appointmentId, clientName, type, recipient, subject, content, scheduledForDate, sentAt, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(notif.id, notif.appointmentId, notif.clientName, notif.type, notif.recipient, notif.subject, notif.content, notif.scheduledForDate, notif.sentAt, notif.status);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.put('/api/notifications/:id', async (req, res) => {
  try {
    const notif = req.body;
    
    // Si la notificación es de tipo WhatsApp y la estamos marcando como enviada,
    // Enviamos la notificación real a la API de WhatsApp Cloud.
    if (notif.status === 'sent' && notif.type === 'whatsapp') {
      try {
        const openwaUrl = process.env.OPENWA_API_URL || 'http://localhost:2785';
        const apiKey = process.env.OPENWA_API_KEY || '';
        // Format recipient number (E.164 without leading +)
        const cleanPhone = notif.recipient.replace(/\D/g, '');
        const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;
        const payload = {
          to: formattedPhone,
          body: notif.content,
          buttons: [
            { id: `CONFIRM_APPT_${notif.appointmentId}`, text: 'Sí' },
            { id: `CANCEL_APPT_${notif.appointmentId}`, text: 'No' }
          ]
        };
        const response = await fetch(`${openwaUrl}/api/sendButtons`, {
          method: 'POST',
          headers: {
            ...(apiKey ? { 'X-API-Key': apiKey } : {}),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const err = await response.text();
          console.error('OpenWA API error:', response.status, err);
        } else {
          const resJson = await response.json();
          console.log('OpenWA message sent:', resJson);
        }
      } catch (e) {
        console.error('Failed to send WhatsApp message via OpenWA:', e);
      }
    }

    const stmt = db.prepare(`
      UPDATE notifications SET 
        status = ?, sentAt = ?
      WHERE id = ?
    `);
    stmt.run(notif.status, notif.sentAt, req.params.id);
    addLog('Alerta Enviada', `Enviada notificación ${notif.type} a ${notif.clientName} (${notif.recipient})`);
    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

app.delete('/api/notifications/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// --- Bulk operations for app logic ---

app.delete('/api/notifications/pending/:appointmentId', (req, res) => {
  try {
    db.prepare("DELETE FROM notifications WHERE appointmentId = ? AND status = 'pending'").run(req.params.appointmentId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete pending notifications' });
  }
});

// --- Helper Functions for Settings Notification Generation ---

function calculateAlertDate(appointmentDateStr: string): string {
  if (!appointmentDateStr) return '';
  const [year, month, day] = appointmentDateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseTemplate(template: string, data: any): string {
  if (!template) return '';
  let result = template;
  result = result.replace(/{nombre}/g, data.nombre || '');
  result = result.replace(/{servicio}/g, 'consulta de fisioterapia');
  result = result.replace(/{fecha}/g, data.fecha || '');
  result = result.replace(/{hora}/g, data.hora || '');
  result = result.replace(/{duracion}/g, String(data.duracion || 0));
  result = result.replace(/{telefono}/g, data.telefono || '');
  result = result.replace(/{email}/g, data.email || '');
  result = result.replace(/{profesional}/g, data.profesional || '');
  result = result.replace(/{professional}/g, data.professional || '');
  return result;
}

function getSettings(): any {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings: any = {};
  rows.forEach((row: any) => {
    settings[row.key] = row.value;
  });
  settings.notificationEnabled = settings.notificationEnabled === 'true';
  settings.defaultDuration = Number(settings.defaultDuration || 30);
  settings.dispatcherHour = settings.dispatcherHour || '09:00';
  return settings;
}

function syncNotificationsForAppointment(apptId: string) {
  try {
    // Delete previous pending notifications
    db.prepare("DELETE FROM notifications WHERE appointmentId = ? AND status = 'pending'").run(apptId);

    const appt: any = db.prepare("SELECT * FROM appointments WHERE id = ?").get(apptId);
    if (!appt) return;

    const settings = getSettings();
    if (!settings.notificationEnabled || appt.notificationEnabled !== 1 || appt.status !== 'scheduled') {
      return;
    }

    const alertDate = calculateAlertDate(appt.date);
    const compilePayload = {
      nombre: appt.clientName,
      servicio: appt.service,
      fecha: appt.date,
      hora: appt.time,
      duracion: appt.duration,
      telefono: appt.clientPhone,
      email: appt.clientEmail,
      profesional: appt.professional || '',
      professional: appt.professional || ''
    };

    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, appointmentId, clientName, type, recipient, subject, content, scheduledForDate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    insertNotif.run(
      `whatsapp-${appt.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appt.id,
      appt.clientName,
      'whatsapp',
      appt.clientPhone || 'Móvil no registrado',
      null,
      parseTemplate(settings.smsTemplate, compilePayload),
      alertDate
    );
  } catch (error) {
    console.error(`Error syncing notifications for appointment ${apptId}:`, error);
  }
}

function syncAllPendingNotifications() {
  try {
    console.log("Startup: Recalculating all pending notifications...");
    // Clear all existing pending notifications
    db.prepare("DELETE FROM notifications WHERE status = 'pending'").run();

    const settings = getSettings();
    if (!settings.notificationEnabled) {
      console.log("Startup sync: Notifications are globally disabled.");
      return;
    }

    const appointments = db.prepare("SELECT * FROM appointments WHERE status = 'scheduled'").all();
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, appointmentId, clientName, type, recipient, subject, content, scheduledForDate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    appointments.forEach((appt: any) => {
      if (appt.notificationEnabled !== 1) {
        return;
      }

      const alertDate = calculateAlertDate(appt.date);
      const compilePayload = {
        nombre: appt.clientName,
        servicio: appt.service,
        fecha: appt.date,
        hora: appt.time,
        duracion: appt.duration,
        telefono: appt.clientPhone,
        email: appt.clientEmail,
        profesional: appt.professional || '',
        professional: appt.professional || ''
      };

      insertNotif.run(
        `whatsapp-${appt.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appt.id,
        appt.clientName,
        'whatsapp',
        appt.clientPhone || 'Móvil no registrado',
        null,
        parseTemplate(settings.smsTemplate, compilePayload),
        alertDate
      );
    });

    console.log(`Startup sync completed. Re-scheduled notifications for ${appointments.length} appointments.`);
  } catch (error) {
    console.error("Startup sync error:", error);
  }
}

// --- Settings API ---

app.get('/api/settings', (req, res) => {
  try {
    res.json(getSettings());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const settings = req.body;
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('notificationEnabled', settings.notificationEnabled ? 'true' : 'false');
    stmt.run('notificationType', 'whatsapp');
    stmt.run('smsTemplate', settings.smsTemplate);
    stmt.run('emailSubject', '');
    stmt.run('emailTemplate', '');
    stmt.run('dateFormat', settings.dateFormat || 'YYYY-MM-DD');
    stmt.run('defaultDuration', String(settings.defaultDuration || 30));
    stmt.run('defaultStatus', settings.defaultStatus || 'scheduled');
    stmt.run('defaultNotificationType', settings.defaultNotificationType || 'whatsapp');
    stmt.run('dispatcherHour', settings.dispatcherHour || '09:00');
    stmt.run('professionals', settings.professionals || '[]');

    // Regenerate all pending notifications for scheduled appointments
    db.prepare("DELETE FROM notifications WHERE status = 'pending'").run();

    if (settings.notificationEnabled) {
      const appointments = db.prepare("SELECT * FROM appointments WHERE status = 'scheduled'").all();
      const insertNotif = db.prepare(`
        INSERT INTO notifications (id, appointmentId, clientName, type, recipient, subject, content, scheduledForDate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `);

      appointments.forEach((appt: any) => {
        const alertDate = calculateAlertDate(appt.date);
        const compilePayload = {
          nombre: appt.clientName,
          servicio: appt.service,
          fecha: appt.date,
          hora: appt.time,
          duracion: appt.duration,
          telefono: appt.clientPhone,
          email: appt.clientEmail
        };

        insertNotif.run(
          `whatsapp-${appt.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          appt.id,
          appt.clientName,
          'whatsapp',
          appt.clientPhone || 'Móvil no registrado',
          null,
          parseTemplate(settings.smsTemplate, compilePayload),
          alertDate
        );
      });
    }

    addLog('Configuración Actualizada', 'Se modificó la configuración general del sistema.');
    res.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- WhatsApp API Webhooks (Interactive Buttons) ---

app.get('/api/webhook/whatsapp', (req, res) => {
  // Meta verification challenge
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/api/webhook/whatsapp', (req, res) => {
  try {
    const body = req.body;
    
    // Simulate parsing Meta WhatsApp Cloud API Interactive Message Response
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.value?.messages) {
            change.value.messages.forEach((msg: any) => {
              if (msg.type === 'interactive') {
                const buttonPayload = msg.interactive.button_reply?.id;
                
                // buttonPayload format could be "CONFIRM_APPT_<id>" or "CANCEL_APPT_<id>"
                if (buttonPayload && typeof buttonPayload === 'string') {
                  const parts = buttonPayload.split('_');
                  const action = parts[0]; // CONFIRM or CANCEL
                  const apptId = parts.slice(2).join('_'); // Rejoin the rest as ID
                  
                  if (apptId) {
                    const newStatus = action === 'CONFIRM' ? 'confirmed' : 'cancelled';
                    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(newStatus, apptId);
                    syncNotificationsForAppointment(apptId);
                    const appt: any = db.prepare('SELECT clientName FROM appointments WHERE id = ?').get(apptId);
                    addLog('Confirmación Webhook', `Cita de ${appt ? appt.clientName : apptId} marcada como ${newStatus} vía WhatsApp.`);
                    console.log(`Webhook updated appointment ${apptId} to ${newStatus}`);
                  }
                }
              }
            });
          }
        });
      });
    }

    // Process openwa button response webhook
    let openwaButtonPayload = null;
    if (body.type === 'buttons_response' && body.selectedButtonId) {
      openwaButtonPayload = body.selectedButtonId;
    } else if (body.data?.type === 'buttons_response' && body.data?.selectedButtonId) {
      openwaButtonPayload = body.data.selectedButtonId;
    } else if (body.event === 'onMessage' && body.data?.type === 'buttons_response' && body.data?.selectedButtonId) {
      openwaButtonPayload = body.data.selectedButtonId;
    }

    if (openwaButtonPayload && typeof openwaButtonPayload === 'string') {
      const parts = openwaButtonPayload.split('_');
      const action = parts[0]; // CONFIRM or CANCEL
      const apptId = parts.slice(2).join('_'); // Rejoin the rest as ID
      
      if (apptId) {
        const newStatus = action === 'CONFIRM' ? 'confirmed' : 'cancelled';
        db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(newStatus, apptId);
        syncNotificationsForAppointment(apptId);
        const appt: any = db.prepare('SELECT clientName FROM appointments WHERE id = ?').get(apptId);
        addLog('Confirmación Webhook', `Cita de ${appt ? appt.clientName : apptId} marcada como ${newStatus} vía WhatsApp (OpenWA).`);
        console.log(`OpenWA Webhook updated appointment ${apptId} to ${newStatus}`);
      }
    }

    // For custom simulation if they hit this directly:
    if (body.action && body.appointmentId) {
      const newStatus = body.action === 'CONFIRM' ? 'confirmed' : 'cancelled';
      db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(newStatus, body.appointmentId);
      syncNotificationsForAppointment(body.appointmentId);
      const appt: any = db.prepare('SELECT clientName FROM appointments WHERE id = ?').get(body.appointmentId);
      addLog('Confirmación Webhook', `Cita de ${appt ? appt.clientName : body.appointmentId} marcada como ${newStatus} vía WhatsApp (Simulación).`);
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Webhook Error', error);
    res.sendStatus(500);
  }
});



// --- Logs API ---

app.get('/api/logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100').all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.delete('/api/logs', (req, res) => {
  try {
    db.prepare('DELETE FROM logs').run();
    addLog('Historial Borrado', 'Se eliminaron todos los registros de actividad.');
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// Serve static frontend files in production
const staticPath = path.join(__dirname, '..', 'dist');
app.use(express.static(staticPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Run sync of all pending notifications on startup
syncAllPendingNotifications();

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
