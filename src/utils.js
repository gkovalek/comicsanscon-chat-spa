/**
 * Funciones puras de transformación de datos, parseo y persistencia (localStorage).
 * Sin dependencias del DOM: son las que se testean directamente con Vitest.
 */

const HISTORY_PREFIX = 'chat_history_';
const THEME_KEY = 'theme';

/** Normaliza los mensajes en memoria al formato mínimo que espera la API. */
export function mapMessagesToApiFormat(messages) {
  return messages.map((message) => ({
    sender: message.sender,
    text: message.text,
  }));
}

/** Extrae el texto de respuesta de la serverless function; lanza si la forma es inválida. */
export function parseGeminiReply(responseJson) {
  if (!responseJson || typeof responseJson.reply !== 'string') {
    throw new Error('Respuesta inválida del servidor.');
  }
  return responseJson.reply;
}

function historyKey(characterId) {
  return `${HISTORY_PREFIX}${characterId}`;
}

export function saveHistoryToStorage(characterId, messages) {
  localStorage.setItem(historyKey(characterId), JSON.stringify(messages));
}

export function loadHistoryFromStorage(characterId) {
  const raw = localStorage.getItem(historyKey(characterId));
  return raw ? JSON.parse(raw) : [];
}

export function clearHistoryFromStorage(characterId) {
  localStorage.removeItem(historyKey(characterId));
}

export function hasStoredHistory(characterId) {
  return localStorage.getItem(historyKey(characterId)) !== null;
}

export function saveThemePreference(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadThemePreference() {
  return localStorage.getItem(THEME_KEY);
}

/** Formatea una fecha como hora corta de 24hs, ej. "14:32". */
export function formatTimestamp(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
