import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { HighlightedPhrase } from '../../types';
import { HighlightedMessage } from './HighlightedMessage';

const TEXT = '¡URGENTE! Banco Formosa: pasame el token en bit.ly/x';

const PHRASES: HighlightedPhrase[] = [
  { phrase: 'banco formosa', reason: 'Se hacen pasar por el banco.', category: 'AUTHORITY' },
  { phrase: 'urgente', reason: 'Te apuran para que no pienses.', category: 'URGENCE' },
  { phrase: 'token', reason: 'Nadie te pide el token.', category: 'CREDENTIALS' },
  { phrase: 'bit.ly/x', reason: 'Enlace acortado que esconde el destino.', category: 'FAKE_LINK' },
];

describe('HighlightedMessage', () => {
  it('marca cada trampa dentro del mensaje original', () => {
    render(<HighlightedMessage text={TEXT} phrases={PHRASES} />);

    expect(screen.getByRole('button', { name: 'URGENTE: Urgencia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Banco Formosa: Se hace pasar por una entidad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'token: Te pide datos o claves' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'bit.ly/x: Enlace sospechoso' })).toBeInTheDocument();
    expect(screen.getByText('Tocá una parte marcada para ver por qué es una trampa.')).toBeInTheDocument();
  });

  it('al tocar una marca explica la trampa y al volver a tocarla se oculta', async () => {
    const user = userEvent.setup();
    render(<HighlightedMessage text={TEXT} phrases={PHRASES} />);
    const mark = screen.getByRole('button', { name: 'token: Te pide datos o claves' });

    await user.click(mark);
    expect(mark).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Nadie te pide el token.')).toBeInTheDocument();

    await user.click(mark);
    expect(mark).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('Nadie te pide el token.')).not.toBeInTheDocument();
  });

  it('se puede usar con el teclado', async () => {
    const user = userEvent.setup();
    render(<HighlightedMessage text={TEXT} phrases={PHRASES} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'URGENTE: Urgencia' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Te apuran para que no pienses.')).toBeInTheDocument();
  });

  it('muestra la leyenda de los tipos de trampa encontrados', () => {
    render(<HighlightedMessage text={TEXT} phrases={PHRASES} />);
    const legend = screen.getByRole('list', { name: 'Tipos de trampa encontrados' });
    expect(legend.children).toHaveLength(4);
  });

  it('lista aparte las trampas que no aparecen literalmente en el texto', () => {
    render(
      <HighlightedMessage
        text="Hola"
        phrases={[{ phrase: 'chigüe', reason: 'Mencionan la tarjeta.', category: 'AUTHORITY' }]}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('También detectamos')).toBeInTheDocument();
    expect(screen.getByText('Mencionan la tarjeta.')).toBeInTheDocument();
  });
});
