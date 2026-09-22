import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCharacterReply } from '../src/chat.js';

beforeEach(() => {
  localStorage.clear();
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchCharacterReply', () => {
  it('llama a POST /api/functions con characterId y el historial, y devuelve el reply', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'Rooby rooby roo!' }),
    });

    const messages = [{ sender: 'user', text: 'Hola Scooby', time: '10:00' }];
    const reply = await fetchCharacterReply('scooby-doo', messages);

    expect(reply).toBe('Rooby rooby roo!');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/functions');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.characterId).toBe('scooby-doo');
    expect(body.messages).toEqual([{ sender: 'user', text: 'Hola Scooby' }]);
  });

  it('rechaza con el mensaje de error del servidor cuando la respuesta no es ok', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'Gemini no pudo procesar la solicitud.' }),
    });

    await expect(fetchCharacterReply('bugs-bunny', [])).rejects.toThrow(
      'Gemini no pudo procesar la solicitud.'
    );
  });
});
