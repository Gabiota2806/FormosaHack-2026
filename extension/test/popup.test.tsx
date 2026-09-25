// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RiskCard } from '../src/popup/components/RiskCard.js';
import { Popup } from '../src/popup/Popup.js';
import type { AnalysisStorageItem } from '../src/types/extension.js';
import { apiClient } from '../src/services/api-client.js';

// Mock de la API de Chrome
const mockChrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
};

// @ts-expect-error Mock global chrome
globalThis.chrome = mockChrome;

describe('RiskCard Component', () => {
  const highRiskItem: AnalysisStorageItem = {
    id: 'test-1',
    text: 'Banco Formosa: Ingrese su token urgente a https://bancoformosa-gestion.falsa.net',
    timestamp: Date.now(),
    status: 'analyzed',
    charCount: 75,
    isOffline: true,
    result: {
      risk_level: 'HIGH',
      risk_percentage: 95,
      detected_entity: 'Banco Formosa',
      detected_vector: 'WHATSAPP',
      summary: 'Se detectó intento de suplantación bancaria y robo de credenciales.',
      immediate_action: 'No ingreses ningún dato ni compartas tu token.',
      what_not_to_do: 'Nunca entregues códigos recibidos por SMS.',
      highlighted_phrases: [
        {
          phrase: 'urgente',
          category: 'URGENCE',
          reason: 'Presión temporal típica de phishing',
        },
        {
          phrase: 'Ingrese su token',
          category: 'CREDENTIALS',
          reason: 'Solicitud ilícita de credenciales de seguridad',
        },
      ],
      wa_share_text: 'Alerta de estafa',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente el semáforo tricolor para RIESGO ALTO', () => {
    render(<RiskCard item={highRiskItem} />);

    expect(screen.getByText('RIESGO ALTO')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Banco Formosa')).toBeInTheDocument();
    expect(screen.getByText('WHATSAPP')).toBeInTheDocument();
    expect(screen.getByText('Análisis Heurístico Local')).toBeInTheDocument();
  });

  it('desglosa las manipulaciones psicológicas detectadas y sus razones', () => {
    render(<RiskCard item={highRiskItem} />);

    expect(screen.getByText(/Manipulaciones Detectadas \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('"urgente"')).toBeInTheDocument();
    expect(screen.getByText('Presión de tiempo')).toBeInTheDocument();
    expect(screen.getByText('Presión temporal típica de phishing')).toBeInTheDocument();
    expect(screen.getByText('"Ingrese su token"')).toBeInTheDocument();
    expect(screen.getByText('Robo de claves/token')).toBeInTheDocument();
  });

  it('muestra las acciones preventivas y advertencias de qué NO hacer', () => {
    render(<RiskCard item={highRiskItem} />);

    expect(screen.getByText('No ingreses ningún dato ni compartas tu token.')).toBeInTheDocument();
    expect(screen.getByText('Nunca entregues códigos recibidos por SMS.')).toBeInTheDocument();
  });

  it('dispara la apertura del deep-link hacia el webapp al hacer clic en el botón CTA', () => {
    render(<RiskCard item={highRiskItem} />);

    const ctaButton = screen.getByRole('button', {
      name: /Abrir investigación completa en CiberGuardián/,
    });
    fireEvent.click(ctaButton);

    const expectedUrl = `http://localhost:8000/?analyze=${encodeURIComponent(highRiskItem.text)}`;
    expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: expectedUrl });
  });

  it('renderiza RIESGO MEDIO y RIESGO BAJO de forma tricolor', () => {
    const mediumItem: AnalysisStorageItem = {
      ...highRiskItem,
      result: {
        ...highRiskItem.result!,
        risk_level: 'MEDIUM',
        risk_percentage: 55,
      },
    };
    const { rerender } = render(<RiskCard item={mediumItem} />);
    expect(screen.getByText('RIESGO MEDIO')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();

    const lowItem: AnalysisStorageItem = {
      ...highRiskItem,
      result: {
        ...highRiskItem.result!,
        risk_level: 'LOW',
        risk_percentage: 10,
      },
    };
    rerender(<RiskCard item={lowItem} />);
    expect(screen.getByText('RIESGO BAJO')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });
});

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el estado vacío / standby cuando no hay análisis previo en storage', async () => {
    mockChrome.storage.local.get.mockResolvedValue({});

    render(<Popup />);

    expect(await screen.findByText('Análisis Directo de Contenido')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Banco Formosa: Se ha suspendido tu acceso/)).toBeInTheDocument();
  });

  it('muestra la RiskCard cuando storage contiene un análisis previo exitoso', async () => {
    const item: AnalysisStorageItem = {
      id: 'stored-1',
      text: 'Texto analizado previamente',
      timestamp: Date.now(),
      status: 'analyzed',
      charCount: 26,
      result: {
        risk_level: 'LOW',
        risk_percentage: 5,
        detected_entity: null,
        detected_vector: null,
        summary: 'Sin riesgo',
        immediate_action: 'Navegación segura',
        what_not_to_do: 'Ninguna restricción',
        highlighted_phrases: [],
        wa_share_text: '',
      },
    };
    mockChrome.storage.local.get.mockResolvedValue({
      ciberguardian_latest_analysis: item,
    });

    render(<Popup />);

    expect(await screen.findByText('RIESGO BAJO')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('permite analizar texto manual e invoca el pipeline de la API', async () => {
    mockChrome.storage.local.get.mockResolvedValue({});
    vi.spyOn(apiClient, 'analyzeMessage').mockResolvedValue({
      success: true,
      data: {
        risk_level: 'HIGH',
        risk_percentage: 90,
        detected_entity: 'Tarjeta Chigüé',
        detected_vector: 'SMS',
        summary: 'Estafa detectada',
        immediate_action: 'Bloquear remitente',
        what_not_to_do: 'No contestar',
        highlighted_phrases: [],
        wa_share_text: 'Alerta',
      },
    });

    render(<Popup />);

    const textarea = await screen.findByPlaceholderText(/Banco Formosa: Se ha suspendido tu acceso/);
    fireEvent.change(textarea, { target: { value: 'Tarjeta Chigüé: envíe su clave ahora' } });

    const submitBtn = screen.getByRole('button', { name: /Analizar con CiberGuardián/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('RIESGO ALTO')).toBeInTheDocument();
      expect(screen.getByText('Tarjeta Chigüé')).toBeInTheDocument();
    });

    expect(mockChrome.storage.local.set).toHaveBeenCalled();
  });
});
