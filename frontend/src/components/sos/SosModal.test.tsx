import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { SosModal } from './SosModal';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('SosModal & EmergencyCallsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<SosModal isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el diálogo accesible y lista de contactos de emergencia cuando isOpen es true', () => {
    render(<SosModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Protocolo de Auxilio y Contención SOS')).toBeInTheDocument();
    expect(screen.getByText('Banco Formosa (Bloqueo 24hs)')).toBeInTheDocument();
    expect(screen.getByText('0800-777-2262')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta Chigüé')).toBeInTheDocument();
    expect(screen.getByText('Red Link (Central de Bloqueos)')).toBeInTheDocument();
    expect(screen.getByText('Banelco')).toBeInTheDocument();
    expect(screen.getByText('Policía de Formosa (Delitos Informáticos)')).toBeInTheDocument();
  });

  it('los enlaces 1-tap tienen el protocolo tel: correcto', () => {
    render(<SosModal isOpen={true} onClose={vi.fn()} />);

    const callBanco = screen.getByRole('link', {
      name: 'Llamar a Banco Formosa (Bloqueo 24hs) al 0800-777-2262',
    });
    expect(callBanco).toHaveAttribute('href', 'tel:08007772262');

    const callPolicia = screen.getByRole('link', {
      name: 'Llamar a Policía de Formosa (Delitos Informáticos) al 911',
    });
    expect(callPolicia).toHaveAttribute('href', 'tel:911');
  });

  it('copia el número de teléfono al portapapeles y emite toast', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<SosModal isOpen={true} onClose={vi.fn()} />);

    const copyBtn = screen.getByRole('button', {
      name: 'Copiar número de Banco Formosa (Bloqueo 24hs)',
    });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('0800-777-2262');
    expect(toast.success).toHaveBeenCalledWith(
      'Número de Banco Formosa (Bloqueo 24hs) copiado: 0800-777-2262'
    );
  });

  it('llama a onClose al hacer click en el botón de cerrar y con Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SosModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Cerrar protocolo SOS' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('permite alternar a la pestaña Ficha de Denuncia Digital y editar los campos', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<SosModal isOpen={true} onClose={vi.fn()} />);

    const fichaTab = screen.getByRole('tab', { name: /2\. Ficha de Denuncia Digital/i });
    await user.click(fichaTab);

    expect(screen.getByText(/Completá los datos conocidos para generar una ficha estructurada/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/¿Por dónde te contactaron\?/), 'WHATSAPP');
    await user.type(screen.getByLabelText('Entidad suplantada'), 'Banco Formosa Fake');
    await user.type(screen.getByLabelText('Monto aproximado ($)'), '45.000');
    await user.click(screen.getByRole('button', { name: /Generar Ficha de Denuncia/i }));

    const preview = screen.getByLabelText(/Vista previa de la ficha DEN-\d{4}-[A-Z0-9]{4}/);
    expect(preview).toHaveTextContent('Canal de Contacto: WhatsApp');
    expect(preview).toHaveTextContent('Entidad o Institución Fingida: Banco Formosa Fake');

    const copyFichaBtn = screen.getByRole('button', { name: /Copiar Ficha de Denuncia/i });
    await user.click(copyFichaBtn);

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringMatching(/Código de Referencia: DEN-\d{4}-/));
    expect(toast.success).toHaveBeenCalledWith(
      'Ficha copiada al portapapeles. Ya podés pegarla en un documento o mensaje.'
    );
  });

  it('no genera la ficha si falta el canal y marca el campo con error', async () => {
    const user = userEvent.setup();
    render(<SosModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: /2\. Ficha de Denuncia Digital/i }));
    await user.click(screen.getByRole('button', { name: /Generar Ficha de Denuncia/i }));

    const channel = screen.getByLabelText(/¿Por dónde te contactaron\?/);
    expect(channel).toHaveAttribute('aria-invalid', 'true');
    expect(channel).toHaveFocus();
    expect(screen.getByText('Elegí por dónde te contactaron.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Copiar Ficha de Denuncia/i })).not.toBeInTheDocument();
  });

  it('conserva los datos cargados al cambiar de pestaña', async () => {
    const user = userEvent.setup();
    render(<SosModal isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: /2\. Ficha de Denuncia Digital/i }));
    await user.type(screen.getByLabelText('Teléfono del estafador'), '+54 9 370 4998877');
    await user.click(screen.getByRole('tab', { name: /1\. Llamadas 1-Tap/i }));
    await user.click(screen.getByRole('tab', { name: /2\. Ficha de Denuncia Digital/i }));

    expect(screen.getByLabelText('Teléfono del estafador')).toHaveValue('+54 9 370 4998877');
  });
});

