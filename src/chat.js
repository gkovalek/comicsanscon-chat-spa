/**
 * Lógica de la vista de chat: fetching a la serverless function, orquestación
 * del envío de mensajes y renderizado del DOM. Las transformaciones de datos
 * puras viven en utils.js.
 */
import {
  clearHistoryFromStorage,
  formatTimestamp,
  hasStoredHistory,
  loadHistoryFromStorage,
  mapMessagesToApiFormat,
  parseGeminiReply,
  saveHistoryToStorage,
} from './utils.js';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Única función que llama a la serverless function. Fácil de mockear en tests. */
export async function fetchCharacterReply(characterId, messages) {
  const response = await fetch('/api/functions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, messages: mapMessagesToApiFormat(messages) }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo contactar al personaje. Intentá de nuevo.');
  }

  return parseGeminiReply(data);
}

/** Tarjeta de personaje reutilizada en la Home y en la galería /chat. */
export function renderCharacterCard(character) {
  const badge = hasStoredHistory(character.id)
    ? '<span class="character-card__badge">Tenés una charla guardada</span>'
    : '';
  return `
    <a class="character-card theme-${character.tema}" href="/chat/${character.id}" data-link>
      <span class="character-card__avatar" aria-hidden="true">${character.avatarEmoji}</span>
      <h3 class="character-card__name">${escapeHtml(character.nombre)}</h3>
      <p class="character-card__place">${escapeHtml(character.lugar)}</p>
      <p class="character-card__desc">${escapeHtml(character.descripcionCorta)}</p>
      ${badge}
    </a>
  `;
}

function renderMessageBubble(container, message) {
  const isUser = message.sender === 'user';
  const bubble = document.createElement('div');
  bubble.className = `message ${isUser ? 'message--user' : 'message--character'}`;
  bubble.innerHTML = `
    <p class="message__text"></p>
    <div class="message__meta">
      <span class="message__time">${escapeHtml(message.time)}</span>
      ${isUser ? '' : '<button type="button" class="message__copy" data-copy>Copiar</button>'}
    </div>
  `;
  bubble.querySelector('.message__text').textContent = message.text;
  container.appendChild(bubble);

  if (!isUser) {
    const copyBtn = bubble.querySelector('[data-copy]');
    copyBtn.addEventListener('click', () => copyToClipboard(copyBtn, message.text));
  }
  return bubble;
}

function copyToClipboard(button, text) {
  const original = button.textContent;
  const reset = (label) => {
    button.textContent = label;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1400);
  };

  if (!navigator.clipboard) {
    reset('No disponible');
    return;
  }

  button.disabled = true;
  navigator.clipboard
    .writeText(text)
    .then(() => reset('Copiado ✓'))
    .catch(() => reset('No se pudo copiar'));
}

function showTypingIndicator(container) {
  if (container.querySelector('#typing-indicator')) return;
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'message message--character message--typing';
  indicator.innerHTML =
    '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  container.appendChild(indicator);
  scrollToBottom(container);
}

function hideTypingIndicator(container) {
  container.querySelector('#typing-indicator')?.remove();
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

function renderErrorBubble(container, text) {
  const bubble = document.createElement('div');
  bubble.className = 'message message--error';
  bubble.innerHTML = '<p class="message__text"></p>';
  bubble.querySelector('.message__text').textContent = `No pudimos conectar: ${text}`;
  container.appendChild(bubble);
  scrollToBottom(container);
}

function autoResizeInput(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

function chatViewTemplate(character) {
  return `
    <section class="chat-view theme-${character.tema}">
      <header class="chat-view__header">
        <a class="chat-view__back" href="/chat" data-link>&larr; Personajes</a>
        <div class="chat-view__title">
          <span class="chat-view__avatar" aria-hidden="true">${character.avatarEmoji}</span>
          <div class="chat-view__title-text">
            <h1>${escapeHtml(character.nombre)}</h1>
            <p>${escapeHtml(character.lugar)}</p>
          </div>
        </div>
        <button type="button" class="chat-view__clear" id="clear-history">Borrar historial</button>
      </header>

      <div class="chat-view__messages" id="messages" role="log" aria-live="polite"></div>

      <form class="chat-view__form" id="chat-form">
        <textarea
          id="chat-input"
          class="chat-view__input"
          rows="1"
          placeholder="Escribile a ${escapeHtml(character.nombre)}... (Enter envía, Shift+Enter salto de línea)"
        ></textarea>
        <button type="submit" class="chat-view__send" aria-label="Enviar mensaje">Enviar</button>
      </form>
    </section>
  `;
}

/** Arma la vista de chat completa para un personaje y conecta todos los eventos. */
export function initChatView(character) {
  const app = document.getElementById('app');
  app.innerHTML = chatViewTemplate(character);

  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const clearBtn = document.getElementById('clear-history');

  let messages = loadHistoryFromStorage(character.id);
  messages.forEach((message) => renderMessageBubble(messagesEl, message));
  scrollToBottom(messagesEl);

  async function sendMessage(text) {
    const userMessage = { sender: 'user', text, time: formatTimestamp() };
    messages = [...messages, userMessage];
    renderMessageBubble(messagesEl, userMessage);
    saveHistoryToStorage(character.id, messages);
    scrollToBottom(messagesEl);

    showTypingIndicator(messagesEl);
    try {
      const reply = await fetchCharacterReply(character.id, messages);
      hideTypingIndicator(messagesEl);
      const characterMessage = { sender: 'character', text: reply, time: formatTimestamp() };
      messages = [...messages, characterMessage];
      renderMessageBubble(messagesEl, characterMessage);
      saveHistoryToStorage(character.id, messages);
      scrollToBottom(messagesEl);
    } catch (error) {
      hideTypingIndicator(messagesEl);
      renderErrorBubble(messagesEl, error.message || 'Ocurrió un error inesperado.');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    autoResizeInput(input);
    sendMessage(text);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
    // Shift+Enter no se intercepta: el textarea inserta el salto de línea nativamente.
  });

  input.addEventListener('input', () => autoResizeInput(input));

  clearBtn.addEventListener('click', () => {
    if (!messages.length) return;
    const confirmed = window.confirm(`¿Borrar toda la conversación con ${character.nombre}?`);
    if (!confirmed) return;
    clearHistoryFromStorage(character.id);
    messages = [];
    messagesEl.innerHTML = '';
  });
}
