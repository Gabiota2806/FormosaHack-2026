import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from '../../services/api';
import type { ChatAnalysisResponse } from '../../types';
import { ChatAssistant } from './ChatAssistant';
import { ANALYSIS_ERROR_TEXT, CONTENTION, SOS_TEXT } from './scripts';

vi.mock('../../services/api', () => ({
  chatApi: { analyzeMessage: vi.fn() },
}));

const analyzeMessage = vi.mocked(chatApi.analyzeMessage);

const HIGH_RISK: ChatAnalysisResponse = {
  risk_level: 'HIGH',
  risk_percentage: 85,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA: intento de estafa.',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [{ phrase: 'token', reason: 'Piden credenciales.', category: 'CREDENTIALS' }],
  wa_share_text: 'Hola, mirá esto.',
};

const SUSPICIOUS_TEXT = 'Banco Formosa: pasame el token urgente';

describe('ChatAssistant', () => {
  beforeEach(() => {
    analyzeMessage.mockReset();
  });

  it('saluda y ofrece los 3 momentos de entrada', () => {
    render(<ChatAssistant />);

    expect(screen.getByText(/Hola, soy CiberGuardián/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizar mensaje o enlace sospechoso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Me están llamando o apurando ahora mismo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '¡Pasé mis datos o plata, auxilio!' })).toBeInTheDocument();
  });

  it('muestra la contención cuando lo están llamando en vivo', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);

    await user.click(screen.getByRole('button', { name: 'Me están llamando o apurando ahora mismo' }));

    expect(screen.getByText('Me están llamando o apurando ahora mismo.')).toBeInTheDocument();
    expect(await screen.findByText(CONTENTION.title)).toBeInTheDocument();
    expect(analyzeMessage).not.toHaveBeenCalled();
  });

  it('abre el modal SOS en el flujo de auxilio', async () => {
    const user = userEvent.setup();
    const onOpenSos = vi.fn();
    render(<ChatAssistant onOpenSos={onOpenSos} />);

    await user.click(screen.getByRole('button', { name: '¡Pasé mis datos o plata, auxilio!' }));

    expect(await screen.findByText(SOS_TEXT)).toBeInTheDocument();
    expect(onOpenSos).toHaveBeenCalledOnce();
  });

  it('analiza el mensaje al presionar Enter y muestra el semáforo', async () => {
    const user = userEvent.setup();
    analyzeMessage.mockResolvedValue(HIGH_RISK);
    render(<ChatAssistant />);

    await user.type(screen.getByLabelText('Mensaje sospechoso'), `${SUSPICIOUS_TEXT}{Enter}`);

    expect(analyzeMessage).toHaveBeenCalledWith(SUSPICIOUS_TEXT);
    expect(await screen.findByText('Riesgo Alto')).toBeInTheDocument();
    expect(screen.getByText('Probabilidad de engaño: 85%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Semáforo: Riesgo Alto' })).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje sospechoso')).toHaveValue('');
  });

  it('Shift+Enter agrega un salto de línea sin enviar', async () => {
    const user = userEvent.setup();
    render(<ChatAssistant />);

    await user.type(screen.getByLabelText('Mensaje sospechoso'), 'Hola{Shift>}{Enter}{/Shift}');

    expect(analyzeMessage).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Mensaje sospechoso')).toHaveValue('Hola\n');
  });

  it('deja una guía en el chat si el análisis falla', async () => {
    const user = userEvent.setup();
    analyzeMessage.mockRejectedValue(new Error('network'));
    render(<ChatAssistant />);

    await user.type(screen.getByLabelText('Mensaje sospechoso'), `${SUSPICIOUS_TEXT}{Enter}`);

    expect(await screen.findByText(ANALYSIS_ERROR_TEXT)).toBeInTheDocument();
  });
});
