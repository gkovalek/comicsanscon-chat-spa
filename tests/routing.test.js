import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let resolveRoute;
let navigate;

beforeAll(async () => {
  document.body.innerHTML = `
    <header>
      <nav>
        <a href="/home" data-link data-nav-link>Inicio</a>
        <a href="/chat" data-link data-nav-link>Chat</a>
        <a href="/about" data-link data-nav-link>Acerca de</a>
      </nav>
      <button id="theme-toggle" aria-pressed="false">Toggle</button>
    </header>
    <main id="app"></main>
  `;
  window.history.pushState({}, '', '/home');

  const appModule = await import('../src/app.js');
  ({ resolveRoute, navigate } = appModule);
});

beforeEach(() => {
  navigate('/home', true);
});

describe('router SPA — pushState, popstate y rutas /home, /chat, /about', () => {
  it('resolveRoute matchea las rutas obligatorias y las de personaje dentro de /chat', () => {
    expect(resolveRoute('/home')).not.toBeNull();
    expect(resolveRoute('/chat')).not.toBeNull();
    expect(resolveRoute('/about')).not.toBeNull();
    expect(resolveRoute('/chat/scooby-doo')).not.toBeNull();
    expect(resolveRoute('/esto-no-existe')).toBeNull();
  });

  it('navigate() cambia la URL con history.pushState, sin recargar la página', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');

    navigate('/chat');

    expect(window.location.pathname).toBe('/chat');
    expect(pushSpy).toHaveBeenCalledWith(expect.anything(), '', '/chat');

    pushSpy.mockRestore();
  });

  it('navegar a /home, /chat y /about renderiza la vista correspondiente (título de cada una)', () => {
    navigate('/home');
    expect(document.title).toMatch(/Chateá con tu personaje favorito/);

    navigate('/chat');
    expect(document.title).toMatch(/Elegí un personaje/);

    navigate('/about');
    expect(document.title).toMatch(/Acerca de/);
  });

  it('popstate hace que el router vuelva a resolver la ruta — comportamiento de back/forward', () => {
    navigate('/chat');
    navigate('/about');
    expect(document.title).toMatch(/Acerca de/);

    // Simula lo que hace el navegador al presionar "atrás": restaura la URL
    // anterior en el historial y dispara popstate. El router escucha ese
    // evento (window.addEventListener('popstate', router)) para volver a
    // renderizar sin que exista una recarga real de la página.
    window.history.pushState({}, '', '/chat');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(window.location.pathname).toBe('/chat');
    expect(document.title).toMatch(/Elegí un personaje/);
  });

  it('una ruta desconocida redirige a /home', () => {
    navigate('/esto-no-existe');

    expect(window.location.pathname).toBe('/home');
    expect(document.title).toMatch(/Chateá con tu personaje favorito/);
  });
});
