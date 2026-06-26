import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerateConfig } from '@node-initializr/shared';
import { triggerDownload, useGenerate } from './useGenerate';

const validConfig: GenerateConfig = {
  name: 'meu-projeto',
  packageManager: 'npm',
  framework: 'express',
  language: 'typescript',
  architecture: 'modular',
  database: 'none',
  orm: 'none',
  auth: 'none',
  messaging: 'none',
  dependencies: [],
};

describe('useGenerate - estado inicial', () => {
  it('deve iniciar sem loading e sem erro', () => {
    const { result } = renderHook(() => useGenerate());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useGenerate - sucesso', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['zip-content'], { type: 'application/zip' })),
    }) as typeof fetch;

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('deve fazer POST para /api/generate com a config', async () => {
    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate(validConfig);
    });

    expect(fetch).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validConfig),
    });
  });

  it('deve acionar download quando a API retorna zip', async () => {
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate(validConfig);
    });

    expect(anchor.href).toBe('blob:download-url');
    expect(anchor.download).toBe('meu-projeto.zip');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-url');
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(removeChild).toHaveBeenCalledWith(anchor);
  });
});

describe('useGenerate - erros', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve setar error quando a API retorna 400', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: {
          message: 'Nome do projeto deve estar em kebab-case.',
        },
      }),
    }) as typeof fetch;

    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate({
        ...validConfig,
        name: 'Projeto Invalido',
      });
    });

    expect(result.current.error).toBe('Nome do projeto deve estar em kebab-case.');
  });

  it('deve setar error generico quando a API retorna erro sem mensagem', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    }) as typeof fetch;

    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate(validConfig);
    });

    expect(result.current.error).toBe('Nao foi possivel gerar o projeto.');
  });

  it('deve setar error generico em falha de rede', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error')) as typeof fetch;

    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate(validConfig);
    });

    expect(result.current.error).toBe('Nao foi possivel gerar o projeto.');
  });

  it('deve voltar isLoading para false apos erro', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error')) as typeof fetch;

    const { result } = renderHook(() => useGenerate());

    await act(async () => {
      await result.current.generate(validConfig);
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('triggerDownload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('deve criar link temporario e acionar click', () => {
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockReturnValue(anchor);

    triggerDownload(new Blob(['zip-content'], { type: 'application/zip' }), 'meu-projeto.zip');

    expect(anchor.getAttribute('href')).toBe('blob:download-url');
    expect(anchor.download).toBe('meu-projeto.zip');
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalledWith(anchor);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-url');
  });
});
