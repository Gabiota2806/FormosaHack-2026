import { describe, expect, it, vi } from 'vitest';
import { SHARED_MESSAGE_MAX_LENGTH, clearShareParams, readSharedMessage } from './shareTarget';

describe('readSharedMessage', () => {
  it('devuelve null si no se compartió nada', () => {
    expect(readSharedMessage('')).toBeNull();
    expect(readSharedMessage('?text=%20%20')).toBeNull();
    expect(readSharedMessage('?utm_source=x')).toBeNull();
  });

  it('usa el texto tal como lo manda WhatsApp', () => {
    const search = `?text=${encodeURIComponent('Tu cuenta fue bloqueada. Ingresá a https://bancoformosa-gestion.online')}`;
    expect(readSharedMessage(search)).toEqual({
      text: 'Tu cuenta fue bloqueada. Ingresá a https://bancoformosa-gestion.online',
      truncated: false,
    });
  });

  it('agrega título y link cuando llegan aparte, sin duplicarlos', () => {
    const params = new URLSearchParams({
      title: 'Aviso importante',
      text: 'Confirmá tus datos acá',
      url: 'https://anses-bono2026.site',
    });
    expect(readSharedMessage(`?${params}`)?.text).toBe(
      'Aviso importante\nConfirmá tus datos acá\nhttps://anses-bono2026.site',
    );

    const repeated = new URLSearchParams({
      text: 'Mirá esto https://anses-bono2026.site',
      url: 'https://anses-bono2026.site',
    });
    expect(readSharedMessage(`?${repeated}`)?.text).toBe('Mirá esto https://anses-bono2026.site');
  });

  it('corta los mensajes más largos que el límite del backend y lo indica', () => {
    const shared = readSharedMessage(`?text=${'a'.repeat(SHARED_MESSAGE_MAX_LENGTH + 50)}`);
    expect(shared?.text).toHaveLength(SHARED_MESSAGE_MAX_LENGTH);
    expect(shared?.truncated).toBe(true);
  });
});

describe('clearShareParams', () => {
  it('saca solo los parámetros compartidos y conserva el resto de la URL', () => {
    const replaceState = vi.fn();
    const location = { href: 'https://ciberguardian.app/?text=hola&title=t&url=u&ref=pwa#chat' } as Location;
    const history = { state: { a: 1 }, replaceState } as unknown as History;

    clearShareParams(location, history);

    expect(replaceState).toHaveBeenCalledWith({ a: 1 }, '', '/?ref=pwa#chat');
  });
});
