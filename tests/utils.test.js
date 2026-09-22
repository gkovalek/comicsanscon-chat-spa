import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearHistoryFromStorage,
  formatTimestamp,
  hasStoredHistory,
  loadHistoryFromStorage,
  loadThemePreference,
  mapMessagesToApiFormat,
  parseGeminiReply,
  saveHistoryToStorage,
  saveThemePreference,
} from '../src/utils.js';
import { getCharacterById } from '../src/characters.js';

beforeEach(() => {
  localStorage.clear();
});

describe('mapMessagesToApiFormat', () => {
  it('conserva el orden y solo los campos sender/text, descartando campos extra', () => {
    const input = [
      { sender: 'user', text: 'Hola', time: '10:00', id: 1 },
      { sender: 'character', text: 'Buenas tardes.', time: '10:01', id: 2 },
      { sender: 'user', text: '¿Quién sos?', time: '10:02', id: 3 },
    ];

    const result = mapMessagesToApiFormat(input);

    expect(result).toEqual([
      { sender: 'user', text: 'Hola' },
      { sender: 'character', text: 'Buenas tardes.' },
      { sender: 'user', text: '¿Quién sos?' },
    ]);
  });
});

describe('parseGeminiReply', () => {
  it('devuelve el string de reply cuando la respuesta es válida', () => {
    expect(parseGeminiReply({ reply: 'Elemental, querido Watson.' })).toBe(
      'Elemental, querido Watson.'
    );
  });

  it('lanza un error si la respuesta no tiene un campo reply string', () => {
    expect(() => parseGeminiReply({})).toThrow('Respuesta inválida del servidor.');
    expect(() => parseGeminiReply({ error: 'algo falló' })).toThrow();
    expect(() => parseGeminiReply(null)).toThrow();
  });
});

describe('historial en localStorage', () => {
  it('guarda y lee el historial de un personaje, aislado del de otros personajes', () => {
    const yogiHistory = [{ sender: 'user', text: 'Hola Yogui', time: '10:00' }];

    saveHistoryToStorage('oso-yogui', yogiHistory);

    expect(loadHistoryFromStorage('oso-yogui')).toEqual(yogiHistory);
    expect(loadHistoryFromStorage('scooby-doo')).toEqual([]);
  });

  it('borra el historial y hasStoredHistory pasa de true a false', () => {
    saveHistoryToStorage('bugs-bunny', [{ sender: 'user', text: 'Hola', time: '10:00' }]);
    expect(hasStoredHistory('bugs-bunny')).toBe(true);

    clearHistoryFromStorage('bugs-bunny');

    expect(hasStoredHistory('bugs-bunny')).toBe(false);
    expect(loadHistoryFromStorage('bugs-bunny')).toEqual([]);
  });
});

describe('preferencia de tema', () => {
  it('persiste y devuelve la preferencia guardada', () => {
    expect(loadThemePreference()).toBeNull();
    saveThemePreference('dark');
    expect(loadThemePreference()).toBe('dark');
  });
});

describe('formatTimestamp', () => {
  it('formatea la hora como HH:MM de 24hs con ceros a la izquierda', () => {
    const date = new Date(2026, 0, 1, 9, 5);
    expect(formatTimestamp(date)).toBe('09:05');
  });
});

describe('getCharacterById', () => {
  it('devuelve el personaje correcto para un id válido', () => {
    const character = getCharacterById('scooby-doo');
    expect(character?.nombre).toBe('Scooby-Doo');
  });

  it('devuelve null para un id inexistente', () => {
    expect(getCharacterById('personaje-inventado')).toBeNull();
  });
});
