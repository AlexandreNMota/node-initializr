import { describe, expect, it } from 'vitest';

import { formatError } from './errorHandler.js';

describe('formatError', () => {
  it('deve formatar erro interno desconhecido como GENERATION_FAILED', () => {
    const error = formatError(new Error('Template not found'));

    expect(error).toEqual({
      code: 'GENERATION_FAILED',
      message: 'Falha ao gerar projeto.',
    });
  });

  it('deve preservar code e message de erro conhecido', () => {
    const knownError = Object.assign(new Error('Payload invalido.'), {
      code: 'VALIDATION_ERROR',
    });

    const error = formatError(knownError);

    expect(error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Payload invalido.',
    });
  });

  it('deve tratar valores que nao sao Error', () => {
    const error = formatError('erro bruto');

    expect(error).toEqual({
      code: 'GENERATION_FAILED',
      message: 'Falha ao gerar projeto.',
    });
  });
});
