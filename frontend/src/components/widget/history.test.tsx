import type { ReactElement, ReactNode } from 'react';
import { render as rtlRender, screen, waitFor, within, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authApi, chatApi, historyApi } from '../../services/api';
import type { ChatAnalysisResponse, ChatHistoryEntry, ChatHistoryPage } from '../../types';
import { SESSION_KEY_STORAGE, SESSION_USED_STORAGE } from '../chat/historyPreference';
import { ElderlyModeProvider } from '../elderly/ElderlyModeContext';
import { ChatHistoryView } from './ChatHistoryView';
import { ChatWidget } from './ChatWidget';
import { ChatWidgetProvider } from './ChatWidgetProvider';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../../services/api', () => ({
  chatApi: { analyzeMessage: vi.fn(), followUp: vi.fn() },
  authApi: { login: vi.fn(), getMe: vi.fn() },
  historyApi: { list: vi.fn(), getEntry: vi.fn(), deleteEntry: vi.fn(), claim: vi.fn() },
}));

const analyzeMessage = vi.mocked(chatApi.analyzeMessage);
const list = vi.mocked(historyApi.list);
const deleteEntry = vi.mocked(historyApi.deleteEntry);
const claim = vi.mocked(historyApi.claim);
const login = vi.mocked(authApi.login);
const getMe = vi.mocked(authApi.getMe);

const USER = { id: 7, name: 'Matías', email: 'mati@example.com', role: 'CITIZEN', is_totp_enabled: false };

const ANALYSIS: ChatAnalysisResponse = {
  risk_level: 'HIGH',
  risk_percentage: 90,
  detected_entity: 'Banco Formosa',
  detected_vector: 'WHATSAPP',
  summary: 'ALERTA ROJA: intento de estafa.',
  immediate_action: 'No respondas.',
  what_not_to_do: 'Nunca compartas el token.',
  highlighted_phrases: [],
  wa_share_text: '',
};

const entry = (overrides: Partial<ChatHistoryEntry> = {}): ChatHistoryEntry => ({
  id: 1,
  session_id: 1,
  user_id: 7,
  message: 'REFSA: su suministro será cortado hoy',
  risk_level: 'HIGH',
  risk_percentage: 95,
  detected_entity: 'REFSA',
  detected_vector: 'SMS',
  summary: 'Suplantación de REFSA.',
  immediate_action: 'No pagues nada.',
  what_not_to_do: 'No toques el enlace.',
  highlighted_phrases: [],
  wa_share_text: '',
  active: true,
  created_at: '2026-09-25T10:30:00Z',
  ...overrides,
});

const page = (items: ChatHistoryEntry[], overrides: Partial<ChatHistoryPage> = {}): ChatHistoryPage => ({
  items,
  total: items.length,
  page: 1,
  limit: 10,
  ...overrides,
});

function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ElderlyModeProvider>
        <ChatWidgetProvider>{children}</ChatWidgetProvider>
      </ElderlyModeProvider>
    </AuthProvider>
  );
}

const render = (ui: ReactElement, options?: RenderOptions) => rtlRender(ui, { wrapper: Providers, ...options });

/** Botón de login de prueba (TASK-048 todavía no está): usa el login real del AuthContext. */
function LoginButton() {
  const { login: doLogin } = useAuth();
  return (
    <button type="button" onClick={() => doLogin('mati@example.com', 'secreta')}>
      Login de prueba
    </button>
  );
}

const openWidget = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /Abrir asistente CiberGuardián/ }));

const analyze = async (user: ReturnType<typeof userEvent.setup>, text = 'Banco Formosa: pasame el token') => {
  await user.type(screen.getByLabelText('Mensaje sospechoso'), `${text}{Enter}`);
  await screen.findByText('ALERTA ROJA: intento de estafa.');
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  analyzeMessage.mockResolvedValue(ANALYSIS);
  login.mockResolvedValue({ access_token: 'token-123' } as Awaited<ReturnType<typeof authApi.login>>);
  getMe.mockResolvedValue(USER);
  claim.mockResolvedValue({ id: 1, session_key: 'k', user_id: 7, active: true, created_at: '' });
});

describe('ChatWidget sin cuenta: privacidad del historial anónimo', () => {
  it('avisa que guarda de forma anónima y manda la clave con el análisis', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await openWidget(user);

    expect(screen.getByText('Guardamos tus consultas de forma anónima')).toBeInTheDocument();
    await analyze(user);

    expect(analyzeMessage).toHaveBeenCalledWith('Banco Formosa: pasame el token', localStorage.getItem(SESSION_KEY_STORAGE));
    expect(localStorage.getItem(SESSION_USED_STORAGE)).toBe('1');
    expect(screen.queryByRole('button', { name: 'Mis consultas' })).not.toBeInTheDocument();
  });

  it('"No guardar" deja de mandar la clave y lo dice en el encabezado', async () => {
    const user = userEvent.setup();
    render(<ChatWidget />);
    await openWidget(user);

    const toggle = screen.getByRole('switch', { name: 'Guardar mis consultas de forma anónima' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('No guardamos tus consultas')).toBeInTheDocument();
    await analyze(user);
    expect(analyzeMessage).toHaveBeenCalledWith('Banco Formosa: pasame el token');
    expect(localStorage.getItem(SESSION_USED_STORAGE)).toBeNull();
  });
});

