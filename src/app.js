/**
 * Router SPA con History API + vistas Home/About/Galería/Chat.
 * navigate/router/resolveRoute se exportan para poder testearlos directamente.
 */
import { CHARACTERS, getCharacterById } from './characters.js';
import { initChatView, renderCharacterCard } from './chat.js';
import { loadThemePreference, saveThemePreference } from './utils.js';

const SITE_NAME = 'Cartoon-Vintage';

function appEl() {
  return document.getElementById('app');
}

const routes = [
  { pattern: /^\/$/, handler: () => navigate('/home', true) },
  { pattern: /^\/home\/?$/, handler: renderHome },
  { pattern: /^\/about\/?$/, handler: renderAbout },
  { pattern: /^\/chat\/?$/, handler: renderGallery },
  { pattern: /^\/chat\/([a-z0-9-]+)\/?$/, handler: (match) => renderChatRoute(match[1]) },
];

/** Devuelve la definición de ruta que matchea `path`, o null si no hay ninguna. */
export function resolveRoute(path) {
  return routes.find((route) => route.pattern.test(path)) ?? null;
}

/** Resuelve la ruta actual (location.pathname) y renderiza la vista correspondiente. */
export function router() {
  const path = window.location.pathname;
  const route = resolveRoute(path);

  if (!route) {
    navigate('/home', true);
    return;
  }

  updateActiveNav(path);
  route.handler(route.pattern.exec(path));
}

/** Cambia de ruta usando History API (sin recargar la página) y vuelve a renderizar. */
export function navigate(path, replace = false) {
  const samePath = window.location.pathname === path;

  if (replace) {
    window.history.replaceState({}, '', path);
  } else if (!samePath) {
    window.history.pushState({}, '', path);
  }

  router();
}

function updateActiveNav(path) {
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href');
    const isActive = href === path || (href === '/chat' && path.startsWith('/chat'));
    link.classList.toggle('is-active', isActive);
  });
}

function renderHome() {
  document.title = `${SITE_NAME} · Chateá con tu personaje favorito`;
  const protagonist = CHARACTERS[0];
  appEl().innerHTML = `
    <section class="scene theme-${protagonist.tema}" aria-labelledby="home-scene-title">
      <div class="scene__backdrop" aria-hidden="true">
        <span class="scene__sun"></span>
        <span class="cloud cloud--a"></span>
        <span class="cloud cloud--b"></span>
        <span class="tree tree--a"></span>
        <span class="tree tree--b"></span>
        <span class="tree tree--c"></span>
        <span class="scene__blanket"></span>
      </div>

      <div class="scene__sign">
        <p class="scene__eyebrow">Cartoon-Vintage · prueba de concepto</p>
        <h1 id="home-scene-title" class="scene__title">Chateá con tu<br />personaje favorito.</h1>
        <p class="scene__lead">
          Una conversación real, con la voz de siempre. Elegí a Yogui, Scooby-Doo o Bugs Bunny
          y contales lo que se te ocurra.
        </p>
        <a class="scene__cta" href="/chat" data-link>Elegir personaje <span aria-hidden="true">→</span></a>
      </div>

      <div class="scene__figure figure-slot" aria-hidden="true">
        <img
          src="${protagonist.imagen}"
          alt=""
          class="scene__figure-img"
          onerror="this.parentElement.classList.add('is-placeholder'); this.remove()"
        />
      </div>
    </section>

    <section class="cast">
      <p class="cast__eyebrow">El elenco</p>
      <h2 class="cast__title">Elegí con quién hablar</h2>
      <div class="cast__grid">
        ${CHARACTERS.map(renderCharacterCard).join('')}
      </div>
    </section>
  `;
}

function renderAbout() {
  document.title = `Acerca de · ${SITE_NAME}`;
  appEl().innerHTML = `
    <section class="about">
      <p class="about__eyebrow">Acerca del proyecto</p>
      <h1 class="about__title">Una prueba de concepto de Cartoon-Vintage</h1>
      <p class="about__paragraph">
        <strong>${SITE_NAME}</strong> es una agencia digital (ficticia) especializada en experiencias
        interactivas para fans de videojuegos, películas y series. Esta aplicación es una prueba de
        concepto (POC) construida para el Proyecto Integrador del Módulo 3 de Henry: una Single Page
        Application que conecta, de forma segura, con la API de Google Gemini para simular
        conversaciones con personajes ficticios.
      </p>
      <p class="about__paragraph">
        La API key nunca viaja al navegador: cada mensaje pasa por una función serverless de Vercel que
        actúa de intermediaria con Gemini. El historial de cada personaje se guarda localmente en tu
        navegador para que puedas retomar la charla cuando quieras.
      </p>

      <h2 class="about__subtitle">Los personajes</h2>
      <ul class="about__list">
        ${CHARACTERS.map(
          (character) => `
          <li class="about__list-item">
            <span class="about__portrait figure-slot" aria-hidden="true">
              <img
                src="${character.imagen}"
                alt=""
                class="about__portrait-img"
                onerror="this.parentElement.classList.add('is-placeholder'); this.remove()"
              />
            </span>
            <div>
              <strong>${character.nombre}</strong> — ${character.descripcionCorta}
            </div>
          </li>
        `
        ).join('')}
      </ul>

      <p class="about__disclaimer">
        Oso Yogui, Scooby-Doo y Bugs Bunny pertenecen a sus respectivos titulares de derechos. Este
        proyecto es un ejercicio educativo y no comercial, realizado con fines de aprendizaje.
      </p>
    </section>
  `;
}

function renderGallery() {
  document.title = `Elegí un personaje · ${SITE_NAME}`;
  appEl().innerHTML = `
    <section class="gallery">
      <p class="gallery__eyebrow">Paso 1 de 1</p>
      <h1 class="gallery__title">¿Con quién querés hablar?</h1>
      <div class="gallery__grid">
        ${CHARACTERS.map(renderCharacterCard).join('')}
      </div>
    </section>
  `;
}

function renderChatRoute(characterId) {
  const character = getCharacterById(characterId);

  if (!character) {
    navigate('/chat', true);
    return;
  }

  document.title = `${character.nombre} · ${SITE_NAME}`;
  initChatView(character);
}

function wireNavigation() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;
    event.preventDefault();
    navigate(link.getAttribute('href'));
  });
}

function prefersDarkScheme() {
  try {
    return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  } catch {
    return false;
  }
}

function wireThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    toggle.textContent = theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
  };

  const stored = loadThemePreference();
  applyTheme(stored ?? (prefersDarkScheme() ? 'dark' : 'light'));

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveThemePreference(next);
  });
}

// Registrado a nivel de módulo: reacciona a los botones back/forward del navegador
// apenas se carga la app (y permite testear popstate sin depender de DOMContentLoaded).
window.addEventListener('popstate', router);

function init() {
  wireNavigation();
  wireThemeToggle();
  router();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
