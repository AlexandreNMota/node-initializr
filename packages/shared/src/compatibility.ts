import type { GenerateConfig, ValidationError } from './types.ts';

export type CompatibilityError = Pick<ValidationError, 'field' | 'message'>;

export function checkCompatibility(config: GenerateConfig): CompatibilityError[] {
  const errors: CompatibilityError[] = [];

  if (config.orm !== 'none' && config.database === 'none') {
    errors.push({
      field: 'orm',
      message: 'ORM requer banco de dados.',
    });
  }

  if (config.orm === 'mongoose' && config.database !== 'mongodb') {
    errors.push({
      field: 'orm',
      message: 'Mongoose é exclusivo para MongoDB.',
    });
  }

  if (config.orm === 'drizzle' && config.database === 'mongodb') {
    errors.push({
      field: 'orm',
      message: 'Drizzle não suporta MongoDB.',
    });
  }

  if (config.messaging === 'bullmq' && !config.dependencies.includes('redis')) {
    errors.push({
      field: 'messaging',
      message: 'BullMQ requer Redis.',
    });
  }

  return errors;
}
