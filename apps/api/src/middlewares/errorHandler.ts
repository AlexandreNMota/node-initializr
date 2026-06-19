import type { ErrorRequestHandler } from 'express';

export type ApiError = {
  code: string;
  message: string;
};

export function formatError(error: unknown): ApiError {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return {
    code: 'GENERATION_FAILED',
    message: 'Falha ao gerar projeto.',
  };
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;

  response.status(500).json({
    error: formatError(error),
  });
};
