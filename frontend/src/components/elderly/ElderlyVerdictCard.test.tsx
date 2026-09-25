import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ChatAnalysisResponse } from '../../types';
import { ElderlyVerdictCard } from './ElderlyVerdictCard';

const analysis = (overrides: Partial<ChatAnalysisResponse>): ChatAnalysisResponse => ({
  risk_level: 'HIGH',
  risk_percentage: 92,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA: vector de ingeniería social con suplantación.',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [{ phrase: 'token', reason: 'Piden credenciales.', category: 'CREDENTIALS' }],
  wa_share_text: 'Hola, mirá esto.',
  ...overrides,
});

describe('ElderlyVerdictCard', () => {
  it('riesgo alto: veredicto de trampa y a quién suplantan', () => {
    render(<ElderlyVerdictCard analysis={analysis({})} onShareWhatsApp={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('¡Cuidado! Es una trampa para sacarte plata');
    expect(screen.getByText('Se hacen pasar por Banco Formosa.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('riesgo medio: avisa que es sospechoso, nunca que es seguro', () => {
    render(<ElderlyVerdictCard analysis={analysis({ risk_level: 'MEDIUM', detected_entity: undefined })} onShareWhatsApp={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('¡Ojo! Este mensaje es sospechoso');
    expect(screen.queryByText(/seguro/i)).not.toBeInTheDocument();
    expect(screen.getByText('Antes, consultalo con alguien de tu familia.')).toBeInTheDocument();
  });

  it('riesgo bajo: parece seguro, sin nombrar una suplantación', () => {
    render(<ElderlyVerdictCard analysis={analysis({ risk_level: 'LOW', risk_percentage: 8 })} onShareWhatsApp={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Este mensaje parece seguro');
    expect(screen.queryByText(/Se hacen pasar/)).not.toBeInTheDocument();
  });

  it('no muestra porcentajes, semáforo ni la jerga del diagnóstico técnico', () => {
    const { container } = render(<ElderlyVerdictCard analysis={analysis({})} onShareWhatsApp={vi.fn()} />);

    expect(container).not.toHaveTextContent('%');
    expect(container).not.toHaveTextContent(/ALERTA ROJA|vector|Probabilidad|Riesgo Alto/i);
    expect(screen.queryByRole('img', { name: /Semáforo/ })).not.toBeInTheDocument();
  });

  it('avisa a un familiar por WhatsApp y llama al banco en 1 toque', async () => {
    const user = userEvent.setup();
    const onShareWhatsApp = vi.fn();
    render(<ElderlyVerdictCard analysis={analysis({})} onShareWhatsApp={onShareWhatsApp} />);

    await user.click(screen.getByRole('button', { name: 'Avisar a un familiar por WhatsApp' }));
    expect(onShareWhatsApp).toHaveBeenCalledOnce();

    const call = screen.getByRole('link', { name: 'Llamar al Banco Formosa al 0800-777-2262' });
    expect(call).toHaveAttribute('href', 'tel:08007772262');
    expect(call).toHaveClass('min-h-16');
    expect(screen.getByRole('button', { name: /WhatsApp/ })).toHaveClass('min-h-16');
  });
});
