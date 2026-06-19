import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import App from './App';
import { useConfigStore } from './store/configStore';

describe('App', () => {
  beforeEach(() => {
    useConfigStore.getState().resetConfig();
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
});
