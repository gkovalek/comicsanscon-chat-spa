/**
 * Vercel Serverless Function — proxy seguro entre el frontend y Google Gemini.
 * Expuesta automáticamente por Vercel en /api/functions (sin extensión).
 * La API key vive solo acá, en process.env.GEMINI_API_KEY — nunca en el cliente.
 */
import { getCharacterById } from '../src/characters.js';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido.' });
    return;
  }

  const { characterId, messages } = req.body ?? {};
  const character = getCharacterById(characterId);

  if (!character) {
    res.status(400).json({ error: 'Personaje inválido.' });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'No se recibieron mensajes.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'El servidor no tiene configurada la API key de Gemini.' });
    return;
  }

  const contents = messages.map((message) => ({
    role: message.sender === 'user' ? 'user' : 'model',
    parts: [{ text: String(message.text ?? '') }],
  }));

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: character.systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.85,
          // Gemini 3 reserva por defecto la mayor parte de maxOutputTokens para "thinking"
          // interno, lo que trunca respuestas cortas de chat. La deshabilitamos: no hace
          // falta razonamiento profundo para responder en personaje.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!geminiRes.ok) {
      if (geminiRes.status === 401 || geminiRes.status === 403) {
        res.status(502).json({ error: 'La API key de Gemini es inválida o no tiene permisos.' });
        return;
      }
      if (geminiRes.status === 429) {
        res.status(429).json({ error: 'Límite de solicitudes alcanzado. Probá de nuevo en un momento.' });
        return;
      }
      res.status(502).json({ error: 'Gemini no pudo procesar la solicitud.' });
      return;
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      res.status(200).json({ reply: `${character.nombre} prefiere no responder eso ahora mismo.` });
      return;
    }

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Error de red al contactar a Gemini.' });
  }
}
