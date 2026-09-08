import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const DATA_FILE_PATH = path.join(process.cwd(), 'data_store.json');

// Helper to load/save persistent JSON storage on backend
function loadServerData() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
      if (raw && raw.record && raw.record.materias) {
        return raw.record;
      }
      return raw;
    }
  } catch (e) {
    console.error("Error reading data store:", e);
  }
  return null;
}

function saveServerData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error("Error writing data store:", e);
    return false;
  }
}

// API Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all data
app.get("/api/data", (req, res) => {
  const data = loadServerData();
  if (!data) {
    res.status(404).json({ error: "No data found on server yet." });
  } else {
    res.json(data);
  }
});

// Save all data (Sync / Update)
app.post("/api/data", (req, res) => {
  const newData = req.body;
  if (!newData || !newData.materias) {
    return res.status(400).json({ error: "Estructura de datos inválida" });
  }
  newData.last_updated = new Date().toISOString();
  const success = saveServerData(newData);
  if (success) {
    res.json({ success: true, message: "Datos guardados y sincronizados correctamente", last_updated: newData.last_updated });
  } else {
    res.status(500).json({ error: "Error al guardar en el servidor" });
  }
});

// Admin authentication
app.post("/api/auth/login", (req, res) => {
  const { password } = req.body;
  // Default admin password or environment variable ADMIN_PASSWORD
  const adminPass = process.env.ADMIN_PASSWORD || "batan2026";
  if (password === adminPass) {
    res.json({ success: true, role: "admin", message: "Inicio de sesión de administrador exitoso" });
  } else {
    res.status(401).json({ success: false, error: "Contraseña de administrador incorrecta" });
  }
});

// Gemini AI Assistant endpoint
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en el servidor." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Eres el asistente inteligente para CPU Batán — Control de Asistencia. Analiza los siguientes datos institucionales y responde de manera clara y profesional en español argentino:\nContexto de datos: ${JSON.stringify(context || {})}\n\nPregunta/Solicitud: ${prompt}` }
          ]
        }
      ]
    });

    res.json({ answer: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Error al procesar solicitud con IA" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CPU Batán Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
