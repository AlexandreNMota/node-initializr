export const VALIDATOR_MESSAGES = {
  invalidPayload: 'Payload inválido.',
  ormRequiresDatabase: 'ORM requer banco de dados.',
  mongooseRequiresMongoDb: 'Mongoose é exclusivo para MongoDB.',
  drizzleDoesNotSupportMongoDb: 'Drizzle não suporta MongoDB.',
  bullMqRequiresRedis: 'BullMQ requer Redis.',
} as const;

export const COMPATIBILITY_ERROR_MESSAGES = new Set<string>([
  VALIDATOR_MESSAGES.ormRequiresDatabase,
  VALIDATOR_MESSAGES.mongooseRequiresMongoDb,
  VALIDATOR_MESSAGES.drizzleDoesNotSupportMongoDb,
  VALIDATOR_MESSAGES.bullMqRequiresRedis,
]);
