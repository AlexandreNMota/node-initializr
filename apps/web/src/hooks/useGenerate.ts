import { useState } from 'react';

import type { GenerateConfig } from '@node-initializr/shared';

type UseGenerateResult = {
  isLoading: boolean;
  error: string | null;
  generate: (config: GenerateConfig) => Promise<void>;
};

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

const GENERIC_ERROR_MESSAGE = 'Nao foi possivel gerar o projeto.';

export function useGenerate(): UseGenerateResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(config: GenerateConfig): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse;

        setError(payload.error?.message ?? GENERIC_ERROR_MESSAGE);
        return;
      }

      const blob = await response.blob();
      const filename = `${config.name}.zip`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = filename;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(url);
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    error,
    generate,
  };
}
