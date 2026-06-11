import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to SQLite database
const dbPath = process.env.DB_PATH || path.join(dataDir, 'citas.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      clientEmail TEXT NOT NULL,
      service TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      notes TEXT,
      notificationEnabled INTEGER NOT NULL,
      notificationType TEXT NOT NULL,
      smsTemplate TEXT,
      emailSubject TEXT,
      emailTemplate TEXT,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      appointmentId TEXT NOT NULL,
      clientName TEXT NOT NULL,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      scheduledForDate TEXT NOT NULL,
      sentAt TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Migration: Add professional column to appointments table if not exists
  try {
    db.exec("ALTER TABLE appointments ADD COLUMN professional TEXT");
    console.log("Migration: Added professional column to appointments table");
  } catch (error) {
    // Column already exists or table not yet created (though it was created above)
    console.log("Migration: professional column already exists or skipped");
  }

  // Populate default settings if missing
  const count = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='settings'").get();
  if (count) {
    const insert = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    insert.run("notificationEnabled", "true");
    insert.run("notificationType", "whatsapp");
    insert.run("smsTemplate", "Hola {nombre}, te recordamos tu cita de consulta de fisioterapia mañana día {fecha} a las {hora}. ¡Te esperamos!");
    insert.run("emailSubject", "Recordatorio de Cita - {servicio} mañana {fecha}");
    insert.run("dateFormat", "YYYY-MM-DD");
    insert.run("defaultDuration", "30");
    insert.run("defaultStatus", "scheduled");
    insert.run("defaultNotificationType", "whatsapp");
    insert.run("dispatcherHour", "09:00");
    insert.run("professionals", JSON.stringify([
      { id: "p1", name: "Dr. Carlos Mendoza", contact: "+34 611 222 333" },
      { id: "p2", name: "Dra. Alicia Silva", contact: "+34 622 333 444" }
    ]));
    insert.run("emailTemplate", `Estimado/a {nombre},

Le recordamos que se ha agendado una cita para usted:

- Área/Servicio: {servicio}
- Fecha: {fecha}
- Hora: {hora}hs
- Duración estimada: {duracion} minutos

Si necesita realizar algún cambio, cancelar o postergar su cita, por favor responda a este correo o llámenos de inmediato.

¡Muchas gracias por confiar en nosotros!
Atentamente,
Centro de Gestión de Citas`);
    console.log('Default settings verified and populated.');
  }

  console.log('Database initialized at', dbPath);
}

initDB();

export default db;