// FH26-61: regresión de la estructura de FH26-60 (encabezado fijo + scroll interno) y accesibilidad.
describe('SosModal: estructura, scroll interno y accesibilidad (FH26-60)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Botón que abre el modal, para verificar el retorno del foco al cerrarlo. */
  function WithTrigger() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Abrir SOS
        </button>
        <SosModal isOpen={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  it('el diálogo no scrollea: es una columna flex que recorta dentro de sus esquinas', () => {
    render(<SosModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveClass('flex', 'flex-col', 'overflow-hidden', 'rounded-3xl');
    expect(dialog).not.toHaveClass('overflow-y-auto');
  });

  it('el cuerpo es el único contenedor con scroll y usa la barra sutil', () => {
    render(<SosModal isOpen={true} onClose={vi.fn()} />);
    const body = screen.getByTestId('sos-modal-body');

    expect(body).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto', 'overscroll-contain', 'scrollbar-subtle');
    expect(within(body).getByRole('tablist')).toBeInTheDocument();
  });

  it('el encabezado y la X quedan fuera del cuerpo desplazable', () => {
    render(<SosModal isOpen={true} onClose={vi.fn()} />);
    const header = screen.getByTestId('sos-modal-header');
    const body = screen.getByTestId('sos-modal-body');

    expect(header).toHaveClass('shrink-0');
    expect(body).not.toContainElement(header);
    expect(header).toContainElement(screen.getByRole('button', { name: 'Cerrar protocolo SOS' }));
    expect(header).toContainElement(screen.getByText('Protocolo de Auxilio y Contención SOS'));
  });

  it('el diálogo tiene nombre y descripción accesibles', () => {
    render(<SosModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Protocolo de Auxilio y Contención SOS' });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(/Actuá con rapidez/);
  });

  it('enfoca la X al abrir y devuelve el foco al botón que lo abrió al cerrar', async () => {
    const user = userEvent.setup();
    render(<WithTrigger />);

    const trigger = screen.getByRole('button', { name: 'Abrir SOS' });
    await user.click(trigger);
    expect(screen.getByRole('button', { name: 'Cerrar protocolo SOS' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('se cierra con Escape aun con el foco al final de la ficha', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SosModal isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole('tab', { name: /2\. Ficha de Denuncia Digital/i }));
    const generate = screen.getByRole('button', { name: /Generar Ficha de Denuncia/i });
    generate.focus();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra con un clic en el fondo, pero no con un clic dentro del diálogo', () => {
    const onClose = vi.fn();
    render(<SosModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('sos-modal-body'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bloquea el scroll de la página mientras está abierto y lo restaura al cerrar', () => {
    const { rerender } = render(<SosModal isOpen={true} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<SosModal isOpen={false} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('las pestañas mantienen sus relaciones ARIA con los paneles', async () => {
    const user = userEvent.setup();
    render(<SosModal isOpen={true} onClose={vi.fn()} />);
    const calls = screen.getByRole('tab', { name: /1\. Llamadas 1-Tap/i });
    const report = screen.getByRole('tab', { name: /2\. Ficha de Denuncia Digital/i });

    expect(calls).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', calls.getAttribute('aria-controls'));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', calls.id);

    await user.click(report);
    expect(report).toHaveAttribute('aria-selected', 'true');
    expect(calls).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', report.getAttribute('aria-controls'));
  });
});
