import { z } from 'zod';

import {
  ArchitectureSchema,
  AuthSchema,
  ConfigSchema,
  DatabaseSchema,
  DependencySchema,
  FrameworkSchema,
  LanguageSchema,
  MessagingSchema,
  OrmSchema,
  PackageManagerSchema,
} from './schema.ts';

export type PackageManager = z.infer<typeof PackageManagerSchema>;
export type FrameworkId = z.infer<typeof FrameworkSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type ArchitectureId = z.infer<typeof ArchitectureSchema>;
export type DatabaseId = z.infer<typeof DatabaseSchema>;
export type OrmId = z.infer<typeof OrmSchema>;
export type AuthId = z.infer<typeof AuthSchema>;
export type MessagingId = z.infer<typeof MessagingSchema>;
export type DependencyId = z.infer<typeof DependencySchema>;

export type GenerateConfig = z.infer<typeof ConfigSchema>;

export type ValidationError = {
  code: string;
  message: string;
  field?: string;
  details?: {
    field: string;
    message: string;
  }[];
};