describe('auto-claim al iniciar sesión', () => {
  it('vincula la consulta anónima, avisa y renueva la clave', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LoginButton />
        <ChatWidget />
      </>,
    );
    await openWidget(user);
    await analyze(user);
    const anonymousKey = localStorage.getItem(SESSION_KEY_STORAGE);

    await user.click(screen.getByRole('button', { name: 'Login de prueba' }));

    await waitFor(() => expect(claim).toHaveBeenCalledExactlyOnceWith(anonymousKey));
    expect(toast.success).toHaveBeenCalledWith('Consulta guardada en tu historial personal.');
    expect(localStorage.getItem(SESSION_KEY_STORAGE)).not.toBe(anonymousKey);
    expect(screen.getByText('Tus consultas se guardan en tu historial')).toBeInTheDocument();
  });

  it('no vincula si no hubo consultas anónimas', async () => {
    const user = userEvent.setup();
    render(
      <>
        <LoginButton />
        <ChatWidget />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Login de prueba' }));

    await waitFor(() => expect(getMe).toHaveBeenCalled());
    expect(claim).not.toHaveBeenCalled();
  });

  it('abrir la app con la sesión ya iniciada no vincula nada', async () => {
    localStorage.setItem('access_token', 'token-previo');
    localStorage.setItem(SESSION_KEY_STORAGE, 'a'.repeat(32));
    localStorage.setItem(SESSION_USED_STORAGE, '1');
    render(<ChatWidget />);

    await waitFor(() => expect(getMe).toHaveBeenCalled());
    await screen.findByRole('button', { name: 'Mis consultas', hidden: true });
    expect(claim).not.toHaveBeenCalled();
  });
});

describe('"Mis consultas" con la sesión iniciada', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'token-123');
  });

  it('lista las consultas y al tocar una la muestra en el chat para seguir preguntando', async () => {
    list.mockResolvedValue(page([entry(), entry({ id: 2, risk_level: 'LOW', detected_entity: null, message: 'Hola' })]));
    const user = userEvent.setup();
    render(<ChatWidget />);
    await openWidget(user);

    await user.click(await screen.findByRole('button', { name: 'Mis consultas' }));
    const items = within(await screen.findByRole('list', { name: 'Consultas guardadas' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Riesgo alto')).toBeInTheDocument();
    expect(within(items[0]).getByText('REFSA')).toBeInTheDocument();
    expect(within(items[1]).getByText('Riesgo bajo')).toBeInTheDocument();

    await user.click(within(items[0]).getByRole('button', { name: /REFSA: su suministro será cortado hoy/ }));

    expect(screen.getByText('Suplantación de REFSA.')).toBeInTheDocument();
    expect(screen.getByLabelText('Tu pregunta sobre el mensaje')).toBeInTheDocument();
    expect(screen.getByText('Tus consultas se guardan en tu historial')).toBeInTheDocument();
  });

  it('sin consultas muestra un mensaje vacío', async () => {
    list.mockResolvedValue(page([]));
    const user = userEvent.setup();
    render(<ChatWidget />);
    await openWidget(user);

    await user.click(await screen.findByRole('button', { name: 'Mis consultas' }));

    expect(await screen.findByText('Todavía no tenés consultas guardadas.')).toBeInTheDocument();
  });

  it('"Volver al chat" conserva la conversación', async () => {
    list.mockResolvedValue(page([]));
    const user = userEvent.setup();
    render(<ChatWidget />);
    await openWidget(user);
    await analyze(user);

    await user.click(screen.getByRole('button', { name: 'Mis consultas' }));
    await user.click(await screen.findByRole('button', { name: 'Volver al chat' }));

    expect(screen.getByText('ALERTA ROJA: intento de estafa.')).toBeVisible();
  });
});

describe('ChatHistoryView', () => {
  it('borra una consulta después de confirmar', async () => {
    list.mockResolvedValue(page([entry(), entry({ id: 2, message: 'Otro mensaje' })]));
    deleteEntry.mockResolvedValue({ message: 'ok', id: 1, deleted: true });
    const user = userEvent.setup();
    rtlRender(<ChatHistoryView onBack={vi.fn()} onRestore={vi.fn()} />);
    const [first] = within(await screen.findByRole('list', { name: 'Consultas guardadas' })).getAllByRole('listitem');

    await user.click(within(first).getByRole('button', { name: /Borrar la consulta del/ }));
    const dialog = screen.getByRole('dialog', { name: 'Borrar consulta' });
    await user.click(within(dialog).getByRole('button', { name: 'Borrar' }));

    expect(deleteEntry).toHaveBeenCalledExactlyOnceWith(1);
    await waitFor(() => expect(screen.queryByText('REFSA: su suministro será cortado hoy')).not.toBeInTheDocument());
    expect(screen.getByText('Otro mensaje')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Consulta borrada de tu historial.');
  });

  it('cancelar no borra nada', async () => {
    list.mockResolvedValue(page([entry()]));
    const user = userEvent.setup();
    rtlRender(<ChatHistoryView onBack={vi.fn()} onRestore={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Borrar la consulta del/ }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteEntry).not.toHaveBeenCalled();
    expect(screen.getByText('REFSA: su suministro será cortado hoy')).toBeInTheDocument();
  });

  it('pagina con "Ver más consultas"', async () => {
    list
      .mockResolvedValueOnce(page([entry()], { total: 2 }))
      .mockResolvedValueOnce(page([entry({ id: 2, message: 'Segunda página' })], { total: 2, page: 2 }));
    const user = userEvent.setup();
    rtlRender(<ChatHistoryView onBack={vi.fn()} onRestore={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Ver más consultas' }));

    expect(await screen.findByText('Segunda página')).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith({ page: 2, limit: 10 });
    expect(screen.queryByRole('button', { name: 'Ver más consultas' })).not.toBeInTheDocument();
  });

  it('si falla la carga, permite reintentar', async () => {
    list.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(page([entry()]));
    const user = userEvent.setup();
    rtlRender(<ChatHistoryView onBack={vi.fn()} onRestore={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('REFSA: su suministro será cortado hoy')).toBeInTheDocument();
  });
});
