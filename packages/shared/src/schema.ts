import { z } from 'zod';

export const PackageManagerSchema = z.enum(['npm', 'pnpm', 'yarn']);

export const FrameworkSchema = z.enum(['express', 'fastify', 'nestjs', 'hono']);

export const LanguageSchema = z.enum(['typescript', 'javascript']);

export const ArchitectureSchema = z.enum(['modular', 'clean', 'mvc']);

export const DatabaseSchema = z.enum(['postgresql', 'mysql', 'mongodb', 'sqlite', 'none']);

export const OrmSchema = z.enum(['prisma', 'typeorm', 'drizzle', 'mongoose', 'none']);

export const AuthSchema = z.enum(['jwt', 'clerk', 'none']);

export const MessagingSchema = z.enum(['none', 'rabbitmq', 'bullmq']);

export const DependencySchema = z.enum([
  'redis',
  'swagger',
  'jest',
  'docker',
  'github-actions',
  'eslint',
  'pino',
  'winston',
]);

export const ConfigSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome do projeto é obrigatório.')
      .max(64, 'Nome do projeto deve ter no máximo 64 caracteres.')
      .regex(/^[a-z0-9-]+$/, 'Nome do projeto deve estar em kebab-case.'),

    packageManager: PackageManagerSchema,
    framework: FrameworkSchema,
    language: LanguageSchema,
    architecture: ArchitectureSchema,
    database: DatabaseSchema,
    orm: OrmSchema,
    auth: AuthSchema,
    messaging: MessagingSchema,
    dependencies: z.array(DependencySchema),
  })
  .superRefine((config, ctx) => {
    if (config.orm !== 'none' && config.database === 'none') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orm'],
        message: 'ORM requer banco de dados.',
      });
    }

    if (config.orm === 'mongoose' && config.database !== 'mongodb') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orm'],
        message: 'Mongoose é exclusivo para MongoDB.',
      });
    }

    if (config.orm === 'drizzle' && config.database === 'mongodb') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orm'],
        message: 'Drizzle não suporta MongoDB.',
      });
    }

    if (config.messaging === 'bullmq' && !config.dependencies.includes('redis')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['messaging'],
        message: 'BullMQ requer Redis.',
      });
    }
  });
