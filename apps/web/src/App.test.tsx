import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { useConfigStore } from './store/configStore';
const generateMock = vi.fn();
vi.mock('./hooks/useGenerate', () => ({
  useGenerate: () => ({
    generate: generateMock,
    isLoading: false,
    error: null,
  }),
}));
describe('App', () => {
  beforeEach(() => {
    useConfigStore.getState().resetConfig();
    generateMock.mockReset();
  });

  it('renderiza a tela principal', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Configure your project' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'npm' })).toBeInTheDocument();
    expect(screen.getByText('File tree')).toBeInTheDocument();
  });

  it('atualiza o nome do projeto no store', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Project name'), {
      target: {
        value: 'api-produto',
      },
    });

    expect(useConfigStore.getState().config.name).toBe('api-produto');
  });

  it('mostra erro visual quando o nome e invalido', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Project name'), {
      target: {
        value: 'Projeto Invalido',
      },
    });

    expect(
      screen.getByText('Use kebab-case with lowercase letters, numbers, and hyphens.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Project name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('altera package manager ao clicar na opcao', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'pnpm' }));

    expect(useConfigStore.getState().config.packageManager).toBe('pnpm');
  });

  it('renderiza FileTree com estrutura base', () => {
    render(<App />);

    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
    expect(screen.getByText('.env.example')).toBeInTheDocument();
  });

  it('altera framework ao clicar na opcao', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Fastify/ }));

    expect(useConfigStore.getState().config.framework).toBe('fastify');
  });

  it('altera linguagem e atualiza o FileTree', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /JavaScript/ }));

    expect(useConfigStore.getState().config.language).toBe('javascript');
    expect(screen.getByText('app.js')).toBeInTheDocument();
    expect(screen.queryByText('app.ts')).not.toBeInTheDocument();
  });

  it('altera arquitetura e atualiza o FileTree', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Clean Architecture/ }));

    expect(useConfigStore.getState().config.architecture).toBe('clean');
    expect(screen.getByText('domain')).toBeInTheDocument();
    expect(screen.getByText('application')).toBeInTheDocument();
    expect(screen.getByText('infrastructure')).toBeInTheDocument();
  });

  it('desabilita ORMs quando database e none', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: /Prisma/ })).toBeDisabled();
    expect(screen.getByText('Select a database to enable ORM options.')).toBeInTheDocument();
  });

  it('altera database e orm e atualiza FileTree para prisma', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /PostgreSQL/ }));
    fireEvent.click(screen.getByRole('button', { name: /Prisma/ }));

    expect(useConfigStore.getState().config.database).toBe('postgresql');
    expect(useConfigStore.getState().config.orm).toBe('prisma');
    expect(screen.getByText('prisma')).toBeInTheDocument();
    expect(screen.getByText('schema.prisma')).toBeInTheDocument();
  });

  it('desabilita mongoose quando database nao e mongodb', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /PostgreSQL/ }));

    expect(screen.getByRole('button', { name: /Mongoose/ })).toBeDisabled();
  });

  it('desabilita drizzle quando database e mongodb', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^MongoDB/ }));

    expect(screen.getByRole('button', { name: /Drizzle/ })).toBeDisabled();
  });

  it('altera messaging ao clicar na opcao', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /RabbitMQ/ }));

    expect(useConfigStore.getState().config.messaging).toBe('rabbitmq');
  });

  it('mostra aviso quando BullMQ e selecionado sem Redis', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /BullMQ/ }));

    expect(
      screen.getByText('BullMQ requires Redis. Enable Redis in Dependencies.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Redis/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('remove aviso de BullMQ ao selecionar Redis', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /BullMQ/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Redis/ }));

    expect(useConfigStore.getState().config.dependencies).toContain('redis');
    expect(
      screen.queryByText('BullMQ requires Redis. Enable Redis in Dependencies.'),
    ).not.toBeInTheDocument();
  });

  it('altera auth ao clicar na opcao', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /^JWT/ }));

    expect(useConfigStore.getState().config.auth).toBe('jwt');
  });

  it('adiciona e remove dependency ao clicar na opcao', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Docker/ }));

    expect(useConfigStore.getState().config.dependencies).toContain('docker');

    fireEvent.click(screen.getByRole('button', { name: /Docker/ }));

    expect(useConfigStore.getState().config.dependencies).not.toContain('docker');
  });

  it('desabilita Generate quando name e invalido', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Project name'), {
      target: {
        value: 'Projeto Invalido',
      },
    });

    expect(screen.getByRole('button', { name: 'Generate & Download' })).toBeDisabled();
    expect(screen.getByText('Fix the project name before generating.')).toBeInTheDocument();
  });

  it('desabilita Generate quando ha erro de compatibilidade', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /BullMQ/ }));

    expect(screen.getByRole('button', { name: 'Generate & Download' })).toBeDisabled();
    expect(screen.getByText('Resolve compatibility issues before generating.')).toBeInTheDocument();
  });

  it('chama generate com a config atual', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Project name'), {
      target: {
        value: 'api-produto',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate & Download' }));

    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'api-produto',
      }),
    );
  });
});
