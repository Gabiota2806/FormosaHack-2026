import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Send, ShieldCheck } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Card } from './Card';
import { IconBadge } from './IconBadge';
import { cn } from './cn';

describe('cn', () => {
  it('resuelve conflictos de Tailwind dejando la última clase', () => {
    const isHidden = false;
    expect(cn('px-2 bg-white', isHidden && 'hidden', 'px-4')).toBe('bg-white px-4');
  });
});

describe('Button', () => {
  it('es type="button" por defecto para no enviar formularios sin querer', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('aplica la variante y ejecuta onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="danger" onClick={onClick}>
        Bloquear
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Bloquear' });
    expect(button).toHaveClass('bg-red-600');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('no ejecuta onClick si está deshabilitado', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('botón solo ícono accesible por aria-label', () => {
    render(<Button size="icon" icon={Send} aria-label="Enviar mensaje" />);
    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('permite sobrescribir clases y pasar atributos', () => {
    render(
      <Card tone="dark" className="rounded-3xl" role="region" aria-label="Panel">
        contenido
      </Card>,
    );

    const card = screen.getByRole('region', { name: 'Panel' });
    expect(card).toHaveClass('rounded-3xl', 'bg-slate-800/60');
    expect(card).not.toHaveClass('rounded-2xl');
  });
});

describe('IconBadge', () => {
  it('es decorativo para lectores de pantalla', () => {
    const { container } = render(<IconBadge icon={ShieldCheck} tone="danger" />);
    const badge = container.firstElementChild!;
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveClass('text-red-600');
  });
});
